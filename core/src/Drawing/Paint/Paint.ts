import { Color } from '../../Core/Color';
import { Point } from '../../Core/Point';
import type { PaintTransform } from '../PaintTransform';

export type Paint = SolidPaint | LinearGradientPaint | RadialGradientPaint;

export interface GradientStop {
  readonly offset: number;
  readonly color: Color;
}

/** Paints an area with a single color. */
export class SolidPaint {
  constructor(public readonly color: Color) {}
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
    public readonly start: Point,
    public readonly end: Point,
    public readonly stops: readonly GradientStop[],
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
    public readonly center: Point,
    public readonly radius: number,
    public readonly stops: readonly GradientStop[],
    public readonly focal?: Point,
    public readonly transform?: PaintTransform
  ) {}
}

export function toPaint(paintOrColor: Paint | Color): Paint {
  if (paintOrColor instanceof Color) return new SolidPaint(paintOrColor);
  return paintOrColor;
}
