// Generated chart source. Do not edit here; the source manifest records its provenance.
import { formatChartNumber } from '../ChartNumberFormat';
import { applyOptions } from '../ChartHost';
/**
 * Represents a single data point in a chart
 */
/** Settable properties of {@link ChartDataPoint} (`formattedValue` is computed). */
export const CHART_DATA_POINT_OPTION_KEYS = ['label', 'value', 'labelFormat'] as const;

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
  /** Numeric value of the point. */
  value: number = 0;

  /**
   * Number format for {@link formattedValue}: `G` (default), `F<n>`, `N<n>` or `P<n>`.
   * Culture-invariant; see {@link formatChartNumber}. Anything else throws when the chart is drawn.
   */
  labelFormat: string = 'G';

  /**
   * Gets the formatted value string based on Value and LabelFormat.
   */
  get formattedValue(): string {
    return formatChartNumber(this.value, this.labelFormat);
  }
}
