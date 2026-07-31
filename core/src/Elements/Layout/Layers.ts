import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { ElementBase } from '../ElementBase';
import { IElement, RenderContext } from '../IElement';

/**
 * An inline z-stacking primitive. All layers share the same origin and
 * paint in declaration order: **background** layers render behind, the
 * **primary** layer defines the element's flow height, and **foreground**
 * layers render on top. This gives clean visual stacking inside any container -
 * card backgrounds behind a label, badges over an image, and so on - without
 * the absolute-positioning workarounds.
 */
/** Settable properties declared by {@link Layers} itself. */
export const LAYERS_OWN_OPTION_KEYS = ['primaryLayer'] as const;

/**
 * The full settable *property* surface, base included. `background` and
 * `foreground` are synthetic sugar over {@link Layers.addBackground} /
 * {@link Layers.addForeground}, not properties.
 */
export const LAYERS_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...LAYERS_OWN_OPTION_KEYS] as const;

/** Options for {@link Layers}. */
export type LayersOptions = ElementOptions &
  Partial<Pick<Layers, 'primaryLayer'>> & {
    /** Layers painted behind the primary layer, in order. */
    background?: IElement[];
    /** Layers painted on top of the primary layer, in order. */
    foreground?: IElement[];
  };

export class Layers extends ElementBase {
  private readonly backgroundLayersList: IElement[] = [];
  private readonly foregroundLayersList: IElement[] = [];

  /**
   * The layer that determines the flow height of the stack. When undefined, the
   * tallest declared layer defines the height instead.
   */
  public primaryLayer?: IElement;

  /** Creates an empty z-stack. */
  constructor();
  /** Creates a z-stack configured in one expression. */
  constructor(options: LayersOptions);
  constructor(options?: LayersOptions) {
    super();
    const { background, foreground, ...rest } = options ?? {};
    applyOptions(this, rest);
    for (const el of background ?? []) this.addBackground(el);
    for (const el of foreground ?? []) this.addForeground(el);
  }

  /** Layers painted behind the primary layer, in declaration order. */
  public get backgroundLayers(): readonly IElement[] {
    return this.backgroundLayersList;
  }

  /** Layers painted on top of the primary layer, in declaration order. */
  public get foregroundLayers(): readonly IElement[] {
    return this.foregroundLayersList;
  }

  /** Adds a layer painted behind the primary layer. Fluent; returns this. */
  public addBackground(element: IElement): Layers {
    if (element) this.backgroundLayersList.push(element);
    return this;
  }

  /** Adds a layer painted on top of the primary layer. Fluent; returns this. */
  public addForeground(element: IElement): Layers {
    if (element) this.foregroundLayersList.push(element);
    return this;
  }

  protected getPreferredContentWidth(): number {
    return this.primaryLayer?.getPreferredWidth() ?? 0;
  }

  protected measureContentHeight(contentWidth: number): number {
    if (this.primaryLayer) return this.primaryLayer.measureHeight(contentWidth);

    // No primary layer: the tallest layer defines the height.
    let max = 0;
    for (const layer of this.backgroundLayersList) max = Math.max(max, layer.measureHeight(contentWidth));
    for (const layer of this.foregroundLayersList) max = Math.max(max, layer.measureHeight(contentWidth));
    return max;
  }

  protected renderContent(ctx: RenderContext, contentWidth: number): void {
    const startX = ctx.currentX;
    const startY = ctx.currentY;

    // Background layers: paint at the shared origin without committing Y.
    for (const layer of this.backgroundLayersList) {
      this.renderOverlay(ctx, layer, startX, startY, contentWidth);
    }

    // Primary layer: defines the flow - it advances currentY normally.
    let endY: number;
    if (this.primaryLayer) {
      ctx.currentX = startX;
      ctx.currentY = startY;
      ctx.canvas.saveState();
      try {
        this.primaryLayer.render(ctx, contentWidth);
      } finally {
        ctx.canvas.restoreState();
      }
      endY = ctx.currentY;
    } else {
      endY = startY + this.measureContentHeight(contentWidth);
    }

    // Foreground layers: paint at the shared origin, on top of the primary.
    for (const layer of this.foregroundLayersList) {
      this.renderOverlay(ctx, layer, startX, startY, contentWidth);
    }

    ctx.currentX = startX;
    ctx.currentY = endY;
  }

  private renderOverlay(
    ctx: RenderContext,
    layer: IElement,
    startX: number,
    startY: number,
    contentWidth: number
  ): void {
    ctx.currentX = startX;
    ctx.currentY = startY;
    ctx.canvas.saveState();
    try {
      layer.render(ctx, contentWidth);
    } finally {
      ctx.canvas.restoreState();
    }
  }
}
