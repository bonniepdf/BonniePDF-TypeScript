import { Document } from '../Document';
import { RenderContext } from './RenderContext';
import { PdfRenderPipeline } from './PdfRenderPipeline';
import { PdfResourceRegistry } from './PdfResourceRegistry';
import {
  PdfWriter,
  AsyncPdfWriter,
  MetadataWriter,
  NavigationWriter,
  ComplianceWriter,
  CatalogOptions,
  IPdfWriter,
  IAsyncPdfWriter,
} from './Writers/PdfWriter';
import { StructureTreeWriter } from './Writers/StructureTreeWriter';
import { StructureTreeBuilder } from './Tagging/StructureTreeBuilder';
import { TaggingContext } from './Tagging/TaggingContext';
import { PdfVersion } from '../Configuration/PdfVersion';
import { AccessibilityMode } from '../Configuration/AccessibilityMode';

export class PdfDocumentSerializer {
  constructor(private document: Document) {}

  /**
   * Serializes the document synchronously to the provided writer.
   * Mirrors PdfDocumentSerializer.Serialize() in the .NET source.
   *
   * @param writer            The PDF writer to emit bytes to.
   * @param preloadedResources  Optional pre-populated registry whose embedded fonts have already
   *                            been loaded (e.g. by a preceding async preload phase).  When
   *                            provided the render context reuses this registry so glyph IDs
   *                            are encoded correctly in the content streams.
   */
  public serialize(writer: IPdfWriter, preloadedResources?: PdfResourceRegistry): void {
    const settings = this.document.settings;

    // 0. Set up encryption if configured (full implementation in Session 4)
    let encryptId = 0;
    if (settings.isEncrypted) {
      encryptId = writer.getNewId();
    }

    // 1. Allocate top-level IDs up front
    const catalogId = writer.getNewId();
    const infoId = writer.getNewId();
    const pagesId = writer.getNewId(); // /Pages parent — written after all page objects

    // 2. Initialize render context (inject pre-loaded resources when available)
    const orientedPageSize = settings.getOrientedPageSize();
    const ctx = new RenderContext(orientedPageSize, settings.margin, false, preloadedResources);
    ctx.pdfAEnabled = settings.pdfAEnabled;

    // PDF/UA tagging context — shared between the render pipeline
    // (canvas attaches MCIDs to the builder) and the structure-tree
    // writer at the end (emits the populated tree).
    const taggingContext =
      settings.accessibility !== AccessibilityMode.None && settings.version === PdfVersion.Pdf17
        ? new TaggingContext(new StructureTreeBuilder())
        : undefined;
    ctx.tagging = taggingContext;

    // Two-pass layout (VisualToc) is out of scope — requiresTwoPassLayout() always false.

    // 3. Stream pages (low-memory path)
    const pageIds: number[] = [];
    let pageIndex = 0;

    for (const pageOutput of PdfRenderPipeline.renderPagesStreaming(
      (this.document as any).pages ?? [],
      settings,
      ctx
    )) {
      let pageId: number;
      if (pageIndex < pageIds.length) {
        pageId = pageIds[pageIndex];
      } else {
        pageId = writer.getNewId();
        pageIds.push(pageId);
      }
      pageIndex++;

      const contentId = writer.getNewId();

      // Write the page content stream immediately (flush memory)
      writer.writeCompressedObject(contentId, new Map(), pageOutput.contentStream);

      // Build page dictionary — /Resources goes on the parent /Pages object
      const pageDict = new Map<string, string>([
        ['/Type', '/Page'],
        ['/Parent', `${pagesId} 0 R`],
        ['/MediaBox', `[0 0 ${pageOutput.size.width} ${pageOutput.size.height}]`],
        ['/Contents', `${contentId} 0 R`],
      ]);

      // Write link annotations if present
      if (pageOutput.hyperlinks?.length > 0) {
        const annotIds: number[] = [];
        for (const link of pageOutput.hyperlinks) {
          const annotId = writer.getNewId();
          writer.writeLinkAnnotation(annotId, link, pageIds);
          annotIds.push(annotId);
        }
        pageDict.set('/Annots', '[ ' + annotIds.map(id => `${id} 0 R`).join(' ') + ' ]');
      }

      writer.writeObject(pageId, pageDict);
    }

    // 4. Write global resource dictionary (fonts, images)
    let globalResources: string = (ctx as any).resources?.writeResources?.(writer, pageIds.length) ?? '<< >>';

    // 5. Write ExtGState for watermark opacity if configured
    if (settings.watermark != null) {
      const gsId = writer.getNewId();
      // PDF/A-1B forbids CA/ca < 1.0 — use full opacity for compliant docs
      const opacity = settings.pdfAEnabled ? 1.0 : (settings.watermark.opacity ?? 1.0);
      writer.writeObject(
        gsId,
        new Map<string, string>([
          ['/Type', '/ExtGState'],
          ['/ca', opacity.toFixed(4)],
          ['/CA', opacity.toFixed(4)],
        ])
      );
      const extGStateRes = `<< /ExtGState << /GS_WM ${gsId} 0 R >> >>`;
      globalResources = mergeDicts(globalResources, extGStateRes);
    }

    // 6. Write the /Pages parent object
    writer.writeObject(
      pagesId,
      new Map<string, string>([
        ['/Type', '/Pages'],
        ['/Kids', '[ ' + pageIds.map(id => `${id} 0 R`).join(' ') + ' ]'],
        ['/Count', pageIds.length.toString()],
        ['/Resources', globalResources],
      ])
    );

    // 7. Write document info (/Info)
    const metadataWriter = new MetadataWriter(writer);
    metadataWriter.writeDocumentInfo(infoId, this.document.metadata);

    const catalogOptions = new CatalogOptions();

    // 8. Write ViewerPreferences if any non-default settings are active
    if (hasViewerPreferences(settings)) {
      catalogOptions.viewerPrefsId = writer.getNewId();
      writer.writeViewerPreferences(catalogOptions.viewerPrefsId, settings);
    }

    // 9. Write XMP metadata for PDF 1.7
    if (settings.version === PdfVersion.Pdf17) {
      catalogOptions.xmpMetadataId = writer.getNewId();
      metadataWriter.writeXmpMetadata(catalogOptions.xmpMetadataId, this.document.metadata, settings);
    }

    // 10. Write bookmarks (outlines) for PDF 1.7
    if (settings.version === PdfVersion.Pdf17 && settings.hasBookmarks) {
      const navWriter = new NavigationWriter(writer);
      const outlinesStartId = writer.getNewId();
      catalogOptions.outlinesId = navWriter.writeOutlineTree(outlinesStartId, settings.bookmarks, pageIds);
    }

    // 11. Write PDF/A output intents for PDF 1.7 + pdfA
    if (settings.pdfAEnabled && settings.version === PdfVersion.Pdf17) {
      const complianceWriter = new ComplianceWriter(writer);
      catalogOptions.pdfAEnabled = true;
      const iccProfileId = writer.getNewId();
      complianceWriter.writeIccProfile(iccProfileId);
      const outputIntentId = writer.getNewId();
      complianceWriter.writeOutputIntent(outputIntentId, iccProfileId);
      catalogOptions.outputIntentIds = [outputIntentId];
    }

    // 11b. Write PDF/UA structure tree. The in-memory tree currently only
    // contains the implicit Document root — actual semantic tagging arrives
    // once the renderer populates the tree. What lands here in this feature
    // is the catalog wiring: a valid empty StructTreeRoot referencing a
    // Document StructElem, plus /MarkInfo and /Lang.
    // 11b. Write PDF/UA structure tree. The tree was populated during
    // the render pass via taggingContext (this feature wire MCIDs and
    // semantic roles through the canvas). For this feature the tree is still a
    // Document-only skeleton; this feature adds the renderer-driven population.
    if (taggingContext) {
      const structureTreeWriter = new StructureTreeWriter(writer);
      catalogOptions.structTreeRootId = structureTreeWriter.write(taggingContext.tree);
      catalogOptions.tagged = true;
      catalogOptions.language = settings.language;
    }

    // 12. Write /Catalog
    if (pageIds.length === 0) throw new Error('Document has no pages');
    writer.writeCatalog(catalogId, pagesId, pageIds[0], settings, catalogOptions);

    // 13. Write encryption dictionary if encrypted
    if (encryptId > 0) writer.writeEncryptDictionary(encryptId);

    // 14. Finalize: xref table + trailer + %%EOF
    writer.close(catalogId, infoId);
  }

  /**
   * Serializes the document asynchronously.
   *
   * Uses a two-phase approach so that embedded TrueType fonts are loaded before
   * the render pass begins — without rendering the document twice (which would
   * corrupt stateful element pagination state):
   *
   *   Phase 1 — Font scan: walks the element tree and document settings to
   *             collect every embedded font path / URL referenced by any element.
   *             No rendering happens; element state is untouched.
   *
   *   Phase 2 — Preload: creates a `PdfResourceRegistry`, registers every
   *             discovered embedded font path, then awaits
   *             `preloadAllFontsAsync()`.  In browser environments this fetches
   *             TTF bytes via the Fetch API (requires
   *             `configurePlatform(new BrowserPlatformIO())` to have been called
   *             first).
   *
   *   Phase 3 — Real render: calls `serialize()` with the pre-loaded registry
   *             injected into the `RenderContext` so content streams use GID hex
   *             encoding for every embedded font.
   *
   * @param writer  A synchronous `IPdfWriter` or an `AsyncPdfWriter` wrapper.
   */
  public async serializeAsync(writer: IPdfWriter | IAsyncPdfWriter): Promise<void> {
    // Resolve to a synchronous IPdfWriter regardless of which variant was passed.
    const syncWriter: IPdfWriter =
      writer instanceof AsyncPdfWriter ? ((writer as any)['_inner'] as IPdfWriter) : (writer as unknown as IPdfWriter);

    const settings = this.document.settings;

    // ── Phase 1: Scan element tree for embedded font paths ───────────────────
    const embeddedPaths = new Set<string>();
    const pages: any[] = (this.document as any).pages ?? [];
    for (const page of pages) {
      const elements: any[] = typeof page.getElements === 'function' ? page.getElements() : (page.elements ?? []);
      for (const el of elements) {
        collectEmbeddedFonts(el, embeddedPaths);
      }
    }

    // Also check header/footer templates (call with page numbers 1 and 2 to
    // cover even/odd alternating templates).
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

    // Watermark font
    const wmFont = (settings as any).watermark?.fontName;
    if (wmFont && PdfResourceRegistry.isEmbeddedFont(wmFont)) {
      embeddedPaths.add(wmFont);
    }

    // ── Phase 2: Pre-register and async-preload all discovered fonts ─────────
    const preRegistry = new PdfResourceRegistry();
    preRegistry.pdfAEnabled = settings.pdfAEnabled;
    for (const path of embeddedPaths) {
      preRegistry.registerFont(path); // registers with font=null initially
    }
    await preRegistry.preloadAllFontsAsync();

    // ── Phase 3: Real serialization with the pre-loaded registry ────────────
    // Only pass the registry when there are actually embedded fonts to inject —
    // otherwise let serialize() create its own fresh registry (no-op optimisation).
    this.serialize(syncWriter, embeddedPaths.size > 0 ? preRegistry : undefined);
  }

  /**
   * Returns true if the document contains a VisualToc element, requiring
   * two-pass layout. Stubbed as false — VisualToc is out of scope.
   */
  private requiresTwoPassLayout(): boolean {
    return false;
  }
}

// ─── Module-level helpers ────────────────────────────────────────────────────

/**
 * Returns true if any non-default viewer preferences are configured,
 * indicating that a /ViewerPreferences dictionary should be written.
 */
function hasViewerPreferences(settings: any): boolean {
  return (
    settings.hideToolbar ||
    settings.hideMenubar ||
    settings.hideWindowUI ||
    settings.fitWindow ||
    settings.centerWindow ||
    settings.displayDocTitle
  );
}

/**
 * Merges two PDF dictionary strings by concatenating their inner entries.
 * e.g. "<< /Font << /F1 1 0 R >> >>" + "<< /ExtGState << /GS1 2 0 R >> >>"
 * → "<< /Font << /F1 1 0 R >> /ExtGState << /GS1 2 0 R >> >>"
 */
function mergeDicts(d1: string, d2: string): string {
  if (!d2) return d1;
  let t2 = d2.startsWith('<< ') ? d2.substring(3) : d2;
  t2 = t2.endsWith(' >>') ? t2.substring(0, t2.length - 3) : t2;
  const t1 = d1.endsWith(' >>') ? d1.substring(0, d1.length - 3) : d1;
  return t1 + ' ' + t2 + ' >>';
}

/**
 * Recursively walks an element (and its children) to collect every embedded
 * TTF / OTF font path or URL referenced by any `fontName`-bearing property.
 *
 * Uses duck typing so it works across all element types without importing them.
 * Any property whose name is "fontName" and whose value ends with .ttf or .otf
 * is treated as an embedded font path.
 *
 * Container elements are traversed via common child-collection shapes:
 *   • `.children` (VerticalStack, HorizontalStack)
 *   • `.Children`
 *   • `.getChildren()`
 *   • `.content` / `.getElements()` (Container, Page)
 *   • `.rows` → `.cells` → `.content` (Table)
 *   • `.spans` (RichText)
 *   • `.defaultStyle?.fontName` (RichText default style)
 *   • `.style?.fontName` (TextSpan)
 */
function collectEmbeddedFonts(element: any, paths: Set<string>): void {
  if (!element || typeof element !== 'object') return;

  // ── fontName on the element itself ────────────────────────────────────────
  if (typeof element.fontName === 'string' && PdfResourceRegistry.isEmbeddedFont(element.fontName)) {
    paths.add(element.fontName);
  }

  // ── defaultStyle (RichText) ───────────────────────────────────────────────
  if (
    element.defaultStyle &&
    typeof element.defaultStyle.fontName === 'string' &&
    PdfResourceRegistry.isEmbeddedFont(element.defaultStyle.fontName)
  ) {
    paths.add(element.defaultStyle.fontName);
  }

  // ── style (TextSpan) ─────────────────────────────────────────────────────
  if (
    element.style &&
    typeof element.style.fontName === 'string' &&
    PdfResourceRegistry.isEmbeddedFont(element.style.fontName)
  ) {
    paths.add(element.style.fontName);
  }

  // ── Resolve child collections ─────────────────────────────────────────────
  const childCollections: any[][] = [];

  // VerticalStack / HorizontalStack style
  if (Array.isArray(element.children)) childCollections.push(element.children);
  if (Array.isArray(element.Children)) childCollections.push(element.Children);
  if (typeof element.getChildren === 'function') {
    const c = element.getChildren();
    if (Array.isArray(c)) childCollections.push(c);
  }

  // Container / Page style
  if (Array.isArray(element.content)) childCollections.push(element.content);
  if (typeof element.getElements === 'function') {
    const e = element.getElements();
    if (Array.isArray(e)) childCollections.push(e);
  }

  // RichText spans
  if (Array.isArray(element.spans)) childCollections.push(element.spans);
  if (typeof element.getSpans === 'function') {
    const s = element.getSpans();
    if (Array.isArray(s)) childCollections.push(s);
  }

  // Table rows → cells → cell content
  const rows: any[] = Array.isArray(element.rows)
    ? element.rows
    : typeof element.getRows === 'function'
      ? (element.getRows() ?? [])
      : [];
  for (const row of rows) {
    if (!row) continue;
    const cells: any[] = Array.isArray(row.cells)
      ? row.cells
      : typeof row.getCells === 'function'
        ? (row.getCells() ?? [])
        : [];
    for (const cell of cells) {
      if (!cell) continue;
      if (Array.isArray(cell.content)) {
        for (const el of cell.content) collectEmbeddedFonts(el, paths);
      } else {
        collectEmbeddedFonts(cell.content, paths);
      }
      // Cell may itself have a fontName (header cells etc.)
      collectEmbeddedFonts(cell, paths);
    }
  }

  // Recurse into all resolved child collections
  for (const col of childCollections) {
    for (const child of col) {
      collectEmbeddedFonts(child, paths);
    }
  }
}
