import { toElement } from '../../Normalize/toElement';
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
import { toLength, type LengthInput, toOptionalLength } from '../../Normalize/toLength';

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
  Partial<
    Omit<Pick<HorizontalStack, HorizontalStackOwnKey>, 'alignment' | 'widthDistribution' | 'spacing' | 'height'>
  > & {
    /** Gap between adjacent columns. Accepts a length: `10`, `'4mm'`, or `{ value, unit }`. */
    spacing?: LengthInput;
    /** Fixed row height. Accepts a length: `120`, `'1in'`, or `{ value, unit }`. */
    height?: LengthInput;
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

/** Arranges child elements from left to right with configurable spacing and width distribution. */
export class HorizontalStack extends ElementBase implements IStatefulElement {
  private readonly _children: IElement[] = [];
  private readonly widths: (number | null)[] = [];
  private rendered: boolean = false;

  // While a row is split across pages: how many fragments are drawn, and which items have finished.
  private _fragments = 0;
  private _done: boolean[] | undefined = undefined;

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

  private _spacing: number = 10;

  /**
   * Uniform gap between adjacent columns.
   *
   * Accepts a length: a number of points, `'4mm'`, or `{ value, unit }` (§4A.3).
   */
  public get spacing(): number {
    return this._spacing;
  }
  public set spacing(value: LengthInput) {
    this._spacing = toLength(value);
  }
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
  private _height?: number;

  /**
   * Optional fixed height for the stack. If null, height is determined by the tallest child.
   *
   * Accepts a length: a number of points, `'1in'`, or `{ value, unit }` (§4A.3).
   */
  public get height(): number | undefined {
    return this._height;
  }
  public set height(value: LengthInput | undefined) {
    this._height = toOptionalLength(value);
  }

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
  public add(child: IElement | string | readonly string[]): void;
  /**
   * Adds a child element to this stack with a specific weight (only used when WidthDistribution is Weighted)
   */
  public add(child: IElement | string | readonly string[], weight: number | null): void;
  public add(child: IElement | string | readonly string[], weight?: number | null): void {
    this._children.push(toElement(child));
    this.widths.push(weight ?? null);
  }

  /**
   * Renders this horizontal stack with state tracking for pagination.
   * A row that fits is drawn whole. A row that does not fit, and has an item that can split across pages
   * (a table, a column, a paragraph), splits: each page carries the next piece of every unfinished item,
   * side by side from the same top, until all are done. A row of items that cannot split moves to a
   * fresh page as a whole.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (this._fragments === 0) {
      if (this.rendered) {
        return RenderStatus.Complete;
      }

      const contentWidth = this.getContentWidth(width);
      const contentHeight = this.measureContentHeight(contentWidth);
      const totalHeight = contentHeight + this.margin.top + this.margin.bottom;

      const wouldOverflow = ctx.currentY + totalHeight > ctx.maxY;
      const notAtTop = ctx.currentY > ctx.contentTop;

      if (!wouldOverflow || !this.canSplit) {
        if (wouldOverflow && notAtTop) {
          // Doesn't fit but would fit on a fresh page - request new page
          return RenderStatus.WrapRequired;
        }

        // Fits on this page, or we're at top of page (render anyway to avoid infinite loop)
        this.render(ctx, width);
        this.rendered = true;
        return RenderStatus.Complete;
      }
    }

    return this.renderFragment(ctx, width);
  }

  private get canSplit(): boolean {
    return this.height === undefined && this._children.some(c => 'renderStateful' in c);
  }

  private renderFragment(ctx: RenderContext, width: number): RenderStatus {
    const first = this._fragments === 0;
    const done = (this._done ??= new Array<boolean>(this._children.length).fill(false));
    const entryX = ctx.currentX;
    const entryY = ctx.currentY;

    const [childWidths] = this.calculateChildWidths(this.getContentWidth(width));
    if (first) ctx.currentY += this.margin.top;
    const startY = ctx.currentY;
    let x = ctx.currentX + this.margin.left + (this.isRightToLeft ? this.getContentWidth(width) : 0);
    let endY = startY;
    let progress = false;
    let allDone = true;

    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      if (this.isRightToLeft) x -= childWidths[i];
      if (!done[i]) {
        ctx.currentX = x;
        ctx.currentY = startY;
        const token = beginChildTag(ctx, child);
        try {
          if ('renderStateful' in child) {
            const status = (child as IStatefulElement).renderStateful(ctx, childWidths[i]);
            if (status !== RenderStatus.WrapRequired) {
              progress ||= status === RenderStatus.Complete || ctx.currentY > startY;
              endY = Math.max(endY, ctx.currentY);
            }

            if (status === RenderStatus.Complete) done[i] = true;
          } else {
            // An item that cannot split is drawn once, with the first piece.
            child.render(ctx, childWidths[i]);
            endY = Math.max(endY, startY + child.measureHeight(childWidths[i]));
            progress = true;
            done[i] = true;
          }
        } finally {
          endChildTag(ctx, token);
        }
      }

      if (!done[i]) allDone = false;
      x += this.isRightToLeft ? -this.spacing : childWidths[i] + this.spacing;
    }

    ctx.currentX = entryX;

    if (!progress) {
      // Nothing fitted on this page: the caller starts a fresh page and asks again.
      ctx.currentY = entryY;
      return RenderStatus.WrapRequired;
    }

    ctx.currentY = endY;
    if (allDone) {
      ctx.currentY += this.margin.bottom;
      this.rendered = true;
      this._fragments = 0;
      this._done = undefined;
      return RenderStatus.Complete;
    }

    this._fragments++;
    return RenderStatus.Overflow;
  }

  /**
   * Resets the internal state, preparing the element for a fresh render.
   */
  public resetState(): void {
    this.rendered = false;
    this._fragments = 0;
    this._done = undefined;
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
    let offset = 0;

    // Render each child
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      const childWidth = childWidths[i];
      ctx.currentX = originalX + (this.isRightToLeft ? contentWidth - offset - childWidth : offset);
      const childHeight = childHeights[i];

      // Calculate vertical offset based on alignment
      let verticalOffset = 0;
      if (this.alignment === HorizontalAlignment.Center) {
        verticalOffset = (maxHeight - childHeight) / 2;
      } else if (this.alignment === HorizontalAlignment.End) {
        verticalOffset = maxHeight - childHeight;
      }
      // Stretch keeps the child's measured height because IElement does not expose
      // a mutable height; children that support stretching derive it from their width.

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
      offset += childWidth + this.spacing;
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
