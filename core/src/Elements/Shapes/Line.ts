import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';

/**
 * Represents a simple line element that can be horizontal or vertical.
 * Useful for visual dividers and structural lines.
 */
export class Line extends ElementBase {
  /** Thickness of the line in points. Default is 1. */
  public thickness = 1;

  /** Color of the line. Default is Black. */
  public color: Color = Color.black;

  /** Orientation of the line. Default is Horizontal. */
  public orientation: LineOrientation = LineOrientation.Horizontal;

  /**
   * Length of the line.
   * For Horizontal lines, if null (default), it takes the full available width.
   * For Vertical lines, this determines the height. If null, defaults to 100.
   */
  public length?: number;

  protected override measureContentHeight(contentWidth: number): number {
    if (this.orientation === LineOrientation.Horizontal) {
      return this.thickness;
    } else {
      // For vertical lines, we need a height
      return this.length ?? 100;
    }
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const x = ctx.currentX;
    const y = ctx.currentY;

    if (this.orientation === LineOrientation.Horizontal) {
      // Draw horizontal line
      const width = this.length ?? contentWidth;

      ctx.canvas.fillRect(x, y, width, this.thickness, this.color);

      // Advance Y
      ctx.currentY += this.thickness;
    } else {
      // Draw vertical line
      const height = this.length ?? 100;

      ctx.canvas.fillRect(x, y, this.thickness, height, this.color);

      // Advance Y
      ctx.currentY += height;
    }
  }
}

/**
 * Specifies the orientation of a Line element.
 */
export enum LineOrientation {
  Horizontal,
  Vertical
}
