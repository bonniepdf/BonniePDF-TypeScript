import type { Color } from '../Core/Color';
import type { RenderContext } from '../Rendering/RenderContext';
import { colorToHex } from '../Rendering/LayoutRecorder';
import { TextAlignment } from '../Elements/Text/TextAlignment';

interface PaintRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  color?: Color;
}

/** Captures only paint geometry that can establish a single opaque text backdrop. */
export class CanvasContrast {
  private readonly paint: PaintRect[] = [];
  private uncertainState = false;
  private readonly originX: number;
  private readonly originY: number;

  constructor(
    private readonly ctx: RenderContext,
    private readonly width: number,
    private readonly height: number
  ) {
    this.originX = ctx.currentX;
    this.originY = ctx.currentY;
  }

  rect(x: number, y: number, width: number, height: number, color: Color): void {
    if (!this.uncertainState && width > 0 && height > 0) {
      this.paint.push({ left: x, top: y, right: x + width, bottom: y + height, color });
    }
  }

  unknownPaint(): void {
    this.paint.length = 0;
  }

  unknownState(): void {
    this.uncertainState = true;
  }

  text(
    x: number,
    y: number,
    width: number,
    size: number,
    color: Color,
    font: string,
    align: TextAlignment,
    complex = false
  ): void {
    const left = x - (align === TextAlignment.Center ? width / 2 : align === TextAlignment.Right ? width : 0);
    const right = left + width;
    const bottom = y + size * 1.2;
    let backdrop: string | undefined;
    if (!complex && !this.uncertainState && left >= 0 && right <= this.width && y >= 0 && bottom <= this.height) {
      for (let i = this.paint.length - 1; i >= 0; i--) {
        const p = this.paint[i];
        if (p.right <= left || p.left >= right || p.bottom <= y || p.top >= bottom) continue;
        if (p.color?.scA === 1 && p.left <= left && p.right >= right && p.top <= y && p.bottom >= bottom) {
          backdrop = colorToHex(p.color);
        }
        break;
      }
      this.paint.push({ left, top: y, right, bottom });
    } else {
      this.unknownPaint();
    }

    const recorder = this.ctx.layoutRecorder;
    if (!recorder) return;
    const node = {};
    const top = this.originY + y;
    recorder.openNode(node, 'CanvasText', undefined, this.ctx.currentPageIndex, this.originX + left, top, width);
    recorder.annotatePaint(node, {
      text: colorToHex(color),
      textAlpha: color.scA < 1 ? color.scA : undefined,
      textBackdrop: backdrop,
      fontSize: size,
      bold: /bold/i.test(font) || undefined,
    });
    recorder.closeNode(node, this.ctx.currentPageIndex, top + size * 1.2, true);
  }
}
