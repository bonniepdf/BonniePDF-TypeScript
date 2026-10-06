import { type PaintTransform, IDENTITY_PAINT_TRANSFORM } from '../Drawing/PaintTransform';

/** @internal Compose page-coordinate transforms before bounding rectangles. */
export function composeElementTransform(parent: PaintTransform | undefined, child: PaintTransform): PaintTransform {
  const p = parent ?? IDENTITY_PAINT_TRANSFORM;
  return {
    a: p.a * child.a + p.c * child.b,
    b: p.b * child.a + p.d * child.b,
    c: p.a * child.c + p.c * child.d,
    d: p.b * child.c + p.d * child.d,
    e: p.a * child.e + p.c * child.f + p.e,
    f: p.b * child.e + p.d * child.f + p.f,
  };
}
