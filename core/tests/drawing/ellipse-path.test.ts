import { describe, expect, it } from 'vitest';
import { ellipseToBeziers, KAPPA } from '../../src/Drawing/EllipseGeometry';

// `addCircle`/`addEllipse` are path primitives, not immediate-mode fills: they
// exist so a circle can be stroked with a full StrokeStyle, filled with a
// gradient, or pushed as a clip - none of which `fillCircle` can do. Both
// canvases build them from `ellipseToBeziers`, so pinning that pins both.

describe('ellipseToBeziers', () => {
  it('starts at the rightmost point and closes back onto it', () => {
    const { startX, startY, segments } = ellipseToBeziers(100, 50, 20, 20);
    expect([startX, startY]).toEqual([120, 50]);
    expect(segments).toHaveLength(4);
    const last = segments[segments.length - 1];
    expect([last.x, last.y]).toEqual([startX, startY]);
  });

  it('walks the four quadrant end points in increasing-y order', () => {
    const { segments } = ellipseToBeziers(0, 0, 10, 10);
    expect(segments.map(s => [s.x, s.y])).toEqual([
      [0, 10],
      [-10, 0],
      [0, -10],
      [10, 0],
    ]);
  });

  it('offsets control points by kappa times the radius on each axis', () => {
    const { segments } = ellipseToBeziers(0, 0, 30, 12);
    expect(segments[0].c1x).toBeCloseTo(30, 10);
    expect(segments[0].c1y).toBeCloseTo(12 * KAPPA, 10);
    expect(segments[0].c2x).toBeCloseTo(30 * KAPPA, 10);
    expect(segments[0].c2y).toBeCloseTo(12, 10);
  });

  it('reproduces the hand-rolled bezier circle the examples used to carry', () => {
    // The six-line helper that was copied into four TypeScript and two C# files.
    const cx = 297.6;
    const cy = 303.1;
    const r = 96;
    const k = r * 0.5522847498;
    const expected = [
      [cx + r, cy + k, cx + k, cy + r, cx, cy + r],
      [cx - k, cy + r, cx - r, cy + k, cx - r, cy],
      [cx - r, cy - k, cx - k, cy - r, cx, cy - r],
      [cx + k, cy - r, cx + r, cy - k, cx + r, cy],
    ];
    const { startX, startY, segments } = ellipseToBeziers(cx, cy, r, r);
    expect([startX, startY]).toEqual([cx + r, cy]);
    segments.forEach((s, i) => {
      expect([s.c1x, s.c1y, s.c2x, s.c2y, s.x, s.y]).toEqual(expected[i]);
    });
  });

  it('approximates the true ellipse to well under a thousandth of the radius', () => {
    // Worst radial error of the cubic approximation sits at the segment midpoint.
    const r = 100;
    const { segments } = ellipseToBeziers(0, 0, r, r);
    const s = segments[0];
    const p0 = { x: r, y: 0 };
    const t = 0.5;
    const mt = 1 - t;
    const x = mt ** 3 * p0.x + 3 * mt ** 2 * t * s.c1x + 3 * mt * t ** 2 * s.c2x + t ** 3 * s.x;
    const y = mt ** 3 * p0.y + 3 * mt ** 2 * t * s.c1y + 3 * mt * t ** 2 * s.c2y + t ** 3 * s.y;
    expect(Math.abs(Math.hypot(x, y) - r)).toBeLessThan(r * 0.0003);
  });
});
