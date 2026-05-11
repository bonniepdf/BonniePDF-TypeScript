import { TextBlock } from './TextBlock';
import { IStatefulElement } from './IStatefulElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';

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

  private tocRegistered = false;

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
    if (!this.tocRegistered) {
      ctx.tocEntries.set(this.tocIdentifier, ctx.currentPageIndex + 1);
      this.tocRegistered = true;
    }
    return super.renderStateful(ctx, width);
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
    if (!this.tocRegistered) {
      ctx.tocEntries.set(this.tocIdentifier, ctx.currentPageIndex + 1);
      this.tocRegistered = true;
    }
    super.renderContent(ctx, contentWidth);
  }
}