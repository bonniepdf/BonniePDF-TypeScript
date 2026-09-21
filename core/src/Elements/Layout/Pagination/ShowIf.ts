import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';
import { PageContext, pageContextOf } from './PageContext';
import { isElement } from './PreventPageBreak';

/** Decides whether the child appears on the page described by `page`. */
export type PagePredicate = (page: PageContext) => boolean;

/** Settable properties declared by {@link ShowIf} itself. */
export const SHOW_IF_OWN_OPTION_KEYS = ['child', 'predicate'] as const;

/** The full settable surface, bases included. */
export const SHOW_IF_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SHOW_IF_OWN_OPTION_KEYS] as const;

type ShowIfOwnKey = (typeof SHOW_IF_OWN_OPTION_KEYS)[number];

/** Options for {@link ShowIf}. */
export type ShowIfOptions = ElementOptions & Partial<Pick<ShowIf, ShowIfOwnKey>>;

/**
 * Renders its child only on the pages a predicate accepts.
 *
 * The predicate sees a {@link PageContext} - the page number and whether this is
 * the first or last page - and nothing else, so the decision stays a pure
 * function of where the element landed. That is what keeps layout deterministic
 * and what lets the same document produce the same pages in both
 * implementations.
 *
 * Most useful inside a page template, where the same tree is built for every
 * page:
 *
 * ```typescript
 * doc.settings.headerTemplate = () =>
 *   new ShowIf({ predicate: p => !p.isFirstPage, child: runningHead });
 * ```
 *
 * `isLastPage` is only reliable in the second layout pass; on the first pass the
 * engine does not yet know the total page count.
 */
export class ShowIf extends PaginationWrapperBase {
  /**
   * The page test. Unset means "always render", so a `ShowIf` with no predicate
   * is a transparent wrapper rather than an element that silently disappears.
   */
  public predicate?: PagePredicate;

  /** Creates an empty show-if. */
  constructor();
  /**
   * Creates a show-if configured in one expression.
   *
   * ```typescript
   * new ShowIf({ predicate: p => p.pageNumber % 2 === 0, child: evenPageNote });
   * ```
   */
  constructor(options: ShowIfOptions);
  /** Creates a show-if around `child`, governed by `predicate`. */
  constructor(predicate: PagePredicate, child?: IElement);
  constructor(optionsOrPredicate?: ShowIfOptions | PagePredicate, child?: IElement) {
    super();
    if (!optionsOrPredicate) return;
    if (typeof optionsOrPredicate === 'function') {
      this.predicate = optionsOrPredicate;
      this.child = child;
      return;
    }
    applyOptions(this, optionsOrPredicate);
  }

  protected decide(ctx: RenderContext, _contentWidth: number): PaginationDecision {
    if (!this.predicate) return 'render';
    return this.predicate(pageContextOf(ctx)) ? 'render' : 'skip';
  }
}

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
