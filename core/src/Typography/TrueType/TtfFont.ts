import { BigEndianReader } from '../../Rendering/Images/BigEndianReader';

/**
 * TrueType font parser for PDF embedding.
 * Parses all tables required for font embedding and text extraction.
 */
export class TtfFont {
  private readonly charToGlyph = new Map<number, number>(); // Unicode codepoint -> GID

  // Glyph data
  private readonly glyphWidths = new Map<number, number>(); // GID -> width in font units

  // Raw font data for embedding
  private readonly rawData: Uint8Array;

  // Table directory
  private readonly tables = new Map<string, { offset: number; length: number }>();
  private numberOfHMetrics = 0;

  // Kern pairs: (leftGid, rightGid) -> adjustment in font units
  private readonly kernPairs = new Map<string, number>();

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(public readonly filePath: string) {
    // In Node.js, we'd read from file system
    // For browser/agnostic, we'll accept raw data in a real implementation
    // This is a simplified version
    this.rawData = new Uint8Array(0);

    // TODO: Load font data from file path
    // This would require fs.readFileSync in Node.js
    // For now, this is a placeholder
    throw new Error('TtfFont from file path not yet implemented - use loadFromBytes instead');
  }

  /**
   * Loads a TtfFont from a file path using the platform I/O abstraction.
   * Must be called after configurePlatform() has been invoked.
   */
  public static async fromFile(path: string): Promise<TtfFont> {
    const { getPlatformIO } = await import('../../Platform/PlatformIO');
    const data = await getPlatformIO().readFile(path);
    return TtfFont.loadFromBytes(data);
  }

  /**
   * Loads a TtfFont synchronously from a file path.
   * Only works in Node.js environments — throws in browser contexts.
   */
  public static fromFileSync(filePath: string): TtfFont {
    if (typeof process === 'undefined' || !process.versions?.node) {
      throw new Error(
        'TtfFont.fromFileSync() is only available in Node.js. ' +
          'Use TtfFont.fromFile(url) with BrowserPlatformIO in browser environments.'
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs: typeof import('fs') = require('fs');
    const nodeBuffer = fs.readFileSync(filePath);
    return TtfFont.loadFromBytes(Uint8Array.from(nodeBuffer));
  }

  /**
   * Creates a TtfFont from raw font data.
   */
  public static loadFromBytes(data: Uint8Array): TtfFont {
    const font = Object.create(TtfFont.prototype) as TtfFont;
    (font as any).charToGlyph = new Map<number, number>();
    (font as any).glyphWidths = new Map<number, number>();
    (font as any).tables = new Map<string, { offset: number; length: number }>();
    (font as any).kernPairs = new Map<string, number>();
    (font as any).rawData = data;
    (font as any).filePath = '<from bytes>';
    (font as any).numberOfHMetrics = 0;
    font.postScriptName = 'Unknown';
    font.fontFamily = 'Unknown';
    font.fontSubfamily = 'Regular';
    font.unitsPerEm = 1000;
    font.ascender = 0;
    font.descender = 0;
    font.capHeight = 0;
    font.xHeight = 0;
    (font as any).bBox = [0, 0, 0, 0] as [number, number, number, number];
    font.italicAngle = 0;
    font.stemV = 80;
    font.flags = 32;
    font.numberOfGlyphs = 0;
    (font as any).parse();
    return font;
  }

  // =====================================================
  // PUBLIC PROPERTIES (from parsed tables)
  // =====================================================

  /** Path to the font file */
  public postScriptName = 'Unknown';

  /** Font family name (e.g., "Arial") */
  public fontFamily = 'Unknown';

  /** Font subfamily (e.g., "Regular", "Bold") */
  public fontSubfamily = 'Regular';

  /** Units per em (typically 1000 or 2048) */
  public unitsPerEm = 1000;

  /** Ascender in font units */
  public ascender = 0;

  /** Descender in font units (typically negative) */
  public descender = 0;

  /** Cap height in font units */
  public capHeight = 0;

  /** x-height in font units */
  public xHeight = 0;

  /** Font bounding box [xMin, yMin, xMax, yMax] */
  public readonly bBox: [number, number, number, number] = [0, 0, 0, 0];

  /** Italic angle in degrees */
  public italicAngle = 0;

  /** Stem vertical width (estimated) */
  public stemV = 80;

  /** PDF font flags */
  public flags = 32; // Nonsymbolic by default

  /** Total number of glyphs in the font */
  public numberOfGlyphs = 0;

  // =====================================================
  // PUBLIC API
  // =====================================================

  /**
   * Gets the glyph ID for a Unicode codepoint
   * @param codepoint - Unicode codepoint
   */
  public getGlyphId(codepoint: number): number {
    return this.charToGlyph.get(codepoint) ?? 0;
  }

  /**
   * Gets the glyph ID for a Unicode character (BMP convenience overload)
   * @param c - Unicode character
   */
  public getGlyphIdForChar(c: string): number {
    return this.getGlyphId(c.charCodeAt(0));
  }

  /**
   * Gets the width of a glyph in font units
   * @param glyphId - Glyph ID
   */
  public getGlyphWidth(glyphId: number): number {
    return this.glyphWidths.get(glyphId) ?? 0;
  }

  /**
   * Gets the width of a character in font units
   * @param codepoint - Unicode codepoint
   */
  public getCharWidth(codepoint: number): number {
    const gid = this.getGlyphId(codepoint);
    return this.getGlyphWidth(gid);
  }

  /**
   * Gets the width of a character in points
   * @param codepoint - Unicode codepoint
   * @param fontSize - Font size in points
   */
  public getCharWidthInPoints(codepoint: number, fontSize: number): number {
    const width = this.getCharWidth(codepoint);
    return (width / this.unitsPerEm) * fontSize;
  }

  /**
   * Gets the kerning adjustment in font units between two adjacent glyphs.
   * Returns 0 if no kerning pair exists or the font has no kern table.
   * @param leftGid - Left glyph ID
   * @param rightGid - Right glyph ID
   */
  public getKerning(leftGid: number, rightGid: number): number {
    const key = `${leftGid},${rightGid}`;
    return this.kernPairs.get(key) ?? 0;
  }

  /**
   * Returns true if this font has any kern pairs defined.
   */
  public get hasKerning(): boolean {
    return this.kernPairs.size > 0;
  }

  /**
   * Gets the raw font data for embedding
   */
  public getRawFontData(): Uint8Array {
    return this.rawData;
  }

  /**
   * Gets a copy of the codepoint to glyph mapping (supports full Unicode range)
   */
  public getCharToGlyphMap(): ReadonlyMap<number, number> {
    return this.charToGlyph;
  }

  /**
   * Gets all glyph widths (for width array generation)
   */
  public getAllGlyphWidths(): ReadonlyMap<number, number> {
    return this.glyphWidths;
  }

  // =====================================================
  // PARSING
  // =====================================================

  private parse(): void {
    const reader = new BigEndianReader(this.rawData);

    // 1. Read offset table
    const version = reader.readFixed();
    const numTables = reader.readUInt16();
    reader.skip(6); // searchRange, entrySelector, rangeShift

    // 2. Read table directory
    for (let i = 0; i < numTables; i++) {
      const tag = reader.readTag();
      const checkSum = reader.readUInt32();
      const offset = reader.readUInt32();
      const length = reader.readUInt32();
      this.tables.set(tag, { offset, length });
    }

    // 3. Verify required tables exist
    const required = ['head', 'hhea', 'hmtx', 'cmap', 'maxp'];
    for (const table of required) {
      if (!this.tables.has(table)) {
        throw new Error(`Invalid TTF: Missing required table '${table}'`);
      }
    }

    // 4. Parse tables in order
    this.parseHeadTable(reader);
    this.parseMaxpTable(reader);
    this.parseHheaTable(reader);
    this.parseHmtxTable(reader);
    this.parseCmapTable(reader);

    // Optional tables
    if (this.tables.has('name')) {
      this.parseNameTable(reader);
    }

    if (this.tables.has('OS/2')) {
      this.parseOS2Table(reader);
    }

    if (this.tables.has('post')) {
      this.parsePostTable(reader);
    }

    if (this.tables.has('kern')) {
      this.parseKernTable(reader);
    }
  }

  private parseHeadTable(reader: BigEndianReader): void {
    const info = this.tables.get('head')!;
    reader.seek(info.offset);

    reader.skip(4); // version
    reader.skip(4); // fontRevision
    reader.skip(4); // checkSumAdjustment
    reader.skip(4); // magicNumber
    reader.skip(2); // flags

    this.unitsPerEm = reader.readUInt16();

    reader.skip(8); // created
    reader.skip(8); // modified

    this.bBox[0] = reader.readInt16(); // xMin
    this.bBox[1] = reader.readInt16(); // yMin
    this.bBox[2] = reader.readInt16(); // xMax
    this.bBox[3] = reader.readInt16(); // yMax
  }

  private parseMaxpTable(reader: BigEndianReader): void {
    const info = this.tables.get('maxp')!;
    reader.seek(info.offset);

    reader.skip(4); // version
    this.numberOfGlyphs = reader.readUInt16();
  }

  private parseHheaTable(reader: BigEndianReader): void {
    const info = this.tables.get('hhea')!;
    reader.seek(info.offset);

    reader.skip(4); // version
    this.ascender = reader.readInt16();
    this.descender = reader.readInt16();
    reader.skip(2); // lineGap
    reader.skip(2); // advanceWidthMax
    reader.skip(2); // minLeftSideBearing
    reader.skip(2); // minRightSideBearing
    reader.skip(2); // xMaxExtent
    reader.skip(2); // caretSlopeRise
    reader.skip(2); // caretSlopeRun
    reader.skip(2); // caretOffset
    reader.skip(8); // reserved
    reader.skip(2); // metricDataFormat

    this.numberOfHMetrics = reader.readUInt16();
  }

  private parseHmtxTable(reader: BigEndianReader): void {
    const info = this.tables.get('hmtx')!;
    reader.seek(info.offset);

    // Read all LongHorMetric records
    let lastWidth = 0;
    for (let i = 0; i < this.numberOfHMetrics; i++) {
      const advanceWidth = reader.readUInt16();
      reader.skip(2); // leftSideBearing
      this.glyphWidths.set(i, advanceWidth);
      lastWidth = advanceWidth;
    }

    // Remaining glyphs use the last width
    for (let i = this.numberOfHMetrics; i < this.numberOfGlyphs; i++) {
      this.glyphWidths.set(i, lastWidth);
    }
  }

  private parseCmapTable(reader: BigEndianReader): void {
    const cmapStart = this.tables.get('cmap')!.offset;
    reader.seek(cmapStart);

    reader.readUInt16(); // version
    const numSubtables = reader.readUInt16();

    // Locate both subtables; we will parse both and merge results
    let format4Offset = 0;
    let format12Offset = 0;

    for (let i = 0; i < numSubtables; i++) {
      const platformId = reader.readUInt16();
      const encodingId = reader.readUInt16();
      const offset = reader.readUInt32();

      // Windows Unicode BMP (3, 1) - Format 4
      if (platformId === 3 && encodingId === 1) {
        format4Offset = cmapStart + offset;
      }
      // Windows Unicode full repertoire (3, 10) - Format 12
      else if (platformId === 3 && encodingId === 10) {
        format12Offset = cmapStart + offset;
      }
    }

    if (format4Offset === 0 && format12Offset === 0) {
      throw new Error('No supported cmap subtable found');
    }

    // Parse Format 4 first so all BMP characters (U+0000–U+FFFF) are mapped.
    // Some fonts (e.g. NotoSansSymbols2) carry a Format 12 subtable that only
    // covers supplementary-plane codepoints (U+10000+) and omits the very BMP
    // symbol blocks that Format 4 handles.  If we used Format 12 exclusively we
    // would miss those BMP entries.  Parsing Format 4 first and then overlaying
    // Format 12 gives us complete coverage for both planes.
    if (format4Offset !== 0) {
      this.parseCmapFormat4(reader, format4Offset);
    }
    // Overlay with Format 12: adds supplementary-plane entries and may
    // override any BMP entries already populated from Format 4.
    if (format12Offset !== 0) {
      this.parseCmapFormat12(reader, format12Offset);
    }
  }

  private parseCmapFormat4(reader: BigEndianReader, offset: number): void {
    reader.seek(offset);

    const format = reader.readUInt16();
    if (format !== 4) return;

    const length = reader.readUInt16();
    const language = reader.readUInt16();
    const segCountX2 = reader.readUInt16();
    const segCount = segCountX2 / 2;
    reader.skip(6); // searchRange, entrySelector, rangeShift

    const endCounts: number[] = [];
    for (let i = 0; i < segCount; i++) {
      endCounts.push(reader.readUInt16());
    }

    reader.readUInt16(); // reservedPad

    const startCounts: number[] = [];
    for (let i = 0; i < segCount; i++) {
      startCounts.push(reader.readUInt16());
    }

    const idDeltas: number[] = [];
    for (let i = 0; i < segCount; i++) {
      idDeltas.push(reader.readInt16());
    }

    const idRangeOffsetPos = reader.getPosition();
    const idRangeOffsets: number[] = [];
    for (let i = 0; i < segCount; i++) {
      idRangeOffsets.push(reader.readUInt16());
    }

    // Build char to glyph mapping
    for (let seg = 0; seg < segCount; seg++) {
      const start = startCounts[seg];
      const end = endCounts[seg];

      if (start === 0xffff) continue; // End segment

      for (let charCode = start; charCode <= end; charCode++) {
        let glyphId: number;

        if (idRangeOffsets[seg] === 0) {
          glyphId = (charCode + idDeltas[seg]) & 0xffff;
        } else {
          const glyphOffsetLoc = idRangeOffsetPos + seg * 2 + idRangeOffsets[seg] + 2 * (charCode - start);
          reader.seek(glyphOffsetLoc);
          glyphId = reader.readUInt16();
          if (glyphId !== 0) {
            glyphId = (glyphId + idDeltas[seg]) & 0xffff;
          }
        }

        if (glyphId !== 0) {
          this.charToGlyph.set(charCode, glyphId);
        }
      }
    }
  }

  private parseCmapFormat12(reader: BigEndianReader, offset: number): void {
    reader.seek(offset);

    const format = reader.readUInt16();
    if (format !== 12) return;

    reader.readUInt16(); // reserved
    const length = reader.readUInt32();
    const language = reader.readUInt32();
    const numGroups = reader.readUInt32();

    for (let i = 0; i < numGroups; i++) {
      const startCharCode = reader.readUInt32();
      const endCharCode = reader.readUInt32();
      const startGlyphId = reader.readUInt32();

      for (let charCode = startCharCode; charCode <= endCharCode; charCode++) {
        const glyphId = startGlyphId + (charCode - startCharCode);
        this.charToGlyph.set(charCode, glyphId);
      }
    }
  }

  private parseNameTable(reader: BigEndianReader): void {
    const info = this.tables.get('name')!;
    reader.seek(info.offset);

    const format = reader.readUInt16();
    const count = reader.readUInt16();
    const stringOffset = reader.readUInt16();
    const storageStart = info.offset + stringOffset;

    for (let i = 0; i < count; i++) {
      const platformId = reader.readUInt16();
      const encodingId = reader.readUInt16();
      const languageId = reader.readUInt16();
      const nameId = reader.readUInt16();
      const length = reader.readUInt16();
      const offset = reader.readUInt16();

      // We want Windows Unicode (3, 1) or Mac Roman (1, 0)
      const isWindowsUnicode = platformId === 3 && encodingId === 1;
      const isMacRoman = platformId === 1 && encodingId === 0;

      if (!isWindowsUnicode && !isMacRoman) continue;

      const currentPos = reader.getPosition();
      reader.seek(storageStart + offset);

      let value: string;
      if (isWindowsUnicode) {
        const bytes = reader.readBytes(length);
        // UTF-16 BE: each character is two consecutive bytes.
        // The Array.map approach is wrong (++i only mutates the local parameter).
        // Use an explicit two-byte step instead.
        let decoded = '';
        for (let idx = 0; idx + 1 < bytes.length; idx += 2) {
          decoded += String.fromCharCode((bytes[idx] << 8) | bytes[idx + 1]);
        }
        value = decoded;
      } else {
        const bytes = reader.readBytes(length);
        value = Array.from(bytes)
          .map(b => String.fromCharCode(b))
          .join('');
      }

      reader.seek(currentPos);

      switch (nameId) {
        case 1:
          this.fontFamily = value;
          break;
        case 2:
          this.fontSubfamily = value;
          break;
        case 6:
          this.postScriptName = value;
          break;
      }
    }

    // Fallback: generate PostScript name if not found
    if (this.postScriptName === 'Unknown') {
      this.postScriptName = this.fontFamily.replace(/\s+/g, '') + '-' + this.fontSubfamily.replace(/\s+/g, '');
    }
  }

  private parseOS2Table(reader: BigEndianReader): void {
    const info = this.tables.get('OS/2')!;
    reader.seek(info.offset);

    const version = reader.readUInt16();
    reader.skip(2); // xAvgCharWidth
    const usWeightClass = reader.readUInt16();
    const usWidthClass = reader.readUInt16();
    const fsType = reader.readUInt16();

    reader.skip(22); // subscript/superscript metrics

    reader.skip(2); // yStrikeoutSize
    reader.skip(2); // yStrikeoutPosition
    reader.skip(2); // sFamilyClass

    reader.skip(10); // panose

    reader.skip(16); // ulUnicodeRange

    reader.skip(4); // achVendID

    const fsSelection = reader.readUInt16();

    reader.skip(4); // usFirstCharIndex, usLastCharIndex

    const sTypoAscender = reader.readInt16();
    const sTypoDescender = reader.readInt16();
    const sTypoLineGap = reader.readInt16();

    reader.skip(4); // usWinAscent, usWinDescent

    // Read sCapHeight and sxHeight if version >= 2
    if (version >= 2) {
      reader.skip(8); // ulCodePageRange
      this.capHeight = reader.readInt16();
      this.xHeight = reader.readInt16();
    } else {
      // Estimate from UnitsPerEm
      this.capHeight = Math.floor(this.unitsPerEm * 0.7);
      this.xHeight = Math.floor(this.unitsPerEm * 0.5);
    }

    // Calculate StemV from weight class (rough estimate)
    this.stemV = 50 + Math.floor(usWeightClass / 10);

    // Build PDF flags
    this.flags = 0;

    // Fixed pitch (check if all widths are the same)
    const distinctWidths = new Set(this.glyphWidths.values());
    if (distinctWidths.size <= 2) {
      this.flags |= 1; // FixedPitch
    }

    // Serif (check name)
    const lowerFamily = this.fontFamily.toLowerCase();
    if (lowerFamily.includes('serif') || lowerFamily.includes('times') || lowerFamily.includes('georgia')) {
      this.flags |= 2; // Serif
    }

    // Italic
    if ((fsSelection & 1) !== 0) {
      this.flags |= 64; // Italic
    }

    // Nonsymbolic (has standard Latin characters)
    if (this.charToGlyph.has('A'.charCodeAt(0)) && this.charToGlyph.has('a'.charCodeAt(0))) {
      this.flags |= 32; // Nonsymbolic
    } else {
      this.flags |= 4; // Symbolic
    }
  }

  private parsePostTable(reader: BigEndianReader): void {
    const info = this.tables.get('post')!;
    reader.seek(info.offset);

    reader.skip(4); // version
    this.italicAngle = reader.readFixed();
  }

  private parseKernTable(reader: BigEndianReader): void {
    const info = this.tables.get('kern');
    if (!info) return;

    reader.seek(info.offset);
    reader.readUInt16(); // version
    const nTables = reader.readUInt16();

    for (let t = 0; t < nTables; t++) {
      const tableStart = reader.getPosition();
      reader.readUInt16(); // version
      const length = reader.readUInt16();
      const coverage = reader.readUInt16();
      const format = coverage >> 8;
      const isHorizontal = (coverage & 0x01) !== 0;

      if (format !== 0 || !isHorizontal) {
        reader.seek(tableStart + length);
        continue;
      }

      const nPairs = reader.readUInt16();
      reader.skip(6); // searchRange, entrySelector, rangeShift

      for (let i = 0; i < nPairs; i++) {
        const left = reader.readUInt16();
        const right = reader.readUInt16();
        const value = reader.readInt16();
        this.kernPairs.set(`${left},${right}`, value);
      }
    }
  }
}
