import { ElementBase } from './ElementBase';
import { RenderContext, RenderStatus } from './IElement';

export abstract class StatefulElementBase extends ElementBase {
  protected hasPendingContent: boolean = false;

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    (this as any).startingY = ctx.currentY;

    if (!this.hasPendingContent) {
      ctx.currentY += this.margin.top;
    }

    const contentWidth = this.getContentWidth(width);
    const status = this.renderContentStateful(ctx, contentWidth);

    if (status === RenderStatus.Complete) {
      ctx.currentY += this.margin.bottom;
      this.hasPendingContent = false;
    } else {
      this.hasPendingContent = true;
    }

    return status;
  }

  public resetState(): void {
    this.hasPendingContent = false;
  }

  protected abstract renderContentStateful(ctx: RenderContext, contentWidth: number): RenderStatus;
}
