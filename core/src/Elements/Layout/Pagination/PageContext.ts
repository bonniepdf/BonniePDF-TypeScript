import type { RenderContext } from '../../IElement';

/**
 * The page facts a conditional pagination primitive decides on.
 *
 * Deliberately small and stateless: a predicate that can only see these three
 * values is a pure function of where the element landed, which is what keeps
 * layout deterministic (spec "Layout & Pagination" §10) and keeps the two
 * implementations in step.
 */
export interface PageContext {
  /** 1-based number of the page the element is being rendered on. */
  readonly pageNumber: number;
  /** True on the document's first page. */
  readonly isFirstPage: boolean;
  /**
   * True on the document's last page.
   *
   * Only meaningful during the second layout pass; on the first pass the total
   * page count is not yet known and this reports the engine's running view.
   */
  readonly isLastPage: boolean;
}

/** Builds the {@link PageContext} for the page currently being rendered. */
export function pageContextOf(ctx: RenderContext): PageContext {
  return {
    pageNumber: ctx.currentPageIndex + 1,
    isFirstPage: ctx.currentPageIndex === 0,
    isLastPage: ctx.isLastPage,
  };
}
