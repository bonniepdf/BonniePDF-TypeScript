import { TtfFont } from './TrueType/TtfFont';

/**
 * Tracks which characters/glyphs are used in a document.
 * Used for generating ToUnicode CMap and future font subsetting.
 * Supports the full Unicode range (BMP + supplementary planes).
 */
export class GlyphUsageTracker {
  private readonly font: TtfFont;
  private readonly usedCodepoints = new Set<number>();
  private readonly usedGlyphs = new Set<number>();

  /**
   * Creates a new glyph usage tracker for the specified font
   */
  constructor(font: TtfFont) {
    if (!font) {
      throw new Error('Font cannot be null');
    }

    this.font = font;

    // Always include .notdef glyph (GID 0)
    this.usedGlyphs.add(0);
  }

  /**
   * Gets the set of used Unicode codepoints
   */
  public getUsedCodepoints(): ReadonlySet<number> {
    return this.usedCodepoints;
  }

  /**
   * Gets the set of used glyph IDs
   */
  public getUsedGlyphIds(): ReadonlySet<number> {
    return this.usedGlyphs;
  }

  /**
   * Gets the number of unique codepoints used
   */
  public get usedCharacterCount(): number {
    return this.usedCodepoints.size;
  }

  /**
   * Gets the number of unique glyphs used
   */
  public get usedGlyphCount(): number {
    return this.usedGlyphs.size;
  }

  /**
   * Marks a Unicode codepoint as used
   */
  public markUsed(codepoint: number): void {
    if (this.usedCodepoints.add(codepoint)) {
      const gid = this.font.getGlyphId(codepoint);
      this.usedGlyphs.add(gid);
    }
  }

  /**
   * Marks a BMP character as used
   */
  public markUsedChar(c: string): void {
    this.markUsed(c.charCodeAt(0));
  }

  /**
   * Marks all characters in a string as used
   */
  public markUsedText(text: string): void {
    if (!text) return;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      
      // Check for surrogate pair
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
        const nextCode = text.charCodeAt(i + 1);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          // Valid surrogate pair
          const surrogatePair = (code - 0xD800) * 0x400 + (nextCode - 0xDC00) + 0x10000;
          this.markUsed(surrogatePair);
          i++; // Skip next character
          continue;
        }
      }
      
      this.markUsed(code);
    }
  }

  /**
   * Returns mapping of used codepoints to their glyph IDs
   */
  public getUsedCharToGlyphMap(): Map<number, number> {
    const map = new Map<number, number>();
    for (const cp of this.usedCodepoints) {
      map.set(cp, this.font.getGlyphId(cp));
    }
    return map;
  }
}
