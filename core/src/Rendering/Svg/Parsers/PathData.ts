// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { NumberScanner, SvgParseError } from './Tokens';

/**
 * A path reduced to the four primitives every sink can draw.
 *
 * Quadratics and arcs are converted here rather than passed through, so no
 * sink ever needs to know they existed. That is the "de-sugaring" the IR
 * depends on, and it keeps sinks small.
 */
export type PathSegment =
  | { readonly kind: 'move'; readonly x: number; readonly y: number }
  | { readonly kind: 'line'; readonly x: number; readonly y: number }
  | {
      readonly kind: 'cubic';
      readonly c1x: number;
      readonly c1y: number;
      readonly c2x: number;
      readonly c2y: number;
      readonly x: number;
      readonly y: number;
    }
  | { readonly kind: 'close' };

/**
 * Convert one elliptical arc to cubic Béziers, per the SVG implementation
 * notes (F.6.5 endpoint-to-centre conversion, then F.6.6 out-of-range radius
 * correction).
 *
 * Splitting into segments of at most 90 degrees is what keeps the Bézier
 * approximation within tolerance; a single Bézier cannot represent a large
 * arc accurately. FOP's output for `10-path-arc.svg` splits the same way.
 */
export function arcToCubics(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  xAxisRotationDegrees: number,
  largeArc: boolean,
  sweep: boolean,
  x2: number,
  y2: number
): PathSegment[] {
  // Out-of-range handling, per F.6.2: a zero radius degenerates to a line, and
  // negative radii take their absolute value.
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [{ kind: 'line', x: x2, y: y2 }];
  if (x1 === x2 && y1 === y2) return [];

  const phi = (xAxisRotationDegrees * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // F.6.5 step 1: midpoint in the ellipse's own coordinate system.
  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  // F.6.6: scale radii up if they are too small to span the endpoints.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
  }

  // F.6.5 step 2: centre.
  const rxSq = rx * rx;
  const rySq = ry * ry;
  const numerator = rxSq * rySq - rxSq * y1p * y1p - rySq * x1p * x1p;
  const denominator = rxSq * y1p * y1p + rySq * x1p * x1p;
  // Clamp at zero: floating-point error can make this slightly negative when
  // the arc is very nearly degenerate, and Math.sqrt would give NaN.
  const coefficient =
    (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cxp = (coefficient * rx * y1p) / ry;
  const cyp = (-coefficient * ry * x1p) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  // F.6.5 steps 5-6: start angle and sweep.
  const theta = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  else if (sweep && delta < 0) delta += 2 * Math.PI;

  // Snap the count before rounding up. `ceil` on a value that lands exactly on
  // an integer is decided by the last bit of floating-point error, and a
  // half-circle arc - extremely common in real icons - puts |delta| at exactly
  // two quarter turns. Without the tolerance the two implementations disagree
  // about whether that is 2 segments or 3: identical rendering, different sink
  // calls, and therefore different PDF content streams for the same input.
  // Found by the showcase parity check on heroicons' paper-clip.
  const quarterTurns = Math.abs(delta) / (Math.PI / 2);
  const count = Math.max(1, Math.ceil(quarterTurns - 1e-9));
  const step = delta / count;
  // Control-point distance for a circular arc of `step` radians; exact at the
  // endpoints and tangents, which is what makes the join between segments
  // smooth.
  const alpha = (4 / 3) * Math.tan(step / 4);

  const segments: PathSegment[] = [];
  let angleStart = theta;

  for (let i = 0; i < count; i++) {
    const angleEnd = angleStart + step;

    const cosStart = Math.cos(angleStart);
    const sinStart = Math.sin(angleStart);
    const cosEnd = Math.cos(angleEnd);
    const sinEnd = Math.sin(angleEnd);

    const [sx, sy] = onEllipse(cx, cy, rx, ry, cosPhi, sinPhi, cosStart, sinStart);
    const [ex, ey] = onEllipse(cx, cy, rx, ry, cosPhi, sinPhi, cosEnd, sinEnd);

    // Tangents in ellipse space, rotated into user space.
    const [dsx, dsy] = tangent(rx, ry, cosPhi, sinPhi, cosStart, sinStart);
    const [dex, dey] = tangent(rx, ry, cosPhi, sinPhi, cosEnd, sinEnd);

    segments.push({
      kind: 'cubic',
      c1x: sx + alpha * dsx,
      c1y: sy + alpha * dsy,
      c2x: ex - alpha * dex,
      c2y: ey - alpha * dey,
      x: ex,
      y: ey,
    });

    angleStart = angleEnd;
  }

  // Land exactly on the commanded endpoint. The trigonometry above lands
  // within floating-point distance of it, and letting that drift accumulate
  // across a subpath shows up as a visible gap on closed shapes.
  const last = segments[segments.length - 1];
  if (last && last.kind === 'cubic') {
    segments[segments.length - 1] = { ...last, x: x2, y: y2 };
  }
  return segments;
}

function onEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  cosPhi: number,
  sinPhi: number,
  cosAngle: number,
  sinAngle: number
): [number, number] {
  const x = rx * cosAngle;
  const y = ry * sinAngle;
  return [cx + cosPhi * x - sinPhi * y, cy + sinPhi * x + cosPhi * y];
}

function tangent(
  rx: number,
  ry: number,
  cosPhi: number,
  sinPhi: number,
  cosAngle: number,
  sinAngle: number
): [number, number] {
  const dx = -rx * sinAngle;
  const dy = ry * cosAngle;
  return [cosPhi * dx - sinPhi * dy, sinPhi * dx + cosPhi * dy];
}

function angle(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
  // Clamp before acos: dot/len can exceed 1 by an epsilon and yield NaN.
  const value = Math.acos(Math.min(1, Math.max(-1, dot / len)));
  return ux * vy - uy * vx < 0 ? -value : value;
}

/**
 * Parse an SVG `d` attribute into primitive segments.
 *
 * Supports every command and both cases: M/m L/l H/h V/v C/c S/s Q/q T/t A/a
 * Z/z, including implicit repeats (`M 10 10 20 20` is a move then a line) and
 * the smooth-variant control-point reflection.
 */
export function parsePathData(d: string): PathSegment[] {
  const scanner = new NumberScanner(d);
  const segments: PathSegment[] = [];

  let currentX = 0;
  let currentY = 0;
  // Where the current subpath began, so `Z` returns there.
  let startX = 0;
  let startY = 0;
  // Previous control points, for the reflection S and T perform. Null when the
  // previous command was not the matching curve type - the spec says the
  // reflection then degenerates to the current point.
  let lastCubicControl: [number, number] | null = null;
  let lastQuadControl: [number, number] | null = null;
  let command = '';

  while (!scanner.atEnd()) {
    const next = scanner.peek()!;
    if (/[a-zA-Z]/.test(next)) {
      command = scanner.take()!;
    } else if (command === '') {
      throw new SvgParseError('path data must begin with a command', scanner.position, d);
    } else if (command === 'M') {
      // An implicit repeat of a moveto is a lineto, not another moveto.
      command = 'L';
    } else if (command === 'm') {
      command = 'l';
    } else if (command === 'Z' || command === 'z') {
      throw new SvgParseError('closepath takes no arguments', scanner.position, d);
    }

    const relative = command === command.toLowerCase();
    const originX = relative ? currentX : 0;
    const originY = relative ? currentY : 0;

    switch (command.toUpperCase()) {
      case 'M': {
        currentX = originX + scanner.number();
        currentY = originY + scanner.number();
        startX = currentX;
        startY = currentY;
        segments.push({ kind: 'move', x: currentX, y: currentY });
        lastCubicControl = lastQuadControl = null;
        break;
      }
      case 'L': {
        currentX = originX + scanner.number();
        currentY = originY + scanner.number();
        segments.push({ kind: 'line', x: currentX, y: currentY });
        lastCubicControl = lastQuadControl = null;
        break;
      }
      case 'H': {
        currentX = originX + scanner.number();
        segments.push({ kind: 'line', x: currentX, y: currentY });
        lastCubicControl = lastQuadControl = null;
        break;
      }
      case 'V': {
        currentY = originY + scanner.number();
        segments.push({ kind: 'line', x: currentX, y: currentY });
        lastCubicControl = lastQuadControl = null;
        break;
      }
      case 'C': {
        const c1x = originX + scanner.number();
        const c1y = originY + scanner.number();
        const c2x = originX + scanner.number();
        const c2y = originY + scanner.number();
        currentX = originX + scanner.number();
        currentY = originY + scanner.number();
        segments.push({ kind: 'cubic', c1x, c1y, c2x, c2y, x: currentX, y: currentY });
        lastCubicControl = [c2x, c2y];
        lastQuadControl = null;
        break;
      }
      case 'S': {
        // Reflect the previous cubic's second control point through the current
        // point. When the previous command was not a cubic, the spec says the
        // reflection is the current point itself.
        const reflectedX: number = lastCubicControl ? 2 * currentX - lastCubicControl[0] : currentX;
        const reflectedY: number = lastCubicControl ? 2 * currentY - lastCubicControl[1] : currentY;
        const c2x = originX + scanner.number();
        const c2y = originY + scanner.number();
        currentX = originX + scanner.number();
        currentY = originY + scanner.number();
        segments.push({ kind: 'cubic', c1x: reflectedX, c1y: reflectedY, c2x, c2y, x: currentX, y: currentY });
        lastCubicControl = [c2x, c2y];
        lastQuadControl = null;
        break;
      }
      case 'Q': {
        const qx = originX + scanner.number();
        const qy = originY + scanner.number();
        const endX = originX + scanner.number();
        const endY = originY + scanner.number();
        segments.push(quadToCubic(currentX, currentY, qx, qy, endX, endY));
        currentX = endX;
        currentY = endY;
        lastQuadControl = [qx, qy];
        lastCubicControl = null;
        break;
      }
      case 'T': {
        // Same reflection rule as S, for the quadratic control point.
        const qx: number = lastQuadControl ? 2 * currentX - lastQuadControl[0] : currentX;
        const qy: number = lastQuadControl ? 2 * currentY - lastQuadControl[1] : currentY;
        const endX = originX + scanner.number();
        const endY = originY + scanner.number();
        segments.push(quadToCubic(currentX, currentY, qx, qy, endX, endY));
        currentX = endX;
        currentY = endY;
        lastQuadControl = [qx, qy];
        lastCubicControl = null;
        break;
      }
      case 'A': {
        const rx = scanner.number();
        const ry = scanner.number();
        const rotation = scanner.number();
        const largeArc = scanner.flag();
        const sweep = scanner.flag();
        const endX = originX + scanner.number();
        const endY = originY + scanner.number();
        segments.push(...arcToCubics(currentX, currentY, rx, ry, rotation, largeArc, sweep, endX, endY));
        currentX = endX;
        currentY = endY;
        lastCubicControl = lastQuadControl = null;
        break;
      }
      case 'Z': {
        segments.push({ kind: 'close' });
        currentX = startX;
        currentY = startY;
        lastCubicControl = lastQuadControl = null;
        break;
      }
      default:
        throw new SvgParseError(`unknown path command "${command}"`, scanner.position, d);
    }
  }

  return segments;
}

/**
 * Raise a quadratic to a cubic. Exact, not an approximation: every quadratic
 * is a cubic whose control points sit two thirds of the way along.
 * Verified against FOP's output for `09-path-quadratic.svg`.
 */
function quadToCubic(
  x0: number,
  y0: number,
  qx: number,
  qy: number,
  x1: number,
  y1: number
): PathSegment {
  return {
    kind: 'cubic',
    c1x: x0 + (2 / 3) * (qx - x0),
    c1y: y0 + (2 / 3) * (qy - y0),
    c2x: x1 + (2 / 3) * (qx - x1),
    c2y: y1 + (2 / 3) * (qy - y1),
    x: x1,
    y: y1,
  };
}
