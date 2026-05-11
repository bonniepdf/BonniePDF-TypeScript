/**
 * Represents a single data point in a chart
 */
export class ChartDataPoint {
  label: string = "";
  value: number = 0;

  /**
   * Standard .NET format string to use for FormattedValue (e.g., "C0", "P1", "N2").
   * Defaults to "G" (General).
   */
  labelFormat: string = "G";

  /**
   * Gets the formatted value string based on Value and LabelFormat.
   */
  get formattedValue(): string {
    return this.value.toString();
  }
}
