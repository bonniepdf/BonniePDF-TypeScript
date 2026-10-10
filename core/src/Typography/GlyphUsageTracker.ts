import type { GlyphInfo } from './Engine/Api/GlyphInfo';
import { TtfFont } from './TrueType/TtfFont';

/**
 * Tracks which characters/glyphs are used in a document.
 * Used for generating ToUnicode CMap and future font subsetting.
 * Supports the full Unicode range (BMP + supplementary planes).
 */
export class GlyphUsageTracker {
  private readonly sources = new Map<number, string>();
  private readonly cidGlyphs = new Map<number, number>();
  private readonly sourceCids = new Map<string, number>();
  private nextCid = 0;
  /** @internal Source text for each painted PDF character code. */
  public getGlyphSources(): ReadonlyMap<number, string> {
    return this.sources;
  }
  /** @internal Includes original glyph codes and source-specific aliases. */
  public getCidToGlyphMap(): ReadonlyMap<number, number> {
    return new Map([...Array.from(this.usedGlyphs, g => [g, g] as const), ...this.cidGlyphs]);
  }
  /** @internal Tracks substituted glyphs and returns source-specific PDF codes. */
  public markShaped(text: string, glyphs: readonly GlyphInfo[]): readonly number[] {
    const codes: number[] = [];
    for (let i = 0; i < glyphs.length;) {
      const first = glyphs[i];
      let end = i + 1;
      while (end < glyphs.length && glyphs[end].cluster === first.cluster) end++;
      const chars = Array.from(text.slice(first.cluster, first.cluster + first.sourceLength));
      for (let j = i; j < end; j++) {
        const g = glyphs[j];
        this.usedGlyphs.add(g.id);
        const source = j === end - 1 ? chars.slice(j - i).join('') : (chars[j - i] ?? '');
        const key = g.id + ':' + source;
        let code = this.sourceCids.get(key);
        if (code === undefined) {
          code = this.sources.has(g.id) ? Math.max(this.nextCid, this.font.numberOfGlyphs) : g.id;
          if (code > 65535) throw new RangeError('PDF font character-code capacity exceeded.');
          if (code >= this.font.numberOfGlyphs) this.nextCid = code + 1;
          this.sources.set(code, source);
          this.sourceCids.set(key, code);
          this.cidGlyphs.set(code, g.id);
        }
        codes.push(code);
      }
      i = end;
    }
    return codes;
  }
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
    this.markShaped(text, this.font.shape(text));

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);

      // Check for surrogate pair
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
        const nextCode = text.charCodeAt(i + 1);
        if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
          // Valid surrogate pair
          const surrogatePair = (code - 0xd800) * 0x400 + (nextCode - 0xdc00) + 0x10000;
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
