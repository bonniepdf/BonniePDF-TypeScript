import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';
import { isElement } from './PreventPageBreak';

/** Settable properties declared by {@link SkipOnce} itself. */
export const SKIP_ONCE_OWN_OPTION_KEYS = ['child'] as const;

/** The full settable surface, bases included. */
export const SKIP_ONCE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SKIP_ONCE_OWN_OPTION_KEYS] as const;

/** Options for {@link SkipOnce}. */
export type SkipOnceOptions = ElementOptions & Partial<Pick<SkipOnce, 'child'>>;

/**
 * Renders its child on every page except the document's first.
 *
 * The mirror of {@link ShowOnce}, and the usual way to keep a running header off
 * a cover page while letting it appear everywhere else.
 */
export class SkipOnce extends PaginationWrapperBase {
  /** Creates an empty skip-once. */
  constructor();
  /** Creates a skip-once configured in one expression. */
  constructor(options: SkipOnceOptions);
  /** Creates a skip-once around `child`. */
  constructor(child: IElement);
  constructor(optionsOrChild?: SkipOnceOptions | IElement) {
    super();
    if (!optionsOrChild) return;
    if (isElement(optionsOrChild)) this.child = optionsOrChild;
    else applyOptions(this, optionsOrChild);
  }

  protected decide(ctx: RenderContext, _contentWidth: number): PaginationDecision {
    return ctx.currentPageIndex === 0 ? 'skip' : 'render';
  }
}
