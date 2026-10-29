import { ICanvas } from '../../src/Drawing/ICanvas';
import { Color } from '../../src/Core/Color';
import { Size } from '../../src/Core/Size';
import { Point } from '../../src/Core/Point';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import type { Paint } from '../../src/Drawing/Paint';
import type { FillRule, StrokeStyle } from '../../src/Drawing/StrokeStyle';

export class MockCanvas implements ICanvas {
  public readonly operations: string[] = [];

  get width(): number {
    return 800;
  }
  get height(): number {
    return 450;
  }

  saveState(): void {
    this.operations.push('SaveState()');
  }
  restoreState(): void {
    this.operations.push('RestoreState()');
  }

  drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void {
    this.operations.push(`DrawText(${x},${y},'${text}',${fontSize},${fontFamily},${align})`);
  }

  drawTextRotated(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    angleDegrees: number
  ): void {
    this.operations.push(`DrawTextRotated(${x},${y},'${text}',${fontSize},${fontFamily},${angleDegrees})`);
  }

  drawTextJustified(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    availableWidth: number
  ): void {
    this.operations.push(`DrawTextJustified(${x},${y},'${text}',${fontSize},${fontFamily},${availableWidth})`);
  }

  measureText(text: string, fontSize: number, _fontFamily: string): Size {
    return new Size(text.length * fontSize * 0.6, fontSize);
  }

  setTextSpacing(letterSpacing: number, wordSpacing: number): void {
    this.operations.push(`SetTextSpacing(${letterSpacing},${wordSpacing})`);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void {
    this.operations.push(`DrawLine(${x1},${y1},${x2},${y2},${lineWidth})`);
  }

  fillRect(x: number, y: number, width: number, height: number, _color: Color): void {
    this.operations.push(`FillRect(${x},${y},${width},${height})`);
  }

  strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void {
    this.operations.push(`StrokeRect(${x},${y},${width},${height},${strokeWidth})`);
  }

  fillCircle(cx: number, cy: number, radius: number, _color: Color): void {
    this.operations.push(`FillCircle(${cx},${cy},${radius})`);
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, _color: Color): void {
    this.operations.push(`FillEllipse(${cx},${cy},${rx},${ry})`);
  }

  fillPath(points: Point[], _color: Color): void {
    this.operations.push(`FillPath(${points.length} points)`);
  }

  drawImage(image: any, x: number, y: number, width: number, height: number): void {
    this.operations.push(`DrawImage(${x},${y},${width},${height})`);
  }

  drawFormXObject(resourceName: string, x: number, y: number): void {
    this.operations.push(`DrawFormXObject(${resourceName},${x},${y})`);
  }

  fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, _color: Color): void {
    this.operations.push(`FillRoundedRect(${x},${y},${width},${height},${radius})`);
  }

  strokeRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: Color,
    strokeWidth: number
  ): void {
    this.operations.push(`StrokeRoundedRect(${x},${y},${width},${height},${radius},${strokeWidth})`);
  }

  beginMarkedContent(role: string): void {
    this.operations.push(`BeginMarkedContent(${role})`);
  }

  beginContainerContent(role: string): void {
    this.operations.push(`BeginContainerContent(${role})`);
  }

  endMarkedContent(): void {
    this.operations.push('EndMarkedContent()');
  }

  beginArtifact(): void {
    this.operations.push('BeginArtifact()');
  }

  endArtifact(): void {
    this.operations.push('EndArtifact()');
  }

  beginRoundedClip(x: number, y: number, width: number, height: number, radius: number): void {
    this.operations.push(`BeginRoundedClip(${x},${y},${width},${height},${radius})`);
  }

  endClip(): void {
    this.operations.push('EndClip()');
  }

  beginCrispEdges(): void {
    this.operations.push('BeginCrispEdges()');
  }

  endCrispEdges(): void {
    this.operations.push('EndCrispEdges()');
  }

  // ── Path construction and transforms ──────────────────────────────────────
  //
  // Recorded in the same shape as everything else rather than left off the
  // double. These were previously absent, so `MockCanvas` did not actually
  // satisfy `ICanvas` and any element that built a path would have thrown a
  // TypeError mid-test instead of recording an operation. Nothing exercised
  // them, because the tests were never typechecked.

  beginPath(): void {
    this.operations.push('BeginPath()');
  }

  moveTo(x: number, y: number): void {
    this.operations.push(`MoveTo(${x},${y})`);
  }

  lineTo(x: number, y: number): void {
    this.operations.push(`LineTo(${x},${y})`);
  }

  quadraticBezierTo(cx: number, cy: number, x: number, y: number): void {
    this.operations.push(`QuadraticBezierTo(${cx},${cy},${x},${y})`);
  }

  cubicBezierTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void {
    this.operations.push(`CubicBezierTo(${c1x},${c1y},${c2x},${c2y},${x},${y})`);
  }

  closePath(): void {
    this.operations.push('ClosePath()');
  }

  addRect(x: number, y: number, width: number, height: number): void {
    this.operations.push(`AddRect(${x},${y},${width},${height})`);
  }

  addCircle(cx: number, cy: number, radius: number): void {
    this.operations.push(`AddCircle(${cx},${cy},${radius})`);
  }

  addEllipse(cx: number, cy: number, rx: number, ry: number): void {
    this.operations.push(`AddEllipse(${cx},${cy},${rx},${ry})`);
  }

  fillCurrentPath(_paint: Paint | Color, rule?: FillRule): void {
    this.operations.push(`FillCurrentPath(${rule ?? 'nonzero'})`);
  }

  strokeCurrentPath(style: StrokeStyle): void {
    this.operations.push(`StrokeCurrentPath(${style.width})`);
  }

  clipToCurrentPath(rule?: FillRule): void {
    this.operations.push(`ClipToCurrentPath(${rule ?? 'nonzero'})`);
  }

  translate(tx: number, ty: number): void {
    this.operations.push(`Translate(${tx},${ty})`);
  }

  scale(sx: number, sy: number): void {
    this.operations.push(`Scale(${sx},${sy})`);
  }

  rotate(angleDegrees: number): void {
    this.operations.push(`Rotate(${angleDegrees})`);
  }

  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.operations.push(`Transform(${a},${b},${c},${d},${e},${f})`);
  }

  setGlobalAlpha(alpha: number): void {
    this.operations.push(`SetGlobalAlpha(${alpha})`);
  }
}
