// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { applyChartAffixes, formatChartNumber } from './ChartNumberFormat';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { dimColor } from './Graphics/ChartTint';
import { strokeChartPath } from './Graphics/ChartVector';
import { arcStrokeCommands } from './Graphics/ChartArc';

export const RADIAL_BAR_CHART_OWN_OPTION_KEYS = [
  'maxValue',
  'maxAngle',
  'innerRadiusRatio',
  'roundCaps',
  'showValueLabels',
  'valueFormat',
  'valuePrefix',
  'valueSuffix',
] as const;

export const RADIAL_BAR_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...RADIAL_BAR_CHART_OWN_OPTION_KEYS] as const;

export type RadialBarChartOptions = ChartBaseOptions & Partial<Pick<RadialBarChart, (typeof RADIAL_BAR_CHART_OWN_OPTION_KEYS)[number]>>;

/** Concentric circular bars comparing categories around a shared radial origin. */
export class RadialBarChart extends ChartBase {
  maxValue?: number;
  maxAngle: number = 270;
  innerRadiusRatio: number = 0.25;
  roundCaps: boolean = true;
  showValueLabels: boolean = true;
  valueFormat: string = 'G';
  valuePrefix: string = '';
  valueSuffix: string = '';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: RadialBarChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const points = data.series[0]?.dataPoints ?? [];
    const n = points.length;
    if (n === 0) return;
    if (points.some((p) => !(p.value >= 0) || !Number.isFinite(p.value))) throw new RangeError('RadialBar values must be finite and nonnegative.');
    if (!(this.maxAngle >= 90 && this.maxAngle <= 330)) throw new RangeError('RadialBar maxAngle must be between 90 and 330 degrees.');
    const maxVal = this.maxValue ?? Math.max(...points.map((p) => p.value));
    if (!(maxVal > 0)) return;
    const font = this.resolveFontFamily();
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const outerR = Math.max(24, Math.min(this.width / 2 - 24, (bottomEdge - topEdge) / 2 - 8));
    const innerR = outerR * Math.max(0.1, Math.min(0.7, this.innerRadiusRatio));
    const cx = this.width / 2 + 12;
    const cy = topEdge + (bottomEdge - topEdge) / 2;
    const band = (outerR - innerR) / n;
    const strokeW = Math.max(3, band * 0.68);
    const startRad = -Math.PI / 2;
    const sweepRad = (this.maxAngle * Math.PI) / 180;
    const lineCap = this.roundCaps ? 'round' : 'butt';

    for (let i = 0; i < n; i++) {
      const p = points[i];
      const r = outerR - band * (i + 0.5);
      const color = categoryColor(this.appearance, p, i);
      const track = dimColor(color, bg, 0.14);
      strokeChartPath(canvas, { commands: arcStrokeCommands(cx, cy, r, startRad, startRad + sweepRad), color: track, lineWidth: strokeW, lineCap });
      const frac = Math.max(0, Math.min(1, p.value / maxVal));
      const endRad = startRad + frac * sweepRad;
      if (frac > 1e-4) {
        strokeChartPath(canvas, { commands: arcStrokeCommands(cx, cy, r, startRad, endRad), color, lineWidth: strokeW, lineCap });
      }
      const labelY = cy - r - 4.5;
      canvas.drawText(cx - 10, labelY, p.label, this.appearance.legendTextColor, 9, font, TextAlignment.Right);
      if (this.showValueLabels) {
        const valText = applyChartAffixes(formatChartNumber(p.value, this.valueFormat), this.valuePrefix, this.valueSuffix);
        const endX = cx + r * Math.cos(endRad);
        const endY = cy + r * Math.sin(endRad);
        const align = Math.cos(endRad) < -0.15 ? TextAlignment.Right : Math.cos(endRad) > 0.15 ? TextAlignment.Left : TextAlignment.Center;
        const dx = align === TextAlignment.Left ? 8 : align === TextAlignment.Right ? -8 : 0;
        const dy = Math.sin(endRad) > 0.5 ? 6 : Math.sin(endRad) < -0.5 ? -14 : -4.5;
        canvas.drawText(endX + dx, endY + dy, valText, this.appearance.axisColor, 9, font, align);
      }
    }
  }
}
