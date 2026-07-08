import type { StructureElement } from './Tagging/StructureElement';

/**
 * The structural contract for anything registered as a clickable link during
 * rendering via `RenderContext.registerHyperlink`. Satisfied by the
 * `Hyperlink` element and by ad-hoc internal links (e.g. VisualToc entries).
 *
 * Render bounds are PDF coordinates (bottom-left origin), set during layout.
 */
export interface RegisteredLink {
  /** External target URI. Empty/undefined for internal (GoTo) links. */
  uri?: string;
  /** 0-based target page index for internal (GoTo) links. */
  targetPageIndex?: number;
  /** Visible link text, mirrored into the annotation /Contents (PDF/UA 7-18). */
  text?: string;
  /** Internal named-destination key (VisualToc entries). */
  identifier?: string;
  /** X of the rendered annotation rectangle in PDF coordinates. */
  renderX: number;
  /** Y of the rendered annotation rectangle in PDF coordinates. */
  renderY: number;
  /** Width of the rendered annotation rectangle in points. */
  renderWidth: number;
  /** Height of the rendered annotation rectangle in points. */
  renderHeight: number;
  /** Updates the rendered bounds after layout. */
  setRenderBounds?(x: number, y: number, width: number, height: number): void;
  /** /Rect string; when absent the writer falls back to `[0 0 0 0]`. */
  getRectangleString?(): string;
  /**
   * The Link struct element opened for this link during the render pass
   * (tagged documents only), used for /StructParent + /OBJR wiring.
   */
  linkedStructElement?: StructureElement;
}
