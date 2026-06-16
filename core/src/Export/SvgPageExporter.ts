import type { Document } from '../Document';
import { RenderContext } from '../Rendering/RenderContext';
import { SvgRenderPipeline, SvgPageRenderOutput } from '../Rendering/SvgRenderPipeline';
import { PdfResourceRegistry } from '../Rendering/PdfResourceRegistry';
import { collectEmbeddedFonts, collectImagesNeedingDecode } from '../Rendering/PdfDocumentSerializer';
import { Image } from '../Elements/Media/Image';
import { SvgCanvasOptions } from '../Drawing/SvgCanvas';
import { SvgPageExportOptions, SVG_PAGE_EXPORT_DEFAULTS } from './SvgPageExportOptions';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';

/**
 * Renders every laid-out page of a document to a standalone SVG string.
 *
 * This runs the same layout pipeline as PDF output (via
 * {@link SvgRenderPipeline}), after preloading embedded fonts and decoding
 * images exactly as the PDF async path does, so the SVG page count and layout
 * match the generated PDF.
 */
export async function exportSvgPagesAsync(document: Document, options?: SvgPageExportOptions): Promise<string[]> {
  const opts = { ...SVG_PAGE_EXPORT_DEFAULTS, ...options };

  const settings = document.settings;
  const pages = document.pages as any[];
  if (!pages || pages.length === 0) {
    throw new Error('Document must have at least one page');
  }

  // ── Phase 1: discover embedded fonts (pages + header/footer templates) ──────
  const embeddedPaths = new Set<string>();
  for (const page of pages) {
    for (const el of page.getElements()) collectEmbeddedFonts(el, embeddedPaths);
  }
  for (const pageNum of [1, 2]) {
    if (settings.headerTemplate) {
      const el = settings.headerTemplate(pageNum);
      if (el) collectEmbeddedFonts(el, embeddedPaths);
    }
    if (settings.footerTemplate) {
      const el = settings.footerTemplate(pageNum);
      if (el) collectEmbeddedFonts(el, embeddedPaths);
    }
  }
  const wmFont = (settings as any).watermark?.fontName;
  if (wmFont && PdfResourceRegistry.isEmbeddedFont(wmFont)) embeddedPaths.add(wmFont);

  // ── Phase 2: preload font bytes ─────────────────────────────────────────────
  const registry = new PdfResourceRegistry();
  (registry as any).conformance = settings.conformance;
  for (const path of embeddedPaths) registry.registerFont(path);
  await registry.preloadAllFontsAsync();

  // ── Phase 2b: async-decode PNGs that need it ────────────────────────────────
  const imagesToDecode: Image[] = [];
  for (const page of pages) {
    for (const el of page.getElements()) collectImagesNeedingDecode(el, imagesToDecode);
  }
  for (const pageNum of [1, 2]) {
    if (settings.headerTemplate) {
      const el = settings.headerTemplate(pageNum);
      if (el) collectImagesNeedingDecode(el, imagesToDecode);
    }
    if (settings.footerTemplate) {
      const el = settings.footerTemplate(pageNum);
      if (el) collectImagesNeedingDecode(el, imagesToDecode);
    }
  }
  if (imagesToDecode.length > 0) {
    await Promise.all(imagesToDecode.map(img => img.prepareAsync()));
  }

  // ── Phase 3: render through the SVG pipeline ────────────────────────────────
  const canvasOptions: SvgCanvasOptions = {
    precision: opts.precision,
    embedImages: opts.embedImages,
    pdfBaseline: true,
  };
  const orientedSize = settings.getOrientedPageSize();
  const ctx = new RenderContext(orientedSize, settings.margin, true, registry, canvasOptions);

  const outputs = SvgRenderPipeline.renderPages(pages as any, settings, ctx);

  // The full document is laid out above (so pagination is correct); only the
  // first maxPages pages are serialized when a limit is requested.
  const limit = options?.maxPages;
  const limited = typeof limit === 'number' && limit >= 0 ? outputs.slice(0, limit) : outputs;

  const title = resolveTitle(document, opts.title);
  return limited.map(o => assemblePageSvg(o, opts, title));
}

function resolveTitle(document: Document, explicit?: string): string {
  if (explicit) return explicit;
  const metaTitle = (document as any).metadata?.title;
  if (typeof metaTitle === 'string' && metaTitle.length > 0) return metaTitle;
  return 'BonniePDF document';
}

/** Wraps a rendered page surface in a standalone, deterministic `<svg>` root. */
function assemblePageSvg(
  output: SvgPageRenderOutput,
  opts: Required<Omit<SvgPageExportOptions, 'title' | 'maxPages'>>,
  title: string
): string {
  const w = round(output.width, opts.precision);
  const h = round(output.height, opts.precision);

  const attrs = ['xmlns="http://www.w3.org/2000/svg"', `width="${w}"`, `height="${h}"`, `viewBox="0 0 ${w} ${h}"`];
  if (opts.shapeRendering !== 'auto') attrs.push(`shape-rendering="${opts.shapeRendering}"`);

  const pageLabel = `${escapeAttr(title)} - page ${output.pageNumber}`;
  let head = '';
  if (opts.includeAccessibilityMetadata) {
    attrs.push('role="img"');
    attrs.push(`aria-label="${pageLabel}"`);
    head = `<title>${escapeXml(title + ' - page ' + output.pageNumber)}</title>`;
  }

  const body =
    `<g id="page-${output.pageNumber}" data-bonniepdf-page="${output.pageNumber}">` +
    output.canvas.getInnerSvg() +
    `</g>`;

  return `<svg ${attrs.join(' ')}>${head}${body}</svg>`;
}

function round(value: number, precision: number): string {
  if (!Number.isFinite(value)) return '0';
  return `${Number(value.toFixed(precision))}`;
}
