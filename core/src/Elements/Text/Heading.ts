import { TextBlock } from './TextBlock';
import { IStatefulElement } from '../IElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

/**
 * A text block that registers itself as a heading in the Table of Contents when rendered.
 * On first render, the element records its page number against <TocIdentifier>
 * in the RenderContext.TocEntries dictionary so that a VisualToc
 * can display the correct page reference.
 */
export class Heading extends TextBlock implements IStatefulElement {
  /**
   * Gets or sets the unique identifier used to look up this heading in the TOC entries dictionary.
   * Must match the identifier passed to VisualToc.HeadingIdentifiers.
   */
  public tocIdentifier!: string;

  /**
   * Optional named-anchor id. When set, this heading doubles as a cross-reference
   * target: it records its page number against `anchorId` in the shared TOC
   * registry so a {@link SectionLink} can jump to it and a {@link PageNumberOf}
   * can print its page. Independent of {@link tocIdentifier} (which drives the
   * on-page {@link VisualToc}); a heading may carry either, both, or neither.
   */
  public anchorId?: string;

  /**
   * Heading level (1–6). Maps to PDF/UA structure roles `H1`…`H6` when
   * the document opts into tagging via `DocumentSettings.accessibility`.
   * Default `1`. Values outside 1–6 are clamped.
   */
  public level = 1;

  private tocRegistered = false;

  /** @inheritdoc */
  public override get semanticRole(): SemanticRole {
    switch (this.level) {
      case 2:
        return SemanticRole.H2;
      case 3:
        return SemanticRole.H3;
      case 4:
        return SemanticRole.H4;
      case 5:
        return SemanticRole.H5;
      default:
        return this.level <= 1 ? SemanticRole.H1 : SemanticRole.H6;
    }
  }

  constructor();

  /**
   * Initializes a new instance of Heading with the specified text.
   * @param text - The heading text to display
   */
  constructor(text: string);

  constructor(text?: string) {
    super(text);
  }

  /**
   * Renders this heading in a stateful manner, registering the TOC entry on first render
   * and delegating text rendering to the base TextBlock implementation.
   * @param ctx - The current render context
   * @param width - The available width for rendering
   * @returns The render status indicating whether the element is complete or overflowed
   */
  public override renderStateful(ctx: RenderContext, width: number): RenderStatus {
    this.registerToc(ctx);
    return super.renderStateful(ctx, width);
  }

  /**
   * Records this heading's page number against its {@link tocIdentifier} and,
   * when present, its {@link anchorId}, on the first render pass only.
   */
  private registerToc(ctx: RenderContext): void {
    if (this.tocRegistered) return;
    const pageNumber = ctx.currentPageIndex + 1;
    if (this.tocIdentifier) {
      ctx.tocEntries.set(this.tocIdentifier, pageNumber);
    }
    if (this.anchorId) {
      ctx.tocEntries.set(this.anchorId, pageNumber);
    }
    this.tocRegistered = true;
  }

  /**
   * Resets the render state so the heading can be re-rendered on subsequent layout passes
   * (e.g. during two-pass TOC resolution).
   */
  public override resetState(): void {
    this.tocRegistered = false;
    super.resetState();
  }

  /**
   * Renders the heading content and records the current page number against
   * <TocIdentifier> on the first render pass.
   * @param ctx - The current render context
   * @param contentWidth - The available content width after margins
   */
  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    this.registerToc(ctx);
    super.renderContent(ctx, contentWidth);
  }
}
