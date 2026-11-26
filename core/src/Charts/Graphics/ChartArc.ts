// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { ChartPathCommand } from './ChartPathPlan';

/** Cubic Bezier segments of an arc of radius `r` from angle `a0` to `a1` (radians), each at most 90°. @internal */
export function arcSegments(cx: number, cy: number, r: number, a0: number, a1: number): ChartPathCommand[] {
  const span = a1 - a0;
  if (Math.abs(span) < 1e-9 || !(r > 0)) return [];
  const n = Math.max(1, Math.ceil(Math.abs(span) / (Math.PI / 2) - 1e-9));
  const out: ChartPathCommand[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + (span * i) / n;
    const t1 = a0 + (span * (i + 1)) / n;
    const k = (4 / 3) * Math.tan((t1 - t0) / 4);
    out.push({
      op: 'C',
      values: [
        cx + r * Math.cos(t0) - k * r * Math.sin(t0),
        cy + r * Math.sin(t0) + k * r * Math.cos(t0),
        cx + r * Math.cos(t1) + k * r * Math.sin(t1),
        cy + r * Math.sin(t1) - k * r * Math.cos(t1),
        cx + r * Math.cos(t1),
        cy + r * Math.sin(t1),
      ],
    });
  }
  return out;
}

/** Open stroke path for a circular arc from `a0` to `a1` (radians). @internal */
export function arcStrokeCommands(cx: number, cy: number, r: number, a0: number, a1: number): ChartPathCommand[] {
  if (!(r > 0) || Math.abs(a1 - a0) < 1e-9) return [];
  return [{ op: 'M', values: [cx + r * Math.cos(a0), cy + r * Math.sin(a0)] }, ...arcSegments(cx, cy, r, a0, a1)];
}

/** Closed path for a full circle of radius `r` centred at `(cx, cy)`. @internal */
export function circleCommands(cx: number, cy: number, r: number): ChartPathCommand[] {
  const k = (4 / 3) * Math.tan(Math.PI / 8) * r;
  return [
    { op: 'M', values: [cx + r, cy] },
    { op: 'C', values: [cx + r, cy + k, cx + k, cy + r, cx, cy + r] },
    { op: 'C', values: [cx - k, cy + r, cx - r, cy + k, cx - r, cy] },
    { op: 'C', values: [cx - r, cy - k, cx - k, cy - r, cx, cy - r] },
    { op: 'C', values: [cx + k, cy - r, cx + r, cy - k, cx + r, cy] },
    { op: 'Z', values: [] },
  ];
}

/** Closed annular sector from angle `a0` to `a1` between `inner` and `outer` radii. @internal */
export function ringSectorCommands(cx: number, cy: number, inner: number, outer: number, a0: number, a1: number): ChartPathCommand[] {
  const commands: ChartPathCommand[] = [{ op: 'M', values: [cx + outer * Math.cos(a0), cy + outer * Math.sin(a0)] }, ...arcSegments(cx, cy, outer, a0, a1)];
  if (inner > 1e-6) {
    commands.push({ op: 'L', values: [cx + inner * Math.cos(a1), cy + inner * Math.sin(a1)] }, ...arcSegments(cx, cy, inner, a1, a0));
  } else {
    commands.push({ op: 'L', values: [cx, cy] });
  }
  commands.push({ op: 'Z', values: [] });
  return commands;
}

/** Closed rounded rectangle path. @internal */
export function roundedRectCommands(x: number, y: number, w: number, h: number, radius: number): ChartPathCommand[] {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (r <= 1e-6) {
    return [
      { op: 'M', values: [x, y] },
      { op: 'L', values: [x + w, y] },
      { op: 'L', values: [x + w, y + h] },
      { op: 'L', values: [x, y + h] },
      { op: 'Z', values: [] },
    ];
  }
  const k = r * 0.5522847498;
  return [
    { op: 'M', values: [x + r, y] },
    { op: 'L', values: [x + w - r, y] },
    { op: 'C', values: [x + w - r + k, y, x + w, y + r - k, x + w, y + r] },
    { op: 'L', values: [x + w, y + h - r] },
    { op: 'C', values: [x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h] },
    { op: 'L', values: [x + r, y + h] },
    { op: 'C', values: [x + r - k, y + h, x, y + h - r + k, x, y + h - r] },
    { op: 'L', values: [x, y + r] },
    { op: 'C', values: [x, y + r - k, x + r - k, y, x + r, y] },
    { op: 'Z', values: [] },
  ];
}
