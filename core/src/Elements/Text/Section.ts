import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';

/**
 * An invisible, zero-height named anchor. When rendered, a Section records the
 * 1-based page number on which it sits against its {@link anchorId} in the
 * shared {@link RenderContext.tocEntries} registry, so that a {@link SectionLink}
 * can jump to it and a {@link PageNumberOf} can print "see page 42".
 *
 * A Section paints nothing and occupies no vertical space; it simply marks a
 * position in the flow. Use it where the anchor is not itself a visible heading
 * (a {@link Heading} can double as an anchor via its `anchorId`).
 *
 * @example
 * ```ts
 * doc.add(new Section('appendix-b'));
 * // ...elsewhere...
 * doc.add(new SectionLink('See Appendix B', 'appendix-b'));
 * ```
 */
export class Section extends ElementBase {
  /**
   * The unique anchor identifier. A {@link SectionLink} or {@link PageNumberOf}
   * referencing this id resolves to the page this Section rendered on.
   */
  public anchorId: string;

  /**
   * Creates a new named anchor.
   * @param anchorId - The unique identifier links and page references target.
   */
  constructor(anchorId: string) {
    super();
    if (!anchorId || anchorId === '') {
      throw new Error('Section anchorId cannot be null or empty');
    }
    this.anchorId = anchorId;
  }

  /** Stable node name for the layout snapshot tree. */
  public override captureType(): string {
    return 'Section';
  }

  /** An anchor takes up no space. */
  protected override measureContentHeight(): number {
    return 0;
  }

  /**
   * Records this anchor's resolved page number. Runs on every layout pass
   * (including the two-pass dry run) so the value is always current; a later
   * page always overwrites an earlier throw-away one for the same id.
   */
  protected override renderContent(ctx: RenderContext): void {
    ctx.tocEntries.set(this.anchorId, ctx.currentPageIndex + 1);
  }
}
