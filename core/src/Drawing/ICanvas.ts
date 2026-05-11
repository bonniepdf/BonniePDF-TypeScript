import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { Size } from '../Core/Size';
import { TextAlignment } from '../Elements/Text/TextAlignment';

export interface ICanvas {
  readonly width: number;
  readonly height: number;

  saveState(): void;
  restoreState(): void;

  fillRect(x: number, y: number, width: number, height: number, color: Color): void;
  strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void;
  fillCircle(cx: number, cy: number, radius: number, color: Color): void;
  fillPath(points: Point[], color: Color): void;
  fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void;
  strokeRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color, strokeWidth: number): void;

  drawText(x: number, y: number, text: string, color: Color, fontSize: number, fontFamily: string, align: TextAlignment): void;
  drawTextRotated(x: number, y: number, text: string, color: Color, fontSize: number, fontFamily: string, angleDegrees: number): void;
  drawTextJustified(x: number, y: number, text: string, color: Color, fontSize: number, fontFamily: string, availableWidth: number): void;
  measureText(text: string, fontSize: number, fontFamily: string): Size;

  drawImage(image: any, x: number, y: number, width: number, height: number): void;
  drawFormXObject(resourceName: string, x: number, y: number): void;
}
