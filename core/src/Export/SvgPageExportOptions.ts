/**
 * Options controlling how a document page is exported to SVG.
 *
 * All fields are optional; the defaults produce compact, deterministic,
 * standalone SVG suitable for website thumbnails and CI snapshots.
 */
export interface SvgPageExportOptions {
  /**
   * Decimal places for generated coordinates. Defaults to 3 for stable, compact
   * output.
   */
  precision?: number;

  /**
   * How raster images should be represented. `data-uri` (default) is best for
   * standalone website thumbnails - the SVG carries the image bytes inline and
   * needs no asset coordination. `omit` drops images entirely.
   */
  embedImages?: 'data-uri' | 'external-ref' | 'omit';

  /**
   * `text` (default) keeps text selectable and compact, positioning glyphs with
   * the document's real font metrics. `paths` is reserved for a future
   * glyph-outline mode that removes any dependency on viewer-installed fonts.
   */
  textMode?: 'text' | 'paths';

  /**
   * Include SVG `<a>` wrappers for PDF hyperlinks where possible. Defaults to
   * false; page previews are primarily visual assets.
   */
  includeLinks?: boolean;

  /**
   * Include `<title>`, `<desc>`, `role`, and `aria-label` on the root `<svg>`
   * element. This is a lightweight preview affordance, not PDF/UA structure
   * export. Defaults to true.
   */
  includeAccessibilityMetadata?: boolean;

  /**
   * Human-readable document title used to build the `<title>`/`aria-label`
   * when {@link includeAccessibilityMetadata} is set. Defaults to the document
   * metadata title, then a generic label.
   */
  title?: string;

  /**
   * Maximum number of pages to emit. The full document is still laid out (so
   * pagination/overflow stays correct), but only the first `maxPages` pages are
   * serialized to SVG. Omit (or use a non-positive value) to export every page.
   * Useful for preview/thumbnail pipelines that only need the first few pages.
   */
  maxPages?: number;

  /**
   * Value for the root `shape-rendering` attribute. Defaults to `auto` (the SVG
   * default), which keeps antialiased curves/charts looking smooth. Set to
   * `crispEdges` for pages dominated by pixel-grid graphics (barcodes, QR, Data
   * Matrix) so abutting module rectangles snap to the device pixel grid and
   * don't leave faint anti-aliasing seams between modules. Text is governed by
   * `text-rendering`, so it is unaffected either way.
   */
  shapeRendering?: 'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision';

  /**
   * Capture a {@link LayoutSnapshot} of the rendered element tree (types, parent
   * relationships, and per-page rectangles) and return it on the export result.
   * Off by default and zero-cost when off: with no recorder attached, the layout
   * pass is byte-identical to normal output. Used by the previewer's structure
   * view to highlight where each element landed.
   */
  captureLayout?: boolean;

  /**
   * Cancels the export. Checked before it starts and between its stages; when aborted, the promise rejects with
   * the signal's reason.
   */
  signal?: AbortSignal;
}

/** Default values applied when an option is omitted. */
export const SVG_PAGE_EXPORT_DEFAULTS: Required<
  Omit<SvgPageExportOptions, 'title' | 'maxPages' | 'captureLayout' | 'signal'>
> = {
  precision: 3,
  embedImages: 'data-uri',
  textMode: 'text',
  includeLinks: false,
  includeAccessibilityMetadata: true,
  shapeRendering: 'auto',
};
