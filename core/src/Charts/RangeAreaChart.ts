// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { CARTESIAN_CHART_OPTION_KEYS, CartesianChartBase, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, type ICanvas, type Point } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

/** Settable properties declared by {@link RangeAreaChart} itself. */
export const RANGE_AREA_CHART_OWN_OPTION_KEYS = ['fillOpacity', 'showBoundaries', 'lineWidth'] as const;

/** The full option surface, bases included. */
export const RANGE_AREA_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...RANGE_AREA_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link RangeAreaChart}. */
export type RangeAreaChartOptions = CartesianChartOptions & Partial<Pick<RangeAreaChart, (typeof RANGE_AREA_CHART_OWN_OPTION_KEYS)[number]>>;

/** A band between a low and a high value per category: confidence intervals, forecasts and min-max envelopes. Points carry `low` and `high`. */
export class RangeAreaChart extends CartesianChartBase {
  /** Opacity of the band fill, `0..1`. */
  fillOpacity: number = 0.25;
  /** Draw a line along each edge of the band. */
  showBoundaries: boolean = true;
  /** Width of the boundary lines in points. */
  lineWidth: number = 1.5;

  constructor(options?: RangeAreaChartOptions) {
    super();
    this.showValueLabels = false;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override get supportsLogAxis(): boolean {
    return true;
  }

  protected override get defaultAutoScale(): boolean {
    return true;
  }
  protected override get defaultIncludeZero(): boolean {
    return false;
  }

  private bounds(point: ChartSeries['dataPoints'][number]): { low: number; high: number } {
    const { low, high } = point;
    if (low === undefined || high === undefined) throw new RangeError('Range area points need low and high.');
    if (!(low <= high)) throw new RangeError('Range area points must satisfy low <= high.');
    return { low, high };
  }

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    let min = Infinity;
    let max = -Infinity;
    for (const s of data.series) {
      for (const p of s.dataPoints) {
        const b = this.bounds(p);
        min = Math.min(min, b.low);
        max = Math.max(max, b.high);
      }
    }
    return min <= max ? [min, max] : undefined;
  }

  protected override drawSeriesElements(
    canvas: ICanvas,
    data: ChartData,
    series: ChartSeries,
    _coordinates: Point[],
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    if (!(this.fillOpacity >= 0 && this.fillOpacity <= 1)) throw new RangeError('Range area fillOpacity must be from 0 to 1.');
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const count = series.dataPoints.length;
    if (count < 2) return;
    const categories = data.series.reduce((m, s) => Math.max(m, s.dataPoints.length), 0);
    const slot = (vertical ? chartAreaWidth : chartAreaHeight) / Math.max(1, categories);
    const axisStart = vertical ? this._plotLeft : baselineY - chartAreaHeight;
    const h = (v: number): number => {
      const f = this.fraction(v);
      return vertical ? baselineY - f * chartAreaHeight : this._plotLeft + f * chartAreaWidth;
    };
    const at = (i: number, value: number): [number, number] => {
      const c = axisStart + slot * (i + 0.5);
      return vertical ? [c, h(value)] : [h(value), c];
    };
    const color = this.resolveSeriesColor(series);
    const highs = series.dataPoints.map((p, i) => at(i, this.bounds(p).high));
    const lows = series.dataPoints.map((p, i) => at(i, this.bounds(p).low));
    const line = (pts: [number, number][]): ChartPathCommand[] => pts.map((p, i) => ({ op: i === 0 ? 'M' : 'L', values: [p[0], p[1]] }));
    const band: ChartPathCommand[] = [...line(highs), ...[...lows].reverse().map((p) => ({ op: 'L' as const, values: [p[0], p[1]] })), { op: 'Z', values: [] }];
    if (this.fillOpacity > 0) fillChartPath(canvas, { commands: band, color: color.withAlpha(this.fillOpacity) });
    if (this.showBoundaries) {
      strokeChartPath(canvas, { commands: line(highs), color, lineWidth: this.lineWidth, lineJoin: 'round', miterLimit: 10 });
      strokeChartPath(canvas, { commands: line(lows), color, lineWidth: this.lineWidth, lineJoin: 'round', miterLimit: 10 });
    }
  }
}
