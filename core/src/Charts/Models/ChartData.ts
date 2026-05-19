import { ChartSeries } from './ChartSeries';
import { AxisOptions } from './AxisOptions';

/**
 * Data model for chart visualization.
 * Supports single-series and multi-series charts.
 */
export class ChartData {
  /**
   * Chart title displayed at the top
   */
  title: string = '';

  /**
   * Multiple data series to display in the chart.
   * Each series can have its own name, color, and data points.
   */
  series: ChartSeries[] = [];

  /**
   * Y-axis (vertical) configuration
   */
  yAxis: AxisOptions = new AxisOptions();

  /**
   * X-axis (horizontal) configuration
   */
  xAxis: AxisOptions = new AxisOptions();
}
