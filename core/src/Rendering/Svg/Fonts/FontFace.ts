// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/**
 * The font seam: what the engine needs from a font to lay out and outline text.
 *
 * Text is imported as outlines, never as live text, so the engine needs glyph
 * shapes and advances - and nothing else. It never loads or chooses a font on
 * its own. Callers supply fonts through a `FontProvider`; at fold-in, BonniePDF's
 * registered fonts fill it, exactly as `VectorSink` is filled by its `ICanvas`.
 *
 * Unlike `VectorSink` this is not a copy of a BonniePDF interface, because
 * BonniePDF has nothing to copy: it embeds and subsets TrueType fonts but has
 * never decoded a glyph outline. `TrueTypeFace` in this folder is the reference
 * implementation, and whether its decoding moves upstream into BonniePDF's
 * `TtfFont` at fold-in is an open decision.
 */

/**
 * One command of a glyph outline, in font units with y pointing up - the
 * TrueType convention. Quadratic, because TrueType outlines are.
 */
export type GlyphSegment =
  | { readonly kind: 'move'; readonly x: number; readonly y: number }
  | { readonly kind: 'line'; readonly x: number; readonly y: number }
  | { readonly kind: 'quad'; readonly cx: number; readonly cy: number; readonly x: number; readonly y: number }
  | { readonly kind: 'close' };

export interface FontFace {
  /** The family name, for diagnostics only. */
  readonly family: string;
  /** Font units per em: a glyph at font size `s` is scaled by `s / unitsPerEm`. */
  readonly unitsPerEm: number;
  /** The glyph for a Unicode code point, or 0 when the font has none. */
  glyphIndex(codePoint: number): number;
  /** Horizontal advance of a glyph, in font units. */
  advanceWidth(glyph: number): number;
  /**
   * The pen adjustment between two adjacent glyphs, in font units - negative to
   * tighten. Zero for a face without kerning.
   */
  kerning(left: number, right: number): number;
  /** The glyph's outline, in font units. Empty for a blank glyph such as a space. */
  outline(glyph: number): readonly GlyphSegment[];
}

/**
 * Supplies fonts by family name.
 *
 * Called with one name at a time - the engine walks a `font-family` list itself,
 * in order - and with the CSS generic names (`sans-serif`, `serif`, `monospace`,
 * `cursive`, `fantasy`, `system-ui`) as they appear, so the provider decides what
 * each generic means. Matching is the provider's own and should be exact: the
 * engine deliberately applies no heuristic of the "Helvetica Neue is close to
 * Arial" kind, because a guessed font is a silent substitution.
 *
 * A provider may return a face that only approximates the request - a regular
 * face for a bold request, say. The engine draws whatever it is given and does
 * not synthesise bold or italic.
 */
export interface FontProvider {
  resolve(family: string, weight: number, italic: boolean): FontFace | undefined;
}
