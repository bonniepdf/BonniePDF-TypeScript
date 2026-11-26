// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions, Color, toColor, type ColorInput, type ICanvas, StandardFonts, TextAlignment } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions, ChartBase } from './ChartBase';
import type { ChartData } from './Models/ChartData';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { categoryColor } from './Graphics/ChartCategoryColors';
import { tintColor } from './Graphics/ChartTint';
import { chooseTimeUnit, defaultDateFormat, formatChartDate, parseChartDate, timeTicks, type ChartDateInput, type ChartTimeAxis, type ChartTimeUnit } from './Graphics/ChartDates';

export type { ChartDateInput };
import type { ChartPathCommand } from './Graphics/ChartPathPlan';

/** One task of a {@link GanttChart}. */
export interface GanttTask {
  /** Unique id, referenced by `dependsOn`. */
  id: string;
  /** The row label. */
  label: string;
  /** When the task starts. */
  start: ChartDateInput;
  /** When it ends. A task with no end is a milestone. */
  end?: ChartDateInput;
  /** The finished fraction, `0..1`: the leading part of the bar is drawn in the full colour, the rest in a tint. */
  progress?: number;
  /** Consecutive tasks with the same group sit under a bold group row. */
  group?: string;
  /** Bar colour. Defaults to the next colour of the theme for the group, or for the task when it has none. */
  color?: ColorInput;
  /** Draw a diamond at `start` instead of a bar. */
  milestone?: boolean;
  /** Ids of tasks that must finish first: an elbow arrow runs from each one's end to this task's start. */
  dependsOn?: readonly string[];
}

/** The time axis of a {@link GanttChart}. */
export type GanttTimeAxis = ChartTimeAxis;

/** Settable properties declared by {@link GanttChart} itself. */
export const GANTT_CHART_OWN_OPTION_KEYS = ['tasks', 'timeAxis', 'todayDate', 'rowHeight', 'barHeightRatio', 'labelColumnWidth', 'showProgressLabels'] as const;

/** The full option surface, base included. */
export const GANTT_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...GANTT_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link GanttChart}. */
export type GanttChartOptions = ChartBaseOptions & Partial<Pick<GanttChart, (typeof GANTT_CHART_OWN_OPTION_KEYS)[number]>>;

/** A Gantt chart: tasks as bars on a time axis, with groups, progress, milestones, dependencies and a today marker. */
export class GanttChart extends ChartBase {
  /** The tasks, one row each, in order. */
  tasks: readonly GanttTask[] = [];
  /** The time axis. */
  timeAxis: GanttTimeAxis = {};
  /** Draws a labelled vertical line at this date. */
  todayDate: ChartDateInput | undefined;
  /** Height of a row in points (`22`); rows shrink to fit the chart height. */
  rowHeight: number = 22;
  /** The fraction of a row a bar fills (`0.6`). */
  barHeightRatio: number = 0.6;
  /** Width of the label column in points. Defaults to the widest label, at most 35 % of the chart width. */
  labelColumnWidth: number | undefined;
  /** Write the progress percentage inside bars that are wide enough. */
  showProgressLabels: boolean = false;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return true;
  }

  constructor(options?: GanttChartOptions) {
    super();
    this.autoLayout = true;
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const tasks = this.tasks;
    if (tasks.length === 0) return;
    if (!(this.rowHeight > 0)) throw new RangeError('Gantt rowHeight must be positive.');
    if (!(this.barHeightRatio > 0 && this.barHeightRatio <= 1)) throw new RangeError('Gantt barHeightRatio must be above 0 and at most 1.');
    const ids = new Set<string>();
    const resolved = tasks.map((t) => {
      if (ids.has(t.id)) throw new RangeError(`Duplicate task id '${t.id}'.`);
      ids.add(t.id);
      const start = parseChartDate(t.start);
      const milestone = t.milestone === true || t.end === undefined;
      const end = t.end === undefined ? start : parseChartDate(t.end);
      if (end < start) throw new RangeError(`Task '${t.id}' ends before it starts.`);
      if (t.progress !== undefined && !(t.progress >= 0 && t.progress <= 1)) throw new RangeError(`Task '${t.id}' progress must be from 0 to 1.`);
      return { task: t, start, end, milestone };
    });
    const byId = new Map(resolved.map((r) => [r.task.id, r]));
    for (const r of resolved) for (const dep of r.task.dependsOn ?? []) if (!byId.has(dep)) throw new RangeError(`Task '${r.task.id}' depends on unknown task '${dep}'.`);

    // Rows: a group row before the first task of each run of the same group.
    interface Row { kind: 'group' | 'task'; label: string; index: number; group?: string }
    const rows: Row[] = [];
    resolved.forEach((r, i) => {
      const g = r.task.group;
      if (g !== undefined && (i === 0 || resolved[i - 1].task.group !== g)) rows.push({ kind: 'group', label: g, index: i, group: g });
      rows.push({ kind: 'task', label: r.task.label, index: i, group: g });
    });
    const groups: string[] = [];
    for (const r of resolved) if (r.task.group !== undefined && !groups.includes(r.task.group)) groups.push(r.task.group);

    const font = this.resolveFontFamily();
    const boldFont = font === StandardFonts.Helvetica ? StandardFonts.HelveticaBold : font;
    const axis = this.timeAxis;
    const min = axis.minDate !== undefined ? parseChartDate(axis.minDate) : Math.min(...resolved.map((r) => r.start));
    let max = axis.maxDate !== undefined ? parseChartDate(axis.maxDate) : Math.max(...resolved.map((r) => r.end));
    if (!(max > min)) max = min + 86_400_000;
    const today = this.todayDate !== undefined ? parseChartDate(this.todayDate) : undefined;

    let widest = 0;
    for (const row of rows) widest = Math.max(widest, canvas.measureText(row.label, 10, row.kind === 'group' ? boldFont : font).width + (row.group !== undefined && row.kind === 'task' ? 10 : 0));
    const labelColumn = this.labelColumnWidth ?? Math.min(widest + 16, this.width * 0.35);
    const x0 = 12 + labelColumn;
    const x1 = this.width - 24;
    const top = (data.title !== '' ? 56 : 18) + (data.subtitle !== '' ? 18 : 0);
    const headerBand = 22;
    const bottom = this.height - 14 - (this.caption !== '' ? 16 : 0);
    const rowsTop = top + headerBand;
    const rowH = Math.min(this.rowHeight, (bottom - rowsTop) / rows.length);
    const xOf = (t: number): number => x0 + ((t - min) / (max - min)) * (x1 - x0);
    const unit: ChartTimeUnit = axis.unit === undefined || axis.unit === 'auto' ? chooseTimeUnit(min, max, x1 - x0) : axis.unit;
    const format = axis.format ?? defaultDateFormat(unit);

    for (const t of timeTicks(min, max, unit)) {
      const x = xOf(t);
      if (axis.showGridLines !== false) canvas.drawLine(x, rowsTop, x, rowsTop + rowH * rows.length, this.appearance.gridLineColor, 0.5);
      canvas.drawText(x, top + 4, formatChartDate(t, format), this.appearance.axisColor, 10, font, TextAlignment.Center);
    }

    const rowCentre = new Map<number, number>();
    rows.forEach((row, i) => {
      const y = rowsTop + i * rowH;
      const cy = y + rowH / 2;
      if (row.kind === 'task') rowCentre.set(row.index, cy);
      const indent = row.kind === 'task' && row.group !== undefined ? 10 : 0;
      canvas.drawText(12 + indent, cy - 5, row.label, this.appearance.legendTextColor, 10, row.kind === 'group' ? boldFont : font, TextAlignment.Left);
      const barH = rowH * this.barHeightRatio;
      if (row.kind === 'group') {
        const members = resolved.filter((r) => r.task.group === row.group);
        const gs = Math.min(...members.map((m) => m.start));
        const ge = Math.max(...members.map((m) => m.end));
        canvas.fillRect(xOf(gs), cy - 3, Math.max(1, xOf(ge) - xOf(gs)), 6, this.appearance.axisColor);
        return;
      }
      const r = resolved[row.index];
      const colorIndex = r.task.group !== undefined ? groups.indexOf(r.task.group) : row.index;
      const color = r.task.color !== undefined ? toColor(r.task.color) : categoryColor(this.appearance, undefined, colorIndex);
      if (r.milestone) {
        const cx = xOf(r.start);
        const h = rowH * 0.35;
        const commands: ChartPathCommand[] = [
          { op: 'M', values: [cx, cy - h] },
          { op: 'L', values: [cx + h, cy] },
          { op: 'L', values: [cx, cy + h] },
          { op: 'L', values: [cx - h, cy] },
          { op: 'Z', values: [] },
        ];
        fillChartPath(canvas, { commands, color });
        return;
      }
      const bx = xOf(r.start);
      const bw = Math.max(1, xOf(r.end) - bx);
      const by = cy - barH / 2;
      const progress = r.task.progress;
      if (progress === undefined) canvas.fillRect(bx, by, bw, barH, color);
      else {
        canvas.fillRect(bx, by, bw, barH, tintColor(color));
        if (progress > 0) canvas.fillRect(bx, by, bw * progress, barH, color);
        if (this.showProgressLabels) {
          const text = `${Math.round(progress * 100)}%`;
          if (canvas.measureText(text, 9, font).width + 6 <= bw) canvas.drawText(bx + bw / 2, cy - 4.5, text, contrastTextColor(progress >= 0.5 ? color : tintColor(color)), 9, font, TextAlignment.Center);
        }
      }
    });

    // Dependencies: an elbow from the end of each predecessor to the start of the task.
    const arrow = this.appearance.axisColor;
    resolved.forEach((r, i) => {
      for (const dep of r.task.dependsOn ?? []) {
        const p = byId.get(dep)!;
        const pi = resolved.indexOf(p);
        const px = xOf(p.end);
        const py = rowCentre.get(pi)!;
        const sx = xOf(r.start);
        const sy = rowCentre.get(i)!;
        const commands: ChartPathCommand[] = [
          { op: 'M', values: [px, py] },
          { op: 'L', values: [px + 8, py] },
          { op: 'L', values: [px + 8, sy] },
          { op: 'L', values: [sx - 5, sy] },
        ];
        strokeChartPath(canvas, { commands, color: arrow, lineWidth: 1, miterLimit: 10 });
        fillChartPath(canvas, { commands: [{ op: 'M', values: [sx, sy] }, { op: 'L', values: [sx - 5, sy - 3] }, { op: 'L', values: [sx - 5, sy + 3] }, { op: 'Z', values: [] }], color: arrow });
      }
    });

    if (today !== undefined && today >= min && today <= max) {
      const x = xOf(today);
      const color = this.appearance.negativeColor ?? Color.fromHex('#b91c1c');
      strokeChartPath(canvas, { commands: [{ op: 'M', values: [x, rowsTop] }, { op: 'L', values: [x, rowsTop + rowH * rows.length] }], color, lineWidth: 1.25, dashPattern: [4, 3], miterLimit: 10 });
      canvas.drawText(x, rowsTop + rowH * rows.length + 3, 'Today', color, 9, font, TextAlignment.Center);
    }
  }
}
