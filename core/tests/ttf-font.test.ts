import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { TtfFont } from '../src/Typography/TrueType/TtfFont';

const ARIAL_PATH = 'C:/Windows/Fonts/arial.ttf';
const fontAvailable = existsSync(ARIAL_PATH);
const describeIfFont = fontAvailable ? describe : describe.skip;

describeIfFont('TtfFont (Arial)', () => {
  let font: TtfFont;

  function getFont(): TtfFont {
    if (!font) font = TtfFont.fromFileSync(ARIAL_PATH);
    return font;
  }

  it('loads from file path', () => {
    const f = getFont();
    expect(f).toBeDefined();
  });

  it('filePath is set', () => {
    const f = getFont();
    expect(f.filePath).toBeDefined();
  });

  it('postScriptName is set', () => {
    const f = getFont();
    expect(f.postScriptName).toBeDefined();
    expect(f.postScriptName.length).toBeGreaterThan(0);
  });

  it('fontFamily is set', () => {
    const f = getFont();
    expect(f.fontFamily).toBeDefined();
    expect(f.fontFamily.length).toBeGreaterThan(0);
  });

  it('unitsPerEm is positive', () => {
    const f = getFont();
    expect(f.unitsPerEm).toBeGreaterThan(0);
  });

  it('ascender is set', () => {
    const f = getFont();
    expect(typeof f.ascender).toBe('number');
  });

  it('descender is set', () => {
    const f = getFont();
    expect(typeof f.descender).toBe('number');
  });

  it('numberOfGlyphs is positive', () => {
    const f = getFont();
    expect(f.numberOfGlyphs).toBeGreaterThan(0);
  });

  it('getGlyphId returns positive value for letter A', () => {
    const f = getFont();
    const gid = f.getGlyphId('A'.charCodeAt(0));
    expect(gid).toBeGreaterThan(0);
  });

  it('getGlyphWidth returns positive for known glyph', () => {
    const f = getFont();
    const gid = f.getGlyphId('A'.charCodeAt(0));
    if (gid > 0) {
      const width = f.getGlyphWidth(gid);
      expect(width).toBeGreaterThanOrEqual(0);
    }
  });

  it('getCharWidth returns non-negative value', () => {
    const f = getFont();
    const width = f.getCharWidth('A'.charCodeAt(0));
    expect(width).toBeGreaterThanOrEqual(0);
  });

  it('getCharWidthInPoints returns non-negative value', () => {
    const f = getFont();
    const pts = f.getCharWidthInPoints('A'.charCodeAt(0), 12);
    expect(pts).toBeGreaterThanOrEqual(0);
  });

  it('getRawFontData returns non-empty bytes', () => {
    const f = getFont();
    const data = f.getRawFontData();
    expect(data.length).toBeGreaterThan(0);
  });

  it('getCharToGlyphMap returns Map', () => {
    const f = getFont();
    const map = f.getCharToGlyphMap();
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBeGreaterThan(0);
  });

  it('getAllGlyphWidths returns Map', () => {
    const f = getFont();
    const map = f.getAllGlyphWidths();
    expect(map).toBeInstanceOf(Map);
  });

  it('bBox is array of 4 numbers', () => {
    const f = getFont();
    expect(Array.isArray(f.bBox)).toBe(true);
    expect(f.bBox.length).toBe(4);
  });

  it('flags is a number', () => {
    const f = getFont();
    expect(typeof f.flags).toBe('number');
  });

  it('stemV is a number', () => {
    const f = getFont();
    expect(typeof f.stemV).toBe('number');
  });

  it('italicAngle is a number', () => {
    const f = getFont();
    expect(typeof f.italicAngle).toBe('number');
  });
});
