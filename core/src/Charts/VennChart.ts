// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, StandardFonts, TextAlignment, toColor, type ICanvas, type Color, type ColorInput } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { formatChartNumber } from './ChartNumberFormat';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { circleCommands } from './Graphics/ChartArc';

/** One set of a {@link VennChart}. */
export interface VennSet {
  id: string;
  label: string;
  size: number;
  color?: ColorInput;
}

/** An overlap between 2 or 3 sets of a {@link VennChart}. */
export interface VennIntersection {
  sets: readonly string[];
  size: number;
  label?: string;
}

export const VENN_CHART_OWN_OPTION_KEYS = ['sets', 'intersections', 'fillOpacity', 'strokeWidth', 'showValues', 'valueFormat'] as const;

export const VENN_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...VENN_CHART_OWN_OPTION_KEYS] as const;

export type VennChartOptions = ChartBaseOptions & Partial<Pick<VennChart, (typeof VENN_CHART_OWN_OPTION_KEYS)[number]>>;

/** Analytical overlap area of two circles of radii r1, r2 whose centres are distance d apart. */
function circleOverlapArea(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
  const a1 = Math.acos(Math.max(-1, Math.min(1, (d * d + r1 * r1 - r2 * r2) / (2 * d * r1))));
  const a2 = Math.acos(Math.max(-1, Math.min(1, (d * d + r2 * r2 - r1 * r1) / (2 * d * r2))));
  const s = Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  return r1 * r1 * a1 + r2 * r2 * a2 - 0.5 * Math.sqrt(s);
}

/** Deterministic 40-step bisection solver for centre distance yielding `targetArea`. */
function solveDistance(r1: number, r2: number, targetArea: number): number {
  const maxOverlap = Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
  if (targetArea <= 0) return r1 + r2 + Math.min(r1, r2) * 0.15;
  if (targetArea >= maxOverlap) return Math.abs(r1 - r2);
  let lo = Math.abs(r1 - r2);
  let hi = r1 + r2;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (circleOverlapArea(r1, r2, mid) > targetArea) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Area-proportional 2- and 3-set Venn diagram with intersection labels. */
export class VennChart extends ChartBase {
  sets: readonly VennSet[] = [];
  intersections: readonly VennIntersection[] = [];
  fillOpacity: number = 0.45;
  strokeWidth: number = 2;
  showValues: boolean = true;
  valueFormat: string = 'G';

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: VennChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const n = this.sets.length;
    if (n === 0) return;
    if (n < 2 || n > 3) throw new RangeError('VennChart supports 2 or 3 sets.');
    if (!(this.fillOpacity > 0 && this.fillOpacity <= 1)) throw new RangeError('Venn fillOpacity must be above 0 and at most 1.');
    const colors: Color[] = this.sets.map((s, i) => {
      if (!(s.size > 0) || !Number.isFinite(s.size)) throw new RangeError(`Venn set '${s.id}' size must be positive.`);
      return s.color !== undefined ? toColor(s.color) : categoryColor(this.appearance, undefined, i);
    });

    const pairOverlap = (idA: string, idB: string): number => {
      let sum = 0;
      for (const inter of this.intersections) {
        if (inter.sets.length === 2 && inter.sets.includes(idA) && inter.sets.includes(idB)) sum = inter.size;
      }
      return Math.max(0, sum);
    };
    const tripleOverlap = (): VennIntersection | undefined => this.intersections.find((inter) => inter.sets.length === 3);

    const radii = this.sets.map((s) => Math.sqrt(s.size / Math.PI));
    const xs = new Array<number>(n).fill(0);
    const ys = new Array<number>(n).fill(0);

    const d01 = solveDistance(radii[0], radii[1], pairOverlap(this.sets[0].id, this.sets[1].id));
    xs[0] = 0;
    ys[0] = 0;
    xs[1] = d01;
    ys[1] = 0;

    if (n === 3) {
      let d02 = solveDistance(radii[0], radii[2], pairOverlap(this.sets[0].id, this.sets[2].id));
      let d12 = solveDistance(radii[1], radii[2], pairOverlap(this.sets[1].id, this.sets[2].id));
      // Enforce triangle inequality safely so geometry is always finite.
      const minSum = d01 + 1e-3;
      if (d02 + d12 < minSum) {
        const boost = (minSum - (d02 + d12)) / 2;
        d02 += boost;
        d12 += boost;
      }
      const x2 = d01 > 1e-6 ? (d02 * d02 - d12 * d12 + d01 * d01) / (2 * d01) : 0;
      const y2Sq = Math.max(0, d02 * d02 - x2 * x2);
      xs[2] = x2;
      ys[2] = Math.sqrt(y2Sq);
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      minX = Math.min(minX, xs[i] - radii[i]);
      maxX = Math.max(maxX, xs[i] + radii[i]);
      minY = Math.min(minY, ys[i] - radii[i]);
      maxY = Math.max(maxY, ys[i] + radii[i]);
    }
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const topEdge = (data.title !== '' ? 56 : 16) + (data.subtitle !== '' ? 18 : 0);
    const bottomEdge = this.height - 16 - (this.caption !== '' ? 16 : 0);
    const availW = Math.max(60, this.width - 48);
    const availH = Math.max(60, bottomEdge - topEdge - 12);
    const spanW = Math.max(1e-6, maxX - minX);
    const spanH = Math.max(1e-6, maxY - minY);
    const scale = Math.min(availW / spanW, availH / spanH);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const cx0 = this.width / 2;
    const cy0 = topEdge + (bottomEdge - topEdge) / 2;

    const sx = xs.map((x) => cx0 + (x - midX) * scale);
    const sy = ys.map((y) => cy0 + (y - midY) * scale);
    const sr = radii.map((r) => r * scale);

    for (let i = 0; i < n; i++) {
      const cmds = circleCommands(sx[i], sy[i], sr[i]);
      fillChartPath(canvas, { commands: cmds, color: colors[i].withAlpha(this.fillOpacity) });
      if (this.strokeWidth > 0) {
        strokeChartPath(canvas, { commands: cmds, color: colors[i], lineWidth: this.strokeWidth });
      }
    }

    // Set labels pushed gently away from centroid of all circles
    const avgX = sx.reduce((a, b) => a + b, 0) / n;
    const avgY = sy.reduce((a, b) => a + b, 0) / n;
    for (let i = 0; i < n; i++) {
      const dx = sx[i] - avgX;
      const dy = sy[i] - avgY;
      const len = Math.hypot(dx, dy);
      const push = sr[i] * 0.36;
      const lx = len > 1e-4 ? sx[i] + (dx / len) * push : sx[i];
      const ly = len > 1e-4 ? sy[i] + (dy / len) * push : sy[i];
      canvas.drawText(lx, this.showValues ? ly - 10 : ly - 5, this.sets[i].label, this.appearance.legendTextColor, 11, boldFont, TextAlignment.Center);
      if (this.showValues) {
        canvas.drawText(lx, ly + 3, formatChartNumber(this.sets[i].size, this.valueFormat), this.appearance.axisColor, 10, font, TextAlignment.Center);
      }
    }

    if (this.showValues) {
      for (const inter of this.intersections) {
        if (inter.sets.length === 2) {
          const i0 = this.sets.findIndex((s) => s.id === inter.sets[0]);
          const i1 = this.sets.findIndex((s) => s.id === inter.sets[1]);
          if (i0 < 0 || i1 < 0 || inter.size <= 0) continue;
          const mx = (sx[i0] + sx[i1]) / 2;
          const my = (sy[i0] + sy[i1]) / 2;
          const text = inter.label ?? formatChartNumber(inter.size, this.valueFormat);
          canvas.drawText(mx, my - 5, text, this.appearance.legendTextColor, 10, boldFont, TextAlignment.Center);
        }
      }
      const tri = tripleOverlap();
      if (tri && n === 3 && tri.size > 0) {
        const text = tri.label ?? formatChartNumber(tri.size, this.valueFormat);
        canvas.drawText(avgX, avgY - 5, text, this.appearance.legendTextColor, 10, boldFont, TextAlignment.Center);
      }
    }
  }
}
