import type { ICanvas } from './ICanvas';

const K = 0.5522847498;

/**
 * Adds common geometric shapes to the current canvas path.
 *
 * Each method appends sub-path commands (moveTo, lineTo, cubicBezierTo,
 * closePath) to the given canvas's current path. The caller is responsible for
 * calling beginPath() beforehand and fillCurrentPath()/strokeCurrentPath()
 * afterwards.
 */
export class Shapes {
  /** Appends a circle centred on `(cx, cy)` to the canvas path. */
  static circle(canvas: ICanvas, cx: number, cy: number, radius: number): void {
    const kr = K * radius;
    canvas.moveTo(cx + radius, cy);
    canvas.cubicBezierTo(cx + radius, cy + kr, cx + kr, cy + radius, cx, cy + radius);
    canvas.cubicBezierTo(cx - kr, cy + radius, cx - radius, cy + kr, cx - radius, cy);
    canvas.cubicBezierTo(cx - radius, cy - kr, cx - kr, cy - radius, cx, cy - radius);
    canvas.cubicBezierTo(cx + kr, cy - radius, cx + radius, cy - kr, cx + radius, cy);
    canvas.closePath();
  }

  /** Appends a diamond (a square turned 45°) centred on `(cx, cy)` whose points are `size` apart. */
  static diamond(canvas: ICanvas, cx: number, cy: number, size: number): void {
    const half = size / 2;
    canvas.moveTo(cx, cy - half);
    canvas.lineTo(cx + half, cy);
    canvas.lineTo(cx, cy + half);
    canvas.lineTo(cx - half, cy);
    canvas.closePath();
  }

  /**
   * Appends a regular polygon with the given number of sides (at least 3), inscribed in a circle of `radius` about `(cx, cy)`, with one vertex pointing up.
   */
  static regularPolygon(canvas: ICanvas, cx: number, cy: number, radius: number, sides: number): void {
    if (sides < 3) sides = 3;
    const angleStep = (2 * Math.PI) / sides;
    const startAngle = -Math.PI / 2;
    for (let i = 0; i <= sides; i++) {
      const angle = startAngle + i * angleStep;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);
      if (i === 0) canvas.moveTo(px, py);
      else canvas.lineTo(px, py);
    }
    canvas.closePath();
  }

  /**
   * Appends a star with the given number of points (at least 3), alternating between the outer and inner radius, centred on `(cx, cy)`.
   */
  static star(canvas: ICanvas, cx: number, cy: number, outerRadius: number, innerRadius: number, points: number): void {
    if (points < 3) points = 3;
    const totalVertices = points * 2;
    const angleStep = Math.PI / points;
    const startAngle = -Math.PI / 2;
    for (let i = 0; i <= totalVertices; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = startAngle + i * angleStep;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      if (i === 0) canvas.moveTo(px, py);
      else canvas.lineTo(px, py);
    }
    canvas.closePath();
  }

  /** Appends a rectangle with rounded corners to the canvas path. The radius is limited to half the shorter side. */
  static roundedRect(canvas: ICanvas, x: number, y: number, width: number, height: number, cornerRadius: number): void {
    const r = Math.min(cornerRadius, width / 2, height / 2);
    const k = r * K;
    canvas.moveTo(x + r, y);
    canvas.lineTo(x + width - r, y);
    canvas.cubicBezierTo(x + width - r + k, y, x + width, y + r - k, x + width, y + r);
    canvas.lineTo(x + width, y + height - r);
    canvas.cubicBezierTo(x + width, y + height - r + k, x + width - r + k, y + height, x + width - r, y + height);
    canvas.lineTo(x + r, y + height);
    canvas.cubicBezierTo(x + r - k, y + height, x, y + height - r + k, x, y + height - r);
    canvas.lineTo(x, y + r);
    canvas.cubicBezierTo(x, y + r - k, x + r - k, y, x + r, y);
    canvas.closePath();
  }
}
