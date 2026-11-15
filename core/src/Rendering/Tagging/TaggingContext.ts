import { StructureTreeBuilder } from './StructureTreeBuilder';
import type { StructureElement } from './StructureElement';
import type { IElement } from '../../Elements/IElement';

/**
 * An in-document go-to action whose object number was reserved: target page,
 * optional anchor, and view (`/Fit`, `/FitH 0`, ...).
 */
export interface PendingGoTo {
  readonly actionId: number;
  readonly pageIndex: number;
  readonly anchor: string | undefined;
  readonly view: string;
}

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

  /**
   * True for PDF/UA-2: the tree is written in the PDF 2.0 structure namespace,
   * lists carry ListNumbering, TOC entries carry /Ref, and in-document
   * destinations are structure destinations (spec 04 §3.4).
   */
  public readonly pdf20: boolean;

  /** The structure element each element object opened first (spec 04 §3.4, anchor targets). */
  public readonly elementStructure = new Map<IElement, StructureElement>();

  /** The element object that registered each anchor name: a heading's TOC identifier or anchor id, or a section's anchor id. */
  public readonly anchorOwners = new Map<string, IElement>();

  /** In-document go-to actions reserved while pages were written, filled in once the structure tree has object numbers. */
  public readonly pendingGoTos: PendingGoTo[] = [];

  constructor(tree: StructureTreeBuilder, pdf20 = false) {
    this.tree = tree;
    this.pdf20 = pdf20;
  }

  /** Records the anchor `name` as registered by `owner`. */
  recordAnchor(name: string, owner: IElement): void {
    this.anchorOwners.set(name, owner);
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
