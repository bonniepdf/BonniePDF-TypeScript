// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { CARTESIAN_CHART_OPTION_KEYS, CartesianChartBase, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, Color, toColor, type ColorInput, type ICanvas, type Point } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';
import { formatChartNumber } from './ChartNumberFormat';
import { TextAlignment } from './ChartHost';

/** A volume pane beneath the price pane. */
export interface CandlestickVolume {
  /** The series holding the volumes, by index or name: one point per candle, in the same order. */
  series: number | string;
  /** The pane's height as a fraction of the chart height (`0.2`). */
  paneRatio?: number;
}

/** Settable properties declared by {@link CandlestickChart} itself. */
export const CANDLESTICK_CHART_OWN_OPTION_KEYS = ['style', 'upColor', 'downColor', 'hollowUp', 'bodyWidthRatio', 'volume'] as const;

/** The full option surface, bases included. */
export const CANDLESTICK_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...CANDLESTICK_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link CandlestickChart}. */
export type CandlestickChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<CandlestickChart, (typeof CANDLESTICK_CHART_OWN_OPTION_KEYS)[number]>, 'upColor' | 'downColor'>> & {
    /** Colour of rising periods (close at or above open). Defaults to the theme's positive colour. */
    upColor?: ColorInput;
    /** Colour of falling periods. Defaults to the theme's negative colour. */
    downColor?: ColorInput;
  };

/** Open-high-low-close prices per period, as candles or OHLC bars. Reads the first series; its points carry `open`, `high`, `low` and `close`. */
export class CandlestickChart extends CartesianChartBase {
  /** `candle` (default): a body from open to close with wicks. `ohlc`: a vertical line with open and close ticks. */
  style: 'candle' | 'ohlc' = 'candle';
  /** Draw rising candles hollow. */
  hollowUp: boolean = false;
  /** The fraction of a category slot that a candle body fills (`0.6`). */
  bodyWidthRatio: number = 0.6;
  private _upColor: Color | undefined;
  private _downColor: Color | undefined;
  /** Colour of rising periods. Defaults to the theme's positive colour. */
  get upColor(): Color {
    return this._upColor ?? this.appearance.positiveColor ?? Color.fromHex('#15803d');
  }
  set upColor(value: ColorInput) {
    this._upColor = toColor(value);
  }
  /** Colour of falling periods. Defaults to the theme's negative colour. */
  get downColor(): Color {
    return this._downColor ?? this.appearance.negativeColor ?? Color.fromHex('#b91c1c');
  }
  set downColor(value: ColorInput) {
    this._downColor = toColor(value);
  }

  constructor(options?: CandlestickChartOptions) {
    super();
    this.showValueLabels = false;
    this.showLegend = false;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override get supportsTimeAxis(): boolean {
    return true;
  }

  /** A volume pane beneath the price pane, sharing its columns. */
  volume: CandlestickVolume | undefined;

  protected override getExtraBottomBand(): number {
    return this.volume === undefined ? 0 : this.height * (this.volume.paneRatio ?? 0.2) + 22;
  }

  protected override drawAfterSeries(canvas: ICanvas, data: ChartData, chartAreaWidth: number, _chartAreaHeight: number, baselineY: number): void {
    const v = this.volume;
    if (v === undefined) return;
    const ratio = v.paneRatio ?? 0.2;
    if (!(ratio > 0 && ratio <= 0.5)) throw new RangeError('Candlestick volume paneRatio must be above 0 and at most 0.5.');
    const index = typeof v.series === 'number' ? v.series : data.series.findIndex((s) => s.name === v.series);
    if (!Number.isInteger(index) || index < 0 || index >= data.series.length || index === 0) throw new RangeError(`Candlestick volume names a missing series '${v.series}'.`);
    const prices = data.series[0].dataPoints;
    const volumes = data.series[index].dataPoints;
    if (volumes.length !== prices.length) throw new RangeError('Candlestick volume needs one point per candle.');
    const paneHeight = this.height * ratio;
    const top = baselineY + 32;
    const bottom = top + paneHeight;
    const maxVolume = Math.max(...volumes.map((p) => p.value));
    if (!(maxVolume > 0)) return;
    const slot = chartAreaWidth / Math.max(1, prices.length);
    const width = Math.max(1, slot * this.bodyWidthRatio);
    const family = this.effectiveFontFamily;
    canvas.drawLine(this._plotLeft, bottom, this._plotLeft + chartAreaWidth, bottom, this.axisColor, 1);
    canvas.drawText(this._plotLeft - 8, top - 5, formatChartNumber(maxVolume, 'K1'), this.axisColor, 9, family, TextAlignment.Right);
    canvas.drawText(this._plotLeft - 8, top + paneHeight / 2 - 5, 'Volume', this.axisColor, 9, family, TextAlignment.Right);
    prices.forEach((p, i) => {
      const o = this.ohlc(p);
      const color = (o.close >= o.open ? this.upColor : this.downColor).withAlpha(0.6);
      const cx = this.timeAxisActive ? this.timeX(p, chartAreaWidth) : this._plotLeft + slot * (i + 0.5);
      const h = (volumes[i].value / maxVolume) * paneHeight;
      canvas.fillRect(cx - width / 2, bottom - h, width, h, color);
    });
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

  private ohlc(point: ChartSeries['dataPoints'][number]): { open: number; high: number; low: number; close: number } {
    const { open, high, low, close } = point;
    if (open === undefined || high === undefined || low === undefined || close === undefined) throw new RangeError('Candlestick points need open, high, low and close.');
    if (!(low <= Math.min(open, close) && Math.max(open, close) <= high)) throw new RangeError('Candlestick prices must satisfy low <= open, close <= high.');
    return { open, high, low, close };
  }

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    const points = data.series[0]?.dataPoints ?? [];
    if (points.length === 0) return undefined;
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
      const o = this.ohlc(p);
      min = Math.min(min, o.low);
      max = Math.max(max, o.high);
    }
    return [min, max];
  }

  protected override drawAllSeries(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, topY: number): void {
    const series = data.series[0];
    if (series === undefined) return;
    this.drawSeriesElements(canvas, data, series, [], chartAreaWidth, chartAreaHeight, baselineY, topY);
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
    if (!(this.bodyWidthRatio > 0 && this.bodyWidthRatio <= 1)) throw new RangeError('bodyWidthRatio must be above 0 and at most 1.');
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const at = (c: number, h: number): { x: number; y: number } => (vertical ? { x: c, y: h } : { x: h, y: c });
    const count = series.dataPoints.length;
    const slot = (vertical ? chartAreaWidth : chartAreaHeight) / Math.max(1, count);
    const axisStart = vertical ? this._plotLeft : baselineY - chartAreaHeight;
    const h = (v: number): number => {
      const f = this.fraction(v);
      return vertical ? baselineY - f * chartAreaHeight : this._plotLeft + f * chartAreaWidth;
    };
    const bg = this.effectiveBackgroundColor ?? Color.white;
    series.dataPoints.forEach((point, i) => {
      const o = this.ohlc(point);
      const c = this.timeAxisActive ? this.timeX(point, chartAreaWidth) : axisStart + slot * (i + 0.5);
      const rising = o.close >= o.open;
      const color = rising ? this.upColor : this.downColor;
      const line = (a: { x: number; y: number }, b: { x: number; y: number }, width: number): void => canvas.drawLine(a.x, a.y, b.x, b.y, color, width);
      if (this.style === 'ohlc') {
        const tick = Math.max(2, (slot * this.bodyWidthRatio) / 2);
        line(at(c, h(o.low)), at(c, h(o.high)), 1.5);
        line(at(c - tick, h(o.open)), at(c, h(o.open)), 1.5);
        line(at(c, h(o.close)), at(c + tick, h(o.close)), 1.5);
        return;
      }
      const body = Math.max(1, slot * this.bodyWidthRatio);
      line(at(c, h(o.low)), at(c, h(o.high)), 1.25);
      const top = Math.min(h(o.open), h(o.close));
      const bottom = Math.max(h(o.open), h(o.close));
      const hh = Math.max(1, bottom - top);
      const corners = vertical
        ? [at(c - body / 2, top), at(c + body / 2, top), at(c + body / 2, top + hh), at(c - body / 2, top + hh)]
        : [at(top, c - body / 2), at(top + hh, c - body / 2), at(top + hh, c + body / 2), at(top, c + body / 2)];
      const commands: ChartPathCommand[] = corners.map((p, k) => ({ op: k === 0 ? 'M' : 'L', values: [p.x, p.y] }));
      commands.push({ op: 'Z', values: [] });
      if (rising && this.hollowUp) fillChartPath(canvas, { commands, color: bg });
      else fillChartPath(canvas, { commands, color });
      strokeChartPath(canvas, { commands, color, lineWidth: 1.25, lineJoin: 'miter', miterLimit: 10 });
    });
  }
}
