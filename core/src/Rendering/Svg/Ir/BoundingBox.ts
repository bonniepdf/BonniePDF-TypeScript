// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { PathSegment } from '../Parsers/PathData';

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The tight bounding box of a path, in its own user space.
 *
 * `gradientUnits="objectBoundingBox"` - the default - places a gradient in
 * fractions of this box, so a loose box puts the gradient in the wrong place.
 * The control-point hull is the easy answer and is wrong: a curve is contained
 * by its hull but rarely touches it. This solves each cubic's derivative for its
 * extrema instead, which is what browsers do.
 *
 * Per the spec the box covers geometry only - stroke width, markers and clipping
 * do not extend it.
 */
export function boundsOf(segments: readonly PathSegment[]): Box | undefined {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let any = false;

  for (const segment of segments) {
    switch (segment.kind) {
      case 'move':
        currentX = startX = segment.x;
        currentY = startY = segment.y;
        include(currentX, currentY);
        any = true;
        break;
      case 'line':
        currentX = segment.x;
        currentY = segment.y;
        include(currentX, currentY);
        any = true;
        break;
      case 'cubic':
        include(segment.x, segment.y);
        includeCubicExtrema(currentX, segment.c1x, segment.c2x, segment.x, (t) =>
          include(cubicAt(currentX, segment.c1x, segment.c2x, segment.x, t), cubicAt(currentY, segment.c1y, segment.c2y, segment.y, t))
        );
        includeCubicExtrema(currentY, segment.c1y, segment.c2y, segment.y, (t) =>
          include(cubicAt(currentX, segment.c1x, segment.c2x, segment.x, t), cubicAt(currentY, segment.c1y, segment.c2y, segment.y, t))
        );
        currentX = segment.x;
        currentY = segment.y;
        any = true;
        break;
      case 'close':
        currentX = startX;
        currentY = startY;
        break;
    }
  }

  if (!any) return undefined;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function cubicAt(p0: number, c1: number, c2: number, p1: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p1;
}

/**
 * Feed each interior extremum of one coordinate of a cubic to `visit`.
 *
 * The derivative of a cubic is a quadratic; its roots in (0,1) are where that
 * coordinate turns. Degenerate cases (a linear or constant derivative) are
 * handled rather than divided through, since a straight segment expressed as a
 * cubic is common in real path data.
 */
function includeCubicExtrema(p0: number, c1: number, c2: number, p1: number, visit: (t: number) => void): void {
  const a = 3 * (-p0 + 3 * c1 - 3 * c2 + p1);
  const b = 6 * (p0 - 2 * c1 + c2);
  const c = 3 * (c1 - p0);

  const consider = (t: number): void => {
    if (t > 0 && t < 1) visit(t);
  };

  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) consider(-c / b);
    return;
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return;
  const root = Math.sqrt(discriminant);
  consider((-b + root) / (2 * a));
  consider((-b - root) / (2 * a));
}
