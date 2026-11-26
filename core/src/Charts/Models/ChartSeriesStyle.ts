// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, toLength, type LengthInput } from '../ChartHost';
import { ChartFill, type ChartFillInput } from '../Graphics/ChartFill';
import { toEffects, type ChartEffectInput } from '../Graphics/ChartEffects';
import type { ChartResolvedEffect } from '../Graphics/ChartPathPlan';
import type { ChartCurveMode } from '../Graphics/ChartCurves';
import type { ChartMarkerFill, ChartMarkerShape } from '../Graphics/ChartMarkers';
import type { ChartPatternKind } from '../Graphics/ChartPathPlan';
import { validateErrorBars, type ChartErrorBars } from '../Graphics/ChartAnalysis';

/** Settable properties of {@link ChartSeriesStyle}. */
export const CHART_SERIES_STYLE_OPTION_KEYS = [
  'lineWidth',
  'fillOpacity',
  'markerRadius',
  'showMarkers',
  'stemWidth',
  'dashPattern',
  'curve',
  'markerShape',
  'markerFill',
  'markerHaloWidth',
  'pattern',
  'fill',
  'effects',
  'errorBars',
  'xErrorBars',
] as const;

/** Options for {@link ChartSeriesStyle}. */
export type ChartSeriesStyleOptions = Partial<
  Omit<
    Pick<ChartSeriesStyle, (typeof CHART_SERIES_STYLE_OPTION_KEYS)[number]>,
    'lineWidth' | 'markerRadius' | 'stemWidth' | 'markerHaloWidth' | 'fill' | 'effects'
  >
> & {
  /** Shadow, glow or gloss for this series' marks (a glow on a line is a halo around the stroke). */
  effects?: readonly ChartEffectInput[];
  /** Fill of this series' marks (a colour or a gradient). `color` remains the stroke and legend colour. */
  fill?: ChartFillInput;
  /** Error bars for the series' points. */
  errorBars?: ChartErrorBars;
  /** Horizontal error bars for scatter charts. */
  xErrorBars?: ChartErrorBars;
  /** Line thickness. Accepts a length: `2`, `'0.5mm'`, or `{ value, unit }`. */
  lineWidth?: LengthInput;
  /** Marker radius. Accepts a length: `5`, `'2mm'`, or `{ value, unit }`. */
  markerRadius?: LengthInput;
  /** Stem thickness. Accepts a length: `2`, `'0.5mm'`, or `{ value, unit }`. */
  stemWidth?: LengthInput;
  /** Halo thickness behind markers. */
  markerHaloWidth?: LengthInput;
};

/** Configures the colors and stroke used to render a chart series. */
export class ChartSeriesStyle {
  /** Creates series styling, optionally configured in one expression. */
  constructor(options?: ChartSeriesStyleOptions) {
    applyOptions(this, options);
  }

  private _lineWidth: number = 2;

  /** Line thickness for this series. */
  public get lineWidth(): number {
    return this._lineWidth;
  }
  public set lineWidth(value: LengthInput) {
    this._lineWidth = toLength(value);
  }

  /** Fill opacity for Area charts (0.0 to 1.0, default: 0.3f). */
  fillOpacity: number = 0.3;

  private _markerRadius: number = 5;

  /** Marker radius for Line, Lollipop, and DotPlot charts (default: 5f). */
  public get markerRadius(): number {
    return this._markerRadius;
  }
  public set markerRadius(value: LengthInput) {
    this._markerRadius = toLength(value);
  }

  private _errorBars: ChartErrorBars | undefined;
  /** Error bars drawn at each point of the series (bar, grouped bar, line, area and dot plot charts). */
  get errorBars(): ChartErrorBars | undefined {
    return this._errorBars;
  }
  set errorBars(value: ChartErrorBars | undefined) {
    validateErrorBars(value);
    this._errorBars = value === undefined ? undefined : { ...value };
  }

  private _xErrorBars: ChartErrorBars | undefined;
  /** Horizontal error bars at each point of a scatter series. */
  get xErrorBars(): ChartErrorBars | undefined {
    return this._xErrorBars;
  }
  set xErrorBars(value: ChartErrorBars | undefined) {
    validateErrorBars(value);
    this._xErrorBars = value === undefined ? undefined : { ...value };
  }

  /** Whether to show markers at data points in Line charts (default: true). */
  showMarkers: boolean = true;

  private _stemWidth: number = 2;

  /** Stem width for Lollipop charts (default: 2f). */
  public get stemWidth(): number {
    return this._stemWidth;
  }
  public set stemWidth(value: LengthInput) {
    this._stemWidth = toLength(value);
  }

  /** Optional alternating dash and gap lengths in points for line strokes. */
  dashPattern: readonly number[] | undefined;

  /** Optional curve interpolation override for this series (`linear`, `smooth`, `stepBefore`, `stepAfter`, `stepMiddle`). */
  curve: ChartCurveMode | undefined;

  /** Optional marker shape override (`circle`, `square`, `diamond`, `triangle`). */
  markerShape: ChartMarkerShape | undefined;

  /** Optional marker fill style override (`solid`, `hollow`). */
  markerFill: ChartMarkerFill | undefined;

  private _markerHaloWidth: number | undefined;

  /** Optional outer halo ring width around markers. */
  public get markerHaloWidth(): number | undefined {
    return this._markerHaloWidth;
  }
  public set markerHaloWidth(value: LengthInput | undefined) {
    this._markerHaloWidth = value === undefined ? undefined : toLength(value);
  }

  /** Optional vector hatch/dot pattern fill for monochrome print accessibility. */
  pattern: ChartPatternKind | undefined;

  private _effects: ChartResolvedEffect[] = [];
  /** Shadow, glow or gloss for this series' marks. */
  get effects(): readonly ChartResolvedEffect[] {
    return this._effects;
  }
  set effects(value: readonly ChartEffectInput[] | undefined) {
    this._effects = toEffects(value);
  }

  private _fill: ChartFill | undefined;
  /** Fill of this series' marks (a colour or a gradient). `color` remains the stroke and legend colour. */
  get fill(): ChartFill | undefined {
    return this._fill;
  }
  set fill(value: ChartFillInput | undefined) {
    this._fill = value === undefined ? undefined : ChartFill.from(value);
  }
}
