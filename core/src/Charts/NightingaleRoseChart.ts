// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { dimColor } from './Graphics/ChartTint';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { circleCommands, ringSectorCommands } from './Graphics/ChartArc';

export const NIGHTINGALE_ROSE_CHART_OWN_OPTION_KEYS = [
  'innerRadiusRatio',
  'areaScale',
  'showGridCircles',
  'showLabels',
  'showValueLabels',
  'valueFormat',
] as const;

export const NIGHTINGALE_ROSE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...NIGHTINGALE_ROSE_CHART_OWN_OPTION_KEYS] as const;

export type NightingaleRoseChartOptions = ChartBaseOptions & Partial<Pick<NightingaleRoseChart, (typeof NIGHTINGALE_ROSE_CHART_OWN_OPTION_KEYS)[number]>>;

/** A Nightingale rose (variable-radius polar area) chart: equal-angle petals whose radius encodes magnitude. */
export class NightingaleRoseChart extends ChartBase {
  innerRadiusRatio: number = 0.12;
  /** When true (default), radius scales by sqrt(value/max) so petal area is proportional to value. */
  areaScale: boolean = true;
  showGridCircles: boolean = true;
  showLabels: boolean = true;
  showValueLabels: boolean = false;
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: NightingaleRoseChartOptions) {
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
    if (points.some((p) => !(p.value >= 0) || !Number.isFinite(p.value))) throw new RangeError('NightingaleRose values must be finite and nonnegative.');
    const maxVal = Math.max(...points.map((p) => p.value));
    if (!(maxVal > 0)) return;
    const font = this.resolveFontFamily();
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const labelMargin = this.showLabels ? 36 : 12;
    const outerR = Math.max(24, Math.min(this.width / 2 - labelMargin, (bottomEdge - topEdge) / 2 - labelMargin));
    const innerR = outerR * Math.max(0, Math.min(0.6, this.innerRadiusRatio));
    const cx = this.width / 2;
    const cy = topEdge + (bottomEdge - topEdge) / 2;

    if (this.showGridCircles) {
      const gridColor = dimColor(this.appearance.axisColor, bg, 0.25);
      for (let step = 1; step <= 4; step++) {
        const gr = innerR + ((outerR - innerR) * step) / 4;
        strokeChartPath(canvas, { commands: circleCommands(cx, cy, gr), color: gridColor, lineWidth: 0.75 });
      }
    }

    const sector = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const a0 = -Math.PI / 2 + i * sector;
      const a1 = a0 + sector;
      const ratio = p.value / maxVal;
      const scaled = this.areaScale ? Math.sqrt(ratio) : ratio;
      const r = innerR + (outerR - innerR) * scaled;
      const color = categoryColor(this.appearance, p, i);
      const cmds = ringSectorCommands(cx, cy, innerR, r, a0, a1);
      fillChartPath(canvas, { commands: cmds, color });
      strokeChartPath(canvas, { commands: cmds, color: bg, lineWidth: 1.25, lineJoin: 'round', miterLimit: 10 });

      const mid = (a0 + a1) / 2;
      if (this.showLabels) {
        const lr = outerR + 14;
        const lx = cx + lr * Math.cos(mid);
        const ly = cy + lr * Math.sin(mid) - 5;
        const cos = Math.cos(mid);
        const align = cos > 0.2 ? TextAlignment.Left : cos < -0.2 ? TextAlignment.Right : TextAlignment.Center;
        canvas.drawText(lx, ly, p.label, this.appearance.legendTextColor, 10, font, align);
      }
      if (this.showValueLabels && r - innerR > 18) {
        const vr = innerR + (r - innerR) * 0.65;
        canvas.drawText(cx + vr * Math.cos(mid), cy + vr * Math.sin(mid) - 4.5, formatChartNumber(p.value, this.valueFormat), bg, 9, font, TextAlignment.Center);
      }
    }
  }
}
