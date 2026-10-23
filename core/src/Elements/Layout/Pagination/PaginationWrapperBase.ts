import { ElementBase } from '../../ElementBase';
import { IContentContainer } from '../../IContentContainer';
import { IElement, IStatefulElement, RenderContext, RenderStatus } from '../../IElement';
import { captureTypeOf, captureNameOf } from '../../../Rendering/LayoutRecorder';
import { beginChildTag, endChildTag } from '../../../Rendering/Tagging/ChildTagging';

/**
 * What a pagination primitive decides to do with its child before rendering it
 * on the current page.
 */
export type PaginationDecision =
  /** Render the child here, on this page. */
  | 'render'
  /**
   * Nothing can be rendered on this page; move to a fresh one and ask again.
   * The pipeline turns this into {@link RenderStatus.WrapRequired}.
   */
  | 'wrap'
  /** The child does not appear on this page at all; report completion. */
  | 'skip';

/**
 * Shared behaviour for the single-child pagination primitives
 *.
 *
 * Each primitive is a thin decorator: it decides *whether* and *where* its
 * child renders, and never draws anything itself. The two hooks subclasses
 * implement - {@link decide} before the child renders and {@link settle} after -
 * are enough to express every primitive in the catalogue, which is what keeps
 * them consistent with each other and cheap to mirror in .NET.
 *
 * Margins are applied here rather than by {@link ElementBase.render} because a
 * `wrap` decision has to be taken *before* the cursor moves: a primitive that
 * pushed its top margin onto a page it then abandoned would leave a phantom gap
 * at the bottom of that page.
 */
export abstract class PaginationWrapperBase extends ElementBase implements IContentContainer {
  /** The element whose pagination this primitive governs. */
  public child?: IElement;

  /**
   * True once the child has rendered part of itself and is awaiting a
   * continuation. Underscore-prefixed because it is internal state, not part of
   * the settable options surface.
   */
  protected _pending: boolean = false;

  /** The wrapped child as a one-item list, or an empty list when there is none. */
  public getChildren(): readonly IElement[] {
    return this.child ? [this.child] : [];
  }

  /**
   * Decides what to do with the child on the page the cursor is currently on.
   * Called once per page attempt, before any margin is applied.
   */
  protected abstract decide(ctx: RenderContext, contentWidth: number): PaginationDecision;

  /**
   * Maps the child's own status onto the status this primitive reports.
   * The default passes it through unchanged; primitives that refuse to
   * continue on another page (`ShowEntire`, `StopPaging`) collapse it to
   * {@link RenderStatus.Complete} here.
   */
  protected settle(status: RenderStatus): RenderStatus {
    return status;
  }

  /**
   * Decides whether the child renders on the current page, then renders it and maps its status to the status this wrapper reports.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (!this._pending) {
      const decision = this.decide(ctx, this.getContentWidth(width));
      if (decision === 'wrap') return RenderStatus.WrapRequired;
      if (decision === 'skip') return RenderStatus.Complete;
    }

    this.startingY = ctx.currentY;
    const originalX = ctx.currentX;

    if (!this._pending) ctx.currentY += this.margin.top;
    ctx.currentX += this.margin.left;

    const contentWidth = this.getContentWidth(width);
    let status: RenderStatus;
    try {
      this.openChildNode(ctx, contentWidth);
      const raw = this.driveChild(ctx, contentWidth);
      // Settle before closing the capture node: a primitive that refuses to
      // continue (ShowEntire, StopPaging) has finished with its child, so the
      // node must close complete or the recorder drops its rect entirely.
      status = this.settle(raw);
      this.closeChildNode(ctx, status === RenderStatus.Complete);
      this.afterChild(ctx);
    } finally {
      ctx.currentX = originalX;
    }

    if (status === RenderStatus.Complete) {
      ctx.currentY += this.margin.bottom;
      this._pending = false;
      this.resetChildState();
    } else {
      this._pending = true;
    }

    return status;
  }

  /**
   * Renders one page's worth of the child, honouring its statefulness.
   *
   * Mirrors `VerticalStack`'s child-driving loop, including the "advance the
   * cursor ourselves if the child did not" rule that atomic elements rely on.
   * Capture bookkeeping is the caller's job, so that the node can be closed
   * against the *settled* status rather than the child's raw one.
   */
  protected driveChild(ctx: RenderContext, contentWidth: number): RenderStatus {
    const child = this.child;
    if (!child) return RenderStatus.Complete;

    // The wrapper declares no role of its own, so the child's semantics (a heading, a
    // figure, a table) must be opened here, as every other layout container does for
    // its children. Without it a wrapped heading drops out of the structure tree.
    const token = beginChildTag(ctx, child);
    try {
      if (isStateful(child)) return child.renderStateful(ctx, contentWidth);

      const before = ctx.currentY;
      child.render(ctx, contentWidth);
      if (ctx.currentY === before) ctx.currentY += child.measureHeight(contentWidth);
      return RenderStatus.Complete;
    } finally {
      endChildTag(ctx, token);
    }
  }

  /**
   * Runs once the child has rendered and its capture node has closed.
   *
   * The hook exists so a primitive can adjust the flow cursor without
   * falsifying the layout snapshot: `Unconstrained` rewinds the cursor here, so
   * the captured rect still records where the child actually drew.
   */
  protected afterChild(_ctx: RenderContext): void {
    // Nothing by default.
  }

  /** Opens the child's layout-capture node, if capture is on and a child exists. */
  private openChildNode(ctx: RenderContext, contentWidth: number): void {
    const child = this.child;
    if (!child || !ctx.layoutRecorder) return;
    ctx.layoutRecorder.openNode(
      child,
      captureTypeOf(child),
      captureNameOf(child),
      ctx.currentPageIndex,
      ctx.currentX,
      ctx.currentY,
      contentWidth
    );
  }

  /** Closes the child's layout-capture node against the settled status. */
  private closeChildNode(ctx: RenderContext, complete: boolean): void {
    const child = this.child;
    if (!child || !ctx.layoutRecorder) return;
    ctx.layoutRecorder.closeNode(child, ctx.currentPageIndex, ctx.currentY, complete);
  }

  /** Clears any continuation state the child accumulated, as the pipeline does. */
  protected resetChildState(): void {
    const child = this.child;
    if (child && isStateful(child) && typeof child.resetState === 'function') child.resetState();
  }

  /** Clears the continuation state of this wrapper and of its child. */
  public resetState(): void {
    this._pending = false;
    this.resetChildState();
  }

  protected measureContentHeight(contentWidth: number): number {
    return this.child ? this.child.measureHeight(contentWidth) : 0;
  }

  protected getPreferredContentWidth(): number {
    return this.child ? this.child.getPreferredWidth() : 0;
  }

  /**
   * Atomic render path, used where the caller does not drive statuses - page
   * templates and the page background / foreground slots.
   *
   * The decision still applies, so a conditional primitive suppresses its child
   * there too; `wrap` degrades to `render`, because a template has no flow to
   * break. Note that a template's *reserved height* is measured without a page
   * context, so a conditional inside one reserves its child's height on every
   * page even where the child is suppressed - prefer returning `undefined` from
   * the template function itself when the reservation matters.
   */
  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    if (this.decide(ctx, contentWidth) === 'skip') return;
    this.openChildNode(ctx, contentWidth);
    this.driveChild(ctx, contentWidth);
    this.closeChildNode(ctx, true);
    this.afterChild(ctx);
  }

  /** Body height still available below the cursor on the current page. */
  protected remainingHeight(ctx: RenderContext): number {
    return ctx.maxY - ctx.currentY;
  }

  /** True when content already occupies the current page, so a break gains space. */
  protected canGainSpaceByBreaking(ctx: RenderContext): boolean {
    return ctx.currentY > ctx.contentTop;
  }
}

/** True when the element supports stateful rendering across page boundaries. */
function isStateful(element: IElement): element is IStatefulElement {
  return typeof (element as Partial<IStatefulElement>).renderStateful === 'function';
}
