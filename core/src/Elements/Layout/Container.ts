import { BorderedElementBase } from './BorderedElementBase';
import { IContentContainer } from '../../Fluent/IContentContainer';
import { LayersDescriptor } from '../../Fluent/Descriptors/LayersDescriptor';
import { IElement } from '../IElement';
import { RenderContext } from '../IElement';
import { Thickness } from '../../Core/Thickness';
import { HorizontalAlignment } from '../../Core/HorizontalAlignment';
import { isAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { isRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { isContainerRole, SemanticRole, toPdfTag } from '../../Rendering/Tagging/SemanticRole';

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

    // Horizontal alignment: when the child is narrower than the available inner
    // width, position it within that width rather than always pinning it left.
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

    const tagging = ctx.tagging;
    const childRole = tagging != null && isRoleProvider(this.child) ? this.child.semanticRole : null;
    const isArtifact = childRole === SemanticRole.Artifact;
    const tagChild = childRole != null && !isArtifact;

    if (isArtifact) {
      ctx.canvas.beginArtifact();
    } else if (tagChild) {
      const elem = tagging!.tree.begin(childRole!);
      if (isAltTextProvider(this.child) && this.child.altText) tagging!.tree.setAlt(this.child.altText);
      if ('linkedStructElement' in this.child) (this.child as any).linkedStructElement = elem;
      if (isContainerRole(childRole!)) {
        ctx.canvas.beginContainerContent(toPdfTag(childRole!));
      } else {
        ctx.canvas.beginMarkedContent(toPdfTag(childRole!));
      }
    }

    try {
      if ('renderStateful' in this.child && typeof (this.child as any).renderStateful === 'function') {
        (this.child as any).renderStateful(ctx, innerWidth);
      } else {
        this.child.render(ctx, innerWidth);
      }
    } finally {
      if (isArtifact) {
        ctx.canvas.endArtifact();
      } else if (tagChild) {
        ctx.canvas.endMarkedContent();
        tagging!.tree.end();
      }
    }
  }
}
