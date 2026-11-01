// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { Color, ICanvas } from '../ChartHost';
import type { ChartBarStyle } from '../ChartBarStyle';
import type { ChartTheme } from '../ChartTheme';
import type { ChartPathCommand, ChartPathPlan } from './ChartPathPlan';
import { fillChartPath } from './ChartVector';

/** Core-owned rounded outline and paint coordinates; adapters only replay this plan. */
export function drawChartBar(
  sink: ICanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Color,
  style: ChartBarStyle,
  theme: ChartTheme,
  horizontal: boolean,
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number
): void {
  const radius = style.cornerRadius ?? theme.barCornerRadius;
  const g = style.gradient;
  if (!Number.isFinite(radius) || radius < 0) throw new RangeError('cornerRadius must be finite and nonnegative.');
  if (g && (g.startColor.scA !== 1 || g.endColor.scA !== 1 || !['bar', 'plot'].includes(g.scope)))
    throw new RangeError('Bar gradients require opaque colours and scope bar or plot.');
  if (!theme.styledGeometry && radius === 0 && !g) {
    sink.fillRect(x, y, w, h, color);
    return;
  }
  if (![x, y, w, h, plotX, plotY, plotW, plotH].every(Number.isFinite))
    throw new RangeError('Bar geometry must be finite.');
  if (w === 0 || h === 0) return;
  const x0 = Math.min(x, x + w),
    x1 = Math.max(x, x + w),
    y0 = Math.min(y, y + h),
    y1 = Math.max(y, y + h);
  const r = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2),
    k = 0.5522847498307936;
  let tl = 0,
    tr = 0,
    br = 0,
    bl = 0;
  if (horizontal) {
    if (w > 0) tr = br = r;
    else tl = bl = r;
  } else {
    if (h > 0) tl = tr = r;
    else bl = br = r;
  }
  const commands: ChartPathCommand[] = [];
  const add = (op: ChartPathCommand['op'], ...values: number[]) => commands.push({ op, values });
  add('M', x0 + tl, y0);
  add('L', x1 - tr, y0);
  if (tr) add('C', x1 - tr + k * tr, y0, x1, y0 + tr - k * tr, x1, y0 + tr);
  add('L', x1, y1 - br);
  if (br) add('C', x1, y1 - br + k * br, x1 - br + k * br, y1, x1 - br, y1);
  add('L', x0 + bl, y1);
  if (bl) add('C', x0 + bl - k * bl, y1, x0, y1 - bl + k * bl, x0, y1 - bl);
  add('L', x0, y0 + tl);
  if (tl) add('C', x0, y0 + tl - k * tl, x0 + tl - k * tl, y0, x0 + tl, y0);
  add('Z');
  const plan: ChartPathPlan = { commands, color };
  if (g) {
    const px = g.scope === 'plot' ? plotX : x0,
      py = g.scope === 'plot' ? plotY : y0,
      pw = g.scope === 'plot' ? plotW : x1 - x0,
      ph = g.scope === 'plot' ? plotH : y1 - y0;
    plan.gradient = {
      startX: horizontal ? px + pw : px,
      startY: py,
      endX: px,
      endY: horizontal ? py : py + ph,
      startColor: g.startColor,
      endColor: g.endColor,
    };
    if (g.scope === 'bar' && ((horizontal && w < 0) || (!horizontal && h < 0))) {
      [plan.gradient.startX, plan.gradient.endX] = [plan.gradient.endX, plan.gradient.startX];
      [plan.gradient.startY, plan.gradient.endY] = [plan.gradient.endY, plan.gradient.startY];
    }
  }
  fillChartPath(sink, plan);
}
