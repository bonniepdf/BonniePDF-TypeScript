import { throwIfAborted } from '../Core/throwIfAborted';
import type { Document } from '../Document';
import { RenderContext } from '../Rendering/RenderContext';
import { SvgRenderPipeline, SvgPageRenderOutput } from '../Rendering/SvgRenderPipeline';
import { PdfResourceRegistry } from '../Rendering/PdfResourceRegistry';
import { collectDocumentPreloadResources } from '../Rendering/PdfDocumentSerializer';
import { documentRequiresTwoPassLayout } from '../Rendering/TocLayout';
import { SvgCanvas, SvgCanvasOptions, embeddedFontFamily, toBase64 } from '../Drawing/SvgCanvas';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import { TtfSubsetter } from '../Typography/TrueType/TtfSubsetter';
import { SvgPageExportOptions, SVG_PAGE_EXPORT_DEFAULTS } from './SvgPageExportOptions';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';
import { AccessibilityMode } from '../Configuration/AccessibilityMode';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { LayoutRecorder, LayoutSnapshot, SnapshotMeta, SnapshotPage, colorToHex } from '../Rendering/LayoutRecorder';
import { debugSourceOf } from '../Rendering/DebugSource';
import { evaluateCompliance, type ComplianceReport } from '../Compliance/ComplianceEvaluator';
import {
  beginDocumentFontMetricScope,
  getRegistryFontInstances,
  getRegistryFontPaths,
} from '../Typography/DocumentFontMetricScope';

/** The version of the {@link SvgDocumentExport} envelope, written as its
 * `version`. It changes only for a breaking change to the export's shape;
 * the embedded snapshot carries its own version. */
export const SVG_DOCUMENT_EXPORT_VERSION = 1;

/**
 * A rendered SVG document: one standalone SVG string per page, plus `@font-face`
 * CSS that embeds (as subsetted data URIs) the fonts the document used, so a host
 * can render the pages with the exact fonts BonniePDF laid them out with.
 *
 * The export is plain data, so `JSON.stringify(result)` is its JSON form: the
 * value a host sends to a previewer in another process, or that a .NET server
 * produces for the same document. Keep every part of it free of class
 * instances and methods.
 */
export interface SvgDocumentExport {
  /** Export format version; see {@link SVG_DOCUMENT_EXPORT_VERSION}. */
  version: number;
  /** One standalone `<svg>` document per page, in page order. Each root carries
   * `width`, `height` and `viewBox` in PDF points. */
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
  /**
   * The compliance report for {@link snapshot}, present exactly when the snapshot
   * is. Equal to `evaluateCompliance(snapshot)` with default options, so every
   * rule family runs, WCAG included; filter by `standard` to hide one. Attached
   * here so the report always comes from the same engine as the snapshot it
   * describes, even when it is read in another process.
   */
  report?: ComplianceReport;
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
  throwIfAborted(options?.signal);
  const opts = { ...SVG_PAGE_EXPORT_DEFAULTS, ...options };

  const settings = document.settings;
  const pages = document.pages;
  if (!pages || pages.length === 0) {
    throw new Error('Document must have at least one page');
  }

  // ── Phase 2: preload font bytes ─────────────────────────────────────────────
  const registry = new PdfResourceRegistry();
  registry.conformance = settings.conformance;
  registry.missingGlyphs = settings.missingGlyphs;
  // PDF/UA requires standard fonts to be embedded independently of PDF/A.
  // Keep SVG font resolution in lockstep with PdfDocumentSerializer.
  registry.embedStandardFonts = settings.accessibility === AccessibilityMode.PdfUa1;
  // Register document-owned bytes before asynchronous preloading can cache a missing face.
  // Keep this scope synchronous so another document's async export cannot inherit it.
  const registrationScope = beginDocumentFontMetricScope(
    settings.conformance !== PdfAConformance.None || settings.accessibility === AccessibilityMode.PdfUa1,
    undefined,
    undefined,
    document.fonts
  );
  // Discover embedded fonts (pages + header/footer templates) inside the scope, so a font family resolves as it
  // will when the document renders.
  let preload: ReturnType<typeof collectDocumentPreloadResources>;
  try {
    preload = collectDocumentPreloadResources(document);
    for (const path of preload.embeddedPaths) registry.registerFont(path);
  } finally {
    registrationScope.dispose();
  }
  const { imagesToDecode, svgs } = preload;
  await registry.preloadAllFontsAsync();
  throwIfAborted(opts.signal);

  // ── Phase 2b: async-decode PNGs that need it ────────────────────────────────
  if (imagesToDecode.length > 0) {
    await Promise.all(imagesToDecode.map(img => img.prepareAsync()));
    throwIfAborted(opts.signal);
  }

  // ── Phase 2c: parse SVG elements, rasterizing in document order ─────────────
  for (const svg of svgs) {
    throwIfAborted(opts.signal);
    await svg.prepareAsync(document.svgRasterizer);
  }

  // ── Phase 3: render through the SVG pipeline ────────────────────────────────
  const canvasOptions: SvgCanvasOptions = {
    precision: opts.precision,
    embedImages: opts.embedImages,
    pdfBaseline: true,
  };
  const orientedSize = settings.getOrientedPageSize();

  let outputs!: SvgPageRenderOutput[];
  let recorder: LayoutRecorder | undefined;
  const fontScope = beginDocumentFontMetricScope(
    settings.conformance !== PdfAConformance.None || settings.accessibility === AccessibilityMode.PdfUa1,
    getRegistryFontInstances(registry),
    getRegistryFontPaths(registry),
    document.fonts
  );
  try {
    // ── Two-pass TOC resolution ───────────────────────────────────────────────
    // A VisualToc renders before the headings it references, so on a single pass
    // its page numbers resolve to "XX" and its links target page 1. Mirror the
    // PDF serializer: run a throw-away layout pass first (through the same SVG
    // pipeline, so pagination - and therefore the resolved page numbers - is
    // identical) to populate tocEntries, then seed the real context with it.
    const resolvedTocEntries = new Map<string, number>();
    if (documentRequiresTwoPassLayout(document)) {
      const dryRunCtx = new RenderContext(orientedSize, settings.margin, true, registry, canvasOptions);
      SvgRenderPipeline.renderPages(pages, settings, dryRunCtx);
      for (const [identifier, pageNumber] of dryRunCtx.tocEntries) {
        resolvedTocEntries.set(identifier, pageNumber);
      }
    }

    const ctx = new RenderContext(orientedSize, settings.margin, true, registry, canvasOptions);
    for (const [identifier, pageNumber] of resolvedTocEntries) {
      ctx.tocEntries.set(identifier, pageNumber);
    }

    // Opt-in layout capture. Attached before rendering so the pipeline's
    // openNode/closeNode/pageBreak hooks populate it; left undefined otherwise.
    recorder = opts.captureLayout ? new LayoutRecorder() : undefined;
    if (recorder) ctx.layoutRecorder = recorder;

    outputs = SvgRenderPipeline.renderPages(pages, settings, ctx);
  } finally {
    fontScope.dispose();
  }

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
    recorder.setPages(
      limited.map(o => {
        const page: SnapshotPage = { width: o.width, height: o.height };
        if (o.pageColor) page.color = colorToHex(o.pageColor);
        if (o.pageBackdropUnknown) page.backdropUnknown = true;
        return page;
      })
    );
    // Document-level accessibility/compliance context for the evaluator.
    const metaTitle = document.metadata?.title;
    // Unset fields are left out rather than set to undefined, so the snapshot
    // stays plain data whose JSON form carries no absent keys.
    const meta: SnapshotMeta = {
      accessibilityMode: settings.accessibility,
      conformance: settings.conformance,
    };
    if (settings.language) meta.language = settings.language;
    if (typeof metaTitle === 'string' && metaTitle.length > 0) meta.title = metaTitle;
    recorder.setMeta(meta);
    snapshot = recorder.snapshot();

    // Document is represented by a synthetic root, and its constructor-created
    // first Page has no separate declaration. In instrumented editor previews,
    // both therefore navigate to the Document construction site. Explicitly
    // added pages retain their own (or absent) source attribution.
    const documentSourceId = debugSourceOf(document);
    if (documentSourceId) {
      snapshot.root.sourceId = documentSourceId;
      const automaticPage = snapshot.root.children.find(node => node.type === 'Page');
      if (automaticPage && !automaticPage.sourceId) automaticPage.sourceId = documentSourceId;
    }
  }

  const result: SvgDocumentExport = {
    version: SVG_DOCUMENT_EXPORT_VERSION,
    pages: pageSvgs,
    fontFaceCss: buildFontFaceCss(usage),
  };
  if (snapshot) {
    result.snapshot = snapshot;
    // Evaluated over the finished snapshot. The evaluator is pure, and neither
    // the snapshot nor any page changes.
    result.report = evaluateCompliance(snapshot);
  }
  return result;
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
  opts: Required<Omit<SvgPageExportOptions, 'title' | 'maxPages' | 'captureLayout' | 'signal'>>,
  title: string
): string {
  const w = round(output.width, opts.precision);
  const h = round(output.height, opts.precision);

  const attrs = ['xmlns="http://www.w3.org/2000/svg"', `width="${w}"`, `height="${h}"`, `viewBox="0 0 ${w} ${h}"`];
  if (opts.shapeRendering !== 'auto') attrs.push(`shape-rendering="${opts.shapeRendering}"`);

  const overlays = output.linkOverlays;
  // Only external anchors are focusable interactive controls; internal
  // navigation rects are inert and don't force the model switch below.
  const hasInteractiveLinks = overlays.includes('<a ');

  const pageLabel = `${escapeAttr(title)} - page ${output.pageNumber}`;
  let head = '';
  let groupAttrs = '';
  if (opts.includeAccessibilityMetadata) {
    head = `<title>${escapeXml(title + ' - page ' + output.pageNumber)}</title>`;
    if (hasInteractiveLinks) {
      // Model: "labelled image + named links". A page carrying live links cannot
      // be a single atomic image — ARIA `role="img"` prunes its subtree, so a
      // focusable <a> inside it is both invisible to AT and an invalid nesting
      // (axe `nested-interactive`). Instead the root stays an unpruned graphics
      // container named via `aria-label`; the painted page becomes an
      // `aria-hidden` visual layer (its accessible name is the root's label,
      // exactly as the atomic-image model presented it); and the link overlays
      // ride above it as real, individually-named <a> siblings.
      attrs.push(`aria-label="${pageLabel}"`);
      groupAttrs = ' aria-hidden="true"';
    } else {
      // No interactive links: keep the whole page as one atomic labelled image.
      attrs.push('role="img"');
      attrs.push(`aria-label="${pageLabel}"`);
    }
  }

  const body =
    `<g id="page-${output.pageNumber}" data-bonniepdf-page="${output.pageNumber}"${groupAttrs}>` +
    output.canvas.getInnerSvg() +
    `</g>` +
    // Overlays sit after (above) the visual group and, crucially, outside it —
    // so external anchors are valid, focusable, named siblings of the page image
    // rather than pruned descendants of it.
    overlays;

  return `<svg ${attrs.join(' ')}>${head}${body}</svg>`;
}

function round(value: number, precision: number): string {
  if (!Number.isFinite(value)) return '0';
  return `${Number(value.toFixed(precision))}`;
}
