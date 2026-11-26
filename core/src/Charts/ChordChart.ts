// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, TextAlignment, toColor, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import type { SankeyLink, SankeyNode } from './SankeyChart';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { fillChartPath } from './Graphics/ChartVector';
import { arcSegments, ringSectorCommands } from './Graphics/ChartArc';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

export const CHORD_CHART_OWN_OPTION_KEYS = ['nodes', 'links', 'padAngle', 'arcThickness', 'ribbonOpacity', 'showLabels'] as const;

export const CHORD_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...CHORD_CHART_OWN_OPTION_KEYS] as const;

export type ChordChartOptions = ChartBaseOptions & Partial<Pick<ChordChart, (typeof CHORD_CHART_OWN_OPTION_KEYS)[number]>>;

/** Elevates a quadratic curve (p0 -> ctrl -> p1) to an exact cubic Bezier segment. */
function quadToCubic(x0: number, y0: number, qx: number, qy: number, x1: number, y1: number): ChartPathCommand {
  return {
    op: 'C',
    values: [x0 + (2 / 3) * (qx - x0), y0 + (2 / 3) * (qy - y0), x1 + (2 / 3) * (qx - x1), y1 + (2 / 3) * (qy - y1), x1, y1],
  };
}

/** A circular chord diagram connecting entities around a ring with proportional flow ribbons. */
export class ChordChart extends ChartBase {
  nodes: readonly SankeyNode[] = [];
  links: readonly SankeyLink[] = [];
  /** Angular gap between node arcs in degrees. */
  padAngle: number = 3;
  arcThickness: number = 14;
  ribbonOpacity: number = 0.45;
  showLabels: boolean = true;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: ChordChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (this.nodes.length === 0 || this.links.length === 0) return;
    if (!(this.ribbonOpacity > 0 && this.ribbonOpacity <= 1)) throw new RangeError('Chord ribbonOpacity must be above 0 and at most 1.');
    const indexById = new Map<string, number>();
    const totals = new Array<number>(this.nodes.length).fill(0);
    const colors: Color[] = this.nodes.map((node, i) => {
      if (indexById.has(node.id)) throw new RangeError(`Duplicate node id '${node.id}'.`);
      indexById.set(node.id, i);
      return node.color !== undefined ? toColor(node.color) : categoryColor(this.appearance, undefined, i);
    });
    for (const l of this.links) {
      const si = indexById.get(l.source);
      const ti = indexById.get(l.target);
      if (si === undefined) throw new RangeError(`Chord link names unknown source '${l.source}'.`);
      if (ti === undefined) throw new RangeError(`Chord link names unknown target '${l.target}'.`);
      if (!(l.value > 0) || !Number.isFinite(l.value)) throw new RangeError('Chord link value must be positive.');
      totals[si] += l.value;
      totals[ti] += l.value;
    }
    const active = this.nodes.map((_, i) => i).filter((i) => totals[i] > 0);
    if (active.length === 0) return;

    const font = this.resolveFontFamily();
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const labelPad = this.showLabels ? 56 : 12;
    const outerR = Math.max(30, Math.min(this.width / 2 - labelPad, (bottomEdge - topEdge) / 2 - (this.showLabels ? 24 : 10)));
    const innerR = Math.max(12, outerR - Math.max(4, this.arcThickness));
    const cx = this.width / 2;
    const cy = topEdge + (bottomEdge - topEdge) / 2;

    const padRad = (Math.max(0, this.padAngle) * Math.PI) / 180;
    const totalFlow = active.reduce((s, i) => s + totals[i], 0);
    const availableAngle = Math.max(0.1, 2 * Math.PI - padRad * active.length);
    const startA = new Array<number>(this.nodes.length).fill(0);
    const endA = new Array<number>(this.nodes.length).fill(0);
    const cursor = new Array<number>(this.nodes.length).fill(0);
    let angle = -Math.PI / 2;
    for (const i of active) {
      const span = (totals[i] / totalFlow) * availableAngle;
      startA[i] = angle;
      endA[i] = angle + span;
      cursor[i] = angle;
      angle += span + padRad;
    }

    // Ribbons first, arcs on top
    for (const l of this.links) {
      const si = indexById.get(l.source)!;
      const ti = indexById.get(l.target)!;
      const sSpan = (l.value / totalFlow) * availableAngle;
      const tSpan = (l.value / totalFlow) * availableAngle;
      const sa0 = cursor[si];
      const sa1 = sa0 + sSpan;
      cursor[si] = sa1;
      const ta0 = cursor[ti];
      const ta1 = ta0 + tSpan;
      cursor[ti] = ta1;

      const sx0 = cx + innerR * Math.cos(sa0);
      const sy0 = cy + innerR * Math.sin(sa0);
      const sx1 = cx + innerR * Math.cos(sa1);
      const sy1 = cy + innerR * Math.sin(sa1);
      const tx0 = cx + innerR * Math.cos(ta0);
      const ty0 = cy + innerR * Math.sin(ta0);
      const tx1 = cx + innerR * Math.cos(ta1);
      const ty1 = cy + innerR * Math.sin(ta1);

      const cmds: ChartPathCommand[] = [
        { op: 'M', values: [sx0, sy0] },
        ...arcSegments(cx, cy, innerR, sa0, sa1),
        quadToCubic(sx1, sy1, cx, cy, tx0, ty0),
        ...arcSegments(cx, cy, innerR, ta0, ta1),
        quadToCubic(tx1, ty1, cx, cy, sx0, sy0),
        { op: 'Z', values: [] },
      ];
      fillChartPath(canvas, { commands: cmds, color: colors[si].withAlpha(this.ribbonOpacity) });
    }

    for (const i of active) {
      fillChartPath(canvas, { commands: ringSectorCommands(cx, cy, innerR, outerR, startA[i], endA[i]), color: colors[i] });
      if (this.showLabels) {
        const mid = (startA[i] + endA[i]) / 2;
        const lx = cx + (outerR + 10) * Math.cos(mid);
        const ly = cy + (outerR + 10) * Math.sin(mid) - 5;
        const cos = Math.cos(mid);
        const align = cos > 0.2 ? TextAlignment.Left : cos < -0.2 ? TextAlignment.Right : TextAlignment.Center;
        canvas.drawText(lx, ly, this.nodes[i].label, this.appearance.legendTextColor, 10, font, align);
      }
    }
  }
}
