import { ElementBase } from './ElementBase';
import { RenderContext, RenderStatus } from './IElement';

/** Provides lifecycle state for elements that continue rendering across page boundaries. */
export abstract class StatefulElementBase extends ElementBase {
  protected hasPendingContent: boolean = false;

  /**
   * Renders as much of the element as fits on the current page and reports whether it is complete or needs another page.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    this.startingY = ctx.currentY;
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

  /** Clears the continuation state so the element can be rendered again from the start. */
  public resetState(): void {
    this.hasPendingContent = false;
  }

  protected abstract renderContentStateful(ctx: RenderContext, contentWidth: number): RenderStatus;
}
