import { ElementBase } from '../ElementBase';
import { SharedBoxOptions } from '../SharedOptions';
import { IBackgroundColor } from './IBackgroundColor';
import { Border, BorderColors, Color } from '../../Core';
import { RenderContext } from '../IElement';
import { toBorder, type BorderInput } from '../../Normalize/toBorder';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/**
 * Base class for elements with borders and background colors.
 * Provides common functionality for drawing borders and backgrounds.
 */
export abstract class BorderedElementBase extends ElementBase implements IBackgroundColor {
  // Border, border colours, background and corner radius, shared with every element that has the same values.
  private _box: SharedBoxOptions = SharedBoxOptions.default;
  private get _border(): Border {
    return this._box.border;
  }
  private set _border(value: Border) {
    this._box = this._box.with('border', value);
  }
  private get _backgroundColor(): Color | undefined {
    return this._box.backgroundColor;
  }
  private set _backgroundColor(value: Color | undefined) {
    this._box = this._box.with('backgroundColor', value);
  }

  /**
   * Border widths for each side of the element.
   *
   * Reads as the canonical {@link Border}; accepts a uniform width or a
   * per-side object on write. Colour is set
   * through {@link borderColors} - this setter never writes it.
   */
  public get border(): Border {
    return this._border;
  }
  public set border(value: BorderInput) {
    this._border = toBorder(value).border;
  }

  /**
   * Border colors for each side of the element
   */
  public get borderColors(): BorderColors {
    return this._box.borderColors;
  }
  public set borderColors(value: BorderColors) {
    this._box = this._box.with('borderColors', value);
  }

  /**
   * Background color for this element (undefined = transparent).
   *
   * Accepts a palette token (`'slate-100'`) or hex (`'#ff00aa'`) on write.
   */
  public get backgroundColor(): Color | undefined {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput | undefined) {
    this._backgroundColor = value === undefined ? undefined : toColor(value);
  }
  private get _cornerRadius(): number {
    return this._box.cornerRadius;
  }
  private set _cornerRadius(value: number) {
    this._box = this._box.with('cornerRadius', value);
  }

  /**
   * Corner radius for rounded rectangles. 0 = sharp corners (default).
   *
   * Accepts a length: `6`, `'2mm'`, or `{ value, unit }`.
   */
  public get cornerRadius(): number {
    return this._cornerRadius;
  }
  public set cornerRadius(value: LengthInput) {
    this._cornerRadius = toLength(value);
  }

  constructor() {
    super();
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
    // Decorative fill - tag as an artifact so tagged (PDF/UA) output does not
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

    // Decorative strokes - tag as an artifact (no-op for non-tagged output).
    ctx.canvas.beginArtifact();
    try {
      this.drawBorderStrokes(ctx, x, y, width, height);
    } finally {
      ctx.canvas.endArtifact();
    }
  }

  private drawBorderStrokes(ctx: RenderContext, x: number, y: number, width: number, height: number): void {
    if (this.cornerRadius > 0) {
      // Rounded rectangle - use the first available colour and the max side width
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

    // Flat rectangle - draw each active side independently so per-side
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
   * Are any borders applied
   */
  protected hasAnyBorder(): boolean {
    return this.border.top > 0 || this.border.bottom > 0 || this.border.left > 0 || this.border.right > 0;
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
