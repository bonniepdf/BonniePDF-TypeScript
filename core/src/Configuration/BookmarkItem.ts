/**
 * Represents a bookmark (outline) item in the PDF document.
 * Bookmarks allow users to click and navigate to specific pages.
 */
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

  constructor(title: string = '', pageIndex: number = 0) {
    this.title = title;
    this.pageIndex = pageIndex;
    this.children = [];
  }
}
