// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, Point, TextAlignment, toColor, type ICanvas, type ColorInput } from '../ChartHost';
import { blendOverOpaque, contrastTextColor } from './ChartValueScale';
import { ChartFill, type ChartFillInput } from './ChartFill';
import type { ChartPathCommand } from './ChartPathPlan';
import { fillChartPath } from './ChartVector';
import { formatChartNumber } from '../ChartNumberFormat';

/** A place on a chart: a data point, a category and value, or a fraction of the plot or the chart. */
export type ChartAnchor =
  | { series: number | string; point: number | string }
  | { category: number | string; value: number }
  | { x: number; y: number; space: 'plot' | 'chart' };

/** The rounded box behind annotation text. */
export interface ChartAnnotationBox {
  /** Box fill. Defaults to the theme's text colour at 8 % over the background. */
  fill?: ColorInput;
  /** Border colour. No border by default. */
  borderColor?: ColorInput;
  /** Border width in points (`1`). */
  borderWidth?: number;
  /** Corner radius in points (`4`). */
  radius?: number;
  /** Horizontal padding in points (`6`). */
  paddingX?: number;
  /** Vertical padding in points (`3`). */
  paddingY?: number;
}

interface AnnotationCommon {
  /** Accent colour of the annotation's lines or shapes. */
  color?: ColorInput;
  /** Text colour. Defaults to the theme's legend text colour. */
  textColor?: ColorInput;
  /** Text size in points (`10`). */
  fontSize?: number;
}

/** Text at an anchor. */
export interface ChartTextAnnotation extends AnnotationCommon {
  type: 'text';
  at: ChartAnchor;
  text: string;
  align?: 'start' | 'center' | 'end';
  box?: ChartAnnotationBox;
}
/** A boxed label near a target, joined to it by a leader line. */
export interface ChartCalloutAnnotation extends AnnotationCommon {
  type: 'callout';
  target: ChartAnchor;
  text: string;
  placement?: 'auto' | 'above' | 'below' | 'left' | 'right';
  leader?: 'straight' | 'elbow' | 'none';
  box?: ChartAnnotationBox;
}
/** A line or arc between two anchors, with an optional arrowhead. */
export interface ChartArrowAnnotation extends AnnotationCommon {
  type: 'arrow';
  from: ChartAnchor;
  to: ChartAnchor;
  head?: 'triangle' | 'open' | 'none';
  curve?: 'straight' | 'arc';
  width?: number;
}
/** The difference arrow between two points, labelled with their growth. */
export interface ChartGrowthAnnotation extends AnnotationCommon {
  type: 'growth';
  from: { series: number | string; point: number | string };
  to: { series: number | string; point: number | string };
  format?: string;
  template?: string;
}
/** The difference arrow between two points, labelled with their compound annual growth rate. */
export interface ChartCagrAnnotation extends AnnotationCommon {
  type: 'cagr';
  from: { series: number | string; point: number | string };
  to: { series: number | string; point: number | string };
  periods?: number;
  format?: string;
  template?: string;
}
/** A square bracket over a span of categories. */
export interface ChartBracketAnnotation extends AnnotationCommon {
  type: 'bracket';
  fromCategory: number | string;
  toCategory: number | string;
  side?: 'above' | 'below';
  text?: string;
}
/** A shaded span of categories across the plot height, drawn behind the marks. */
export interface ChartRangeAnnotation extends AnnotationCommon {
  type: 'range';
  fromCategory: number | string;
  toCategory: number | string;
  fill: ChartFillInput;
  text?: string;
}
/** Dims every mark the selection does not include. */
export interface ChartHighlightAnnotation extends AnnotationCommon {
  type: 'highlight';
  series?: number | string | readonly (number | string)[];
  categories?: number | string | readonly (number | string)[];
  points?: readonly { series: number | string; point: number | string }[];
  /** The fraction of its colour a dimmed mark keeps (`0.25`). */
  dimTo?: number;
}
/** A ring or shape around a point. */
export interface ChartMarkerAnnotation extends AnnotationCommon {
  type: 'marker';
  target: ChartAnchor;
  shape?: 'ring' | 'circle' | 'square';
  size?: number;
}

/** An annotation drawn over a Cartesian chart. */
export type ChartAnnotation =
  | ChartTextAnnotation
  | ChartCalloutAnnotation
  | ChartArrowAnnotation
  | ChartGrowthAnnotation
  | ChartCagrAnnotation
  | ChartBracketAnnotation
  | ChartRangeAnnotation
  | ChartHighlightAnnotation
  | ChartMarkerAnnotation;

/** An axis-aligned rectangle. */
export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What the painter needs to know about the chart it draws on. Built by the chart for each draw. */
export interface AnnotationContext {
  canvas: ICanvas;
  family: string;
  /** `true` when categories run along x and values along y. */
  vertical: boolean;
  plot: AnnotationRect;
  chartWidth: number;
  chartHeight: number;
  textColor: Color;
  background: Color;
  positive: Color;
  negative: Color;
  categoryCount: number;
  /** The size of one category slot along the category axis. */
  slot: number;
  /** The coordinate of the value origin along the value axis. */
  origin: number;
  seriesIndex(ref: number | string): number;
  categoryIndex(ref: number | string): number;
  pointIndex(series: number, ref: number | string): number;
  value(series: number, point: number): number;
  /** The value end of a mark, in chart coordinates. */
  markPoint(series: number, point: number): Point;
  categoryCentre(category: number): number;
  valueToCoordinate(value: number): number;
  /** How far a value label extends beyond its mark: brackets that rise from a mark clear it. Zero without value labels. */
  labelAllowance: number;
  /** Bounding boxes the callout placement avoids. */
  markBoxes(): AnnotationRect[];
  seriesCount: number;
  categoryPointCount(category: number): number;
}

const DEFAULT_FONT_SIZE = 10;
const CALLOUT_GAP = 22;

function rectCommands(x: number, y: number, w: number, h: number, radius: number): ChartPathCommand[] {
  const r = Math.min(Math.max(0, radius), w / 2, h / 2);
  if (r <= 0) {
    return [
      { op: 'M', values: [x, y] },
      { op: 'L', values: [x + w, y] },
      { op: 'L', values: [x + w, y + h] },
      { op: 'L', values: [x, y + h] },
      { op: 'Z', values: [] },
    ];
  }
  const c = (4 / 3) * (Math.SQRT2 - 1) * r;
  return [
    { op: 'M', values: [x + r, y] },
    { op: 'L', values: [x + w - r, y] },
    { op: 'C', values: [x + w - r + c, y, x + w, y + r - c, x + w, y + r] },
    { op: 'L', values: [x + w, y + h - r] },
    { op: 'C', values: [x + w, y + h - r + c, x + w - r + c, y + h, x + w - r, y + h] },
    { op: 'L', values: [x + r, y + h] },
    { op: 'C', values: [x + r - c, y + h, x, y + h - r + c, x, y + h - r] },
    { op: 'L', values: [x, y + r] },
    { op: 'C', values: [x, y + r - c, x + r - c, y, x + r, y] },
    { op: 'Z', values: [] },
  ];
}

function intersects(a: AnnotationRect, b: AnnotationRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Validates the options that do not depend on the chart's data. Throws on the first problem. */
export function validateAnnotations(annotations: readonly ChartAnnotation[]): void {
  for (const a of annotations) {
    if (a.fontSize !== undefined && !(a.fontSize > 0 && Number.isFinite(a.fontSize))) throw new RangeError('Annotation fontSize must be positive.');
    if (a.type === 'highlight') {
      if (a.series === undefined && a.categories === undefined && a.points === undefined) throw new RangeError('A highlight annotation needs series, categories or points.');
      if (a.dimTo !== undefined && !(a.dimTo >= 0 && a.dimTo <= 1)) throw new RangeError('Highlight dimTo must be from 0 to 1.');
    }
    if (a.type === 'arrow' && a.width !== undefined && !(a.width > 0)) throw new RangeError('Arrow width must be positive.');
    if (a.type === 'marker' && a.size !== undefined && !(a.size > 0)) throw new RangeError('Marker size must be positive.');
  }
}

/** The selection of marks a highlight annotation keeps at full strength. */
export interface HighlightSelection {
  keep: number;
  selects(series: number, point: number): boolean;
  /** Whether it selects the series as a whole (for lines), or `undefined` when it does not choose by series. */
  selectsSeries(series: number): boolean | undefined;
}

/** Resolves the highlight annotations against the chart's data; `undefined` when there are none. */
export function resolveHighlight(
  annotations: readonly ChartAnnotation[],
  seriesIndex: (ref: number | string) => number,
  categoryIndex: (ref: number | string) => number,
  pointIndex: (series: number, ref: number | string) => number
): HighlightSelection | undefined {
  const list = annotations.filter((a): a is ChartHighlightAnnotation => a.type === 'highlight');
  if (list.length === 0) return undefined;
  const asArray = <T>(v: T | readonly T[] | undefined): readonly T[] | undefined => (v === undefined ? undefined : Array.isArray(v) ? (v as readonly T[]) : [v as T]);
  const parsed = list.map((h) => ({
    series: asArray(h.series)?.map(seriesIndex),
    categories: asArray(h.categories)?.map(categoryIndex),
    points: h.points?.map((p) => {
      const s = seriesIndex(p.series);
      return { s, p: pointIndex(s, p.point) };
    }),
    dimTo: h.dimTo ?? 0.25,
  }));
  return {
    keep: Math.min(...parsed.map((h) => h.dimTo)),
    selects: (s, p) =>
      parsed.some(
        (h) =>
          (h.points?.some((q) => q.s === s && q.p === p) ?? false) ||
          ((h.series !== undefined || h.categories !== undefined) && (h.series?.includes(s) ?? true) && (h.categories?.includes(p) ?? true))
      ),
    selectsSeries: (s) => {
      const bySeries = parsed.filter((h) => h.series !== undefined && h.categories === undefined && h.points === undefined);
      return bySeries.length === 0 ? undefined : bySeries.some((h) => h.series!.includes(s));
    },
  };
}

/** Draws the `range` annotations (behind the marks) and, with `front`, everything else. */
export class ChartAnnotationPainter {
  constructor(private readonly ctx: AnnotationContext) {}

  private get out(): number {
    return this.ctx.vertical ? -1 : 1;
  }

  private at(c: number, h: number): Point {
    return this.ctx.vertical ? new Point(c, h) : new Point(h, c);
  }

  private accent(a: AnnotationCommon): Color {
    return a.color !== undefined ? toColor(a.color) : this.ctx.textColor;
  }

  private textColour(a: AnnotationCommon): Color {
    return a.textColor !== undefined ? toColor(a.textColor) : this.ctx.textColor;
  }

  private size(a: AnnotationCommon): number {
    return a.fontSize ?? DEFAULT_FONT_SIZE;
  }

  /** Resolves an anchor to chart coordinates, throwing when it names something the chart lacks. */
  resolve(anchor: ChartAnchor): Point {
    const c = this.ctx;
    if ('series' in anchor) {
      const s = c.seriesIndex(anchor.series);
      return c.markPoint(s, c.pointIndex(s, anchor.point));
    }
    if ('category' in anchor) return this.at(c.categoryCentre(c.categoryIndex(anchor.category)), c.valueToCoordinate(anchor.value));
    if (anchor.space === 'plot') return new Point(c.plot.x + anchor.x * c.plot.width, c.plot.y + anchor.y * c.plot.height);
    return new Point(anchor.x * c.chartWidth, anchor.y * c.chartHeight);
  }

  /** Draws the ranges, which sit behind the series. */
  drawBehind(annotations: readonly ChartAnnotation[]): void {
    const c = this.ctx;
    for (const a of annotations) {
      if (a.type !== 'range') continue;
      const i = c.categoryIndex(a.fromCategory);
      const j = c.categoryIndex(a.toCategory);
      const lo = c.categoryCentre(Math.min(i, j)) - c.slot / 2;
      const hi = c.categoryCentre(Math.max(i, j)) + c.slot / 2;
      const box = c.vertical
        ? { x: lo, y: c.plot.y, width: hi - lo, height: c.plot.height }
        : { x: c.plot.x, y: lo, width: c.plot.width, height: hi - lo };
      const fill = ChartFill.from(a.fill);
      const plot = { x: c.plot.x, y: c.plot.y, width: c.plot.width, height: c.plot.height };
      const boxes = { mark: box, plot, chart: { x: 0, y: 0, width: c.chartWidth, height: c.chartHeight } };
      fillChartPath(c.canvas, { commands: rectCommands(box.x, box.y, box.width, box.height, 0), ...fill.resolve(boxes) });
      if (a.text) this.text(a.text, box.x + 6, box.y + 4, 'start', this.size(a), this.textColour(a));
    }
  }

  /** Draws every annotation except ranges and highlights, in array order. */
  drawFront(annotations: readonly ChartAnnotation[]): void {
    for (const a of annotations) {
      switch (a.type) {
        case 'text': this.drawText(a); break;
        case 'callout': this.drawCallout(a); break;
        case 'arrow': this.drawArrow(a); break;
        case 'growth':
        case 'cagr': this.drawDifference(a); break;
        case 'bracket': this.drawBracket(a); break;
        case 'marker': this.drawMarker(a); break;
        default: break;
      }
    }
  }

  private text(s: string, x: number, y: number, align: 'start' | 'center' | 'end', size: number, color: Color): AnnotationRect {
    const c = this.ctx;
    const w = c.canvas.measureText(s, size, c.family).width;
    const left = align === 'start' ? x : align === 'center' ? x - w / 2 : x - w;
    c.canvas.drawText(x, y, s, color, size, c.family, align === 'start' ? TextAlignment.Left : align === 'center' ? TextAlignment.Center : TextAlignment.Right);
    return { x: left, y, width: w, height: size };
  }

  /** Draws `s` in a box whose top-left is `x`,`y`; returns the box. */
  private box(s: string, x: number, y: number, size: number, textColor: Color, box: ChartAnnotationBox | undefined, fillOverride?: Color): AnnotationRect {
    const c = this.ctx;
    const padX = box?.paddingX ?? 6;
    const padY = box?.paddingY ?? 3;
    const w = c.canvas.measureText(s, size, c.family).width + 2 * padX;
    const h = size + 2 * padY;
    const rect = { x, y, width: w, height: h };
    this.paintBox(rect, box, fillOverride);
    c.canvas.drawText(x + padX, y + padY, s, textColor, size, c.family, TextAlignment.Left);
    return rect;
  }

  private paintBox(r: AnnotationRect, box: ChartAnnotationBox | undefined, fillOverride?: Color): void {
    const c = this.ctx;
    const fill = fillOverride ?? (box?.fill !== undefined ? toColor(box.fill) : blendOverOpaque(c.textColor.withAlpha(0.08), c.background));
    const radius = box?.radius ?? 4;
    fillChartPath(c.canvas, { commands: rectCommands(r.x, r.y, r.width, r.height, radius), color: fill });
    if (box?.borderColor !== undefined) {
      const bw = box.borderWidth ?? 1;
      const border = toColor(box.borderColor);
      const half = bw / 2;
      // A border as four lines keeps the sinks' line contract; corners are square at this size.
      const xs = [r.x + half, r.x + r.width - half];
      const ys = [r.y + half, r.y + r.height - half];
      c.canvas.drawLine(xs[0], ys[0], xs[1], ys[0], border, bw);
      c.canvas.drawLine(xs[1], ys[0], xs[1], ys[1], border, bw);
      c.canvas.drawLine(xs[1], ys[1], xs[0], ys[1], border, bw);
      c.canvas.drawLine(xs[0], ys[1], xs[0], ys[0], border, bw);
    }
  }

  private inside(x: number, y: number, w: number, h: number): { x: number; y: number } {
    const c = this.ctx;
    return { x: Math.max(2, Math.min(x, c.chartWidth - w - 2)), y: Math.max(2, Math.min(y, c.chartHeight - h - 2)) };
  }

  private drawText(a: ChartTextAnnotation): void {
    const p = this.resolve(a.at);
    const size = this.size(a);
    const align = a.align ?? 'center';
    const color = this.textColour(a);
    if (a.box === undefined) {
      const w = this.ctx.canvas.measureText(a.text, size, this.ctx.family).width;
      const left = align === 'start' ? p.x : align === 'center' ? p.x - w / 2 : p.x - w;
      const pos = this.inside(left, p.y - size / 2, w, size);
      this.text(a.text, align === 'start' ? pos.x : align === 'center' ? pos.x + w / 2 : pos.x + w, pos.y, align, size, color);
      return;
    }
    const w = this.ctx.canvas.measureText(a.text, size, this.ctx.family).width + 2 * (a.box.paddingX ?? 6);
    const h = size + 2 * (a.box.paddingY ?? 3);
    const left = align === 'start' ? p.x : align === 'center' ? p.x - w / 2 : p.x - w;
    const pos = this.inside(left, p.y - h / 2, w, h);
    this.box(a.text, pos.x, pos.y, size, color, a.box);
  }

  private drawCallout(a: ChartCalloutAnnotation): void {
    const c = this.ctx;
    const t = this.resolve(a.target);
    const size = this.size(a);
    const padX = a.box?.paddingX ?? 6;
    const padY = a.box?.paddingY ?? 3;
    const w = c.canvas.measureText(a.text, size, c.family).width + 2 * padX;
    const h = size + 2 * padY;
    const leader = a.leader ?? 'straight';
    const elbow = leader === 'elbow';
    const candidate = (placement: 'above' | 'below' | 'left' | 'right'): AnnotationRect => {
      switch (placement) {
        case 'above': return { x: elbow ? t.x + 10 : t.x - w / 2, y: t.y - CALLOUT_GAP - h, width: w, height: h };
        case 'below': return { x: elbow ? t.x + 10 : t.x - w / 2, y: t.y + CALLOUT_GAP, width: w, height: h };
        case 'right': return { x: t.x + CALLOUT_GAP, y: elbow ? t.y + 10 : t.y - h / 2, width: w, height: h };
        default: return { x: t.x - CALLOUT_GAP - w, y: elbow ? t.y + 10 : t.y - h / 2, width: w, height: h };
      }
    };
    const requested = a.placement ?? 'auto';
    let placement: 'above' | 'below' | 'left' | 'right' = 'above';
    if (requested === 'auto') {
      const marks = c.markBoxes();
      const fits = (r: AnnotationRect): boolean => r.x >= 0 && r.y >= 0 && r.x + r.width <= c.chartWidth && r.y + r.height <= c.chartHeight && !marks.some((m) => intersects(r, m));
      placement = (['above', 'right', 'below', 'left'] as const).find((p) => fits(candidate(p))) ?? 'above';
    } else placement = requested;
    const raw = candidate(placement);
    const pos = this.inside(raw.x, raw.y, w, h);
    const accent = this.accent(a);
    if (leader !== 'none') {
      const vertical = placement === 'above' || placement === 'below';
      if (elbow) {
        // From the target along one axis, then into the box edge facing it.
        const corner = vertical ? new Point(t.x, pos.y + h / 2) : new Point(pos.x + w / 2, t.y);
        const end = vertical ? new Point(pos.x, pos.y + h / 2) : new Point(pos.x + w / 2, pos.y);
        c.canvas.drawLine(t.x, t.y, corner.x, corner.y, accent, 1);
        c.canvas.drawLine(corner.x, corner.y, end.x, end.y, accent, 1);
      } else {
        const edge = vertical
          ? new Point(pos.x + w / 2, placement === 'above' ? pos.y + h : pos.y)
          : new Point(placement === 'right' ? pos.x : pos.x + w, pos.y + h / 2);
        c.canvas.drawLine(edge.x, edge.y, t.x, t.y, accent, 1);
      }
      c.canvas.fillCircle(t.x, t.y, 2, accent);
    }
    this.box(a.text, pos.x, pos.y, size, this.textColour(a), a.box);
  }

  private head(tip: Point, dir: Point, length: number, style: 'triangle' | 'open', color: Color, width: number): void {
    const c = this.ctx;
    const len = Math.hypot(dir.x, dir.y) || 1;
    const ux = dir.x / len;
    const uy = dir.y / len;
    const half = length * 0.5;
    const bx = tip.x - ux * length;
    const by = tip.y - uy * length;
    const left = new Point(bx - uy * half, by + ux * half);
    const right = new Point(bx + uy * half, by - ux * half);
    if (style === 'triangle') c.canvas.fillPath([tip, left, right], color);
    else {
      c.canvas.drawLine(tip.x, tip.y, left.x, left.y, color, width);
      c.canvas.drawLine(tip.x, tip.y, right.x, right.y, color, width);
    }
  }

  private polyline(points: Point[], color: Color, width: number): void {
    for (let i = 1; i < points.length; i++) this.ctx.canvas.drawLine(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, color, width);
  }

  private drawArrow(a: ChartArrowAnnotation): void {
    const from = this.resolve(a.from);
    const to = this.resolve(a.to);
    const width = a.width ?? 1.5;
    const color = this.accent(a);
    const head = a.head ?? 'triangle';
    const headLength = 4 * width;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return;
    let points: Point[];
    if ((a.curve ?? 'straight') === 'arc') {
      // A quadratic curve whose control point puts the bulge at 20 % of the length, on the left of the direction.
      const cx = (from.x + to.x) / 2 + (dy / length) * 0.4 * length;
      const cy = (from.y + to.y) / 2 - (dx / length) * 0.4 * length;
      points = [];
      for (let i = 0; i <= 16; i++) {
        const u = i / 16;
        const v = 1 - u;
        points.push(new Point(v * v * from.x + 2 * v * u * cx + u * u * to.x, v * v * from.y + 2 * v * u * cy + u * u * to.y));
      }
    } else points = [from, to];
    const last = points[points.length - 1];
    const before = points[points.length - 2];
    const dir = new Point(last.x - before.x, last.y - before.y);
    if (head === 'triangle') {
      // End the shaft where the head starts so the tip stays sharp.
      const dl = Math.hypot(dir.x, dir.y) || 1;
      points[points.length - 1] = new Point(last.x - (dir.x / dl) * headLength, last.y - (dir.y / dl) * headLength);
    }
    this.polyline(points, color, width);
    if (head !== 'none') this.head(last, dir, headLength, head, color, width);
  }

  private drawDifference(a: ChartGrowthAnnotation | ChartCagrAnnotation): void {
    const c = this.ctx;
    const sa = c.seriesIndex(a.from.series);
    const pa = c.pointIndex(sa, a.from.point);
    const sb = c.seriesIndex(a.to.series);
    const pb = c.pointIndex(sb, a.to.point);
    const va = c.value(sa, pa);
    const vb = c.value(sb, pb);
    const from = c.markPoint(sa, pa);
    const to = c.markPoint(sb, pb);
    let amount: number;
    let key: string;
    let template: string;
    let format: string;
    if (a.type === 'growth') {
      if (va === 0) throw new RangeError('A growth annotation needs a non-zero starting value.');
      amount = (vb - va) / Math.abs(va);
      key = '{growth}';
      template = a.template ?? '{growth}';
      format = a.format ?? 'P0';
    } else {
      if (!(va > 0) || !(vb > 0)) throw new RangeError('A cagr annotation needs positive values.');
      const periods = a.periods ?? Math.abs(pb - pa);
      if (!(periods > 0)) throw new RangeError('A cagr annotation needs a positive number of periods.');
      amount = Math.pow(vb / va, 1 / periods) - 1;
      key = '{cagr}';
      template = a.template ?? 'CAGR {cagr}';
      format = a.format ?? 'P1';
    }
    const label = template.split(key).join(formatChartNumber(amount, format));
    const out = this.out;
    const ca = c.vertical ? from.x : from.y;
    const cb = c.vertical ? to.x : to.y;
    const ha = c.vertical ? from.y : from.x;
    const hb = c.vertical ? to.y : to.x;
    const size = this.size(a);
    const pillH = size + 6;
    const pillW = c.canvas.measureText(label, size, c.family).width + 12;
    // The apex sits 12 pt beyond the taller mark; where the pill would leave the chart it drops beyond the baseline instead.
    const tallest = out < 0 ? Math.min(ha, hb) : Math.max(ha, hb);
    let apex = tallest + out * (12 + c.labelAllowance);
    let dir = out;
    let startA = ha + out * c.labelAllowance;
    let startB = hb + out * c.labelAllowance;
    const apexPoint = this.at((ca + cb) / 2, apex);
    const leaves = c.vertical ? apexPoint.y - pillH / 2 < 2 : apexPoint.x + pillW / 2 > c.chartWidth - 2;
    if (leaves) {
      dir = -out;
      apex = c.origin + dir * 14;
      startA = c.origin;
      startB = c.origin;
    }
    const color = (a.color !== undefined ? toColor(a.color) : amount >= 0 ? c.positive : c.negative);
    const headLength = 5;
    const tip = this.at(cb, startB + dir * 3);
    const shaftEnd = this.at(cb, startB + dir * (3 + headLength));
    this.polyline([this.at(ca, startA + dir * 3), this.at(ca, apex), this.at(cb, apex), shaftEnd], color, 1.5);
    this.head(tip, new Point(tip.x - shaftEnd.x, tip.y - shaftEnd.y), headLength, 'triangle', color, 1.5);
    const mid = this.at((ca + cb) / 2, apex);
    const rect = this.inside(mid.x - pillW / 2, mid.y - pillH / 2, pillW, pillH);
    this.paintBox({ x: rect.x, y: rect.y, width: pillW, height: pillH }, { radius: pillH / 2 }, color);
    c.canvas.drawText(rect.x + 6, rect.y + 3, label, a.textColor !== undefined ? toColor(a.textColor) : contrastTextColor(color), size, c.family, TextAlignment.Left);
  }

  private drawBracket(a: ChartBracketAnnotation): void {
    const c = this.ctx;
    const i = c.categoryIndex(a.fromCategory);
    const j = c.categoryIndex(a.toCategory);
    const lo = Math.min(i, j);
    const hi = Math.max(i, j);
    const side = a.side ?? 'above';
    const dir = side === 'above' ? this.out : -this.out;
    let extreme = c.origin;
    for (let cat = lo; cat <= hi; cat++) {
      for (let s = 0; s < c.seriesCount; s++) {
        if (cat >= c.categoryPointCount(s)) continue;
        const p = c.markPoint(s, cat);
        const h = c.vertical ? p.y : p.x;
        extreme = dir < 0 ? Math.min(extreme, h) : Math.max(extreme, h);
      }
    }
    const h0 = extreme + dir * 8;
    const c0 = c.categoryCentre(lo) - c.slot * 0.4;
    const c1 = c.categoryCentre(hi) + c.slot * 0.4;
    const color = this.accent(a);
    this.polyline([this.at(c0, h0 - dir * 4), this.at(c0, h0), this.at(c1, h0), this.at(c1, h0 - dir * 4)], color, 1.25);
    if (a.text) {
      const size = this.size(a);
      const w = c.canvas.measureText(a.text, size, c.family).width;
      const mid = (c0 + c1) / 2;
      if (c.vertical) {
        const pos = this.inside(mid - w / 2, dir < 0 ? h0 - 3 - size : h0 + 3, w, size);
        this.text(a.text, pos.x + w / 2, pos.y, 'center', size, this.textColour(a));
      } else {
        const x = dir > 0 ? h0 + 3 : h0 - 3;
        const pos = this.inside(dir > 0 ? x : x - w, mid - size / 2, w, size);
        this.text(a.text, dir > 0 ? pos.x : pos.x + w, pos.y, dir > 0 ? 'start' : 'end', size, this.textColour(a));
      }
    }
  }

  private drawMarker(a: ChartMarkerAnnotation): void {
    const c = this.ctx;
    const p = this.resolve(a.target);
    const size = a.size ?? 10;
    const color = this.accent(a);
    const shape = a.shape ?? 'ring';
    if (shape === 'circle') {
      c.canvas.fillCircle(p.x, p.y, size / 2, color);
    } else if (shape === 'square') {
      const h = size / 2;
      this.polyline([new Point(p.x - h, p.y - h), new Point(p.x + h, p.y - h), new Point(p.x + h, p.y + h), new Point(p.x - h, p.y + h), new Point(p.x - h, p.y - h)], color, 1.5);
    } else {
      const points: Point[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = (i / 24) * 2 * Math.PI;
        points.push(new Point(p.x + (size / 2) * Math.cos(t), p.y + (size / 2) * Math.sin(t)));
      }
      this.polyline(points, color, 1.5);
    }
  }
}
