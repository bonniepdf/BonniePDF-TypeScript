import { TextBlock, TEXT_BLOCK_OPTION_KEYS, type TextBlockOptions } from './TextBlock';
import { applyOptions } from '../../Core/applyOptions';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';

/**
 * Renders the page number on which a named {@link Section} (or anchored
 * {@link Heading}) sits - the "see page 42" cross-reference. The number is
 * resolved from the shared {@link RenderContext.tocEntries} registry, which is
 * seeded by the two-pass layout (a document containing a PageNumberOf is laid
 * out twice; see `documentRequiresTwoPassLayout`).
 *
 * It is a {@link TextBlock} at heart, so it inherits all text styling
 * (`fontName`, `fontSize`, `textColor`, alignment, decorations). Until the
 * anchor is resolved (the throw-away first pass, or an unknown id) it renders
 * the {@link placeholder}.
 *
 * @example
 * ```ts
 * // "See page 42."
 * doc.add(new RichText()
 *   .addSpan('See page ')
 *   .add(new PageNumberOf('ch3'))  // when composed inline, or standalone:
 * );
 * doc.add(new PageNumberOf('ch3'));
 * ```
 */
/** Settable properties declared by {@link PageNumberOf} itself. */
export const PAGE_NUMBER_OF_OWN_OPTION_KEYS = ['anchorTarget', 'placeholder'] as const;

/** The full settable surface, bases included. */
export const PAGE_NUMBER_OF_OPTION_KEYS = [...TEXT_BLOCK_OPTION_KEYS, ...PAGE_NUMBER_OF_OWN_OPTION_KEYS] as const;

type PageNumberOfOwnKey = (typeof PAGE_NUMBER_OF_OWN_OPTION_KEYS)[number];

/** Options for {@link PageNumberOf}. Intersects {@link TextBlockOptions}. */
export type PageNumberOfOptions = TextBlockOptions & Partial<Pick<PageNumberOf, PageNumberOfOwnKey>>;

/** Renders the resolved page number of a named section or a fallback placeholder. */
export class PageNumberOf extends TextBlock {
  /** The anchor id whose page number is printed. */
  public anchorTarget: string;

  /**
   * Text shown before the page is resolved (dry-run pass) or when the anchor id
   * is unknown. Kept short and stable so it does not disturb pagination.
   */
  public placeholder = '?';

  /**
   * Creates a new page-number cross-reference.
   * @param anchorTarget - The id of the {@link Section}/anchor to report.
   */
  /** Creates a page reference to the given anchor, optionally with options. */
  constructor(anchorTarget: string, options?: PageNumberOfOptions);
  /** Options-only form; `anchorTarget` is required either way. */
  constructor(options: PageNumberOfOptions & { anchorTarget: string });
  constructor(
    targetOrOptions: string | (PageNumberOfOptions & { anchorTarget: string }),
    options?: PageNumberOfOptions
  ) {
    super('');
    const isPositional = typeof targetOrOptions === 'string';
    const anchorTarget = isPositional ? targetOrOptions : targetOrOptions?.anchorTarget;
    if (!anchorTarget || anchorTarget === '') {
      throw new Error('PageNumberOf anchorTarget cannot be null or empty');
    }
    applyOptions(this, isPositional ? options : targetOrOptions);
    this.anchorTarget = anchorTarget;
  }

  /** Stable node name for the layout snapshot tree. */
  public override captureType(): string {
    return 'PageNumberOf';
  }

  /**
   * Refreshes {@link TextBlock.text} from the resolved page number before the
   * base class computes lines. Clears the line cache so a value that changed
   * between passes is re-measured.
   */
  private resolveText(ctx: RenderContext): void {
    const resolved = ctx.tocEntries.get(this.anchorTarget);
    const next = resolved != null ? resolved.toString() : this.placeholder;
    if (next !== this.text) {
      this.text = next;
      this.resetState();
    }
  }

  public override renderStateful(ctx: RenderContext, width: number): RenderStatus {
    this.resolveText(ctx);
    return super.renderStateful(ctx, width);
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    this.resolveText(ctx);
    super.renderContent(ctx, contentWidth);
  }
}
