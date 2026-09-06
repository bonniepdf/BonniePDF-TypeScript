import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';

/**
 * A filled circle element, useful for status indicators, bullets, etc.
 */
/** Settable properties declared by {@link Circle} itself. */
export const CIRCLE_OWN_OPTION_KEYS = ['diameter', 'fillColor'] as const;

/** The full settable surface, base included. */
export const CIRCLE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...CIRCLE_OWN_OPTION_KEYS] as const;

/** Options for {@link Circle}. */
export type CircleOptions = ElementOptions &
  Partial<Omit<Pick<Circle, (typeof CIRCLE_OWN_OPTION_KEYS)[number]>, 'fillColor'>> & {
    /** Fill colour. Accepts a palette token or hex. */
    fillColor?: ColorInput;
  };

/** Renders a circle with optional fill and stroke. */
export class Circle extends ElementBase {
  /** Diameter of the circle in points */
  /** Creates a circle, optionally configured in one expression. */
  constructor(options?: CircleOptions) {
    super();
    applyOptions(this, options);
  }

  public diameter = 8;

  /** Fill color of the circle */
  private _fillColor: Color = Color.black;

  /** Fill colour. Accepts a palette token or hex. */
  public get fillColor(): Color {
    return this._fillColor;
  }
  public set fillColor(value: ColorInput) {
    this._fillColor = toColor(value);
  }

  protected override measureContentHeight(_contentWidth: number): number {
    return this.diameter;
  }

  protected override renderContent(ctx: RenderContext, _contentWidth: number): void {
    const radius = this.diameter / 2;

    // Calculate center position
    const centerX = ctx.currentX + radius;
    const centerY = ctx.currentY + radius;

    ctx.canvas.fillCircle(centerX, centerY, radius, this.fillColor);

    // Advance Y position by the diameter
    ctx.currentY += this.diameter;
  }
}
