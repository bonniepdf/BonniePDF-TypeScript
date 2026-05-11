import { ElementBase } from '../ElementBase';
import { IElement, IStatefulElement, RenderStatus, RenderContext } from '../IElement';
import { HorizontalAlignment } from '../../Core/HorizontalAlignment';
import { WidthDistribution } from './WidthDistribution';

/**
 * A layout element that arranges children horizontally with spacing and alignment options
 */
export class HorizontalStack extends ElementBase implements IStatefulElement {
  private readonly children: IElement[] = [];
  private readonly widths: (number | null)[] = [];
  private rendered: boolean = false;

  /**
   * Spacing between children (in points)
   */
  public spacing: number = 10;
  /**
   * Horizontal alignment of children within the stack
   */
  public alignment: HorizontalAlignment = HorizontalAlignment.Start;
  /**
   * Width distribution mode for children
   */
  public widthDistribution: WidthDistribution = WidthDistribution.Auto;
  /**
   * Optional fixed height for the stack. If null, height is determined by the tallest child.
   */
  public height?: number;

  /**
   * The children elements in this stack (exposed for collection initializer syntax)
   */
  public get Children(): IElement[] {
    return this.children;
  }

  /**
   * Adds a child element to this stack with auto width
   */
  public addChild(child: IElement): void;
  /**
   * Adds a child element to this stack with a specific width (only used when WidthDistribution is Weighted)
   */
  public addChild(child: IElement, width: number | null): void;
  public addChild(child: IElement, width?: number | null): void {
    this.children.push(child);
    this.widths.push(width ?? null);
  }

  /**
   * Renders this horizontal stack with state tracking for pagination.
   * HorizontalStack is treated as atomic - all children render together on one page.
   * If the stack doesn't fit, it requests a new page rather than splitting.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (this.rendered) {
      return RenderStatus.Complete;
    }

    const contentWidth = this.getContentWidth(width);
    const contentHeight = this.measureContentHeight(contentWidth);
    const totalHeight = contentHeight + this.margin.top + this.margin.bottom;

    const wouldOverflow = ctx.currentY + totalHeight > ctx.maxY;
    const notAtTop = ctx.currentY > ctx.margin;

    if (wouldOverflow && notAtTop) {
      // Doesn't fit but would fit on a fresh page - request new page
      return RenderStatus.WrapRequired;
    }

    // Fits on this page, or we're at top of page (render anyway to avoid infinite loop)
    this.render(ctx, width);
    this.rendered = true;
    return RenderStatus.Complete;
  }

  /**
   * Resets the internal state, preparing the element for a fresh render.
   */
  public resetState(): void {
    this.rendered = false;
    for (const child of this.children) {
      if ('resetState' in child) {
        (child as IStatefulElement).resetState();
      }
    }
  }

  protected getPreferredContentWidth(): number {
    if (this.children.length === 0) return 0;

    if (this.widthDistribution === WidthDistribution.Equal) {
      // For equal distribution, return 0 to indicate flexible sizing
      return 0;
    }

    // Sum up fixed widths where specified
    let totalFixedWidth = 0;
    for (let i = 0; i < this.children.length; i++) {
      const w = this.widths[i];
      if (w !== null) {
        totalFixedWidth += w;
      }
    }

    if (totalFixedWidth > 0) {
      return totalFixedWidth;
    }

    // Fallback: sum of preferred widths
    return this.children.reduce((sum, child) => sum + child.getPreferredWidth(), 0);
  }

  protected measureContentHeight(contentWidth: number): number {
    if (this.height !== undefined) {
      return this.height;
    }

    const [childWidths] = this.calculateChildWidths(contentWidth);
    let maxHeight = 0;
    for (let i = 0; i < this.children.length; i++) {
      const childHeight = this.children[i].measureHeight(childWidths[i]);
      if (childHeight > maxHeight) {
        maxHeight = childHeight;
      }
    }
    return maxHeight;
  }

   protected renderContent(ctx: RenderContext, contentWidth: number): void {
     const [childWidths, totalSpacing] = this.calculateChildWidths(contentWidth);

     // Calculate maximum height for alignment
     let maxHeight = this.height ?? 0;
     const childHeights: number[] = new Array(this.children.length);

     for (let i = 0; i < this.children.length; i++) {
       childHeights[i] = this.children[i].measureHeight(childWidths[i]);
       if (!this.height && childHeights[i] > maxHeight) {
         maxHeight = childHeights[i];
       }
     }

    const originalX = ctx.currentX;

    // Render each child
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const childWidth = childWidths[i];
      const childHeight = childHeights[i];

      // Calculate vertical offset based on alignment
      let verticalOffset = 0;
      if (this.alignment === HorizontalAlignment.Center) {
        verticalOffset = (maxHeight - childHeight) / 2;
      } else if (this.alignment === HorizontalAlignment.End) {
        verticalOffset = maxHeight - childHeight;
      }
      // Note: Stretch is not implemented for horizontal stack as it would require
      // modifying the child's height, which is not supported by the IElement interface

      // Save state and render child
      const yBefore = ctx.currentY;
      ctx.currentY += verticalOffset;

      child.render(ctx, childWidth);

      ctx.currentY = yBefore;
      ctx.currentX += childWidth + this.spacing;
    }

    // Restore original X and advance Y by max height
    ctx.currentX = originalX;
    ctx.currentY += maxHeight;
  }

  private calculateChildWidths(availableWidth: number): [number[], number] {
    const childWidths: number[] = [];
    const totalSpacing = this.children.length > 0 ? (this.children.length - 1) * this.spacing : 0;
    const availableForChildren = availableWidth - totalSpacing;

    if (this.children.length === 0) {
      return [childWidths, totalSpacing];
    }

    switch (this.widthDistribution) {
      case WidthDistribution.Equal: {
        const equalWidth = availableForChildren / this.children.length;
        for (let i = 0; i < this.children.length; i++) {
          childWidths.push(equalWidth);
        }
        break;
      }

      case WidthDistribution.Weighted: {
        let usedSpace = 0;
        let totalWeight = 0;
        const calculatedWidths: number[] = new Array(this.children.length);
        const isWeighted: boolean[] = new Array(this.children.length);

        // Pass 1: Measure Auto/Fixed elements (null weight) and sum weights
        for (let i = 0; i < this.children.length; i++) {
          const weight = this.widths[i];
          if (weight !== null && weight > 0) {
            totalWeight += weight;
            isWeighted[i] = true;
          } else {
            // Auto size (weight is null or 0)
            const w = this.children[i].getPreferredWidth();
            calculatedWidths[i] = w;
            usedSpace += w;
            isWeighted[i] = false;
          }
        }

        let remainingSpace = availableForChildren - usedSpace;
        if (remainingSpace < 0) remainingSpace = 0;

        // Pass 2: Distribute remaining space to weighted children
        for (let i = 0; i < this.children.length; i++) {
          if (isWeighted[i]) {
            const weight = this.widths[i]!;
            calculatedWidths[i] = (weight / totalWeight) * remainingSpace;
          }
        }

        childWidths.push(...calculatedWidths);
        break;
      }

      case WidthDistribution.Auto:
      default: {
        let totalPreferredWidth = 0;
        const preferredWidths: number[] = new Array(this.children.length);

        for (let i = 0; i < this.children.length; i++) {
          preferredWidths[i] = this.children[i].getPreferredWidth();
          if (preferredWidths[i] === 0) {
            // Fallback for elements that don't report width
            preferredWidths[i] = availableForChildren / this.children.length;
          }
          totalPreferredWidth += preferredWidths[i];
        }

        if (totalPreferredWidth <= availableForChildren) {
          childWidths.push(...preferredWidths);
        } else {
          const scale = availableForChildren / totalPreferredWidth;
          for (let i = 0; i < this.children.length; i++) {
            childWidths.push(preferredWidths[i] * scale);
          }
        }
        break;
      }
    }

    return [childWidths, totalSpacing];
  }
}
