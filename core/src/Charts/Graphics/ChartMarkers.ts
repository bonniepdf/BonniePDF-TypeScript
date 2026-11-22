// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, type ICanvas } from '../ChartHost';
import type { ChartPathCommand } from './ChartPathPlan';
import { fillChartPath, strokeChartPath } from './ChartVector';

/** Geometric marker shape for data points. */
export type ChartMarkerShape = 'circle' | 'square' | 'diamond' | 'triangle';
/** Fill mode for data point markers (`solid` or `hollow`). */
export type ChartMarkerFill = 'solid' | 'hollow';

const K = (4 / 3) * (Math.SQRT2 - 1);

function circleCommands(cx: number, cy: number, r: number): ChartPathCommand[] {
  const kr = K * r;
  return [
    { op: 'M', values: [cx, cy - r] },
    { op: 'C', values: [cx + kr, cy - r, cx + r, cy - kr, cx + r, cy] },
    { op: 'C', values: [cx + r, cy + kr, cx + kr, cy + r, cx, cy + r] },
    { op: 'C', values: [cx - kr, cy + r, cx - r, cy + kr, cx - r, cy] },
    { op: 'C', values: [cx - r, cy - kr, cx - kr, cy - r, cx, cy - r] },
    { op: 'Z', values: [] },
  ];
}

function markerCommands(cx: number, cy: number, r: number, shape: ChartMarkerShape): ChartPathCommand[] {
  if (shape === 'circle') return circleCommands(cx, cy, r);
  if (shape === 'square') {
    const s = r * 0.886;
    return [
      { op: 'M', values: [cx - s, cy - s] },
      { op: 'L', values: [cx + s, cy - s] },
      { op: 'L', values: [cx + s, cy + s] },
      { op: 'L', values: [cx - s, cy + s] },
      { op: 'Z', values: [] },
    ];
  }
  if (shape === 'diamond') {
    const d = r * 1.2;
    return [
      { op: 'M', values: [cx, cy - d] },
      { op: 'L', values: [cx + d, cy] },
      { op: 'L', values: [cx, cy + d] },
      { op: 'L', values: [cx - d, cy] },
      { op: 'Z', values: [] },
    ];
  }
  // triangle
  const rt = r * 1.25;
  const sin60 = 0.8660254037844386;
  return [
    { op: 'M', values: [cx, cy - rt] },
    { op: 'L', values: [cx + rt * sin60, cy + rt * 0.5] },
    { op: 'L', values: [cx - rt * sin60, cy + rt * 0.5] },
    { op: 'Z', values: [] },
  ];
}

/** Draws a chart marker supporting shapes, hollow fills and background halos. */
export function drawChartMarker(
  sink: ICanvas,
  cx: number,
  cy: number,
  radius: number,
  color: Color,
  shape: ChartMarkerShape = 'circle',
  fill: ChartMarkerFill = 'solid',
  haloWidth = 0,
  backgroundColor: Color = Color.white,
  strokeWidth = 1.5
): void {
  if (radius <= 0) return;
  if (shape === 'circle' && fill === 'solid' && haloWidth <= 0) {
    sink.fillCircle(cx, cy, radius, color);
    return;
  }

  if (haloWidth > 0) {
    if (shape === 'circle') {
      sink.fillCircle(cx, cy, radius + haloWidth, backgroundColor);
    } else {
      fillChartPath(sink, { commands: markerCommands(cx, cy, radius + haloWidth, shape), color: backgroundColor });
    }
  }

  const cmds = markerCommands(cx, cy, radius, shape);
  if (fill === 'hollow') {
    fillChartPath(sink, { commands: cmds, color: backgroundColor });
    strokeChartPath(sink, {
      commands: cmds,
      color,
      lineWidth: Math.max(1.5, strokeWidth),
      lineJoin: 'round',
    });
  } else if (shape === 'circle') {
    sink.fillCircle(cx, cy, radius, color);
  } else {
    fillChartPath(sink, { commands: cmds, color });
  }
}
