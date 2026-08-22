/**
 * Shared geometry for the elliptical path primitives.
 *
 * PDF has no arc operator, so an ellipse is four cubic Béziers. The control-point
 * offset is the standard circular approximation constant, kappa = 4/3·(√2 − 1);
 * the maximum radial error is under 0.02% of the radius, which is well below what
 * any rasteriser resolves.
 *
 * Every canvas builds its ellipses from this one function so `PdfCanvas` and
 * `SvgCanvas` emit the same curve for the same input, and so the .NET
 * implementation has a single set of numbers to mirror.
 */

/** 4/3·(√2 − 1) - the circular Bézier approximation constant. */
export const KAPPA = 0.5522847498;

/** One cubic segment: two control points and an end point. */
export interface EllipseSegment {
  readonly c1x: number;
  readonly c1y: number;
  readonly c2x: number;
  readonly c2y: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Decomposes an axis-aligned ellipse into a start point and four cubic segments,
 * walking from the rightmost point in the direction of increasing y.
 */
export function ellipseToBeziers(
  cx: number,
  cy: number,
  rx: number,
  ry: number
): { startX: number; startY: number; segments: readonly EllipseSegment[] } {
  const kx = rx * KAPPA;
  const ky = ry * KAPPA;
  return {
    startX: cx + rx,
    startY: cy,
    segments: [
      { c1x: cx + rx, c1y: cy + ky, c2x: cx + kx, c2y: cy + ry, x: cx, y: cy + ry },
      { c1x: cx - kx, c1y: cy + ry, c2x: cx - rx, c2y: cy + ky, x: cx - rx, y: cy },
      { c1x: cx - rx, c1y: cy - ky, c2x: cx - kx, c2y: cy - ry, x: cx, y: cy - ry },
      { c1x: cx + kx, c1y: cy - ry, c2x: cx + rx, c2y: cy - ky, x: cx + rx, y: cy },
    ],
  };
}
