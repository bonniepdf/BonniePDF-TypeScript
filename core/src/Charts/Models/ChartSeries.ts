import { Color } from '../../Core/Color';
import { ChartDataPoint } from './ChartDataPoint';

/**
 * Series-specific styling options for fine-grained control over appearance.
 */
export class ChartSeriesStyle {
  /**
   * Line width for Line and Area charts (default: 2f).
   */
  lineWidth: number = 2;

  /**
   * Fill opacity for Area charts (0.0 to 1.0, default: 0.3f).
   */
  fillOpacity: number = 0.3;

  /**
   * Marker radius for Line, Lollipop, and DotPlot charts (default: 5f).
   */
  markerRadius: number = 5;

  /**
   * Whether to show circular markers at data points in Line charts (default: true).
   */
  showMarkers: boolean = true;

  /**
   * Stem width for Lollipop charts (default: 2f).
   */
  stemWidth: number = 2;
}

/**
 * Represents a single data series in a chart.
 * Similar to datasets in Chart.js or series in ApexCharts.
 */
export class ChartSeries {
  /**
   * Series name/label (e.g., "Year Sales", "Product A", "Q1 Revenue")
   * Used in legends and tooltips.
   */
  name: string = "";

  /**
   * Color to use for this series (lines, bars, markers, etc.)
   */
  color: Color = Color.fromHex("#4f46e5");

  /**
   * Data points for this series.
   * Each data point contains a label, value, and optional format string.
   */
  dataPoints: ChartDataPoint[] = [];

  /**
   * Series-specific styling options.
   * Allows customization of line width, opacity, marker size, etc.
   */
  style: ChartSeriesStyle = new ChartSeriesStyle();
}
