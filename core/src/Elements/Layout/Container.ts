import { BorderedElementBase } from './BorderedElementBase';
import { IContentContainer } from '../../Fluent/IContentContainer';
import { IElement } from '../IElement';
import { RenderContext } from '../IElement';
import { Thickness } from '../../Core/Thickness';

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

  constructor() {
    super();
    this.padding = new Thickness(0);
  }

  protected getPreferredContentWidth(): number {
    if (this.width !== undefined) {
      return this.width;
    }
    const childWidth = this.child?.getPreferredWidth() ?? 0;
    return childWidth + this.padding.left + this.padding.right + this.border.horizontalWidth;
  }

  protected measureContentHeight(contentWidth: number): number {
    if (!this.child) return this.padding.top + this.padding.bottom;
    const innerWidth = Math.max(0, contentWidth - this.padding.left - this.padding.right);
    return this.child.measureHeight(innerWidth) + this.padding.top + this.padding.bottom;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    if (!this.child) return;

    // Draw background (drawBackground is currently a stub in BorderedElementBase)
    if (this.backgroundColor) {
      const totalHeight = this.measureContentHeight(contentWidth);
      this.drawBackground(ctx, ctx.currentX, ctx.currentY, contentWidth, totalHeight, this.backgroundColor);
    }

    if (this.border.hasAnyBorder) {
      const totalHeight = this.measureContentHeight(contentWidth);
      this.drawBorder(ctx, ctx.currentX, ctx.currentY, contentWidth, totalHeight);
    }

    const originalX = ctx.currentX;
    ctx.currentX += this.padding.left;
    ctx.currentY += this.padding.top;
    const innerWidth = Math.max(0, contentWidth - this.padding.left - this.padding.right);

    // Use renderStateful when available (VerticalStack, Table, etc.)
    if ('renderStateful' in this.child && typeof (this.child as any).renderStateful === 'function') {
      (this.child as any).renderStateful(ctx, innerWidth);
    } else {
      this.child.render(ctx, innerWidth);
    }

    ctx.currentX = originalX;
    ctx.currentY += this.padding.bottom;
  }
}
