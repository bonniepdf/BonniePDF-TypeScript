// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, StandardFonts, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { applyChartTemplate } from './Graphics/ChartTemplate';
import { buildHierarchy, squarify, type ChartNode, type Rect, type TreeNode } from './Graphics/ChartHierarchy';

/** Settable properties declared by {@link TreemapChart} itself. */
export const TREEMAP_CHART_OWN_OPTION_KEYS = ['nodes', 'depth', 'padding', 'labelTemplate', 'valueFormat'] as const;

/** The full option surface, base included. */
export const TREEMAP_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...TREEMAP_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link TreemapChart}. */
export type TreemapChartOptions = ChartBaseOptions & Partial<Pick<TreemapChart, (typeof TREEMAP_CHART_OWN_OPTION_KEYS)[number]>>;

const HEADER = 16;

/** A treemap: a hierarchy as nested rectangles whose area is proportional to value, laid out by the squarified algorithm. */
export class TreemapChart extends ChartBase {
  /** The hierarchy, as a flat list. See {@link ChartNode}. */
  nodes: readonly ChartNode[] = [];
  /** How many levels are drawn: `0` (default) all of them, `1` only the first level, and so on. */
  depth: number = 0;
  /** Space in points between siblings and inside a group. */
  padding: number = 2;
  /** The text in each cell; `{label}` and `{value}` are replaced, `\n` starts a new line. Lines that do not fit are dropped from the end. */
  labelTemplate: string = '{label}\n{value}';
  /** Number format of `{value}`. */
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: TreemapChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (this.nodes.length === 0) return;
    if (!Number.isInteger(this.depth) || this.depth < 0) throw new RangeError('Treemap depth must be a nonnegative integer.');
    if (!(this.padding >= 0)) throw new RangeError('Treemap padding must be nonnegative.');
    const top = buildHierarchy(this.nodes, this.appearance);
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const topEdge = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const bottom = this.height - 12 - (this.caption !== '' ? 16 : 0);
    const bounds: Rect = { x: 12, y: topEdge, width: this.width - 24, height: bottom - topEdge };
    const template = this.labelTemplate.split('{value}').join(`{value:${this.valueFormat}}`);
    const half = this.padding / 2;

    const drawLabel = (node: TreeNode, cell: Rect, group: boolean): void => {
      const lines = applyChartTemplate(template, { label: node.node.label, value: node.total }).split('\n');
      const color = contrastTextColor(node.color);
      const maxWidth = cell.width - 8;
      const maxLines = group ? 1 : Math.floor((cell.height - 3) / 12);
      let count = Math.min(lines.length, maxLines);
      while (count > 0 && lines.slice(0, count).some((l, k) => canvas.measureText(l, k === 0 ? 10 : 9, k === 0 ? boldFont : font).width > maxWidth)) count--;
      for (let k = 0; k < count; k++) canvas.drawText(cell.x + 4, cell.y + 3 + k * 12, lines[k], color, k === 0 ? 10 : 9, k === 0 ? boldFont : font, TextAlignment.Left);
    };

    const layout = (list: readonly TreeNode[], rect: Rect, level: number): void => {
      for (const { index, rect: r } of squarify(list, rect)) {
        const node = list[index];
        const cell: Rect = { x: r.x + half, y: r.y + half, width: r.width - this.padding, height: r.height - this.padding };
        if (!(cell.width > 0 && cell.height > 0)) continue;
        canvas.fillRect(cell.x, cell.y, cell.width, cell.height, node.color);
        const group = node.children.length > 0 && (this.depth === 0 || level + 1 < this.depth);
        if (group) {
          drawLabel(node, { x: cell.x, y: cell.y, width: cell.width, height: HEADER }, true);
          layout(node.children, { x: cell.x + this.padding, y: cell.y + HEADER, width: cell.width - 2 * this.padding, height: cell.height - HEADER - this.padding }, level + 1);
        } else drawLabel(node, cell, false);
      }
    };
    layout(top, bounds, 0);
  }
}
