// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { Color } from '../ChartHost';

export interface ChartPathCommand {
  op: 'M' | 'L' | 'C' | 'Z';
  values: number[];
}

export interface ChartGradientStop {
  offset: number;
  color: Color;
}

export interface ChartResolvedGradient {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startColor: Color;
  endColor: Color;
  stops?: readonly ChartGradientStop[];
}

/** A resolved visual effect attached to a plan. Sinks realise it natively, or the core expands it into layers. */
export type ChartResolvedEffect =
  | { kind: 'shadow'; color: Color; opacity: number; blur: number; offsetX: number; offsetY: number }
  | { kind: 'glow'; color: Color | undefined; opacity: number; radius: number }
  | { kind: 'gloss'; opacity: number; extent: number };

/** A resolved radial gradient: absolute centre, radius and focal point. */
export interface ChartResolvedRadialGradient {
  cx: number;
  cy: number;
  r: number;
  fx: number;
  fy: number;
  stops: readonly ChartGradientStop[];
}

/**
 * Resolved chart geometry shared by vector backends. At most one of `gradient` and `radial` is set;
 * `color` is the solid fallback.
 */
export interface ChartPathPlan {
  commands: ChartPathCommand[];
  color: Color;
  gradient?: ChartResolvedGradient;
  radial?: ChartResolvedRadialGradient;
  /** Shadow, glow and gloss for the shape. See {@link ChartResolvedEffect}. */
  effects?: readonly ChartResolvedEffect[];
}

export type ChartLineCap = 'butt' | 'round' | 'square';
export type ChartLineJoin = 'miter' | 'round' | 'bevel';

/** Resolved stroked path shared by vector backends. */
export interface ChartStrokePlan {
  commands: ChartPathCommand[];
  color: Color;
  lineWidth: number;
  lineCap?: ChartLineCap;
  lineJoin?: ChartLineJoin;
  miterLimit?: number;
  dashPattern?: readonly number[];
  dashOffset?: number;
  /** Shadow and glow for the stroke (realised as wider translucent strokes beneath it). */
  effects?: readonly ChartResolvedEffect[];
}

/** Pure-vector hatch or dot pattern kind for bar fills. */
export type ChartPatternKind = 'none' | 'diagonal' | 'reverseDiagonal' | 'horizontal' | 'vertical' | 'crosshatch' | 'dots';

/** Pure-vector hatch or dot pattern fill resolved in core for monochrome/PDF/A-1 safety. */
export interface ChartPatternFill {
  /** Pattern geometry kind. */
  kind: ChartPatternKind;
  /** Pattern stroke or dot foreground colour. */
  foreground: Color;
  /** Optional background fill colour behind the pattern. */
  background?: Color;
  /** Spacing between pattern lines or dots in points. */
  spacing?: number;
  /** Stroke width of pattern lines in points. */
  strokeWidth?: number;
}
