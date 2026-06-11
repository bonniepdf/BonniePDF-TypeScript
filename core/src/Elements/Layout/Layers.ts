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
export class Layers extends ElementBase {
  private readonly backgroundLayersList: IElement[] = [];
  private readonly foregroundLayersList: IElement[] = [];

  /**
   * The layer that determines the flow height of the stack. When undefined, the
   * tallest declared layer defines the height instead.
   */
  public primaryLayer?: IElement;

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
