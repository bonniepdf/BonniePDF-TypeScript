// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import { applyOptions, Color, toColor, type ColorInput, type ICanvas, TextAlignment } from './ChartHost';
import { ChartOrientation } from './ChartOrientation';
import { formatChartNumber } from './ChartNumberFormat';
import { checkValueRange, valueFraction } from './Graphics/ChartValueScale';

/** Qualitative background range band on a {@link BulletChart}. */
export interface BulletRange {
  /** Upper threshold value of this qualitative range band. */
  max: number;
  /** Optional fill colour for this range band. */
  color?: ColorInput;
}

/** Settable properties declared by {@link BulletChart} itself. */
export const BULLET_CHART_OWN_OPTION_KEYS = [
  'value',
  'target',
  'ranges',
  'minValue',
  'maxValue',
  'measureColor',
  'targetColor',
  'orientation',
  'showScale',
  'showValueLabel',
  'valueFormat',
  'valuePrefix',
  'valueSuffix',
  'label',
] as const;

/** The full option surface, base included. */
export const BULLET_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...BULLET_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link BulletChart}. */
export type BulletChartOptions = ChartBaseOptions &
  Partial<Omit<Pick<BulletChart, (typeof BULLET_CHART_OWN_OPTION_KEYS)[number]>, 'measureColor' | 'targetColor'>> & {
    /** Fill colour of the primary measure bar. */
    measureColor?: ColorInput;
    /** Fill colour of the comparative target marker. */
    targetColor?: ColorInput;
  };

const DEFAULT_RANGE_COLORS = ['#94a3b8', '#cbd5e1', '#e2e8f0'];

/** Compact KPI bullet chart with qualitative background bands, primary measure bar, and target marker. */
export class BulletChart extends ChartBase {
  /** Primary measured KPI value. */
  value: number = 0;
  /** Optional comparative target value drawn as a perpendicular marker. */
  target: number | undefined;
  /** Qualitative background bands ordered from lower to upper thresholds. */
  ranges: readonly BulletRange[] = [];
  /** Minimum scale value (default 0). */
  minValue: number = 0;
  /** Optional explicit maximum scale value; inferred from data and ranges when omitted. */
  maxValue: number | undefined;
  /** Bar orientation (`Horizontal` default or `Vertical`). */
  orientation: ChartOrientation = ChartOrientation.Horizontal;
  /** Whether to draw numeric scale ticks beneath or beside the bar. */
  showScale: boolean = false;
  /** Whether to draw the formatted value label beside the bar. */
  showValueLabel: boolean = false;
  /** Number format for scale and value labels. */
  valueFormat: string = 'G';
  /** Prefix prepended to formatted values. */
  valuePrefix: string = '';
  /** Suffix appended to formatted values. */
  valueSuffix: string = '';
  /** Metric label drawn beside the bullet bar. */
  label: string = '';

  private _measureColor: Color = Color.fromHex('#2563eb');
  /** Fill colour of the primary measure bar. */
  get measureColor(): Color {
    return this._measureColor;
  }
  set measureColor(value: ColorInput) {
    this._measureColor = toColor(value);
  }

  private _targetColor: Color = Color.fromHex('#0f172a');
  /** Fill colour of the comparative target marker. */
  get targetColor(): Color {
    return this._targetColor;
  }
  set targetColor(value: ColorInput) {
    this._targetColor = toColor(value);
  }

  constructor(options?: BulletChartOptions) {
    super();
    this.width = 320;
    this.height = 44;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  private resolveMax(): number {
    if (this.maxValue !== undefined) return this.maxValue;
    let m = Math.max(this.value, this.target ?? this.minValue);
    for (const r of this.ranges) if (r.max > m) m = r.max;
    return m > this.minValue ? m : this.minValue + 100;
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const maxV = this.resolveMax();
    checkValueRange(this.minValue, maxV);
    const font = this.resolveFontFamily();
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const titlePad = data.title !== '' ? 36 : 0;
    const scaleBand = this.showScale ? 16 : 0;
    const captionPad = this.caption !== '' ? 16 : 0;

    let leftPad = 8;
    let rightPad = 8;
    if (horizontal && this.label !== '') {
      leftPad = Math.min(this.width * 0.35, Math.ceil(canvas.measureText(this.label, 10, font).width + 16));
    }
    const formattedVal = `${this.valuePrefix}${formatChartNumber(this.value, this.valueFormat)}${this.valueSuffix}`;
    if (horizontal && this.showValueLabel) {
      rightPad = Math.min(this.width * 0.25, Math.ceil(canvas.measureText(formattedVal, 10, font).width + 14));
    }

    const plotX = leftPad;
    const plotY = titlePad + 6;
    const plotW = Math.max(10, this.width - leftPad - rightPad);
    const plotH = Math.max(10, this.height - plotY - 6 - scaleBand - captionPad);

    if (horizontal && this.label !== '') {
      canvas.drawText(plotX - 8, plotY + plotH / 2 - 5, this.label, this.appearance.titleColor, 10, font, TextAlignment.Right);
    }

    // Qualitative background ranges painted largest-to-smallest so smaller bands sit on top
    const sortedRanges = [...this.ranges]
      .filter((r) => Number.isFinite(r.max) && r.max > this.minValue)
      .sort((a, b) => b.max - a.max);

    if (sortedRanges.length === 0) {
      canvas.fillRect(plotX, plotY, plotW, plotH, Color.fromHex('#e2e8f0'));
    } else {
      for (let i = 0; i < sortedRanges.length; i++) {
        const r = sortedRanges[i];
        const frac = Math.max(0, Math.min(1, valueFraction(r.max, this.minValue, maxV)));
        const col = r.color !== undefined ? toColor(r.color) : Color.fromHex(DEFAULT_RANGE_COLORS[(sortedRanges.length - 1 - i) % DEFAULT_RANGE_COLORS.length]);
        if (horizontal) canvas.fillRect(plotX, plotY, frac * plotW, plotH, col);
        else canvas.fillRect(plotX, plotY + (1 - frac) * plotH, plotW, frac * plotH, col);
      }
    }

    // Primary measure bar (42% of band thickness, centred)
    const valFrac = Math.max(0, Math.min(1, valueFraction(this.value, this.minValue, maxV)));
    if (horizontal) {
      const mh = plotH * 0.42;
      canvas.fillRect(plotX, plotY + (plotH - mh) / 2, valFrac * plotW, mh, this._measureColor);
    } else {
      const mw = plotW * 0.42;
      const mh = valFrac * plotH;
      canvas.fillRect(plotX + (plotW - mw) / 2, plotY + plotH - mh, mw, mh, this._measureColor);
    }

    // Target perpendicular marker
    if (this.target !== undefined && Number.isFinite(this.target)) {
      const tFrac = Math.max(0, Math.min(1, valueFraction(this.target, this.minValue, maxV)));
      if (horizontal) {
        const tx = plotX + tFrac * plotW;
        const pad = plotH * 0.14;
        canvas.drawLine(tx, plotY + pad, tx, plotY + plotH - pad, this._targetColor, 2);
      } else {
        const ty = plotY + (1 - tFrac) * plotH;
        const pad = plotW * 0.14;
        canvas.drawLine(plotX + pad, ty, plotX + plotW - pad, ty, this._targetColor, 2);
      }
    }

    if (horizontal && this.showValueLabel) {
      canvas.drawText(plotX + plotW + 6, plotY + plotH / 2 - 5, formattedVal, this.appearance.titleColor, 10, font, TextAlignment.Left);
    }

    if (this.showScale && horizontal) {
      const ticks = 4;
      for (let i = 0; i <= ticks; i++) {
        const tx = plotX + (i / ticks) * plotW;
        const v = this.minValue + (i / ticks) * (maxV - this.minValue);
        const lbl = `${this.valuePrefix}${formatChartNumber(v, this.valueFormat)}${this.valueSuffix}`;
        canvas.drawText(tx, plotY + plotH + 4, lbl, this.appearance.axisColor, 8, font, TextAlignment.Center);
      }
    }
  }
}
