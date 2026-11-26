// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { fillChartPath } from './Graphics/ChartVector';
import { circleCommands, roundedRectCommands } from './Graphics/ChartArc';

export const WAFFLE_CHART_OWN_OPTION_KEYS = ['rows', 'columns', 'cellShape', 'cellGap', 'fillOrder', 'showLegend', 'valueFormat'] as const;

export const WAFFLE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...WAFFLE_CHART_OWN_OPTION_KEYS] as const;

export type WaffleChartOptions = ChartBaseOptions & Partial<Pick<WaffleChart, (typeof WAFFLE_CHART_OWN_OPTION_KEYS)[number]>>;

/** Proportional unit grid (default 10x10) allocated by the deterministic largest-remainder method. */
export class WaffleChart extends ChartBase {
  rows: number = 10;
  columns: number = 10;
  cellShape: 'square' | 'rounded' | 'circle' = 'rounded';
  cellGap: number = 2;
  fillOrder: 'rowsFromTop' | 'columnsFromLeft' = 'rowsFromTop';
  showLegend: boolean = true;
  valueFormat: string = 'P0';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: WaffleChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const points = data.series[0]?.dataPoints ?? [];
    if (points.length === 0) return;
    if (!Number.isInteger(this.rows) || this.rows <= 0 || !Number.isInteger(this.columns) || this.columns <= 0) {
      throw new RangeError('Waffle rows and columns must be positive integers.');
    }
    if (points.some((p) => !(p.value >= 0) || !Number.isFinite(p.value))) throw new RangeError('Waffle values must be finite and nonnegative.');
    const total = points.reduce((s, p) => s + p.value, 0);
    if (!(total > 0)) return;

    const totalCells = this.rows * this.columns;
    const exact = points.map((p) => (p.value / total) * totalCells);
    const counts = exact.map((e) => Math.floor(e));
    let remaining = totalCells - counts.reduce((a, b) => a + b, 0);
    const order = points.map((_, i) => i).sort((a, b) => (exact[b] - counts[b]) - (exact[a] - counts[a]) || a - b);
    for (let k = 0; k < remaining; k++) counts[order[k]]++;

    const cellCategory: number[] = [];
    counts.forEach((count, catIdx) => {
      for (let k = 0; k < count; k++) cellCategory.push(catIdx);
    });

    const font = this.resolveFontFamily();
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const legendW = this.showLegend ? Math.min(this.width * 0.38, 165) : 0;
    const availW = Math.max(40, this.width - 32 - legendW);
    const availH = Math.max(40, bottomEdge - topEdge);
    const gap = Math.max(0, this.cellGap);
    const cellSize = Math.max(4, Math.min((availW - gap * (this.columns - 1)) / this.columns, (availH - gap * (this.rows - 1)) / this.rows));
    const gridW = cellSize * this.columns + gap * (this.columns - 1);
    const gridH = cellSize * this.rows + gap * (this.rows - 1);
    const startX = 16 + (availW - gridW) / 2;
    const startY = topEdge + (availH - gridH) / 2;
    const colors = points.map((p, i) => categoryColor(this.appearance, p, i));

    for (let idx = 0; idx < totalCells; idx++) {
      const r = this.fillOrder === 'rowsFromTop' ? Math.floor(idx / this.columns) : idx % this.rows;
      const c = this.fillOrder === 'rowsFromTop' ? idx % this.columns : Math.floor(idx / this.rows);
      const x = startX + c * (cellSize + gap);
      const y = startY + r * (cellSize + gap);
      const color = colors[cellCategory[idx]];
      if (this.cellShape === 'circle') {
        fillChartPath(canvas, { commands: circleCommands(x + cellSize / 2, y + cellSize / 2, cellSize / 2), color });
      } else if (this.cellShape === 'rounded') {
        fillChartPath(canvas, { commands: roundedRectCommands(x, y, cellSize, cellSize, cellSize * 0.22), color });
      } else {
        canvas.fillRect(x, y, cellSize, cellSize, color);
      }
    }

    if (this.showLegend) {
      const legX = startX + gridW + 20;
      const rowH = 22;
      const legStartY = startY + Math.max(0, (gridH - points.length * rowH) / 2);
      for (let i = 0; i < points.length; i++) {
        const y = legStartY + i * rowH;
        fillChartPath(canvas, { commands: roundedRectCommands(legX, y + 2, 10, 10, 2), color: colors[i] });
        const share = formatChartNumber(points[i].value / total, this.valueFormat);
        canvas.drawText(legX + 16, y + 1, `${points[i].label} ${share}`, this.appearance.legendTextColor, 10, font, TextAlignment.Left);
      }
    }
  }
}
