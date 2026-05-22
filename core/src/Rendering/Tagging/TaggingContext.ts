import { StructureTreeBuilder } from './StructureTreeBuilder';

/**
 * Carries the per-document tagging state through the render pipeline:
 * the in-memory {@link StructureTreeBuilder} being populated, and a
 * per-page MCID counter that the canvas uses to label each
 * marked-content sequence (this feature / this feature stage 0).
 *
 * One instance per Document render; `RenderContext` hands it to each
 * per-page `PdfCanvas`. When tagging is disabled, the context is
 * undefined and the canvas's beginMarkedContent/endMarkedContent are
 * no-ops.
 */
export class TaggingContext {
  /** The structure-tree builder being populated. */
  public readonly tree: StructureTreeBuilder;

  private _nextMcidOnPage = 0;

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
   * Reset the per-page MCID counter to 0. Called by `RenderContext` on
   * every page transition.
   */
  resetPage(): void {
    this._nextMcidOnPage = 0;
  }
}
