import { BorderedElementBase } from './BorderedElementBase';
import { IContentContainer } from '../../Fluent/IContentContainer';
import { LayersDescriptor } from '../../Fluent/Descriptors/LayersDescriptor';
import { IElement } from '../IElement';
import { RenderContext } from '../IElement';
import { Thickness } from '../../Core/Thickness';
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
    if (!this.child) return this.padding.top + this.padding.bottom;
    const innerWidth = Math.max(0, contentWidth - this.padding.left - this.padding.right);
    return this.child.measureHeight(innerWidth) + this.padding.top + this.padding.bottom;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    // Draw background (drawBackground is currently a stub in BorderedElementBase)
    if (this.backgroundColor) {
      const totalHeight = this.measureContentHeight(contentWidth);
      this.drawBackground(ctx, ctx.currentX, ctx.currentY, contentWidth, totalHeight, this.backgroundColor);
    }

    if (this.border.hasAnyBorder) {
      const totalHeight = this.measureContentHeight(contentWidth);
      this.drawBorder(ctx, ctx.currentX, ctx.currentY, contentWidth, totalHeight);
    }

    if (!this.child) {
      ctx.currentY += this.padding.top + this.padding.bottom;
      return;
    }

    const originalX = ctx.currentX;
    ctx.currentX += this.padding.left;
    ctx.currentY += this.padding.top;
    const innerWidth = Math.max(0, contentWidth - this.padding.left - this.padding.right);

    this.renderChild(ctx, innerWidth);

    ctx.currentX = originalX;
    ctx.currentY += this.padding.bottom;
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
