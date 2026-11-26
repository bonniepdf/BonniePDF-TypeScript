// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, StandardFonts, TextAlignment, type ICanvas } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { dimColor } from './Graphics/ChartTint';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { circleCommands } from './Graphics/ChartArc';
import { buildHierarchy, type ChartNode, type TreeNode } from './Graphics/ChartHierarchy';

export const PACKED_CIRCLE_CHART_OWN_OPTION_KEYS = ['nodes', 'padding', 'showLabels', 'valueFormat'] as const;

export const PACKED_CIRCLE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...PACKED_CIRCLE_CHART_OWN_OPTION_KEYS] as const;

export type PackedCircleChartOptions = ChartBaseOptions & Partial<Pick<PackedCircleChart, (typeof PACKED_CIRCLE_CHART_OWN_OPTION_KEYS)[number]>>;

interface PackedItem {
  node: TreeNode;
  x: number;
  y: number;
  r: number;
  children: PackedItem[];
}

function packSiblings(items: PackedItem[], pad: number): { cx: number; cy: number; r: number } {
  const n = items.length;
  if (n === 0) return { cx: 0, cy: 0, r: 0 };
  items.sort((a, b) => b.r - a.r || a.node.order - b.node.order);
  const placed: PackedItem[] = [];
  items[0].x = 0;
  items[0].y = 0;
  placed.push(items[0]);
  if (n >= 2) {
    items[1].x = items[0].r + items[1].r + pad;
    items[1].y = 0;
    placed.push(items[1]);
  }
  const overlaps = (x: number, y: number, r: number): boolean => {
    for (const p of placed) {
      const dx = x - p.x;
      const dy = y - p.y;
      const minD = r + p.r + pad - 1e-4;
      if (dx * dx + dy * dy < minD * minD) return true;
    }
    return false;
  };
  for (let i = 2; i < n; i++) {
    const cur = items[i];
    let bestX = 0;
    let bestY = 0;
    let bestDist = Infinity;
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const ca = placed[a];
        const cb = placed[b];
        const d = Math.hypot(cb.x - ca.x, cb.y - ca.y);
        const r1 = ca.r + cur.r + pad;
        const r2 = cb.r + cur.r + pad;
        if (d < 1e-6 || d > r1 + r2 + 1e-6 || d < Math.abs(r1 - r2) - 1e-6) continue;
        const ex = (cb.x - ca.x) / d;
        const ey = (cb.y - ca.y) / d;
        const xOff = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const hSq = Math.max(0, r1 * r1 - xOff * xOff);
        const h = Math.sqrt(hSq);
        for (const sign of [1, -1]) {
          const px = ca.x + xOff * ex - sign * h * ey;
          const py = ca.y + xOff * ey + sign * h * ex;
          if (overlaps(px, py, cur.r)) continue;
          const dist = px * px + py * py;
          if (dist < bestDist) {
            bestDist = dist;
            bestX = px;
            bestY = py;
          }
        }
      }
    }
    if (!Number.isFinite(bestDist)) {
      const last = placed[placed.length - 1];
      bestX = last.x + last.r + cur.r + pad;
      bestY = 0;
    }
    cur.x = bestX;
    cur.y = bestY;
    placed.push(cur);
  }

  // Enclosing circle centred on bounding box midpoint (exact, deterministic, fast).
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of placed) {
    minX = Math.min(minX, p.x - p.r);
    maxX = Math.max(maxX, p.x + p.r);
    minY = Math.min(minY, p.y - p.r);
    maxY = Math.max(maxY, p.y + p.r);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  let maxR = 0;
  for (const p of placed) {
    p.x -= cx;
    p.y -= cy;
    maxR = Math.max(maxR, Math.hypot(p.x, p.y) + p.r);
  }
  return { cx: 0, cy: 0, r: maxR };
}

function packTree(node: TreeNode, pad: number): PackedItem {
  if (node.children.length === 0) {
    return { node, x: 0, y: 0, r: Math.sqrt(Math.max(1e-6, node.total)), children: [] };
  }
  const kids = node.children.filter((c) => c.total > 0).map((c) => packTree(c, pad));
  const enc = packSiblings(kids, pad);
  return { node, x: 0, y: 0, r: enc.r + pad * 2, children: kids };
}

/** Nested circle-packing hierarchy reusing {@link ChartNode}. */
export class PackedCircleChart extends ChartBase {
  nodes: readonly ChartNode[] = [];
  padding: number = 3;
  showLabels: boolean = true;
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: PackedCircleChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (this.nodes.length === 0) return;
    if (!(this.padding >= 0)) throw new RangeError('PackedCircle padding must be nonnegative.');
    const top = buildHierarchy(this.nodes, this.appearance).filter((n) => n.total > 0);
    if (top.length === 0) return;
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const bg = this.effectiveBackgroundColor ?? Color.white;
    const unitPad = 0.25;
    const packedTop = top.map((n) => packTree(n, unitPad));
    const rootEnc = packSiblings(packedTop, unitPad * 1.5);
    if (!(rootEnc.r > 0)) return;

    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 14 - (this.caption !== '' ? 16 : 0);
    const cx = this.width / 2;
    const cy = topEdge + (bottomEdge - topEdge) / 2;
    const targetR = Math.max(20, Math.min(this.width / 2 - 14, (bottomEdge - topEdge) / 2 - 6));
    const scale = targetR / rootEnc.r;

    const render = (item: PackedItem, ox: number, oy: number): void => {
      const ix = ox + item.x * scale;
      const iy = oy + item.y * scale;
      const ir = Math.max(1, item.r * scale - (item.children.length === 0 ? this.padding * 0.25 : 0));
      const isGroup = item.children.length > 0;
      const cmds = circleCommands(ix, iy, ir);
      if (isGroup) {
        fillChartPath(canvas, { commands: cmds, color: dimColor(item.node.color, bg, 0.14) });
        strokeChartPath(canvas, { commands: cmds, color: dimColor(item.node.color, bg, 0.55), lineWidth: 1.25 });
        for (const child of item.children) render(child, ix, iy);
        if (this.showLabels && ir >= 24) {
          canvas.drawText(ix, iy - ir + 5, item.node.node.label, item.node.color, 9, boldFont, TextAlignment.Center);
        }
      } else {
        fillChartPath(canvas, { commands: cmds, color: item.node.color });
        if (this.showLabels) {
          const textColor = contrastTextColor(item.node.color);
          const name = item.node.node.label;
          if (canvas.measureText(name, 10, boldFont).width + 6 <= ir * 1.85) {
            const val = formatChartNumber(item.node.total, this.valueFormat);
            const showVal = ir >= 22 && canvas.measureText(val, 9, font).width + 6 <= ir * 1.7;
            canvas.drawText(ix, showVal ? iy - 10 : iy - 5, name, textColor, 10, boldFont, TextAlignment.Center);
            if (showVal) canvas.drawText(ix, iy + 2, val, textColor, 9, font, TextAlignment.Center);
          }
        }
      }
    };

    for (const item of packedTop) render(item, cx, cy);
  }
}
