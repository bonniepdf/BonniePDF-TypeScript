import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { TtfSubsetter } from '../../src/Typography/TrueType/TtfSubsetter';

// Bundled, cross-platform Liberation Sans (metric-compatible with Arial).
const FONT_PATH = fileURLToPath(new URL('../../assets/fonts/LiberationSans-Regular.ttf', import.meta.url));
const fontAvailable = existsSync(FONT_PATH);
const describeIfFont = fontAvailable ? describe : describe.skip;

describeIfFont('TtfSubsetter (Liberation Sans)', () => {
  let font: TtfFont;

  function getFont(): TtfFont {
    if (!font) font = TtfFont.fromFileSync(FONT_PATH);
    return font;
  }

  it('creates subsetter from font', () => {
    const subsetter = new TtfSubsetter(getFont());
    expect(subsetter).toBeDefined();
  });

  it('createSubset returns non-empty bytes', () => {
    const f = getFont();
    const subsetter = new TtfSubsetter(f);
    const usedGlyphs = new Set<number>([1, 2, 3]);
    const charMap = new Map<number, number>([
      ['A'.charCodeAt(0), f.getGlyphId('A'.charCodeAt(0))],
      ['B'.charCodeAt(0), f.getGlyphId('B'.charCodeAt(0))],
    ]);
    const subsetData = subsetter.createSubset(usedGlyphs, charMap);
    expect(subsetData).toBeDefined();
    expect(subsetData.length).toBeGreaterThan(0);
  });

  it('getOldToNewGidMap returns Map after createSubset', () => {
    const f = getFont();
    const subsetter = new TtfSubsetter(f);
    const usedGlyphs = new Set<number>([1, 2, 3]);
    const charMap = new Map<number, number>();
    subsetter.createSubset(usedGlyphs, charMap);
    const mapping = subsetter.getOldToNewGidMap();
    expect(mapping).toBeInstanceOf(Map);
  });

  it('subset is smaller than original font', () => {
    const f = getFont();
    const subsetter = new TtfSubsetter(f);
    const usedGlyphs = new Set<number>(
      [f.getGlyphId('A'.charCodeAt(0)), f.getGlyphId('B'.charCodeAt(0)), f.getGlyphId('C'.charCodeAt(0))].filter(
        g => g > 0
      )
    );
    const charMap = new Map<number, number>();
    const subsetData = subsetter.createSubset(usedGlyphs, charMap);
    expect(subsetData.length).toBeLessThan(f.getRawFontData().length);
  });

  // --- Structural validity of the emitted subset --------------------------
  // These guard browser-side rendering (the SVG preview embeds the subset as an
  // @font-face): the OpenType sanitizer in Chrome/Firefox rejects a font whose
  // composite glyphs reference component GIDs outside the subset, which silently
  // falls the text back to a default face and wrecks the baked-in glyph metrics.

  function tableDir(b: Uint8Array): Map<string, { offset: number; length: number; checkSum: number }> {
    const dv = new DataView(b.buffer, b.byteOffset);
    const num = dv.getUint16(4);
    const map = new Map<string, { offset: number; length: number; checkSum: number }>();
    for (let i = 0; i < num; i++) {
      const o = 12 + i * 16;
      const tag = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
      map.set(tag, { checkSum: dv.getUint32(o + 4), offset: dv.getUint32(o + 8), length: dv.getUint32(o + 12) });
    }
    return map;
  }

  function checksum(b: Uint8Array, start: number, length: number): number {
    let sum = 0;
    for (let i = 0; i < length; i += 4) {
      let v = 0;
      for (let j = 0; j < 4; j++) v = ((v << 8) | (i + j < length ? b[start + i + j] : 0)) >>> 0;
      sum = (sum + v) >>> 0;
    }
    return sum;
  }

  // Subset a set of code points that map to composite glyphs (accented Latin
  // letters in Liberation Sans are 'base + diacritic' composites) and verify the
  // emitted font is structurally sound.
  function subsetAccented(): Uint8Array {
    const f = getFont();
    const subsetter = new TtfSubsetter(f);
    const codePoints = [...'Aeéàñüçôî'].map(c => c.codePointAt(0)!);
    const charMap = new Map<number, number>();
    const glyphIds = new Set<number>();
    for (const cp of codePoints) {
      const gid = f.getGlyphId(cp);
      charMap.set(cp, gid);
      glyphIds.add(gid);
    }
    return subsetter.createSubset(glyphIds, charMap);
  }

  it('composite glyphs reference only in-range component GIDs', () => {
    const b = subsetAccented();
    const dv = new DataView(b.buffer, b.byteOffset);
    const dir = tableDir(b);
    const numGlyphs = dv.getUint16(dir.get('maxp')!.offset + 4);
    const locaO = dir.get('loca')!.offset; // subset always writes long loca
    const glyfO = dir.get('glyf')!.offset;

    let compositesSeen = 0;
    for (let g = 0; g < numGlyphs; g++) {
      const start = dv.getUint32(locaO + g * 4);
      const end = dv.getUint32(locaO + g * 4 + 4);
      if (end === start) continue;
      const numberOfContours = dv.getInt16(glyfO + start);
      if (numberOfContours >= 0) continue; // simple glyph
      compositesSeen++;
      let off = glyfO + start + 10;
      // walk component records
      for (;;) {
        const flags = dv.getUint16(off);
        const comp = dv.getUint16(off + 2);
        expect(comp).toBeLessThan(numGlyphs);
        off += 4;
        off += flags & 0x0001 ? 4 : 2; // ARG_1_AND_2_ARE_WORDS
        if (flags & 0x0008)
          off += 2; // WE_HAVE_A_SCALE
        else if (flags & 0x0040)
          off += 4; // X_AND_Y_SCALE
        else if (flags & 0x0080) off += 8; // TWO_BY_TWO
        if (!(flags & 0x0020)) break; // MORE_COMPONENTS
      }
    }
    // The chosen code points must actually exercise composite glyphs, otherwise
    // the assertion above is vacuous.
    expect(compositesSeen).toBeGreaterThan(0);
  });

  it('emits correct table checksums and head checkSumAdjustment', () => {
    const b = subsetAccented();
    const dir = tableDir(b);
    const headOffset = dir.get('head')!.offset;

    for (const [tag, info] of dir) {
      if (tag === 'head') {
        // checkSumAdjustment is excluded from the head table's own checksum.
        const copy = b.slice(info.offset, info.offset + ((info.length + 3) & ~3));
        copy[8] = copy[9] = copy[10] = copy[11] = 0;
        expect(checksum(copy, 0, copy.length)).toBe(info.checkSum);
      } else {
        expect(checksum(b, info.offset, info.length)).toBe(info.checkSum);
      }
    }

    // checkSumAdjustment = 0xB1B0AFBA - checksum(whole file with the field zeroed)
    const file = b.slice();
    file[headOffset + 8] = file[headOffset + 9] = file[headOffset + 10] = file[headOffset + 11] = 0;
    const expected = (0xb1b0afba - checksum(file, 0, file.length)) >>> 0;
    const dv = new DataView(b.buffer, b.byteOffset);
    expect(dv.getUint32(headOffset + 8)).toBe(expected);
  });

  it('createSubset twice produces consistent size', () => {
    const f = getFont();
    const usedGlyphs = new Set<number>([1, 2, 3, 4, 5]);
    const charMap = new Map<number, number>();

    const s1 = new TtfSubsetter(f);
    const bytes1 = s1.createSubset(usedGlyphs, charMap);

    const s2 = new TtfSubsetter(f);
    const bytes2 = s2.createSubset(usedGlyphs, charMap);

    expect(bytes1.length).toBe(bytes2.length);
    expect(bytes1[0]).toBe(bytes2[0]);
    expect(bytes1[1]).toBe(bytes2[1]);
  });
});
