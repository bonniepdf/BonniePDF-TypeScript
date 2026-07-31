import { applyOptions } from '../Core/applyOptions';
/**
 * Represents a bookmark (outline) item in the PDF document.
 * Bookmarks allow users to click and navigate to specific pages.
 */
/** Settable properties of {@link BookmarkItem}. */
export const BOOKMARK_ITEM_OPTION_KEYS = ['title', 'pageIndex', 'children'] as const;

/** Options for {@link BookmarkItem}. Nested `children` accept literals too. */
export type BookmarkItemOptions = Partial<
  Omit<Pick<BookmarkItem, (typeof BOOKMARK_ITEM_OPTION_KEYS)[number]>, 'children'>
> & {
  /** Child bookmarks; each may be an instance or its own options literal. */
  children?: (BookmarkItem | BookmarkItemOptions)[];
};

export class BookmarkItem {
  /**
   * The display title of the bookmark.
   */
  public title: string;
  /**
   * The 0-based page index this bookmark navigates to.
   */
  public pageIndex: number;
  /**
   * Child bookmarks (nested outline items).
   */
  public children: BookmarkItem[];

  /** Creates a bookmark from a title and target page index. */
  constructor(title?: string, pageIndex?: number);
  /** Creates a bookmark configured in one expression. */
  constructor(options: BookmarkItemOptions);
  constructor(titleOrOptions: string | BookmarkItemOptions = '', pageIndex: number = 0) {
    if (typeof titleOrOptions !== 'string') {
      this.title = '';
      this.pageIndex = 0;
      this.children = [];
      const { children, ...rest } = titleOrOptions;
      applyOptions(this, rest);
      if (children !== undefined) {
        this.children = children.map(c => (c instanceof BookmarkItem ? c : new BookmarkItem(c)));
      }
      return;
    }
    const title: string = titleOrOptions;
    this.title = title;
    this.pageIndex = pageIndex;
    this.children = [];
  }
}
