// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { ICanvas } from '../../Drawing/ICanvas';
import { LinearGradientPaint, RadialGradientPaint } from '../../Drawing/Paint';
import { Point } from '../../Core/Point';
import type { ChartPathPlan, ChartStrokePlan } from './ChartPathPlan';
import type { ChartGroupInfo } from './ChartGroups';
import { expandEffects, expandStrokeEffects } from './ChartEffects';

function replayCommands(sink: ICanvas, commands: ChartPathPlan['commands']): void {
  sink.beginPath();
  for (const c of commands) {
    const v = c.values;
    switch (c.op) {
      case 'M': sink.moveTo(v[0], v[1]); break;
      case 'L': sink.lineTo(v[0], v[1]); break;
      case 'C': sink.cubicBezierTo(v[0], v[1], v[2], v[3], v[4], v[5]); break;
      case 'Z': sink.closePath(); break;
    }
  }
}

/**
 * PDF canvases do not expose whether transparency is allowed (PDF/A-1 forbids it), so shadow and glow are omitted here and
 * only the opaque-safe parts of an effect (the gloss overlay) are drawn.
 */
export function fillChartPath(sink: ICanvas, plan: ChartPathPlan): void {
  if (plan.effects && plan.effects.length > 0) {
    for (const expanded of expandEffects(plan, 'none')) fillOnePath(sink, expanded);
    return;
  }
  fillOnePath(sink, plan);
}

function fillOnePath(sink: ICanvas, plan: ChartPathPlan): void {
  sink.saveState();
  try {
    replayCommands(sink, plan.commands);
    if (plan.radial) {
      const r = plan.radial;
      const focal = r.fx !== r.cx || r.fy !== r.cy ? new Point(r.fx, r.fy) : undefined;
      sink.fillCurrentPath(new RadialGradientPaint(new Point(r.cx, r.cy), r.r, r.stops.map((s) => ({ offset: s.offset, color: s.color })), focal));
      return;
    }
    const g = plan.gradient;
    const stops = g
      ? (g.stops && g.stops.length >= 2
          ? g.stops.map((s) => ({ offset: s.offset, color: s.color }))
          : [{ offset: 0, color: g.startColor }, { offset: 1, color: g.endColor }])
      : undefined;
    sink.fillCurrentPath(
      g ? new LinearGradientPaint(new Point(g.startX, g.startY), new Point(g.endX, g.endY), stops!) : plan.color
    );
  } finally {
    sink.restoreState();
  }
}

export function strokeChartPath(sink: ICanvas, plan: ChartStrokePlan): void {
  if (plan.effects && plan.effects.length > 0) {
    for (const expanded of expandStrokeEffects(plan, 'none')) strokeOnePath(sink, expanded);
    return;
  }
  strokeOnePath(sink, plan);
}

function strokeOnePath(sink: ICanvas, plan: ChartStrokePlan): void {
  if (!plan.commands.some((c) => c.op === 'L' || c.op === 'C')) return;
  sink.saveState();
  try {
    replayCommands(sink, plan.commands);
    sink.strokeCurrentPath({
      paint: plan.color,
      width: plan.lineWidth,
      lineCap: plan.lineCap ?? 'butt',
      lineJoin: plan.lineJoin ?? 'miter',
      miterLimit: plan.miterLimit !== undefined && plan.miterLimit !== 10 ? plan.miterLimit : undefined,
      dashPattern: plan.dashPattern,
      dashOffset: plan.dashOffset ?? 0,
    });
  } finally {
    sink.restoreState();
  }
}

/** PDF canvases keep no groups: the marks are drawn as they are. */
export function withChartGroup(_sink: ICanvas, _info: () => ChartGroupInfo, draw: () => void): void {
  draw();
}

export function pushClipRect(sink: ICanvas, x: number, y: number, width: number, height: number): void {
  sink.saveState();
  sink.beginPath();
  sink.moveTo(x, y);
  sink.lineTo(x + width, y);
  sink.lineTo(x + width, y + height);
  sink.lineTo(x, y + height);
  sink.closePath();
  sink.clipToCurrentPath();
}

export function popClip(sink: ICanvas): void {
  sink.restoreState();
}
