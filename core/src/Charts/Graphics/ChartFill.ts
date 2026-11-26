// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, toColor, type ColorInput } from '../ChartHost';
import type { ChartGradientStop, ChartResolvedGradient, ChartResolvedRadialGradient } from './ChartPathPlan';

/** The box a fill's geometry is relative to: each mark's bounding box, the plot rectangle, or the whole chart. */
export type ChartFillSpace = 'mark' | 'plot' | 'chart';

/** One colour stop of a gradient fill. */
export interface ChartFillStopOptions {
  /** Position along the gradient, `0..1`. */
  offset: number;
  /** Stop colour. Translucent colours are allowed. */
  color: ColorInput;
}

/** A linear gradient fill. */
export interface ChartLinearFillOptions {
  type: 'linear';
  /** Degrees clockwise from the positive x axis, so `90` (the default) runs top to bottom. */
  angle?: number;
  /** Two to sixteen stops with non-decreasing offsets. */
  stops: readonly ChartFillStopOptions[];
  /** The box the gradient spans. Default `mark`. */
  space?: ChartFillSpace;
}

/** A radial gradient fill. */
export interface ChartRadialFillOptions {
  type: 'radial';
  /** Centre as fractions of the box (`[0.5, 0.5]`). */
  center?: readonly [number, number];
  /** Radius as a fraction of half the box diagonal (`1`). */
  radius?: number;
  /** Focal point as fractions of the box; defaults to the centre. */
  focus?: readonly [number, number];
  stops: readonly ChartFillStopOptions[];
  space?: ChartFillSpace;
}

/** Anything accepted where a fill is expected: a colour, a gradient description or a {@link ChartFill}. */
export type ChartFillInput = ColorInput | ChartLinearFillOptions | ChartRadialFillOptions | ChartFill;

/** An axis-aligned rectangle in chart points. */
export interface ChartBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The boxes a fill can be relative to, supplied by the chart. */
export interface ChartFillBoxes {
  mark: ChartBox;
  plot: ChartBox;
  chart: ChartBox;
}

/** What a sink receives for a fill: a fallback colour and at most one resolved gradient. */
export interface ChartResolvedFill {
  color: Color;
  gradient?: ChartResolvedGradient;
  radial?: ChartResolvedRadialGradient;
}

const MAX_STOPS = 16;

function checkStops(stops: readonly ChartFillStopOptions[]): ChartGradientStop[] {
  if (stops.length < 2 || stops.length > MAX_STOPS) throw new RangeError(`A gradient fill needs 2 to ${MAX_STOPS} stops.`);
  let previous = 0;
  return stops.map((s) => {
    if (!Number.isFinite(s.offset) || s.offset < 0 || s.offset > 1) throw new RangeError('Gradient stop offsets must be finite and within 0..1.');
    if (s.offset < previous) throw new RangeError('Gradient stop offsets must not decrease.');
    previous = s.offset;
    return { offset: s.offset, color: toColor(s.color) };
  });
}

function checkPair(name: string, value: readonly [number, number]): [number, number] {
  if (value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) throw new RangeError(`${name} must be two finite fractions.`);
  return [value[0], value[1]];
}

/** Interpolates the stops at `t`, per channel with halves rounded away from zero. */
export function colorAtOffset(stops: readonly ChartGradientStop[], t: number): Color {
  if (t <= stops[0].offset) return stops[0].color;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (t <= b.offset) {
      const span = b.offset - a.offset;
      const f = span === 0 ? 1 : (t - a.offset) / span;
      const byte = (v: number) => Math.round(v * 255);
      const mix = (x: number, y: number) => Math.round(byte(x) + (byte(y) - byte(x)) * f);
      return new Color(mix(a.color.scR, b.color.scR), mix(a.color.scG, b.color.scG), mix(a.color.scB, b.color.scB), mix(a.color.scA, b.color.scA));
    }
  }
  return stops[stops.length - 1].color;
}

/**
 * An immutable fill: a solid colour, or a linear or radial gradient with up to sixteen stops.
 * Gradient geometry is relative to a {@link ChartFillSpace} and resolved to absolute coordinates by the chart.
 */
export class ChartFill {
  private constructor(
    readonly kind: 'solid' | 'linear' | 'radial',
    readonly color: Color,
    readonly stops: readonly ChartGradientStop[],
    readonly angle: number,
    readonly center: readonly [number, number],
    readonly radius: number,
    readonly focus: readonly [number, number] | undefined,
    readonly space: ChartFillSpace
  ) {}

  /** A solid colour fill. */
  static solid(color: ColorInput): ChartFill {
    return new ChartFill('solid', toColor(color), [], 90, [0.5, 0.5], 1, undefined, 'mark');
  }

  /** Normalises any accepted fill input. */
  static from(input: ChartFillInput): ChartFill {
    if (input instanceof ChartFill) return input;
    if (typeof input === 'object' && input !== null && 'type' in input) {
      const space = input.space ?? 'mark';
      if (!['mark', 'plot', 'chart'].includes(space)) throw new RangeError("Fill space must be 'mark', 'plot' or 'chart'.");
      const stops = checkStops(input.stops);
      const middle = colorAtOffset(stops, 0.5);
      if (input.type === 'linear') {
        const angle = input.angle ?? 90;
        if (!Number.isFinite(angle)) throw new RangeError('A linear fill angle must be finite.');
        return new ChartFill('linear', middle, stops, angle, [0.5, 0.5], 1, undefined, space);
      }
      if (input.type === 'radial') {
        const radius = input.radius ?? 1;
        if (!Number.isFinite(radius) || radius <= 0) throw new RangeError('A radial fill radius must be positive and finite.');
        const center = checkPair('Radial fill center', input.center ?? [0.5, 0.5]);
        const focus = input.focus === undefined ? undefined : checkPair('Radial fill focus', input.focus);
        return new ChartFill('radial', middle, stops, 90, center, radius, focus, space);
      }
      throw new RangeError("A fill type must be 'linear' or 'radial'.");
    }
    return ChartFill.solid(input as ColorInput);
  }

  /** Resolves to absolute coordinates for a mark. Sinks without radial support receive {@link ChartResolvedFill.color}. */
  resolve(boxes: ChartFillBoxes): ChartResolvedFill {
    if (this.kind === 'solid') return { color: this.color };
    const box = boxes[this.space];
    if (this.kind === 'linear') {
      const rad = (this.angle * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const half = (Math.abs(box.width * dx) + Math.abs(box.height * dy)) / 2;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      return {
        color: this.color,
        gradient: {
          startX: cx - dx * half,
          startY: cy - dy * half,
          endX: cx + dx * half,
          endY: cy + dy * half,
          startColor: this.stops[0].color,
          endColor: this.stops[this.stops.length - 1].color,
          stops: this.stops,
        },
      };
    }
    const cx = box.x + this.center[0] * box.width;
    const cy = box.y + this.center[1] * box.height;
    const focus = this.focus ?? this.center;
    return {
      color: this.color,
      radial: {
        cx,
        cy,
        r: (this.radius * Math.hypot(box.width, box.height)) / 2,
        fx: box.x + focus[0] * box.width,
        fy: box.y + focus[1] * box.height,
        stops: this.stops,
      },
    };
  }
}
