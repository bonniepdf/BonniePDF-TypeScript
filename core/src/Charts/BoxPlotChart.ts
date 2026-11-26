// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { ChartSeries } from './Models/ChartSeries';
import { CARTESIAN_CHART_OPTION_KEYS, CartesianChartBase, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, Color, Point, TextAlignment, type ICanvas } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';
import { drawChartMarker } from './Graphics/ChartMarkers';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { applyChartTemplate } from './Graphics/ChartTemplate';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

/** Settable properties declared by {@link BoxPlotChart} itself. */
export const BOX_PLOT_CHART_OWN_OPTION_KEYS = ['whiskers', 'showMean', 'boxWidthRatio', 'valueLabelTemplate'] as const;

/** The full option surface, bases included. */
export const BOX_PLOT_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...BOX_PLOT_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link BoxPlotChart}. */
export type BoxPlotChartOptions = CartesianChartOptions & Partial<Pick<BoxPlotChart, (typeof BOX_PLOT_CHART_OWN_OPTION_KEYS)[number]>>;

/** The five-number summary of one box, with its outliers. @internal */
export interface BoxSummary {
  low: number;
  q1: number;
  median: number;
  q3: number;
  high: number;
  mean: number | undefined;
  outliers: number[];
}

/** Linear-interpolation quantile of sorted values (Hyndman and Fan type 7). @internal */
export function quantileType7(sorted: readonly number[], p: number): number {
  const n = sorted.length;
  const h = (n - 1) * p;
  const f = Math.floor(h);
  return f + 1 < n ? sorted[f] + (h - f) * (sorted[f + 1] - sorted[f]) : sorted[f];
}

/** A box plot: the distribution of each category as a box, whiskers and outliers. Points carry `samples` or `stats`. */
export class BoxPlotChart extends CartesianChartBase {
  /** `tukey` (default): the furthest samples within 1.5 x IQR of the box. `minMax`, or `percentile`: the 5th and 95th percentiles. */
  whiskers: 'tukey' | 'minMax' | 'percentile' = 'tukey';
  /** Draw each mean as a diamond. */
  showMean: boolean = false;
  /** The fraction of a category slot that the boxes of its series fill. */
  boxWidthRatio: number = 0.5;
  /** The label above each box when value labels are shown; `{min}`, `{q1}`, `{median}`, `{q3}`, `{max}` and `{mean}` are replaced. */
  valueLabelTemplate: string = '{median}';

  constructor(options?: BoxPlotChartOptions) {
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

  /** Summarises one point. @internal */
  summarize(point: ChartDataPoint): BoxSummary {
    if (point.samples !== undefined && point.samples.length > 0) {
      const sorted = [...point.samples].sort((a, b) => a - b);
      if (sorted.some((v) => !Number.isFinite(v))) throw new RangeError('Box plot samples must be finite.');
      const q1 = quantileType7(sorted, 0.25);
      const median = quantileType7(sorted, 0.5);
      const q3 = quantileType7(sorted, 0.75);
      let lowLimit = sorted[0];
      let highLimit = sorted[sorted.length - 1];
      if (this.whiskers === 'tukey') {
        lowLimit = q1 - 1.5 * (q3 - q1);
        highLimit = q3 + 1.5 * (q3 - q1);
      } else if (this.whiskers === 'percentile') {
        lowLimit = quantileType7(sorted, 0.05);
        highLimit = quantileType7(sorted, 0.95);
      }
      const inside = sorted.filter((v) => v >= lowLimit && v <= highLimit);
      const low = this.whiskers === 'percentile' ? lowLimit : inside[0];
      const high = this.whiskers === 'percentile' ? highLimit : inside[inside.length - 1];
      return {
        low,
        q1,
        median,
        q3,
        high,
        mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
        outliers: this.whiskers === 'minMax' ? [] : sorted.filter((v) => v < lowLimit || v > highLimit),
      };
    }
    if (point.stats !== undefined) {
      const s = point.stats;
      if (!(s.min <= s.q1 && s.q1 <= s.median && s.median <= s.q3 && s.q3 <= s.max)) throw new RangeError('Box plot stats must satisfy min <= q1 <= median <= q3 <= max.');
      return { low: s.min, q1: s.q1, median: s.median, q3: s.q3, high: s.max, mean: s.mean, outliers: [...(s.outliers ?? [])] };
    }
    throw new RangeError('Every box plot point needs samples or stats.');
  }

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    let min = Infinity;
    let max = -Infinity;
    for (const series of data.series) {
      for (const p of series.dataPoints) {
        const s = this.summarize(p);
        for (const v of [s.low, s.high, ...s.outliers]) {
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      }
    }
    return min <= max ? [min, max] : undefined;
  }

  private slotOf(data: ChartData, series: ChartSeries, index: number, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): { centre: number; thickness: number } {
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const categories = data.series.reduce((m, s) => Math.max(m, s.dataPoints.length), 0);
    const axisStart = vertical ? this._plotLeft : baselineY - chartAreaHeight;
    const slot = (vertical ? chartAreaWidth : chartAreaHeight) / Math.max(1, categories);
    const seriesCount = data.series.length;
    const thickness = (slot * this.boxWidthRatio) / seriesCount;
    const s = data.series.indexOf(series);
    return { centre: axisStart + index * slot + (slot - slot * this.boxWidthRatio) / 2 + s * thickness + thickness / 2, thickness };
  }

  private heightOf(value: number, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): number {
    const f = this.fraction(value);
    return this.orientation === ChartOrientation.Horizontal ? this._plotLeft + f * chartAreaWidth : baselineY - f * chartAreaHeight;
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
    if (!(this.boxWidthRatio > 0 && this.boxWidthRatio <= 1)) throw new RangeError('boxWidthRatio must be above 0 and at most 1.');
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const at = (c: number, h: number): Point => (vertical ? new Point(c, h) : new Point(h, c));
    const color = this.resolveSeriesColor(series);
    const bg = this.effectiveBackgroundColor ?? Color.white;
    series.dataPoints.forEach((point, i) => {
      const s = this.summarize(point);
      const { centre, thickness } = this.slotOf(data, series, i, chartAreaWidth, chartAreaHeight, baselineY);
      const h = (v: number): number => this.heightOf(v, chartAreaWidth, chartAreaHeight, baselineY);
      const line = (a: Point, b: Point, width: number): void => canvas.drawLine(a.x, a.y, b.x, b.y, color, width);
      line(at(centre, h(s.low)), at(centre, h(s.q1)), 1.5);
      line(at(centre, h(s.q3)), at(centre, h(s.high)), 1.5);
      line(at(centre - thickness / 4, h(s.low)), at(centre + thickness / 4, h(s.low)), 1.5);
      line(at(centre - thickness / 4, h(s.high)), at(centre + thickness / 4, h(s.high)), 1.5);
      const corners = [at(centre - thickness / 2, h(s.q3)), at(centre + thickness / 2, h(s.q3)), at(centre + thickness / 2, h(s.q1)), at(centre - thickness / 2, h(s.q1))];
      const commands: ChartPathCommand[] = corners.map((p, k) => ({ op: k === 0 ? 'M' : 'L', values: [p.x, p.y] }));
      commands.push({ op: 'Z', values: [] });
      fillChartPath(canvas, { commands, color: color.withAlpha(0.25) });
      strokeChartPath(canvas, { commands, color, lineWidth: 1.5, lineJoin: 'miter' });
      line(at(centre - thickness / 2, h(s.median)), at(centre + thickness / 2, h(s.median)), 2.5);
      if (this.showMean && s.mean !== undefined) {
        const m = at(centre, h(s.mean));
        drawChartMarker(canvas, m.x, m.y, 4, color, 'diamond', 'solid', 1.5, bg, 1.5);
      }
      for (const v of s.outliers) {
        const o = at(centre, h(v));
        drawChartMarker(canvas, o.x, o.y, 3, color, 'circle', 'hollow', 0, bg, 1.25);
      }
    });
  }

  protected override drawValueLabels(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, _topY: number): void {
    if (!this.showValueLabels) return;
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const family = this.effectiveFontFamily;
    for (const series of data.series) {
      series.dataPoints.forEach((point, i) => {
        const s = this.summarize(point);
        const { centre } = this.slotOf(data, series, i, chartAreaWidth, chartAreaHeight, baselineY);
        const text = applyChartTemplate(this.valueLabelTemplate, { min: s.low, q1: s.q1, median: s.median, q3: s.q3, max: s.high, mean: s.mean ?? 0 });
        const h = this.heightOf(s.high, chartAreaWidth, chartAreaHeight, baselineY);
        if (vertical) this.drawPlacedLabel(canvas, centre, h - 6 - this.labelFontSize, text, this.appearance.legendTextColor, this.labelFontSize, family, TextAlignment.Center);
        else this.drawPlacedLabel(canvas, h + 6, centre - this.labelFontSize / 2, text, this.appearance.legendTextColor, this.labelFontSize, family, TextAlignment.Left);
      });
    }
  }
}
