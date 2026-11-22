// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartBarStyle, type ChartBarStyleOptions } from './ChartBarStyle';
import { drawChartBar } from './Graphics/ChartBars';
import { valueFraction } from './Graphics/ChartValueScale';
import { strokeChartPath } from './Graphics/ChartVector';
import { ChartData } from './Models/ChartData';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions, CartesianChartBase } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, type ICanvas } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';

/** Settable properties declared by {@link WaterfallChart} itself. */
export const WATERFALL_CHART_OWN_OPTION_KEYS = [
  'positiveColor',
  'negativeColor',
  'totalColor',
  'showConnectors',
  'barWidthRatio',
  'barStyle',
  'showSignOnDeltas',
] as const;

/** The full option surface, bases included. */
export const WATERFALL_CHART_OPTION_KEYS = [
  ...CARTESIAN_CHART_OPTION_KEYS,
  ...WATERFALL_CHART_OWN_OPTION_KEYS,
] as const;

/** Options for {@link WaterfallChart}. */
export type WaterfallChartOptions = CartesianChartOptions &
  Partial<
    Omit<
      Pick<WaterfallChart, (typeof WATERFALL_CHART_OWN_OPTION_KEYS)[number]>,
      'positiveColor' | 'negativeColor' | 'totalColor' | 'barStyle'
    >
  > & {
    /** Override colour for positive delta bars. */
    positiveColor?: ColorInput;
    /** Override colour for negative delta bars. */
    negativeColor?: ColorInput;
    /** Override colour for total and subtotal bars. */
    totalColor?: ColorInput;
    /** Corner rounding and gradient style applied to waterfall bars. */
    barStyle?: ChartBarStyle | ChartBarStyleOptions;
  };

interface WaterfallBar {
  dp: ChartDataPoint;
  start: number;
  end: number;
  displayValue: number;
  isTotal: boolean;
}

/** Renders cumulative variance bridges (P&L, cash flow, ARR movement) with delta, subtotal, and total bars. */
export class WaterfallChart extends CartesianChartBase {
  private _positiveColor: Color | undefined;
  private _negativeColor: Color | undefined;
  private _totalColor: Color | undefined;
  private _barStyle = new ChartBarStyle();

  /** Override colour for positive delta bars. */
  get positiveColor(): Color | undefined {
    return this._positiveColor;
  }
  set positiveColor(value: ColorInput | undefined) {
    this._positiveColor = value === undefined ? undefined : toColor(value);
  }

  /** Override colour for negative delta bars. */
  get negativeColor(): Color | undefined {
    return this._negativeColor;
  }
  set negativeColor(value: ColorInput | undefined) {
    this._negativeColor = value === undefined ? undefined : toColor(value);
  }

  /** Override colour for total and subtotal bars. */
  get totalColor(): Color | undefined {
    return this._totalColor;
  }
  set totalColor(value: ColorInput | undefined) {
    this._totalColor = value === undefined ? undefined : toColor(value);
  }

  private get effectivePositiveColor(): Color {
    return this._positiveColor ?? (this.appearance.styledGeometry ? Color.fromHex('#0d9488') : Color.fromHex('#16a34a'));
  }
  private get effectiveNegativeColor(): Color {
    return this._negativeColor ?? (this.appearance.styledGeometry ? Color.fromHex('#e11d48') : Color.fromHex('#dc2626'));
  }
  private get effectiveTotalColor(): Color {
    return this._totalColor ?? (this.appearance.styledGeometry ? Color.fromHex('#2563eb') : Color.fromHex('#4f46e5'));
  }

  /** Corner rounding and gradient style applied to waterfall bars. */
  get barStyle(): ChartBarStyle {
    return this._barStyle;
  }
  set barStyle(value: ChartBarStyle | ChartBarStyleOptions) {
    this._barStyle = value instanceof ChartBarStyle ? value : new ChartBarStyle(value);
  }

  /** Whether to draw dashed connector lines between adjacent bars. */
  showConnectors: boolean = true;
  /** Fraction of each category slot occupied by the bar (`0..1`). */
  barWidthRatio: number = 0.6;
  /** Whether to prefix positive delta labels with `+`. */
  showSignOnDeltas: boolean = true;

  /** SVG `shape-rendering` hint (`auto` or `crispEdges`). */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return super.usesStyledGeometry || (this.barStyle.cornerRadius ?? 0) > 0 || this.barStyle.gradient !== undefined || this.showConnectors;
  }
  protected override get defaultAutoScale(): boolean {
    return true;
  }

  constructor(options?: WaterfallChartOptions) {
    super();
    this.autoLayout = true;
    this.showLegend = false;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  private computeBars(data: ChartData): WaterfallBar[] {
    const pts = data.series[0]?.dataPoints ?? [];
    const bars: WaterfallBar[] = [];
    let running = 0;
    for (const dp of pts) {
      if (dp.kind === 'total' || dp.kind === 'subtotal') {
        const val = dp.hasExplicitValue && Number.isFinite(dp.value) ? dp.value : running;
        bars.push({ dp, start: 0, end: val, displayValue: val, isTotal: true });
        running = val;
      } else {
        if (!Number.isFinite(dp.value)) throw new RangeError('WaterfallChart delta points require a finite value.');
        const start = running;
        const end = running + dp.value;
        bars.push({ dp, start, end, displayValue: dp.value, isTotal: false });
        running = end;
      }
    }
    return bars;
  }

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    const bars = this.computeBars(data);
    if (bars.length === 0) return undefined;
    let min = 0;
    let max = 0;
    for (const b of bars) {
      min = Math.min(min, b.start, b.end);
      max = Math.max(max, b.start, b.end);
    }
    return [min, max];
  }

  protected override drawAllSeries(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    const bars = this.computeBars(data);
    if (bars.length === 0) return;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const slot = (horizontal ? chartAreaHeight : chartAreaWidth) / bars.length;
    const thickness = Math.min(slot * this.barWidthRatio, 50);

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const color = b.isTotal ? this.effectiveTotalColor : b.displayValue >= 0 ? this.effectivePositiveColor : this.effectiveNegativeColor;
      const fStart = valueFraction(b.start, this._effectiveMin, this._effectiveMax);
      const fEnd = valueFraction(b.end, this._effectiveMin, this._effectiveMax);
      const center = (horizontal ? topY : this._plotLeft) + i * slot + slot / 2;

      if (horizontal) {
        const xStart = this._plotLeft + fStart * chartAreaWidth;
        const xEnd = this._plotLeft + fEnd * chartAreaWidth;
        drawChartBar(canvas, xStart, center - thickness / 2, xEnd - xStart, thickness, color, this.barStyle, this.appearance, true, this._plotLeft, topY, chartAreaWidth, chartAreaHeight);
        if (this.showConnectors && i < bars.length - 1) {
          const nextCenter = topY + (i + 1) * slot + slot / 2;
          strokeChartPath(canvas, {
            commands: [{ op: 'M', values: [xEnd, center + thickness / 2] }, { op: 'L', values: [xEnd, nextCenter - thickness / 2] }],
            color: this.axisColor,
            lineWidth: 0.75,
            dashPattern: [3, 3],
          });
        }
      } else {
        const yStart = baselineY - fStart * chartAreaHeight;
        const yEnd = baselineY - fEnd * chartAreaHeight;
        drawChartBar(canvas, center - thickness / 2, yEnd, thickness, yStart - yEnd, color, this.barStyle, this.appearance, false, this._plotLeft, topY, chartAreaWidth, chartAreaHeight);
        if (this.showConnectors && i < bars.length - 1) {
          const nextCenter = this._plotLeft + (i + 1) * slot + slot / 2;
          strokeChartPath(canvas, {
            commands: [{ op: 'M', values: [center + thickness / 2, yEnd] }, { op: 'L', values: [nextCenter - thickness / 2, yEnd] }],
            color: this.axisColor,
            lineWidth: 0.75,
            dashPattern: [3, 3],
          });
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
    if (!this.showValueLabels) return;
    const bars = this.computeBars(data);
    if (bars.length === 0) return;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const slot = (horizontal ? chartAreaHeight : chartAreaWidth) / bars.length;
    const thickness = Math.min(slot * this.barWidthRatio, 50);

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const color = b.isTotal ? this.effectiveTotalColor : b.displayValue >= 0 ? this.effectivePositiveColor : this.effectiveNegativeColor;
      const raw = this.formatPointValue(b.dp, b.displayValue);
      const text = !b.isTotal && this.showSignOnDeltas && b.displayValue > 0 && !raw.startsWith('+') ? `+${raw}` : raw;
      const fStart = valueFraction(b.start, this._effectiveMin, this._effectiveMax);
      const fEnd = valueFraction(b.end, this._effectiveMin, this._effectiveMax);
      const center = (horizontal ? topY : this._plotLeft) + i * slot + slot / 2;
      const below = b.end < b.start;

      if (horizontal) {
        const xStart = this._plotLeft + fStart * chartAreaWidth;
        const xEnd = this._plotLeft + fEnd * chartAreaWidth;
        this.drawBarValueLabel(canvas, xStart, center - thickness / 2, xEnd - xStart, thickness, text, color, below, 6, xEnd, center);
      } else {
        const yStart = baselineY - fStart * chartAreaHeight;
        const yEnd = baselineY - fEnd * chartAreaHeight;
        this.drawBarValueLabel(canvas, center - thickness / 2, yEnd, thickness, yStart - yEnd, text, color, below, 6, center, yEnd);
      }
    }
  }
}
