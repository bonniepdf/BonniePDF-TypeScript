import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';

/** Settable properties declared by {@link PreventPageBreak} itself. */
export const PREVENT_PAGE_BREAK_OWN_OPTION_KEYS = ['child'] as const;

/** The full settable surface, bases included. */
export const PREVENT_PAGE_BREAK_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...PREVENT_PAGE_BREAK_OWN_OPTION_KEYS] as const;

type PreventPageBreakOwnKey = (typeof PREVENT_PAGE_BREAK_OWN_OPTION_KEYS)[number];

/** Options for {@link PreventPageBreak}. */
export type PreventPageBreakOptions = ElementOptions & Partial<Pick<PreventPageBreak, PreventPageBreakOwnKey>>;

/**
 * Keeps its child together: if the child will not fit in the space left on the
 * current page but would fit on an empty one, the whole child moves to the next
 * page rather than splitting across the boundary.
 *
 * This is the element form of the `breakAllowed` property (spec
 * "Layout & Pagination" §7), and behaves identically. Prefer the property when
 * you own the element; prefer this wrapper when you do not - around a subtree
 * you were handed, or where an options bag would be noise.
 *
 * A child taller than a whole content box still splits: the spec requires it,
 * because no page break can rescue content that fits on no page at all.
 */
export class PreventPageBreak extends PaginationWrapperBase {
  /** Creates an empty prevent-page-break. */
  constructor();
  /**
   * Creates a prevent-page-break configured in one expression.
   *
   * ```typescript
   * new PreventPageBreak({ child: new TextBlock('This paragraph stays together.') });
   * ```
   */
  constructor(options: PreventPageBreakOptions);
  /** Creates a prevent-page-break around `child`. */
  constructor(child: IElement);
  constructor(optionsOrChild?: PreventPageBreakOptions | IElement) {
    super();
    if (!optionsOrChild) return;
    if (isElement(optionsOrChild)) this.child = optionsOrChild;
    else applyOptions(this, optionsOrChild);
  }

  protected decide(ctx: RenderContext, contentWidth: number): PaginationDecision {
    if (!this.child) return 'render';
    const height = this.child.measureHeight(contentWidth);
    const fitsHere = this.remainingHeight(ctx) >= height;
    if (fitsHere || !this.canGainSpaceByBreaking(ctx)) return 'render';
    // A child that fits on no page at all has to split wherever it is.
    return height <= ctx.contentHeight ? 'wrap' : 'render';
  }
}

/** True for a renderable element rather than an options bag. */
export function isElement(value: object): value is IElement {
  return typeof (value as Partial<IElement>).measureHeight === 'function';
}
