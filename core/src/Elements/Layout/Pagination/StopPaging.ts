import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext, RenderStatus } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';
import { isElement } from './PreventPageBreak';

/** Settable properties declared by {@link StopPaging} itself. */
export const STOP_PAGING_OWN_OPTION_KEYS = ['child'] as const;

/** The full settable surface, bases included. */
export const STOP_PAGING_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...STOP_PAGING_OWN_OPTION_KEYS] as const;

type StopPagingOwnKey = (typeof STOP_PAGING_OWN_OPTION_KEYS)[number];

/** Options for {@link StopPaging}. */
export type StopPagingOptions = ElementOptions & Partial<Pick<StopPaging, StopPagingOwnKey>>;

/**
 * Renders as much of its child as fits on the current page and discards the
 * rest, instead of continuing onto further pages.
 *
 * This is the truncation primitive: a preview that must stay one page long, an
 * appendix capped at whatever the remaining space allows, a summary panel that
 * should never grow the document. Unlike {@link ShowEntire} it does not move to
 * a fresh page first - it starts exactly where the cursor is and stops at the
 * page boundary.
 *
 * Truncation is silent by design: the child is asked to render, and its
 * continuation is simply never requested.
 */
export class StopPaging extends PaginationWrapperBase {
  /** Creates an empty stop-paging. */
  constructor();
  /**
   * Creates a stop-paging configured in one expression.
   *
   * ```typescript
   * new StopPaging({ child: longTable });
   * ```
   */
  constructor(options: StopPagingOptions);
  /** Creates a stop-paging around `child`. */
  constructor(child: IElement);
  constructor(optionsOrChild?: StopPagingOptions | IElement) {
    super();
    if (!optionsOrChild) return;
    if (isElement(optionsOrChild)) this.child = optionsOrChild;
    else applyOptions(this, optionsOrChild);
  }

  protected decide(_ctx: RenderContext, _contentWidth: number): PaginationDecision {
    return 'render';
  }

  /** Whatever the child still had to render is dropped. */
  protected settle(_status: RenderStatus): RenderStatus {
    return RenderStatus.Complete;
  }
}
