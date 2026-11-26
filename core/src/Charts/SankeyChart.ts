// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { Color, toColor, type ColorInput } from './ChartHost';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { applyChartTemplate } from './Graphics/ChartTemplate';
import { fillChartPath } from './Graphics/ChartVector';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

/** A node of a {@link SankeyChart}. */
export interface SankeyNode {
  /** Unique id. */
  id: string;
  /** The text beside the node. */
  label: string;
  /** The node's colour; the theme palette in input order otherwise. */
  color?: ColorInput;
}

/** A flow between two nodes of a {@link SankeyChart}. */
export interface SankeyLink {
  /** The id of the node the flow leaves. */
  source: string;
  /** The id of the node the flow enters. */
  target: string;
  /** The size of the flow, above zero. */
  value: number;
}

/** Settable properties declared by {@link SankeyChart} itself. */
export const SANKEY_CHART_OWN_OPTION_KEYS = ['nodes', 'links', 'nodeAlign', 'nodePadding', 'nodeWidth', 'linkOpacity', 'labelTemplate', 'valueFormat'] as const;

/** The full option surface, base included. */
export const SANKEY_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...SANKEY_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link SankeyChart}. */
export type SankeyChartOptions = ChartBaseOptions & Partial<Pick<SankeyChart, (typeof SANKEY_CHART_OWN_OPTION_KEYS)[number]>>;

/** The number of relaxation iterations; fixed so both implementations agree. */
const RELAXATIONS = 32;

interface Laid {
  node: SankeyNode;
  index: number;
  column: number;
  /** Larger of inflow and outflow. */
  value: number;
  y: number;
  height: number;
  color: Color;
  incoming: SankeyLink[];
  outgoing: SankeyLink[];
}

/** A Sankey diagram: nodes in columns joined by ribbons whose thickness is the size of the flow. */
export class SankeyChart extends ChartBase {
  /** The nodes. Nodes without links are not drawn. */
  nodes: readonly SankeyNode[] = [];
  /** The flows. Cycles throw. */
  links: readonly SankeyLink[] = [];
  /** `left` (default) puts a node in the column after its deepest source; `justify` moves nodes that nothing leaves to the last column. */
  nodeAlign: 'left' | 'justify' = 'left';
  /** Space in points between nodes of a column. */
  nodePadding: number = 10;
  /** Width of the node bars in points. */
  nodeWidth: number = 14;
  /** Opacity of the ribbons, above 0 and up to 1. */
  linkOpacity: number = 0.4;
  /** The text beside each node; `{label}` and `{value}` are replaced. */
  labelTemplate: string = '{label} {value}';
  /** Number format of `{value}`. */
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: SankeyChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (this.links.length === 0) {
      this.validate();
      return;
    }
    const laid = this.validate();
    const used = laid.filter((n) => n.incoming.length + n.outgoing.length > 0);
    const columns = Math.max(...used.map((n) => n.column)) + 1;
    const font = this.resolveFontFamily();
    const template = this.labelTemplate.split('{value}').join(`{value:${this.valueFormat}}`);
    const labelOf = (n: Laid): string => applyChartTemplate(template, { label: n.node.label, value: n.value });

    const topEdge = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const bottom = this.height - 12 - (this.caption !== '' ? 16 : 0);
    const widest = (column: number): number => Math.max(0, ...used.filter((n) => n.column === column).map((n) => canvas.measureText(labelOf(n), 10, font).width));
    const cap = this.width * 0.3;
    const left = 12 + (columns > 1 ? Math.min(cap, widest(0)) + 6 : 0);
    const right = 12 + Math.min(cap, widest(columns - 1)) + 6;
    const x0 = left;
    const x1 = Math.max(x0 + this.nodeWidth, this.width - right);
    const span = columns > 1 ? (x1 - x0 - this.nodeWidth) / (columns - 1) : 0;
    const columnX = (c: number): number => x0 + c * span;

    // Heights: the tightest column sets the scale.
    const byColumn: Laid[][] = Array.from({ length: columns }, () => []);
    for (const n of used) byColumn[n.column].push(n);
    const plotHeight = bottom - topEdge;
    let scale = Infinity;
    for (const column of byColumn) {
      const sum = column.reduce((s, n) => s + n.value, 0);
      if (sum > 0) scale = Math.min(scale, (plotHeight - Math.max(0, column.length - 1) * this.nodePadding) / sum);
    }
    if (!(scale > 0)) throw new RangeError('The Sankey diagram does not fit: reduce nodePadding or the number of nodes.');
    for (const column of byColumn) {
      let y = topEdge;
      for (const n of column) {
        n.height = n.value * scale;
        n.y = y;
        y += n.height + this.nodePadding;
      }
    }

    // Relaxation: alternating passes, each followed by collision resolution.
    const centre = (n: Laid): number => n.y + n.height / 2;
    const resolve = (column: Laid[]): void => {
      const sorted = [...column].sort((a, b) => a.y - b.y);
      let y = topEdge;
      for (const n of sorted) {
        if (n.y < y) n.y = y;
        y = n.y + n.height + this.nodePadding;
      }
      const last = sorted[sorted.length - 1];
      if (last !== undefined && last.y + last.height > bottom) {
        last.y = bottom - last.height;
        for (let i = sorted.length - 2; i >= 0; i--) {
          const next = sorted[i + 1];
          if (sorted[i].y + sorted[i].height + this.nodePadding > next.y) sorted[i].y = next.y - this.nodePadding - sorted[i].height;
        }
      }
    };
    const laidById = new Map(used.map((n) => [n.node.id, n]));
    const pull = (n: Laid, links: SankeyLink[], other: (l: SankeyLink) => string, alpha: number): void => {
      if (links.length === 0) return;
      let weight = 0;
      let sum = 0;
      for (const l of links) {
        weight += l.value;
        sum += l.value * centre(laidById.get(other(l))!);
      }
      n.y += (sum / weight - centre(n)) * alpha;
    };
    for (let i = 0; i < RELAXATIONS; i++) {
      const alpha = Math.pow(0.99, i);
      for (let c = 1; c < columns; c++) {
        for (const n of byColumn[c]) pull(n, n.incoming, (l) => l.source, alpha);
        resolve(byColumn[c]);
      }
      for (let c = columns - 2; c >= 0; c--) {
        for (const n of byColumn[c]) pull(n, n.outgoing, (l) => l.target, alpha);
        resolve(byColumn[c]);
      }
    }

    // Ribbons: each node's flows stack along its edge in the order of the node at the other end.
    const outOffset = new Map<SankeyLink, number>();
    const inOffset = new Map<SankeyLink, number>();
    for (const n of used) {
      let o = 0;
      for (const l of [...n.outgoing].sort((a, b) => centre(laidById.get(a.target)!) - centre(laidById.get(b.target)!))) {
        outOffset.set(l, o);
        o += l.value * scale;
      }
      let k = 0;
      for (const l of [...n.incoming].sort((a, b) => centre(laidById.get(a.source)!) - centre(laidById.get(b.source)!))) {
        inOffset.set(l, k);
        k += l.value * scale;
      }
    }
    for (const l of this.links) {
      const s = laidById.get(l.source)!;
      const t = laidById.get(l.target)!;
      const thickness = l.value * scale;
      const sx = columnX(s.column) + this.nodeWidth;
      const tx = columnX(t.column);
      const sy = s.y + outOffset.get(l)!;
      const ty = t.y + inOffset.get(l)!;
      const mx = (sx + tx) / 2;
      const commands: ChartPathCommand[] = [
        { op: 'M', values: [sx, sy] },
        { op: 'C', values: [mx, sy, mx, ty, tx, ty] },
        { op: 'L', values: [tx, ty + thickness] },
        { op: 'C', values: [mx, ty + thickness, mx, sy + thickness, sx, sy + thickness] },
        { op: 'Z', values: [] },
      ];
      fillChartPath(canvas, { commands, color: s.color.withAlpha(this.linkOpacity) });
    }

    for (const n of used) {
      const x = columnX(n.column);
      canvas.fillRect(x, n.y, this.nodeWidth, n.height, n.color);
      if (n.height < 1) continue;
      const first = n.column === 0 && columns > 1;
      const labelX = first ? x - 6 : x + this.nodeWidth + 6;
      canvas.drawText(labelX, n.y + n.height / 2 - 5, labelOf(n), this.appearance.legendTextColor, 10, font, first ? TextAlignment.Right : TextAlignment.Left);
    }
  }

  /** Checks the nodes and links and returns the laid-out nodes with their columns, values and colours. */
  private validate(): Laid[] {
    if (!(this.nodePadding >= 0)) throw new RangeError('Sankey nodePadding must be nonnegative.');
    if (!(this.nodeWidth > 0)) throw new RangeError('Sankey nodeWidth must be positive.');
    if (!(this.linkOpacity > 0 && this.linkOpacity <= 1)) throw new RangeError('Sankey linkOpacity must be above 0 and at most 1.');
    if (this.nodeAlign !== 'left' && this.nodeAlign !== 'justify') throw new RangeError(`Unknown Sankey nodeAlign '${String(this.nodeAlign)}'.`);
    const byId = new Map<string, Laid>();
    this.nodes.forEach((node, index) => {
      if (byId.has(node.id)) throw new RangeError(`Duplicate node id '${node.id}'.`);
      const color = node.color !== undefined ? toColor(node.color) : categoryColor(this.appearance, undefined, index);
      byId.set(node.id, { node, index, column: 0, value: 0, y: 0, height: 0, color, incoming: [], outgoing: [] });
    });
    for (const l of this.links) {
      const s = byId.get(l.source);
      const t = byId.get(l.target);
      if (s === undefined) throw new RangeError(`A link names an unknown source '${l.source}'.`);
      if (t === undefined) throw new RangeError(`A link names an unknown target '${l.target}'.`);
      if (!(l.value > 0) || !Number.isFinite(l.value)) throw new RangeError('A link value must be above zero.');
      s.outgoing.push(l);
      t.incoming.push(l);
    }
    // Longest path from any source, by repeated relaxation in topological order; leftover nodes mean a cycle.
    const remaining = new Map<string, number>([...byId.values()].map((n) => [n.node.id, n.incoming.length]));
    const queue = [...byId.values()].filter((n) => n.incoming.length === 0);
    let visited = 0;
    while (queue.length > 0) {
      const n = queue.shift()!;
      visited++;
      for (const l of n.outgoing) {
        const t = byId.get(l.target)!;
        t.column = Math.max(t.column, n.column + 1);
        const left = remaining.get(t.node.id)! - 1;
        remaining.set(t.node.id, left);
        if (left === 0) queue.push(t);
      }
    }
    if (visited < byId.size) throw new RangeError('Sankey links contain a cycle.');
    const laid = [...byId.values()];
    for (const n of laid) n.value = Math.max(n.incoming.reduce((s, l) => s + l.value, 0), n.outgoing.reduce((s, l) => s + l.value, 0));
    if (this.nodeAlign === 'justify') {
      const last = Math.max(0, ...laid.filter((n) => n.incoming.length + n.outgoing.length > 0).map((n) => n.column));
      for (const n of laid) if (n.outgoing.length === 0 && n.incoming.length > 0) n.column = last;
    }
    return laid;
  }
}
