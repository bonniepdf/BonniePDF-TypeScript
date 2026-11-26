// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartBarStyle, type ChartBarStyleOptions } from './ChartBarStyle';
import { drawChartBar } from './Graphics/ChartBars';
import { buildCurveCommands } from './Graphics/ChartCurves';
import { drawChartMarker } from './Graphics/ChartMarkers';
import { checkValueRange, computeNiceScale, originFraction, valueFraction } from './Graphics/ChartValueScale';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';
import { applyChartAffixes, formatChartNumber } from './ChartNumberFormat';
import { AxisOptions, type AxisOptionsOptions } from './Models/AxisOptions';
import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions, CartesianChartBase } from './CartesianChartBase';
import { applyOptions, Color, Point, type ICanvas, TextAlignment } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';

/** Settable properties declared by {@link ComboChart} itself. */
export const COMBO_CHART_OWN_OPTION_KEYS = ['secondaryYAxis', 'barWidthRatio', 'groupGapRatio', 'barStyle'] as const;

/** The full option surface, bases included. */
export const COMBO_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...COMBO_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link ComboChart}. */
export type ComboChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<ComboChart, (typeof COMBO_CHART_OWN_OPTION_KEYS)[number]>, 'secondaryYAxis' | 'barStyle'>> & {
    /** Optional right-hand secondary Y axis options for series bound to `secondary`. */
    secondaryYAxis?: AxisOptions | AxisOptionsOptions;
    /** Corner rounding and gradient style applied to bar series. */
    barStyle?: ChartBarStyle | ChartBarStyleOptions;
  };

/** Renders mixed bar, area, and line series on primary and optional secondary Y axes. */
export class ComboChart extends CartesianChartBase {
  private _secondaryYAxis: AxisOptions | undefined;
  private _barStyle = new ChartBarStyle();
  private _secMin = 0;
  private _secMax = 100;
  private _secTickFormat = 'N0';
  private _hasSecondary = false;

  /** Optional right-hand secondary Y axis options for series bound to `secondary`. */
  get secondaryYAxis(): AxisOptions | undefined {
    return this._secondaryYAxis;
  }
  set secondaryYAxis(value: AxisOptions | AxisOptionsOptions | undefined) {
    this._secondaryYAxis = value === undefined ? undefined : value instanceof AxisOptions ? value : new AxisOptions(value);
  }

  /** Corner rounding and gradient style applied to bar series. */
  get barStyle(): ChartBarStyle {
    return this._barStyle;
  }
  set barStyle(value: ChartBarStyle | ChartBarStyleOptions) {
    this._barStyle = value instanceof ChartBarStyle ? value : new ChartBarStyle(value);
  }

  /** Fraction of each category slot occupied by bar series (`0..1`). */
  barWidthRatio: number = 0.6;
  /** Relative gap between grouped bar series within a category (`0..1`). */
  groupGapRatio: number = 0.1;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }
  protected override get defaultAutoScale(): boolean {
    return true;
  }
  protected override get defaultClipToPlotArea(): boolean {
    return true;
  }
  protected override get supportsInlineLegend(): boolean {
    return true;
  }

  constructor(options?: ComboChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /** The lowest and highest value a point spans: its `low` and `high` for a range series, else its value. */
  private extent(series: ChartSeries, dp: ChartSeries['dataPoints'][number]): [number, number] {
    if (series.seriesType !== 'range') return [dp.value, dp.value];
    if (dp.low === undefined || dp.high === undefined) throw new RangeError('Range series points need low and high.');
    if (!(dp.low <= dp.high)) throw new RangeError('Range series points must satisfy low <= high.');
    return [dp.low, dp.high];
  }

  private usesSecondary(data: ChartData): boolean {
    return this._secondaryYAxis !== undefined || data.series.some((s) => s.valueAxis === 'secondary');
  }

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    let min = Infinity;
    let max = -Infinity;
    for (const s of data.series) {
      if (s.valueAxis === 'secondary') continue;
      for (const dp of s.dataPoints) {
        const [lo, hi] = this.extent(s, dp);
        if (lo < min) min = lo;
        if (hi > max) max = hi;
      }
    }
    return min <= max ? [min, max] : super.getValueDataRange(data);
  }

  protected override resolveValueScale(data: ChartData): void {
    if (this.orientation === ChartOrientation.Horizontal) {
      throw new RangeError('ComboChart only supports vertical orientation.');
    }
    super.resolveValueScale(data);
    this._hasSecondary = this.usesSecondary(data);
    if (!this._hasSecondary) return;

    const secAxis = this._secondaryYAxis ?? new AxisOptions({ autoScale: true });
    const useAuto = secAxis.autoScale || !secAxis.hasMaxValue;
    if (useAuto) {
      let min = Infinity;
      let max = -Infinity;
      for (const s of data.series) {
        if (s.valueAxis !== 'secondary') continue;
        for (const dp of s.dataPoints) {
          const [lo, hi] = this.extent(s, dp);
          if (lo < min) min = lo;
          if (hi > max) max = hi;
        }
      }
      if (min <= max) {
        const nice = computeNiceScale(
          min,
          max,
          this._effectiveStepCount,
          secAxis.includeZero ?? true,
          secAxis.headroom ?? (this.showValueLabels ? 0.05 : 0),
          secAxis.hasMinValue ? secAxis.minValue : undefined,
          secAxis.hasMaxValue ? secAxis.maxValue : undefined
        );
        this._secMin = nice.minValue;
        this._secMax = nice.maxValue;
        this._secTickFormat = secAxis.valueFormat ?? nice.autoFormat;
        checkValueRange(this._secMin, this._secMax);
        return;
      }
    }
    this._secMin = secAxis.minValue;
    this._secMax = secAxis.maxValue;
    this._secTickFormat = secAxis.valueFormat ?? 'N0';
    checkValueRange(this._secMin, this._secMax);
  }

  protected override getExtraRightMargin(canvas: ICanvas, _data: ChartData): number {
    if (!this._hasSecondary) return 0;
    const secAxis = this._secondaryYAxis ?? new AxisOptions();
    const steps = this._effectiveStepCount > 0 ? this._effectiveStepCount : 5;
    const stepVal = (this._secMax - this._secMin) / steps;
    const family = this.effectiveFontFamily;
    let maxW = 0;
    for (let i = 0; i <= steps; i++) {
      const lbl = applyChartAffixes(formatChartNumber(this._secMin + i * stepVal, this._secTickFormat), secAxis.prefix, secAxis.suffix, secAxis.negativeStyle);
      const w = canvas.measureText(lbl, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family).width;
      if (w > maxW) maxW = w;
    }
    return Math.ceil(maxW + 18 + (secAxis.legend !== '' ? 22 : 0));
  }

  private seriesCoords(series: ChartSeries, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): Point[] {
    const n = series.dataPoints.length;
    if (n === 0) return [];
    const min = series.valueAxis === 'secondary' ? this._secMin : this._effectiveMin;
    const max = series.valueAxis === 'secondary' ? this._secMax : this._effectiveMax;
    const slot = chartAreaWidth / n;
    return series.dataPoints.map((dp, i) => {
      const x = this._plotLeft + i * slot + slot / 2;
      const y = baselineY - valueFraction(dp.value, min, max) * chartAreaHeight;
      return new Point(x, y);
    });
  }

  protected override drawAllSeries(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    // 0. Range series, beneath everything else
    for (const series of data.series) {
      if (series.seriesType !== 'range' || series.dataPoints.length < 2) continue;
      const min = series.valueAxis === 'secondary' ? this._secMin : this._effectiveMin;
      const max = series.valueAxis === 'secondary' ? this._secMax : this._effectiveMax;
      const slot = chartAreaWidth / series.dataPoints.length;
      const at = (i: number, v: number): [number, number] => [this._plotLeft + i * slot + slot / 2, baselineY - valueFraction(v, min, max) * chartAreaHeight];
      const highs = series.dataPoints.map((p, i) => at(i, this.extent(series, p)[1]));
      const lows = series.dataPoints.map((p, i) => at(i, this.extent(series, p)[0]));
      const color = this.resolveSeriesColor(series);
      const edge = (pts: [number, number][]): ChartPathCommand[] => pts.map((p, i) => ({ op: i === 0 ? 'M' : 'L', values: [p[0], p[1]] }));
      const band: ChartPathCommand[] = [...edge(highs), ...[...lows].reverse().map((p) => ({ op: 'L' as const, values: [p[0], p[1]] })), { op: 'Z', values: [] }];
      fillChartPath(canvas, { commands: band, color: color.withAlpha(series.style?.fillOpacity ?? 0.3) });
      strokeChartPath(canvas, { commands: edge(highs), color, lineWidth: 1.5, lineJoin: 'round', miterLimit: 10 });
      strokeChartPath(canvas, { commands: edge(lows), color, lineWidth: 1.5, lineJoin: 'round', miterLimit: 10 });
    }

    // 1. Area series
    for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
      const series = data.series[sIdx];
      if (series.seriesType !== 'area') continue;
      const coords = this.seriesCoords(series, chartAreaWidth, chartAreaHeight, baselineY);
      if (coords.length < 2) continue;
      const min = series.valueAxis === 'secondary' ? this._secMin : this._effectiveMin;
      const max = series.valueAxis === 'secondary' ? this._secMax : this._effectiveMax;
      const origin = baselineY - originFraction(min, max) * chartAreaHeight;
      const color = this.resolveSeriesColor(series);
      const opacity = series.style?.fillOpacity ?? 0.3;
      const curve = series.style?.curve ?? 'linear';
      const curveCmds = buildCurveCommands(coords, curve, false, false);
      fillChartPath(canvas, {
        commands: [
          { op: 'M', values: [coords[0].x, origin] },
          ...curveCmds,
          { op: 'L', values: [coords[coords.length - 1].x, origin] },
          { op: 'Z', values: [] },
        ],
        color: color.withAlpha(opacity),
      });
      this.drawSeriesLine(canvas, coords, color, series.style?.lineWidth ?? 2, curve, this.resolveSeriesDashPattern(series, sIdx));
    }

    // 2. Bar series (grouped across bar series)
    const barSeries = data.series.filter((s) => s.seriesType === 'bar');
    for (let bIdx = 0; bIdx < barSeries.length; bIdx++) {
      const series = barSeries[bIdx];
      const count = series.dataPoints.length;
      if (count === 0) continue;
      const coords = this.seriesCoords(series, chartAreaWidth, chartAreaHeight, baselineY);
      const min = series.valueAxis === 'secondary' ? this._secMin : this._effectiveMin;
      const max = series.valueAxis === 'secondary' ? this._secMax : this._effectiveMax;
      const origin = baselineY - originFraction(min, max) * chartAreaHeight;
      const color = this.resolveSeriesColor(series);
      const totalGroupSpace = chartAreaWidth / count;
      const groupPadding = totalGroupSpace * this.groupGapRatio;
      const barGroupSize = totalGroupSpace - groupPadding;
      const thickness = (barGroupSize / barSeries.length) * this.barWidthRatio;

      for (let i = 0; i < count; i++) {
        const p = coords[i];
        const groupStart = this._plotLeft + i * totalGroupSpace + groupPadding / 2;
        const barX = groupStart + bIdx * (barGroupSize / barSeries.length) + (barGroupSize / barSeries.length - thickness) / 2;
        drawChartBar(canvas, barX, p.y, thickness, origin - p.y, color, this.barStyle, this.appearance, false, this._plotLeft, topY, chartAreaWidth, chartAreaHeight);
      }
    }

    // 3. Line series + markers
    for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
      const series = data.series[sIdx];
      if (series.seriesType !== 'line') continue;
      const coords = this.seriesCoords(series, chartAreaWidth, chartAreaHeight, baselineY);
      const color = this.resolveSeriesColor(series);
      const lw = series.style?.lineWidth ?? 2;
      const curve = series.style?.curve ?? 'linear';
      this.drawSeriesLine(canvas, coords, color, lw, curve, this.resolveSeriesDashPattern(series, sIdx));
      if (series.style?.showMarkers ?? true) {
        const radius = series.style?.markerRadius ?? 4;
        const shape = this.resolveSeriesMarkerShape(series, sIdx, 'circle');
        const fill = series.style?.markerFill ?? 'hollow';
        const halo = series.style?.markerHaloWidth ?? 0;
        const bg = this.effectiveBackgroundColor ?? Color.white;
        for (const p of coords) {
          drawChartMarker(canvas, p.x, p.y, radius, color, shape, fill, halo, bg, lw);
        }
      }
    }
  }

  protected override drawAfterSeries(
    canvas: ICanvas,
    _data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    if (!this._hasSecondary) return;
    const secAxis = this._secondaryYAxis ?? new AxisOptions();
    const steps = this._effectiveStepCount > 0 ? this._effectiveStepCount : 5;
    const stepH = chartAreaHeight / steps;
    const stepVal = (this._secMax - this._secMin) / steps;
    const rightX = this._plotLeft + chartAreaWidth;
    const family = this.effectiveFontFamily;

    for (let i = 0; i <= steps; i++) {
      const y = baselineY - i * stepH;
      const lbl = applyChartAffixes(formatChartNumber(this._secMin + i * stepVal, this._secTickFormat), secAxis.prefix, secAxis.suffix, secAxis.negativeStyle);
      canvas.drawText(rightX + 8, y - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2, lbl, this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, TextAlignment.Left);
    }
    if (secAxis.legend !== '') {
      const tw = canvas.measureText(secAxis.legend, CartesianChartBase.LEGEND_FONT_SIZE, family).width;
      const ly = topY + chartAreaHeight / 2 - tw / 2;
      canvas.drawTextRotated(this.width - 14, ly, secAxis.legend, this.axisColor, CartesianChartBase.LEGEND_FONT_SIZE, family, -90);
    }
  }

  protected override drawSeriesElements(): void {}

  protected override drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    if (!this.showValueLabels) return;
    const family = this.effectiveFontFamily;
    for (const series of data.series) {
      const coords = this.seriesCoords(series, chartAreaWidth, chartAreaHeight, baselineY);
      const color = this.resolveSeriesColor(series);
      for (let i = 0; i < series.dataPoints.length; i++) {
        const p = coords[i];
        const text = this.formatPointValue(series.dataPoints[i]);
        this.drawPlacedLabel(canvas, p.x, p.y - 10 - this.labelFontSize, text, color, this.labelFontSize, family, TextAlignment.Center);
      }
    }
  }
}
