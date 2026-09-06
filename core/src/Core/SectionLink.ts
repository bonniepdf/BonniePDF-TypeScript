import { Hyperlink, HYPERLINK_OPTION_KEYS, type HyperlinkOptions } from './Hyperlink';
import { RenderContext } from '../Rendering/RenderContext';

/**
 * A clickable internal cross-reference. Unlike a plain {@link Hyperlink} (which
 * needs an explicit `targetPageIndex`), a SectionLink targets a named
 * {@link Section} - or a {@link Heading} carrying an `anchorId` - by id and
 * resolves the destination page at render time from the shared
 * {@link RenderContext.tocEntries} registry.
 *
 * Because the destination page is only known once layout has run, a document
 * containing a SectionLink is laid out in two passes (see
 * `documentRequiresTwoPassLayout`): a throw-away pass seeds every anchor's page
 * number, then the real pass emits a `/GoTo` annotation pointing at it.
 *
 * @example
 * ```ts
 * doc.add(new Section('ch3'));
 * doc.add(new SectionLink('See Chapter 3', 'ch3'));
 * ```
 */
/** The full settable surface, base included. */
export const SECTION_LINK_OPTION_KEYS = [...HYPERLINK_OPTION_KEYS, 'anchorTarget'] as const;

/** Options for {@link SectionLink}. Intersects {@link HyperlinkOptions}. */
export type SectionLinkOptions = HyperlinkOptions & Partial<Pick<SectionLink, 'anchorTarget'>>;

/** Renders linked text that navigates to a named section in the document. */
export class SectionLink extends Hyperlink {
  /** The anchor id this link jumps to (a {@link Section} or anchored {@link Heading}). */
  public anchorTarget: string;

  /**
   * Creates a new internal cross-reference link.
   * @param text - The visible link text.
   * @param anchorTarget - The id of the {@link Section}/anchor to jump to.
   */
  /** Creates a cross-reference link from text and an anchor target. */
  constructor(text: string, anchorTarget: string, options?: SectionLinkOptions);
  /** Options-only form; `text` and `anchorTarget` are required either way. */
  constructor(options: SectionLinkOptions & { text: string; anchorTarget: string });
  constructor(
    textOrOptions: string | (SectionLinkOptions & { text: string; anchorTarget: string }),
    anchorTarget?: string,
    options?: SectionLinkOptions
  ) {
    const isPositional = typeof textOrOptions === 'string';
    super(isPositional ? { ...options, text: textOrOptions } : textOrOptions);
    const target = isPositional ? anchorTarget : textOrOptions.anchorTarget;
    if (!target || target === '') {
      throw new Error('SectionLink anchorTarget cannot be null or empty');
    }
    this.anchorTarget = target;
  }

  /**
   * Resolves {@link anchorTarget} to a 0-based page index from the seeded TOC
   * registry, then delegates to the base {@link Hyperlink} render/annotation
   * path. Falls back to the first page when the target was never registered
   * (unknown id / single-pass layout), matching the VisualToc behaviour.
   */
  public override render(ctx: RenderContext, width: number): void {
    const resolvedPageNumber = ctx.tocEntries.get(this.anchorTarget);
    this.targetPageIndex = resolvedPageNumber != null ? resolvedPageNumber - 1 : 0;
    super.render(ctx, width);
  }
}
