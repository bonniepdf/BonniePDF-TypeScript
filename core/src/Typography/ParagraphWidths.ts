import { FontMetrics } from './FontMetrics';
import { primaryCovers } from './TextRunShaper';
import type { TtfFont } from './TrueType/TtfFont';
import type { GlyphInfo } from './Engine/Api/GlyphInfo';
import { FontError } from './Engine/Api/FontError';

/**
 * Widths of a paragraph's candidate lines, from one shaping of the whole paragraph.
 *
 * Word wrapping measures every candidate line, and measuring shapes the text: a paragraph of
 * n words used to be shaped n times, each time from its start. Shaping the paragraph once gives
 * the same width for a span whose two ends are boundaries the shaper reports as safe to break,
 * because shaping either side of a safe boundary separately gives the same glyphs. Any other
 * span is reported as unknown, and the caller measures it by shaping, as before. Widths are
 * therefore exactly what {@link FontMetrics.getStringWidth} returns.
 * @internal
 */
export class ParagraphWidths {
  // A shaping of text from a line start that is not a safe boundary (see tryGetWidth).
  private window: ParagraphWidths | null = null;
  private windowStart = -1;

  private constructor(
    private readonly text: string,
    private readonly fontIdentifier: string,
    private readonly features: Readonly<Record<string, number>> | undefined,
    /** The font the paragraph was shaped with. */
    readonly font: TtfFont,
    private readonly glyphs: readonly GlyphInfo[],
    private readonly firstGlyph: Int32Array,
    private readonly advanceBefore: Float64Array,
    private readonly safe: Uint8Array,
    private readonly fontSize: number
  ) {}

  /**
   * Shapes `text` once, or returns null when its widths cannot come from one shaping: text
   * outside printable ASCII (it takes other shaping paths), a font measured by width table, a
   * font that does not cover the text, or a paragraph the shaper rejects.
   */
  static tryCreate(
    text: string,
    fontIdentifier: string,
    fontSize: number,
    features?: Readonly<Record<string, number>>
  ): ParagraphWidths | null {
    if (text.length < 2) return null;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 0x20 || c > 0x7e) return null;
    }
    const font = FontMetrics.resolveShapingFont(fontIdentifier).font;
    if (!font || !primaryCovers(text, font)) return null;

    let glyphs: readonly GlyphInfo[];
    try {
      glyphs = font.shape(text, features);
    } catch (error) {
      // A limit or an unsupported feature on the whole paragraph; shorter lines may still shape.
      if (error instanceof FontError) return null;
      throw error;
    }

    const firstGlyph = new Int32Array(text.length + 1);
    const advanceBefore = new Float64Array(text.length + 1);
    const safe = new Uint8Array(text.length + 1);
    let total = 0,
      previousCluster = -1;
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      if (glyph.cluster < previousCluster || glyph.cluster >= text.length) return null;
      if (glyph.cluster !== previousCluster) {
        // The first glyph of each cluster carries whether a break before it is safe.
        advanceBefore[glyph.cluster] = total;
        firstGlyph[glyph.cluster] = i;
        safe[glyph.cluster] = glyph.cluster === 0 || !glyph.unsafeToBreak ? 1 : 0;
        previousCluster = glyph.cluster;
      }
      total += glyph.advanceX;
    }
    advanceBefore[text.length] = total;
    firstGlyph[text.length] = glyphs.length;
    safe[text.length] = 1;
    return new ParagraphWidths(text, fontIdentifier, features, font, glyphs, firstGlyph, advanceBefore, safe, fontSize);
  }

  /**
   * The width of `text[start..end)`, as {@link FontMetrics.getStringWidth} measures it, when it
   * can be read from a shaping; otherwise undefined. A span between two safe boundaries is read
   * from the paragraph's shaping. A line that starts at an unsafe boundary (a kerned space, say)
   * gets its own shaping of the text from that start, and its candidate ends are read from that
   * under the same rule. Only an unsafe end leaves the span unknown.
   */
  tryGetWidth(start: number, end: number): number | undefined {
    if (start >= end) return undefined;
    if (this.safe[start]) {
      if (!this.safe[end]) return undefined;
      // The same arithmetic as getKernedStringWidth: an exact integer sum, then scaled.
      return ((this.advanceBefore[end] - this.advanceBefore[start]) * this.fontSize) / this.font.unitsPerEm;
    }
    return this.windowAt(start, end)?.tryGetWidth(0, end - start);
  }

  /**
   * The glyphs of `text[start..end)` shaped on its own, with clusters relative to `start`,
   * when they can be read from a shaping under the same rule as {@link tryGetWidth}.
   */
  tryGetGlyphs(start: number, end: number): readonly GlyphInfo[] | undefined {
    if (start >= end) return undefined;
    if (!this.safe[start]) return this.windowAt(start, end)?.tryGetGlyphs(0, end - start);
    if (!this.safe[end]) return undefined;
    const first = this.firstGlyph[start],
      last = this.firstGlyph[end];
    const line: GlyphInfo[] = new Array(last - first);
    for (let i = first; i < last; i++) {
      // A cluster's source length runs to the next cluster, which at the line's end is `end` in
      // both shapings, so every field carries over with the cluster rebased.
      line[i - first] = Object.freeze({ ...this.glyphs[i], cluster: this.glyphs[i].cluster - start });
    }
    return Object.freeze(line);
  }

  // The shaping of text from an unsafe line start, covering end; created once per line start.
  private windowAt(start: number, end: number): ParagraphWidths | null {
    if (start !== this.windowStart) {
      // Long enough for a few lines: a later end falls back, or starts a new window.
      const length = Math.min(this.text.length - start, Math.max(256, 4 * (end - start)));
      this.window = ParagraphWidths.tryCreate(
        this.text.substr(start, length),
        this.fontIdentifier,
        this.fontSize,
        this.features
      );
      this.windowStart = start;
    }
    return this.window && end - start <= this.window.text.length ? this.window : null;
  }
}
