// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { ICanvas } from '../ChartHost';
import type { ChartPathCommand, ChartPatternFill } from './ChartPathPlan';
import { popClip, pushClipRect, strokeChartPath } from './ChartVector';

/** Renders a pure-vector hatch or dot pattern clipped to `(x, y, width, height)`. */
export function fillPatternRect(
  sink: ICanvas,
  x: number,
  y: number,
  width: number,
  height: number,
  pattern: ChartPatternFill
): void {
  if (width <= 0 || height <= 0 || pattern.kind === 'none') return;
  const spacing = Math.max(2, pattern.spacing ?? 6);
  const strokeWidth = Math.max(0.5, pattern.strokeWidth ?? 1);

  if (pattern.background) {
    sink.fillRect(x, y, width, height, pattern.background);
  }

  pushClipRect(sink, x, y, width, height);
  try {
    if (pattern.kind === 'dots') {
      const r = Math.max(0.5, strokeWidth);
      for (let py = y + spacing / 2; py < y + height + r; py += spacing) {
        for (let px = x + spacing / 2; px < x + width + r; px += spacing) {
          sink.fillCircle(px, py, r, pattern.foreground);
        }
      }
      return;
    }

    const cmds: ChartPathCommand[] = [];
    if (pattern.kind === 'horizontal' || pattern.kind === 'crosshatch') {
      for (let py = y + spacing / 2; py < y + height; py += spacing) {
        cmds.push({ op: 'M', values: [x, py] }, { op: 'L', values: [x + width, py] });
      }
    }
    if (pattern.kind === 'vertical' || pattern.kind === 'crosshatch') {
      for (let px = x + spacing / 2; px < x + width; px += spacing) {
        cmds.push({ op: 'M', values: [px, y] }, { op: 'L', values: [px, y + height] });
      }
    }
    if (pattern.kind === 'diagonal') {
      const span = width + height;
      for (let offset = -height; offset <= span; offset += spacing) {
        cmds.push({ op: 'M', values: [x + offset, y + height] }, { op: 'L', values: [x + offset + height, y] });
      }
    }
    if (pattern.kind === 'reverseDiagonal') {
      const span = width + height;
      for (let offset = -height; offset <= span; offset += spacing) {
        cmds.push({ op: 'M', values: [x + offset, y] }, { op: 'L', values: [x + offset + height, y + height] });
      }
    }
    if (cmds.length > 0) {
      strokeChartPath(sink, { commands: cmds, color: pattern.foreground, lineWidth: strokeWidth });
    }
  } finally {
    popClip(sink);
  }
}
