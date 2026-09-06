import { StructureTreeBuilder } from './StructureTreeBuilder';

/**
 * Carries the per-document tagging state through the render pipeline: the
 * in-memory {@link StructureTreeBuilder} being populated, a per-page MCID
 * counter that the canvas uses to label each marked-content sequence, and a
 * stack of currently-open marked-content roles that the page-break handler uses
 * to keep BDC/EMC balanced per page.
 *
 * One instance per Document render; `RenderContext` hands it to each per-page
 * `PdfCanvas`. When tagging is disabled the context is undefined and the
 * canvas's beginMarkedContent/endMarkedContent are no-ops.
 */
export class TaggingContext {
  /** The structure-tree builder being populated. */
  public readonly tree: StructureTreeBuilder;

  private _nextMcidOnPage = 0;
  private readonly _openRoles: string[] = [];

  /**
   * Zero-based index of the page currently being rendered. Set by
   * `RenderContext` at construction and on every `newPage`. The canvas
   * reads this when allocating MCIDs so each MCID can be later paired
   * with its page for /Pg / ParentTree emission.
   */
  public currentPageIndex = 0;

  constructor(tree: StructureTreeBuilder) {
    this.tree = tree;
  }

  /**
   * Allocate the next MCID for the current page. MCIDs restart at 0 on
   * every new page per ISO 32000-1 §14.7.4.
   */
  allocateMcid(): number {
    return this._nextMcidOnPage++;
  }

  /**
   * Reset the per-page MCID counter to 0. When `pageIndex` is provided,
   * also updates {@link currentPageIndex} so subsequent MCIDs get
   * paired with the new page. Called by `RenderContext` on every page
   * transition.
   */
  resetPage(pageIndex?: number): void {
    this._nextMcidOnPage = 0;
    if (pageIndex !== undefined) this.currentPageIndex = pageIndex;
  }

  /**
   * Number of marked-content sequences currently open on the active
   * page. The page-break handler uses this to know how many BDC/EMC
   * pairs to close on the outgoing page and reopen on the incoming
   * page.
   */
  get openMarkedContentCount(): number {
    return this._openRoles.length;
  }

  /** Push a role onto the open-marked-content stack. */
  pushOpenRole(role: string): void {
    this._openRoles.push(role);
  }

  /** Pop the topmost open-marked-content role. */
  popOpenRole(): void {
    if (this._openRoles.length > 0) this._openRoles.pop();
  }

  /**
   * Returns the currently-open marked-content roles, bottom-up. Used
   * by the page-break handler to reopen marked-content scopes on the
   * new page in the same nesting order they had on the old one.
   */
  snapshotOpenRolesBottomUp(): string[] {
    return this._openRoles.slice();
  }
}
