// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, StandardFonts, TextAlignment, toColor, type ICanvas, type ColorInput } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { applyChartTemplate } from './Graphics/ChartTemplate';
import { dimColor } from './Graphics/ChartTint';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { arcStrokeCommands, circleCommands, ringSectorCommands } from './Graphics/ChartArc';

/** A qualitative range band on a {@link GaugeChart}. */
export interface GaugeBand {
  /** Upper bound of this band. */
  max: number;
  /** Fill colour for this band. */
  color?: ColorInput;
}

export const GAUGE_CHART_OWN_OPTION_KEYS = [
  'value',
  'minValue',
  'maxValue',
  'bands',
  'target',
  'arc',
  'needle',
  'showScale',
  'valueTemplate',
  'valueFormat',
  'unit',
] as const;

export const GAUGE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...GAUGE_CHART_OWN_OPTION_KEYS] as const;

export type GaugeChartOptions = ChartBaseOptions & Partial<Pick<GaugeChart, (typeof GAUGE_CHART_OWN_OPTION_KEYS)[number]>>;

/** A radial KPI gauge with threshold bands, ticks, optional target notch, and needle or marker. */
export class GaugeChart extends ChartBase {
  value: number = 0;
  minValue: number = 0;
  maxValue: number = 100;
  bands: readonly GaugeBand[] = [];
  target?: number;
  /** Total sweep angle in degrees (90 to 300), centred over the top. */
  arc: number = 180;
  needle: 'needle' | 'marker' = 'needle';
  showScale: boolean = true;
  valueTemplate: string = '{value}';
  valueFormat: string = 'G';
  unit: string = '';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: GaugeChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (!Number.isFinite(this.minValue) || !Number.isFinite(this.maxValue) || !(this.maxValue > this.minValue)) {
      throw new RangeError('Gauge maxValue must be greater than minValue.');
    }
    if (!Number.isFinite(this.value)) throw new RangeError('Gauge value must be finite.');
    if (!(this.arc >= 90 && this.arc <= 300)) throw new RangeError('Gauge arc must be between 90 and 300 degrees.');
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const topEdge = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const availW = Math.max(80, this.width - 48);
    const availH = Math.max(60, bottomEdge - topEdge);
    const arcRad = (this.arc * Math.PI) / 180;
    const startAngle = -Math.PI / 2 - arcRad / 2;
    const endAngle = -Math.PI / 2 + arcRad / 2;
    const extraBelow = this.arc > 180 ? Math.sin((arcRad - Math.PI) / 2) : 0;
    const scalePad = this.showScale ? 22 : 8;
    const radius = Math.max(24, Math.min((availW - scalePad * 2) / 2, (availH - scalePad - 24) / (1 + extraBelow)));
    const thickness = Math.max(10, radius * 0.22);
    const innerR = radius - thickness;
    const cx = this.width / 2;
    const cy = topEdge + scalePad + radius;
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const primary = this.appearance.seriesPalette[0] ?? Color.fromHex('#2563eb');
    const span = this.maxValue - this.minValue;
    const angleFor = (v: number): number => startAngle + Math.max(0, Math.min(1, (v - this.minValue) / span)) * arcRad;

    if (this.bands.length > 0) {
      let prev = this.minValue;
      this.bands.forEach((band, i) => {
        const hi = Math.max(prev, Math.min(this.maxValue, band.max));
        if (hi > prev) {
          const color = band.color !== undefined ? toColor(band.color) : dimColor(primary, bg, 0.25 + (i / Math.max(1, this.bands.length)) * 0.55);
          fillChartPath(canvas, { commands: ringSectorCommands(cx, cy, innerR, radius, angleFor(prev), angleFor(hi)), color });
        }
        prev = hi;
      });
      if (prev < this.maxValue) {
        fillChartPath(canvas, { commands: ringSectorCommands(cx, cy, innerR, radius, angleFor(prev), endAngle), color: dimColor(this.appearance.axisColor, bg, 0.2) });
      }
    } else {
      fillChartPath(canvas, { commands: ringSectorCommands(cx, cy, innerR, radius, startAngle, endAngle), color: dimColor(primary, bg, 0.16) });
      const va = angleFor(this.value);
      if (va > startAngle + 1e-4) {
        fillChartPath(canvas, { commands: ringSectorCommands(cx, cy, innerR, radius, startAngle, va), color: primary });
      }
    }

    if (this.showScale) {
      const steps = 4;
      for (let i = 0; i <= steps; i++) {
        const v = this.minValue + (span * i) / steps;
        const a = angleFor(v);
        const x1 = cx + (radius + 2) * Math.cos(a);
        const y1 = cy + (radius + 2) * Math.sin(a);
        const x2 = cx + (radius + 7) * Math.cos(a);
        const y2 = cy + (radius + 7) * Math.sin(a);
        canvas.drawLine(x1, y1, x2, y2, this.appearance.axisColor, 1);
        const lx = cx + (radius + 16) * Math.cos(a);
        const ly = cy + (radius + 16) * Math.sin(a) - 4.5;
        canvas.drawText(lx, ly, formatChartNumber(v, this.valueFormat), this.appearance.axisColor, 9, font, TextAlignment.Center);
      }
    }

    if (this.target !== undefined && Number.isFinite(this.target)) {
      const ta = angleFor(this.target);
      strokeChartPath(canvas, {
        commands: [
          { op: 'M', values: [cx + (innerR - 4) * Math.cos(ta), cy + (innerR - 4) * Math.sin(ta)] },
          { op: 'L', values: [cx + (radius + 4) * Math.cos(ta), cy + (radius + 4) * Math.sin(ta)] },
        ],
        color: this.appearance.legendTextColor,
        lineWidth: 2,
      });
    }

    const va = angleFor(this.value);
    if (this.needle === 'marker') {
      const mr = (innerR + radius) / 2;
      const mx = cx + mr * Math.cos(va);
      const my = cy + mr * Math.sin(va);
      fillChartPath(canvas, { commands: circleCommands(mx, my, thickness * 0.45), color: bg });
      fillChartPath(canvas, { commands: circleCommands(mx, my, thickness * 0.3), color: this.appearance.legendTextColor });
    } else {
      const tipR = radius - 3;
      const baseW = Math.max(3, thickness * 0.22);
      const perp = va + Math.PI / 2;
      const needleCmds = [
        { op: 'M' as const, values: [cx + tipR * Math.cos(va), cy + tipR * Math.sin(va)] },
        { op: 'L' as const, values: [cx + baseW * Math.cos(perp), cy + baseW * Math.sin(perp)] },
        { op: 'L' as const, values: [cx - baseW * Math.cos(perp), cy - baseW * Math.sin(perp)] },
        { op: 'Z' as const, values: [] },
      ];
      fillChartPath(canvas, { commands: needleCmds, color: this.appearance.legendTextColor });
      fillChartPath(canvas, { commands: circleCommands(cx, cy, baseW * 1.35), color: this.appearance.legendTextColor });
      fillChartPath(canvas, { commands: circleCommands(cx, cy, baseW * 0.55), color: bg });
    }

    // Subtle inner rim highlight
    strokeChartPath(canvas, {
      commands: arcStrokeCommands(cx, cy, innerR, startAngle, endAngle),
      color: dimColor(this.appearance.axisColor, bg, 0.15),
      lineWidth: 0.75,
    });

    const formatted = applyChartTemplate(this.valueTemplate.split('{value}').join(`{value:${this.valueFormat}}`), { value: this.value }) + this.unit;
    const textY = this.needle === 'needle' ? cy + Math.max(12, radius * 0.18) : cy - 10;
    const fontSize = Math.max(14, Math.min(24, Math.round(radius * 0.24)));
    canvas.drawText(cx, textY, formatted, this.appearance.legendTextColor, fontSize, boldFont, TextAlignment.Center);
  }
}
