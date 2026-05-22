import { ElementBase } from '../ElementBase';
import { IElement, IStatefulElement, RenderStatus, RenderContext } from '../IElement';
import { HorizontalAlignment } from '../../Core/HorizontalAlignment';
import { WidthDistribution } from './WidthDistribution';
import { isRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { isAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { toPdfTag } from '../../Rendering/Tagging/SemanticRole';

/**
 * A layout element that stacks children vertically with automatic pagination.
 * Implements IStatefulElement to support rendering children that overflow across pages.
 */
export class VerticalStack extends ElementBase implements IStatefulElement {
  private readonly children: IElement[] = [];
  private lastChildRendered: number = -1;

  /**
   * Spacing between children in points. Default is 0.
   */
  public spacing: number = 0;

  /**
   * The children elements in this stack (exposed for collection initializer syntax)
   */
  public get Children(): IElement[] {
    return this.children;
  }

  public addChild(child: IElement): void {
    this.children.push(child);
  }

  /**
   * Renders this vertical stack with state tracking for pagination.
   * Children that implement IStatefulElement will be rendered with overflow support.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (this.lastChildRendered < 0) {
      ctx.currentY += this.margin.top;
    }

    const contentWidth = width - this.margin.left - this.margin.right;
    const originalX = ctx.currentX;
    ctx.currentX += this.margin.left;

    const startChild = this.lastChildRendered + 1;

    if (startChild >= this.children.length) {
      ctx.currentX = originalX;
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    for (let i = startChild; i < this.children.length; i++) {
      const child = this.children[i];

      // Tag children that declare a semantic role. Uses the same try/finally
      // pattern as PdfRenderPipeline so tagging is closed before
      // Overflow/WrapRequired propagates upward.
      const tagging = ctx.tagging;
      const tagChild = tagging != null && isRoleProvider(child);
      if (tagChild) {
        const role = child.semanticRole;
        const elem = tagging!.tree.begin(role);
        if (isAltTextProvider(child) && child.altText) tagging!.tree.setAlt(child.altText);
        // Wire LinkedStructElement for Hyperlink children.
        if ('linkedStructElement' in child) (child as any).linkedStructElement = elem;
        ctx.canvas.beginMarkedContent(toPdfTag(role));
      }

      try {
        if ('renderStateful' in child) {
          const statefulChild = child as IStatefulElement;

          const childHeight = child.measureHeight(contentWidth);
          const wouldOverflow = ctx.currentY + childHeight > ctx.maxY;
          const notAtTop = ctx.currentY > ctx.margin;
          const wouldFitOnFreshPage = childHeight <= ctx.maxY - ctx.margin;

          if (wouldOverflow && notAtTop && wouldFitOnFreshPage) {
            ctx.currentX = originalX;
            return i === startChild ? RenderStatus.WrapRequired : RenderStatus.Overflow;
          }

          const status = statefulChild.renderStateful(ctx, contentWidth);

          if (status === RenderStatus.Overflow) {
            this.lastChildRendered = i - 1;
            ctx.currentX = originalX;
            return RenderStatus.Overflow;
          }

          if (status === RenderStatus.WrapRequired) {
            this.lastChildRendered = i - 1;
            ctx.currentX = originalX;
            return i === startChild ? RenderStatus.WrapRequired : RenderStatus.Overflow;
          }

          this.lastChildRendered = i;

          if (this.spacing > 0 && i < this.children.length - 1) {
            ctx.currentY += this.spacing;
          }

          if (i < this.children.length - 1 && ctx.currentY >= ctx.maxY) {
            ctx.currentX = originalX;
            return RenderStatus.Overflow;
          }
        } else {
          const childHeight = child.measureHeight(contentWidth);
          const wouldOverflow = ctx.currentY + childHeight > ctx.maxY;
          const notAtTop = ctx.currentY > ctx.margin;

          if (wouldOverflow && notAtTop) {
            ctx.currentX = originalX;
            return i === startChild ? RenderStatus.WrapRequired : RenderStatus.Overflow;
          }

          const yBefore = ctx.currentY;
          child.render(ctx, contentWidth);

          if (ctx.currentY === yBefore) {
            ctx.currentY += childHeight;
          }

          this.lastChildRendered = i;

          if (this.spacing > 0 && i < this.children.length - 1) {
            ctx.currentY += this.spacing;
          }
        }
      } finally {
        if (tagChild) {
          ctx.canvas.endMarkedContent();
          tagging!.tree.end();
        }
      }
    }

    ctx.currentX = originalX;
    ctx.currentY += this.margin.bottom;
    this.lastChildRendered = this.children.length - 1;
    return RenderStatus.Complete;
  }

  /**
   * Resets the internal state, preparing the element for a fresh render.
   * Also resets state of all stateful children.
   */
  public resetState(): void {
    this.lastChildRendered = -1;
    for (const child of this.children) {
      if ('resetState' in child) {
        (child as IStatefulElement).resetState();
      }
    }
  }

  protected getPreferredContentWidth(): number {
    if (this.children.length === 0) return 0;
    return Math.max(...this.children.map(c => c.getPreferredWidth()));
  }

  protected measureContentHeight(contentWidth: number): number {
    let totalHeight = 0;
    for (const child of this.children) {
      totalHeight += child.measureHeight(contentWidth);
    }
    if (this.children.length > 1 && this.spacing > 0) {
      totalHeight += (this.children.length - 1) * this.spacing;
    }
    return totalHeight;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    // Non-stateful fallback — renders all children without pagination.
    // Used when VerticalStack is a child of Container or another element
    // that calls child.render() directly.
    for (const child of this.children) {
      if ('renderStateful' in child && typeof (child as any).renderStateful === 'function') {
        (child as any).renderStateful(ctx, contentWidth);
      } else {
        child.render(ctx, contentWidth);
      }
    }
  }
}
