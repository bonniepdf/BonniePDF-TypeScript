import { PdfSyntax } from '../Pdf/PdfSyntax';
import * as PdfKeys from '../Pdf/PdfKeys';
import { EmbeddedFontInfo } from '../../Typography/EmbeddedFontInfo';
import { TtfFont } from '../../Typography/TrueType/TtfFont';
import { TtfSubsetter } from '../../Typography/TrueType/TtfSubsetter';
import { GlyphUsageTracker } from '../../Typography/GlyphUsageTracker';
import { ToUnicodeCMapBuilder } from '../../Typography/TrueType/ToUnicodeCMapBuilder';
import { DiagnosticsCollector } from '../../Core/Diagnostics';
import { IPdfWriter } from './IPdfWriter';

/**
 * Writes font objects to PDF - both standard Type1 fonts and embedded TrueType fonts.
 * Matches the C# FontWriter class (sync path only; async path delegates to this).
 */
export class FontWriter {
  constructor(
    private readonly writer: IPdfWriter,
    private readonly diagnostics: DiagnosticsCollector = new DiagnosticsCollector()
  ) {
    if (!writer) throw new Error('FontWriter: writer cannot be null');
  }

  // ─── Type1 (standard, non-embedded) ─────────────────────────────────────────

  public writeType1Font(id: number, fontName: string): void {
    this.writer.writeObject(
      id,
      new Map([
        [PdfKeys.Common.Type, '/Font'],
        [PdfKeys.Common.Subtype, '/Type1'],
        [PdfKeys.Font.BaseFont, `/${fontName}`],
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
      try {
        subsetter = new TtfSubsetter(font);
        const usedGlyphIds = new Set<number>(tracker.getUsedGlyphIds() as ReadonlySet<number>);
        fontData = subsetter.createSubset(usedGlyphIds, tracker.getUsedCharToGlyphMap());
      } catch (err) {
        // Subsetting failed - fall back to embedding the full font with an
        // Identity CIDToGIDMap so original GIDs from the content stream map
        // directly to glyphs in the (un-subsetted) font file.
        this.diagnostics.addWarning(
          'font-subset',
          `Font subsetting failed, embedding full font: ${(err as Error).message}`,
          font.filePath,
          err
        );
        subsetter = null;
        fontData = font.getRawFontData();
      }
    } else {
      fontData = font.getRawFontData();
    }
    this.writeFontFile2(fontFile2Id, fontData);

    const codes = tracker.getCidToGlyphMap();
    const cidMap = new Map(subsetter?.getOldToNewGidMap() ?? codes);
    for (const [cid, gid] of codes) cidMap.set(cid, subsetter?.getOldToNewGidMap().get(gid) ?? gid);
    const maxCid = Math.max(0, ...cidMap.keys());
    // 2. CIDSet (PDF/A-1b + PDF/UA-1). Mirrors the CIDToGIDMap domain
    //    (0..maxOriginalGid) - see buildCIDSetData.
    let cidSetId = 0;
    if (enableSubsetting && subsetter) {
      cidSetId = this.writer.getNewId();
      this.writeCIDSet(cidSetId, maxCid);
    }

    // 3. FontDescriptor
    this.writeFontDescriptor(fontDescriptorId, font, baseFontName, fontFile2Id, cidSetId);

    // 4. CIDToGIDMap
    let cidToGidMapRef: string;
    if (subsetter || Array.from(codes).some(([cid, gid]) => cid !== gid)) {
      const cidToGidMapId = this.writer.getNewId();
      this.writeCIDToGIDMap(cidToGidMapId, cidMap, maxCid);
      cidToGidMapRef = `${cidToGidMapId} 0 R`;
    } else {
      cidToGidMapRef = '/Identity';
    }

    // 5. CIDFont
    const widthArray = this.generateWidthArray(font, tracker);
    this.writeCIDFont(cidFontId, baseFontName, fontDescriptorId, widthArray, cidToGidMapRef);

    // 6. ToUnicode CMap
    const cmapBuilder = new ToUnicodeCMapBuilder();
    for (const [gid, source] of tracker.getGlyphSources()) cmapBuilder.addSourceMapping(gid, source);
    cmapBuilder.addMappings(tracker.getUsedCharToGlyphMap());
    this.writeToUnicodeCMap(toUnicodeId, cmapBuilder.build());

    // 7. Type0 font dictionary
    this.writer.writeObject(
      type0Id,
      new Map([
        [PdfKeys.Common.Type, '/Font'],
        [PdfKeys.Common.Subtype, '/Type0'],
        [PdfKeys.Font.BaseFont, `/${baseFontName}`],
        [PdfKeys.Font.Encoding, '/Identity-H'],
        [PdfKeys.Font.DescendantFonts, `[ ${cidFontId} 0 R ]`],
        [PdfKeys.Font.ToUnicode, `${toUnicodeId} 0 R`],
      ])
    );

    return type0Id;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private writeFontFile2(id: number, fontData: Uint8Array): void {
    this.writer.writeCompressedBinaryObject(
      id,
      new Map([[PdfKeys.Stream.DecodedLength, fontData.length.toString()]]),
      fontData
    );
  }

  private writeCIDSet(id: number, maxCid: number): void {
    this.writer.writeCompressedBinaryObject(id, new Map(), this.buildCIDSetData(maxCid));
  }

  /**
   * Builds the CIDSet bit-field for a CIDFontType2 subset.
   *
   * The CIDSet must mirror the CIDToGIDMap's domain (CIDs 0..maxCid). VeraPDF
   * (PDF/UA-1, clause 7.21.4.2) treats every in-range CID as "present" - an
   * unmapped CIDToGIDMap entry points at GID 0, which is < numGlyphs - and
   * requires the CIDSet to mark all of them, so set every bit 0..maxCid.
   */
  private buildCIDSetData(maxCid: number): Uint8Array {
    if (maxCid < 0) return new Uint8Array(0);
    const byteCount = Math.floor(maxCid / 8) + 1;
    const data = new Uint8Array(byteCount).fill(0xff);
    // Zero bits past maxCid in the final byte so the bitset length is maxCid+1.
    const bitsInLastByte = (maxCid % 8) + 1;
    if (bitsInLastByte < 8) {
      data[byteCount - 1] = (0xff << (8 - bitsInLastByte)) & 0xff;
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
      [PdfKeys.Common.Type, '/FontDescriptor'],
      [PdfKeys.FontDescriptor.Name, `/${baseFontName}`],
      [PdfKeys.FontDescriptor.Flags, font.flags.toString()],
      [PdfKeys.FontDescriptor.BoundingBox, `[ ${bbox[0]} ${bbox[1]} ${bbox[2]} ${bbox[3]} ]`],
      [PdfKeys.FontDescriptor.ItalicAngle, font.italicAngle.toFixed(1)],
      [PdfKeys.FontDescriptor.Ascent, Math.round(font.ascender * scale).toString()],
      [PdfKeys.FontDescriptor.Descent, Math.round(font.descender * scale).toString()],
      [PdfKeys.FontDescriptor.CapHeight, Math.round(font.capHeight * scale).toString()],
      [PdfKeys.FontDescriptor.VerticalStemWidth, font.stemV.toString()],
      [PdfKeys.FontDescriptor.TrueTypeProgram, `${fontFile2Id} 0 R`],
    ]);
    if (cidSetId > 0) dict.set(PdfKeys.FontDescriptor.CidSet, `${cidSetId} 0 R`);
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
        [PdfKeys.Common.Type, '/Font'],
        [PdfKeys.Common.Subtype, '/CIDFontType2'],
        [PdfKeys.Font.BaseFont, `/${baseFontName}`],
        [PdfKeys.Font.CidSystemInfo, '<< /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>'],
        [PdfKeys.Font.Descriptor, `${fontDescriptorId} 0 R`],
        [PdfKeys.Font.Widths, widthArray],
        [PdfKeys.Font.CidToGlyphMap, cidToGidMapRef],
      ])
    );
  }

  private writeToUnicodeCMap(id: number, cmapContent: string): void {
    this.writer.writeObject(id, new Map(), cmapContent);
  }

  private generateWidthArray(font: TtfFont, tracker: GlyphUsageTracker): string {
    const scale = 1000 / font.unitsPerEm;
    const codes = tracker.getCidToGlyphMap();
    const glyphs = Array.from(codes.keys()).sort((a, b) => a - b);

    let result = '[ ';
    let i = 0;
    while (i < glyphs.length) {
      const startGid = glyphs[i];
      result += `${startGid} [ `;
      let j = i;
      while (j < glyphs.length && glyphs[j] === startGid + (j - i)) {
        result += `${PdfSyntax.formatDecimal(font.getGlyphWidth(codes.get(glyphs[j])!) * scale)} `;
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
