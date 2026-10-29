import * as PdfKeys from '../Pdf/PdfKeys';
import { encryptPdfStrings } from '../Pdf/PdfStringEncryption';
import { PdfSyntax } from '../Pdf/PdfSyntax';
import { PdfVersion } from '../../Configuration/PdfVersion';
import { ZoomLevel } from '../../Configuration/ZoomLevel';
import { PageModeEnum } from '../../Configuration/PageMode';
import { IPdfWriter, ViewerPreferencesSettings } from './IPdfWriter';
import { CatalogOptions } from './CatalogOptions';
import type { PdfEncryptor } from '../../Security/Encryption/pdfEncryptor';
import type { DocumentSettings } from '../../Configuration/DocumentSettings';
import type { RegisteredLink } from '../RegisteredLink';
import { compressContent } from './ContentCompression';
import { encodeIso88591 } from './Iso88591';

// ─── Encoding helper ─────────────────────────────────────────────────────────

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

  private encryptObjectStrings(id: number, fragment: string): string {
    const encryptor = this.encryptor;
    return !encryptor || id === this._encryptId
      ? fragment
      : encryptPdfStrings(fragment, bytes => encryptor.encryptData(bytes, id));
  }
  public encryptor: PdfEncryptor | null = null;

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
      this._output.writeString(`  ${key} ${this.encryptObjectStrings(id, value)}\n`);
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
    this._output.writeString(`${id} 0 obj\n${this.encryptObjectStrings(id, body)}\nendobj\n`);
  }

  /**
   * Writes a content stream compressed with `/FlateDecode`.
   *
   * Content streams are the bulk of most documents and compress heavily, so
   * this is where the file size is won.
   */
  public writeCompressedObject(id: number, dictionary: Map<string, string>, stream: string): void {
    this.writeFlateStream(id, dictionary, encodeIso88591(stream));
  }

  /**
   * Writes a PDF object with raw binary stream content (e.g. font data, images).
   */
  public writeBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    const toWrite = this.encryptor?.encryptData ? this.encryptor.encryptData(bytes, id) : bytes;

    this._offsets.set(id, this._output.bytePosition);
    this._output.writeString(`${id} 0 obj\n<<\n`);
    for (const [key, value] of dictionary) {
      this._output.writeString(`  ${key} ${this.encryptObjectStrings(id, value)}\n`);
    }
    this._output.writeString(`  /Length ${toWrite.length}\n>>\nstream\n`);
    this._output.writeBytes(toWrite);
    this._output.writeString('\nendstream\nendobj\n');
  }

  /**
   * Writes a binary object compressed with `/FlateDecode` — embedded font
   * programs, CIDSets, and ToUnicode maps.
   */
  public writeCompressedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writeFlateStream(id, dictionary, bytes);
  }

  /**
   * Deflates `raw`, declares `/Filter /FlateDecode`, and writes the object.
   *
   * Order matters: PDF applies the stream filters first and encrypts the
   * *result*, so compression has to happen before the encryptor sees the bytes.
   * `/Length` therefore describes the encrypted, compressed stream, while
   * entries the caller supplied (`/Length1` on a font program, say) keep
   * describing the original data, which is what consumers expect.
   */
  private writeFlateStream(id: number, dictionary: Map<string, string>, raw: Uint8Array): void {
    this.writeDeflatedObject(id, dictionary, compressContent(raw));
  }

  /**
   * Writes a stream that is already `compressContent` output (a page compressed during layout),
   * exactly as {@link writeFlateStream} writes one it compresses itself.
   */
  public writeDeflatedObject(id: number, dictionary: Map<string, string>, compressed: Uint8Array): void {
    const toWrite = this.encryptor?.encryptData ? this.encryptor.encryptData(compressed, id) : compressed;

    this._offsets.set(id, this._output.bytePosition);
    this._output.writeString(`${id} 0 obj\n<<\n`);
    for (const [key, value] of dictionary) {
      this._output.writeString(`  ${key} ${this.encryptObjectStrings(id, value)}\n`);
    }
    this._output.writeString('  /Filter /FlateDecode\n');
    this._output.writeString(`  /Length ${toWrite.length}\n>>\nstream\n`);
    this._output.writeBytes(toWrite);
    this._output.writeString('\nendstream\nendobj\n');
  }

  /**
   * Writes a binary object bypassing encryption.
   * Used for XMP metadata when metadata encryption is explicitly disabled.
   */
  public writeUnencryptedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this._offsets.set(id, this._output.bytePosition);
    this._output.writeString(`${id} 0 obj\n<<\n`);
    for (const [key, value] of dictionary) {
      this._output.writeString(`  ${key} ${this.encryptObjectStrings(id, value)}\n`);
    }
    this._output.writeString(`  /Length ${bytes.length}\n>>\nstream\n`);
    this._output.writeBytes(bytes);
    this._output.writeString('\nendstream\nendobj\n');
  }

  /**
   * Writes a link annotation object (URI or in-document GoTo).
   */
  public writeLinkAnnotation(id: number, link: RegisteredLink, pageIds: number[], structParentKey?: number): number {
    const dict = new Map<string, string>([
      [PdfKeys.Common.Type, '/Annot'],
      [PdfKeys.Common.Subtype, '/Link'],
      [PdfKeys.Annotation.Rectangle, link.getRectangleString ? link.getRectangleString() : '[0 0 0 0]'],
      [PdfKeys.Annotation.Flags, '4'], // Print flag (required for PDF/A-1B)
      // PDF/UA rule 7-18: /Contents must mirror the visible link
      // text. Emitted unconditionally - even untagged docs benefit, and
      // the field is a no-op for viewers that don't surface annotation
      // alt-text.
      [PdfKeys.Annotation.Contents, `(${PdfSyntax.escape((link.text ?? '').toString())})`],
    ]);

    if (link.targetPageIndex != null && pageIds != null && pageIds.length > 0) {
      const pageIdx = Math.max(0, Math.min(link.targetPageIndex, pageIds.length - 1));
      dict.set(PdfKeys.Annotation.Action, `<< /S /GoTo /D [${pageIds[pageIdx]} 0 R /Fit] >>`);
    } else {
      dict.set(PdfKeys.Annotation.Action, `<< /S /URI /URI (${PdfSyntax.escape(link.uri ?? '')}) >>`);
    }

    // /StructParent wires this annotation into the parent tree for
    // the reverse lookup annotation→StructElem.
    if (structParentKey != null) dict.set(PdfKeys.Annotation.StructureParent, String(structParentKey));

    this.writeObject(id, dict);
    return id;
  }

  /** Writes the encryption dictionary configured on this writer. */
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
  public writeViewerPreferences(id: number, settings: ViewerPreferencesSettings): number {
    const dict = new Map<string, string>();
    if (settings.hideToolbar) dict.set(PdfKeys.ViewerPreferences.HideToolbar, 'true');
    if (settings.hideMenubar) dict.set(PdfKeys.ViewerPreferences.HideMenubar, 'true');
    if (settings.hideWindowUI) dict.set(PdfKeys.ViewerPreferences.HideWindowUi, 'true');
    if (settings.fitWindow) dict.set(PdfKeys.ViewerPreferences.FitWindow, 'true');
    if (settings.centerWindow) dict.set(PdfKeys.ViewerPreferences.CenterWindow, 'true');
    if (settings.displayDocTitle) dict.set(PdfKeys.ViewerPreferences.DisplayDocumentTitle, 'true');
    if (dict.size === 0) return 0;
    this.writeObject(id, dict);
    return id;
  }

  /**
   * Writes the PDF /Catalog object with OpenAction, PageMode, ViewerPreferences,
   * Outlines, XMP Metadata, OutputIntents, and MarkInfo as applicable.
   */
  public writeCatalog(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: DocumentSettings,
    options: CatalogOptions
  ): void {
    const dict = new Map<string, string>([
      [PdfKeys.Common.Type, '/Catalog'],
      [PdfKeys.Catalog.Pages, `${pagesId} 0 R`],
      [PdfKeys.Catalog.OpenAction, this.getOpenActionString(firstPageId, settings)],
    ]);

    if (options?.outlinesId) dict.set(PdfKeys.Catalog.PageMode, '/UseOutlines');
    else if (settings.pageMode && settings.pageMode !== PageModeEnum.UseNone)
      dict.set(PdfKeys.Catalog.PageMode, `/${settings.pageMode}`);

    if (options?.viewerPrefsId) dict.set(PdfKeys.Catalog.ViewerPreferences, `${options.viewerPrefsId} 0 R`);
    if (options?.outlinesId) dict.set(PdfKeys.Catalog.Outlines, `${options.outlinesId} 0 R`);
    if (options?.xmpMetadataId) dict.set(PdfKeys.Catalog.Metadata, `${options.xmpMetadataId} 0 R`);
    if (options?.outputIntentIds?.length > 0) {
      const refs = options.outputIntentIds.map(oid => `${oid} 0 R`).join(' ');
      dict.set(PdfKeys.Catalog.OutputIntents, `[ ${refs} ]`);
    }
    // /MarkInfo whenever either PDF/A or tagging is on. Both standards
    // require /MarkInfo /Marked true; they're orthogonal flags so emitting
    // it once when either is set covers both cases.
    if (options?.pdfAEnabled || options?.tagged) dict.set(PdfKeys.Catalog.MarkInfo, '<< /Marked true >>');

    // /StructTreeRoot when tagging is on.
    if (options?.structTreeRootId != null && options.structTreeRootId > 0) {
      dict.set(PdfKeys.Catalog.StructureTreeRoot, `${options.structTreeRootId} 0 R`);
    }

    // /Lang when the document declares a natural language. Required by
    // PDF/UA-1; useful generally for assistive tech.
    if (options?.language) {
      dict.set(PdfKeys.Catalog.Language, `(${PdfSyntax.escape(options.language)})`);
    }

    if (options?.destsId != null && options.destsId > 0)
      dict.set(PdfKeys.Catalog.Destinations, `${options.destsId} 0 R`);

    if (options?.pageLabelsId != null && options.pageLabelsId > 0) {
      dict.set(PdfKeys.Catalog.PageLabels, `${options.pageLabelsId} 0 R`);
    }

    // /Names /EmbeddedFiles and /AF for document attachments (PDF/A-3).
    if (options?.namesEmbeddedFilesId != null && options.namesEmbeddedFilesId > 0) {
      dict.set(PdfKeys.Catalog.Names, `<< /EmbeddedFiles ${options.namesEmbeddedFilesId} 0 R >>`);
    }
    if (options?.associatedFileIds?.length > 0) {
      const afRefs = options.associatedFileIds.map(fid => `${fid} 0 R`).join(' ');
      dict.set(PdfKeys.Catalog.AssociatedFiles, `[ ${afRefs} ]`);
    }

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

  private getOpenActionString(firstPageId: number, settings: DocumentSettings): string {
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
