// Generated chart source. Do not edit here; the source manifest records its provenance.
import { type ICanvas, type Color, TextAlignment } from '../ChartHost';
export interface ChartLabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function drawPlacedLabel(
  sink: ICanvas,
  boxes: ChartLabelBox[],
  width: number,
  height: number,
  x: number,
  y: number,
  text: string,
  color: Color,
  size: number,
  family: string,
  align: TextAlignment
): void {
  if (!text) return;
  const measured = sink.measureText(text, size, family),
    w = measured.width,
    h = measured.height;
  if (w > width - 8 || h > height - 8) return;
  let left = x - (align === TextAlignment.Center ? w / 2 : align === TextAlignment.Right ? w : 0);
  left = Math.max(4, Math.min(width - 4 - w, left));
  y = Math.max(4, Math.min(height - 4 - h, y));
  if (boxes.some((b) => left < b.x + b.width + 2 && left + w + 2 > b.x && y < b.y + b.height + 2 && y + h + 2 > b.y))
    return;
  boxes.push({ x: left, y, width: w, height: h });
  sink.drawText(
    left + (align === TextAlignment.Center ? w / 2 : align === TextAlignment.Right ? w : 0),
    y,
    text,
    color,
    size,
    family,
    align
  );
}
