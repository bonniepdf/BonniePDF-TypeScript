import { ElementBase } from '../ElementBase';
import { RenderContext, RenderStatus } from '../IElement';

export class PageBreak extends ElementBase {
  private triggered: boolean = false;

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (!this.triggered) {
      this.triggered = true;
      if (ctx.currentY > ctx.margin) {
        return RenderStatus.WrapRequired;
      }
    }
    return RenderStatus.Complete;
  }

  public resetState(): void {
    this.triggered = false;
  }

  protected measureContentHeight(_contentWidth: number): number {
    return 0;
  }

  protected renderContent(_ctx: RenderContext, _contentWidth: number): void {
    // No-op
  }
}
