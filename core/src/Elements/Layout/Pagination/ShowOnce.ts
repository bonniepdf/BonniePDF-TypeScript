import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';
import { isElement } from './PreventPageBreak';

/** Settable properties declared by {@link ShowOnce} itself. */
export const SHOW_ONCE_OWN_OPTION_KEYS = ['child'] as const;

/** The full settable surface, bases included. */
export const SHOW_ONCE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SHOW_ONCE_OWN_OPTION_KEYS] as const;

/** Options for {@link ShowOnce}. */
export type ShowOnceOptions = ElementOptions & Partial<Pick<ShowOnce, 'child'>>;

/**
 * Renders its child on the document's first page only.
 *
 * The canonical use is a page template that should not repeat: a cover-page
 * watermark, a one-off notice above a running header. Inside body flow, where an
 * element is reached once anyway, it renders normally on page 1 and disappears
 * if the flow has already carried it past it.
 */
export class ShowOnce extends PaginationWrapperBase {
  /** Creates an empty show-once. */
  constructor();
  /** Creates a show-once configured in one expression. */
  constructor(options: ShowOnceOptions);
  /** Creates a show-once around `child`. */
  constructor(child: IElement);
  constructor(optionsOrChild?: ShowOnceOptions | IElement) {
    super();
    if (!optionsOrChild) return;
    if (isElement(optionsOrChild)) this.child = optionsOrChild;
    else applyOptions(this, optionsOrChild);
  }

  protected decide(ctx: RenderContext, _contentWidth: number): PaginationDecision {
    return ctx.currentPageIndex === 0 ? 'render' : 'skip';
  }
}
