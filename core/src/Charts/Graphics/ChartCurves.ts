// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Point } from '../ChartHost';
import type { ChartPathCommand } from './ChartPathPlan';

/** Curve interpolation mode for line and area series. */
export type ChartCurveMode = 'linear' | 'smooth' | 'stepBefore' | 'stepAfter' | 'stepMiddle';

/** Validates a stroke dash pattern identically to ChartReference.dashPattern. */
export function validateDashPattern(pattern: readonly number[] | undefined, pathLength: number): void {
  if (!pattern || pattern.length === 0) return;
  const minimum = Math.min(...pattern);
  if (pattern.some((d) => !Number.isFinite(d)) || minimum <= 0 || (pathLength > 0 && pathLength / minimum > 100_000)) {
    throw new RangeError('Dash lengths must be finite and positive and allow at most 100,000 segments.');
  }
}

/** Approximates polyline path length for dash validation. */
export function polylineLength(points: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.hypot(dx, dy);
  }
  return total;
}

/**
 * Computes Fritsch-Carlson monotone cubic Hermite tangents along the category axis
 * (`u` = x in vertical orientation, y in horizontal orientation) so curves never overshoot.
 */
function monotoneTangents(points: readonly Point[], horizontal: boolean): number[] {
  const n = points.length;
  const u = points.map((p) => (horizontal ? p.y : p.x));
  const v = points.map((p) => (horizontal ? p.x : p.y));
  const h: number[] = new Array(n - 1);
  const d: number[] = new Array(n - 1);
  for (let k = 0; k < n - 1; k++) {
    h[k] = u[k + 1] - u[k];
    d[k] = h[k] === 0 ? 0 : (v[k + 1] - v[k]) / h[k];
  }

  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) {
    if (d[k - 1] * d[k] <= 0 || h[k - 1] === 0 || h[k] === 0) {
      m[k] = 0;
    } else {
      const w1 = 2 * h[k] + h[k - 1];
      const w2 = h[k] + 2 * h[k - 1];
      m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
    }
  }

  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) {
      m[k] = 0;
      m[k + 1] = 0;
    } else {
      const alpha = m[k] / d[k];
      const beta = m[k + 1] / d[k];
      const sumSq = alpha * alpha + beta * beta;
      if (sumSq > 9) {
        const tau = 3 / Math.sqrt(sumSq);
        m[k] = tau * alpha * d[k];
        m[k + 1] = tau * beta * d[k];
      }
    }
  }

  return m;
}

/** Builds open path commands (`M` + `L`/`C`) for a sequence of points using the selected curve mode. */
export function buildCurveCommands(
  points: readonly Point[],
  curve: ChartCurveMode,
  horizontal: boolean,
  moveToFirst = true
): ChartPathCommand[] {
  const n = points.length;
  if (n === 0) return [];
  const cmds: ChartPathCommand[] = [];
  if (moveToFirst) cmds.push({ op: 'M', values: [points[0].x, points[0].y] });
  else cmds.push({ op: 'L', values: [points[0].x, points[0].y] });
  if (n === 1) return cmds;

  if (curve === 'linear' || (curve === 'smooth' && n === 2)) {
    for (let i = 1; i < n; i++) cmds.push({ op: 'L', values: [points[i].x, points[i].y] });
    return cmds;
  }

  if (curve === 'smooth') {
    const m = monotoneTangents(points, horizontal);
    for (let k = 0; k < n - 1; k++) {
      const p0 = points[k];
      const p1 = points[k + 1];
      const du = ((horizontal ? p1.y : p1.x) - (horizontal ? p0.y : p0.x)) / 3;
      if (horizontal) {
        cmds.push({
          op: 'C',
          values: [p0.x + m[k] * du, p0.y + du, p1.x - m[k + 1] * du, p1.y - du, p1.x, p1.y],
        });
      } else {
        cmds.push({
          op: 'C',
          values: [p0.x + du, p0.y + m[k] * du, p1.x - du, p1.y - m[k + 1] * du, p1.x, p1.y],
        });
      }
    }
    return cmds;
  }

  for (let k = 0; k < n - 1; k++) {
    const p0 = points[k];
    const p1 = points[k + 1];
    if (curve === 'stepAfter') {
      if (horizontal) cmds.push({ op: 'L', values: [p0.x, p1.y] });
      else cmds.push({ op: 'L', values: [p1.x, p0.y] });
      cmds.push({ op: 'L', values: [p1.x, p1.y] });
    } else if (curve === 'stepBefore') {
      if (horizontal) cmds.push({ op: 'L', values: [p1.x, p0.y] });
      else cmds.push({ op: 'L', values: [p0.x, p1.y] });
      cmds.push({ op: 'L', values: [p1.x, p1.y] });
    } else {
      // stepMiddle
      if (horizontal) {
        const midY = (p0.y + p1.y) / 2;
        cmds.push({ op: 'L', values: [p0.x, midY] }, { op: 'L', values: [p1.x, midY] }, { op: 'L', values: [p1.x, p1.y] });
      } else {
        const midX = (p0.x + p1.x) / 2;
        cmds.push({ op: 'L', values: [midX, p0.y] }, { op: 'L', values: [midX, p1.y] }, { op: 'L', values: [p1.x, p1.y] });
      }
    }
  }
  return cmds;
}

/**
 * Reverses a sequence of `M`/`L`/`C` commands so an area band's lower boundary shares exact
 * Bezier control points with the previous stacked series' upper boundary.
 */
export function reverseCurveCommands(forward: readonly ChartPathCommand[]): ChartPathCommand[] {
  if (forward.length === 0) return [];
  const reversed: ChartPathCommand[] = [];
  const endPt = (c: ChartPathCommand): [number, number] => {
    const v = c.values;
    return [v[v.length - 2], v[v.length - 1]];
  };
  const [lastX, lastY] = endPt(forward[forward.length - 1]);
  reversed.push({ op: 'L', values: [lastX, lastY] });
  for (let i = forward.length - 1; i >= 1; i--) {
    const curr = forward[i];
    const [prevX, prevY] = endPt(forward[i - 1]);
    if (curr.op === 'C') {
      const v = curr.values;
      reversed.push({ op: 'C', values: [v[2], v[3], v[0], v[1], prevX, prevY] });
    } else if (curr.op === 'L') {
      reversed.push({ op: 'L', values: [prevX, prevY] });
    }
  }
  return reversed;
}
