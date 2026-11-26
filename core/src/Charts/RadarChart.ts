// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, type ICanvas, Point, TextAlignment } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { computeNiceScale, valueFraction } from './Graphics/ChartValueScale';
import { drawChartMarker } from './Graphics/ChartMarkers';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { categoryColor } from './Graphics/ChartCategoryColors';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';
import { Color } from './ChartHost';

/** Settable properties declared by {@link RadarChart} itself. */
export const RADAR_CHART_OWN_OPTION_KEYS = ['gridShape', 'fillOpacity', 'curve', 'showMarkers', 'showValueLabels', 'showLegend', 'lineWidth'] as const;

/** The full option surface, base included. */
export const RADAR_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...RADAR_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link RadarChart}. */
export type RadarChartOptions = ChartBaseOptions & Partial<Pick<RadarChart, (typeof RADAR_CHART_OWN_OPTION_KEYS)[number]>>;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const KAPPA = (4 / 3) * (Math.SQRT2 - 1);

/** A radar (spider) chart: one spoke per category, one closed shape per series. */
export class RadarChart extends ChartBase {
  /** `polygon` (default) or `circle` rings. */
  gridShape: 'polygon' | 'circle' = 'polygon';
  /** Opacity of each series' fill, `0..1`. `0` draws outlines only. */
  fillOpacity: number = 0.2;
  /** `linear` (default) or `smooth` (a closed Catmull-Rom curve). */
  curve: 'linear' | 'smooth' = 'linear';
  /** Draw a marker at each value. */
  showMarkers: boolean = true;
  /** Draw the value beside each marker. */
  showValueLabels: boolean = false;
  /** Draw a legend when there is more than one series. */
  showLegend: boolean = true;
  /** Outline width in points. */
  lineWidth: number = 2;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: RadarChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (data.series.length === 0) return;
    const categories = data.series.reduce((best, s) => (s.dataPoints.length > best.length ? s.dataPoints.map((p) => p.label) : best), [] as string[]);
    const n = categories.length;
    if (n < 3) throw new RangeError('A radar chart needs at least three categories.');
    if (!(this.fillOpacity >= 0 && this.fillOpacity <= 1)) throw new RangeError('Radar fillOpacity must be from 0 to 1.');

    // Value scale: the value axis maps its range to the centre and the rim.
    const axis = data.yAxis;
    let min = axis.minValue;
    let max = axis.maxValue;
    let steps = axis.stepCount > 0 ? axis.stepCount : 5;
    let tickFormat = axis.valueFormat ?? 'N0';
    if (axis.autoScale || !axis.hasMaxValue) {
      const values = data.series.flatMap((s) => s.dataPoints.map((p) => p.value));
      const nice = computeNiceScale(Math.min(...values), Math.max(...values), axis.stepCount, axis.includeZero ?? true, axis.headroom ?? 0, axis.hasMinValue ? axis.minValue : undefined, axis.hasMaxValue ? axis.maxValue : undefined);
      min = nice.minValue;
      max = nice.maxValue;
      steps = nice.stepCount;
      tickFormat = axis.valueFormat ?? nice.autoFormat;
    }

    const font = this.resolveFontFamily();
    const labelSize = 10;
    let widest = 0;
    for (const c of categories) widest = Math.max(widest, canvas.measureText(c, labelSize, font).width);
    const top = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const legendBand = this.showLegend && data.series.length > 1 ? 28 : 0;
    const bottom = this.height - 12 - legendBand - (this.caption !== '' ? 16 : 0);
    const cx = this.width / 2;
    const cy = (top + bottom) / 2;
    const radius = Math.max(20, Math.min(this.width / 2 - widest - 20, (bottom - top) / 2 - labelSize - 10));
    const angle = (i: number): number => -Math.PI / 2 + (2 * Math.PI * i) / n;
    const at = (i: number, r: number): Point => new Point(cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i)));

    // Grid rings and spokes.
    const gridColor = this.appearance.gridLineColor;
    for (let k = 1; k <= steps; k++) {
      const r = (radius * k) / steps;
      const commands: ChartPathCommand[] = [];
      if (this.gridShape === 'circle') {
        const c = KAPPA * r;
        commands.push(
          { op: 'M', values: [cx + r, cy] },
          { op: 'C', values: [cx + r, cy + c, cx + c, cy + r, cx, cy + r] },
          { op: 'C', values: [cx - c, cy + r, cx - r, cy + c, cx - r, cy] },
          { op: 'C', values: [cx - r, cy - c, cx - c, cy - r, cx, cy - r] },
          { op: 'C', values: [cx + c, cy - r, cx + r, cy - c, cx + r, cy] },
          { op: 'Z', values: [] }
        );
      } else {
        for (let i = 0; i < n; i++) commands.push({ op: i === 0 ? 'M' : 'L', values: [at(i, r).x, at(i, r).y] });
        commands.push({ op: 'Z', values: [] });
      }
      strokeChartPath(canvas, { commands, color: gridColor, lineWidth: 0.5 });
    }
    for (let i = 0; i < n; i++) canvas.drawLine(cx, cy, at(i, radius).x, at(i, radius).y, gridColor, 0.5);
    for (let k = 1; k <= steps; k++) {
      const v = min + ((max - min) * k) / steps;
      canvas.drawText(cx + 4, cy - (radius * k) / steps + 2, formatChartNumber(v, tickFormat), this.appearance.axisColor, 9, font, TextAlignment.Left);
    }
    for (let i = 0; i < n; i++) {
      const p = at(i, radius + 8);
      const cos = Math.cos(angle(i));
      const sin = Math.sin(angle(i));
      const align = cos > 0.1 ? TextAlignment.Left : cos < -0.1 ? TextAlignment.Right : TextAlignment.Center;
      const y = sin < -0.1 ? p.y - labelSize : sin > 0.1 ? p.y : p.y - labelSize / 2;
      canvas.drawText(p.x, y, categories[i], this.appearance.axisColor, labelSize, font, align);
    }

    // Series.
    const background = this.effectiveBackgroundColor ?? Color.white;
    data.series.forEach((series, s) => {
      const color = series.hasColor ? series.color : categoryColor(this.appearance, undefined, s);
      const pts: Point[] = [];
      for (let i = 0; i < n; i++) {
        const v = i < series.dataPoints.length ? series.dataPoints[i].value : min;
        pts.push(at(i, radius * clamp01(valueFraction(v, min, max))));
      }
      const commands: ChartPathCommand[] = [{ op: 'M', values: [pts[0].x, pts[0].y] }];
      if (this.curve === 'smooth') {
        for (let i = 0; i < n; i++) {
          const p0 = pts[(i + n - 1) % n];
          const p1 = pts[i];
          const p2 = pts[(i + 1) % n];
          const p3 = pts[(i + 2) % n];
          commands.push({ op: 'C', values: [p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y] });
        }
      } else for (let i = 1; i < n; i++) commands.push({ op: 'L', values: [pts[i].x, pts[i].y] });
      commands.push({ op: 'Z', values: [] });
      if (this.fillOpacity > 0) fillChartPath(canvas, { commands, color: color.withAlpha(this.fillOpacity) });
      strokeChartPath(canvas, { commands, color, lineWidth: this.lineWidth, lineJoin: 'round' });
      for (let i = 0; i < n; i++) {
        if (this.showMarkers) drawChartMarker(canvas, pts[i].x, pts[i].y, 3.5, color, 'circle', 'solid', 1.5, background, this.lineWidth);
        if (this.showValueLabels && i < series.dataPoints.length) {
          const out = at(i, radius * clamp01(valueFraction(series.dataPoints[i].value, min, max)) + 12);
          canvas.drawText(out.x, out.y - 4.5, formatChartNumber(series.dataPoints[i].value, tickFormat), this.appearance.legendTextColor, 9, font, TextAlignment.Center);
        }
      }
    });

    // Legend.
    if (legendBand > 0) {
      const size = 10;
      const widths = data.series.map((s) => canvas.measureText(s.name, size, font).width + 18);
      let x = (this.width - widths.reduce((a, b) => a + b + 8, -8)) / 2;
      const y = this.height - 12 - legendBand + 8 - (this.caption !== '' ? 0 : 0);
      data.series.forEach((s, i) => {
        const color = s.hasColor ? s.color : categoryColor(this.appearance, undefined, i);
        canvas.fillRect(x, y + 1, 8, 8, color);
        canvas.drawText(x + 14, y, s.name, this.appearance.legendTextColor, size, font, TextAlignment.Left);
        x += widths[i] + 8;
      });
    }
  }
}
