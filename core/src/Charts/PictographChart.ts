// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { applyChartAffixes, formatChartNumber } from './ChartNumberFormat';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { dimColor } from './Graphics/ChartTint';
import { fillChartPath, popClip, pushClipRect } from './Graphics/ChartVector';
import { circleCommands, roundedRectCommands } from './Graphics/ChartArc';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

export type PictographIconName = 'person' | 'box' | 'star' | 'heart' | 'check' | 'circle' | 'document';

export const PICTOGRAPH_CHART_OWN_OPTION_KEYS = [
  'icon',
  'unitValue',
  'iconSize',
  'iconGap',
  'maxIconsPerRow',
  'showTrack',
  'trackTotal',
  'showValueLabels',
  'valueFormat',
  'valueSuffix',
] as const;

export const PICTOGRAPH_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...PICTOGRAPH_CHART_OWN_OPTION_KEYS] as const;

export type PictographChartOptions = ChartBaseOptions & Partial<Pick<PictographChart, (typeof PICTOGRAPH_CHART_OWN_OPTION_KEYS)[number]>>;

function iconPaths(kind: PictographIconName, x: number, y: number, s: number): ChartPathCommand[][] {
  if (kind === 'circle') return [circleCommands(x + s / 2, y + s / 2, s * 0.44)];
  if (kind === 'box') return [roundedRectCommands(x + s * 0.08, y + s * 0.08, s * 0.84, s * 0.84, s * 0.16)];
  if (kind === 'person') {
    const head = circleCommands(x + s * 0.5, y + s * 0.22, s * 0.16);
    const body: ChartPathCommand[] = [
      { op: 'M', values: [x + s * 0.22, y + s * 0.94] },
      { op: 'L', values: [x + s * 0.22, y + s * 0.56] },
      { op: 'C', values: [x + s * 0.22, y + s * 0.44, x + s * 0.34, y + s * 0.42, x + s * 0.5, y + s * 0.42] },
      { op: 'C', values: [x + s * 0.66, y + s * 0.42, x + s * 0.78, y + s * 0.44, x + s * 0.78, y + s * 0.56] },
      { op: 'L', values: [x + s * 0.78, y + s * 0.94] },
      { op: 'Z', values: [] },
    ];
    return [head, body];
  }
  if (kind === 'star') {
    const cmds: ChartPathCommand[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? s * 0.46 : s * 0.2;
      const px = x + s * 0.5 + r * Math.cos(a);
      const py = y + s * 0.52 + r * Math.sin(a);
      cmds.push({ op: i === 0 ? 'M' : 'L', values: [px, py] });
    }
    cmds.push({ op: 'Z', values: [] });
    return [cmds];
  }
  if (kind === 'heart') {
    return [[
      { op: 'M', values: [x + s * 0.5, y + s * 0.88] },
      { op: 'C', values: [x + s * 0.1, y + s * 0.6, x + s * 0.06, y + s * 0.24, x + s * 0.28, y + s * 0.16] },
      { op: 'C', values: [x + s * 0.42, y + s * 0.12, x + s * 0.5, y + s * 0.26, x + s * 0.5, y + s * 0.32] },
      { op: 'C', values: [x + s * 0.5, y + s * 0.26, x + s * 0.58, y + s * 0.12, x + s * 0.72, y + s * 0.16] },
      { op: 'C', values: [x + s * 0.94, y + s * 0.24, x + s * 0.9, y + s * 0.6, x + s * 0.5, y + s * 0.88] },
      { op: 'Z', values: [] },
    ]];
  }
  if (kind === 'check') {
    return [[
      { op: 'M', values: [x + s * 0.14, y + s * 0.54] },
      { op: 'L', values: [x + s * 0.38, y + s * 0.78] },
      { op: 'L', values: [x + s * 0.86, y + s * 0.24] },
      { op: 'L', values: [x + s * 0.76, y + s * 0.14] },
      { op: 'L', values: [x + s * 0.38, y + s * 0.58] },
      { op: 'L', values: [x + s * 0.24, y + s * 0.44] },
      { op: 'Z', values: [] },
    ]];
  }
  // document
  return [[
    { op: 'M', values: [x + s * 0.18, y + s * 0.08] },
    { op: 'L', values: [x + s * 0.62, y + s * 0.08] },
    { op: 'L', values: [x + s * 0.84, y + s * 0.3] },
    { op: 'L', values: [x + s * 0.84, y + s * 0.92] },
    { op: 'L', values: [x + s * 0.18, y + s * 0.92] },
    { op: 'Z', values: [] },
  ]];
}

/** Category rows of repeated unit vector icons with fractional trailing-icon clipping. */
export class PictographChart extends ChartBase {
  icon: PictographIconName = 'person';
  unitValue: number = 10;
  iconSize: number = 18;
  iconGap: number = 4;
  maxIconsPerRow: number = 10;
  showTrack: boolean = false;
  trackTotal: number = 10;
  showValueLabels: boolean = true;
  valueFormat: string = 'G';
  valueSuffix: string = '';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: PictographChartOptions) {
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
    if (!(this.unitValue > 0) || !Number.isFinite(this.unitValue)) throw new RangeError('Pictograph unitValue must be positive.');
    if (points.some((p) => !(p.value >= 0) || !Number.isFinite(p.value))) throw new RangeError('Pictograph values must be finite and nonnegative.');
    const font = this.resolveFontFamily();
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const labelW = Math.min(this.width * 0.3, Math.max(...points.map((p) => canvas.measureText(p.label, 11, font).width)) + 16);
    const valueLabels = points.map((p) => applyChartAffixes(formatChartNumber(p.value, this.valueFormat), '', this.valueSuffix));
    const valW = this.showValueLabels ? Math.max(...valueLabels.map((t) => canvas.measureText(t, 11, font).width)) + 16 : 12;
    const startX = 16 + labelW;
    const availW = Math.max(40, this.width - startX - valW - 12);
    const maxCols = Math.max(1, Math.min(this.maxIconsPerRow, Math.floor((availW + this.iconGap) / (this.iconSize + this.iconGap))));
    const rowH = (bottomEdge - topEdge) / n;
    const size = Math.min(this.iconSize, Math.max(10, rowH - 8));

    const drawIcon = (x: number, y: number, color: Color, clipFraction?: number): void => {
      const shapes = iconPaths(this.icon, x, y, size);
      if (clipFraction !== undefined && clipFraction < 0.999) {
        pushClipRect(canvas, x, y, size * clipFraction, size);
        for (const commands of shapes) fillChartPath(canvas, { commands, color });
        popClip(canvas);
      } else {
        for (const commands of shapes) fillChartPath(canvas, { commands, color });
      }
    };

    for (let i = 0; i < n; i++) {
      const p = points[i];
      const cy = topEdge + rowH * (i + 0.5);
      const iy = cy - size / 2;
      const color = categoryColor(this.appearance, p, i);
      const trackColor = dimColor(color, bg, 0.16);
      canvas.drawText(startX - 10, cy - 5.5, p.label, this.appearance.legendTextColor, 11, font, TextAlignment.Right);

      const units = Math.min(maxCols, p.value / this.unitValue);
      const full = Math.floor(units);
      const frac = units - full;
      const slotCount = this.showTrack ? Math.min(maxCols, Math.max(this.trackTotal, Math.ceil(units))) : Math.ceil(units);

      for (let k = 0; k < slotCount; k++) {
        const ix = startX + k * (size + this.iconGap);
        if (this.showTrack) drawIcon(ix, iy, trackColor);
        if (k < full) drawIcon(ix, iy, color);
        else if (k === full && frac > 0.02) drawIcon(ix, iy, color, frac);
      }

      if (this.showValueLabels) {
        const endX = startX + slotCount * (size + this.iconGap) + 6;
        canvas.drawText(endX, cy - 5.5, valueLabels[i], this.appearance.axisColor, 11, font, TextAlignment.Left);
      }
    }
  }
}
