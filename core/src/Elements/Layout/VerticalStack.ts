import { ElementBase } from '../ElementBase';
import { IElement, IStatefulElement, RenderStatus, RenderContext } from '../IElement';
import { beginChildTag, endChildTag } from '../../Rendering/Tagging/ChildTagging';
import { captureTypeOf, captureNameOf } from '../../Rendering/LayoutRecorder';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/**
 * A layout element that stacks children vertically with automatic pagination.
 * Implements IStatefulElement to support rendering children that overflow across pages.
 */
/** Settable properties declared by {@link VerticalStack} itself. */
export const VERTICAL_STACK_OWN_OPTION_KEYS = ['spacing'] as const;

/**
 * The full settable *property* surface, base included. `children` is synthetic
 * sugar over {@link VerticalStack.add}, not a property - see
 * `HORIZONTAL_STACK_OPTION_KEYS` for the rationale.
 */
export const VERTICAL_STACK_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...VERTICAL_STACK_OWN_OPTION_KEYS] as const;

/** Options for {@link VerticalStack}. */
export type VerticalStackOptions = ElementOptions & {
  /** Gap between adjacent children. Accepts a length: `8`, `'4mm'`, or `{ value, unit }`. */
  spacing?: LengthInput;
  /** Children to add, in order. Sugar over {@link VerticalStack.add}. */
  children?: IElement[];
};

/** Arranges child elements from top to bottom with configurable spacing. */
export class VerticalStack extends ElementBase implements IStatefulElement {
  private readonly _children: IElement[] = [];
  private lastChildRendered: number = -1;

  /**
   * Spacing between children in points. Default is 0.
   */
  /** Creates an empty vertical stack. */
  constructor();
  /** Creates a vertical stack configured in one expression. */
  constructor(options: VerticalStackOptions);
  constructor(options?: VerticalStackOptions) {
    super();
    const { children, ...rest } = options ?? {};
    applyOptions(this, rest);
    if (children !== undefined) {
      for (const child of children) this.add(child);
    }
  }

  private _spacing: number = 0;

  /**
   * Uniform gap between adjacent children.
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
   * The children elements in this stack (exposed for collection initializer syntax)
   */
  public get children(): IElement[] {
    return this._children;
  }

  /** @inheritdoc */
  public getChildren(): readonly IElement[] {
    return this._children;
  }

  /** Adds a child element to this stack. */
  public add(child: IElement): void {
    this._children.push(child);
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

    if (startChild >= this._children.length) {
      ctx.currentX = originalX;
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    for (let i = startChild; i < this._children.length; i++) {
      const child = this._children[i];

      // Tag children that declare a semantic role. Uses the same try/finally
      // pattern as PdfRenderPipeline so tagging is closed before
      // Overflow/WrapRequired propagates upward.
      const token = beginChildTag(ctx, child);

      try {
        if ('renderStateful' in child) {
          const statefulChild = child as IStatefulElement;

          // Keep-together only when the child asks for it. A stateful child
          // that allows breaking splits across the boundary instead (spec
          // "Layout & Pagination" §6.3); applying this to every child
          // unconditionally made `breakAllowed` a no-op here and diverged from
          // the .NET pipeline, which has always gated on it.
          if (child instanceof ElementBase && !child.breakAllowed) {
            const childHeight = child.measureHeight(contentWidth);
            const wouldOverflow = ctx.currentY + childHeight > ctx.maxY;
            const notAtTop = ctx.currentY > ctx.contentTop;
            const wouldFitOnFreshPage = childHeight <= ctx.contentHeight;

            if (wouldOverflow && notAtTop && wouldFitOnFreshPage) {
              ctx.currentX = originalX;
              return i === startChild ? RenderStatus.WrapRequired : RenderStatus.Overflow;
            }
            // At the top of a page, or too large for any page: fall through and
            // render anyway.
          }

          // Layout capture: open the child node before rendering its segment.
          // Coalesced across page-resumptions by element identity; closed only
          // when the child reports Complete.
          ctx.layoutRecorder?.openNode(
            child,
            captureTypeOf(child),
            captureNameOf(child),
            ctx.currentPageIndex,
            ctx.currentX,
            ctx.currentY,
            contentWidth
          );

          const status = statefulChild.renderStateful(ctx, contentWidth);

          ctx.layoutRecorder?.closeNode(child, ctx.currentPageIndex, ctx.currentY, status === RenderStatus.Complete);

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

          if (this.spacing > 0 && i < this._children.length - 1) {
            ctx.currentY += this.spacing;
          }

          if (i < this._children.length - 1 && ctx.currentY >= ctx.maxY) {
            ctx.currentX = originalX;
            return RenderStatus.Overflow;
          }
        } else {
          const childHeight = child.measureHeight(contentWidth);
          const wouldOverflow = ctx.currentY + childHeight > ctx.maxY;
          const notAtTop = ctx.currentY > ctx.contentTop;

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

          if (this.spacing > 0 && i < this._children.length - 1) {
            ctx.currentY += this.spacing;
          }
        }
      } finally {
        endChildTag(ctx, token);
      }
    }

    ctx.currentX = originalX;
    ctx.currentY += this.margin.bottom;
    this.lastChildRendered = this._children.length - 1;
    return RenderStatus.Complete;
  }

  /**
   * Resets the internal state, preparing the element for a fresh render.
   * Also resets state of all stateful children.
   */
  public resetState(): void {
    this.lastChildRendered = -1;
    for (const child of this._children) {
      if ('resetState' in child) {
        (child as IStatefulElement).resetState();
      }
    }
  }

  protected getPreferredContentWidth(): number {
    if (this._children.length === 0) return 0;
    return Math.max(...this._children.map(c => c.getPreferredWidth()));
  }

  protected measureContentHeight(contentWidth: number): number {
    let totalHeight = 0;
    for (const child of this._children) {
      totalHeight += child.measureHeight(contentWidth);
    }
    if (this._children.length > 1 && this.spacing > 0) {
      totalHeight += (this._children.length - 1) * this.spacing;
    }
    return totalHeight;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    // Non-stateful fallback - renders all children without pagination.
    // Used when VerticalStack is a child of Container or another element
    // that calls child.render() directly. Children are still tagged so a
    // role-bearing leaf nested under a non-paginating container is not left
    // as untagged content (PDF/UA 7.1).
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      const token = beginChildTag(ctx, child);
      try {
        // Stateless (atomic) render of each child, matching the .NET reference
        // (VerticalStack.cs RenderContent → child.Render). Only the top-level
        // RenderStateful path drives stateful continuation; using it here would
        // set one-shot flags on nested elements that nothing resets, collapsing
        // content on a second export pass.
        const yBefore = ctx.currentY;
        child.render(ctx, contentWidth);
        // Some children (Container, Image) do not advance Y themselves.
        if (ctx.currentY === yBefore) ctx.currentY += child.measureHeight(contentWidth);
        // `spacing` has to be consumed here as well as on the stateful path:
        // measureHeight() reserves (n-1) * spacing regardless of which path
        // renders, so skipping it here leaves the children bunched together and
        // dumps the reserved space as a gap below the stack.
        if (this.spacing > 0 && i < this._children.length - 1) ctx.currentY += this.spacing;
      } finally {
        endChildTag(ctx, token);
      }
    }
  }
}
