import { BorderedElementBase } from './BorderedElementBase';
import { IContentContainer } from '../IContentContainer';
import { LayersDescriptor } from './LayersDescriptor';
import { IElement } from '../IElement';
import { RenderContext } from '../IElement';
import { Thickness } from '../../Core/Thickness';
import { HorizontalAlignment } from '../../Core/HorizontalAlignment';
import { toThickness, type ThicknessInput } from '../../Normalize/toThickness';
import { toOptionalLength, type LengthInput } from '../../Normalize/toLength';
import { toHorizontalAlignment, type HorizontalAlignmentInput } from '../../Normalize/toEnum';
import { toVerticalAlignment, type VerticalAlignmentInput } from '../../Normalize/toEnum';
import { VerticalAlignment } from '../../Core/VerticalAlignment';
import { beginChildTag, endChildTag } from '../../Rendering/Tagging/ChildTagging';
import {
  BORDERED_ELEMENT_OPTION_KEYS,
  applyBorderedElementOptions,
  type BorderedElementOptions,
} from './BorderedElementOptions';

/**
 * A container element that supports padding, background color, and borders.
 * Implements IContentContainer as a single-child wrapper.
 */
/** Settable properties declared by {@link Container} itself. */
export const CONTAINER_OWN_OPTION_KEYS = [
  'child',
  'padding',
  'width',
  'height',
  'clipContent',
  'crispEdges',
  'horizontalAlignment',
  'verticalAlignment',
] as const;

/** The full settable surface of a container, bases included. */
export const CONTAINER_OPTION_KEYS = [...BORDERED_ELEMENT_OPTION_KEYS, ...CONTAINER_OWN_OPTION_KEYS] as const;

type ContainerOwnKey = (typeof CONTAINER_OWN_OPTION_KEYS)[number];

/**
 * Options for {@link Container}. Intersects {@link BorderedElementOptions}, so
 * the `{ width, color }` border form works here (applied via
 * `applyBorderedElementOptions`).
 */
export type ContainerOptions = BorderedElementOptions &
  Partial<
    Omit<Pick<Container, ContainerOwnKey>, 'padding' | 'horizontalAlignment' | 'verticalAlignment' | 'width' | 'height'>
  > & {
    /** Fixed width. Accepts a length: `240`, `'8cm'`, or `{ value, unit }`. */
    width?: LengthInput;
    /** Fixed height. Accepts a length: `120`, `'1in'`, or `{ value, unit }`. */
    height?: LengthInput;
    /** Padding inside the border. Accepts `12`, `[h, v]`, `[l, t, r, b]` or `{ bottom: 12 }`. */
    padding?: ThicknessInput;
    /** Child placement. Accepts `'start' | 'center' | 'end' | 'stretch'`. */
    horizontalAlignment?: HorizontalAlignmentInput;
    verticalAlignment?: VerticalAlignmentInput;
  };

/** Wraps one child with optional sizing, alignment, padding, borders, background, and layers. */
export class Container extends BorderedElementBase implements IContentContainer {
  public child?: IElement;

  /** Creates an empty container. */
  constructor();
  /**
   * Creates a container configured in one expression.
   *
   * ```typescript
   * new Container({ padding: 12, border: { width: 1, color: 'slate-300' }, child: text });
   * ```
   */
  constructor(options: ContainerOptions);
  constructor(options?: ContainerOptions) {
    super();
    // Bordered options, not plain applyOptions: the `{ width, color }` border
    // form has to be split across `border` / `borderColors`.
    applyBorderedElementOptions(this, options);
  }

  /** @inheritdoc */
  public getChildren(): readonly IElement[] {
    return this.child ? [this.child] : [];
  }
  private _padding: Thickness = new Thickness(0);

  /**
   * Padding inside the container, inside the border.
   *
   * Accepts `12`, `[h, v]`, `[l, t, r, b]` or `{ bottom: 12 }` on write
   * (`the specification` §4A.3); omitted sides are zero.
   */
  public get padding(): Thickness {
    return this._padding;
  }
  public set padding(value: ThicknessInput) {
    this._padding = toThickness(value);
  }
  private _width?: number;

  /**
   * Optional fixed width for the container (null = use available width).
   *
   * Accepts a length: `240`, `'8cm'`, or `{ value, unit }` (§4A.3).
   */
  public get width(): number | undefined {
    return this._width;
  }
  public set width(value: LengthInput | undefined) {
    this._width = toOptionalLength(value);
  }

  private _height?: number;

  /**
   * Optional fixed height for the container (null = auto-size based on content).
   *
   * Accepts a length: `120`, `'1in'`, or `{ value, unit }` (§4A.3).
   */
  public get height(): number | undefined {
    return this._height;
  }
  public set height(value: LengthInput | undefined) {
    this._height = toOptionalLength(value);
  }

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
   * When `true`, the container's subtree renders inside a crisp-edge region:
   * on SVG page export it emits `<g shape-rendering="crispEdges">`, so
   * thin axis-aligned strokes and rectangles (grid/table lines, dividers) snap
   * to the device pixel grid instead of being antialiased into a soft blur. It
   * is a no-op on PDF output (the bytes are unchanged; crispness there is the
   * viewer's job). Only wrap axis-aligned content — rounded rects, circles,
   * diagonals, and text want antialiasing and will look jagged inside a
   * crisp-edge region.
   */
  public crispEdges = false;

  private _horizontalAlignment?: HorizontalAlignment;

  /**
   * Horizontal alignment of the child within the container's available width.
   * When the child is narrower than the container, it is positioned
   * accordingly; otherwise it fills the width as before. `undefined`/`Start`
   * keep the default left placement. `Stretch` is treated as "fill" (no offset).
   *
   * Accepts `'start' | 'center' | 'end' | 'stretch'` on write.
   */
  public get horizontalAlignment(): HorizontalAlignment | undefined {
    return this._horizontalAlignment;
  }
  public set horizontalAlignment(value: HorizontalAlignmentInput | undefined) {
    this._horizontalAlignment = value === undefined ? undefined : toHorizontalAlignment(value);
  }

  private _verticalAlignment?: VerticalAlignment;

  /**
   * Vertical alignment of the child within the container's available height.
   * Only has an effect when the container is taller than its child needs -
   * normally because {@link height} is set - so it is the way to anchor content
   * to the bottom (or middle) of a fixed box without hand-computing a top
   * padding against a font's metrics. `undefined`/`Start` keep the default top
   * placement; `Stretch` is treated as "fill" (no offset).
   *
   * Accepts `'top' | 'middle' | 'bottom' | 'stretch'` on write.
   */
  public get verticalAlignment(): VerticalAlignment | undefined {
    return this._verticalAlignment;
  }
  public set verticalAlignment(value: VerticalAlignmentInput | undefined) {
    this._verticalAlignment = value === undefined ? undefined : toVerticalAlignment(value);
  }

  /**
   * Fills this container with an inline z-stack. Layers paint in
   * declaration order: `background` behind, `primaryLayer` in the middle (it
   * sets the flow height), and `foreground` on top.
   *
   * ```typescript
   * new Container().layers(layers => layers
   *   .background(Image.load('card-bg.jpg'))
   *   .foreground(new TextBlock('Sample Company')));
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
    if (ctx.currentY + containerHeight > ctx.maxY && ctx.currentY > ctx.contentTop) {
      ctx.newPage();
    }

    // Crisp-edge hint: render the subtree inside a crisp-edge region so
    // axis-aligned strokes/rects snap to the pixel grid on SVG export. Outermost
    // wrap; the clip and content render inside it. No-op on PDF/unsupported
    // canvases.
    if (this.crispEdges) ctx.canvas.beginCrispEdges?.();

    try {
      // Rounded-corner clipping: mask the background and child to the
      // rounded outline. Opened here and closed in the finally so the early
      // childless return still balances the clip. The canvas methods are
      // optional; a canvas that doesn't support clipping leaves content un-masked.
      //
      // The border is deliberately drawn AFTER the clip ends: strokes paint
      // centred on the path, so stroking inside a clip on the same path would
      // shave off the outer half of the stroke - most visibly on the corner
      // arcs, which render as broken/thinned. Drawing it outside the clip keeps
      // the full stroke width, matching how un-clipped rounded containers render.
      const clip = this.clipContent && this.cornerRadius > 0;
      const boxX = ctx.currentX;
      const boxY = ctx.currentY;
      if (clip) {
        ctx.canvas.beginRoundedClip?.(boxX, boxY, effectiveWidth, containerHeight, this.cornerRadius);
      }

      try {
        this.renderClippedContent(ctx, effectiveWidth, containerHeight, !clip);
      } finally {
        if (clip) ctx.canvas.endClip?.();
      }

      if (clip && this.border.hasAnyBorder) {
        this.drawBorder(ctx, boxX, boxY, effectiveWidth, containerHeight);
      }
    } finally {
      if (this.crispEdges) ctx.canvas.endCrispEdges?.();
    }
  }

  private renderClippedContent(
    ctx: RenderContext,
    effectiveWidth: number,
    containerHeight: number,
    drawBorderInline: boolean
  ): void {
    if (this.backgroundColor) {
      this.drawBackground(ctx, ctx.currentX, ctx.currentY, effectiveWidth, containerHeight, this.backgroundColor);
    }

    if (drawBorderInline && this.border.hasAnyBorder) {
      this.drawBorder(ctx, ctx.currentX, ctx.currentY, effectiveWidth, containerHeight);
    }

    if (!this.child) {
      ctx.currentY += containerHeight;
      return;
    }

    const originalX = ctx.currentX;
    const yBeforePadding = ctx.currentY;

    // The child renders inside the border box: measureContentHeight and the
    // width below both reserve the border widths, so the origin must be offset
    // by border.left/top as well - otherwise the child hugs the outer top-left
    // edge and the reserved space piles up as a visible gap at the right and
    // bottom edges (the border no longer "lines up" with the content).
    ctx.currentX += this.border.left + this.padding.left;
    ctx.currentY += this.border.top + this.padding.top;
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

    // Vertical alignment consumes the slack between the child's measured height
    // and the container's own, so a fixed-height box can anchor its content to
    // the bottom instead of being positioned by a hand-tuned top padding.
    const vAlign = this.verticalAlignment;
    if (vAlign === VerticalAlignment.Center || vAlign === VerticalAlignment.End) {
      const innerHeight = containerHeight - this.padding.top - this.padding.bottom - this.border.verticalWidth;
      const childHeight = this.child.measureHeight(childWidth);
      const slack = innerHeight - childHeight;
      if (slack > 0) ctx.currentY += vAlign === VerticalAlignment.Center ? slack / 2 : slack;
    }

    const yBeforeChildRender = ctx.currentY;
    this.renderChild(ctx, childWidth);
    const yAfterChildRender = ctx.currentY;

    ctx.currentX = originalX;

    // If the child did not advance Y (e.g. an absolutely-measured element), advance
    // by its measured height instead.
    if (yAfterChildRender === yBeforeChildRender) {
      const childHeight = this.child.measureHeight(childWidth);
      ctx.currentY = yBeforePadding + this.border.top + this.padding.top + childHeight;
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
