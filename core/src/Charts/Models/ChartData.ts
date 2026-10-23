import { ChartSeries, type ChartSeriesOptions } from './ChartSeries';
import { AxisOptions, type AxisOptionsOptions } from './AxisOptions';
import { applyOptions } from '../../Core/applyOptions';

/**
 * Data model for chart visualization.
 * Supports single-series and multi-series charts.
 */
/**
 * Settable *property* surface of {@link ChartData}. `series`, `yAxis` and
 * `xAxis` accept nested literals via the constructor.
 */
export const CHART_DATA_OPTION_KEYS = ['title', 'series', 'yAxis', 'xAxis'] as const;

/** Options for {@link ChartData}. */
export type ChartDataOptions = Partial<Pick<ChartData, 'title'>> & {
  /** Series; each may be an instance or an options literal. */
  series?: (ChartSeries | ChartSeriesOptions)[];
  /** Value axis; an instance or an options literal. */
  yAxis?: AxisOptions | AxisOptionsOptions;
  /** Category axis; an instance or an options literal. */
  xAxis?: AxisOptions | AxisOptionsOptions;
};

/** Contains the categories and series rendered by a chart. */
export class ChartData {
  /** Creates chart data, optionally configured in one expression. */
  constructor(options?: ChartDataOptions) {
    const { series, yAxis, xAxis, ...rest } = options ?? {};
    applyOptions(this, rest);
    if (series !== undefined) {
      this.series = series.map(sr => (sr instanceof ChartSeries ? sr : new ChartSeries(sr)));
    }
    if (yAxis !== undefined) this.yAxis = yAxis instanceof AxisOptions ? yAxis : new AxisOptions(yAxis);
    if (xAxis !== undefined) this.xAxis = xAxis instanceof AxisOptions ? xAxis : new AxisOptions(xAxis);
  }

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
