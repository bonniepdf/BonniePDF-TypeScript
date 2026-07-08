import { RenderStatus } from './RenderStatus';
import type { LayoutRecorder } from '../Rendering/LayoutRecorder';
import type { ICanvas } from '../Drawing/ICanvas';
import type { TtfFont } from '../Typography/TrueType/TtfFont';
import type { TaggingContext } from '../Rendering/Tagging/TaggingContext';
import type { RegisteredLink } from '../Rendering/RegisteredLink';
export { RenderStatus };

export interface RenderContext {
  maxY: number;
  margin: number;
  canvas: ICanvas;
  currentY: number;
  currentX: number;
  /** Index of the page currently being rendered (0-based). */
  currentPageIndex: number;
  /**
   * Optional layout-snapshot recorder; present only under opt-in `captureLayout`.
   * Typed via the concrete recorder; capture is a no-op when undefined.
   */
  layoutRecorder?: LayoutRecorder;
  pageSize: { width: number; height: number };
  currentStream: string;
  registerFont(fontName: string): string;
  resolveEmbeddedFont(fontName: string): TtfFont | null;
  trackGlyphUsage(fontName: string, text: string): void;
  registerHyperlink(hyperlink: RegisteredLink): void;
  newPage(): void;
  isLastPage: boolean;
  /**
   * PDF/UA tagging context, set by the concrete `Rendering/RenderContext`
   * when accessibility is on (type-only import, so no runtime cycle).
   */
  tagging?: TaggingContext;
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
  /**
   * Canonical child traversal for engine tree walks (the default-style
   * cascade, font/image discovery). Container elements return their direct
   * renderable children; leaf elements omit it. Optional so existing custom
   * IElement implementations remain source-compatible.
   */
  getChildren?(): readonly IElement[];
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
