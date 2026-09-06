import { Color } from '../../Core/Color';
import { Point } from '../../Core/Point';

export type Paint = SolidPaint | LinearGradientPaint | RadialGradientPaint;

export interface GradientStop {
  readonly offset: number;
  readonly color: Color;
}

/** Paints an area with a single color. */
export class SolidPaint {
  constructor(public readonly color: Color) {}
}

/** Paints an area with colors interpolated along a straight line. */
export class LinearGradientPaint {
  constructor(
    public readonly start: Point,
    public readonly end: Point,
    public readonly stops: readonly GradientStop[]
  ) {}
}

/** Paints an area with colors interpolated outward from a center point. */
export class RadialGradientPaint {
  constructor(
    public readonly center: Point,
    public readonly radius: number,
    public readonly stops: readonly GradientStop[],
    public readonly focal?: Point
  ) {}
}

export function toPaint(paintOrColor: Paint | Color): Paint {
  if (paintOrColor instanceof Color) return new SolidPaint(paintOrColor);
  return paintOrColor;
}
