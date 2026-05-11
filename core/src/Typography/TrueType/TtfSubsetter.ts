import { TtfFont } from './TtfFont';

/**
 * Creates a subset TrueType font containing only the glyphs that are actually used.
 * This significantly reduces embedded font size in PDFs.
 */
export class TtfSubsetter {
  private readonly font: TtfFont;
  private readonly originalData: Uint8Array;
  private readonly tables = new Map<string, { offset: number; length: number }>();
  private indexToLocFormat = 0; // 0 = short offsets, 1 = long offsets

  // Mapping from new GID to original GID
  private newToOldGid = new Map<number, number>();

  // Mapping from original GID to new GID in the subset
  private oldToNewGid = new Map<number, number>();

  // Head table info
  private unitsPerEm = 0;

  constructor(font: TtfFont) {
    if (!font) {
      throw new Error('Font cannot be null');
    }

    this.font = font;
    this.originalData = font.getRawFontData();
    this.tables = this.parseTableDirectory();
    this.readHeadTable();
  }

  /**
   * Gets the mapping from original GID to new GID after subsetting.
   * Available after createSubset() is called.
   */
  public getOldToNewGidMap(): ReadonlyMap<number, number> {
    return this.oldToNewGid;
  }

  /**
   * Gets the maximum original GID that was used (for CIDToGIDMap size calculation)
   */
  public maxOriginalGid = 0;

  /**
   * Creates a subset font containing only the specified glyphs.
   * @param usedGlyphIds Set of glyph IDs to include in the subset
   * @param charToGlyphMap Mapping of Unicode characters to glyph IDs
   * @returns The subset font data as a byte array
   */
  public createSubset(usedGlyphIds: Set<number>, charToGlyphMap: Map<number, number>): Uint8Array {
    // 1. Build the GID remapping (always include GID 0 = .notdef)
    this.buildGidMapping(usedGlyphIds);

    // 2. Get composite glyph dependencies (glyphs that reference other glyphs)
    const allGlyphs = this.getAllRequiredGlyphs(usedGlyphIds);

    // Rebuild mapping with composite dependencies
    this.buildGidMapping(allGlyphs);

    // 3. Build each required table
    const newTables = new Map<string, Uint8Array>();
    
    // Required tables (must be present)
    newTables.set('head', this.buildHeadTable());
    newTables.set('hhea', this.buildHheaTable());
    newTables.set('maxp', this.buildMaxpTable());
    newTables.set('hmtx', this.buildHmtxTable());
    newTables.set('cmap', this.buildCmapTable(charToGlyphMap));

    // Glyph data tables
    const { glyfData, locaData } = this.buildGlyfAndLocaTables();
    newTables.set('glyf', glyfData);
    newTables.set('loca', locaData);

    // Optional tables - copy if present
    this.copyTableIfPresent(newTables, 'cvt ');
    this.copyTableIfPresent(newTables, 'fpgm');
    this.copyTableIfPresent(newTables, 'prep');
    this.copyTableIfPresent(newTables, 'post');
    this.copyTableIfPresent(newTables, 'name');
    this.copyTableIfPresent(newTables, 'OS/2');

    // 4. Assemble the final font file
    return this.assembleFont(newTables);
  }

  // =====================================================
  // TABLE PARSING
  // =====================================================

  private parseTableDirectory(): Map<string, { offset: number; length: number }> {
    const tables = new Map<string, { offset: number; length: number }>();

    const view = new DataView(this.originalData.buffer, this.originalData.byteOffset);

    // Skip sfntVersion (4 bytes)
    let offset = 4;

    const numTables = view.getUint16(offset);
    offset = 12; // Skip to table directory

    for (let i = 0; i < numTables; i++) {
      const tag = String.fromCharCode(
        this.originalData[offset],
        this.originalData[offset + 1],
        this.originalData[offset + 2],
        this.originalData[offset + 3]
      );
      offset += 4;

      const checkSum = view.getUint32(offset);
      offset += 4;

      const tableOffset = view.getUint32(offset);
      offset += 4;

      const length = view.getUint32(offset);
      offset += 4;

      tables.set(tag, { offset: tableOffset, length });
    }

    return tables;
  }

  private readHeadTable(): void {
    const headInfo = this.tables.get('head');
    if (!headInfo) {
      throw new Error('Missing required \'head\' table');
    }

    const view = new DataView(this.originalData.buffer, this.originalData.byteOffset);

    // Read unitsPerEm at offset 18
    this.unitsPerEm = view.getUint16(headInfo.offset + 18);

    // Read indexToLocFormat at offset 50
    this.indexToLocFormat = view.getInt16(headInfo.offset + 50);
  }

  // =====================================================
  // GID MAPPING
  // =====================================================

  private buildGidMapping(usedGlyphs: Set<number>): void {
    this.oldToNewGid.clear();
    this.newToOldGid.clear();

    // Always include GID 0 (.notdef)
    const sortedGlyphs = Array.from(usedGlyphs).sort((a, b) => a - b);
    if (!sortedGlyphs.includes(0)) {
      sortedGlyphs.unshift(0);
    }

    // Track max original GID for CIDToGIDMap size
    this.maxOriginalGid = sortedGlyphs.length > 0 ? Math.max(...sortedGlyphs) : 0;

    let newGid = 0;
    for (const oldGid of sortedGlyphs) {
      this.oldToNewGid.set(oldGid, newGid);
      this.newToOldGid.set(newGid, oldGid);
      newGid++;
    }
  }

  private getAllRequiredGlyphs(usedGlyphs: Set<number>): Set<number> {
    const allGlyphs = new Set(usedGlyphs);

    // Always include .notdef
    allGlyphs.add(0);

    const glyfInfo = this.tables.get('glyf');
    const locaInfo = this.tables.get('loca');

    if (!glyfInfo || !locaInfo) {
      return allGlyphs;
    }

    // Check each glyph for composite references
    const toProcess: number[] = Array.from(usedGlyphs);
    const processed = new Set<number>();

    while (toProcess.length > 0) {
      const gid = toProcess.shift()!;
      if (processed.has(gid)) continue;
      processed.add(gid);

      const componentGids = this.getCompositeComponents(gid, glyfInfo, locaInfo);
      for (const componentGid of componentGids) {
        if (allGlyphs.add(componentGid)) {
          toProcess.push(componentGid);
        }
      }
    }

    return allGlyphs;
  }

  private getCompositeComponents(
    gid: number,
    glyfInfo: { offset: number; length: number },
    locaInfo: { offset: number; length: number }
  ): number[] {
    const components: number[] = [];
    const view = new DataView(this.originalData.buffer, this.originalData.byteOffset);

    // Get glyph offset from loca table
    let glyphOffset: number;
    let glyphLength: number;

    if (this.indexToLocFormat === 0) {
      // Short format: offsets are ushort * 2
      const offset1 = view.getUint16(locaInfo.offset + gid * 2) * 2;
      const offset2 = view.getUint16(locaInfo.offset + gid * 2 + 2) * 2;
      glyphOffset = offset1;
      glyphLength = offset2 - offset1;
    } else {
      // Long format: offsets are uint
      const offset1 = view.getUint32(locaInfo.offset + gid * 4);
      const offset2 = view.getUint32(locaInfo.offset + gid * 4 + 4);
      glyphOffset = offset1;
      glyphLength = offset2 - offset1;
    }

    if (glyphLength === 0) return components; // Empty glyph

    // Read glyph header
    const numberOfContours = view.getInt16(glyfInfo.offset + glyphOffset);

    if (numberOfContours >= 0) return components; // Simple glyph, no components

    // Composite glyph - skip bounding box (8 bytes)
    let offset = glyfInfo.offset + glyphOffset + 8;

    const ARG_1_AND_2_ARE_WORDS = 0x0001;
    const MORE_COMPONENTS = 0x0020;
    const WE_HAVE_A_SCALE = 0x0008;
    const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
    const WE_HAVE_A_TWO_BY_TWO = 0x0080;

    let flags: number;
    do {
      flags = view.getUint16(offset);
      offset += 2;

      const componentGid = view.getUint16(offset);
      offset += 2;
      components.push(componentGid);

      // Skip arguments
      if ((flags & ARG_1_AND_2_ARE_WORDS) !== 0) {
        offset += 4; // 2 shorts
      } else {
        offset += 2; // 2 bytes
      }

      // Skip transformation
      if ((flags & WE_HAVE_A_SCALE) !== 0) {
        offset += 2;
      } else if ((flags & WE_HAVE_AN_X_AND_Y_SCALE) !== 0) {
        offset += 4;
      } else if ((flags & WE_HAVE_A_TWO_BY_TWO) !== 0) {
        offset += 8;
      }
    } while ((flags & MORE_COMPONENTS) !== 0);

    return components;
  }

  // =====================================================
  // TABLE BUILDING
  // =====================================================

  private buildHeadTable(): Uint8Array {
    const info = this.tables.get('head');
    if (!info) {
      throw new Error('Missing \'head\' table');
    }

    // Copy original head table
    const data = new Uint8Array(info.length);
    data.set(this.originalData.subarray(info.offset, info.offset + info.length));

    // Update indexToLocFormat to long format (1)
    data[50] = 0;
    data[51] = 1;

    // Zero out checkSumAdjustment (will be recalculated if needed)
    data[8] = 0;
    data[9] = 0;
    data[10] = 0;
    data[11] = 0;

    return data;
  }

  private buildHheaTable(): Uint8Array {
    const info = this.tables.get('hhea');
    if (!info) {
      throw new Error('Missing \'hhea\' table');
    }

    // Copy original hhea table
    const data = new Uint8Array(info.length);
    data.set(this.originalData.subarray(info.offset, info.offset + info.length));

    // Update numberOfHMetrics to match subset glyph count
    const numGlyphs = this.newToOldGid.size;
    data[34] = (numGlyphs >> 8) & 0xFF;
    data[35] = numGlyphs & 0xFF;

    return data;
  }

  private buildMaxpTable(): Uint8Array {
    const info = this.tables.get('maxp');
    if (!info) {
      throw new Error('Missing \'maxp\' table');
    }

    // Copy original maxp table
    const data = new Uint8Array(info.length);
    data.set(this.originalData.subarray(info.offset, info.offset + info.length));

    // Update numGlyphs
    const numGlyphs = this.newToOldGid.size;
    data[4] = (numGlyphs >> 8) & 0xFF;
    data[5] = numGlyphs & 0xFF;

    return data;
  }

  private buildHmtxTable(): Uint8Array {
    const hmtxInfo = this.tables.get('hmtx');
    if (!hmtxInfo) {
      throw new Error('Missing \'hmtx\' table');
    }

    const numGlyphs = this.newToOldGid.size;
    const view = new DataView(this.originalData.buffer, this.originalData.byteOffset);

    // Each glyph gets 4 bytes: advanceWidth (2) + leftSideBearing (2)
    const data = new Uint8Array(numGlyphs * 4);

    // Read original hhea to get numberOfHMetrics
    const hheaInfo = this.tables.get('hhea');
    if (!hheaInfo) {
      throw new Error('Missing \'hhea\' table');
    }

    const originalNumberOfHMetrics = view.getUint16(hheaInfo.offset + 34);

    // Copy metrics for each glyph in the subset
    for (let newGid = 0; newGid < numGlyphs; newGid++) {
      const oldGid = this.newToOldGid.get(newGid)!;

      let advanceWidth: number;
      let lsb: number;

      if (oldGid < originalNumberOfHMetrics) {
        // Full record
        advanceWidth = view.getUint16(hmtxInfo.offset + oldGid * 4);
        lsb = view.getInt16(hmtxInfo.offset + oldGid * 4 + 2);
      } else {
        // Use last advanceWidth, read only lsb
        advanceWidth = view.getUint16(hmtxInfo.offset + (originalNumberOfHMetrics - 1) * 4);

        const lsbOffset = hmtxInfo.offset + originalNumberOfHMetrics * 4 + (oldGid - originalNumberOfHMetrics) * 2;
        lsb = view.getInt16(lsbOffset);
      }

      // Write to new hmtx
      const offset = newGid * 4;
      data[offset] = (advanceWidth >> 8) & 0xFF;
      data[offset + 1] = advanceWidth & 0xFF;
      data[offset + 2] = (lsb >> 8) & 0xFF;
      data[offset + 3] = lsb & 0xFF;
    }

    return data;
  }

  private buildCmapTable(charToGlyphMap: Map<number, number>): Uint8Array {
    // Split mappings into BMP and supplementary plane
    const bmpMappings = new Map<number, number>();
    const allMappings = new Map<number, number>();

    for (const [codepoint, oldGid] of charToGlyphMap) {
      const newGid = this.oldToNewGid.get(oldGid);
      if (newGid === undefined) continue;

      allMappings.set(codepoint, newGid);
      if (codepoint <= 0xFFFF) {
        bmpMappings.set(codepoint, newGid);
      }
    }

    const hasSupplementary = Array.from(allMappings.keys()).some(cp => cp > 0xFFFF);

    if (hasSupplementary) {
      return this.buildCmapWithFormat12(bmpMappings, allMappings);
    }

    return this.buildCmapFormat4(bmpMappings);
  }

  private buildCmapFormat4(bmpMappings: Map<number, number>): Uint8Array {
    // BMP-only: single encoding record with Format 4 subtable
    const subtable = this.buildCmapFormat4Subtable(bmpMappings);

    const result: number[] = [];

    // cmap header
    this.writeUInt16BE(result, 0); // version
    this.writeUInt16BE(result, 1); // numTables

    // Encoding record (Windows Unicode BMP)
    this.writeUInt16BE(result, 3); // platformID
    this.writeUInt16BE(result, 1); // encodingID
    this.writeUInt32BE(result, 12); // offset to subtable

    result.push(...subtable);

    return new Uint8Array(result);
  }

  private buildCmapFormat4Subtable(unicodeToGid: Map<number, number>): number[] {
    const segments = this.buildCmapSegments(unicodeToGid);
    const segCount = segments.length;
    const segCountX2 = segCount * 2;
    const searchRange = 2 * Math.pow(2, Math.floor(Math.log2(segCount)));
    const entrySelector = Math.floor(Math.log2(segCount));
    const rangeShift = segCountX2 - searchRange;
    const subtableLength = 16 + segCount * 8;

    const result: number[] = [];

    this.writeUInt16BE(result, 4); // format
    this.writeUInt16BE(result, subtableLength);
    this.writeUInt16BE(result, 0); // language
    this.writeUInt16BE(result, segCountX2);
    this.writeUInt16BE(result, searchRange);
    this.writeUInt16BE(result, entrySelector);
    this.writeUInt16BE(result, rangeShift);

    for (const seg of segments) {
      this.writeUInt16BE(result, seg.endCode);
    }
    this.writeUInt16BE(result, 0); // reservedPad

    for (const seg of segments) {
      this.writeUInt16BE(result, seg.startCode);
    }

    for (const seg of segments) {
      this.writeInt16BE(result, seg.idDelta);
    }

    for (let i = 0; i < segCount; i++) {
      this.writeUInt16BE(result, 0); // idRangeOffsets
    }

    return result;
  }

  private buildCmapSegments(unicodeToGid: Map<number, number>): Array<{ startCode: number; endCode: number; idDelta: number }> {
    const segments: Array<{ startCode: number; endCode: number; idDelta: number }> = [];

    if (unicodeToGid.size === 0) {
      // Empty font - just add the required ending segment
      segments.push({ startCode: 0xFFFF, endCode: 0xFFFF, idDelta: 1 });
      return segments;
    }

    const sortedCodes = Array.from(unicodeToGid.keys()).sort((a, b) => a - b);

    let i = 0;
    while (i < sortedCodes.length) {
      const startCode = sortedCodes[i];
      const startGid = unicodeToGid.get(startCode)!;
      const idDelta = startGid - startCode;

      let endCode = startCode;

      // Extend segment while consecutive and same delta
      while (i + 1 < sortedCodes.length) {
        const nextCode = sortedCodes[i + 1];
        const nextGid = unicodeToGid.get(nextCode)!;
        const nextDelta = nextGid - nextCode;

        if (nextCode === endCode + 1 && nextDelta === idDelta) {
          endCode = nextCode;
          i++;
        } else {
          break;
        }
      }

      segments.push({ startCode, endCode, idDelta });
      i++;
    }

    // Add required ending segment
    segments.push({ startCode: 0xFFFF, endCode: 0xFFFF, idDelta: 1 });

    return segments;
  }

  private buildCmapWithFormat12(bmpMappings: Map<number, number>, allMappings: Map<number, number>): Uint8Array {
    // Build Format 4 subtable for BMP (compatibility with older viewers)
    const format4 = this.buildCmapFormat4Subtable(bmpMappings);
    // Build Format 12 subtable for full Unicode
    const format12 = this.buildCmapFormat12Subtable(allMappings);

    const result: number[] = [];

    // cmap header
    this.writeUInt16BE(result, 0); // version
    this.writeUInt16BE(result, 2); // numTables (Format 4 + Format 12)

    // Encoding records
    const recordsSize = 4 + 2 * 8; // header (4) + 2 records (8 each)
    const format4Offset = recordsSize;
    const format12Offset = recordsSize + format4.length;

    // Record 1: Windows Unicode BMP (3, 1) -> Format 4
    this.writeUInt16BE(result, 3); // platformID
    this.writeUInt16BE(result, 1); // encodingID
    this.writeUInt32BE(result, format4Offset);

    // Record 2: Windows Unicode full (3, 10) -> Format 12
    this.writeUInt16BE(result, 3); // platformID
    this.writeUInt16BE(result, 10); // encodingID
    this.writeUInt32BE(result, format12Offset);

    result.push(...format4);
    result.push(...format12);

    return new Uint8Array(result);
  }

  private buildCmapFormat12Subtable(unicodeToGid: Map<number, number>): number[] {
    // Build groups: consecutive codepoints with consecutive GIDs
    const groups: Array<{ startCharCode: number; endCharCode: number; startGlyphId: number }> = [];
    const sortedCodes = Array.from(unicodeToGid.keys()).sort((a, b) => a - b);

    if (sortedCodes.length > 0) {
      let i = 0;
      while (i < sortedCodes.length) {
        const startChar = sortedCodes[i];
        const startGid = unicodeToGid.get(startChar)!;
        let endChar = startChar;

        while (i + 1 < sortedCodes.length) {
          const nextChar = sortedCodes[i + 1];
          const expectedGid = startGid + (nextChar - startChar);

          if (nextChar === endChar + 1 && unicodeToGid.get(nextChar) === expectedGid) {
            endChar = nextChar;
            i++;
          } else {
            break;
          }
        }

        groups.push({ startCharCode: startChar, endCharCode: endChar, startGlyphId: startGid });
        i++;
      }
    }

    const numGroups = groups.length;
    const subtableLength = 16 + numGroups * 12; // fixed header (16) + groups (12 each)

    const result: number[] = [];

    this.writeUInt16BE(result, 12); // format
    this.writeUInt16BE(result, 0); // reserved
    this.writeUInt32BE(result, subtableLength);
    this.writeUInt32BE(result, 0); // language
    this.writeUInt32BE(result, numGroups);

    for (const group of groups) {
      this.writeUInt32BE(result, group.startCharCode);
      this.writeUInt32BE(result, group.endCharCode);
      this.writeUInt32BE(result, group.startGlyphId);
    }

    return result;
  }

  private buildGlyfAndLocaTables(): { glyfData: Uint8Array; locaData: Uint8Array } {
    const glyfInfo = this.tables.get('glyf');
    const locaInfo = this.tables.get('loca');

    if (!glyfInfo || !locaInfo) {
      throw new Error('Missing \'glyf\' or \'loca\' table');
    }

    const numGlyphs = this.newToOldGid.size;
    const view = new DataView(this.originalData.buffer, this.originalData.byteOffset);

    const glyfData: number[] = [];
    const locaData: number[] = [];

    for (let newGid = 0; newGid < numGlyphs; newGid++) {
      // Write current offset to loca (long format)
      this.writeUInt32BE(locaData, glyfData.length);

      const oldGid = this.newToOldGid.get(newGid)!;

      // Get original glyph data location
      let glyphOffset: number;
      let glyphLength: number;

      if (this.indexToLocFormat === 0) {
        const offset1 = view.getUint16(locaInfo.offset + oldGid * 2) * 2;
        const offset2 = view.getUint16(locaInfo.offset + oldGid * 2 + 2) * 2;
        glyphOffset = offset1;
        glyphLength = offset2 - offset1;
      } else {
        const offset1 = view.getUint32(locaInfo.offset + oldGid * 4);
        const offset2 = view.getUint32(locaInfo.offset + oldGid * 4 + 4);
        glyphOffset = offset1;
        glyphLength = offset2 - offset1;
      }

      if (glyphLength === 0) continue; // Empty glyph

      // Read original glyph data
      const glyphData = this.originalData.subarray(glyfInfo.offset + glyphOffset, glyfInfo.offset + glyphOffset + glyphLength);

      // Check if composite and remap component GIDs
      const numberOfContours = (glyphData[0] << 8) | glyphData[1];
      let finalGlyphData = glyphData;

      if (numberOfContours < 0) {
        // Composite glyph - remap component GIDs
        finalGlyphData = this.remapCompositeGlyph(glyphData);
      }

      glyfData.push(...Array.from(finalGlyphData));

      // Pad to 4-byte boundary
      const padding = (4 - glyfData.length % 4) % 4;
      for (let p = 0; p < padding; p++) {
        glyfData.push(0);
      }
    }

    // Write final offset to loca
    this.writeUInt32BE(locaData, glyfData.length);

    return {
      glyfData: new Uint8Array(glyfData),
      locaData: new Uint8Array(locaData)
    };
  }

  private remapCompositeGlyph(glyphData: Uint8Array): Uint8Array {
    const result = new Uint8Array(glyphData);

    const ARG_1_AND_2_ARE_WORDS = 0x0001;
    const MORE_COMPONENTS = 0x0020;
    const WE_HAVE_A_SCALE = 0x0008;
    const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
    const WE_HAVE_A_TWO_BY_TWO = 0x0080;

    let offset = 10; // Skip header (numberOfContours + bbox)

    let flags: number;
    do {
      flags = (result[offset] << 8) | result[offset + 1];
      const oldComponentGid = (result[offset + 2] << 8) | result[offset + 3];

      // Remap the component GID
      const newComponentGid = this.oldToNewGid.get(oldComponentGid);
      if (newComponentGid !== undefined) {
        result[offset + 2] = (newComponentGid >> 8) & 0xFF;
        result[offset + 3] = newComponentGid & 0xFF;
      }

      offset += 4; // flags + glyphIndex

      // Skip arguments
      if ((flags & ARG_1_AND_2_ARE_WORDS) !== 0) {
        offset += 4;
      } else {
        offset += 2;
      }

      // Skip transformation
      if ((flags & WE_HAVE_A_SCALE) !== 0) {
        offset += 2;
      } else if ((flags & WE_HAVE_AN_X_AND_Y_SCALE) !== 0) {
        offset += 4;
      } else if ((flags & WE_HAVE_A_TWO_BY_TWO) !== 0) {
        offset += 8;
      }
    } while ((flags & MORE_COMPONENTS) !== 0);

    return result;
  }

  private copyTableIfPresent(newTables: Map<string, Uint8Array>, tag: string): void {
    const info = this.tables.get(tag);
    if (info) {
      const data = new Uint8Array(info.length);
      data.set(this.originalData.subarray(info.offset, info.offset + info.length));
      newTables.set(tag, data);
    }
  }

  // =====================================================
  // FONT ASSEMBLY
  // =====================================================

  private assembleFont(tables: Map<string, Uint8Array>): Uint8Array {
    const numTables = tables.size;
    const searchRange = 16 * Math.pow(2, Math.floor(Math.log2(numTables)));
    const entrySelector = Math.floor(Math.log2(numTables));
    const rangeShift = numTables * 16 - searchRange;

    // Calculate header size: offset table (12) + table directory (numTables * 16)
    const headerSize = 12 + numTables * 16;

    // Sort tables alphabetically (required by TrueType spec for some tools)
    const sortedTags = Array.from(tables.keys()).sort();

    // Calculate table offsets (4-byte aligned)
    const tableOffsets = new Map<string, number>();
    let currentOffset = headerSize;

    for (const tag of sortedTags) {
      tableOffsets.set(tag, currentOffset);
      const tableSize = tables.get(tag)!.length;
      currentOffset += tableSize;
      // Align to 4 bytes
      currentOffset = (currentOffset + 3) & ~3;
    }

    const result: number[] = [];

    // Offset table
    this.writeUInt32BE(result, 0x00010000); // sfntVersion (TrueType)
    this.writeUInt16BE(result, numTables);
    this.writeUInt16BE(result, searchRange);
    this.writeUInt16BE(result, entrySelector);
    this.writeUInt16BE(result, rangeShift);

    // Table directory
    for (const tag of sortedTags) {
      const tableData = tables.get(tag)!;
      const checkSum = this.calculateChecksum(tableData);

      // Write tag
      for (let i = 0; i < 4; i++) {
        result.push(tag.charCodeAt(i));
      }

      this.writeUInt32BE(result, checkSum);
      this.writeUInt32BE(result, tableOffsets.get(tag)!);
      this.writeUInt32BE(result, tableData.length);
    }

    // Write table data
    for (const tag of sortedTags) {
      const tableData = tables.get(tag)!;
      result.push(...Array.from(tableData));

      // Pad to 4-byte boundary
      const padding = (4 - tableData.length % 4) % 4;
      for (let i = 0; i < padding; i++) {
        result.push(0);
      }
    }

    return new Uint8Array(result);
  }

  private calculateChecksum(data: Uint8Array): number {
    let sum = 0;
    const length = Math.ceil(data.length / 4) * 4; // Round up to 4-byte boundary

    for (let i = 0; i < length; i += 4) {
      let value = 0;
      for (let j = 0; j < 4 && i + j < data.length; j++) {
        value = (value << 8) | data[i + j];
      }
      sum += value;
    }

    return sum >>> 0; // Convert to unsigned 32-bit
  }

  // =====================================================
  // BINARY HELPERS
  // =====================================================

  private writeUInt16BE(data: number[], value: number): void {
    data.push((value >> 8) & 0xFF);
    data.push(value & 0xFF);
  }

  private writeInt16BE(data: number[], value: number): void {
    data.push((value >> 8) & 0xFF);
    data.push(value & 0xFF);
  }

  private writeUInt32BE(data: number[], value: number): void {
    data.push((value >> 24) & 0xFF);
    data.push((value >> 16) & 0xFF);
    data.push((value >> 8) & 0xFF);
    data.push(value & 0xFF);
  }
}
