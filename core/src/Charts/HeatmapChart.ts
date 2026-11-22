// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import { applyOptions, Color, toColor, type ColorInput, type ICanvas, TextAlignment } from './ChartHost';
import { formatChartNumber } from './ChartNumberFormat';
import { contrastTextColor } from './Graphics/ChartValueScale';
import type { ChartGradientStop, ChartPathCommand } from './Graphics/ChartPathPlan';
import { fillChartPath } from './Graphics/ChartVector';

const ROUNDED_K = (4 / 3) * (Math.SQRT2 - 1);

function cellRectCommands(x: number, y: number, w: number, h: number, radius: number): ChartPathCommand[] {
  const r = Math.min(Math.max(0, radius), w / 2, h / 2);
  if (r <= 0) {
    return [
      { op: 'M', values: [x, y] },
      { op: 'L', values: [x + w, y] },
      { op: 'L', values: [x + w, y + h] },
      { op: 'L', values: [x, y + h] },
      { op: 'Z', values: [] },
    ];
  }
  const c = ROUNDED_K * r;
  return [
    { op: 'M', values: [x + r, y] },
    { op: 'L', values: [x + w - r, y] },
    { op: 'C', values: [x + w - r + c, y, x + w, y + r - c, x + w, y + r] },
    { op: 'L', values: [x + w, y + h - r] },
    { op: 'C', values: [x + w, y + h - r + c, x + w - r + c, y + h, x + w - r, y + h] },
    { op: 'L', values: [x + r, y + h] },
    { op: 'C', values: [x + r - c, y + h, x, y + h - r + c, x, y + h - r] },
    { op: 'L', values: [x, y + r] },
    { op: 'C', values: [x, y + r - c, x + r - c, y, x + r, y] },
    { op: 'Z', values: [] },
  ];
}

/** Settable properties declared by {@link HeatmapChart} itself. */
export const HEATMAP_CHART_OWN_OPTION_KEYS = [
  'xCategories',
  'yCategories',
  'values',
  'colorScale',
  'minValue',
  'maxValue',
  'cellGap',
  'cellCornerRadius',
  'showCellValues',
  'valueFormat',
  'valuePrefix',
  'valueSuffix',
  'showColorLegend',
  'emptyCellColor',
] as const;

/** The full option surface, base included. */
export const HEATMAP_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...HEATMAP_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link HeatmapChart}. */
export type HeatmapChartOptions = ChartBaseOptions &
  Partial<Omit<Pick<HeatmapChart, (typeof HEATMAP_CHART_OWN_OPTION_KEYS)[number]>, 'colorScale' | 'emptyCellColor'>> & {
    /** Ordered multi-stop colour ramp (at least 2 colours) interpolated across the value range. */
    colorScale?: readonly ColorInput[];
    /** Fill colour used for cells whose value is `null`. */
    emptyCellColor?: ColorInput;
  };

/** 2D categorical matrix heatmap (cohort retention, operational matrices) with WCAG auto-contrast cell values. */
export class HeatmapChart extends ChartBase {
  /** Column category labels drawn along the top or bottom axis. */
  xCategories: readonly string[] = [];
  /** Row category labels drawn along the left axis. */
  yCategories: readonly string[] = [];
  /** 2D matrix of numeric cell values (`null` represents an empty cell). */
  values: readonly (readonly (number | null)[])[] = [];
  /** Optional explicit lower bound for colour interpolation. */
  minValue: number | undefined;
  /** Optional explicit upper bound for colour interpolation. */
  maxValue: number | undefined;
  /** Gap between adjacent heatmap cells in points. */
  cellGap: number = 2;
  /** Corner radius of heatmap cells in points. */
  cellCornerRadius: number = 2;
  /** Whether to draw formatted values inside cells with automatic WCAG contrast. */
  showCellValues: boolean = true;
  /** Number format for cell and legend values. */
  valueFormat: string = 'G';
  /** Prefix prepended to cell and legend values. */
  valuePrefix: string = '';
  /** Suffix appended to cell and legend values. */
  valueSuffix: string = '';
  /** Whether to draw the continuous colour scale legend. */
  showColorLegend: boolean = true;

  private _colorScale: Color[] = ['#eff6ff', '#93c5fd', '#2563eb', '#1e3a8a'].map((h) => Color.fromHex(h));
  /** Ordered multi-stop colour ramp (at least 2 colours) interpolated across the value range. */
  get colorScale(): readonly Color[] {
    return this._colorScale;
  }
  set colorScale(value: readonly ColorInput[]) {
    if (value.length < 2) throw new RangeError('HeatmapChart colorScale requires at least 2 colours.');
    this._colorScale = value.map(toColor);
  }

  private _emptyCellColor: Color = Color.fromHex('#f8fafc');
  /** Fill colour used for cells whose value is `null`. */
  get emptyCellColor(): Color {
    return this._emptyCellColor;
  }
  set emptyCellColor(value: ColorInput) {
    this._emptyCellColor = toColor(value);
  }

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: HeatmapChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  private sampleScale(t: number): Color {
    const clamped = Math.max(0, Math.min(1, t));
    const n = this._colorScale.length - 1;
    const scaled = clamped * n;
    const i = Math.min(n - 1, Math.floor(scaled));
    const frac = scaled - i;
    const a = this._colorScale[i];
    const b = this._colorScale[i + 1];
    const r = Math.round((a.scR + (b.scR - a.scR) * frac) * 255);
    const g = Math.round((a.scG + (b.scG - a.scG) * frac) * 255);
    const bl = Math.round((a.scB + (b.scB - a.scB) * frac) * 255);
    return new Color(r, g, bl, 255);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const rows = this.yCategories.length;
    const cols = this.xCategories.length;
    if (rows === 0 || cols === 0) return;

    let dMin = Infinity;
    let dMax = -Infinity;
    for (let r = 0; r < rows; r++) {
      const row = this.values[r];
      if (!row) continue;
      for (let c = 0; c < cols; c++) {
        const v = row[c];
        if (v !== null && v !== undefined && Number.isFinite(v)) {
          if (v < dMin) dMin = v;
          if (v > dMax) dMax = v;
        }
      }
    }
    const minV = this.minValue ?? (dMin <= dMax ? dMin : 0);
    const maxV = this.maxValue ?? (dMin <= dMax ? (dMax > minV ? dMax : minV + 1) : 1);
    const span = maxV > minV ? maxV - minV : 1;

    const font = this.resolveFontFamily();
    let maxYLabel = 0;
    for (const lbl of this.yCategories) {
      const w = canvas.measureText(lbl, 10, font).width;
      if (w > maxYLabel) maxYLabel = w;
    }

    const leftPad = Math.max(36, Math.min(this.width * 0.3, Math.ceil(maxYLabel + 16)));
    const rightPad = 20;
    const topBand = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const xLabelBand = 22;
    const legendBand = this.showColorLegend ? 32 : 0;
    const captionBand = this.caption !== '' ? 16 : 0;

    const gridX = leftPad;
    const gridY = topBand + xLabelBand;
    const gridW = Math.max(40, this.width - leftPad - rightPad);
    const gridH = Math.max(40, this.height - gridY - 12 - legendBand - captionBand);

    const gap = Math.max(0, this.cellGap);
    const cellW = (gridW - gap * (cols - 1)) / cols;
    const cellH = (gridH - gap * (rows - 1)) / rows;

    // Column headers along top of grid
    for (let c = 0; c < cols; c++) {
      const cx = gridX + c * (cellW + gap) + cellW / 2;
      canvas.drawText(cx, topBand + 4, this.xCategories[c], this.appearance.axisColor, 10, font, TextAlignment.Center);
    }

    // Row labels + cells
    for (let r = 0; r < rows; r++) {
      const cy = gridY + r * (cellH + gap);
      canvas.drawText(gridX - 8, cy + cellH / 2 - 5, this.yCategories[r], this.appearance.axisColor, 10, font, TextAlignment.Right);

      const row = this.values[r];
      for (let c = 0; c < cols; c++) {
        const cx = gridX + c * (cellW + gap);
        const raw = row && c < row.length ? row[c] : null;
        const hasVal = raw !== null && raw !== undefined && Number.isFinite(raw);
        const fill = hasVal ? this.sampleScale((raw - minV) / span) : this._emptyCellColor;

        if (this.cellCornerRadius > 0) {
          fillChartPath(canvas, { commands: cellRectCommands(cx, cy, cellW, cellH, this.cellCornerRadius), color: fill });
        } else {
          canvas.fillRect(cx, cy, cellW, cellH, fill);
        }

        if (hasVal && this.showCellValues) {
          const text = `${this.valuePrefix}${formatChartNumber(raw, this.valueFormat)}${this.valueSuffix}`;
          const fontSize = Math.min(10, Math.max(7, Math.floor(cellH * 0.45)));
          const measured = canvas.measureText(text, fontSize, font);
          if (measured.width + 4 <= cellW && fontSize + 2 <= cellH) {
            canvas.drawText(cx + cellW / 2, cy + cellH / 2 - fontSize / 2, text, contrastTextColor(fill), fontSize, font, TextAlignment.Center);
          }
        }
      }
    }

    if (this.showColorLegend) {
      const barW = Math.min(200, gridW * 0.5);
      const barH = 10;
      const barX = gridX + (gridW - barW) / 2;
      const barY = gridY + gridH + 10;
      const stops: ChartGradientStop[] = this._colorScale.map((col, idx) => ({
        offset: idx / (this._colorScale.length - 1),
        color: col,
      }));
      fillChartPath(canvas, {
        commands: cellRectCommands(barX, barY, barW, barH, 3),
        color: this._colorScale[0],
        gradient: {
          startX: barX,
          startY: barY,
          endX: barX + barW,
          endY: barY,
          startColor: this._colorScale[0],
          endColor: this._colorScale[this._colorScale.length - 1],
          stops,
        },
      });
      const minText = `${this.valuePrefix}${formatChartNumber(minV, this.valueFormat)}${this.valueSuffix}`;
      const maxText = `${this.valuePrefix}${formatChartNumber(maxV, this.valueFormat)}${this.valueSuffix}`;
      canvas.drawText(barX - 6, barY, minText, this.appearance.axisColor, 9, font, TextAlignment.Right);
      canvas.drawText(barX + barW + 6, barY, maxText, this.appearance.axisColor, 9, font, TextAlignment.Left);
    }
  }
}
