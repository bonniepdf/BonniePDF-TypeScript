/**
 * An affine transform describing a paint's own coordinate space.
 *
 * Component order matches {@link ICanvas.transform}, PDF's `cm` operator and
 * SVG's `matrix()`, so the same six numbers can be passed through all three
 * without reordering:
 *
 * ```
 * | a  c  e |
 * | b  d  f |
 * | 0  0  1 |
 * ```
 *
 * A gradient's geometry is expressed in its own space, and this maps that space
 * onto the canvas space where the paint is used - the direction SVG's
 * `gradientTransform` and PDF's pattern `/Matrix` both use.
 */
export interface PaintTransform {
  /** Horizontal scale. */
  readonly a: number;
  /** Vertical skew. */
  readonly b: number;
  /** Horizontal skew. */
  readonly c: number;
  /** Vertical scale. */
  readonly d: number;
  /** Horizontal translation. */
  readonly e: number;
  /** Vertical translation. */
  readonly f: number;
}

/** The transform that changes nothing. */
export const IDENTITY_PAINT_TRANSFORM: PaintTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/** Returns `true` for the identity transform, and for `undefined`. */
export function isIdentityPaintTransform(transform: PaintTransform | undefined): boolean {
  if (!transform) return true;
  const { a, b, c, d, e, f } = transform;
  return a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0;
}

/** Determinant; zero means the transform collapses paint space and paints nothing. */
export function paintTransformDeterminant(transform: PaintTransform): number {
  return transform.a * transform.d - transform.b * transform.c;
}

/**
 * The inverse, or `null` when the transform is not invertible.
 *
 * Needed to map a painted region back into paint space - a translucent
 * gradient's soft-mask form has its `/BBox` in paint space once a transform
 * exists.
 */
export function invertPaintTransform(transform: PaintTransform): PaintTransform | null {
  const determinant = paintTransformDeterminant(transform);
  if (determinant === 0 || !Number.isFinite(determinant)) return null;

  const { a, b, c, d, e, f } = transform;
  return {
    a: d / determinant,
    b: -b / determinant,
    c: -c / determinant,
    d: a / determinant,
    e: (c * f - d * e) / determinant,
    f: (b * e - a * f) / determinant,
  };
}

/** Apply a transform to a point. */
export function applyPaintTransform(
  transform: PaintTransform,
  x: number,
  y: number
): { readonly x: number; readonly y: number } {
  return {
    x: transform.a * x + transform.c * y + transform.e,
    y: transform.b * x + transform.d * y + transform.f,
  };
}

/**
 * The axis-aligned box containing the four mapped corners of a box.
 *
 * A rotated or sheared transform turns a rectangle into a parallelogram, so the
 * containing box is what a `/BBox` needs.
 */
export function mapPaintBox(
  transform: PaintTransform,
  box: readonly [number, number, number, number]
): [number, number, number, number] {
  const [x0, y0, x1, y1] = box;
  const corners = [
    applyPaintTransform(transform, x0, y0),
    applyPaintTransform(transform, x1, y0),
    applyPaintTransform(transform, x1, y1),
    applyPaintTransform(transform, x0, y1),
  ];
  return [
    Math.min(...corners.map(p => p.x)),
    Math.min(...corners.map(p => p.y)),
    Math.max(...corners.map(p => p.x)),
    Math.max(...corners.map(p => p.y)),
  ];
}
