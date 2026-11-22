// Generated chart source. Do not edit here; the source manifest records its provenance.
import { formatChartNumber } from '../ChartNumberFormat';
import { applyOptions } from '../ChartHost';

/** Role of a data point in a waterfall bridge: `delta`, `total`, or `subtotal`. */
export type ChartDataPointKind = 'delta' | 'total' | 'subtotal';

/** Settable properties of {@link ChartDataPoint} (`formattedValue` is computed). */
export const CHART_DATA_POINT_OPTION_KEYS = ['label', 'value', 'labelFormat', 'x', 'size', 'kind'] as const;

/** Options for {@link ChartDataPoint}. */
export type ChartDataPointOptions = Partial<Pick<ChartDataPoint, (typeof CHART_DATA_POINT_OPTION_KEYS)[number]>>;

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

  /** Gets the formatted value string based on value and labelFormat. */
  get formattedValue(): string {
    return formatChartNumber(this._value, this.labelFormat);
  }
}
