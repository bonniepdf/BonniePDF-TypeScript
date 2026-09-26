// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { PathSegment } from '../Parsers/PathData';
import { numberList } from '../Parsers/Tokens';

/**
 * Turn each basic shape into path segments.
 *
 * This is the de-sugaring the IR is built on: after this, nothing downstream
 * knows a `<circle>` from a `<path>`. Sinks that have a native circle primitive
 * can still recognise one, but they are not required to.
 */

/** Kappa: the control-point distance that makes a cubic approximate a quarter circle. */
const KAPPA = 0.5522847498307933;

export function rectToPath(
  x: number,
  y: number,
  width: number,
  height: number,
  rxInput: number | undefined,
  ryInput: number | undefined
): PathSegment[] {
  // A zero or negative extent disables rendering, per the spec.
  if (width <= 0 || height <= 0) return [];

  // Corner radii: one given implies the other, and each clamps to half its side.
  let rx = rxInput ?? ryInput ?? 0;
  let ry = ryInput ?? rxInput ?? 0;
  rx = Math.min(Math.max(rx, 0), width / 2);
  ry = Math.min(Math.max(ry, 0), height / 2);

  if (rx === 0 || ry === 0) {
    return [
      { kind: 'move', x, y },
      { kind: 'line', x: x + width, y },
      { kind: 'line', x: x + width, y: y + height },
      { kind: 'line', x, y: y + height },
      { kind: 'close' },
    ];
  }

  const cx = rx * KAPPA;
  const cy = ry * KAPPA;
  const right = x + width;
  const bottom = y + height;

  return [
    { kind: 'move', x: x + rx, y },
    { kind: 'line', x: right - rx, y },
    { kind: 'cubic', c1x: right - rx + cx, c1y: y, c2x: right, c2y: y + ry - cy, x: right, y: y + ry },
    { kind: 'line', x: right, y: bottom - ry },
    { kind: 'cubic', c1x: right, c1y: bottom - ry + cy, c2x: right - rx + cx, c2y: bottom, x: right - rx, y: bottom },
    { kind: 'line', x: x + rx, y: bottom },
    { kind: 'cubic', c1x: x + rx - cx, c1y: bottom, c2x: x, c2y: bottom - ry + cy, x, y: bottom - ry },
    { kind: 'line', x, y: y + ry },
    { kind: 'cubic', c1x: x, c1y: y + ry - cy, c2x: x + rx - cx, c2y: y, x: x + rx, y },
    { kind: 'close' },
  ];
}

export function ellipseToPath(cx: number, cy: number, rx: number, ry: number): PathSegment[] {
  if (rx <= 0 || ry <= 0) return [];
  const ax = rx * KAPPA;
  const ay = ry * KAPPA;
  return [
    { kind: 'move', x: cx + rx, y: cy },
    { kind: 'cubic', c1x: cx + rx, c1y: cy + ay, c2x: cx + ax, c2y: cy + ry, x: cx, y: cy + ry },
    { kind: 'cubic', c1x: cx - ax, c1y: cy + ry, c2x: cx - rx, c2y: cy + ay, x: cx - rx, y: cy },
    { kind: 'cubic', c1x: cx - rx, c1y: cy - ay, c2x: cx - ax, c2y: cy - ry, x: cx, y: cy - ry },
    { kind: 'cubic', c1x: cx + ax, c1y: cy - ry, c2x: cx + rx, c2y: cy - ay, x: cx + rx, y: cy },
    { kind: 'close' },
  ];
}

export function lineToPath(x1: number, y1: number, x2: number, y2: number): PathSegment[] {
  return [
    { kind: 'move', x: x1, y: y1 },
    { kind: 'line', x: x2, y: y2 },
  ];
}

/**
 * `<polyline>` and `<polygon>` differ only in the closing segment.
 *
 * An odd trailing coordinate is dropped rather than throwing: the spec says to
 * render the valid prefix, and real exports do occasionally truncate.
 */
export function polyToPath(points: string, close: boolean): PathSegment[] {
  const values = numberList(points);
  const count = Math.floor(values.length / 2);
  if (count === 0) return [];

  const segments: PathSegment[] = [{ kind: 'move', x: values[0]!, y: values[1]! }];
  for (let i = 1; i < count; i++) {
    segments.push({ kind: 'line', x: values[i * 2]!, y: values[i * 2 + 1]! });
  }
  if (close) segments.push({ kind: 'close' });
  return segments;
}
