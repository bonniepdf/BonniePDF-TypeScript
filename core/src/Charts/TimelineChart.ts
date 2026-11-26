// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, toColor, type ColorInput, type ICanvas, StandardFonts, TextAlignment } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { formatChartDate, parseChartDate } from './Graphics/ChartDates';
import type { ChartDateInput } from './GanttChart';

/** One dated event of a {@link TimelineChart}. */
export interface TimelineEvent {
  date: ChartDateInput;
  label: string;
  /** A second line of text under the date. */
  detail?: string;
  /** Colour of the event's dot, stem and label. Defaults to the next colour of the theme. */
  color?: ColorInput;
}

/** A labelled span of time drawn behind the axis of a {@link TimelineChart}. */
export interface TimelineEra {
  start: ChartDateInput;
  end: ChartDateInput;
  label: string;
  /** The span's colour. */
  fill: ColorInput;
}

/** Settable properties declared by {@link TimelineChart} itself. */
export const TIMELINE_CHART_OWN_OPTION_KEYS = ['events', 'eras', 'dateFormat'] as const;

/** The full option surface, base included. */
export const TIMELINE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...TIMELINE_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link TimelineChart}. */
export type TimelineChartOptions = ChartBaseOptions & Partial<Pick<TimelineChart, (typeof TIMELINE_CHART_OWN_OPTION_KEYS)[number]>>;

const MAX_LEVELS = 4;

/** Events on a horizontal axis. Labels alternate above and below, stepping outwards to keep clear of one another. */
export class TimelineChart extends ChartBase {
  /** The events. */
  events: readonly TimelineEvent[] = [];
  /** Spans drawn behind the axis. */
  eras: readonly TimelineEra[] = [];
  /** Format of each event's date line: `yyyy`, `yy`, `Q`, `MMM`, `MM`, `dd`, `d`, `HH`, `mm` and `'literal'`. */
  dateFormat: string = 'dd MMM yyyy';

  private _omitted = 0;
  /** Events the last draw left out because no label position was free. */
  get omittedCount(): number {
    return this._omitted;
  }

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: TimelineChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    this._omitted = 0;
    if (this.events.length === 0) return;
    const events = this.events
      .map((e, i) => ({ e, i, t: parseChartDate(e.date) }))
      .sort((a, b) => a.t - b.t || a.i - b.i);
    const eras = this.eras.map((e) => ({ e, start: parseChartDate(e.start), end: parseChartDate(e.end) }));
    for (const era of eras) if (era.end < era.start) throw new RangeError(`Era '${era.e.label}' ends before it starts.`);
    const times = [...events.map((x) => x.t), ...eras.flatMap((x) => [x.start, x.end])];
    let min = Math.min(...times);
    let max = Math.max(...times);
    if (!(max > min)) {
      min -= 86_400_000;
      max += 86_400_000;
    }
    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const left = 40;
    const right = this.width - 40;
    const top = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const bottom = this.height - 14 - (this.caption !== '' ? 16 : 0);
    const axisY = (top + bottom) / 2;
    const xOf = (t: number): number => left + ((t - min) / (max - min)) * (right - left);

    for (const era of eras) {
      const x = xOf(era.start);
      const w = Math.max(1, xOf(era.end) - x);
      const color = toColor(era.e.fill);
      canvas.fillRect(x, axisY - 11, w, 22, color);
      canvas.drawText(x + 4, axisY - 10, era.e.label, this.appearance.legendTextColor, 9, font, TextAlignment.Left);
    }
    canvas.drawLine(left, axisY, right, axisY, this.appearance.axisColor, 2);

    // Label boxes: measured lines, one block per event.
    const blocks = events.map(({ e, i, t }) => {
      const lines = [e.label, formatChartDate(t, this.dateFormat), ...(e.detail !== undefined && e.detail !== '' ? [e.detail] : [])];
      const widths = lines.map((l, k) => canvas.measureText(l, k === 0 ? 10 : 9, k === 0 ? boldFont : font).width);
      return { e, i, t, lines, width: Math.max(...widths) };
    });
    const lineHeight = 12;
    const maxHeight = Math.max(...blocks.map((b) => b.lines.length)) * lineHeight;
    const step = maxHeight + 6;
    const rightEdge: [number[], number[]] = [new Array<number>(MAX_LEVELS).fill(-Infinity), new Array<number>(MAX_LEVELS).fill(-Infinity)];
    blocks.forEach((b, n) => {
      const side = n % 2; // 0 above, 1 below
      const x = xOf(b.t);
      const boxLeft = Math.min(Math.max(x - b.width / 2, 4), this.width - 4 - b.width);
      let level = -1;
      for (let k = 0; k < MAX_LEVELS; k++) {
        if (boxLeft >= rightEdge[side][k] + 6) {
          level = k;
          break;
        }
      }
      if (level < 0) {
        this._omitted++;
        return;
      }
      rightEdge[side][level] = boxLeft + b.width;
      const color = b.e.color !== undefined ? toColor(b.e.color) : categoryColor(this.appearance, undefined, b.i);
      const height = b.lines.length * lineHeight;
      const offset = 18 + level * step;
      const boxTop = side === 0 ? axisY - offset - height : axisY + offset;
      const stemEnd = side === 0 ? boxTop + height + 2 : boxTop - 2;
      canvas.drawLine(x, axisY, x, stemEnd, color, 1);
      canvas.fillCircle(x, axisY, 4, color);
      const cx = boxLeft + b.width / 2;
      b.lines.forEach((line, k) => {
        canvas.drawText(cx, boxTop + k * lineHeight, line, k === 0 ? this.appearance.legendTextColor : this.appearance.axisColor, k === 0 ? 10 : 9, k === 0 ? boldFont : font, TextAlignment.Center);
      });
    });
  }
}
