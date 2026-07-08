import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';

/**
 * A filled circle element, useful for status indicators, bullets, etc.
 */
export class Circle extends ElementBase {
  /** Diameter of the circle in points */
  public diameter = 8;

  /** Fill color of the circle */
  public fillColor: Color = Color.black;

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
