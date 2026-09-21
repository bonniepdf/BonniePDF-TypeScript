import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext, RenderStatus } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';
import { isElement } from './PreventPageBreak';

/** Settable properties declared by {@link Unconstrained} itself. */
export const UNCONSTRAINED_OWN_OPTION_KEYS = ['child'] as const;

/** The full settable surface, bases included. */
export const UNCONSTRAINED_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...UNCONSTRAINED_OWN_OPTION_KEYS] as const;

type UnconstrainedOwnKey = (typeof UNCONSTRAINED_OWN_OPTION_KEYS)[number];

/** Options for {@link Unconstrained}. */
export type UnconstrainedOptions = ElementOptions & Partial<Pick<Unconstrained, UnconstrainedOwnKey>>;

/**
 * Renders its child outside the flow: the child draws from the current cursor
 * position but consumes no height, so whatever follows starts where the child
 * started.
 *
 * It is the escape hatch for content that should overlap rather than stack - a
 * badge over a table, a rubber stamp across a paragraph, a rule drawn behind the
 * next few lines. The child is measured as zero-height, which also means it
 * never triggers a page break of its own and never splits: it renders once,
 * here, and anything past the page boundary is clipped by the page.
 *
 * Because the cursor does not move, two `Unconstrained` siblings draw on top of
 * each other. That is the point, but it makes the element easy to misuse - reach
 * for it only when overlap is what you want.
 */
export class Unconstrained extends PaginationWrapperBase {
  /** Creates an empty unconstrained. */
  constructor();
  /**
   * Creates an unconstrained configured in one expression.
   *
   * ```typescript
   * new Unconstrained({ child: new Container({ ... }) });
   * ```
   */
  constructor(options: UnconstrainedOptions);
  /** Creates an unconstrained around `child`. */
  constructor(child: IElement);
  constructor(optionsOrChild?: UnconstrainedOptions | IElement) {
    super();
    if (!optionsOrChild) return;
    if (isElement(optionsOrChild)) this.child = optionsOrChild;
    else applyOptions(this, optionsOrChild);
  }

  protected decide(_ctx: RenderContext, _contentWidth: number): PaginationDecision {
    return 'render';
  }

  /** Zero-height in the flow, whatever the child measures. */
  protected measureContentHeight(_contentWidth: number): number {
    return 0;
  }

  /** Where the cursor stood when the child started drawing. */
  private _entryY: number = 0;

  /** Draws the child exactly once; continuation is never requested. */
  protected driveChild(ctx: RenderContext, contentWidth: number): RenderStatus {
    this._entryY = ctx.currentY;
    super.driveChild(ctx, contentWidth);
    return RenderStatus.Complete;
  }

  /**
   * Rewinds the flow cursor once the child has drawn *and* its capture node has
   * closed, so the snapshot still records the real rect while the flow behaves
   * as though nothing was emitted.
   */
  protected afterChild(ctx: RenderContext): void {
    ctx.currentY = this._entryY;
  }
}
