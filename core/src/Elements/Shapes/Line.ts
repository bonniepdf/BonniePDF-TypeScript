import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';
import { toLength, type LengthInput, toOptionalLength } from '../../Normalize/toLength';

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
  Partial<Omit<Pick<Line, (typeof LINE_OWN_OPTION_KEYS)[number]>, 'color' | 'thickness' | 'length'>> & {
    /** Line thickness. Accepts a length: `1`, `'0.5pt'`, or `{ value, unit }`. */
    thickness?: LengthInput;
    /** Line length. Accepts a length: `120`, `'5cm'`, or `{ value, unit }`. */
    length?: LengthInput;
    /** Stroke colour. Accepts a palette token or hex. */
    color?: ColorInput;
  };

/** Renders a straight line with configurable color, width, and dash pattern. */
export class Line extends ElementBase {
  /** Thickness of the line in points. Default is 1. */
  /** Creates a line (divider), optionally configured in one expression. */
  constructor(options?: LineOptions) {
    super();
    applyOptions(this, options);
  }

  private _thickness: number = 1;

  /** thickness. Accepts a length: a number of points, `'0.5pt'`, or `{ value, unit }`. */
  public get thickness(): number {
    return this._thickness;
  }
  public set thickness(value: LengthInput) {
    this._thickness = toLength(value);
  }

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

  private _length?: number;

  /**
   * Length of the line.
   * For Horizontal lines, if null (default), it takes the full available width.
   * For Vertical lines, this determines the height. If null, defaults to 100.
   *
   * Accepts a length: a number of points, `'5cm'`, or `{ value, unit }`.
   */
  public get length(): number | undefined {
    return this._length;
  }
  public set length(value: LengthInput | undefined) {
    this._length = toOptionalLength(value);
  }

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
