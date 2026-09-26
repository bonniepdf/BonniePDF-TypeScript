// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { Paint } from './Paint';

/**
 * Path fill rule. String-literal union rather than an enum to match
 * BonniePDF's TypeScript spelling exactly; the .NET side of this package
 * uses a real enum, matching BonniePDF's C# spelling. Same values, idiomatic
 * per language — that divergence is intentional.
 */
export type FillRule = 'nonzero' | 'evenodd';

export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'miter' | 'round' | 'bevel';

/**
 * Stroke parameters. The paint travels *inside* the style, matching the
 * shipped `ICanvas.strokeCurrentPath(style)` signature.
 *
 * Note on `miterLimit`: left optional, with no default applied here. The two
 * BonniePDF implementations do not currently agree on the default (see
 * AGENTS.md, "Known upstream discrepancy"), so this package declines to pick
 * one and passes through only what the SVG actually specified. An SVG that
 * omits `stroke-miterlimit` should leave this `undefined`, not 4 and not 10.
 */
export interface StrokeStyle {
  paint: Paint;
  width: number;
  dashPattern?: readonly number[];
  dashOffset?: number;
  lineCap?: LineCap;
  lineJoin?: LineJoin;
  miterLimit?: number;
}
