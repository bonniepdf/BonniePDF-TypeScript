import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { TtfFont } from '../src/Typography/TrueType/TtfFont';
import { TtfSubsetter } from '../src/Typography/TrueType/TtfSubsetter';

const ARIAL_PATH = 'C:/Windows/Fonts/arial.ttf';
const fontAvailable = existsSync(ARIAL_PATH);
const describeIfFont = fontAvailable ? describe : describe.skip;

describeIfFont('TtfSubsetter (Arial)', () => {
  let font: TtfFont;

  function getFont(): TtfFont {
    if (!font) font = TtfFont.fromFileSync(ARIAL_PATH);
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
    const usedGlyphs = new Set<number>([
      f.getGlyphId('A'.charCodeAt(0)),
      f.getGlyphId('B'.charCodeAt(0)),
      f.getGlyphId('C'.charCodeAt(0)),
    ].filter(g => g > 0));
    const charMap = new Map<number, number>();
    const subsetData = subsetter.createSubset(usedGlyphs, charMap);
    expect(subsetData.length).toBeLessThan(f.getRawFontData().length);
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
