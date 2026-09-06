import { applyOptions } from '../../Core/applyOptions';
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

  label: string = '';
  value: number = 0;

  /**
   * Standard .NET format string to use for FormattedValue (e.g., "C0", "P1", "N2").
   * Defaults to "G" (General).
   */
  labelFormat: string = 'G';

  /**
   * Gets the formatted value string based on Value and LabelFormat.
   */
  get formattedValue(): string {
    return this.value.toString();
  }
}
