// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartBarStyle, type ChartBarStyleOptions } from './ChartBarStyle';
import { drawChartBar } from './Graphics/ChartBars';
import { fillPatternRect } from './Graphics/ChartPatterns';
import { formatChartNumber } from './ChartNumberFormat';
import { valueFraction } from './Graphics/ChartValueScale';
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, Color, type ICanvas, TextAlignment } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';

/** Stacking calculation mode (`absolute` values or 100% normalized `percent`). */
export type ChartStackMode = 'absolute' | 'percent';

/** Settable properties declared by {@link StackedBarChart} itself. */
export const STACKED_BAR_CHART_OWN_OPTION_KEYS = [
  'mode',
  'barWidthRatio',
  'barStyle',
  'showStackTotals',
  'stackTotalFormat',
  'segmentGap',
] as const;

/** The full option surface, bases included. */
export const STACKED_BAR_CHART_OPTION_KEYS = [
  ...CARTESIAN_CHART_OPTION_KEYS,
  ...STACKED_BAR_CHART_OWN_OPTION_KEYS,
] as const;

/** Options for {@link StackedBarChart}. */
export type StackedBarChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<StackedBarChart, (typeof STACKED_BAR_CHART_OWN_OPTION_KEYS)[number]>, 'barStyle'>> & {
    /** Corner rounding and gradient style applied to stacked bar segments. */
    barStyle?: ChartBarStyle | ChartBarStyleOptions;
  };

/** Renders multiple series stacked on each category, in absolute or 100% normalized mode. */
export class StackedBarChart extends CartesianChartBase {
  private _barStyle = new ChartBarStyle();
  /** Corner rounding and gradient style applied to stacked bar segments. */
  get barStyle(): ChartBarStyle {
    return this._barStyle;
  }
  set barStyle(value: ChartBarStyle | ChartBarStyleOptions) {
    this._barStyle = value instanceof ChartBarStyle ? value : new ChartBarStyle(value);
  }

  /** Stacking mode: `absolute` (default) or 100% normalized `percent`. */
  mode: ChartStackMode = 'absolute';
  /** Fraction of each category slot occupied by the bar (`0..1`). */
  barWidthRatio: number = 0.6;
  /** Whether to draw the category total beyond the top of each stacked bar. */
  showStackTotals: boolean = false;
  /** Number format for category stack totals. */
  stackTotalFormat: string | undefined;
  /** Visual gap between adjacent stacked segments in points. */
  segmentGap: number = 0;

  /** SVG `shape-rendering` hint (`auto` or `crispEdges`). */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return super.usesStyledGeometry || (this.barStyle.cornerRadius ?? 0) > 0 || this.barStyle.gradient !== undefined;
  }

  protected override get defaultAutoScale(): boolean {
    return true;
  }

  constructor(options?: StackedBarChartOptions) {
    super();
    this.autoLayout = true;
    this.valueLabelPosition = 'inside';
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawLegendSwatch(canvas: ICanvas, x: number, y: number, size: number, series: ChartSeries): void {
    const color = this.resolveSeriesColor(series);
    const idx = (this._renderData ?? this.data).series.indexOf(series);
    const pat = this.resolveSeriesPattern(series, idx);
    drawChartBar(canvas, x, y, size, size, color, this.barStyle, this.appearance, false, x, y, size, size);
    if (pat !== 'none') fillPatternRect(canvas, x, y, size, size, { kind: pat, foreground: Color.white });
  }

  private categoryCount(data: ChartData): number {
    return data.series.reduce((max, s) => Math.max(max, s.dataPoints.length), 0);
  }

  private categoryTotal(data: ChartData, catIndex: number): number {
    let sum = 0;
    for (const s of data.series) {
      if (catIndex < s.dataPoints.length) {
        const v = s.dataPoints[catIndex].value;
        if (this.mode === 'percent' && v < 0) {
          throw new RangeError('StackedBarChart in percent mode requires nonnegative values.');
        }
        sum += v;
      }
    }
    return sum;
  }

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    const count = this.categoryCount(data);
    if (count === 0) return undefined;
    if (this.mode === 'percent') return [0, 100];
    let min = 0;
    let max = 0;
    for (let i = 0; i < count; i++) {
      let pos = 0;
      let neg = 0;
      for (const s of data.series) {
        if (i < s.dataPoints.length) {
          const v = s.dataPoints[i].value;
          if (v >= 0) pos += v;
          else neg += v;
        }
      }
      if (pos > max) max = pos;
      if (neg < min) min = neg;
    }
    return [min, max];
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

  protected override drawAllSeries(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    const count = this.categoryCount(data);
    if (count === 0) return;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const gap = Math.max(0, Math.min(4, this.segmentGap));
    const slotSpan = (horizontal ? chartAreaHeight : chartAreaWidth) / count;
    const thickness = Math.min(slotSpan * this.barWidthRatio, 50);
    const squareStyle = new ChartBarStyle({ cornerRadius: 0, gradient: this.barStyle.gradient });

    for (let i = 0; i < count; i++) {
      const total = this.mode === 'percent' ? this.categoryTotal(data, i) : 1;
      if (this.mode === 'percent' && total <= 0) continue;

      // Determine outermost positive and negative series indices for corner rounding
      let lastPosIdx = -1;
      let lastNegIdx = -1;
      for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
        const dp = data.series[sIdx].dataPoints[i];
        if (!dp || dp.value === 0) continue;
        if (dp.value > 0) lastPosIdx = sIdx;
        else lastNegIdx = sIdx;
      }

      let posAcc = 0;
      let negAcc = 0;
      const center = (horizontal ? topY : this._plotLeft) + i * slotSpan + slotSpan / 2;

      for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
        const series = data.series[sIdx];
        const dp = series.dataPoints[i];
        if (!dp || dp.value === 0) continue;
        const val = this.mode === 'percent' ? (dp.value / total) * 100 : dp.value;
        const startVal = val > 0 ? posAcc : negAcc;
        const endVal = startVal + val;
        if (val > 0) posAcc = endVal;
        else negAcc = endVal;

        const isOuter = (val > 0 && sIdx === lastPosIdx) || (val < 0 && sIdx === lastNegIdx);
        const style = isOuter ? this.barStyle : squareStyle;
        const color = this.resolveSeriesColor(series);
        const pat = this.resolveSeriesPattern(series, sIdx);

        const fStart = valueFraction(startVal, this._effectiveMin, this._effectiveMax);
        const fEnd = valueFraction(endVal, this._effectiveMin, this._effectiveMax);

        if (horizontal) {
          let xStart = this._plotLeft + fStart * chartAreaWidth;
          const xEnd = this._plotLeft + fEnd * chartAreaWidth;
          if (gap > 0 && startVal !== 0) xStart += val > 0 ? gap : -gap;
          const w = xEnd - xStart;
          const by = center - thickness / 2;
          drawChartBar(canvas, xStart, by, w, thickness, color, style, this.appearance, true, this._plotLeft, topY, chartAreaWidth, chartAreaHeight);
          if (pat !== 'none') {
            fillPatternRect(canvas, w < 0 ? xStart + w : xStart, by, Math.abs(w), thickness, { kind: pat, foreground: Color.white });
          }
        } else {
          let yStart = baselineY - fStart * chartAreaHeight;
          const yEnd = baselineY - fEnd * chartAreaHeight;
          if (gap > 0 && startVal !== 0) yStart += val > 0 ? -gap : gap;
          const h = yStart - yEnd;
          const bx = center - thickness / 2;
          drawChartBar(canvas, bx, yEnd, thickness, h, color, style, this.appearance, false, this._plotLeft, topY, chartAreaWidth, chartAreaHeight);
          if (pat !== 'none') {
            fillPatternRect(canvas, bx, h < 0 ? yEnd + h : yEnd, thickness, Math.abs(h), { kind: pat, foreground: Color.white });
          }
        }
      }
    }
  }

  protected override drawSeriesElements(): void {}

  protected override drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    const count = this.categoryCount(data);
    if (count === 0) return;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const slotSpan = (horizontal ? chartAreaHeight : chartAreaWidth) / count;
    const thickness = Math.min(slotSpan * this.barWidthRatio, 50);
    const family = this.effectiveFontFamily;

    for (let i = 0; i < count; i++) {
      const total = this.mode === 'percent' ? this.categoryTotal(data, i) : 1;
      if (this.mode === 'percent' && total <= 0) continue;

      let posAcc = 0;
      let negAcc = 0;
      const center = (horizontal ? topY : this._plotLeft) + i * slotSpan + slotSpan / 2;

      for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
        const series = data.series[sIdx];
        const dp = series.dataPoints[i];
        if (!dp || dp.value === 0) continue;
        const val = this.mode === 'percent' ? (dp.value / total) * 100 : dp.value;
        const startVal = val > 0 ? posAcc : negAcc;
        const endVal = startVal + val;
        if (val > 0) posAcc = endVal;
        else negAcc = endVal;

        if (this.showValueLabels) {
          const fStart = valueFraction(startVal, this._effectiveMin, this._effectiveMax);
          const fEnd = valueFraction(endVal, this._effectiveMin, this._effectiveMax);
          const color = this.resolveSeriesColor(series);
          const text = this.mode === 'percent'
            ? `${formatChartNumber(val, this.valueLabelFormat ?? 'F0')}%`
            : this.formatPointValue(dp);

          if (horizontal) {
            const xStart = this._plotLeft + fStart * chartAreaWidth;
            const xEnd = this._plotLeft + fEnd * chartAreaWidth;
            this.drawBarValueLabel(canvas, xStart, center - thickness / 2, xEnd - xStart, thickness, text, color, val < 0, 5, xEnd, center);
          } else {
            const yStart = baselineY - fStart * chartAreaHeight;
            const yEnd = baselineY - fEnd * chartAreaHeight;
            this.drawBarValueLabel(canvas, center - thickness / 2, yEnd, thickness, yStart - yEnd, text, color, val < 0, 5, center, yEnd);
          }
        }
      }

      if (this.showStackTotals && this.mode === 'absolute') {
        const net = posAcc !== 0 ? posAcc : negAcc;
        const fmt = this.stackTotalFormat ?? this.valueLabelFormat ?? 'G';
        const txt = `${this.valueLabelPrefix}${formatChartNumber(net, fmt)}${this.valueLabelSuffix}`;
        const fNet = valueFraction(net, this._effectiveMin, this._effectiveMax);
        if (horizontal) {
          const x = this._plotLeft + fNet * chartAreaWidth;
          this.drawPlacedLabel(canvas, net < 0 ? x - 6 : x + 6, center - this.labelFontSize / 2, txt, this.appearance.titleColor, this.labelFontSize, family, net < 0 ? TextAlignment.Right : TextAlignment.Left);
        } else {
          const y = baselineY - fNet * chartAreaHeight;
          this.drawPlacedLabel(canvas, center, net < 0 ? y + 6 : y - 6 - this.labelFontSize, txt, this.appearance.titleColor, this.labelFontSize, family, TextAlignment.Center);
        }
      }
    }
  }
}
