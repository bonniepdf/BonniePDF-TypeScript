import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';

/**
 * Represents a simple line element that can be horizontal or vertical.
 * Useful for visual dividers and structural lines.
 */
/** Settable properties declared by {@link Line} itself. */
export const LINE_OWN_OPTION_KEYS = ['thickness', 'color', 'orientation', 'length'] as const;

/** The full settable surface, base included. */
export const LINE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...LINE_OWN_OPTION_KEYS] as const;

/** Options for {@link Line}. */
export type LineOptions = ElementOptions &
  Partial<Omit<Pick<Line, (typeof LINE_OWN_OPTION_KEYS)[number]>, 'color'>> & {
    /** Stroke colour. Accepts a palette token or hex. */
    color?: ColorInput;
  };

export class Line extends ElementBase {
  /** Thickness of the line in points. Default is 1. */
  /** Creates a line (divider), optionally configured in one expression. */
  constructor(options?: LineOptions) {
    super();
    applyOptions(this, options);
  }

  public thickness = 1;

  /** Color of the line. Default is Black. */
  private _color: Color = Color.black;

  /** Stroke colour. Accepts a palette token or hex. */
  public get color(): Color {
    return this._color;
  }
  public set color(value: ColorInput) {
    this._color = toColor(value);
  }

  /** Orientation of the line. Default is Horizontal. */
  public orientation: LineOrientation = LineOrientation.Horizontal;

  /**
   * Length of the line.
   * For Horizontal lines, if null (default), it takes the full available width.
   * For Vertical lines, this determines the height. If null, defaults to 100.
   */
  public length?: number;

  protected override measureContentHeight(_contentWidth: number): number {
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
  Vertical,
}
