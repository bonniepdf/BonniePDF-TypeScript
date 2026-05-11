import { PdfOperators } from './PdfOperators';
import { PdfSyntax } from './PdfSyntax';
import { Color } from '../../Core/Color';
import { Point } from '../../Core/Point';
import { Border } from '../../Core/Border';
import { BorderColors } from '../../Core/BorderColors';

export class PdfDrawing {
  public static fillRect(stream: string[], x: number, y: number, width: number, height: number, color: Color): void {
    PdfOperators.saveState(stream);
    PdfOperators.setFillColor(stream, color);
    PdfOperators.rectangleFill(stream, x, y, width, height);
    PdfOperators.restoreState(stream);
  }

  public static strokeRect(stream: string[], x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void {
    if (strokeWidth <= 0) return;

    const halfStroke = strokeWidth / 2;
    const insetX = x + halfStroke;
    const insetY = y + halfStroke;
    const insetWidth = width - strokeWidth;
    const insetHeight = height - strokeWidth;

    PdfOperators.saveState(stream);
    PdfOperators.setStrokeColor(stream, color);
    PdfOperators.setLineWidth(stream, strokeWidth);
    PdfOperators.setLineJoin(stream, 0); // miter
    PdfOperators.setMiterLimit(stream, 10);
    PdfOperators.rectangleStroke(stream, insetX, insetY, insetWidth, insetHeight);
    PdfOperators.restoreState(stream);
  }

  public static drawBox(stream: string[], x: number, y: number, width: number, height: number,
    backgroundColor?: Color, borderColor?: Color, borderWidth = 0): void {
    if (!backgroundColor && (!borderColor || borderWidth <= 0)) return;

    if (backgroundColor) {
      this.fillRect(stream, x, y, width, height, backgroundColor);
    }

    if (borderColor && borderWidth > 0) {
      this.strokeRect(stream, x, y, width, height, borderColor, borderWidth);
    }
  }

  public static fillCircle(stream: string[], centerX: number, centerY: number, radius: number, color: Color): void {
    const k = 0.552284749831; // Magic number for circle approximation
    const kr = k * radius;

    PdfOperators.saveState(stream);
    PdfOperators.setFillColor(stream, color);

    PdfOperators.moveTo(stream, centerX + radius, centerY);
    PdfOperators.curveTo(stream, centerX + radius, centerY + kr, centerX + kr, centerY + radius, centerX, centerY + radius);
    PdfOperators.curveTo(stream, centerX - kr, centerY + radius, centerX - radius, centerY + kr, centerX - radius, centerY);
    PdfOperators.curveTo(stream, centerX - radius, centerY - kr, centerX - kr, centerY - radius, centerX, centerY - radius);
    PdfOperators.curveTo(stream, centerX + kr, centerY - radius, centerX + radius, centerY - kr, centerX + radius, centerY);

    PdfOperators.fill(stream);
    PdfOperators.restoreState(stream);
  }

  public static fillRoundedRect(stream: string[], x: number, y: number, width: number, height: number, radius: number, color: Color): void {
    if (radius <= 0) {
      this.fillRect(stream, x, y, width, height, color);
      return;
    }

    const maxRadius = Math.min(width, height) / 2;
    if (radius > maxRadius) radius = maxRadius;

    PdfOperators.saveState(stream);
    PdfOperators.setFillColor(stream, color);
    this.appendRoundedRectPath(stream, x, y, width, height, radius);
    PdfOperators.fill(stream);
    PdfOperators.restoreState(stream);
  }

  public static strokeRoundedRect(stream: string[], x: number, y: number, width: number, height: number, radius: number, color: Color, strokeWidth: number): void {
    if (strokeWidth <= 0) return;

    if (radius <= 0) {
      this.strokeRect(stream, x, y, width, height, color, strokeWidth);
      return;
    }

    const halfStroke = strokeWidth / 2;
    const insetX = x + halfStroke;
    const insetY = y + halfStroke;
    const insetWidth = width - strokeWidth;
    const insetHeight = height - strokeWidth;
    let insetRadius = Math.max(0, radius - halfStroke);

    const maxRadius = Math.min(insetWidth, insetHeight) / 2;
    if (insetRadius > maxRadius) insetRadius = maxRadius;

    PdfOperators.saveState(stream);
    PdfOperators.setStrokeColor(stream, color);
    PdfOperators.setLineWidth(stream, strokeWidth);
    PdfOperators.setLineJoin(stream, 1); // round join
    this.appendRoundedRectPath(stream, insetX, insetY, insetWidth, insetHeight, insetRadius);
    PdfOperators.closePathStroke(stream);
    PdfOperators.restoreState(stream);
  }

  public static fillPath(stream: string[], points: Point[], color: Color): void {
    if (!points || points.length < 3) return;

    PdfOperators.saveState(stream);
    PdfOperators.setFillColor(stream, color);

    PdfOperators.moveTo(stream, points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      PdfOperators.lineTo(stream, points[i].x, points[i].y);
    }

    PdfOperators.closePath(stream);
    PdfOperators.fill(stream);
    PdfOperators.restoreState(stream);
  }

  private static appendRoundedRectPath(stream: string[], x: number, y: number, width: number, height: number, radius: number): void {
    const k = 0.552284749831;
    const kr = k * radius;
    const r = radius;

    PdfOperators.moveTo(stream, x + r, y);
    PdfOperators.lineTo(stream, x + width - r, y);
    PdfOperators.curveTo(stream, x + width - r + kr, y, x + width, y + r - kr, x + width, y + r);
    PdfOperators.lineTo(stream, x + width, y + height - r);
    PdfOperators.curveTo(stream, x + width, y + height - r + kr, x + width - r + kr, y + height, x + width - r, y + height);
    PdfOperators.lineTo(stream, x + r, y + height);
    PdfOperators.curveTo(stream, x + r - kr, y + height, x, y + height - r + kr, x, y + height - r);
    PdfOperators.lineTo(stream, x, y + r);
    PdfOperators.curveTo(stream, x, y + r - kr, x - r + kr, y, x + r, y);
    PdfOperators.closePath(stream);
  }
}
