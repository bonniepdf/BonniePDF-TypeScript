import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { Color } from '../../Core/Color';

export class Ellipse extends ElementBase {
  public width = 16;
  public height = 8;
  public fillColor: Color = Color.black;

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
