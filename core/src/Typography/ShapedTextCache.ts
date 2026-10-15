import { TextFlow } from './TextFlow';
import type { TtfFont } from './TrueType/TtfFont';
import type { GlyphInfo } from './Engine/Api/GlyphInfo';
import { shapeEmbeddedText } from './EmbeddedTextShaping';

// Bound retained state for each immutable font, including streams of unique text.
export class ShapedTextCache {
  private readonly entries = new Map<string, readonly GlyphInfo[]>();
  private glyphCount = 0;

  public get(font: TtfFont, text: string, features?: Readonly<Record<string, number>>): readonly GlyphInfo[] {
    if (!cacheable(text)) return shapeEmbeddedText(font, text, features);
    const key = keyOf(text, features);
    const existing = this.entries.get(key);
    if (existing) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return existing;
    }
    const shaped = shapeEmbeddedText(font, text, features);
    if (shaped.length > 16384) return shaped;
    // A shaped run's glyphs are already a frozen array of frozen records; keep them.
    const glyphs =
      Object.isFrozen(shaped) && shaped.every(Object.isFrozen)
        ? shaped
        : Object.freeze(shaped.map(g => Object.freeze(g)));
    this.add(key, glyphs);
    return glyphs;
  }

  /**
   * Records `glyphs` (a frozen array of frozen records) as the shaping of `text`, under the key
   * {@link get} would use in the current text flow. The caller guarantees they are exactly what
   * shaping would return (see ParagraphWidths.tryGetGlyphs).
   */
  public seed(
    text: string,
    features: Readonly<Record<string, number>> | undefined,
    glyphs: readonly GlyphInfo[]
  ): void {
    if (!cacheable(text) || glyphs.length > 16384) return;
    const key = keyOf(text, features);
    if (!this.entries.has(key)) this.add(key, glyphs);
  }

  private add(key: string, glyphs: readonly GlyphInfo[]): void {
    while (this.entries.size >= 256 || this.glyphCount + glyphs.length > 16384) {
      const oldest = this.entries.keys().next().value!;
      this.glyphCount -= this.entries.get(oldest)!.length;
      this.entries.delete(oldest);
    }
    this.entries.set(key, glyphs);
    this.glyphCount += glyphs.length;
  }
}

function cacheable(text: string): boolean {
  return !(text.length > 512 || (TextFlow.line?.paragraph.length ?? 0) > 512);
}

function keyOf(text: string, features: Readonly<Record<string, number>> | undefined): string {
  // '[]' is JSON.stringify([]), the key prefix for no feature overrides.
  const settings = features
    ? JSON.stringify(
        Object.keys(features)
          .sort()
          .map(tag => [tag, features[tag]])
      )
    : '[]';
  return settings + TextFlow.cacheKey + '|' + text;
}
