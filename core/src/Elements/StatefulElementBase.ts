import { ElementBase } from './ElementBase';
import { RenderContext, RenderStatus } from './IElement';

export abstract class StatefulElementBase extends ElementBase {
  protected hasPendingContent: boolean = false;

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    (this as any).startingY = ctx.currentY;
    const originalX = ctx.currentX;

    if (!this.hasPendingContent) {
      ctx.currentY += this.margin.top;
    }
    ctx.currentX += this.margin.left;

    const contentWidth = this.getContentWidth(width);
    let status: RenderStatus;
    try {
      status = this.renderContentStateful(ctx, contentWidth);
    } finally {
      ctx.currentX = originalX;
    }

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
