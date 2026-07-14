import type { Document } from '../Document';
import { RenderContext } from '../Rendering/RenderContext';
import { SvgRenderPipeline, SvgPageRenderOutput } from '../Rendering/SvgRenderPipeline';
import { PdfResourceRegistry } from '../Rendering/PdfResourceRegistry';
import { collectEmbeddedFonts, collectImagesNeedingDecode } from '../Rendering/PdfDocumentSerializer';
import { Image } from '../Elements/Media/Image';
import { SvgCanvas, SvgCanvasOptions, embeddedFontFamily, toBase64 } from '../Drawing/SvgCanvas';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import { TtfSubsetter } from '../Typography/TrueType/TtfSubsetter';
import { SvgPageExportOptions, SVG_PAGE_EXPORT_DEFAULTS } from './SvgPageExportOptions';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';
import { AccessibilityMode } from '../Configuration/AccessibilityMode';
import { LayoutRecorder, LayoutSnapshot } from '../Rendering/LayoutRecorder';

/** A rendered SVG document: one standalone SVG string per page, plus `@font-face`
 * CSS that embeds (as subsetted data URIs) the fonts the document used, so a host
 * can render the pages with the exact fonts BonniePDF laid them out with. */
export interface SvgDocumentExport {
  pages: string[];
  /** `<style>`-ready `@font-face` rules, or `''` when the document uses no
   * embeddable fonts (e.g. only the viewer-supplied standard-14). */
  fontFaceCss: string;
  /**
   * The captured layout tree, present only when {@link SvgPageExportOptions.captureLayout}
   * was set. Its `pages`/rectangles are index-aligned with {@link pages} and use
   * the same top-left, points coordinate space as the SVG.
   */
  snapshot?: LayoutSnapshot;
}

/**
 * Renders every laid-out page of a document to a standalone SVG string.
 *
 * This runs the same layout pipeline as PDF output (via
 * {@link SvgRenderPipeline}), after preloading embedded fonts and decoding
 * images exactly as the PDF async path does, so the SVG page count and layout
 * match the generated PDF.
 */
export async function exportSvgPagesAsync(document: Document, options?: SvgPageExportOptions): Promise<string[]> {
  return (await exportSvgDocumentAsync(document, options)).pages;
}

/**
 * Like {@link exportSvgPagesAsync}, but also returns `@font-face` CSS embedding a
 * minimal subset (only the glyphs actually drawn) of each embedded font, so the
 * preview renders with the exact fonts used for layout — independent of what the
 * viewer has installed. Subsetting keeps the payload to a few KB per face.
 */
export async function exportSvgDocumentAsync(
  document: Document,
  options?: SvgPageExportOptions
): Promise<SvgDocumentExport> {
  const opts = { ...SVG_PAGE_EXPORT_DEFAULTS, ...options };

  const settings = document.settings;
  const pages = document.pages;
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
  const wmFont = settings.watermark?.fontName;
  if (wmFont && PdfResourceRegistry.isEmbeddedFont(wmFont)) embeddedPaths.add(wmFont);

  // ── Phase 2: preload font bytes ─────────────────────────────────────────────
  const registry = new PdfResourceRegistry();
  registry.conformance = settings.conformance;
  // PDF/UA requires standard fonts to be embedded independently of PDF/A.
  // Keep SVG font resolution in lockstep with PdfDocumentSerializer.
  registry.embedStandardFonts = settings.accessibility === AccessibilityMode.PdfUa1;
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

  // Opt-in layout capture. Attached before rendering so the pipeline's
  // openNode/closeNode/pageBreak hooks populate it; left undefined otherwise so
  // capture is a guarded no-op and output is unchanged.
  const recorder = opts.captureLayout ? new LayoutRecorder() : undefined;
  if (recorder) ctx.layoutRecorder = recorder;

  const outputs = SvgRenderPipeline.renderPages(pages, settings, ctx);

  // The full document is laid out above (so pagination is correct); only the
  // first maxPages pages are serialized when a limit is requested.
  const limit = options?.maxPages;
  const limited = typeof limit === 'number' && limit >= 0 ? outputs.slice(0, limit) : outputs;

  const title = resolveTitle(document, opts.title);
  const pageSvgs = limited.map(o => assemblePageSvg(o, opts, title));

  // ── Phase 4: embed @font-face subsets for the fonts actually drawn ───────────
  // Merge per-font code-point usage across the emitted pages, then embed a
  // minimal subset of each. Only fonts that resolved to real bytes appear here:
  // custom/open fonts, plus standard-14 substitutes required by PDF/A or PDF/UA.
  const usage = new Map<string, { font: TtfFont; codePoints: Set<number> }>();
  for (const output of limited) {
    const canvas = output.canvas as SvgCanvas;
    for (const [name, used] of canvas.getEmbeddedFontUsage()) {
      let entry = usage.get(name);
      if (!entry) {
        entry = { font: used.font, codePoints: new Set<number>() };
        usage.set(name, entry);
      }
      for (const cp of used.codePoints) entry.codePoints.add(cp);
    }
  }

  let snapshot: LayoutSnapshot | undefined;
  if (recorder) {
    // Page sizes align with the emitted SVG pages.
    recorder.setPages(limited.map(o => ({ width: o.width, height: o.height })));
    // Document-level accessibility/compliance context for the evaluator.
    const metaTitle = document.metadata?.title;
    recorder.setMeta({
      accessibilityMode: settings.accessibility,
      conformance: settings.conformance,
      language: settings.language,
      title: typeof metaTitle === 'string' && metaTitle.length > 0 ? metaTitle : undefined,
    });
    snapshot = recorder.snapshot();
  }

  return { pages: pageSvgs, fontFaceCss: buildFontFaceCss(usage), snapshot };
}

/** Builds `@font-face` rules that embed a minimal subset (only the used glyphs)
 * of each font as a base64 data URI, under its private {@link embeddedFontFamily}
 * name. Falls back to the full font if subsetting fails, and skips fonts that
 * yield no bytes. */
function buildFontFaceCss(usage: ReadonlyMap<string, { font: TtfFont; codePoints: ReadonlySet<number> }>): string {
  const rules: string[] = [];
  for (const [fontFamily, { font, codePoints }] of usage) {
    if (codePoints.size === 0) continue;

    let bytes: Uint8Array | null = null;
    try {
      const subsetter = new TtfSubsetter(font);
      const charToGlyph = new Map<number, number>();
      const glyphIds = new Set<number>();
      for (const cp of codePoints) {
        const gid = font.getGlyphId(cp);
        charToGlyph.set(cp, gid);
        glyphIds.add(gid);
      }
      bytes = subsetter.createSubset(glyphIds, charToGlyph);
    } catch {
      // Subsetting failed - fall back to the full font so the face still renders.
      const full = font.getRawFontData();
      bytes = full.length > 0 ? full : null;
    }
    if (!bytes || bytes.length === 0) continue;

    rules.push(
      // A PDF preview should never flash a metrically different fallback face:
      // wait briefly for the inline data font, then paint the exact glyphs.
      `@font-face{font-family:'${embeddedFontFamily(fontFamily)}';font-display:block;` +
        `src:url("data:font/ttf;base64,${toBase64(bytes)}") format("truetype");}`
    );
  }
  return rules.join('');
}

function resolveTitle(document: Document, explicit?: string): string {
  if (explicit) return explicit;
  const metaTitle = document.metadata?.title;
  if (typeof metaTitle === 'string' && metaTitle.length > 0) return metaTitle;
  return 'BonniePDF document';
}

/** Wraps a rendered page surface in a standalone, deterministic `<svg>` root. */
function assemblePageSvg(
  output: SvgPageRenderOutput,
  opts: Required<Omit<SvgPageExportOptions, 'title' | 'maxPages' | 'captureLayout'>>,
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
