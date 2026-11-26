// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions, type ChartReference, CartesianChartBase } from './CartesianChartBase';
import { applyOptions, Color, Point, toColor, type ICanvas, TextAlignment } from './ChartHost';
import { applyChartAffixes, formatChartNumber } from './ChartNumberFormat';
import { checkValueRange, computeNiceScale, valueFraction } from './Graphics/ChartValueScale';
import { drawChartMarker, type ChartMarkerFill, type ChartMarkerShape } from './Graphics/ChartMarkers';
import { strokeChartPath, withChartGroup } from './Graphics/ChartVector';
import { fitTrendline, sampleStandardDeviation } from './Graphics/ChartTrendlineMath';

/** Trendline overlay mode for {@link ScatterChart} (`none` or OLS `linear`). */
export type ScatterTrendlineMode = 'none' | 'linear';

/** Settable properties declared by {@link ScatterChart} itself. */
export const SCATTER_CHART_OWN_OPTION_KEYS = [
  'defaultMarkerRadius',
  'defaultMarkerShape',
  'defaultMarkerFill',
  'minBubbleRadius',
  'maxBubbleRadius',
  'bubbleFillOpacity',
  'showTrendline',
  'xReferences',
  'showVerticalGridLines',
] as const;

/** The full option surface, bases included. */
export const SCATTER_CHART_OPTION_KEYS = [
  ...CARTESIAN_CHART_OPTION_KEYS,
  ...SCATTER_CHART_OWN_OPTION_KEYS,
] as const;

/** Options for {@link ScatterChart}. */
export type ScatterChartOptions = CartesianChartOptions &
  Partial<Pick<ScatterChart, (typeof SCATTER_CHART_OWN_OPTION_KEYS)[number]>>;

/** Renders continuous numeric X/Y scatter plots with optional area-mapped bubble sizing and OLS linear trendlines. */
export class ScatterChart extends CartesianChartBase {
  private _xMin = 0;
  private _xMax = 100;
  private _xStepCount = 5;
  private _xTickFormat = 'N0';
  private _minSize = 0;
  private _maxSize = 0;
  private _hasBubbleSize = false;

  /** Default radius of scatter point markers in points. */
  defaultMarkerRadius: number = 4.5;
  /** Default geometric shape of scatter markers. */
  defaultMarkerShape: ChartMarkerShape = 'circle';
  /** Default fill mode of scatter markers (`solid` or `hollow`). */
  defaultMarkerFill: ChartMarkerFill = 'solid';
  /** Minimum bubble radius in points when `size` values are provided. */
  minBubbleRadius: number = 4;
  /** Maximum bubble radius in points when `size` values are provided. */
  maxBubbleRadius: number = 24;
  /** Fill opacity for area-scaled bubbles (`0..1`). */
  bubbleFillOpacity: number = 0.65;
  /** Optional ordinary least-squares trendline per series (`none` or `linear`). */
  showTrendline: ScatterTrendlineMode = 'none';
  /** Optional reference lines and shaded bands on the horizontal X axis. */
  xReferences: readonly ChartReference[] = [];
  /** Whether to draw vertical gridlines along the continuous X axis. */
  showVerticalGridLines: boolean = true;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }
  protected override get defaultAutoScale(): boolean {
    return true;
  }
  protected override get defaultIncludeZero(): boolean {
    return false;
  }
  protected override get defaultClipToPlotArea(): boolean {
    return true;
  }

  constructor(options?: ScatterChartOptions) {
    super();
    this.autoLayout = true;
    this.showValueLabels = false;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  private pointX(series: ChartSeries, index: number): number {
    const dp = series.dataPoints[index];
    const x = dp.x ?? index;
    if (!Number.isFinite(x)) throw new RangeError('ScatterChart requires finite x coordinates.');
    return x;
  }

  protected override get supportsErrorBars(): boolean {
    return true;
  }

  /** The amounts left and right of a point's x that its horizontal error bars span, or `undefined`. */
  private xErrorAmounts(series: ChartSeries, index: number): { plus: number; minus: number } | undefined {
    const config = series.style.xErrorBars;
    if (config === undefined) return undefined;
    const xs = series.dataPoints.map((_, i) => this.pointX(series, i));
    const x = xs[index];
    let base = config.amount;
    if (config.type === 'percent') base = (Math.abs(x) * config.amount) / 100;
    else if (config.type === 'stdDev') base = sampleStandardDeviation(xs) * config.amount;
    else if (config.type === 'stdError') base = (sampleStandardDeviation(xs) / Math.sqrt(xs.length)) * config.amount;
    const direction = config.direction ?? 'both';
    return { plus: direction === 'minus' ? 0 : base, minus: direction === 'plus' ? 0 : base };
  }

  protected override drawTrendlines(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): void {
    const family = this.effectiveFontFamily;
    for (const t of this.trendlines) {
      const index = typeof t.series === 'number' ? t.series : data.series.findIndex((s) => s.name === t.series);
      if (!Number.isInteger(index) || index < 0 || index >= data.series.length) throw new RangeError(`Trendline names a missing series '${t.series}'.`);
      const series = data.series[index];
      const xs = series.dataPoints.map((_, i) => this.pointX(series, i));
      const ys = series.dataPoints.map((p) => p.value);
      const fit = fitTrendline(t.type, xs, ys, t.order ?? 2, t.period ?? 2);
      const color = t.color !== undefined ? toColor(t.color) : this.rawSeriesStrokeColor(series);
      const pts = fit.points.map((p) => new Point(this._plotLeft + valueFraction(p.x, this._xMin, this._xMax) * chartAreaWidth, baselineY - this.fraction(p.y) * chartAreaHeight));
      this.strokeFit(canvas, t, fit, pts, color, family, true);
    }
  }

  protected override resolveValueScale(data: ChartData): void {
    super.resolveValueScale(data);

    // Resolve continuous X scale and bubble size domain
    let xMin = Infinity;
    let xMax = -Infinity;
    let sMin = Infinity;
    let sMax = -Infinity;
    let hasSize = false;
    for (const s of data.series) {
      for (let i = 0; i < s.dataPoints.length; i++) {
        const x = this.pointX(s, i);
        const xe = this.xErrorAmounts(s, i);
        if (x - (xe?.minus ?? 0) < xMin) xMin = x - (xe?.minus ?? 0);
        if (x + (xe?.plus ?? 0) > xMax) xMax = x + (xe?.plus ?? 0);
        const sz = s.dataPoints[i].size;
        if (sz !== undefined) {
          if (!Number.isFinite(sz) || sz <= 0) throw new RangeError('ScatterChart bubble sizes must be finite and positive.');
          hasSize = true;
          if (sz < sMin) sMin = sz;
          if (sz > sMax) sMax = sz;
        }
      }
    }
    this._hasBubbleSize = hasSize;
    this._minSize = hasSize ? sMin : 0;
    this._maxSize = hasSize ? sMax : 0;

    const xAxis = data.xAxis;
    const useAutoX = xAxis.autoScale || !xAxis.hasMaxValue;
    if (useAutoX && xMin <= xMax) {
      const nice = computeNiceScale(
        xMin,
        xMax,
        xAxis.stepCount,
        xAxis.includeZero ?? false,
        xAxis.headroom ?? 0.05,
        xAxis.hasMinValue ? xAxis.minValue : undefined,
        xAxis.hasMaxValue ? xAxis.maxValue : undefined
      );
      this._xMin = nice.minValue;
      this._xMax = nice.maxValue;
      this._xStepCount = nice.stepCount;
      this._xTickFormat = xAxis.valueFormat ?? nice.autoFormat;
    } else {
      this._xMin = xAxis.minValue;
      this._xMax = xAxis.maxValue;
      this._xStepCount = xAxis.stepCount > 0 ? xAxis.stepCount : 5;
      this._xTickFormat = xAxis.valueFormat ?? 'N0';
    }
    checkValueRange(this._xMin, this._xMax);
  }

  private bubbleRadius(size: number | undefined, fallback: number): number {
    if (!this._hasBubbleSize || size === undefined) return fallback;
    const minR = Math.max(1, this.minBubbleRadius);
    const maxR = Math.max(minR, this.maxBubbleRadius);
    if (this._maxSize === this._minSize) return (minR + maxR) / 2;
    const t = (size - this._minSize) / (this._maxSize - this._minSize);
    return Math.sqrt(minR * minR + t * (maxR * maxR - minR * minR));
  }

  protected override drawGridLines(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    super.drawGridLines(canvas, data, chartAreaWidth, chartAreaHeight, baselineY, topY);
    if (!this.showVerticalGridLines) return;
    const steps = this._xStepCount > 0 ? this._xStepCount : 5;
    const stepW = chartAreaWidth / steps;
    for (let i = 1; i <= steps; i++) {
      const x = this._plotLeft + i * stepW;
      canvas.drawLine(x, topY, x, baselineY, this.gridLineColor, CartesianChartBase.GRID_LINE_WIDTH);
    }
  }

  protected override drawAllSeries(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    // Draw X reference bands inside plot
    if (this.xReferences.length > 0) {
      this.drawReferences(canvas, data, chartAreaWidth, chartAreaHeight, baselineY, true, this.xReferences, this._xMin, this._xMax, true);
    }

    for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
      const series = data.series[sIdx];
      const color = this.resolveSeriesColor(series);
      const shape = this.resolveSeriesMarkerShape(series, sIdx, this.defaultMarkerShape);
      const fill = series.style?.markerFill ?? this.defaultMarkerFill;
      const baseR = series.style?.markerRadius && series.style.markerRadius !== 5 ? series.style.markerRadius : this.defaultMarkerRadius;
      const bg = this.effectiveBackgroundColor ?? Color.white;

      const items = series.dataPoints.map((dp, i) => {
        const xv = this.pointX(series, i);
        const yv = dp.value;
        const px = this._plotLeft + valueFraction(xv, this._xMin, this._xMax) * chartAreaWidth;
        const py = baselineY - valueFraction(yv, this._effectiveMin, this._effectiveMax) * chartAreaHeight;
        const r = this.bubbleRadius(dp.size, baseR);
        return { index: i, xv, yv, px, py, r, isBubble: dp.size !== undefined };
      });

      // Draw largest bubbles first so smaller bubbles remain visible on top
      const sorted = [...items].sort((a, b) => b.r - a.r);
      for (const pt of sorted) {
        withChartGroup(
          canvas,
          () => {
            const point = series.dataPoints[pt.index];
            const description = this.describeMark('{series}, {label}: {x}, {y}', { series: series.name, label: point.label, x: formatChartNumber(pt.xv, 'G'), y: this.formatPointValue(point), raw: point.value });
            return { role: 'mark', seriesIndex: sIdx, pointIndex: pt.index, name: point.label, description, anchor: { x: pt.px, y: pt.py, axis: 'both' } };
          },
          () => {
            if (pt.isBubble) {
              canvas.fillCircle(pt.px, pt.py, pt.r, color.withAlpha(this.bubbleFillOpacity));
              drawChartMarker(canvas, pt.px, pt.py, pt.r, color, 'circle', 'hollow', 0, new Color(0, 0, 0, 0), 1);
            } else {
              drawChartMarker(canvas, pt.px, pt.py, pt.r, color, shape, fill, series.style?.markerHaloWidth ?? 0, bg, 1.5);
            }
          }
        );
      }

      this.drawScatterErrorBars(canvas, series, items, chartAreaWidth, chartAreaHeight, baselineY);

      if (this.showTrendline === 'linear' && items.length >= 2) {
        let sumX = 0;
        let sumY = 0;
        let minX = Infinity;
        let maxX = -Infinity;
        for (const pt of items) {
          sumX += pt.xv;
          sumY += pt.yv;
          if (pt.xv < minX) minX = pt.xv;
          if (pt.xv > maxX) maxX = pt.xv;
        }
        const meanX = sumX / items.length;
        const meanY = sumY / items.length;
        let sxx = 0;
        let sxy = 0;
        for (const pt of items) {
          const dx = pt.xv - meanX;
          sxx += dx * dx;
          sxy += dx * (pt.yv - meanY);
        }
        if (sxx > 0) {
          const slope = sxy / sxx;
          const intercept = meanY - slope * meanX;
          const y1 = slope * minX + intercept;
          const y2 = slope * maxX + intercept;
          const x1Px = this._plotLeft + valueFraction(minX, this._xMin, this._xMax) * chartAreaWidth;
          const y1Px = baselineY - valueFraction(y1, this._effectiveMin, this._effectiveMax) * chartAreaHeight;
          const x2Px = this._plotLeft + valueFraction(maxX, this._xMin, this._xMax) * chartAreaWidth;
          const y2Px = baselineY - valueFraction(y2, this._effectiveMin, this._effectiveMax) * chartAreaHeight;
          strokeChartPath(canvas, {
            commands: [{ op: 'M', values: [x1Px, y1Px] }, { op: 'L', values: [x2Px, y2Px] }],
            color,
            lineWidth: 1.25,
            dashPattern: [4, 4],
          });
        }
      }
    }

    if (this.xReferences.length > 0) {
      this.drawReferences(canvas, data, chartAreaWidth, chartAreaHeight, baselineY, false, this.xReferences, this._xMin, this._xMax, true);
    }
  }

  private drawScatterErrorBars(
    canvas: ICanvas,
    series: ChartSeries,
    items: { xv: number; yv: number; px: number; py: number }[],
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): void {
    const y = series.style.errorBars;
    const xcfg = series.style.xErrorBars;
    const draw = (config: typeof y, x1: number, y1: number, x2: number, y2: number, capDx: number, capDy: number, color: Color): void => {
      const width = config?.width ?? 1;
      canvas.drawLine(x1, y1, x2, y2, color, width);
      const cap = config?.capWidth ?? 6;
      if (cap > 0) {
        canvas.drawLine(x1 - capDx * cap, y1 - capDy * cap, x1 + capDx * cap, y1 + capDy * cap, color, width);
        canvas.drawLine(x2 - capDx * cap, y2 - capDy * cap, x2 + capDx * cap, y2 + capDy * cap, color, width);
      }
    };
    items.forEach((pt, i) => {
      const ya = this.errorAmounts(series, i);
      if (ya !== undefined) {
        const color = y?.color !== undefined ? toColor(y.color) : this.appearance.legendTextColor;
        const lo = baselineY - this.fraction(pt.yv - ya.minus) * chartAreaHeight;
        const hi = baselineY - this.fraction(pt.yv + ya.plus) * chartAreaHeight;
        draw(y, pt.px, lo, pt.px, hi, 0.5, 0, color);
      }
      const xa = this.xErrorAmounts(series, i);
      if (xa !== undefined) {
        const color = xcfg?.color !== undefined ? toColor(xcfg.color) : this.appearance.legendTextColor;
        const lo = this._plotLeft + valueFraction(pt.xv - xa.minus, this._xMin, this._xMax) * chartAreaWidth;
        const hi = this._plotLeft + valueFraction(pt.xv + xa.plus, this._xMin, this._xMax) * chartAreaWidth;
        draw(xcfg, lo, pt.py, hi, pt.py, 0, 0.5, color);
      }
    });
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
      const color = this.resolveSeriesColor(series);
      for (let i = 0; i < series.dataPoints.length; i++) {
        const dp = series.dataPoints[i];
        const xv = this.pointX(series, i);
        const px = this._plotLeft + valueFraction(xv, this._xMin, this._xMax) * chartAreaWidth;
        const py = baselineY - valueFraction(dp.value, this._effectiveMin, this._effectiveMax) * chartAreaHeight;
        const r = this.bubbleRadius(dp.size, this.defaultMarkerRadius);
        const text = dp.label !== '' ? dp.label : this.formatPointValue(dp);
        this.drawPlacedLabel(canvas, px, py - r - 4 - this.labelFontSize, text, color, this.labelFontSize, family, TextAlignment.Center);
      }
    }
  }

  protected override drawXAxisLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    _chartAreaHeight: number,
    baselineY: number
  ): void {
    const steps = this._xStepCount > 0 ? this._xStepCount : 5;
    const stepW = chartAreaWidth / steps;
    const stepVal = (this._xMax - this._xMin) / steps;
    const family = this.effectiveFontFamily;
    for (let i = 0; i <= steps; i++) {
      const x = this._plotLeft + i * stepW;
      const v = this._xMin + i * stepVal;
      const label = applyChartAffixes(formatChartNumber(v, this._xTickFormat), data.xAxis.prefix, data.xAxis.suffix, data.xAxis.negativeStyle);
      canvas.drawText(x, baselineY + 12, label, this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, TextAlignment.Center);
    }
  }
}
