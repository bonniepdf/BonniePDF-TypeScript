import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import type { ImageInfo } from '../Rendering/Images/ImageInfo';
import { ImageLoader } from '../Rendering/Images/ImageLoader';
import type { SinkColor, SinkPoint } from '../Rendering/Svg/Sink/Geometry';
import type { SinkImage } from '../Rendering/Svg/Sink/Image';
import type { Paint as SinkPaint, PaintTransform as SinkPaintTransform } from '../Rendering/Svg/Sink/Paint';
import type { FillRule, StrokeStyle as SinkStrokeStyle } from '../Rendering/Svg/Sink/StrokeStyle';
import type { VectorSink } from '../Rendering/Svg/Sink/VectorSink';
import type { ICanvas } from './ICanvas';
import { LinearGradientPaint, RadialGradientPaint, SolidPaint, type GradientStop, type Paint } from './Paint';
import type { PaintTransform } from './PaintTransform';
import type { StrokeStyle } from './StrokeStyle';

/**
 * SVG's initial `stroke-miterlimit`. The importer passes a miter limit only
 * when the document sets one; an SVG stroke without one still has SVG's
 * default, not PDF's (10).
 */
const SVG_DEFAULT_MITER_LIMIT = 4;

/**
 * Draws what the SVG importer emits onto an {@link ICanvas}.
 *
 * The importer's sink mirrors `ICanvas` member for member, so this forwards
 * 1:1 and converts only the value types. Every number is narrowed to single
 * precision first: the .NET canvas takes `float`, and narrowing here gives both
 * implementations the same values to write, which is what keeps imported SVG
 * byte-identical across them.
 */
export class BonniePdfCanvasSink implements VectorSink {
  /**
   * @param canvas The surface to draw on.
   * @param decodeImage Decodes a rasterized fallback image. The async import
   *   path decodes ahead of time and passes a lookup; the synchronous loader
   *   cannot inflate compressed PNGs.
   */
  constructor(
    private readonly canvas: ICanvas,
    private readonly decodeImage: (png: Uint8Array) => ImageInfo = png => ImageLoader.loadFromBytes(png)
  ) {}

  saveState(): void {
    this.canvas.saveState();
  }

  restoreState(): void {
    this.canvas.restoreState();
  }

  beginPath(): void {
    this.canvas.beginPath();
  }

  moveTo(x: number, y: number): void {
    this.canvas.moveTo(f(x), f(y));
  }

  lineTo(x: number, y: number): void {
    this.canvas.lineTo(f(x), f(y));
  }

  cubicBezierTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
    this.canvas.cubicBezierTo(f(c1x), f(c1y), f(c2x), f(c2y), f(x), f(y));
  }

  quadraticBezierTo(cx: number, cy: number, x: number, y: number): void {
    this.canvas.quadraticBezierTo(f(cx), f(cy), f(x), f(y));
  }

  addRect(x: number, y: number, width: number, height: number): void {
    this.canvas.addRect(f(x), f(y), f(width), f(height));
  }

  addEllipse(cx: number, cy: number, rx: number, ry: number): void {
    this.canvas.addEllipse(f(cx), f(cy), f(rx), f(ry));
  }

  addCircle(cx: number, cy: number, radius: number): void {
    this.canvas.addCircle(f(cx), f(cy), f(radius));
  }

  closePath(): void {
    this.canvas.closePath();
  }

  fillCurrentPath(paint: SinkPaint, rule?: FillRule): void {
    this.canvas.fillCurrentPath(toPaint(paint), rule);
  }

  strokeCurrentPath(style: SinkStrokeStyle): void {
    const converted: StrokeStyle = {
      paint: toPaint(style.paint),
      width: f(style.width),
      miterLimit: f(style.miterLimit ?? SVG_DEFAULT_MITER_LIMIT),
      ...(style.dashPattern !== undefined ? { dashPattern: style.dashPattern.map(f) } : {}),
      ...(style.dashOffset !== undefined ? { dashOffset: f(style.dashOffset) } : {}),
      ...(style.lineCap !== undefined ? { lineCap: style.lineCap } : {}),
      ...(style.lineJoin !== undefined ? { lineJoin: style.lineJoin } : {}),
    };
    this.canvas.strokeCurrentPath(converted);
  }

  translate(tx: number, ty: number): void {
    this.canvas.translate(f(tx), f(ty));
  }

  scale(sx: number, sy: number): void {
    this.canvas.scale(f(sx), f(sy));
  }

  rotate(angleDegrees: number): void {
    this.canvas.rotate(f(angleDegrees));
  }

  transform(a: number, b: number, c: number, d: number, e: number, g: number): void {
    this.canvas.transform(f(a), f(b), f(c), f(d), f(e), f(g));
  }

  clipToCurrentPath(rule?: FillRule): void {
    this.canvas.clipToCurrentPath(rule);
  }

  setGlobalAlpha(alpha: number): void {
    this.canvas.setGlobalAlpha(f(alpha));
  }

  drawImage(image: SinkImage, x: number, y: number, width: number, height: number): void {
    this.canvas.drawImage(this.decodeImage(image.png), f(x), f(y), f(width), f(height));
  }
}

const f = Math.fround;

function toColor(color: SinkColor): Color {
  return Color.fromScRgb(f(color.r), f(color.g), f(color.b), f(color.a));
}

function toPoint(point: SinkPoint): Point {
  return new Point(f(point.x), f(point.y));
}

function toTransform(transform: SinkPaintTransform | undefined): PaintTransform | undefined {
  if (transform === undefined) return undefined;
  return {
    a: f(transform.a),
    b: f(transform.b),
    c: f(transform.c),
    d: f(transform.d),
    e: f(transform.e),
    f: f(transform.f),
  };
}

function toStops(stops: readonly { offset: number; color: SinkColor }[]): GradientStop[] {
  return stops.map(stop => ({ offset: f(stop.offset), color: toColor(stop.color) }));
}

function toPaint(paint: SinkPaint): Paint {
  switch (paint.kind) {
    case 'solid':
      return new SolidPaint(toColor(paint.color));
    case 'linear':
      return new LinearGradientPaint(
        toPoint(paint.start),
        toPoint(paint.end),
        toStops(paint.stops),
        toTransform(paint.transform)
      );
    case 'radial':
      return new RadialGradientPaint(
        toPoint(paint.center),
        f(paint.radius),
        toStops(paint.stops),
        paint.focal !== undefined ? toPoint(paint.focal) : undefined,
        toTransform(paint.transform)
      );
  }
}
