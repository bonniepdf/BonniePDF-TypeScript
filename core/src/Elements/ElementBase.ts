import { ContentDirection, toContentDirection, type ContentDirectionInput } from '../Configuration/ContentDirection';
import { IMargin } from './IMargin';
import { IElement, RenderContext } from './IElement';
import { Thickness } from '../Core/Thickness';
import { toThickness, type ThicknessInput } from '../Normalize/toThickness';
import { SharedElementOptions } from './SharedOptions';

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
  // Margin, capture name, direction and break permission, shared with every element that has
  // the same values (see SharedOptions). Most elements keep the defaults.
  private _options: SharedElementOptions = SharedElementOptions.default;
  private _inheritedContentDirection = ContentDirection.LeftToRight;
  /** Inline direction override. Undefined inherits the enclosing direction. */
  public get contentDirection(): ContentDirection | undefined {
    return this._options.contentDirection;
  }
  public set contentDirection(value: ContentDirectionInput | undefined) {
    this._options = this._options.with('contentDirection', value === undefined ? undefined : toContentDirection(value));
  }
  /** @internal */
  public inheritContentDirection(value: ContentDirection): void {
    this._inheritedContentDirection = value;
  }
  /** @internal */
  public get effectiveContentDirection(): ContentDirection {
    return this._options.contentDirection ?? this._inheritedContentDirection;
  }
  /** @internal */
  public get isRightToLeft(): boolean {
    return this.effectiveContentDirection === ContentDirection.RightToLeft;
  }

  /**
   * Margin around this element.
   *
   * Reads as the canonical {@link Thickness}; accepts any of the forgiving
   * spacing forms on write (`12`, `[h, v]`, `[l, t, r, b]`, `{ bottom: 12 }`).
   * Omitted sides are zero.
   */
  public get margin(): Thickness {
    return this._options.margin;
  }
  public set margin(value: ThicknessInput) {
    this._options = this._options.with('margin', toThickness(value));
  }

  /**
   * Whether this element can be split across page boundaries.
   * When false, the element is treated as atomic and will be moved to a new page
   * rather than split. If it doesn't fit on a fresh page either, it renders anyway.
   * Default is true.
   */
  public get breakAllowed(): boolean {
    return this._options.breakAllowed;
  }
  public set breakAllowed(value: boolean) {
    this._options = this._options.with('breakAllowed', value);
  }

  /** Keeps this element with the start of its next sibling in vertical flow. */
  public keepWithNext = false;

  /** @internal Height needed to start this element in vertical flow. */
  public minimumStartHeight(width: number): number {
    return this.measureHeight(width);
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

    // Layout capture (opt-in, no-op without a recorder): record this element's
    // full margin box. The atomic render path renders in one shot, so the node
    // opens and closes (complete) around renderContent.
    ctx.layoutRecorder?.openNode(
      this,
      this.captureType(),
      this.captureName,
      ctx.currentPageIndex,
      originalX,
      this.startingY,
      width
    );

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

    ctx.layoutRecorder?.closeNode(this, ctx.currentPageIndex, ctx.currentY, true);
  }

  /**
   * Canonical element type name used for the layout snapshot tree. Defaults to
   * the runtime class name; subclasses may override for a stable spec name.
   */
  public captureType(): string {
    return this.constructor.name;
  }

  /**
   * Optional author-supplied name/key surfaced in the layout snapshot. Unset by
   * default; a future capture API can populate it.
   */
  public get captureName(): string | undefined {
    return this._options.captureName;
  }
  public set captureName(value: string | undefined) {
    this._options = this._options.with('captureName', value);
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
