// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, toColor, type ColorInput } from './ChartHost';
import { toEffects, type ChartEffectInput } from './Graphics/ChartEffects';
import type { ChartResolvedEffect } from './Graphics/ChartPathPlan';

/** Optional endpoints and coordinate scope for a two-stop gradient. */
export interface ChartLinearGradientOptions {
  /** Opaque colour at the value end. */
  startColor?: ColorInput;
  /** Opaque colour at the baseline. */
  endColor?: ColorInput;
  /** Whether coordinates span one bar or the plot. */
  scope?: 'bar' | 'plot';
}
/** Opaque two-stop gradient; endpoints are resolved by the chart engine. */
export class ChartLinearGradient {
  constructor(options: ChartLinearGradientOptions = {}) {
    if (options.startColor !== undefined) this.startColor = options.startColor;
    if (options.endColor !== undefined) this.endColor = options.endColor;
    if (options.scope !== undefined) this.scope = options.scope;
  }
  private _startColor = Color.fromHex('#93c5fd');
  private _endColor = Color.fromHex('#2563eb');
  /** Opaque colour at the value end (default #93c5fd). */
  get startColor(): Color {
    return this._startColor;
  }
  set startColor(value: ColorInput) {
    this._startColor = toColor(value);
  }
  /** Opaque colour at the baseline (default #2563eb). */
  get endColor(): Color {
    return this._endColor;
  }
  set endColor(value: ColorInput) {
    this._endColor = toColor(value);
  }
  /** Coordinates span each bar, or the shared plot value axis. */
  scope: 'bar' | 'plot' = 'bar';
}
/** Optional value-end rounding and opaque linear fill. */
export interface ChartBarStyleOptions {
  /** Finite nonnegative radius in points. Zero keeps square corners. */
  cornerRadius?: number;
  /** Opaque two-stop fill; omitted retains the series colour. */
  gradient?: ChartLinearGradient | ChartLinearGradientOptions;
  /** Shadow, glow or gloss for every bar. */
  effects?: readonly ChartEffectInput[];
}
/** Explicit settings override the theme, including a corner radius of zero. */
export class ChartBarStyle {
  constructor(options: ChartBarStyleOptions = {}) {
    this.cornerRadius = options.cornerRadius;
    if (options.gradient) this.gradient = options.gradient;
    if (options.effects) this.effects = options.effects;
  }
  /** Value-end radius in points. Undefined uses the theme default; zero keeps square ends. */
  cornerRadius?: number;
  private _effects: ChartResolvedEffect[] = [];
  /** Shadow, glow or gloss for every bar. */
  get effects(): readonly ChartResolvedEffect[] {
    return this._effects;
  }
  set effects(value: readonly ChartEffectInput[] | undefined) {
    this._effects = toEffects(value);
  }
  private _gradient?: ChartLinearGradient;
  /** Optional opaque fill, resolved into absolute coordinates before drawing. */
  get gradient(): ChartLinearGradient | undefined {
    return this._gradient;
  }
  set gradient(value: ChartLinearGradient | ChartLinearGradientOptions | undefined) {
    this._gradient =
      value === undefined ? undefined : value instanceof ChartLinearGradient ? value : new ChartLinearGradient(value);
  }
}
