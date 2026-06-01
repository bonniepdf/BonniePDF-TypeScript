import { IMargin } from './IMargin';
import { IElement, RenderContext } from './IElement';
import { Thickness } from '../Core/Thickness';

/**
 * Base class for PDF elements that provides common functionality for margin handling,
 * Y-position tracking, and content width calculation. This reduces code duplication
 * across elements and ensures consistent behavior.
 */
export abstract class ElementBase implements IElement, IMargin {
  /**
   * The starting Y position when rendering begins (used for Y-position tracking)
   */
  protected startingY: number = 0;
  /**
   * Margin around this element
   */
  public margin: Thickness;
  /**
   * Whether this element can be split across page boundaries.
   * When false, the element is treated as atomic and will be moved to a new page
   * rather than split. If it doesn't fit on a fresh page either, it renders anyway.
   * Default is true.
   */
  public breakAllowed: boolean = true;

  constructor() {
    this.margin = new Thickness(0);
  }

  /**
   * Gets the preferred width of this element, if any.
   * This implementation includes margins.
   */
  public getPreferredWidth(): number {
    return this.getPreferredContentWidth() + this.margin.left + this.margin.right;
  }

  /**
   * Measures the height of this element given the available width.
   * This implementation accounts for margins in addition to content height.
   * @param availableWidth - The available width for this element
   * @returns The total height including margins
   */
  public measureHeight(availableWidth: number): number {
    const contentWidth = this.getContentWidth(availableWidth);
    const contentHeight = this.measureContentHeight(contentWidth);
    return contentHeight + this.margin.top + this.margin.bottom;
  }

  /**
   * Renders this element to the PDF context.
   * This implementation handles margin application and Y-position tracking.
   * @param ctx - The render context
   * @param width - The available width for this element
   */
  public render(ctx: RenderContext, width: number): void {
    // Save starting Y position for Y-position tracking
    this.startingY = ctx.currentY;
    const originalX = ctx.currentX;

    // Apply top margin
    ctx.currentY += this.margin.top;
    ctx.currentX += this.margin.left;

    // Get content width after margins
    const contentWidth = this.getContentWidth(width);

    try {
      // Render the content
      this.renderContent(ctx, contentWidth);
    } finally {
      ctx.currentX = originalX;
    }

    // Apply bottom margin
    ctx.currentY += this.margin.bottom;
  }

  /**
   * Gets the content width after accounting for margins
   * @param availableWidth - The total available width
   * @returns The width available for content (total width minus left and right margins)
   */
  protected getContentWidth(availableWidth: number): number {
    return availableWidth - this.margin.left - this.margin.right;
  }

  /**
   * Gets the preferred content width.
   * Derived classes can override this to provide intrinsic sizing.
   */
  protected getPreferredContentWidth(): number {
    return 0;
  }

  /**
   * Measures the height of the content only (excluding margins).
   * Derived classes must implement this to provide their specific content measurement logic.
   * @param contentWidth - The width available for content (margins already subtracted)
   * @returns The height of the content only
   */
  protected abstract measureContentHeight(contentWidth: number): number;

  /**
   * Renders the content of this element.
   * Derived classes must implement this to provide their specific rendering logic.
   * The context will have the top margin already applied, and bottom margin will be applied after.
   * @param ctx - The render context
   * @param contentWidth - The width available for content (margins already subtracted)
   */
  protected abstract renderContent(ctx: RenderContext, contentWidth: number): void;
}
