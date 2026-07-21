import { ICanvas } from '../../src/Drawing/ICanvas';
import { Color } from '../../src/Core/Color';
import { Size } from '../../src/Core/Size';
import { Point } from '../../src/Core/Point';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';

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
}
