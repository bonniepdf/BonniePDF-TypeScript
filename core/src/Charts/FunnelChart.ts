// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, type ICanvas, TextAlignment } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { fillChartPath } from './Graphics/ChartVector';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { applyChartTemplate } from './Graphics/ChartTemplate';

/** Settable properties declared by {@link FunnelChart} itself. */
export const FUNNEL_CHART_OWN_OPTION_KEYS = ['shape', 'stageGap', 'neckWidth', 'labelTemplate', 'conversionTemplate', 'valueFormat'] as const;

/** The full option surface, base included. */
export const FUNNEL_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...FUNNEL_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link FunnelChart}. */
export type FunnelChartOptions = ChartBaseOptions & Partial<Pick<FunnelChart, (typeof FUNNEL_CHART_OWN_OPTION_KEYS)[number]>>;

/** A funnel: the stages of a process, each as wide as its value, with the share that survives each step. */
export class FunnelChart extends ChartBase {
  /** `trapezoid` (default): each stage narrows to the next one's width. `bars`: centred bars, one width per stage. */
  shape: 'trapezoid' | 'bars' = 'trapezoid';
  /** Gap between stages in points. */
  stageGap: number = 2;
  /** The narrowest a stage may be, as a fraction of the widest (`0.12`). */
  neckWidth: number = 0.12;
  /** The text inside each stage; `{label}` and `{value}` are replaced. */
  labelTemplate: string = '{label}  {value}';
  /** The text beside each stage after the first; `{conversion}` is its share of the previous stage, `{conversion:P0}` formats it. Empty draws none. */
  conversionTemplate: string = '{conversion:P0}';
  /** Number format of `{value}`. */
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: FunnelChartOptions) {
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
    if (points.some((p) => !(p.value >= 0) || !Number.isFinite(p.value))) throw new RangeError('Funnel values must be finite and nonnegative.');
    if (!(this.neckWidth >= 0 && this.neckWidth <= 1)) throw new RangeError('Funnel neckWidth must be from 0 to 1.');
    const font = this.resolveFontFamily();
    const max = Math.max(...points.map((p) => p.value));
    const showConversion = this.conversionTemplate !== '' && n > 1;
    const conversions = points.map((p, i) => (i === 0 ? '' : applyChartTemplate(this.conversionTemplate, { conversion: points[i - 1].value > 0 ? p.value / points[i - 1].value : 0 })));
    let band = 0;
    if (showConversion) for (const text of conversions) band = Math.max(band, canvas.measureText(text, 10, font).width);
    if (showConversion) band += 12;
    const left = 24;
    const right = 24;
    const top = (data.title !== '' ? 64 : 18) + (data.subtitle !== '' ? 18 : 0);
    const bottom = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const funnelW = Math.max(40, this.width - left - right - band);
    const cx = left + funnelW / 2;
    const gap = Math.max(0, this.stageGap);
    const stageH = (bottom - top - gap * (n - 1)) / n;
    const widthOf = (v: number): number => funnelW * Math.max(this.neckWidth, max > 0 ? v / max : 0);
    const effects = this.appearance.barEffects;
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const y = top + i * (stageH + gap);
      const topW = widthOf(p.value);
      const bottomW = this.shape === 'trapezoid' && i < n - 1 ? widthOf(points[i + 1].value) : topW;
      const color = categoryColor(this.appearance, p, i);
      const commands = [
        { op: 'M' as const, values: [cx - topW / 2, y] },
        { op: 'L' as const, values: [cx + topW / 2, y] },
        { op: 'L' as const, values: [cx + bottomW / 2, y + stageH] },
        { op: 'L' as const, values: [cx - bottomW / 2, y + stageH] },
        { op: 'Z' as const, values: [] },
      ];
      fillChartPath(canvas, { commands, color, ...(effects.length > 0 ? { effects } : {}) });
      const label = applyChartTemplate(this.labelTemplate.split('{value}').join(`{value:${this.valueFormat}}`), { label: p.label, value: p.value });
      const size = 11;
      const fits = canvas.measureText(label, size, font).width + 8 <= (topW + bottomW) / 2;
      canvas.drawText(cx, y + stageH / 2 - size / 2, label, fits ? contrastTextColor(color) : this.appearance.legendTextColor, size, font, TextAlignment.Center);
      if (showConversion && i > 0) canvas.drawText(left + funnelW + 8, y + stageH / 2 - 5, conversions[i], this.appearance.axisColor, 10, font, TextAlignment.Left);
    }
  }
}
