// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { ICanvas } from '../../Drawing/ICanvas';
import { LinearGradientPaint } from '../../Drawing/Paint';
import { Point } from '../../Core/Point';
import type { ChartPathPlan, ChartStrokePlan } from './ChartPathPlan';

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

export function fillChartPath(sink: ICanvas, plan: ChartPathPlan): void {
  sink.saveState();
  try {
    replayCommands(sink, plan.commands);
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
