import { ElementBase } from '../Elements/ElementBase';
import { IContentContainer } from './IContentContainer';
import { IElement, IStatefulElement, RenderStatus, RenderContext } from '../Elements/IElement';

export class ContentSlot extends ElementBase implements IContentContainer, IStatefulElement {
  public child?: IElement;

  protected measureContentHeight(_contentWidth: number): number {
    return this.child?.measureHeight(0) ?? 0;
  }

  protected renderContent(_ctx: any, _contentWidth: number): void {
    // Implementation
  }

  protected getPreferredContentWidth(): number {
    return this.child?.getPreferredWidth() ?? 0;
  }

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (!this.child) {
      return RenderStatus.Complete;
    }

    if ('renderStateful' in this.child) {
      return (this.child as IStatefulElement).renderStateful(ctx, width);
    }

    const childHeight = this.child.measureHeight(width);
    const wouldOverflow = ctx.currentY + childHeight > ctx.maxY;
    const notAtTop = ctx.currentY > ctx.margin;

    if (wouldOverflow && notAtTop) {
      return RenderStatus.WrapRequired;
    }

    this.child.render(ctx, width);
    return RenderStatus.Complete;
  }

  public resetState(): void {
    if (this.child && 'resetState' in this.child) {
      (this.child as IStatefulElement).resetState();
    }
  }
}
