import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext } from '../../IElement';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';
import { PageContext, pageContextOf } from './PageContext';

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
