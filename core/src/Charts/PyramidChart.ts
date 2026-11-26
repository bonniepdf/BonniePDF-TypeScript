// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { fillChartPath } from './Graphics/ChartVector';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { applyChartTemplate } from './Graphics/ChartTemplate';

export const PYRAMID_CHART_OWN_OPTION_KEYS = ['stageGap', 'inverted', 'labelTemplate', 'shareTemplate', 'valueFormat'] as const;

export const PYRAMID_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...PYRAMID_CHART_OWN_OPTION_KEYS] as const;

export type PyramidChartOptions = ChartBaseOptions & Partial<Pick<PyramidChart, (typeof PYRAMID_CHART_OWN_OPTION_KEYS)[number]>>;

/** A stacked pyramid chart: hierarchical tiers expanding from apex to base (or inverted). */
export class PyramidChart extends ChartBase {
  stageGap: number = 2;
  inverted: boolean = false;
  labelTemplate: string = '{label}  {value}';
  shareTemplate: string = '{share:P0}';
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: PyramidChartOptions) {
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
    if (points.some((p) => !(p.value >= 0) || !Number.isFinite(p.value))) throw new RangeError('Pyramid values must be finite and nonnegative.');
    const total = points.reduce((s, p) => s + p.value, 0);
    if (!(total > 0)) return;
    const font = this.resolveFontFamily();
    const showShare = this.shareTemplate !== '';
    const shares = points.map((p) => applyChartTemplate(this.shareTemplate, { share: p.value / total }));
    const shareW = showShare ? Math.max(...shares.map((s) => canvas.measureText(s, 10, font).width)) + 16 : 0;
    const left = 24;
    const right = 24;
    const top = (data.title !== '' ? 60 : 18) + (data.subtitle !== '' ? 18 : 0);
    const bottom = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const pyrW = Math.max(60, this.width - left - right - shareW);
    const cx = left + pyrW / 2;
    const gap = Math.max(0, this.stageGap);
    const totalH = Math.max(40, bottom - top);
    const usableH = Math.max(20, totalH - gap * (n - 1));
    const minSliceH = Math.min(18, usableH / (n * 1.5));
    const rawH = points.map((p) => Math.max(minSliceH, (p.value / total) * usableH));
    const sumRaw = rawH.reduce((a, b) => a + b, 0);
    const heights = rawH.map((h) => (h / sumRaw) * usableH);
    const effects = this.appearance.barEffects;
    const widthAt = (yPos: number): number => {
      const frac = Math.max(0, Math.min(1, (yPos - top) / totalH));
      return pyrW * (this.inverted ? 1 - frac : frac);
    };

    let y = top;
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const h = heights[i];
      const topW = widthAt(y);
      const bottomW = widthAt(y + h);
      const color = categoryColor(this.appearance, p, i);
      const commands = [
        { op: 'M' as const, values: [cx - topW / 2, y] },
        { op: 'L' as const, values: [cx + topW / 2, y] },
        { op: 'L' as const, values: [cx + bottomW / 2, y + h] },
        { op: 'L' as const, values: [cx - bottomW / 2, y + h] },
        { op: 'Z' as const, values: [] },
      ];
      fillChartPath(canvas, { commands, color, ...(effects.length > 0 ? { effects } : {}) });
      const label = applyChartTemplate(this.labelTemplate.split('{value}').join(`{value:${this.valueFormat}}`), { label: p.label, value: p.value });
      const midW = (topW + bottomW) / 2;
      const fits = canvas.measureText(label, 10, font).width + 10 <= midW && h >= 14;
      if (fits) {
        canvas.drawText(cx, y + h / 2 - 5, label, contrastTextColor(color), 10, font, TextAlignment.Center);
      } else {
        canvas.drawText(cx + midW / 2 + 8, y + h / 2 - 5, label, this.appearance.legendTextColor, 10, font, TextAlignment.Left);
      }
      if (showShare) {
        canvas.drawText(left + pyrW + 10, y + h / 2 - 5, shares[i], this.appearance.axisColor, 10, font, TextAlignment.Left);
      }
      y += h + gap;
    }
  }
}
