import { Color } from '../../Core/Color';
import { Point } from '../../Core/Point';
import type { PaintTransform } from '../PaintTransform';

/** How an area is filled: a {@link SolidPaint}, a {@link LinearGradientPaint} or a {@link RadialGradientPaint}. */
export type Paint = SolidPaint | LinearGradientPaint | RadialGradientPaint;

/** A colour at a position along a gradient. */
export interface GradientStop {
  /** Position along the gradient, from 0 (start) to 1 (end). */
  readonly offset: number;
  /** The colour at this position. */
  readonly color: Color;
}

/** Paints an area with a single color. */
export class SolidPaint {
  constructor(
    /** The fill colour. */
    public readonly color: Color
  ) {}
}

/**
 * Paints an area with colors interpolated along a straight line.
 *
 * `start` and `end` are in the paint's own coordinate space; `transform`, when
 * given, maps that space onto the canvas space where the paint is used. Omitting
 * it is identity and produces byte-identical output to a paint without one.
 */
export class LinearGradientPaint {
  constructor(
    /** Where the gradient begins, in the paint's own coordinate space. */
    public readonly start: Point,
    /** Where the gradient ends, in the paint's own coordinate space. */
    public readonly end: Point,
    /** The colour stops, ordered by offset. */
    public readonly stops: readonly GradientStop[],
    /** Optional transform mapping the paint's coordinate space onto the canvas. Omitting it is the identity. */
    public readonly transform?: PaintTransform
  ) {}
}

/**
 * Paints an area with colors interpolated outward from a center point.
 *
 * `center`, `radius` and `focal` are in the paint's own coordinate space;
 * `transform`, when given, maps that space onto the canvas space where the paint
 * is used. A non-uniform transform is what makes an elliptical gradient
 * expressible - the paint itself carries a single radius.
 */
export class RadialGradientPaint {
  constructor(
    /** Centre of the outer circle, in the paint's own coordinate space. */
    public readonly center: Point,
    /** Radius of the outer circle. */
    public readonly radius: number,
    /** The colour stops, ordered by offset. */
    public readonly stops: readonly GradientStop[],
    /** Optional focal point where the gradient starts; defaults to the centre. */
    public readonly focal?: Point,
    /** Optional transform mapping the paint's coordinate space onto the canvas. Omitting it is the identity. */
    public readonly transform?: PaintTransform
  ) {}
}

export function toPaint(paintOrColor: Paint | Color): Paint {
  if (paintOrColor instanceof Color) return new SolidPaint(paintOrColor);
  return paintOrColor;
}
