import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext, RenderStatus } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';
import { isElement } from './PreventPageBreak';

/** Settable properties declared by {@link ShowEntire} itself. */
export const SHOW_ENTIRE_OWN_OPTION_KEYS = ['child'] as const;

/** The full settable surface, bases included. */
export const SHOW_ENTIRE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SHOW_ENTIRE_OWN_OPTION_KEYS] as const;

type ShowEntireOwnKey = (typeof SHOW_ENTIRE_OWN_OPTION_KEYS)[number];

/** Options for {@link ShowEntire}. */
export type ShowEntireOptions = ElementOptions & Partial<Pick<ShowEntire, ShowEntireOwnKey>>;

/**
 * Renders its child only where the child fits whole, and never splits it.
 *
 * Where {@link PreventPageBreak} moves an oversized child to the next page and
 * still splits it if it fits on no page, `ShowEntire` refuses to split under any
 * circumstance. A child taller than a whole content box therefore renders from
 * the top of a fresh page and is cut off at the page boundary - the content that
 * did not fit is dropped, not carried over.
 *
 * Use it for content that is meaningless in pieces - a signature block, a
 * certificate panel, a scorecard - where half the thing on each of two pages is
 * worse than a shorter thing on one.
 */
export class ShowEntire extends PaginationWrapperBase {
  /** Creates an empty show-entire. */
  constructor();
  /**
   * Creates a show-entire configured in one expression.
   *
   * ```typescript
   * new ShowEntire({ child: signatureBlock });
   * ```
   */
  constructor(options: ShowEntireOptions);
  /** Creates a show-entire around `child`. */
  constructor(child: IElement);
  constructor(optionsOrChild?: ShowEntireOptions | IElement) {
    super();
    if (!optionsOrChild) return;
    if (isElement(optionsOrChild)) this.child = optionsOrChild;
    else applyOptions(this, optionsOrChild);
  }

  protected decide(ctx: RenderContext, contentWidth: number): PaginationDecision {
    if (!this.child) return 'render';
    const fitsHere = this.remainingHeight(ctx) >= this.child.measureHeight(contentWidth);
    if (fitsHere || !this.canGainSpaceByBreaking(ctx)) return 'render';
    return 'wrap';
  }

  /** Never continues onto another page: whatever did not fit is dropped. */
  protected settle(_status: RenderStatus): RenderStatus {
    return RenderStatus.Complete;
  }
}
