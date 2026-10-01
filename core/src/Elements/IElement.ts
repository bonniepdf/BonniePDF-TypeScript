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
  /**
   * While a table draws a cell whose content is a Container, that container. It fills
   * {@link cellStretchHeight}, so a border or background on a cell's content spans the whole row.
   * `undefined` everywhere else.
   */
  cellStretchTarget: object | undefined;
  /** The height {@link cellStretchTarget} fills: the row height less the cell's padding. */
  cellStretchHeight: number;
  /**
   * The horizontal text alignment a Container establishes for descendant text (TextBlock/Heading/RichText)
   * that sets none of its own, cascading through nesting the way CSS text-align is inherited (spec 01
   * "Document Model" §3.2). `undefined` means no ambient is in effect: unset text stays at its own default.
   */
  ambientHorizontalTextAlignment: unknown;
  /**
   * Top of the body content band on the current page: the margin, or the
   * header's height where the header is taller than the margin. Elements test
   * "am I at the top of the page?" against this rather than against `margin`,
   * so a page whose header reserves extra space still recognises its own top.
   */
  readonly contentTop: number;
  /** Usable body height on the current page (`maxY - contentTop`). */
  readonly contentHeight: number;
  canvas: ICanvas;
  currentY: number;
  currentX: number;
  /** Index of the page currently being rendered (0-based). */
  currentPageIndex: number;
  /**
   * Optional layout-snapshot recorder; present only under opt-in `captureLayout`.
   * Typed via the concrete recorder; capture is a no-op when undefined.
   * @internal
   */
  layoutRecorder?: LayoutRecorder;
  pageSize: { width: number; height: number };
  currentStream: string;
  registerFont(fontName: string): string;
  /** @internal */
  resolveEmbeddedFont(fontName: string): TtfFont | null;
  /** @internal */
  trackGlyphUsage(fontName: string, text: string): void;
  /** @internal */
  registerHyperlink(hyperlink: RegisteredLink): void;
  newPage(): void;
  isLastPage: boolean;
  /**
   * PDF/UA tagging context, set by the concrete `Rendering/RenderContext`
   * when accessibility is on (type-only import, so no runtime cycle).
   * @internal
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
