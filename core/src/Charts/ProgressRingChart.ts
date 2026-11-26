// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, StandardFonts, TextAlignment, toColor, type ICanvas, type ColorInput } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { applyChartTemplate } from './Graphics/ChartTemplate';
import { dimColor } from './Graphics/ChartTint';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { arcStrokeCommands, circleCommands } from './Graphics/ChartArc';

/** One ring of a {@link ProgressRingChart}. */
export interface ProgressRing {
  value: number;
  max?: number;
  label?: string;
  color?: ColorInput;
  trackColor?: ColorInput;
}

export const PROGRESS_RING_CHART_OWN_OPTION_KEYS = [
  'rings',
  'thickness',
  'ringGap',
  'startAngle',
  'roundCaps',
  'centerTemplate',
  'centerSubtext',
  'showLegend',
] as const;

export const PROGRESS_RING_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...PROGRESS_RING_CHART_OWN_OPTION_KEYS] as const;

export type ProgressRingChartOptions = ChartBaseOptions & Partial<Pick<ProgressRingChart, (typeof PROGRESS_RING_CHART_OWN_OPTION_KEYS)[number]>>;

/** Concentric circular progress rings with centre summary and optional legend. */
export class ProgressRingChart extends ChartBase {
  rings: readonly ProgressRing[] = [];
  thickness: number = 0.14;
  ringGap: number = 0.04;
  startAngle: number = -90;
  roundCaps: boolean = true;
  centerTemplate: string = '{value:P0}';
  centerSubtext: string = '';
  showLegend: boolean = true;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: ProgressRingChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const n = this.rings.length;
    if (n === 0) return;
    if (n > 6) throw new RangeError('ProgressRingChart supports at most 6 rings.');
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const showLeg = this.showLegend && this.rings.some((r) => (r.label ?? '') !== '');
    const legendW = showLeg ? Math.min(this.width * 0.4, 160) : 0;
    const availW = Math.max(60, this.width - 32 - legendW);
    const availH = Math.max(60, bottomEdge - topEdge);
    const outerR = Math.max(24, Math.min(availW, availH) / 2 - 4);
    const cx = 16 + availW / 2;
    const cy = topEdge + availH / 2;
    const strokeW = Math.max(4, outerR * this.thickness);
    const gapW = outerR * this.ringGap;
    const startRad = (this.startAngle * Math.PI) / 180;
    const lineCap = this.roundCaps ? 'round' : 'butt';

    const ringColors: Color[] = [];
    for (let i = 0; i < n; i++) {
      const ring = this.rings[i];
      const max = ring.max ?? 100;
      if (!(max > 0) || !Number.isFinite(max) || !Number.isFinite(ring.value)) {
        throw new RangeError('Progress ring values must be finite and max must be positive.');
      }
      const r = outerR - strokeW / 2 - i * (strokeW + gapW);
      if (r <= strokeW / 2) break;
      const color = ring.color !== undefined ? toColor(ring.color) : categoryColor(this.appearance, undefined, i);
      ringColors.push(color);
      const track = ring.trackColor !== undefined ? toColor(ring.trackColor) : dimColor(color, bg, 0.16);
      strokeChartPath(canvas, { commands: circleCommands(cx, cy, r), color: track, lineWidth: strokeW });
      const frac = Math.max(0, Math.min(1, ring.value / max));
      if (frac >= 0.9999) {
        strokeChartPath(canvas, { commands: circleCommands(cx, cy, r), color, lineWidth: strokeW });
      } else if (frac > 1e-5) {
        strokeChartPath(canvas, {
          commands: arcStrokeCommands(cx, cy, r, startRad, startRad + frac * 2 * Math.PI),
          color,
          lineWidth: strokeW,
          lineCap,
        });
      }
    }

    const first = this.rings[0];
    const firstMax = first.max ?? 100;
    const innerHole = Math.max(12, outerR - n * (strokeW + gapW));
    if (this.centerTemplate !== '' && innerHole >= 16) {
      const mainText = applyChartTemplate(this.centerTemplate, { value: first.value / firstMax, raw: first.value });
      const mainSize = Math.max(11, Math.min(22, Math.floor(innerHole * 0.45)));
      const hasSub = this.centerSubtext !== '';
      const mainY = hasSub ? cy - mainSize * 0.75 : cy - mainSize / 2;
      canvas.drawText(cx, mainY, mainText, this.appearance.legendTextColor, mainSize, boldFont, TextAlignment.Center);
      if (hasSub) {
        canvas.drawText(cx, mainY + mainSize + 3, this.centerSubtext, this.appearance.axisColor, Math.max(8, Math.round(mainSize * 0.5)), font, TextAlignment.Center);
      }
    }

    if (showLeg) {
      const legX = 24 + availW;
      const rowH = 22;
      const startY = cy - (n * rowH) / 2;
      for (let i = 0; i < ringColors.length; i++) {
        const ring = this.rings[i];
        const max = ring.max ?? 100;
        const y = startY + i * rowH;
        fillChartPath(canvas, { commands: circleCommands(legX + 5, y + 6, 4.5), color: ringColors[i] });
        const pct = Math.round((ring.value / max) * 100);
        const text = `${ring.label ?? `Ring ${i + 1}`} (${pct}%)`;
        canvas.drawText(legX + 15, y + 1, text, this.appearance.legendTextColor, 10, font, TextAlignment.Left);
      }
    }
  }
}
