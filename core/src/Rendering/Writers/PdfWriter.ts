import { PdfSyntax } from '../Pdf/PdfSyntax';
import { PdfVersion } from '../../Configuration/PdfVersion';
import { ZoomLevel } from '../../Configuration/ZoomLevel';
import { PageModeEnum } from '../../Configuration/PageMode';
import { IPdfWriter } from './IPdfWriter';
import { CatalogOptions } from './CatalogOptions';

// ─── Encoding helper ─────────────────────────────────────────────────────────

/**
 * Encodes a string as ISO-8859-1 (Latin-1) bytes.
 * Matches WinAnsiEncoding used by standard PDF fonts:
 * characters like £ (U+00A3) encode as 0xA3, not the two-byte UTF-8 sequence.
 */
function encodeIso88591(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    bytes[i] = s.charCodeAt(i) & 0xff;
  }
  return bytes;
}

// ─── BinaryOutputStream ──────────────────────────────────────────────────────

/**
 * Accumulates binary chunks with precise byte-offset tracking.
 * Required for building the PDF xref table, which needs file-byte offsets
 * (not array indices) for every object.
 */
class BinaryOutputStream {
  private readonly chunks: Uint8Array[] = [];
  private _position = 0;

  /** Current byte offset from the start of the stream. */
  get bytePosition(): number {
    return this._position;
  }

  /** Encode string as ISO-8859-1 and append. */
  writeString(s: string): void {
    const bytes = encodeIso88591(s);
    this.chunks.push(bytes);
    this._position += bytes.length;
  }

  /** Append raw binary bytes directly. */
  writeBytes(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this._position += bytes.length;
  }

  /** Concatenate all chunks into a single Uint8Array. */
  toUint8Array(): Uint8Array {
    const result = new Uint8Array(this._position);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}

// ─── PdfWriter ───────────────────────────────────────────────────────────────

/**
 * PDF 1.4/1.7/2.0 writer that accumulates output in memory as a Uint8Array.
 * Tracks precise byte offsets for each object so the xref table is valid.
 */
export class PdfWriter implements IPdfWriter {
  private readonly _output = new BinaryOutputStream();
  /** Maps object ID → byte offset of its start in the output stream. */
  private readonly _offsets = new Map<number, number>();
  private _currentObjId = 0;
  private _encryptId = 0;
  public encryptor: any = null;

  constructor(version: (typeof PdfVersion)[keyof typeof PdfVersion] = PdfVersion.Pdf14) {
    const header =
      version === PdfVersion.Pdf20 ? '%PDF-2.0\n' : version === PdfVersion.Pdf17 ? '%PDF-1.7\n' : '%PDF-1.4\n';
    this._output.writeString(header);
    // Binary comment (4 bytes > 127) - signals to PDF readers that this is binary
    this._output.writeBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // %âãÏÓ\n
  }

  /** Returns the current accumulated output as a Uint8Array. Call after close(). */
  public toUint8Array(): Uint8Array {
    return this._output.toUint8Array();
  }

  public getNewId(): number {
    return ++this._currentObjId;
  }

  /**
   * Writes a PDF object with an optional stream body.
   * Tracks the byte offset for xref table generation.
   */
  public writeObject(id: number, dictionary: Map<string, string>, stream?: string): void {
    this._offsets.set(id, this._output.bytePosition);

    this._output.writeString(`${id} 0 obj\n<<\n`);
    for (const [key, value] of dictionary) {
      this._output.writeString(`  ${key} ${value}\n`);
    }

    if (stream != null) {
      const contentBytes = encodeIso88591(stream);
      // Encrypt if encryptor is set
      const toWrite = this.encryptor?.encryptData ? this.encryptor.encryptData(contentBytes, id) : contentBytes;
      this._output.writeString(`  /Length ${toWrite.length}\n>>\nstream\n`);
      this._output.writeBytes(toWrite);
      this._output.writeString('\nendstream\n');
    } else {
      this._output.writeString('>>\n');
    }

    this._output.writeString('endobj\n');
  }

  /**
   * Writes a PDF object whose body is already a pre-formatted PDF
   * fragment (e.g. the global Resources dict composed by
   * `PdfResourceRegistry.writeResources`).
   */
  public writeRawObject(id: number, body: string): void {
    this._offsets.set(id, this._output.bytePosition);
    this._output.writeString(`${id} 0 obj\n${body}\nendobj\n`);
  }

  /**
   * Writes a compressed content stream.
   * Currently writes uncompressed (no zlib) but correctly sets /Length.
   * Compression (FlateDecode) will be added in Session 4.
   */
  public writeCompressedObject(id: number, dictionary: Map<string, string>, stream: string): void {
    this.writeObject(id, dictionary, stream);
  }

  /**
   * Writes a PDF object with raw binary stream content (e.g. font data, images).
   */
  public writeBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    const toWrite = this.encryptor?.encryptData ? this.encryptor.encryptData(bytes, id) : bytes;

    this._offsets.set(id, this._output.bytePosition);
    this._output.writeString(`${id} 0 obj\n<<\n`);
    for (const [key, value] of dictionary) {
      this._output.writeString(`  ${key} ${value}\n`);
    }
    this._output.writeString(`  /Length ${toWrite.length}\n>>\nstream\n`);
    this._output.writeBytes(toWrite);
    this._output.writeString('\nendstream\nendobj\n');
  }

  /**
   * Writes a compressed binary object.
   * Currently delegates to writeBinaryObject (no zlib yet).
   */
  public writeCompressedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writeBinaryObject(id, dictionary, bytes);
  }

  /**
   * Writes a binary object bypassing encryption.
   * Used for XMP metadata which must not be encrypted even when encryption is active.
   */
  public writeUnencryptedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this._offsets.set(id, this._output.bytePosition);
    this._output.writeString(`${id} 0 obj\n<<\n`);
    for (const [key, value] of dictionary) {
      this._output.writeString(`  ${key} ${value}\n`);
    }
    this._output.writeString(`  /Length ${bytes.length}\n>>\nstream\n`);
    this._output.writeBytes(bytes);
    this._output.writeString('\nendstream\nendobj\n');
  }

  /**
   * Writes a link annotation object (URI or in-document GoTo).
   */
  public writeLinkAnnotation(id: number, link: any, pageIds: number[], structParentKey?: number): number {
    const dict = new Map<string, string>([
      ['/Type', '/Annot'],
      ['/Subtype', '/Link'],
      ['/Rect', link.getRectangleString ? link.getRectangleString() : '[0 0 0 0]'],
      ['/F', '4'], // Print flag (required for PDF/A-1B)
      // this feature / PDF/UA rule 7-18: /Contents must mirror the visible link
      // text. Emitted unconditionally - even untagged docs benefit, and
      // the field is a no-op for viewers that don't surface annotation
      // alt-text.
      ['/Contents', `(${PdfSyntax.escape((link.text ?? '').toString())})`],
    ]);

    if (link.targetPageIndex != null && pageIds != null && pageIds.length > 0) {
      const pageIdx = Math.max(0, Math.min(link.targetPageIndex, pageIds.length - 1));
      dict.set('/A', `<< /S /GoTo /D [${pageIds[pageIdx]} 0 R /Fit] >>`);
    } else {
      dict.set('/A', `<< /S /URI /URI (${PdfSyntax.escape(link.uri ?? '')}) >>`);
    }

    // /StructParent wires this annotation into the parent tree for
    // the reverse lookup annotation→StructElem.
    if (structParentKey != null) dict.set('/StructParent', String(structParentKey));

    this.writeObject(id, dict);
    return id;
  }

  /**
   * Writes the encryption dictionary. Stub - full encryption in Session 4.
   */
  public writeEncryptDictionary(id: number): number {
    this._encryptId = id;
    if (this.encryptor?.getEncryptDictionary) {
      const dict: Map<string, string> = this.encryptor.getEncryptDictionary();
      this.writeObject(id, dict);
      return id;
    }
    return 0;
  }

  /**
   * Writes a /ViewerPreferences dictionary if any preferences are set.
   * Returns the object ID written, or 0 if no preferences needed.
   */
  public writeViewerPreferences(id: number, settings: any): number {
    const dict = new Map<string, string>();
    if (settings.hideToolbar) dict.set('/HideToolbar', 'true');
    if (settings.hideMenubar) dict.set('/HideMenubar', 'true');
    if (settings.hideWindowUI) dict.set('/HideWindowUI', 'true');
    if (settings.fitWindow) dict.set('/FitWindow', 'true');
    if (settings.centerWindow) dict.set('/CenterWindow', 'true');
    if (settings.displayDocTitle) dict.set('/DisplayDocTitle', 'true');
    if (dict.size === 0) return 0;
    this.writeObject(id, dict);
    return id;
  }

  /**
   * Writes the PDF /Catalog object with OpenAction, PageMode, ViewerPreferences,
   * Outlines, XMP Metadata, OutputIntents, and MarkInfo as applicable.
   */
  public writeCatalog(id: number, pagesId: number, firstPageId: number, settings: any, options: CatalogOptions): void {
    const dict = new Map<string, string>([
      ['/Type', '/Catalog'],
      ['/Pages', `${pagesId} 0 R`],
      ['/OpenAction', this.getOpenActionString(firstPageId, settings)],
    ]);

    if (options?.outlinesId > 0) dict.set('/PageMode', '/UseOutlines');
    else if (settings.pageMode && settings.pageMode !== PageModeEnum.UseNone)
      dict.set('/PageMode', `/${settings.pageMode}`);

    if (options?.viewerPrefsId > 0) dict.set('/ViewerPreferences', `${options.viewerPrefsId} 0 R`);
    if (options?.outlinesId > 0) dict.set('/Outlines', `${options.outlinesId} 0 R`);
    if (options?.xmpMetadataId > 0) dict.set('/Metadata', `${options.xmpMetadataId} 0 R`);
    if (options?.outputIntentIds?.length > 0) {
      const refs = options.outputIntentIds.map(oid => `${oid} 0 R`).join(' ');
      dict.set('/OutputIntents', `[ ${refs} ]`);
    }
    // /MarkInfo whenever either PDF/A or tagging is on. Both standards
    // require /MarkInfo /Marked true; they're orthogonal flags so emitting
    // it once when either is set covers both cases.
    if (options?.pdfAEnabled || options?.tagged) dict.set('/MarkInfo', '<< /Marked true >>');

    // /StructTreeRoot when tagging is on.
    if (options?.structTreeRootId != null && options.structTreeRootId > 0) {
      dict.set('/StructTreeRoot', `${options.structTreeRootId} 0 R`);
    }

    // /Lang when the document declares a natural language. Required by
    // PDF/UA-1; useful generally for assistive tech.
    if (options?.language) {
      dict.set('/Lang', `(${PdfSyntax.escape(options.language)})`);
    }

    if (options?.destsId != null && options.destsId > 0) dict.set('/Dests', `${options.destsId} 0 R`);

    this.writeObject(id, dict);
  }

  /**
   * Finalizes the PDF: writes the xref table, trailer dictionary,
   * startxref offset, and %%EOF marker.
   */
  public close(catalogId: number, infoId: number): void {
    const xrefPos = this._output.bytePosition;

    // xref table - each entry is exactly 20 bytes per PDF spec
    let xref = `xref\n0 ${this._currentObjId + 1}\n`;
    xref += '0000000000 65535 f \n';
    for (let i = 1; i <= this._currentObjId; i++) {
      const offset = this._offsets.get(i);
      if (offset != null) {
        xref += `${offset.toString().padStart(10, '0')} 00000 n \n`;
      } else {
        // Free entry for pre-allocated but unwritten IDs
        xref += '0000000000 00000 f \n';
      }
    }
    this._output.writeString(xref);

    // Trailer dictionary
    const trailerParts: string[] = [`/Size ${this._currentObjId + 1}`, `/Root ${catalogId} 0 R`];
    if (infoId > 0) trailerParts.push(`/Info ${infoId} 0 R`);

    if (this.encryptor != null && this._encryptId > 0) {
      trailerParts.push(`/Encrypt ${this._encryptId} 0 R`);
      if (this.encryptor.getIdArray) trailerParts.push(`/ID ${this.encryptor.getIdArray()}`);
    } else {
      // Random file identifier (required for PDF/A; both entries identical for new files)
      const idBytes = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(idBytes);
      } else {
        for (let i = 0; i < 16; i++) idBytes[i] = Math.floor(Math.random() * 256);
      }
      const hexId = Array.from(idBytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');
      trailerParts.push(`/ID [<${hexId}> <${hexId}>]`);
    }

    this._output.writeString(`trailer\n<< ${trailerParts.join(' ')} >>\n`);
    this._output.writeString(`startxref\n${xrefPos}\n%%EOF`);
  }

  private getOpenActionString(firstPageId: number, settings: any): string {
    switch (settings.defaultZoom) {
      case ZoomLevel.FitPage:
        return `[ ${firstPageId} 0 R /Fit ]`;
      case ZoomLevel.FitWidth:
        return `[ ${firstPageId} 0 R /FitH 0 ]`;
      case ZoomLevel.FitHeight:
        return `[ ${firstPageId} 0 R /FitV 0 ]`;
      case ZoomLevel.Custom:
        return `[ ${firstPageId} 0 R /XYZ 0 ${settings.customZoomLevel} null ]`;
      default:
        return `[ ${firstPageId} 0 R /Fit ]`;
    }
  }
}
