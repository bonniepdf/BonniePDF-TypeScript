// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, toLength, type LengthInput } from '../ChartHost';

/**
 * Series-specific styling options for fine-grained control over appearance.
 */
/** Settable properties of {@link ChartSeriesStyle}. */
export const CHART_SERIES_STYLE_OPTION_KEYS = [
  'lineWidth',
  'fillOpacity',
  'markerRadius',
  'showMarkers',
  'stemWidth',
] as const;

/** Options for {@link ChartSeriesStyle}. */
export type ChartSeriesStyleOptions = Partial<
  Omit<
    Pick<ChartSeriesStyle, (typeof CHART_SERIES_STYLE_OPTION_KEYS)[number]>,
    'lineWidth' | 'markerRadius' | 'stemWidth'
  >
> & {
  /** Line thickness. Accepts a length: `2`, `'0.5mm'`, or `{ value, unit }`. */
  lineWidth?: LengthInput;
  /** Marker radius. Accepts a length: `5`, `'2mm'`, or `{ value, unit }`. */
  markerRadius?: LengthInput;
  /** Stem thickness. Accepts a length: `2`, `'0.5mm'`, or `{ value, unit }`. */
  stemWidth?: LengthInput;
};

/** Configures the colors and stroke used to render a chart series. */
export class ChartSeriesStyle {
  /**
   * Line width for Line and Area charts (default: 2f).
   */
  /** Creates series styling, optionally configured in one expression. */
  constructor(options?: ChartSeriesStyleOptions) {
    applyOptions(this, options);
  }

  private _lineWidth: number = 2;

  /**
   * Line thickness for this series.
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }`.
   */
  public get lineWidth(): number {
    return this._lineWidth;
  }
  public set lineWidth(value: LengthInput) {
    this._lineWidth = toLength(value);
  }

  /**
   * Fill opacity for Area charts (0.0 to 1.0, default: 0.3f).
   */
  fillOpacity: number = 0.3;

  private _markerRadius: number = 5;

  /**
   * Marker radius for Line, Lollipop, and DotPlot charts (default: 5f).
   *
   * Accepts a length: a number of points, `'2mm'`, or `{ value, unit }`.
   */
  public get markerRadius(): number {
    return this._markerRadius;
  }
  public set markerRadius(value: LengthInput) {
    this._markerRadius = toLength(value);
  }

  /**
   * Whether to show circular markers at data points in Line charts (default: true).
   */
  showMarkers: boolean = true;

  private _stemWidth: number = 2;

  /**
   * Stem width for Lollipop charts (default: 2f).
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }`.
   */
  public get stemWidth(): number {
    return this._stemWidth;
  }
  public set stemWidth(value: LengthInput) {
    this._stemWidth = toLength(value);
  }
}
