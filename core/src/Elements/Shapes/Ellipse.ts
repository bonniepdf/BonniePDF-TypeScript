import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/** Settable properties declared by {@link Ellipse} itself. */
export const ELLIPSE_OWN_OPTION_KEYS = ['width', 'height', 'fillColor'] as const;

/** The full settable surface, base included. */
export const ELLIPSE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...ELLIPSE_OWN_OPTION_KEYS] as const;

/** Options for {@link Ellipse}. */
export type EllipseOptions = ElementOptions &
  Partial<Omit<Pick<Ellipse, (typeof ELLIPSE_OWN_OPTION_KEYS)[number]>, 'fillColor' | 'width' | 'height'>> & {
    /** Width. Accepts a length: a number of points, `'1cm'`, or `{ value, unit }`. */
    width?: LengthInput;
    /** Height. Accepts a length: a number of points, `'2cm'`, or `{ value, unit }`. */
    height?: LengthInput;
    /** Fill colour. Accepts a palette token or hex. */
    fillColor?: ColorInput;
  };

/** Renders an ellipse with optional fill and stroke. */
export class Ellipse extends ElementBase {
  /** Creates an ellipse, optionally configured in one expression. */
  constructor(options?: EllipseOptions) {
    super();
    applyOptions(this, options);
  }

  private _width: number = 16;

  /** width. Accepts a length: a number of points, `'1cm'`, or `{ value, unit }` (§4A.3). */
  public get width(): number {
    return this._width;
  }
  public set width(value: LengthInput) {
    this._width = toLength(value);
  }
  private _height: number = 8;

  /** height. Accepts a length: a number of points, `'5mm'`, or `{ value, unit }` (§4A.3). */
  public get height(): number {
    return this._height;
  }
  public set height(value: LengthInput) {
    this._height = toLength(value);
  }
  private _fillColor: Color = Color.black;

  /** Fill colour. Accepts a palette token or hex. */
  public get fillColor(): Color {
    return this._fillColor;
  }
  public set fillColor(value: ColorInput) {
    this._fillColor = toColor(value);
  }

  protected override measureContentHeight(_contentWidth: number): number {
    return this.height;
  }

  protected override renderContent(ctx: RenderContext, _contentWidth: number): void {
    const rx = this.width / 2;
    const ry = this.height / 2;
    const centerX = ctx.currentX + rx;
    const centerY = ctx.currentY + ry;
    ctx.canvas.fillEllipse(centerX, centerY, rx, ry, this.fillColor);
    ctx.currentY += this.height;
  }
}
