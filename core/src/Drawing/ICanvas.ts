import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { Size } from '../Core/Size';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import type { Paint } from './Paint/Paint';
import type { FillRule, StrokeStyle } from './StrokeStyle';

export interface ICanvas {
  readonly width: number;
  readonly height: number;

  saveState(): void;
  restoreState(): void;

  fillRect(x: number, y: number, width: number, height: number, color: Color): void;
  strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void;
  fillCircle(cx: number, cy: number, radius: number, color: Color): void;
  fillEllipse(cx: number, cy: number, rx: number, ry: number, color: Color): void;
  fillPath(points: Point[], color: Color): void;
  fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void;
  strokeRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: Color,
    strokeWidth: number
  ): void;

  drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void;
  drawTextRotated(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    angleDegrees: number
  ): void;
  drawTextJustified(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    availableWidth: number
  ): void;
  measureText(text: string, fontSize: number, fontFamily: string): Size;

  drawImage(image: any, x: number, y: number, width: number, height: number): void;
  drawFormXObject(resourceName: string, x: number, y: number): void;

  // -- Path construction -------------------------------------------

  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  cubicBezierTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  quadraticBezierTo(cx: number, cy: number, x: number, y: number): void;
  addRect(x: number, y: number, width: number, height: number): void;
  closePath(): void;

  // -- Painting the current path -----------------------------------

  fillCurrentPath(paint: Paint | Color, rule?: FillRule): void;
  strokeCurrentPath(style: StrokeStyle): void;

  // -- Affine transforms -------------------------------------------

  translate(tx: number, ty: number): void;
  scale(sx: number, sy: number): void;
  rotate(angleDegrees: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;

  // -- Clipping + compositing --------------------------------------

  clipToCurrentPath(rule?: FillRule): void;
  setGlobalAlpha(alpha: number): void;

  // -- Marked content (PDF/UA tagging) ------------------------------------

  beginMarkedContent(role: string): void;
  beginContainerContent(role: string): void;
  endMarkedContent(): void;
  beginArtifact(): void;
  endArtifact(): void;

  // -- Crisp-edge region (SVG only) ---------------------------------------

  beginCrispEdges?(): void;
  endCrispEdges?(): void;

  // -- Clipping (legacy) --------------------------------------------------

  beginRoundedClip?(x: number, y: number, width: number, height: number, radius: number): void;
  endClip?(): void;
}
