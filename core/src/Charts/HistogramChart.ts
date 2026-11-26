// Generated chart source. Do not edit here; the source manifest records its provenance.
import { CHART_BASE_OPTION_KEYS } from './ChartBase';
import { BarChart, type BarChartOptions } from './BarChart';
import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { applyOptions, TextAlignment } from './ChartHost';
import type { ICanvas } from './ChartHost';
import { formatChartNumber } from './ChartNumberFormat';
import { computeNiceScale } from './Graphics/ChartValueScale';

/** Settable properties declared by {@link HistogramChart} itself. */
export const HISTOGRAM_CHART_OWN_OPTION_KEYS = ['bins', 'binWidth', 'binCount', 'normalize', 'cumulativeLine'] as const;

/** The full option surface, base included. */
export const HISTOGRAM_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...HISTOGRAM_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link HistogramChart}. */
export type HistogramChartOptions = BarChartOptions & Partial<Pick<HistogramChart, (typeof HISTOGRAM_CHART_OWN_OPTION_KEYS)[number]>>;

/** One bin of a histogram. @internal */
export interface HistogramBin {
  lower: number;
  upper: number;
  counts: number[];
}

/**
 * A histogram: raw observations (the `value` of each point of each series) grouped into bins and drawn as touching bars.
 * Several series draw as translucent overlapping distributions.
 */
export class HistogramChart extends BarChart {
  /** Explicit ascending bin edges (at least two). Values outside them are dropped and counted in {@link outOfRangeCount}. */
  bins: readonly number[] | undefined;
  /** Width of every bin. */
  binWidth: number | undefined;
  /** Number of equal bins between the data minimum and maximum. */
  binCount: number | undefined;
  /** `count` (default), `percent` of the observations, or `density` (count over total times bin width). */
  normalize: 'count' | 'percent' | 'density' = 'count';

  /** Draw each series' cumulative share, from 0 to 100 %, as a line over the bars with its own axis on the right. */
  cumulativeLine: boolean = false;

  private _cumulative: number[][] = [];
  private _outOfRange = 0;
  /** Observations the last draw dropped because they fell outside explicit {@link bins}. */
  get outOfRangeCount(): number {
    return this._outOfRange;
  }

  constructor(options?: HistogramChartOptions) {
    super();
    this.barWidthRatio = 1;
    this.showValueLabels = false;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override get defaultAutoScale(): boolean {
    return true;
  }

  protected override getExtraRightMargin(): number {
    return this.cumulativeLine ? 44 : 0;
  }

  protected override drawAfterSeries(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): void {
    if (!this.cumulativeLine) return;
    const family = this.effectiveFontFamily;
    for (let p = 0; p <= 100; p += 25) {
      canvas.drawText(this._plotLeft + chartAreaWidth + 8, baselineY - (p / 100) * chartAreaHeight - 5, `${p}%`, this.appearance.axisColor, 10, family, TextAlignment.Left);
    }
    data.series.forEach((series, s) => {
      const color = this.resolveSeriesColor(series).withAlpha(1);
      const values = this._cumulative[s] ?? [];
      const slot = chartAreaWidth / Math.max(1, values.length);
      const pts = values.map((v, i) => ({ x: this._plotLeft + slot * (i + 0.5), y: baselineY - (v / 100) * chartAreaHeight }));
      for (let i = 1; i < pts.length; i++) canvas.drawLine(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, color, 2);
      for (const p of pts) canvas.fillCircle(p.x, p.y, 3, color);
    });
  }

  /** The bins for `values`, with the per-series counts. @internal */
  computeBins(data: ChartData): HistogramBin[] {
    const all = data.series.flatMap((s) => s.dataPoints.map((p) => p.value)).filter((v) => Number.isFinite(v));
    this._outOfRange = 0;
    if (all.length === 0) return [];
    let edges: number[];
    if (this.bins !== undefined) {
      if (this.bins.length < 2) throw new RangeError('Histogram bins need at least two edges.');
      for (let i = 1; i < this.bins.length; i++) if (!(this.bins[i] > this.bins[i - 1])) throw new RangeError('Histogram bins must be strictly ascending.');
      edges = [...this.bins];
    } else {
      const lo = Math.min(...all);
      const hi = Math.max(...all);
      if (this.binWidth !== undefined) {
        if (!(this.binWidth > 0)) throw new RangeError('Histogram binWidth must be positive.');
        const start = Math.floor(lo / this.binWidth) * this.binWidth;
        edges = [start];
        while (edges[edges.length - 1] <= hi && edges.length < 10001) edges.push(start + edges.length * this.binWidth);
      } else if (this.binCount !== undefined) {
        if (!(this.binCount >= 1) || !Number.isInteger(this.binCount)) throw new RangeError('Histogram binCount must be a positive integer.');
        const span = hi > lo ? hi - lo : 1;
        edges = Array.from({ length: this.binCount + 1 }, (_, i) => lo + (span * i) / this.binCount!);
      } else {
        const k = Math.ceil(Math.log2(all.length)) + 1;
        const nice = computeNiceScale(lo, hi, k, false, 0);
        edges = Array.from({ length: nice.stepCount + 1 }, (_, i) => nice.minValue + nice.stepSize * i);
      }
    }
    const nb = edges.length - 1;
    const width = (edges[nb] - edges[0]) / nb;
    const uniform = this.bins === undefined;
    const bins: HistogramBin[] = edges.slice(0, nb).map((lower, i) => ({ lower, upper: edges[i + 1], counts: data.series.map(() => 0) }));
    data.series.forEach((series, s) => {
      for (const p of series.dataPoints) {
        const v = p.value;
        if (!Number.isFinite(v)) continue;
        if (v < edges[0] || v > edges[nb]) {
          this._outOfRange++;
          continue;
        }
        let index: number;
        if (uniform) index = Math.min(nb - 1, Math.max(0, Math.floor((v - edges[0]) / width + 1e-9)));
        else {
          let lo = 0;
          let hi = nb;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (edges[mid + 1] <= v) lo = mid + 1;
            else hi = mid;
          }
          index = Math.min(nb - 1, lo);
        }
        bins[index].counts[s]++;
      }
    });
    return bins;
  }

  override draw(canvas: ICanvas, data: ChartData = this.data): void {
    const bins = this.computeBins(data);
    const totals = data.series.map((_, s) => bins.reduce((n, b) => n + b.counts[s], 0));
    this._cumulative = data.series.map((_, s) => {
      let run = 0;
      return bins.map((b) => {
        run += b.counts[s];
        return totals[s] > 0 ? (run / totals[s]) * 100 : 0;
      });
    });
    const out = new ChartData({ title: data.title, subtitle: data.subtitle });
    out.xAxis = data.xAxis;
    out.yAxis = data.yAxis;
    const multiple = data.series.length > 1;
    out.series = data.series.map((src, s) => {
      const series = new ChartSeries({ name: src.name });
      if (src.hasColor) series.color = multiple ? src.color.withAlpha(0.5) : src.color;
      series.style = src.style;
      series.dataPoints = bins.map((b) => {
        const count = b.counts[s];
        const value = this.normalize === 'percent' ? (totals[s] > 0 ? (count / totals[s]) * 100 : 0) : this.normalize === 'density' ? (totals[s] > 0 ? count / (totals[s] * (b.upper - b.lower)) : 0) : count;
        return new ChartDataPoint({ label: `${formatChartNumber(b.lower, 'G')}–${formatChartNumber(b.upper, 'G')}`, value });
      });
      return series;
    });
    super.draw(canvas, out);
  }
}
