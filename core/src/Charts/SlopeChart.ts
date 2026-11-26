// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { drawChartMarker } from './Graphics/ChartMarkers';
import { strokeChartPath } from './Graphics/ChartVector';
import { categoryColor } from './Graphics/ChartCategoryColors';

/** Settable properties declared by {@link SlopeChart} itself. */
export const SLOPE_CHART_OWN_OPTION_KEYS = ['valueFormat', 'lineWidth', 'labelFontSize'] as const;

/** The full option surface, base included. */
export const SLOPE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...SLOPE_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link SlopeChart}. */
export type SlopeChartOptions = ChartBaseOptions & Partial<Pick<SlopeChart, (typeof SLOPE_CHART_OWN_OPTION_KEYS)[number]>>;

/** Spreads labels that want the same place: sorted by y, pushed apart to `gap`, then back up if the last one leaves `bottom`. @internal */
export function separateLabels(ys: readonly number[], gap: number, bottom: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y || a.i - b.i);
  const out = order.map((o) => o.y);
  for (let k = 1; k < out.length; k++) out[k] = Math.max(out[k], out[k - 1] + gap);
  if (out.length > 0 && out[out.length - 1] > bottom) {
    out[out.length - 1] = bottom;
    for (let k = out.length - 2; k >= 0; k--) out[k] = Math.min(out[k], out[k + 1] - gap);
  }
  const result = new Array<number>(ys.length);
  order.forEach((o, k) => (result[o.i] = out[k]));
  return result;
}

/** A slope chart: how each series changes between exactly two categories, labelled at both ends. */
export class SlopeChart extends ChartBase {
  /** Number format of the values in the end labels. */
  valueFormat: string = 'G';
  /** Width of the lines in points. */
  lineWidth: number = 2;
  /** Size of the end labels in points. */
  labelFontSize: number = 10;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: SlopeChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const series = data.series;
    if (series.length === 0) return;
    if (series.some((s) => s.dataPoints.length !== 2)) throw new RangeError('A slope chart needs exactly two categories in every series.');
    const font = this.resolveFontFamily();
    const size = this.labelFontSize;
    const leftTexts = series.map((s) => `${s.name}  ${formatChartNumber(s.dataPoints[0].value, this.valueFormat)}`);
    const rightTexts = series.map((s) => `${s.name}  ${formatChartNumber(s.dataPoints[1].value, this.valueFormat)}`);
    const widest = (texts: string[]): number => Math.min(this.width * 0.3, Math.max(...texts.map((t) => canvas.measureText(t, size, font).width)));
    const x0 = 12 + widest(leftTexts) + 12;
    const x1 = Math.max(x0 + 60, this.width - 12 - widest(rightTexts) - 12);
    const top = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0) + 22;
    const bottom = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const values = series.flatMap((s) => s.dataPoints.map((p) => p.value));
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (!(hi > lo)) {
      lo -= 1;
      hi += 1;
    }
    const yOf = (v: number): number => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
    const axis = this.appearance.axisColor;
    canvas.drawLine(x0, top, x0, bottom, axis, 1);
    canvas.drawLine(x1, top, x1, bottom, axis, 1);
    canvas.drawText(x0, top - 20, series[0].dataPoints[0].label, this.appearance.legendTextColor, 10, font, TextAlignment.Center);
    canvas.drawText(x1, top - 20, series[0].dataPoints[1].label, this.appearance.legendTextColor, 10, font, TextAlignment.Center);
    const background = this.effectiveBackgroundColor ?? Color.white;
    const gap = size + 2;
    const leftY = separateLabels(series.map((s) => yOf(s.dataPoints[0].value)), gap, bottom);
    const rightY = separateLabels(series.map((s) => yOf(s.dataPoints[1].value)), gap, bottom);
    series.forEach((s, i) => {
      const color = s.hasColor ? s.color : categoryColor(this.appearance, undefined, i);
      const ya = yOf(s.dataPoints[0].value);
      const yb = yOf(s.dataPoints[1].value);
      strokeChartPath(canvas, { commands: [{ op: 'M', values: [x0, ya] }, { op: 'L', values: [x1, yb] }], color, lineWidth: this.lineWidth, lineCap: 'round', miterLimit: 10 });
      drawChartMarker(canvas, x0, ya, 3.5, color, 'circle', 'solid', 1.5, background, this.lineWidth);
      drawChartMarker(canvas, x1, yb, 3.5, color, 'circle', 'solid', 1.5, background, this.lineWidth);
      canvas.drawText(x0 - 8, leftY[i] - size / 2, leftTexts[i], color, size, font, TextAlignment.Right);
      canvas.drawText(x1 + 8, rightY[i] - size / 2, rightTexts[i], color, size, font, TextAlignment.Left);
    });
  }
}
