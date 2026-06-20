import { BorderedElementBase } from './BorderedElementBase';
import { IContentContainer } from '../../Fluent/IContentContainer';
import { LayersDescriptor } from '../../Fluent/Descriptors/LayersDescriptor';
import { IElement } from '../IElement';
import { RenderContext } from '../IElement';
import { Thickness } from '../../Core/Thickness';
import { HorizontalAlignment } from '../../Core/HorizontalAlignment';
import { beginChildTag, endChildTag } from '../../Rendering/Tagging/ChildTagging';

/**
 * A container element that supports padding, background color, and borders.
 * Implements IContentContainer to participate in fluent API chains.
 */
export class Container extends BorderedElementBase implements IContentContainer {
  public child?: IElement;
  /**
   * Padding inside the container, inside the border
   */
  public padding: Thickness;
  /**
   * Optional fixed width for the container (null = use available width)
   */
  public width?: number;
  /**
   * Optional fixed height for the container (null = auto-size based on content)
   */
  public height?: number;

  /**
   * When `true` and {@link BorderedElementBase.cornerRadius} is positive, the
   * container's content (background, border, and child) is clipped to the
   * rounded-rectangle outline. This is what turns a rounded background
   * into a true rounded-corner card: a full-bleed image or any overflowing child
   * is masked to the rounded box rather than spilling past the corners. Defaults
   * to `false`, so setting `cornerRadius` alone keeps the historical behaviour of
   * a rounded fill/stroke with un-clipped content.
   */
  public clipContent = false;

  /**
   * Horizontal alignment of the child within the container's available width
   * (`AlignCenter`/`AlignRight`/`AlignLeft`). When the child is
   * narrower than the container, it is positioned accordingly; otherwise it
   * fills the width as before. `undefined`/`Start` keep the default left
   * placement. `Stretch` is treated as "fill" (no offset).
   */
  public horizontalAlignment?: HorizontalAlignment;

  constructor() {
    super();
    this.padding = new Thickness(0);
  }

  /**
   * Fills this container with an inline z-stack. Layers paint in
   * declaration order: `background` behind, `primaryLayer` in the middle (it
   * sets the flow height), and `foreground` on top.
   *
   * ```typescript
   * new Container().layers(layers => layers
   *   .background(Image.load('card-bg.jpg'))
   *   .foreground(new TextBlock('Horizon Ventures')));
   * ```
   */
  public layers(configure: (layers: LayersDescriptor) => void): Container {
    const descriptor = new LayersDescriptor();
    configure(descriptor);
    this.child = descriptor.build();
    return this;
  }

  protected getPreferredContentWidth(): number {
    if (this.width !== undefined) {
      return this.width;
    }
    const childWidth = this.child?.getPreferredWidth() ?? 0;
    return childWidth + this.padding.left + this.padding.right + this.border.horizontalWidth;
  }

  protected measureContentHeight(contentWidth: number): number {
    // A fixed height wins outright.
    if (this.height !== undefined) return this.height;

    // Use the fixed width if specified, otherwise the available width.
    const effectiveWidth = this.width ?? contentWidth;
    const childContentWidth = effectiveWidth - this.padding.left - this.padding.right - this.border.horizontalWidth;

    const childHeight = this.child ? this.child.measureHeight(childContentWidth) : 0;
    return childHeight + this.padding.top + this.padding.bottom + this.border.verticalWidth;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    // Use the fixed width/height if specified, otherwise size to content.
    const effectiveWidth = this.width ?? contentWidth;
    const containerHeight = this.height ?? this.measureContentHeight(effectiveWidth);

    // Pagination: if the whole container would not fit and we are not already at
    // the top of the page, break first so the border/background stay intact.
    if (ctx.currentY + containerHeight > ctx.maxY && ctx.currentY > ctx.margin) {
      ctx.newPage();
    }

    // Rounded-corner clipping: mask the background, border, and child to
    // the rounded outline. Opened here and closed in the finally so the early
    // childless return still balances the clip. The canvas methods are optional;
    // a canvas that doesn't support clipping simply leaves the content un-masked.
    const clip = this.clipContent && this.cornerRadius > 0;
    if (clip) {
      ctx.canvas.beginRoundedClip?.(ctx.currentX, ctx.currentY, effectiveWidth, containerHeight, this.cornerRadius);
    }

    try {
      this.renderClippedContent(ctx, effectiveWidth, containerHeight);
    } finally {
      if (clip) ctx.canvas.endClip?.();
    }
  }

  private renderClippedContent(ctx: RenderContext, effectiveWidth: number, containerHeight: number): void {
    if (this.backgroundColor) {
      this.drawBackground(ctx, ctx.currentX, ctx.currentY, effectiveWidth, containerHeight, this.backgroundColor);
    }

    if (this.border.hasAnyBorder) {
      this.drawBorder(ctx, ctx.currentX, ctx.currentY, effectiveWidth, containerHeight);
    }

    if (!this.child) {
      ctx.currentY += containerHeight;
      return;
    }

    const originalX = ctx.currentX;
    const yBeforePadding = ctx.currentY;

    ctx.currentX += this.padding.left;
    ctx.currentY += this.padding.top;
    let childWidth = effectiveWidth - this.padding.left - this.padding.right - this.border.horizontalWidth;

    const align = this.horizontalAlignment;
    if (align === HorizontalAlignment.Center || align === HorizontalAlignment.End) {
      const preferred = this.child.getPreferredWidth();
      if (preferred > 0 && preferred < childWidth) {
        const slack = childWidth - preferred;
        ctx.currentX += align === HorizontalAlignment.Center ? slack / 2 : slack;
        childWidth = preferred;
      }
    }

    const yBeforeChildRender = ctx.currentY;
    this.renderChild(ctx, childWidth);
    const yAfterChildRender = ctx.currentY;

    ctx.currentX = originalX;

    // If the child did not advance Y (e.g. an absolutely-measured element), advance
    // by its measured height instead.
    if (yAfterChildRender === yBeforeChildRender) {
      const childHeight = this.child.measureHeight(childWidth);
      ctx.currentY = yBeforePadding + this.padding.top + childHeight;
    }

    ctx.currentY += this.padding.bottom;

    // Ensure we advance by at least the full container height (e.g. when an
    // explicit Height is larger than the content).
    const expectedBottom = yBeforePadding + containerHeight;
    if (ctx.currentY < expectedBottom) {
      ctx.currentY = expectedBottom;
    }
  }

  private renderChild(ctx: RenderContext, innerWidth: number): void {
    if (!this.child) return;

    const token = beginChildTag(ctx, this.child);
    try {
      // Render the child statelessly (atomic), matching the .NET reference
      // (Container.cs Child.Render). The stateful continuation path is reserved
      // for top-level page flow driven by the render pipeline; calling
      // renderStateful here instead would set one-shot flags on nested elements
      // that nothing resets, so a second export pass would skip them.
      this.child.render(ctx, innerWidth);
    } finally {
      endChildTag(ctx, token);
    }
  }
}
