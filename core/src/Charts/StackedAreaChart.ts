// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, Point, type ICanvas } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { buildCurveCommands, reverseCurveCommands, type ChartCurveMode } from './Graphics/ChartCurves';
import { valueFraction } from './Graphics/ChartValueScale';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';
import { fillChartPath } from './Graphics/ChartVector';
import type { ChartStackMode } from './StackedBarChart';

/** Settable properties declared by {@link StackedAreaChart} itself. */
export const STACKED_AREA_CHART_OWN_OPTION_KEYS = [
  'mode',
  'curve',
  'defaultFillOpacity',
  'defaultLineWidth',
] as const;

/** The full option surface, bases included. */
export const STACKED_AREA_CHART_OPTION_KEYS = [
  ...CARTESIAN_CHART_OPTION_KEYS,
  ...STACKED_AREA_CHART_OWN_OPTION_KEYS,
] as const;

/** Options for {@link StackedAreaChart}. */
export type StackedAreaChartOptions = CartesianChartOptions &
  Partial<Pick<StackedAreaChart, (typeof STACKED_AREA_CHART_OWN_OPTION_KEYS)[number]>>;

/** Renders multiple nonnegative series as cumulative stacked area bands. */
export class StackedAreaChart extends CartesianChartBase {
  /** Stacking mode: `absolute` (default) or 100% normalized `percent`. */
  mode: ChartStackMode = 'absolute';
  /** Curve interpolation mode for stacked area boundaries. */
  curve: ChartCurveMode = 'linear';
  /** Default fill opacity for stacked area bands (`0..1`). */
  defaultFillOpacity: number = 0.75;
  /** Default stroke width for upper boundary lines in points. */
  defaultLineWidth: number = 1.5;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }
  protected override get defaultAutoScale(): boolean {
    return true;
  }
  protected override get supportsInlineLegend(): boolean {
    return true;
  }

  constructor(options?: StackedAreaChartOptions) {
    super();
    this.autoLayout = true;
    this.showValueLabels = false;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  private categoryCount(data: ChartData): number {
    return data.series.reduce((max, s) => Math.max(max, s.dataPoints.length), 0);
  }

  private computeCumulative(data: ChartData): number[][] {
    const count = this.categoryCount(data);
    const totals: number[] = new Array(count).fill(0);
    for (const s of data.series) {
      for (let i = 0; i < count; i++) {
        const v = i < s.dataPoints.length ? s.dataPoints[i].value : 0;
        if (v < 0) throw new RangeError('StackedAreaChart requires nonnegative values.');
        totals[i] += v;
      }
    }
    const layers: number[][] = [];
    const running: number[] = new Array(count).fill(0);
    for (const s of data.series) {
      const layer: number[] = new Array(count);
      for (let i = 0; i < count; i++) {
        const raw = i < s.dataPoints.length ? s.dataPoints[i].value : 0;
        const val = this.mode === 'percent' ? (totals[i] > 0 ? (raw / totals[i]) * 100 : 0) : raw;
        running[i] += val;
        layer[i] = running[i];
      }
      layers.push(layer);
    }
    return layers;
  }

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    const count = this.categoryCount(data);
    if (count === 0) return undefined;
    if (this.mode === 'percent') return [0, 100];
    const layers = this.computeCumulative(data);
    const top = layers[layers.length - 1];
    const max = Math.max(0, ...top);
    return [0, max];
  }

  protected override resolveValueScale(data: ChartData): void {
    if (this.mode === 'percent') {
      this._effectiveMin = 0;
      this._effectiveMax = 100;
      this._effectiveStepCount = data.yAxis.stepCount > 0 ? data.yAxis.stepCount : 5;
      this._effectiveTickFormat = data.yAxis.valueFormat ?? 'N0';
      return;
    }
    super.resolveValueScale(data);
  }

  private toPoints(values: readonly number[], chartAreaWidth: number, chartAreaHeight: number, baselineY: number, topY: number): Point[] {
    const n = values.length;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const pts: Point[] = [];
    const slot = (horizontal ? chartAreaHeight : chartAreaWidth) / n;
    for (let i = 0; i < n; i++) {
      const f = valueFraction(values[i], this._effectiveMin, this._effectiveMax);
      if (horizontal) pts.push(new Point(this._plotLeft + f * chartAreaWidth, topY + i * slot + slot / 2));
      else pts.push(new Point(this._plotLeft + i * slot + slot / 2, baselineY - f * chartAreaHeight));
    }
    return pts;
  }

  protected override drawAllSeries(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    const count = this.categoryCount(data);
    if (count < 2) return;
    const layers = this.computeCumulative(data);
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const zeroPoints = this.toPoints(new Array(count).fill(0), chartAreaWidth, chartAreaHeight, baselineY, topY);
    let prevCmds = buildCurveCommands(zeroPoints, this.curve, horizontal, true);

    for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
      const series = data.series[sIdx];
      const upperPoints = this.toPoints(layers[sIdx], chartAreaWidth, chartAreaHeight, baselineY, topY);
      const upperCmds = buildCurveCommands(upperPoints, this.curve, horizontal, true);
      const lowerReversed = reverseCurveCommands(prevCmds);
      const bandCmds: ChartPathCommand[] = [...upperCmds, ...lowerReversed, { op: 'Z', values: [] }];

      const color = this.resolveSeriesColor(series);
      const opacity = series.style?.fillOpacity && series.style.fillOpacity !== 0.3 ? series.style.fillOpacity : this.defaultFillOpacity;
      const lineWidth = series.style?.lineWidth && series.style.lineWidth !== 2 ? series.style.lineWidth : this.defaultLineWidth;

      fillChartPath(canvas, { commands: bandCmds, color: color.withAlpha(opacity) });
      if (lineWidth > 0) {
        this.drawSeriesLine(canvas, upperPoints, color, lineWidth, this.curve, this.resolveSeriesDashPattern(series, sIdx));
      }
      prevCmds = upperCmds;
    }
  }

  protected override drawSeriesElements(): void {}
}
