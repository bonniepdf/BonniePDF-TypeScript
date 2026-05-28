import { IPdfWriter, IAsyncPdfWriter } from './PdfWriter';
import { EmbeddedFontInfo } from '../../Typography/EmbeddedFontInfo';
import { TtfFont } from '../../Typography/TrueType/TtfFont';
import { GlyphUsageTracker } from '../../Typography/GlyphUsageTracker';
import { TtfSubsetter } from '../../Typography/TrueType/TtfSubsetter';
import { ToUnicodeCMapBuilder } from '../../Typography/TrueType/ToUnicodeCMapBuilder';

export class FontWriter {
  constructor(private writer: IPdfWriter | IAsyncPdfWriter) {}

  public writeType1Font(id: number, fontName: string): void {
    if ('writeObject' in this.writer) {
      (this.writer as any).writeObject(
        id,
        new Map([
          ['/Type', '/Font'],
          ['/Subtype', '/Type1'],
          ['/BaseFont', `/${fontName}`],
        ])
      );
    }
  }

  public async writeType1FontAsync(id: number, fontName: string): Promise<void> {
    if ('writeObjectAsync' in this.writer) {
      await (this.writer as any).writeObjectAsync(
        id,
        new Map([
          ['/Type', '/Font'],
          ['/Subtype', '/Type1'],
          ['/BaseFont', `/${fontName}`],
        ]),
        null
      );
    }
  }

  public writeEmbeddedTtfFont(id: number, fontInfo: EmbeddedFontInfo, enableSubsetting = true): number {
    if (!('writeObject' in this.writer)) {
      throw new Error('FontWriter.writeEmbeddedTtfFont requires IPdfWriter');
    }

    const font = fontInfo.font;
    const tracker = fontInfo.tracker;

    // Allocate object IDs
    const cidFontId = (this.writer as any).getNewId();
    const fontDescriptorId = (this.writer as any).getNewId();
    const fontFile2Id = (this.writer as any).getNewId();
    const toUnicodeId = (this.writer as any).getNewId();

    const baseFontName = fontInfo.subsetFontName;

    // 1. Build subset (or full font) and derive the CIDToGIDMap in one shot.
    //    Using one TtfSubsetter instance guarantees the GID remapping used to
    //    build the subset font file matches the CIDToGIDMap written to the PDF.
    let fontData: Uint8Array;
    let cidToGidMapRef = '/Identity';
    // Highest CID in the CIDToGIDMap (= highest original GID used). The CIDSet
    // must mirror the CIDToGIDMap's domain — see writeCIDSet / buildCIDSetData.
    let cidToGidMapMaxCid = -1;

    if (enableSubsetting) {
      try {
        const charToGlyphMap = tracker.getUsedCharToGlyphMap() as Map<number, number>;
        const usedGlyphIds = new Set<number>(tracker.getUsedGlyphIds());
        const subsetter = new TtfSubsetter(font);
        fontData = subsetter.createSubset(usedGlyphIds, charToGlyphMap);

        const cidToGidMapId = (this.writer as any).getNewId();
        this.writeCIDToGIDMap(
          cidToGidMapId,
          subsetter.getOldToNewGidMap() as Map<number, number>,
          subsetter.maxOriginalGid
        );
        cidToGidMapMaxCid = subsetter.maxOriginalGid;
        cidToGidMapRef = `${cidToGidMapId} 0 R`;
      } catch (err) {
        // Subsetting failed — fall back to embedding the full font with an
        // Identity CIDToGIDMap so original GIDs from the content stream map
        // directly to glyphs in the (un-subsetted) font file.
        console.warn('[BonniePDF] Font subsetting failed, embedding full font:', (err as Error).message);
        fontData = font.getRawFontData();
        cidToGidMapRef = '/Identity';
      }
    } else {
      fontData = font.getRawFontData();
    }

    this.writeFontFile2(fontFile2Id, fontData);

    // 2. Write CIDSet for PDF/A and PDF/UA compliance
    let cidSetId = 0;
    if (enableSubsetting && cidToGidMapRef !== '/Identity') {
      cidSetId = (this.writer as any).getNewId();
      this.writeCIDSet(cidSetId, cidToGidMapMaxCid);
    }

    // 3. Write FontDescriptor
    this.writeFontDescriptor(fontDescriptorId, font, baseFontName, fontFile2Id, cidSetId);

    // 4. Write CIDFont
    const widthArray = this.generateWidthArray(font, tracker);
    this.writeCIDFont(cidFontId, baseFontName, fontDescriptorId, widthArray, cidToGidMapRef);

    // 6. Write ToUnicode CMap
    const cmapBuilder = new ToUnicodeCMapBuilder();
    cmapBuilder.addMappings(tracker.getUsedCharToGlyphMap());
    this.writeToUnicodeCMap(toUnicodeId, cmapBuilder.build());

    // 7. Write Type0 font
    (this.writer as any).writeObject(
      id,
      new Map([
        ['/Type', '/Font'],
        ['/Subtype', '/Type0'],
        ['/BaseFont', `/${baseFontName}`],
        ['/Encoding', '/Identity-H'],
        ['/DescendantFonts', `[ ${cidFontId} 0 R ]`],
        ['/ToUnicode', `${toUnicodeId} 0 R`],
      ])
    );

    return id;
  }

  public async writeEmbeddedTtfFontAsync(
    id: number,
    fontInfo: EmbeddedFontInfo,
    enableSubsetting = true
  ): Promise<number> {
    if (!('writeObjectAsync' in this.writer)) {
      throw new Error('AsyncFontWriter requires IAsyncPdfWriter');
    }

    const font = fontInfo.font;
    const tracker = fontInfo.tracker;

    // Allocate object IDs
    const cidFontId = await (this.writer as any).getNewId();
    const fontDescriptorId = await (this.writer as any).getNewId();
    const fontFile2Id = await (this.writer as any).getNewId();
    const toUnicodeId = await (this.writer as any).getNewId();

    const baseFontName = fontInfo.subsetFontName;

    // 1. Build subset (or full font) in one shot — same logic as the sync version.
    let fontData: Uint8Array;
    let cidToGidMapRef = '/Identity';
    let cidToGidMapMaxCid = -1;

    if (enableSubsetting) {
      try {
        const charToGlyphMap = tracker.getUsedCharToGlyphMap() as Map<number, number>;
        const usedGlyphIds = new Set<number>(tracker.getUsedGlyphIds());
        const subsetter = new TtfSubsetter(font);
        fontData = subsetter.createSubset(usedGlyphIds, charToGlyphMap);

        const cidToGidMapId = await (this.writer as any).getNewId();
        await this.writeCIDToGIDMapAsync(
          cidToGidMapId,
          subsetter.getOldToNewGidMap() as Map<number, number>,
          subsetter.maxOriginalGid
        );
        cidToGidMapMaxCid = subsetter.maxOriginalGid;
        cidToGidMapRef = `${cidToGidMapId} 0 R`;
      } catch (err) {
        console.warn('[BonniePDF] Font subsetting failed, embedding full font:', (err as Error).message);
        fontData = font.getRawFontData();
        cidToGidMapRef = '/Identity';
      }
    } else {
      fontData = font.getRawFontData();
    }

    await this.writeFontFile2Async(fontFile2Id, fontData);

    // 2. Write CIDSet
    let cidSetId = 0;
    if (enableSubsetting && cidToGidMapRef !== '/Identity') {
      cidSetId = await (this.writer as any).getNewId();
      await this.writeCIDSetAsync(cidSetId, cidToGidMapMaxCid);
    }

    // 3. Write FontDescriptor
    await this.writeFontDescriptorAsync(fontDescriptorId, font, baseFontName, fontFile2Id, cidSetId);

    // 4. Write CIDFont
    const widthArray = this.generateWidthArray(font, tracker);
    await this.writeCIDFontAsync(cidFontId, baseFontName, fontDescriptorId, widthArray, cidToGidMapRef);

    // 6. Write ToUnicode CMap
    const cmapBuilder = new ToUnicodeCMapBuilder();
    cmapBuilder.addMappings(tracker.getUsedCharToGlyphMap());
    await this.writeToUnicodeCMapAsync(toUnicodeId, cmapBuilder.build());

    // 7. Write Type0 font
    await (this.writer as any).writeObjectAsync(
      id,
      new Map([
        ['/Type', '/Font'],
        ['/Subtype', '/Type0'],
        ['/BaseFont', `/${baseFontName}`],
        ['/Encoding', '/Identity-H'],
        ['/DescendantFonts', `[ ${cidFontId} 0 R ]`],
        ['/ToUnicode', `${toUnicodeId} 0 R`],
      ]),
      null
    );

    return id;
  }

  private writeFontFile2(id: number, fontData: Uint8Array): void {
    if ('writeObject' in this.writer) {
      (this.writer as any).writeCompressedBinaryObject(
        id,
        new Map([['/Length1', fontData.length.toString()]]),
        fontData
      );
    }
  }

  private async writeFontFile2Async(id: number, fontData: Uint8Array): Promise<void> {
    if ('writeObjectAsync' in this.writer) {
      await (this.writer as any).writeCompressedBinaryObjectAsync(
        id,
        new Map([['/Length1', fontData.length.toString()]]),
        fontData,
        fontData.length
      );
    }
  }

  private writeFontDescriptor(
    id: number,
    font: TtfFont,
    baseFontName: string,
    fontFile2Id: number,
    cidSetId = 0
  ): void {
    if ('writeObject' in this.writer) {
      const scale = 1000 / font.unitsPerEm;
      const ascent = Math.round(font.ascender * scale);
      const descent = Math.round(font.descender * scale);
      const capHeight = Math.round(font.capHeight * scale);
      const stemV = font.stemV;

      const dict = new Map<string, string>();
      dict.set('/Type', '/FontDescriptor');
      dict.set('/FontName', `/${baseFontName}`);
      dict.set('/Flags', font.flags.toString());
      dict.set('/FontBBox', `[ ${font.bBox[0]} ${font.bBox[1]} ${font.bBox[2]} ${font.bBox[3]} ]`);
      dict.set('/ItalicAngle', font.italicAngle.toString());
      dict.set('/Ascent', ascent.toString());
      dict.set('/Descent', descent.toString());
      dict.set('/CapHeight', capHeight.toString());
      dict.set('/StemV', stemV.toString());
      dict.set('/FontFile2', `${fontFile2Id} 0 R`);

      if (cidSetId > 0) {
        dict.set('/CIDSet', `${cidSetId} 0 R`);
      }

      (this.writer as any).writeObject(id, dict);
    }
  }

  private async writeFontDescriptorAsync(
    id: number,
    font: TtfFont,
    baseFontName: string,
    fontFile2Id: number,
    cidSetId = 0
  ): Promise<void> {
    if ('writeObjectAsync' in this.writer) {
      const scale = 1000 / font.unitsPerEm;
      const ascent = Math.round(font.ascender * scale);
      const descent = Math.round(font.descender * scale);
      const capHeight = Math.round(font.capHeight * scale);
      const stemV = font.stemV;

      const dict = new Map<string, string>();
      dict.set('/Type', '/FontDescriptor');
      dict.set('/FontName', `/${baseFontName}`);
      dict.set('/Flags', font.flags.toString());
      dict.set('/FontBBox', `[ ${font.bBox[0]} ${font.bBox[1]} ${font.bBox[2]} ${font.bBox[3]} ]`);
      dict.set('/ItalicAngle', font.italicAngle.toString());
      dict.set('/Ascent', ascent.toString());
      dict.set('/Descent', descent.toString());
      dict.set('/CapHeight', capHeight.toString());
      dict.set('/StemV', stemV.toString());
      dict.set('/FontFile2', `${fontFile2Id} 0 R`);

      if (cidSetId > 0) {
        dict.set('/CIDSet', `${cidSetId} 0 R`);
      }

      await (this.writer as any).writeObjectAsync(id, dict, null);
    }
  }

  private writeCIDSet(id: number, maxCid: number): void {
    if ('writeObject' in this.writer) {
      const cidSetData = this.buildCIDSetData(maxCid);
      (this.writer as any).writeCompressedBinaryObject(id, new Map(), cidSetData);
    }
  }

  private async writeCIDSetAsync(id: number, maxCid: number): Promise<void> {
    if ('writeObjectAsync' in this.writer) {
      const cidSetData = this.buildCIDSetData(maxCid);
      await (this.writer as any).writeCompressedBinaryObjectAsync(id, new Map(), cidSetData, cidSetData.length);
    }
  }

  /**
   * Builds the CIDSet bit-field for a CIDFontType2 subset.
   *
   * The CIDSet must mirror the CIDToGIDMap's domain (CIDs 0..maxCid). VeraPDF
   * (PDF/UA-1, clause 7.21.4.2) treats every in-range CID as "present" — an
   * unmapped CIDToGIDMap entry points at GID 0, which is < numGlyphs — and
   * requires the CIDSet to mark all of them, not just the glyphs actually
   * subset. So set every bit from 0 to maxCid inclusive.
   */
  private buildCIDSetData(maxCid: number): Uint8Array {
    if (maxCid < 0) return new Uint8Array(0);
    const byteCount = Math.floor(maxCid / 8) + 1;
    const data = new Uint8Array(byteCount).fill(0xff);
    // Zero the bits past maxCid in the final byte so the bitset length is
    // exactly maxCid + 1 (CID c occupies bit 7-(c%8) of byte floor(c/8)).
    const bitsInLastByte = (maxCid % 8) + 1;
    if (bitsInLastByte < 8) {
      data[byteCount - 1] = (0xff << (8 - bitsInLastByte)) & 0xff;
    }
    return data;
  }

  private writeCIDFont(
    id: number,
    baseFontName: string,
    fontDescriptorId: number,
    widthArray: string,
    cidToGidMapRef: string
  ): void {
    if ('writeObject' in this.writer) {
      (this.writer as any).writeObject(
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
  }

  private async writeCIDFontAsync(
    id: number,
    baseFontName: string,
    fontDescriptorId: number,
    widthArray: string,
    cidToGidMapRef: string
  ): Promise<void> {
    if ('writeObjectAsync' in this.writer) {
      await (this.writer as any).writeObjectAsync(
        id,
        new Map([
          ['/Type', '/Font'],
          ['/Subtype', '/CIDFontType2'],
          ['/BaseFont', `/${baseFontName}`],
          ['/CIDSystemInfo', '<< /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>'],
          ['/FontDescriptor', `${fontDescriptorId} 0 R`],
          ['/W', widthArray],
          ['/CIDToGIDMap', cidToGidMapRef],
        ]),
        null
      );
    }
  }

  private writeCIDToGIDMap(id: number, oldToNewGidMap: Map<number, number>, maxOriginalGid: number): void {
    if ('writeObject' in this.writer) {
      const mapSize = (maxOriginalGid + 1) * 2;
      const mapData = new Uint8Array(mapSize);

      for (const [originalGid, newGid] of oldToNewGidMap) {
        const offset = originalGid * 2;
        mapData[offset] = newGid >> 8;
        mapData[offset + 1] = newGid & 0xff;
      }

      (this.writer as any).writeCompressedBinaryObject(id, new Map(), mapData);
    }
  }

  private async writeCIDToGIDMapAsync(
    id: number,
    oldToNewGidMap: Map<number, number>,
    maxOriginalGid: number
  ): Promise<void> {
    if ('writeObjectAsync' in this.writer) {
      const mapSize = (maxOriginalGid + 1) * 2;
      const mapData = new Uint8Array(mapSize);

      for (const [originalGid, newGid] of oldToNewGidMap) {
        const offset = originalGid * 2;
        mapData[offset] = newGid >> 8;
        mapData[offset + 1] = newGid & 0xff;
      }

      await (this.writer as any).writeCompressedBinaryObjectAsync(id, new Map(), mapData, mapData.length);
    }
  }

  private writeToUnicodeCMap(id: number, cmapContent: string): void {
    if ('writeObject' in this.writer) {
      (this.writer as any).writeObject(id, new Map(), cmapContent);
    }
  }

  private async writeToUnicodeCMapAsync(id: number, cmapContent: string): Promise<void> {
    if ('writeObjectAsync' in this.writer) {
      await (this.writer as any).writeObjectAsync(id, new Map(), cmapContent);
    }
  }

  private generateWidthArray(font: TtfFont, tracker: GlyphUsageTracker): string {
    const scale = 1000 / font.unitsPerEm;
    let result = '[ ';
    const glyphs = Array.from(tracker.getUsedGlyphIds()).sort((a, b) => a - b);

    let i = 0;
    while (i < glyphs.length) {
      const startGid = glyphs[i];
      result += `${startGid} [ `;

      let j = i;
      while (j < glyphs.length && glyphs[j] === startGid + (j - i)) {
        const scaledWidth = Math.round(font.getGlyphWidth(glyphs[j]) * scale);
        result += `${scaledWidth} `;
        j++;
      }

      result += '] ';
      i = j;
    }

    return result + ']';
  }
}
