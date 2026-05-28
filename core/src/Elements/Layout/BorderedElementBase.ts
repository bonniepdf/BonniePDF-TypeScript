import { ElementBase } from '../ElementBase';
import { IBackgroundColor } from './IBackgroundColor';
import { Border, BorderColors, Color } from '../../Core';
import { RenderContext } from '../IElement';

/**
 * Base class for elements with borders and background colors.
 * Provides common functionality for drawing borders and backgrounds.
 */
export abstract class BorderedElementBase extends ElementBase implements IBackgroundColor {
  /**
   * Border widths for each side of the element
   */
  public border: Border;
  /**
   * Border colors for each side of the element
   */
  public borderColors: BorderColors;
  /**
   * Background color for this element (null = transparent)
   */
  public backgroundColor?: Color;
  /**
   * Corner radius for rounded rectangles. 0 = sharp corners (default).
   */
  public cornerRadius: number;

  constructor() {
    super();
    this.border = new Border(0);
    this.borderColors = new BorderColors();
    this.cornerRadius = 0;
  }

  /**
   * Draws a background rectangle with the specified color.
   * Uses rounded corners when cornerRadius > 0.
   */
  protected drawBackground(
    ctx: RenderContext,
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color
  ): void {
    // Decorative fill — tag as an artifact so tagged (PDF/UA) output does not
    // leave it as untagged content. No-op wrapper for non-tagged documents.
    ctx.canvas.beginArtifact();
    try {
      if (this.cornerRadius > 0) {
        ctx.canvas.fillRoundedRect(x, y, width, height, this.cornerRadius, color);
      } else {
        ctx.canvas.fillRect(x, y, width, height, color);
      }
    } finally {
      ctx.canvas.endArtifact();
    }
  }

  /**
   * Draws borders around a rectangle using the specified border widths and colors.
   * When cornerRadius > 0, draws a single rounded stroke instead of individual sides.
   * Otherwise each side is drawn independently, allowing for different widths and colors per side.
   */
  protected drawBorder(ctx: RenderContext, x: number, y: number, width: number, height: number): void {
    if (!this.border.hasAnyBorder) return;

    // Decorative strokes — tag as an artifact (no-op for non-tagged output).
    ctx.canvas.beginArtifact();
    try {
      this.drawBorderStrokes(ctx, x, y, width, height);
    } finally {
      ctx.canvas.endArtifact();
    }
  }

  private drawBorderStrokes(ctx: RenderContext, x: number, y: number, width: number, height: number): void {
    if (this.cornerRadius > 0) {
      // Rounded rectangle — use the first available colour and the max side width
      const strokeColor =
        this.borderColors.top ??
        this.borderColors.left ??
        this.borderColors.bottom ??
        this.borderColors.right ??
        Color.black;
      const strokeWidth = Math.max(this.border.top, this.border.left, this.border.bottom, this.border.right);
      if (strokeWidth > 0) {
        ctx.canvas.strokeRoundedRect(x, y, width, height, this.cornerRadius, strokeColor, strokeWidth);
      }
      return;
    }

    // Flat rectangle — draw each active side independently so per-side
    // colours and widths are respected (e.g. left-only accent borders).
    if (this.border.top > 0) {
      ctx.canvas.drawLine(x, y, x + width, y, this.borderColors.top ?? Color.black, this.border.top);
    }
    if (this.border.bottom > 0) {
      ctx.canvas.drawLine(
        x,
        y + height,
        x + width,
        y + height,
        this.borderColors.bottom ?? Color.black,
        this.border.bottom
      );
    }
    if (this.border.left > 0) {
      ctx.canvas.drawLine(x, y, x, y + height, this.borderColors.left ?? Color.black, this.border.left);
    }
    if (this.border.right > 0) {
      ctx.canvas.drawLine(
        x + width,
        y,
        x + width,
        y + height,
        this.borderColors.right ?? Color.black,
        this.border.right
      );
    }
  }

  /**
   * Calculates the total width occupied by horizontal borders (left + right).
   */
  protected getHorizontalBorderWidth(): number {
    return this.border.left + this.border.right;
  }

  /**
   * Calculates the total height occupied by vertical borders (top + bottom).
   */
  protected getVerticalBorderWidth(): number {
    return this.border.top + this.border.bottom;
  }
}
