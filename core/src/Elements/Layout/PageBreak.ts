import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { ElementBase } from '../ElementBase';
import { RenderContext, RenderStatus } from '../IElement';

/**
 * Options for {@link PageBreak}. It declares no properties of its own, so this
 * is exactly {@link ElementOptions} (margin / breakAllowed / captureName).
 */
export type PageBreakOptions = ElementOptions;

/** The full settable surface - inherited only. */
export const PAGE_BREAK_OPTION_KEYS = [...ELEMENT_OPTION_KEYS] as const;

export class PageBreak extends ElementBase {
  private triggered: boolean = false;

  /** Creates a page break, optionally with element options. */
  constructor(options?: PageBreakOptions) {
    super();
    applyOptions(this, options);
  }

  public renderStateful(ctx: RenderContext, _width: number): RenderStatus {
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
