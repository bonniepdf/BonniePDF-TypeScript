// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { ChartSeries } from './Models/ChartSeries';
import { CARTESIAN_CHART_OPTION_KEYS, CartesianChartBase, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, Color, TextAlignment, toColor, type ICanvas, type ColorInput, type Point } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';
import { drawChartMarker } from './Graphics/ChartMarkers';

/** Settable properties declared by {@link DumbbellChart} itself. */
export const DUMBBELL_CHART_OWN_OPTION_KEYS = ['sortBy', 'connectorWidth', 'connectorColor', 'dotRadius'] as const;

/** The full option surface, bases included. */
export const DUMBBELL_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...DUMBBELL_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link DumbbellChart}. */
export type DumbbellChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<DumbbellChart, (typeof DUMBBELL_CHART_OWN_OPTION_KEYS)[number]>, 'connectorColor'>> & {
    /** Colour of the connectors. Defaults to the theme's gridline colour. */
    connectorColor?: ColorInput;
  };

/** Two or more values per category as dots joined by a line: before and after, plan and actual. Horizontal by default. */
export class DumbbellChart extends CartesianChartBase {
  /** Order of the categories: `none`, `first` (by the first series), `last`, or `difference` (largest gap first). Values sort descending. */
  sortBy: 'none' | 'first' | 'last' | 'difference' = 'none';
  /** Width of the connector in points. */
  connectorWidth: number = 3;
  /** Radius of the dots in points. */
  dotRadius: number = 5;
  private _connectorColor: Color | undefined;
  /** Colour of the connectors. Defaults to the theme's gridline colour. */
  get connectorColor(): Color {
    return this._connectorColor ?? this.appearance.gridLineColor;
  }
  set connectorColor(value: ColorInput) {
    this._connectorColor = toColor(value);
  }

  constructor(options?: DumbbellChartOptions) {
    super();
    this.orientation = ChartOrientation.Horizontal;
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

  protected override getValueDataRange(data: ChartData): [number, number] | undefined {
    const range = super.getValueDataRange(data);
    if (range === undefined) return undefined;
    const pad = (range[1] - range[0]) * 0.08;
    return [range[0] - pad, range[1] + pad];
  }

  override draw(canvas: ICanvas, data: ChartData = this.data): void {
    if (this.sortBy === 'none' || data.series.length === 0) {
      super.draw(canvas, data);
      return;
    }
    const first = data.series[0];
    const n = first.dataPoints.length;
    const key = (i: number): number => {
      const values = data.series.map((s) => s.dataPoints[i]?.value ?? 0);
      if (this.sortBy === 'first') return values[0];
      if (this.sortBy === 'last') return values[values.length - 1];
      return Math.max(...values) - Math.min(...values);
    };
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => key(b) - key(a) || a - b);
    const sorted = new ChartData({ title: data.title, subtitle: data.subtitle });
    sorted.xAxis = data.xAxis;
    sorted.yAxis = data.yAxis;
    sorted.series = data.series.map((src) => {
      const s = new ChartSeries({ name: src.name });
      if (src.hasColor) s.color = src.color;
      s.style = src.style;
      s.dataPoints = order.filter((i) => i < src.dataPoints.length).map((i) => src.dataPoints[i] as ChartDataPoint);
      return s;
    });
    super.draw(canvas, sorted);
  }

  protected override drawAllSeries(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, _topY: number): void {
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const categories = data.series.reduce((m, s) => Math.max(m, s.dataPoints.length), 0);
    const slot = (vertical ? chartAreaWidth : chartAreaHeight) / Math.max(1, categories);
    const axisStart = vertical ? this._plotLeft : baselineY - chartAreaHeight;
    const h = (v: number): number => {
      const f = this.fraction(v);
      return vertical ? baselineY - f * chartAreaHeight : this._plotLeft + f * chartAreaWidth;
    };
    const at = (c: number, hh: number): Point => (vertical ? { x: c, y: hh } : { x: hh, y: c }) as Point;
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const connector = this.connectorColor;
    for (let i = 0; i < categories; i++) {
      const values = data.series.filter((s) => i < s.dataPoints.length).map((s) => s.dataPoints[i].value);
      if (values.length === 0) continue;
      const c = axisStart + slot * (i + 0.5);
      const a = at(c, h(Math.min(...values)));
      const b = at(c, h(Math.max(...values)));
      canvas.drawLine(a.x, a.y, b.x, b.y, connector, this.connectorWidth);
    }
    data.series.forEach((series) => {
      const color = this.resolveSeriesColor(series);
      series.dataPoints.forEach((p, i) => {
        const pt = at(axisStart + slot * (i + 0.5), h(p.value));
        drawChartMarker(canvas, pt.x, pt.y, this.dotRadius, color, 'circle', 'solid', 1.5, bg, 2);
      });
    });
  }

  protected override drawSeriesElements(): void {
    // Everything is drawn by drawAllSeries, which needs every series of a category at once.
  }

  protected override drawValueLabels(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, _topY: number): void {
    if (!this.showValueLabels) return;
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const categories = data.series.reduce((m, s) => Math.max(m, s.dataPoints.length), 0);
    const slot = (vertical ? chartAreaWidth : chartAreaHeight) / Math.max(1, categories);
    const axisStart = vertical ? this._plotLeft : baselineY - chartAreaHeight;
    const h = (v: number): number => {
      const f = this.fraction(v);
      return vertical ? baselineY - f * chartAreaHeight : this._plotLeft + f * chartAreaWidth;
    };
    const family = this.effectiveFontFamily;
    const size = this.labelFontSize;
    const gap = this.dotRadius + 5;
    for (let i = 0; i < categories; i++) {
      const entries = data.series.filter((s) => i < s.dataPoints.length).map((s) => ({ s, p: s.dataPoints[i] }));
      if (entries.length === 0) continue;
      const lo = entries.reduce((a, b) => (b.p.value < a.p.value ? b : a));
      const hi = entries.reduce((a, b) => (b.p.value > a.p.value ? b : a));
      const c = axisStart + slot * (i + 0.5);
      const place = (e: { s: ChartSeries; p: ChartDataPoint }, outward: number): void => {
        const text = this.formatPointValue(e.p);
        const color = this.rawSeriesStrokeColor(e.s);
        const pos = h(e.p.value);
        if (vertical) this.drawPlacedLabel(canvas, c, outward > 0 ? pos - gap - size : pos + gap, text, color, size, family, TextAlignment.Center);
        else this.drawPlacedLabel(canvas, outward > 0 ? pos + gap : pos - gap, c - size / 2, text, color, size, family, outward > 0 ? TextAlignment.Left : TextAlignment.Right);
      };
      place(lo, -1);
      if (hi !== lo) place(hi, 1);
    }
  }
}
