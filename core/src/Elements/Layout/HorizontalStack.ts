import { ElementBase } from '../ElementBase';
import { IElement, IStatefulElement, RenderStatus, RenderContext } from '../IElement';
import { HorizontalAlignment } from '../../Core/HorizontalAlignment';
import { WidthDistribution } from './WidthDistribution';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import {
  toHorizontalAlignment,
  toWidthDistribution,
  type HorizontalAlignmentInput,
  type WidthDistributionInput,
} from '../../Normalize/toEnum';
import { beginChildTag, endChildTag } from '../../Rendering/Tagging/ChildTagging';

/**
 * A layout element that arranges children horizontally with spacing and alignment options
 */
/** Settable properties declared by {@link HorizontalStack} itself. */
export const HORIZONTAL_STACK_OWN_OPTION_KEYS = ['spacing', 'alignment', 'widthDistribution', 'height'] as const;

/**
 * The full settable *property* surface, bases included.
 *
 * `children` is deliberately absent: it is a read-only projection over the
 * internal list, and the options bag exposes it as **synthetic sugar** over
 * {@link HorizontalStack.add} rather than as a property. Keeping it out
 * here is what lets the exhaustiveness guard stay meaningful.
 */
export const HORIZONTAL_STACK_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...HORIZONTAL_STACK_OWN_OPTION_KEYS] as const;

type HorizontalStackOwnKey = (typeof HORIZONTAL_STACK_OWN_OPTION_KEYS)[number];

/** Options for {@link HorizontalStack}. */
export type HorizontalStackOptions = ElementOptions &
  Partial<Omit<Pick<HorizontalStack, HorizontalStackOwnKey>, 'alignment' | 'widthDistribution'>> & {
    /** Cross-axis alignment. Accepts `'start' | 'center' | 'end' | 'stretch'`. */
    alignment?: HorizontalAlignmentInput;
    /** Width sharing. Accepts `'equal' | 'weighted' | 'auto'`. */
    widthDistribution?: WidthDistributionInput;
    /**
     * Children to add, in order. Sugar over {@link HorizontalStack.add};
     * use `add(child, weight)` directly when a per-child weight is needed.
     */
    children?: IElement[];
  };

export class HorizontalStack extends ElementBase implements IStatefulElement {
  private readonly _children: IElement[] = [];
  private readonly widths: (number | null)[] = [];
  private rendered: boolean = false;

  /**
   * Spacing between children (in points)
   */
  /** Creates an empty horizontal stack. */
  constructor();
  /** Creates a horizontal stack configured in one expression. */
  constructor(options: HorizontalStackOptions);
  constructor(options?: HorizontalStackOptions) {
    super();
    const { children, ...rest } = options ?? {};
    applyOptions(this, rest);
    if (children !== undefined) {
      for (const child of children) this.add(child);
    }
  }

  public spacing: number = 10;
  /**
   * Horizontal alignment of children within the stack
   */
  private _alignment: HorizontalAlignment = HorizontalAlignment.Start;

  /**
   * Cross-axis alignment. Accepts `'start' | 'center' | 'end' | 'stretch'`.
   */
  public get alignment(): HorizontalAlignment {
    return this._alignment;
  }
  public set alignment(value: HorizontalAlignmentInput) {
    this._alignment = toHorizontalAlignment(value);
  }
  /**
   * Width distribution mode for children
   */
  private _widthDistribution: WidthDistribution = WidthDistribution.Auto;

  /**
   * How available width is shared. Accepts `'equal' | 'weighted' | 'auto'`.
   */
  public get widthDistribution(): WidthDistribution {
    return this._widthDistribution;
  }
  public set widthDistribution(value: WidthDistributionInput) {
    this._widthDistribution = toWidthDistribution(value);
  }
  /**
   * Optional fixed height for the stack. If null, height is determined by the tallest child.
   */
  public height?: number;

  /**
   * The children elements in this stack (exposed for collection initializer syntax)
   */
  public get children(): IElement[] {
    return this._children;
  }

  /** @inheritdoc */
  public getChildren(): readonly IElement[] {
    return this._children;
  }

  /**
   * Adds a child element to this stack with auto width
   */
  public add(child: IElement): void;
  /**
   * Adds a child element to this stack with a specific weight (only used when WidthDistribution is Weighted)
   */
  public add(child: IElement, weight: number | null): void;
  public add(child: IElement, weight?: number | null): void {
    this._children.push(child);
    this.widths.push(weight ?? null);
  }

  /** @deprecated Use {@link add} instead. */
  public addChild(child: IElement): void;
  /** @deprecated Use {@link add} instead. */
  public addChild(child: IElement, weight: number | null): void;
  public addChild(child: IElement, weight?: number | null): void {
    this.add(child, weight ?? null);
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
    for (const child of this._children) {
      if ('resetState' in child) {
        (child as IStatefulElement).resetState();
      }
    }
  }

  protected getPreferredContentWidth(): number {
    if (this._children.length === 0) return 0;

    if (this.widthDistribution === WidthDistribution.Equal) {
      // For equal distribution, return 0 to indicate flexible sizing
      return 0;
    }

    // Sum up fixed widths where specified
    let totalFixedWidth = 0;
    for (let i = 0; i < this._children.length; i++) {
      const w = this.widths[i];
      if (w !== null) {
        totalFixedWidth += w;
      }
    }

    if (totalFixedWidth > 0) {
      return totalFixedWidth;
    }

    // Fallback: sum of preferred widths
    return this._children.reduce((sum, child) => sum + child.getPreferredWidth(), 0);
  }

  protected measureContentHeight(contentWidth: number): number {
    if (this.height !== undefined) {
      return this.height;
    }

    const [childWidths] = this.calculateChildWidths(contentWidth);
    let maxHeight = 0;
    for (let i = 0; i < this._children.length; i++) {
      const childHeight = this._children[i].measureHeight(childWidths[i]);
      if (childHeight > maxHeight) {
        maxHeight = childHeight;
      }
    }
    return maxHeight;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    const [childWidths, _totalSpacing] = this.calculateChildWidths(contentWidth);

    // Calculate maximum height for alignment
    let maxHeight = this.height ?? 0;
    const childHeights: number[] = new Array(this._children.length);

    for (let i = 0; i < this._children.length; i++) {
      childHeights[i] = this._children[i].measureHeight(childWidths[i]);
      if (!this.height && childHeights[i] > maxHeight) {
        maxHeight = childHeights[i];
      }
    }

    const originalX = ctx.currentX;

    // Render each child
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
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

      // Save state and render child. Tag role-bearing children so their
      // content isn't emitted untagged (PDF/UA 7.1) - the stack itself renders
      // children directly rather than via the pipeline.
      const yBefore = ctx.currentY;
      ctx.currentY += verticalOffset;

      const token = beginChildTag(ctx, child);
      try {
        child.render(ctx, childWidth);
      } finally {
        endChildTag(ctx, token);
      }

      ctx.currentY = yBefore;
      ctx.currentX += childWidth + this.spacing;
    }

    // Restore original X and advance Y by max height
    ctx.currentX = originalX;
    ctx.currentY += maxHeight;
  }

  private calculateChildWidths(availableWidth: number): [number[], number] {
    const childWidths: number[] = [];
    const totalSpacing = this._children.length > 0 ? (this._children.length - 1) * this.spacing : 0;
    const availableForChildren = availableWidth - totalSpacing;

    if (this._children.length === 0) {
      return [childWidths, totalSpacing];
    }

    switch (this.widthDistribution) {
      case WidthDistribution.Equal: {
        const equalWidth = availableForChildren / this._children.length;
        for (let i = 0; i < this._children.length; i++) {
          childWidths.push(equalWidth);
        }
        break;
      }

      case WidthDistribution.Weighted: {
        let usedSpace = 0;
        let totalWeight = 0;
        const calculatedWidths: number[] = new Array(this._children.length);
        const isWeighted: boolean[] = new Array(this._children.length);

        // Pass 1: Measure Auto/Fixed elements (null weight) and sum weights
        for (let i = 0; i < this._children.length; i++) {
          const weight = this.widths[i];
          if (weight !== null && weight > 0) {
            totalWeight += weight;
            isWeighted[i] = true;
          } else {
            // Auto size (weight is null or 0)
            const w = this._children[i].getPreferredWidth();
            calculatedWidths[i] = w;
            usedSpace += w;
            isWeighted[i] = false;
          }
        }

        let remainingSpace = availableForChildren - usedSpace;
        if (remainingSpace < 0) remainingSpace = 0;

        // Pass 2: Distribute remaining space to weighted children
        for (let i = 0; i < this._children.length; i++) {
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
        const preferredWidths: number[] = new Array(this._children.length);

        for (let i = 0; i < this._children.length; i++) {
          preferredWidths[i] = this._children[i].getPreferredWidth();
          if (preferredWidths[i] === 0) {
            // Fallback for elements that don't report width
            preferredWidths[i] = availableForChildren / this._children.length;
          }
          totalPreferredWidth += preferredWidths[i];
        }

        if (totalPreferredWidth <= availableForChildren) {
          childWidths.push(...preferredWidths);
        } else {
          const scale = availableForChildren / totalPreferredWidth;
          for (let i = 0; i < this._children.length; i++) {
            childWidths.push(preferredWidths[i] * scale);
          }
        }
        break;
      }
    }

    return [childWidths, totalSpacing];
  }
}
