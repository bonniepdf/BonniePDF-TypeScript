// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { SinkColor, SinkPoint } from './Geometry';

/**
 * Paint sources a sink can fill or stroke with.
 *
 * Mirrors the shape of BonniePDF's shipped `Paint` union
 * (`core/src/Drawing/Paint/Paint.ts`, `BonniePDF/Drawing/Paint.cs`) so the
 * adapter is a field-for-field map. Keep the three cases and their members in
 * step with that file; see AGENTS.md for why drift here is expensive.
 */
export type Paint = SolidPaint | LinearGradientPaint | RadialGradientPaint;

/**
 * An affine transform describing a paint's own coordinate space.
 *
 * Copied from BonniePDF's `PaintTransform`, in the component order
 * `ICanvas.transform`, PDF's `cm` and SVG's `matrix()` all share.
 */
export interface PaintTransform {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

/** One stop in a gradient ramp. */
export interface GradientStop {
  /** Position along the ramp, 0..1. */
  readonly offset: number;
  readonly color: SinkColor;
}

/** Paints an area with a single colour. */
export class SolidPaint {
  readonly kind = 'solid' as const;
  readonly color: SinkColor;

  constructor(color: SinkColor) {
    this.color = color;
  }
}

/**
 * Paints an area with colours interpolated along a straight line.
 *
 * `start` and `end` are in the paint's own space; `transform` maps that space
 * onto the sink's. Mirrors BonniePDF's shipped `LinearGradientPaint`, which
 * gained the same member so that a sheared ramp is expressible at all.
 */
export class LinearGradientPaint {
  readonly kind = 'linear' as const;
  readonly start: SinkPoint;
  readonly end: SinkPoint;
  readonly stops: readonly GradientStop[];
  readonly transform: PaintTransform | undefined;

  constructor(
    start: SinkPoint,
    end: SinkPoint,
    stops: readonly GradientStop[],
    transform?: PaintTransform
  ) {
    this.start = start;
    this.end = end;
    this.stops = stops;
    this.transform = transform;
  }
}

/**
 * Paints an area with colours interpolated outward from a centre point.
 *
 * A non-uniform `transform` is what makes an elliptical gradient expressible -
 * the paint itself carries a single radius.
 */
export class RadialGradientPaint {
  readonly kind = 'radial' as const;
  readonly center: SinkPoint;
  readonly radius: number;
  readonly stops: readonly GradientStop[];
  readonly focal: SinkPoint | undefined;
  readonly transform: PaintTransform | undefined;

  constructor(
    center: SinkPoint,
    radius: number,
    stops: readonly GradientStop[],
    focal?: SinkPoint,
    transform?: PaintTransform
  ) {
    this.center = center;
    this.radius = radius;
    this.stops = stops;
    this.focal = focal;
    this.transform = transform;
  }
}
