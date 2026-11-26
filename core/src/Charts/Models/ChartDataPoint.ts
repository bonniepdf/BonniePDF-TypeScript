// Generated chart source. Do not edit here; the source manifest records its provenance.
import { formatChartNumber } from '../ChartNumberFormat';
import { applyOptions, Color, toColor, type ColorInput } from '../ChartHost';
import { ChartFill, type ChartFillInput } from '../Graphics/ChartFill';
import type { ChartDateInput } from '../Graphics/ChartDates';

/** Role of a data point in a waterfall bridge: `delta`, `total`, or `subtotal`. */
export type ChartDataPointKind = 'delta' | 'total' | 'subtotal';

/** Settable properties of {@link ChartDataPoint} (`formattedValue` is computed). */
export const CHART_DATA_POINT_OPTION_KEYS = ['label', 'value', 'labelFormat', 'x', 'size', 'kind', 'color', 'fill', 'low', 'high', 'open', 'close', 'samples', 'stats', 'errorPlus', 'errorMinus', 'date'] as const;

/** Precomputed statistics for one box of a box plot. */
export interface ChartBoxStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /** Drawn as a diamond when the chart shows means. */
  mean?: number;
  /** Values beyond the whiskers, drawn as hollow circles. */
  outliers?: readonly number[];
}

/** Options for {@link ChartDataPoint}. */
export type ChartDataPointOptions = Partial<Omit<Pick<ChartDataPoint, (typeof CHART_DATA_POINT_OPTION_KEYS)[number]>, 'color' | 'fill'>> & {
  /** Colour of this point's mark, overriding the series. */
  color?: ColorInput;
  /** Fill of this point's mark (colour or gradient), overriding `color` and the series. */
  fill?: ChartFillInput;
};

/** Represents one named numeric value in a chart series. */
export class ChartDataPoint {
  /** Creates a data point, optionally configured in one expression. */
  constructor(options?: ChartDataPointOptions) {
    applyOptions(this, options);
  }

  /** Category label for the point, shown on the axis or in the legend. */
  label: string = '';

  private _value: number = 0;
  private _hasExplicitValue = false;

  /** Numeric value of the point (optional for WaterfallChart `total`/`subtotal` points). */
  get value(): number {
    return this._value;
  }
  set value(v: number) {
    this._value = v;
    this._hasExplicitValue = true;
  }
  /** @internal */
  get hasExplicitValue(): boolean {
    return this._hasExplicitValue;
  }

  /**
   * Number format for {@link formattedValue}: `G` (default), `F<n>`, `N<n>`, `P<n>` or `K<n>`.
   * Culture-invariant; see {@link formatChartNumber}. Anything else throws when the chart is drawn.
   */
  labelFormat: string = 'G';
  /** @internal */
  get hasExplicitLabelFormat(): boolean {
    return this.labelFormat !== 'G';
  }

  /** Continuous X coordinate for ScatterChart; ignored by categorical charts. */
  x: number | undefined;

  /** Positive bubble size magnitude for ScatterChart; ignored by other charts. */
  size: number | undefined;

  /** Point role for WaterfallChart: `delta` (default), `total`, or `subtotal`. */
  kind: ChartDataPointKind = 'delta';

  private _color: Color | undefined;
  /** Colour of this point's mark (a bar, slice or bubble), overriding the series colour. */
  get color(): Color | undefined {
    return this._color;
  }
  set color(value: ColorInput | undefined) {
    this._color = value === undefined ? undefined : toColor(value);
  }

  private _fill: ChartFill | undefined;
  /** Fill of this point's mark (a colour or a gradient), overriding `color` and the series style. */
  get fill(): ChartFill | undefined {
    return this._fill;
  }
  set fill(value: ChartFillInput | undefined) {
    this._fill = value === undefined ? undefined : ChartFill.from(value);
  }

  /** Lower bound of a range: range area, candlestick, error bars. */
  low: number | undefined;
  /** Upper bound of a range: range area, candlestick, error bars. */
  high: number | undefined;
  /** Opening value of a candlestick. */
  open: number | undefined;
  /** Closing value of a candlestick. */
  close: number | undefined;
  /** Raw observations for a box plot. */
  samples: readonly number[] | undefined;
  /** Precomputed box statistics for a box plot; `samples` wins when both are set. */
  stats: ChartBoxStats | undefined;
  /** When the point happened, on a time axis: an ISO 8601 date or UTC date-time, a `Date`, or epoch milliseconds. */
  date: ChartDateInput | undefined;

  /** Error bar amount above the value (absolute). */
  errorPlus: number | undefined;
  /** Error bar amount below the value (absolute). */
  errorMinus: number | undefined;

  /** Gets the formatted value string based on value and labelFormat. */
  get formattedValue(): string {
    return formatChartNumber(this._value, this.labelFormat);
  }
}
