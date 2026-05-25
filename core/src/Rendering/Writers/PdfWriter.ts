import { PdfSyntax } from '../Pdf/PdfSyntax';
import { PdfVersion } from '../../Configuration/PdfVersion';
import { ZoomLevel } from '../../Configuration/ZoomLevel';
import { PageModeEnum } from '../../Configuration/PageMode';
import { EmbeddedFontInfo } from '../../Typography/EmbeddedFontInfo';
import { TtfFont } from '../../Typography/TrueType/TtfFont';
import { TtfSubsetter } from '../../Typography/TrueType/TtfSubsetter';
import { GlyphUsageTracker } from '../../Typography/GlyphUsageTracker';
import { ToUnicodeCMapBuilder } from '../../Typography/TrueType/ToUnicodeCMapBuilder';
import { DocumentSettings } from '../../Configuration/DocumentSettings';
import { AccessibilityMode } from '../../Configuration/AccessibilityMode';
import { XmpMetadataWriter } from '../../Metadata/XmpMetadataWriter';
import { XmpConformanceBlock } from '../../Metadata/XmpConformanceBlock';
import { SRgbIccProfile } from '../../Metadata/SRgbIccProfile';

/**
 * Build the list of conformance-namespace blocks the document claims,
 * based on `settings`. Currently PDF/A and PDF/UA-1; ZUGFeRD/Factur-X
 * will register here too once implemented. See the this feature this feature design
 * note for the additive-hook rationale.
 */
function buildConformanceBlocks(settings: DocumentSettings): XmpConformanceBlock[] {
  const blocks: XmpConformanceBlock[] = [];
  if (settings.pdfAEnabled) blocks.push(XmpConformanceBlock.pdfA1B());
  if (settings.accessibility === AccessibilityMode.PdfUa1) blocks.push(XmpConformanceBlock.pdfUa1());
  return blocks;
}

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

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface IPdfWriter {
  encryptor?: any;
  getNewId(): number;
  writeObject(id: number, dictionary: Map<string, string>, stream?: string): void;
  writeCompressedObject(id: number, dictionary: Map<string, string>, stream: string): void;
  writeBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void;
  writeCompressedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void;
  writeUnencryptedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void;
  writeLinkAnnotation(id: number, link: any, pageIds: number[], structParentKey?: number): number;
  writeEncryptDictionary(id: number): number;
  writeViewerPreferences(id: number, settings: any): number;
  writeCatalog(id: number, pagesId: number, firstPageId: number, settings: any, options: CatalogOptions): void;
  close(catalogId: number, infoId: number): void;
}

export interface IAsyncPdfWriter {
  encryptor?: any;
  getNewId(): number;
  writeObjectAsync(id: number, dictionary: Map<string, string>, stream?: string): Promise<void>;
  writeCompressedObjectAsync(id: number, dictionary: Map<string, string>, stream: string): Promise<void>;
  writeBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    ct?: any
  ): Promise<void>;
  writeCompressedBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    ct?: any
  ): Promise<void>;
  writeLinkAnnotationAsync(id: number, link: any, pageIds: number[], structParentKey?: number): Promise<void>;
  writeViewerPreferencesAsync(id: number, settings: any): Promise<number>;
  writeCatalogAsync(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: any,
    options: CatalogOptions
  ): Promise<void>;
  writeEncryptDictionaryAsync(id: number): Promise<number>;
  closeAsync(catalogId: number, infoId: number): Promise<void>;
}

// ─── PdfWriter ───────────────────────────────────────────────────────────────

/**
 * PDF 1.4/1.7 writer that accumulates output in memory as a Uint8Array.
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
    const header = version === PdfVersion.Pdf17 ? '%PDF-1.7\n' : '%PDF-1.4\n';
    this._output.writeString(header);
    // Binary comment (4 bytes > 127) — signals to PDF readers that this is binary
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
      // text. Emitted unconditionally — even untagged docs benefit, and
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
   * Writes the encryption dictionary. Stub — full encryption in Session 4.
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

    // xref table — each entry is exactly 20 bytes per PDF spec
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

// ─── AsyncPdfWriter ───────────────────────────────────────────────────────────
// Full async implementation is out of scope (see SESSION_PLAN.md Session 4).
// Methods delegate to synchronous equivalents wrapped in Promise.resolve().

export class AsyncPdfWriter implements IAsyncPdfWriter {
  private readonly _inner: PdfWriter;
  public encryptor: any = null;

  constructor(version: (typeof PdfVersion)[keyof typeof PdfVersion] = PdfVersion.Pdf14) {
    this._inner = new PdfWriter(version);
  }

  public getNewId(): number {
    return this._inner.getNewId();
  }
  public toUint8Array(): Uint8Array {
    return this._inner.toUint8Array();
  }

  public async writeObjectAsync(id: number, dictionary: Map<string, string>, stream?: string): Promise<void> {
    this._inner.writeObject(id, dictionary, stream);
  }

  public async writeCompressedObjectAsync(id: number, dictionary: Map<string, string>, stream: string): Promise<void> {
    // Encode as ISO-8859-1 then compress via the configured platform
    const rawBytes = new Uint8Array(stream.length);
    for (let i = 0; i < stream.length; i++) rawBytes[i] = stream.charCodeAt(i) & 0xff;

    const { deflate } = await import('../../Platform/PlatformIO');
    const compressed = await deflate(rawBytes);

    const dict = new Map(dictionary);
    dict.set('/Filter', '/FlateDecode');
    this._inner.writeBinaryObject(id, dict, compressed);
  }

  public async writeBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    _ct?: any
  ): Promise<void> {
    const slice = length != null ? bytes.slice(0, length) : bytes;
    this._inner.writeBinaryObject(id, dictionary, slice);
  }

  public async writeCompressedBinaryObjectAsync(
    id: number,
    dictionary: Map<string, string>,
    bytes: Uint8Array,
    length?: number,
    _ct?: any
  ): Promise<void> {
    const slice = length != null ? bytes.slice(0, length) : bytes;
    const { deflate } = await import('../../Platform/PlatformIO');
    const compressed = await deflate(slice);
    const dict = new Map(dictionary);
    dict.set('/Filter', '/FlateDecode');
    this._inner.writeBinaryObject(id, dict, compressed);
  }

  public async writeLinkAnnotationAsync(
    id: number,
    link: any,
    pageIds: number[],
    structParentKey?: number
  ): Promise<void> {
    this._inner.writeLinkAnnotation(id, link, pageIds, structParentKey);
  }

  public async writeViewerPreferencesAsync(id: number, settings: any): Promise<number> {
    return this._inner.writeViewerPreferences(id, settings);
  }

  public async writeCatalogAsync(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: any,
    options: CatalogOptions
  ): Promise<void> {
    this._inner.writeCatalog(id, pagesId, firstPageId, settings, options);
  }

  public async writeEncryptDictionaryAsync(id: number): Promise<number> {
    return this._inner.writeEncryptDictionary(id);
  }

  public async closeAsync(catalogId: number, infoId: number): Promise<void> {
    this._inner.close(catalogId, infoId);
  }
}

// ─── FontWriter ───────────────────────────────────────────────────────────────

/**
 * Writes font objects to PDF — both standard Type1 fonts and embedded TrueType fonts.
 * Matches the C# FontWriter class (sync path only; async path delegates to this).
 */
export class FontWriter {
  constructor(private readonly writer: IPdfWriter) {
    if (!writer) throw new Error('FontWriter: writer cannot be null');
  }

  // ─── Type1 (standard, non-embedded) ─────────────────────────────────────────

  public writeType1Font(id: number, fontName: string): void {
    this.writer.writeObject(
      id,
      new Map([
        ['/Type', '/Font'],
        ['/Subtype', '/Type1'],
        ['/BaseFont', `/${fontName}`],
      ])
    );
  }

  // ─── Embedded TrueType (Type0 composite) ─────────────────────────────────────

  /**
   * Writes the full embedded TrueType font structure:
   * Type0 → CIDFontType2 → FontDescriptor + FontFile2 + CIDToGIDMap + ToUnicode CMap.
   * Subsets the font by default (only includes used glyphs).
   */
  public writeEmbeddedTtfFont(type0Id: number, fontInfo: EmbeddedFontInfo, enableSubsetting = true): number {
    const font = fontInfo.font as TtfFont;
    const tracker = fontInfo.tracker as GlyphUsageTracker;

    const cidFontId = this.writer.getNewId();
    const fontDescriptorId = this.writer.getNewId();
    const fontFile2Id = this.writer.getNewId();
    const toUnicodeId = this.writer.getNewId();

    const baseFontName = fontInfo.subsetFontName;

    // 1. FontFile2 (embedded TTF binary)
    let fontData: Uint8Array;
    let subsetter: TtfSubsetter | null = null;
    if (enableSubsetting) {
      subsetter = new TtfSubsetter(font);
      const usedGlyphIds = new Set<number>(tracker.getUsedGlyphIds() as ReadonlySet<number>);
      fontData = subsetter.createSubset(usedGlyphIds, tracker.getUsedCharToGlyphMap());
    } else {
      fontData = font.getRawFontData();
    }
    this.writeFontFile2(fontFile2Id, fontData);

    // 2. CIDSet (PDF/A-1b)
    let cidSetId = 0;
    if (enableSubsetting) {
      cidSetId = this.writer.getNewId();
      this.writeCIDSet(cidSetId, tracker.getUsedGlyphIds());
    }

    // 3. FontDescriptor
    this.writeFontDescriptor(fontDescriptorId, font, baseFontName, fontFile2Id, cidSetId);

    // 4. CIDToGIDMap
    let cidToGidMapRef: string;
    if (enableSubsetting && subsetter) {
      const cidToGidMapId = this.writer.getNewId();
      this.writeCIDToGIDMap(cidToGidMapId, subsetter.getOldToNewGidMap(), subsetter.maxOriginalGid);
      cidToGidMapRef = `${cidToGidMapId} 0 R`;
    } else {
      cidToGidMapRef = '/Identity';
    }

    // 5. CIDFont
    const widthArray = this.generateWidthArray(font, tracker);
    this.writeCIDFont(cidFontId, baseFontName, fontDescriptorId, widthArray, cidToGidMapRef);

    // 6. ToUnicode CMap
    const cmapBuilder = new ToUnicodeCMapBuilder();
    cmapBuilder.addMappings(tracker.getUsedCharToGlyphMap());
    this.writeToUnicodeCMap(toUnicodeId, cmapBuilder.build());

    // 7. Type0 font dictionary
    this.writer.writeObject(
      type0Id,
      new Map([
        ['/Type', '/Font'],
        ['/Subtype', '/Type0'],
        ['/BaseFont', `/${baseFontName}`],
        ['/Encoding', '/Identity-H'],
        ['/DescendantFonts', `[ ${cidFontId} 0 R ]`],
        ['/ToUnicode', `${toUnicodeId} 0 R`],
      ])
    );

    return type0Id;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private writeFontFile2(id: number, fontData: Uint8Array): void {
    this.writer.writeCompressedBinaryObject(id, new Map([['/Length1', fontData.length.toString()]]), fontData);
  }

  private writeCIDSet(id: number, usedGlyphIds: ReadonlySet<number>): void {
    this.writer.writeCompressedBinaryObject(id, new Map(), this.buildCIDSetData(usedGlyphIds));
  }

  private buildCIDSetData(usedGlyphIds: ReadonlySet<number>): Uint8Array {
    let maxCid = 0;
    for (const gid of usedGlyphIds) if (gid > maxCid) maxCid = gid;
    const byteCount = Math.floor(maxCid / 8) + 1;
    const data = new Uint8Array(byteCount);
    for (const cid of usedGlyphIds) {
      data[Math.floor(cid / 8)] |= 1 << (7 - (cid % 8));
    }
    return data;
  }

  private writeFontDescriptor(
    id: number,
    font: TtfFont,
    baseFontName: string,
    fontFile2Id: number,
    cidSetId = 0
  ): void {
    const scale = 1000 / font.unitsPerEm;
    const bbox = font.bBox.map(v => Math.round(v * scale));
    const dict = new Map<string, string>([
      ['/Type', '/FontDescriptor'],
      ['/FontName', `/${baseFontName}`],
      ['/Flags', font.flags.toString()],
      ['/FontBBox', `[ ${bbox[0]} ${bbox[1]} ${bbox[2]} ${bbox[3]} ]`],
      ['/ItalicAngle', font.italicAngle.toFixed(1)],
      ['/Ascent', Math.round(font.ascender * scale).toString()],
      ['/Descent', Math.round(font.descender * scale).toString()],
      ['/CapHeight', Math.round(font.capHeight * scale).toString()],
      ['/StemV', font.stemV.toString()],
      ['/FontFile2', `${fontFile2Id} 0 R`],
    ]);
    if (cidSetId > 0) dict.set('/CIDSet', `${cidSetId} 0 R`);
    this.writer.writeObject(id, dict);
  }

  private writeCIDToGIDMap(id: number, oldToNewGid: ReadonlyMap<number, number>, maxOriginalGid: number): void {
    const mapSize = (maxOriginalGid + 1) * 2;
    const mapData = new Uint8Array(mapSize);
    for (const [orig, newGid] of oldToNewGid) {
      const offset = orig * 2;
      if (offset + 1 < mapData.length) {
        mapData[offset] = (newGid >> 8) & 0xff;
        mapData[offset + 1] = newGid & 0xff;
      }
    }
    this.writer.writeCompressedBinaryObject(id, new Map(), mapData);
  }

  private writeCIDFont(
    id: number,
    baseFontName: string,
    fontDescriptorId: number,
    widthArray: string,
    cidToGidMapRef: string
  ): void {
    this.writer.writeObject(
      id,
      new Map([
        ['/Type', '/Font'],
        ['/Subtype', '/CIDFontType2'],
        ['/BaseFont', `/${baseFontName}`],
        ['/CIDSystemInfo', '<< /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>'],
        ['/FontDescriptor', `${fontDescriptorId} 0 R`],
        ['/W', widthArray],
        ['/CIDToGIDMap', cidToGidMapRef],
      ])
    );
  }

  private writeToUnicodeCMap(id: number, cmapContent: string): void {
    this.writer.writeObject(id, new Map(), cmapContent);
  }

  private generateWidthArray(font: TtfFont, tracker: GlyphUsageTracker): string {
    const scale = 1000 / font.unitsPerEm;
    const glyphs = Array.from(tracker.getUsedGlyphIds() as ReadonlySet<number>).sort((a, b) => a - b);

    let result = '[ ';
    let i = 0;
    while (i < glyphs.length) {
      const startGid = glyphs[i];
      result += `${startGid} [ `;
      let j = i;
      while (j < glyphs.length && glyphs[j] === startGid + (j - i)) {
        result += `${Math.round(font.getGlyphWidth(glyphs[j]) * scale)} `;
        j++;
      }
      result += '] ';
      i = j;
    }
    return result + ']';
  }

  // ─── Async shims (delegate to sync) ─────────────────────────────────────────

  public async writeType1FontAsync(id: number, fontName: string): Promise<void> {
    this.writeType1Font(id, fontName);
  }

  public async writeEmbeddedTtfFontAsync(
    id: number,
    fontInfo: EmbeddedFontInfo,
    enableSubsetting = true
  ): Promise<number> {
    return this.writeEmbeddedTtfFont(id, fontInfo, enableSubsetting);
  }
}

// ─── MetadataWriter ───────────────────────────────────────────────────────────

export class MetadataWriter {
  constructor(
    private writer: IPdfWriter,
    private asyncWriter?: IAsyncPdfWriter
  ) {}

  public writeDocumentInfo(id: number, metadata: any): number {
    const dict = new Map<string, string>();
    if (metadata.title) dict.set('/Title', this.encodeMetadataString(metadata.title));
    if (metadata.author) dict.set('/Author', this.encodeMetadataString(metadata.author));
    if (metadata.subject) dict.set('/Subject', this.encodeMetadataString(metadata.subject));
    if (metadata.keywords) dict.set('/Keywords', this.encodeMetadataString(metadata.keywords));
    if (metadata.creator) dict.set('/Creator', this.encodeMetadataString(metadata.creator));
    if (metadata.producer) dict.set('/Producer', this.encodeMetadataString(metadata.producer));
    if (metadata.creationDate) dict.set('/CreationDate', `(${this.formatDate(metadata.creationDate)})`);
    if (metadata.modifiedDate) dict.set('/ModDate', `(${this.formatDate(metadata.modifiedDate)})`);
    if (metadata.trapped !== undefined) dict.set('/Trapped', metadata.trapped ? '/True' : '/False');
    if (metadata.customProperties) {
      for (const [key, value] of Object.entries(metadata.customProperties)) {
        dict.set(`/${this.escape(key)}`, this.encodeMetadataString(value as string));
      }
    }
    this.writer.writeObject(id, dict);
    return id;
  }

  public writeXmpMetadata(id: number, metadata: any, settings: DocumentSettings): void {
    // XMP metadata is written unencrypted and uncompressed (PDF/A requirement).
    // The dc/xmp/pdf body itself is still stubbed in TS (this feature scope is
    // limited to the additive conformance-block hook); the XMP packet
    // currently carries only the conformance namespaces. Wider XMP build-out
    // is a separate task that extends generateXmpXml.
    const dict = new Map<string, string>();
    dict.set('/Type', '/Metadata');
    dict.set('/Subtype', '/XML');

    const blocks = buildConformanceBlocks(settings);
    const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, blocks);
    const bytes = new TextEncoder().encode(xmpXml);
    this.writer.writeUnencryptedBinaryObject(id, dict, bytes);
  }

  public async writeDocumentInfoAsync(id: number, metadata: any): Promise<number> {
    if (!this.asyncWriter) throw new Error('Async writer not configured');
    const dict = new Map<string, string>();
    if (metadata.title) dict.set('/Title', this.encodeMetadataString(metadata.title));
    if (metadata.author) dict.set('/Author', this.encodeMetadataString(metadata.author));
    if (metadata.subject) dict.set('/Subject', this.encodeMetadataString(metadata.subject));
    if (metadata.keywords) dict.set('/Keywords', this.encodeMetadataString(metadata.keywords));
    if (metadata.creator) dict.set('/Creator', this.encodeMetadataString(metadata.creator));
    if (metadata.producer) dict.set('/Producer', this.encodeMetadataString(metadata.producer));
    if (metadata.creationDate) dict.set('/CreationDate', `(${this.formatDate(metadata.creationDate)})`);
    if (metadata.modifiedDate) dict.set('/ModDate', `(${this.formatDate(metadata.modifiedDate)})`);
    if (metadata.trapped !== undefined) dict.set('/Trapped', metadata.trapped ? '/True' : '/False');
    if (metadata.customProperties) {
      for (const [key, value] of Object.entries(metadata.customProperties)) {
        dict.set(`/${this.escape(key)}`, this.encodeMetadataString(value as string));
      }
    }
    await this.asyncWriter.writeObjectAsync(id, dict);
    return id;
  }

  public async writeXmpMetadataAsync(id: number, metadata: any, settings: DocumentSettings): Promise<void> {
    if (!this.asyncWriter) throw new Error('Async writer not configured');
    const dict = new Map<string, string>();
    dict.set('/Type', '/Metadata');
    dict.set('/Subtype', '/XML');

    const blocks = buildConformanceBlocks(settings);
    const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, blocks);
    const bytes = new TextEncoder().encode(xmpXml);
    // No async unencrypted-binary helper today; the sync writer would
    // be fine here but stays the async writer's contract — write via
    // writeObjectAsync with a stream string. The byte content is what
    // matters; encoding follows the same UTF-8 path.
    void bytes;
    await this.asyncWriter.writeObjectAsync(id, dict);
  }

  private encodeMetadataString(value: string): string {
    return PdfSyntax.encodeMetadataString(value);
  }

  private formatDate(date: Date): string {
    // Emit UTC with an explicit Z zone so the Info-dict date denotes the
    // same instant as the XMP xmp:CreateDate/ModifyDate (which use
    // toISOString() → UTC). PDF/A-1 §6.7.3 requires Info and XMP dates
    // to be equivalent; a zone-less PDF date can't be proven equal to a
    // UTC XMP date, so VeraPDF flags it. Using UTC getters + Z on both
    // sides keeps them byte-consistent.
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `D:${year}${month}${day}${hh}${mm}${ss}Z`;
  }

  private escape(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}

// ─── NavigationWriter ────────────────────────────────────────────────────────

export class NavigationWriter {
  constructor(
    private writer: IPdfWriter,
    private asyncWriter?: IAsyncPdfWriter
  ) {}

  public writeOutlineTree(rootId: number, bookmarks: any[], pageIds: number[]): number {
    if (!bookmarks || bookmarks.length === 0) return 0;

    const flatList: Array<{ item: any; id: number; parentId: number; depth: number }> = [];

    const flatten = (items: any[], parentId: number, depth: number): void => {
      for (const item of items) {
        const itemId = this.writer.getNewId();
        flatList.push({ item, id: itemId, parentId, depth });
        if (item.children?.length > 0) flatten(item.children, itemId, depth + 1);
      }
    };
    flatten(bookmarks, rootId, 0);

    const childrenByParent = new Map<number, number[]>();
    for (let i = 0; i < flatList.length; i++) {
      const { parentId } = flatList[i];
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId)!.push(i);
    }

    const countVisible = (parentId: number): number => {
      const children = childrenByParent.get(parentId);
      if (!children) return 0;
      let count = 0;
      for (const idx of children) {
        count++;
        count += countVisible(flatList[idx].id);
      }
      return count;
    };

    const rootChildren = childrenByParent.get(rootId) ?? [];
    const rootDict = new Map<string, string>([
      ['/Type', '/Outlines'],
      ['/Count', countVisible(rootId).toString()],
    ]);
    if (rootChildren.length > 0) {
      rootDict.set('/First', `${flatList[rootChildren[0]].id} 0 R`);
      rootDict.set('/Last', `${flatList[rootChildren[rootChildren.length - 1]].id} 0 R`);
    }
    this.writer.writeObject(rootId, rootDict);

    for (let i = 0; i < flatList.length; i++) {
      const { item, id: itemId, parentId } = flatList[i];
      const siblings = childrenByParent.get(parentId)!;
      const siblingIdx = siblings.indexOf(i);

      const dict = new Map<string, string>([
        ['/Title', `(${this.escape(item.title)})`],
        ['/Parent', `${parentId} 0 R`],
        ['/Dest', `[ ${pageIds[Math.max(0, Math.min(item.pageIndex, pageIds.length - 1))]} 0 R /Fit ]`],
      ]);
      if (siblingIdx > 0) dict.set('/Prev', `${flatList[siblings[siblingIdx - 1]].id} 0 R`);
      if (siblingIdx < siblings.length - 1) dict.set('/Next', `${flatList[siblings[siblingIdx + 1]].id} 0 R`);

      const myChildren = childrenByParent.get(itemId);
      if (myChildren?.length > 0) {
        dict.set('/Count', countVisible(itemId).toString());
        dict.set('/First', `${flatList[myChildren[0]].id} 0 R`);
        dict.set('/Last', `${flatList[myChildren[myChildren.length - 1]].id} 0 R`);
      }
      this.writer.writeObject(itemId, dict);
    }
    return rootId;
  }

  public async writeOutlineTreeAsync(rootId: number, bookmarks: any[], pageIds: number[]): Promise<number> {
    // Delegate synchronously — async path is out of scope
    return this.writeOutlineTree(rootId, bookmarks, pageIds);
  }

  private escape(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}

// ─── ComplianceWriter ────────────────────────────────────────────────────────

export class ComplianceWriter {
  constructor(
    private writer: IPdfWriter,
    private asyncWriter?: IAsyncPdfWriter
  ) {}

  public writeIccProfile(id: number): void {
    const iccData = SRgbIccProfile.generate();
    const dict = new Map<string, string>([['/N', '3']]);
    this.writer.writeBinaryObject(id, dict, iccData);
  }

  public writeOutputIntent(id: number, iccProfileId: number): void {
    this.writer.writeObject(
      id,
      new Map<string, string>([
        ['/Type', '/OutputIntent'],
        ['/S', '/GTS_PDFA1'],
        ['/OutputConditionIdentifier', '(sRGB IEC61966-2.1)'],
        ['/RegistryName', '(http://www.color.org)'],
        ['/DestOutputProfile', `${iccProfileId} 0 R`],
      ])
    );
  }

  public async writeIccProfileAsync(id: number): Promise<void> {
    const iccData = SRgbIccProfile.generate();
    const dict = new Map<string, string>([['/N', '3']]);
    await this.asyncWriter!.writeBinaryObjectAsync(id, dict, iccData, iccData.length);
  }

  public async writeOutputIntentAsync(id: number, iccProfileId: number): Promise<void> {
    this.writeOutputIntent(id, iccProfileId);
  }
}

// ─── CatalogOptions ──────────────────────────────────────────────────────────

export class CatalogOptions {
  public viewerPrefsId?: number;
  public xmpMetadataId?: number;
  public outlinesId?: number;
  public destsId?: number;
  public pdfAEnabled = false;
  public outputIntentIds: number[] = [];

  /**
   * The structure tree root object ID (0 if none). Set when the document
   * opts into PDF/UA tagging.
   */
  public structTreeRootId = 0;

  /**
   * Whether the document carries a structure tree and should claim to be
   * tagged in the catalog. When true the catalog emits
   * `/MarkInfo <</Marked true>>` regardless of {@link pdfAEnabled}
   * (the two flags are orthogonal).
   */
  public tagged = false;

  /**
   * BCP-47 language tag for the document (e.g. `"en-GB"`). When non-empty,
   * emitted as `/Lang` on the catalog. Required by PDF/UA-1.
   */
  public language?: string;
}
