export interface RenderContext {
  maxY: number;
  margin: number;
  canvas?: any;
  currentY: number;
  currentX: number;
  pageSize: { width: number; height: number };
  currentStream: any;
  registerFont(fontName: string): string;
  resolveEmbeddedFont(fontName: string): any;
  trackGlyphUsage(fontName: string, text: string): void;
  registerHyperlink(hyperlink: any): void;
  newPage(): void;
  isLastPage: boolean;
  /**
   * PDF/UA tagging context, set by the concrete `Rendering/RenderContext`
   * when accessibility is on. Typed loosely here to avoid cross-module
   * cycles; elements that need it (currently Table) cast to the concrete
   * `TaggingContext` shape they actually use.
   */
  tagging?: any;
}

/**
 * Interface for all renderable PDF elements
 */
export interface IElement {
  /**
   * Measures the height of this element given the available width
   */
  measureHeight(availableWidth: number): number;
  /**
   * Gets the preferred width of this element, if any.
   * This is used for auto-sizing in horizontal layouts.
   * @returns The preferred width, or 0 if no preference.
   */
  getPreferredWidth(): number;
  /**
   * Renders this element to the PDF context
   */
  render(ctx: RenderContext, width: number): void;
}

/**
 * Interface for elements that support stateful rendering across page boundaries.
 * Elements implementing this interface can track their render state and resume
 * on subsequent pages when content overflows.
 */
export interface IStatefulElement extends IElement {
  /**
   * Renders this element with state tracking for pagination.
   * Unlike Render(), this method returns a status indicating whether
   * more content needs to be rendered on subsequent pages.
   * @param ctx - The render context
   * @param width - The available width for this element
   * @returns Complete if all content was rendered, Overflow if more pages are needed
   */
  renderStateful(ctx: RenderContext, width: number): RenderStatus;

  /**
   * Resets the internal state of this element, preparing it for a fresh render.
   * Should be called before starting a new document or after completing a multipage render.
   */
  resetState(): void;
}

export enum RenderStatus {
  Complete = 'Complete',
  Overflow = 'Overflow',
  WrapRequired = 'WrapRequired',
}
