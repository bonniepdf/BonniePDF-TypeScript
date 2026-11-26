// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, TextAlignment, toColor, type ICanvas, type Color } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import type { SankeyLink, SankeyNode } from './SankeyChart';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { circleCommands } from './Graphics/ChartArc';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

export const ARC_DIAGRAM_CHART_OWN_OPTION_KEYS = ['nodes', 'links', 'nodeRadius', 'linkOpacity', 'maxStrokeWidth', 'showLabels'] as const;

export const ARC_DIAGRAM_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...ARC_DIAGRAM_CHART_OWN_OPTION_KEYS] as const;

export type ArcDiagramChartOptions = ChartBaseOptions & Partial<Pick<ArcDiagramChart, (typeof ARC_DIAGRAM_CHART_OWN_OPTION_KEYS)[number]>>;

/** A linear arc diagram: nodes ordered along a baseline linked by weighted semicircular arcs. */
export class ArcDiagramChart extends ChartBase {
  nodes: readonly SankeyNode[] = [];
  links: readonly SankeyLink[] = [];
  nodeRadius: number = 7;
  linkOpacity: number = 0.55;
  maxStrokeWidth: number = 10;
  showLabels: boolean = true;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: ArcDiagramChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const n = this.nodes.length;
    if (n === 0) return;
    if (!(this.linkOpacity > 0 && this.linkOpacity <= 1)) throw new RangeError('ArcDiagram linkOpacity must be above 0 and at most 1.');
    const indexById = new Map<string, number>();
    const colors: Color[] = this.nodes.map((node, i) => {
      if (indexById.has(node.id)) throw new RangeError(`Duplicate node id '${node.id}'.`);
      indexById.set(node.id, i);
      return node.color !== undefined ? toColor(node.color) : categoryColor(this.appearance, undefined, i);
    });
    for (const l of this.links) {
      if (!indexById.has(l.source)) throw new RangeError(`ArcDiagram link names unknown source '${l.source}'.`);
      if (!indexById.has(l.target)) throw new RangeError(`ArcDiagram link names unknown target '${l.target}'.`);
      if (!(l.value > 0) || !Number.isFinite(l.value)) throw new RangeError('ArcDiagram link value must be positive.');
    }

    const font = this.resolveFontFamily();
    const topEdge = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const labelBand = this.showLabels ? 28 : 10;
    const baselineY = this.height - labelBand - (this.caption !== '' ? 16 : 0) - this.nodeRadius;
    const maxArcH = Math.max(24, baselineY - topEdge - 8);
    const padX = Math.max(36, this.nodeRadius + 24);
    const spanX = Math.max(40, this.width - padX * 2);
    const nodeX = (i: number): number => (n === 1 ? this.width / 2 : padX + (spanX * i) / (n - 1));
    const maxVal = this.links.length > 0 ? Math.max(...this.links.map((l) => l.value)) : 1;

    // Semicircular Bezier constant for two quarter-arcs = 0.5522847498
    const K = 0.5522847498;
    for (const l of this.links) {
      const si = indexById.get(l.source)!;
      const ti = indexById.get(l.target)!;
      if (si === ti) continue;
      const x0 = Math.min(nodeX(si), nodeX(ti));
      const x1 = Math.max(nodeX(si), nodeX(ti));
      const rx = (x1 - x0) / 2;
      const ry = Math.min(rx, maxArcH);
      const midX = (x0 + x1) / 2;
      const topY = baselineY - ry;
      const cmds: ChartPathCommand[] = [
        { op: 'M', values: [x0, baselineY] },
        { op: 'C', values: [x0, baselineY - K * ry, midX - K * rx, topY, midX, topY] },
        { op: 'C', values: [midX + K * rx, topY, x1, baselineY - K * ry, x1, baselineY] },
      ];
      const sw = Math.max(1.25, (l.value / maxVal) * this.maxStrokeWidth);
      strokeChartPath(canvas, { commands: cmds, color: colors[si].withAlpha(this.linkOpacity), lineWidth: sw, lineCap: 'round' });
    }

    for (let i = 0; i < n; i++) {
      const x = nodeX(i);
      fillChartPath(canvas, { commands: circleCommands(x, baselineY, this.nodeRadius), color: colors[i] });
      if (this.showLabels) {
        canvas.drawText(x, baselineY + this.nodeRadius + 6, this.nodes[i].label, this.appearance.legendTextColor, 10, font, TextAlignment.Center);
      }
    }
  }
}
