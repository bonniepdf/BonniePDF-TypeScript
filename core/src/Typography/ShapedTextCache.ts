import type { TtfFont } from './TrueType/TtfFont';
import type { GlyphInfo } from './Engine/Api/GlyphInfo';
import { shapeEmbeddedText } from './EmbeddedTextShaping';

// Bound retained state for each immutable font, including streams of unique text.
export class ShapedTextCache {
  private readonly entries = new Map<string, readonly GlyphInfo[]>();
  private glyphCount = 0;

  public get(font: TtfFont, text: string, features?: Readonly<Record<string, number>>): readonly GlyphInfo[] {
    if (text.length > 512) return shapeEmbeddedText(font, text, features);
    const settings = features
      ? Object.keys(features)
          .sort()
          .map(tag => [tag, features[tag]])
      : [];
    const key = JSON.stringify(settings) + text;
    const existing = this.entries.get(key);
    if (existing) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return existing;
    }
    const shaped = shapeEmbeddedText(font, text, features);
    if (shaped.length > 16384) return shaped;
    const glyphs = Object.freeze(shaped.map(g => Object.freeze(g)));
    while (this.entries.size >= 256 || this.glyphCount + glyphs.length > 16384) {
      const oldest = this.entries.keys().next().value!;
      this.glyphCount -= this.entries.get(oldest)!.length;
      this.entries.delete(oldest);
    }
    this.entries.set(key, glyphs);
    this.glyphCount += glyphs.length;
    return glyphs;
  }
}
