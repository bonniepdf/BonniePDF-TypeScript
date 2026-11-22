// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartSeries, type ChartSeriesOptions } from './ChartSeries';
import { AxisOptions, type AxisOptionsOptions } from './AxisOptions';
import { applyOptions } from '../ChartHost';

/** Settable property surface of {@link ChartData}. */
export const CHART_DATA_OPTION_KEYS = ['title', 'subtitle', 'series', 'yAxis', 'xAxis'] as const;

/** Options for {@link ChartData}. */
export type ChartDataOptions = Partial<Pick<ChartData, 'title' | 'subtitle'>> & {
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
      this.series = series.map((sr) => (sr instanceof ChartSeries ? sr : new ChartSeries(sr)));
    }
    if (yAxis !== undefined) this.yAxis = yAxis instanceof AxisOptions ? yAxis : new AxisOptions(yAxis);
    if (xAxis !== undefined) this.xAxis = xAxis instanceof AxisOptions ? xAxis : new AxisOptions(xAxis);
  }

  /** Chart title displayed at the top */
  title: string = '';

  /** Optional subtitle displayed beneath the chart title */
  subtitle: string = '';

  /** Multiple data series to display in the chart. */
  series: ChartSeries[] = [];

  /** Y-axis (vertical) configuration */
  yAxis: AxisOptions = new AxisOptions();

  /** X-axis (horizontal) configuration */
  xAxis: AxisOptions = new AxisOptions();
}
