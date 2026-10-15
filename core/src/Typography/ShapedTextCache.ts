import { TextFlow } from './TextFlow';
import type { TtfFont } from './TrueType/TtfFont';
import type { GlyphRun } from './Engine/Api/GlyphRun';
import { shapeEmbeddedText } from './EmbeddedTextShaping';

// Bound retained state for each immutable font, including streams of unique text.
export class ShapedTextCache {
  private readonly entries = new Map<string, GlyphRun>();
  private glyphCount = 0;

  public get(font: TtfFont, text: string, features?: Readonly<Record<string, number>>): GlyphRun {
    if (!cacheable(text)) return shapeEmbeddedText(font, text, features);
    const key = keyOf(text, features);
    const existing = this.entries.get(key);
    if (existing) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return existing;
    }
    const shaped = shapeEmbeddedText(font, text, features);
    if (shaped.count > 16384) return shaped;
    this.add(key, shaped);
    return shaped;
  }

  /**
   * Records `glyphs` (an immutable packed run) as the shaping of `text`, under the key
   * {@link get} would use in the current text flow. The caller guarantees they are exactly what
   * shaping would return (see ParagraphWidths.tryGetGlyphs).
   */
  public seed(text: string, features: Readonly<Record<string, number>> | undefined, glyphs: GlyphRun): void {
    if (!cacheable(text) || glyphs.count > 16384) return;
    const key = keyOf(text, features);
    if (!this.entries.has(key)) this.add(key, glyphs);
  }

  private add(key: string, glyphs: GlyphRun): void {
    while (this.entries.size >= 256 || this.glyphCount + glyphs.count > 16384) {
      const oldest = this.entries.keys().next().value!;
      this.glyphCount -= this.entries.get(oldest)!.count;
      this.entries.delete(oldest);
    }
    this.entries.set(key, glyphs);
    this.glyphCount += glyphs.count;
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
