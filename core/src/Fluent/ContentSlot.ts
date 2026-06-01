import { ElementBase } from '../Elements/ElementBase';
import { IContentContainer } from './IContentContainer';
import { IElement, IStatefulElement, RenderStatus, RenderContext } from '../Elements/IElement';

export class ContentSlot extends ElementBase implements IContentContainer, IStatefulElement {
  public child?: IElement;

  protected measureContentHeight(contentWidth: number): number {
    return this.child?.measureHeight(contentWidth) ?? 0;
  }

  protected renderContent(_ctx: any, _contentWidth: number): void {
    // Implementation
  }

  protected getPreferredContentWidth(): number {
    return this.child?.getPreferredWidth() ?? 0;
  }

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (!this.child) {
      ctx.currentY += this.margin.top + this.margin.bottom;
      return RenderStatus.Complete;
    }

    const originalX = ctx.currentX;
    const contentWidth = this.getContentWidth(width);
    ctx.currentX += this.margin.left;
    ctx.currentY += this.margin.top;

    let status: RenderStatus;
    if ('renderStateful' in this.child) {
      try {
        status = (this.child as IStatefulElement).renderStateful(ctx, contentWidth);
      } finally {
        ctx.currentX = originalX;
      }
    } else {
      const childHeight = this.child.measureHeight(contentWidth);
      const wouldOverflow = ctx.currentY + childHeight > ctx.maxY;
      const notAtTop = ctx.currentY > ctx.margin;

      if (wouldOverflow && notAtTop) {
        ctx.currentX = originalX;
        ctx.currentY -= this.margin.top;
        return RenderStatus.WrapRequired;
      }

      try {
        this.child.render(ctx, contentWidth);
        status = RenderStatus.Complete;
      } finally {
        ctx.currentX = originalX;
      }
    }

    if (status === RenderStatus.Complete) {
      ctx.currentY += this.margin.bottom;
    }

    return status;
  }

  public resetState(): void {
    if (this.child && 'resetState' in this.child) {
      (this.child as IStatefulElement).resetState();
    }
  }
}
