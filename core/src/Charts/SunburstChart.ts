// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, Point, StandardFonts, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { buildHierarchy, hierarchyHeight, type ChartNode, type TreeNode } from './Graphics/ChartHierarchy';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

/** Settable properties declared by {@link SunburstChart} itself. */
export const SUNBURST_CHART_OWN_OPTION_KEYS = ['nodes', 'maxDepth', 'holeRatio', 'showTotal', 'valueFormat'] as const;

/** The full option surface, base included. */
export const SUNBURST_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...SUNBURST_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link SunburstChart}. */
export type SunburstChartOptions = ChartBaseOptions & Partial<Pick<SunburstChart, (typeof SUNBURST_CHART_OWN_OPTION_KEYS)[number]>>;

/** Cubic segments of an arc of radius `r` from angle `a0` to `a1` (radians, clockwise on screen), each at most a quarter turn. */
function arcSegments(cx: number, cy: number, r: number, a0: number, a1: number): ChartPathCommand[] {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 2) - 1e-9));
  const out: ChartPathCommand[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n;
    const t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    const k = (4 / 3) * Math.tan((t1 - t0) / 4);
    out.push({
      op: 'C',
      values: [cx + r * Math.cos(t0) - k * r * Math.sin(t0), cy + r * Math.sin(t0) + k * r * Math.cos(t0), cx + r * Math.cos(t1) + k * r * Math.sin(t1), cy + r * Math.sin(t1) - k * r * Math.cos(t1), cx + r * Math.cos(t1), cy + r * Math.sin(t1)],
    });
  }
  return out;
}

/** A sunburst: a hierarchy as concentric rings, each node an arc whose angle is proportional to its value. */
export class SunburstChart extends ChartBase {
  /** The hierarchy, as a flat list. See {@link ChartNode}. */
  nodes: readonly ChartNode[] = [];
  /** How many rings are drawn: `0` (default) all of them. */
  maxDepth: number = 0;
  /** The hole in the middle as a fraction of the radius (`0.25`). */
  holeRatio: number = 0.25;
  /** Write the total in the hole. */
  showTotal: boolean = true;
  /** Number format of the total. */
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: SunburstChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (this.nodes.length === 0) return;
    if (!Number.isInteger(this.maxDepth) || this.maxDepth < 0) throw new RangeError('Sunburst maxDepth must be a nonnegative integer.');
    if (!(this.holeRatio >= 0 && this.holeRatio <= 0.9)) throw new RangeError('Sunburst holeRatio must be from 0 to 0.9.');
    const top = buildHierarchy(this.nodes, this.appearance);
    const total = top.reduce((s, n) => s + n.total, 0);
    if (!(total > 0)) return;
    const levels = this.maxDepth === 0 ? hierarchyHeight(top) : Math.min(this.maxDepth, hierarchyHeight(top));
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const topEdge = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const bottom = this.height - 12 - (this.caption !== '' ? 16 : 0);
    const cx = this.width / 2;
    const cy = (topEdge + bottom) / 2;
    const radius = Math.max(20, Math.min(this.width / 2 - 12, (bottom - topEdge) / 2 - 4));
    const hole = this.holeRatio * radius;
    const thickness = (radius - hole) / levels;
    const background = this.effectiveBackgroundColor ?? Color.white;

    const drawArc = (node: TreeNode, a0: number, a1: number): void => {
      const inner = hole + node.depth * thickness;
      const outer = inner + thickness;
      const commands: ChartPathCommand[] = [{ op: 'M', values: [cx + outer * Math.cos(a0), cy + outer * Math.sin(a0)] }, ...arcSegments(cx, cy, outer, a0, a1)];
      commands.push({ op: 'L', values: [cx + inner * Math.cos(a1), cy + inner * Math.sin(a1)] }, ...arcSegments(cx, cy, inner, a1, a0), { op: 'Z', values: [] });
      fillChartPath(canvas, { commands, color: node.color });
      strokeChartPath(canvas, { commands, color: background, lineWidth: 1, lineJoin: 'round', miterLimit: 10 });
      // Label along the ring when it fits, across it when that fits, otherwise none.
      const label = node.node.label;
      const size = 10;
      const w = canvas.measureText(label, size, font).width;
      const h = size * 1.2;
      const mid = (a0 + a1) / 2;
      const rm = (inner + outer) / 2;
      const arcLength = rm * (a1 - a0);
      let phi: number | undefined;
      if (arcLength >= w + 6 && thickness >= h + 2) {
        phi = (mid * 180) / Math.PI + 90;
        const n = ((phi % 360) + 360) % 360;
        phi = n > 90 && n < 270 ? n + 180 : n;
      } else if (thickness >= w + 6 && arcLength >= h + 2) {
        phi = (mid * 180) / Math.PI;
        const n = ((phi % 360) + 360) % 360;
        phi = n > 90 && n < 270 ? n + 180 : n;
      }
      if (phi === undefined) return;
      phi = phi % 360;
      const t = (phi * Math.PI) / 180;
      const m = new Point(cx + rm * Math.cos(mid), cy + rm * Math.sin(mid));
      const px = m.x - ((w / 2) * Math.cos(t) - (h / 2) * Math.sin(t));
      const py = m.y - ((w / 2) * Math.sin(t) + (h / 2) * Math.cos(t));
      canvas.drawTextRotated(px, py, label, contrastTextColor(node.color), size, font, phi);
    };

    const lay = (list: readonly TreeNode[], start: number, span: number, parentTotal: number): void => {
      let a = start;
      for (const node of list) {
        if (!(node.total > 0)) continue;
        const next = a + (span * node.total) / parentTotal;
        if (this.maxDepth === 0 || node.depth < this.maxDepth) {
          drawArc(node, a, next);
          lay(node.children, a, next - a, node.total);
        }
        a = next;
      }
    };
    lay(top, -Math.PI / 2, 2 * Math.PI, total);

    if (this.showTotal && hole > 0) {
      canvas.drawText(cx, cy - 11, formatChartNumber(total, this.valueFormat), this.appearance.legendTextColor, 14, boldFont, TextAlignment.Center);
      canvas.drawText(cx, cy + 7, 'Total', this.appearance.axisColor, 9, font, TextAlignment.Center);
    }
  }
}
