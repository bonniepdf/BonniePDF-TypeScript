// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, StandardFonts, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { applyChartAffixes, formatChartNumber } from './ChartNumberFormat';
import { dimColor } from './Graphics/ChartTint';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { roundedRectCommands } from './Graphics/ChartArc';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

export const STAT_TILE_CHART_OWN_OPTION_KEYS = [
  'value',
  'valueFormat',
  'valuePrefix',
  'valueSuffix',
  'label',
  'comparisonValue',
  'comparisonLabel',
  'deltaMode',
  'polarity',
  'trend',
  'target',
] as const;

export const STAT_TILE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...STAT_TILE_CHART_OWN_OPTION_KEYS] as const;

export type StatTileChartOptions = ChartBaseOptions & Partial<Pick<StatTileChart, (typeof STAT_TILE_CHART_OWN_OPTION_KEYS)[number]>>;

/** A self-contained KPI tile with hero figure, polarity delta badge, optional trend sparkline, and optional target bar. */
export class StatTileChart extends ChartBase {
  value: number = 0;
  valueFormat: string = 'G';
  valuePrefix: string = '';
  valueSuffix: string = '';
  label: string = '';
  comparisonValue?: number;
  comparisonLabel: string = '';
  deltaMode: 'percent' | 'absolute' = 'percent';
  polarity: 'higherIsBetter' | 'lowerIsBetter' = 'higherIsBetter';
  trend: readonly number[] = [];
  target?: number;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: StatTileChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (!Number.isFinite(this.value)) throw new RangeError('StatTile value must be finite.');
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const primary = this.appearance.seriesPalette[0] ?? Color.fromHex('#2563eb');
    const padX = 20;
    const innerW = Math.max(80, this.width - padX * 2);
    let y = (data.title !== '' ? 50 : 18) + (data.subtitle !== '' ? 16 : 0);

    if (this.label !== '') {
      canvas.drawText(padX, y, this.label, this.appearance.axisColor, 11, font, TextAlignment.Left);
      y += 18;
    }

    const heroText = applyChartAffixes(formatChartNumber(this.value, this.valueFormat), this.valuePrefix, this.valueSuffix);
    let heroSize = 36;
    while (heroSize > 14 && canvas.measureText(heroText, heroSize, boldFont).width > innerW) heroSize -= 2;
    canvas.drawText(padX, y, heroText, this.appearance.legendTextColor, heroSize, boldFont, TextAlignment.Left);
    y += heroSize + 8;

    if (this.comparisonValue !== undefined && Number.isFinite(this.comparisonValue) && this.comparisonValue !== this.value) {
      const diff = this.value - this.comparisonValue;
      const up = diff > 0;
      const good = this.polarity === 'higherIsBetter' ? up : !up;
      const deltaColor = good
        ? (this.appearance.positiveColor ?? Color.fromHex('#16a34a'))
        : (this.appearance.negativeColor ?? Color.fromHex('#dc2626'));
      const triY = y + 2;
      const tri: ChartPathCommand[] = up
        ? [{ op: 'M', values: [padX + 4, triY] }, { op: 'L', values: [padX + 8, triY + 7] }, { op: 'L', values: [padX, triY + 7] }, { op: 'Z', values: [] }]
        : [{ op: 'M', values: [padX, triY] }, { op: 'L', values: [padX + 8, triY] }, { op: 'L', values: [padX + 4, triY + 7] }, { op: 'Z', values: [] }];
      fillChartPath(canvas, { commands: tri, color: deltaColor });

      let deltaStr: string;
      if (this.deltaMode === 'percent' && this.comparisonValue !== 0) {
        const pct = Math.abs(diff / this.comparisonValue);
        deltaStr = `${up ? '+' : '-'}${formatChartNumber(pct, 'P1')}`;
      } else {
        deltaStr = `${up ? '+' : '-'}${applyChartAffixes(formatChartNumber(Math.abs(diff), this.valueFormat), this.valuePrefix, this.valueSuffix)}`;
      }
      canvas.drawText(padX + 12, y, deltaStr, deltaColor, 11, boldFont, TextAlignment.Left);
      if (this.comparisonLabel !== '') {
        const dw = canvas.measureText(deltaStr, 11, boldFont).width;
        canvas.drawText(padX + 18 + dw, y + 0.5, this.comparisonLabel, this.appearance.axisColor, 10, font, TextAlignment.Left);
      }
      y += 22;
    }

    const bottomLimit = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const hasTarget = this.target !== undefined && Number.isFinite(this.target) && this.target > 0;
    const targetReserve = hasTarget ? 26 : 0;

    if (this.trend.length >= 2 && bottomLimit - targetReserve - y >= 20) {
      const sparkH = Math.min(54, bottomLimit - targetReserve - y - 6);
      const minT = Math.min(...this.trend);
      const maxT = Math.max(...this.trend);
      const spanT = maxT > minT ? maxT - minT : 1;
      const pts = this.trend.map((v, i) => ({
        x: padX + (innerW * i) / (this.trend.length - 1),
        y: y + sparkH - ((v - minT) / spanT) * (sparkH - 4) - 2,
      }));
      const areaCmds: ChartPathCommand[] = [{ op: 'M', values: [pts[0].x, y + sparkH] }, { op: 'L', values: [pts[0].x, pts[0].y] }];
      const lineCmds: ChartPathCommand[] = [{ op: 'M', values: [pts[0].x, pts[0].y] }];
      for (let i = 1; i < pts.length; i++) {
        areaCmds.push({ op: 'L', values: [pts[i].x, pts[i].y] });
        lineCmds.push({ op: 'L', values: [pts[i].x, pts[i].y] });
      }
      areaCmds.push({ op: 'L', values: [pts[pts.length - 1].x, y + sparkH] }, { op: 'Z', values: [] });
      fillChartPath(canvas, { commands: areaCmds, color: dimColor(primary, bg, 0.14) });
      strokeChartPath(canvas, { commands: lineCmds, color: primary, lineWidth: 2, lineJoin: 'round', lineCap: 'round' });
      y += sparkH + 10;
    }

    if (hasTarget) {
      const barY = Math.min(bottomLimit - 20, Math.max(y, bottomLimit - 22));
      const frac = Math.max(0, Math.min(1, this.value / this.target!));
      fillChartPath(canvas, { commands: roundedRectCommands(padX, barY, innerW, 6, 3), color: dimColor(primary, bg, 0.16) });
      if (frac > 0.005) {
        fillChartPath(canvas, { commands: roundedRectCommands(padX, barY, innerW * frac, 6, 3), color: primary });
      }
      const pctText = `${formatChartNumber(this.value / this.target!, 'P0')} of target (${applyChartAffixes(formatChartNumber(this.target!, this.valueFormat), this.valuePrefix, this.valueSuffix)})`;
      canvas.drawText(padX, barY + 9, pctText, this.appearance.axisColor, 9, font, TextAlignment.Left);
    }
  }
}
