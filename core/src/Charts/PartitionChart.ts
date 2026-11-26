// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, StandardFonts, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import { ChartOrientation } from './ChartOrientation';
import type { ChartData } from './Models/ChartData';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { applyChartTemplate } from './Graphics/ChartTemplate';
import { buildHierarchy, hierarchyHeight, type ChartNode, type TreeNode } from './Graphics/ChartHierarchy';

export const PARTITION_CHART_OWN_OPTION_KEYS = ['nodes', 'orientation', 'maxDepth', 'padding', 'labelTemplate', 'valueFormat'] as const;

export const PARTITION_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...PARTITION_CHART_OWN_OPTION_KEYS] as const;

export type PartitionChartOptions = ChartBaseOptions & Partial<Pick<PartitionChart, (typeof PARTITION_CHART_OWN_OPTION_KEYS)[number]>>;

/** An icicle / flame partition hierarchy chart: each depth level occupies a band and children span their parent proportionally. */
export class PartitionChart extends ChartBase {
  nodes: readonly ChartNode[] = [];
  /** `Horizontal` (default) places depth levels left to right; `Vertical` stacks depth levels top to bottom (icicle). */
  orientation: ChartOrientation = ChartOrientation.Horizontal;
  maxDepth: number = 0;
  padding: number = 1.5;
  labelTemplate: string = '{label}  {value}';
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: PartitionChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (this.nodes.length === 0) return;
    if (!Number.isInteger(this.maxDepth) || this.maxDepth < 0) throw new RangeError('Partition maxDepth must be a nonnegative integer.');
    if (!(this.padding >= 0)) throw new RangeError('Partition padding must be nonnegative.');
    const top = buildHierarchy(this.nodes, this.appearance);
    const total = top.reduce((s, n) => s + n.total, 0);
    if (!(total > 0)) return;
    const levels = this.maxDepth === 0 ? hierarchyHeight(top) : Math.min(this.maxDepth, hierarchyHeight(top));
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 14 - (this.caption !== '' ? 16 : 0);
    const x0 = 14;
    const plotW = Math.max(40, this.width - 28);
    const plotH = Math.max(40, bottomEdge - topEdge);
    const template = this.labelTemplate.split('{value}').join(`{value:${this.valueFormat}}`);
    const pad = this.padding;
    const horiz = this.orientation === ChartOrientation.Horizontal;
    const bandSize = horiz ? plotW / levels : plotH / levels;

    const drawNodes = (list: readonly TreeNode[], offset: number, span: number, parentTotal: number): void => {
      let cur = offset;
      for (const node of list) {
        if (!(node.total > 0)) continue;
        const size = (span * node.total) / parentTotal;
        if (this.maxDepth === 0 || node.depth < this.maxDepth) {
          const rx = horiz ? x0 + node.depth * bandSize + pad / 2 : cur + pad / 2;
          const ry = horiz ? cur + pad / 2 : topEdge + node.depth * bandSize + pad / 2;
          const rw = (horiz ? bandSize : size) - pad;
          const rh = (horiz ? size : bandSize) - pad;
          if (rw > 0.5 && rh > 0.5) {
            canvas.fillRect(rx, ry, rw, rh, node.color);
            const label = applyChartTemplate(template, { label: node.node.label, value: node.total });
            const labelFont = node.depth === 0 ? boldFont : font;
            const textColor = contrastTextColor(node.color);
            if (rh >= 14 && canvas.measureText(label, 10, labelFont).width + 8 <= rw) {
              canvas.drawText(rx + 6, ry + rh / 2 - 5, label, textColor, 10, labelFont, TextAlignment.Left);
            } else if (rh >= 14 && canvas.measureText(node.node.label, 9, labelFont).width + 8 <= rw) {
              canvas.drawText(rx + 6, ry + rh / 2 - 4.5, node.node.label, textColor, 9, labelFont, TextAlignment.Left);
            }
          }
          if (node.children.length > 0) drawNodes(node.children, cur, size, node.total);
        }
        cur += size;
      }
    };

    drawNodes(top, horiz ? topEdge : x0, horiz ? plotH : plotW, total);
  }
}
