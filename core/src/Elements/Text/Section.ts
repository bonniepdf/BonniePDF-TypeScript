import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
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
/** Settable properties declared by {@link Section} itself. */
export const SECTION_OWN_OPTION_KEYS = ['anchorId'] as const;

/** The full settable surface, base included. */
export const SECTION_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SECTION_OWN_OPTION_KEYS] as const;

/** Options for {@link Section}. Intersects {@link ElementOptions}. */
export type SectionOptions = ElementOptions & Partial<Pick<Section, 'anchorId'>>;

/** Marks a named document location and optionally renders section content. */
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
  /** Creates a named anchor, optionally with options. */
  constructor(anchorId: string, options?: SectionOptions);
  /** Options-only form; `anchorId` is required either way. */
  constructor(options: SectionOptions & { anchorId: string });
  constructor(idOrOptions: string | (SectionOptions & { anchorId: string }), options?: SectionOptions) {
    super();
    const isPositional = typeof idOrOptions === 'string';
    const anchorId = isPositional ? idOrOptions : idOrOptions?.anchorId;
    if (!anchorId || anchorId === '') {
      throw new Error('Section anchorId cannot be null or empty');
    }
    applyOptions(this, isPositional ? options : idOrOptions);
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
