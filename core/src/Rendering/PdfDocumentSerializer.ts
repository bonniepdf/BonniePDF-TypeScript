import { Document } from '../Document';
import { RenderContext } from './RenderContext';
import { PdfRenderPipeline } from './PdfRenderPipeline';
import { PdfResourceRegistry } from './PdfResourceRegistry';
import { DiagnosticsCollector } from '../Core/Diagnostics';
import { AsyncPdfWriter } from './Writers/AsyncPdfWriter';
import { MetadataWriter } from './Writers/MetadataWriter';
import { NavigationWriter } from './Writers/NavigationWriter';
import { ComplianceWriter } from './Writers/ComplianceWriter';
import { CatalogOptions } from './Writers/CatalogOptions';
import { AttachmentWriter } from './Writers/AttachmentWriter';
import { FileAttachment } from '../Attachments/FileAttachment';
import { allowsEmbeddedFiles } from '../Attachments/AttachmentRules';
import { IPdfWriter } from './Writers/IPdfWriter';
import { IAsyncPdfWriter } from './Writers/IAsyncPdfWriter';
import { StructureTreeWriter } from './Writers/StructureTreeWriter';
import { StructureTreeBuilder } from './Tagging/StructureTreeBuilder';
import { TaggingContext } from './Tagging/TaggingContext';
import { PdfVersion } from '../Configuration/PdfVersion';
import { AccessibilityMode } from '../Configuration/AccessibilityMode';
import { PdfEncryptor } from '../Security/Encryption/pdfEncryptor';
import { ConformancePlan } from './ConformancePlan';
import { EncryptionAlgorithm } from '../Security/Models/EncryptionAlgorithm';
import { Image } from '../Elements/Media/Image';
import type { DocumentSettings } from '../Configuration/DocumentSettings';

export class PdfDocumentSerializer {
  constructor(
    private document: Document,
    private diagnostics: DiagnosticsCollector = new DiagnosticsCollector()
  ) {}

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
    let conformancePlan = ConformancePlan.fromSettings(settings);

    // 0. Set up encryption if configured.
    // RC4: created synchronously here.
    // AES-256: if serializeAsync() already set writer.encryptor (via async
    // PdfEncryptor.create()), reuse it. Otherwise (pure sync generateBytes()
    // call) we skip AES-256 - the async key derivation can't run here.
    let encryptId = 0;
    if (settings.isEncrypted) {
      if (writer.encryptor) {
        encryptId = writer.getNewId();
      } else if (settings.encryption!.algorithm !== EncryptionAlgorithm.AES_256) {
        writer.encryptor = new PdfEncryptor(settings.encryption!);
        encryptId = writer.getNewId();
      }
    }

    // 1. Allocate top-level IDs up front
    const catalogId = writer.getNewId();
    const infoId = writer.getNewId();
    const pagesId = writer.getNewId(); // /Pages parent - written after all page objects
    // Resources are written as a single indirect object that every page
    // references explicitly (PDF/A-2b clause 6.2.2.2 / ISO 32000-1
    // §7.8.3). veraPDF profile `2b` rejects /Pages-inheritance even
    // though §7.7.3.4 allows it.
    const resourcesId = writer.getNewId();

    // 2. Initialize render context (inject pre-loaded resources when available)
    const orientedPageSize = settings.getOrientedPageSize();
    const ctx = new RenderContext(orientedPageSize, settings.margin, false, preloadedResources);
    ctx.resources.diagnostics = this.diagnostics;
    ctx.resources.conformance = settings.conformance;
    // PDF/UA-1 mandates font embedding (ISO 14289-1, veraPDF 7.21.4.1)
    // independently of any PDF/A claim - substitute embedded Liberation for
    // the standard-14 references in tagged output too.
    ctx.resources.embedStandardFonts = settings.accessibility === AccessibilityMode.PdfUa1;

    // PDF/UA tagging context - shared between the render pipeline
    // (canvas attaches MCIDs to the builder) and the structure-tree
    // writer at the end (emits the populated tree).
    const taggingContext = conformancePlan.needsStructureTree
      ? new TaggingContext(new StructureTreeBuilder())
      : undefined;
    ctx.tagging = taggingContext;

    // annotation bindings for /StructParent + /OBJR wiring.
    // Keys start at 10_000 above page keys so the /ParentTree number tree
    // has no collision between page keys (0..N-1) and annotation keys.
    const ANNOT_STRUCT_PARENT_BASE = 10_000;
    const annotBindings: Array<{
      structElem: import('./Tagging/StructureElement').StructureElement;
      annotId: number;
      pageObjectId: number;
      structParentKey: number;
    }> = [];
    let globalAnnotIndex = 0;

    // 3. Stream pages (low-memory path)
    const pageIds: number[] = [];
    let pageIndex = 0;

    for (const pageOutput of PdfRenderPipeline.renderPagesStreaming(this.document.pages, settings, ctx)) {
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

      // Build page dictionary - /Resources is an indirect reference
      // (see resourcesId comment above) so each page satisfies PDF/A-2b
      // clause 6.2.2.2 without duplicating the resources dict per page.
      const pageDict = new Map<string, string>([
        ['/Type', '/Page'],
        ['/Parent', `${pagesId} 0 R`],
        ['/MediaBox', `[0 0 ${pageOutput.size.width} ${pageOutput.size.height}]`],
        ['/Contents', `${contentId} 0 R`],
        ['/Resources', `${resourcesId} 0 R`],
      ]);

      // Tagged PDF: each page gets /StructParents = page index. The
      // /ParentTree emitted at the end by StructureTreeWriter keys off
      // the same number so MCID→StructElem reverse lookup works.
      if (taggingContext) {
        pageDict.set('/StructParents', String(pageIndex - 1));
        pageDict.set('/Tabs', '/S'); // follow structure order for tab navigation
      }

      // Write link annotations if present
      if (pageOutput.hyperlinks.length > 0) {
        const annotIds: number[] = [];
        for (const link of pageOutput.hyperlinks) {
          const annotId = writer.getNewId();
          let structParentKey: number | undefined;
          if (taggingContext) {
            structParentKey = ANNOT_STRUCT_PARENT_BASE + globalAnnotIndex++;
          }
          writer.writeLinkAnnotation(annotId, link, pageIds, structParentKey);
          annotIds.push(annotId);
          if (taggingContext && link.linkedStructElement != null && structParentKey != null) {
            link.linkedStructElement.objrAnnotations.push({ annotId, pageObjectId: pageId });
            annotBindings.push({
              structElem: link.linkedStructElement,
              annotId,
              pageObjectId: pageId,
              structParentKey,
            });
          }
        }
        pageDict.set('/Annots', '[ ' + annotIds.map(id => `${id} 0 R`).join(' ') + ' ]');
      }

      writer.writeObject(pageId, pageDict);
    }

    // 4. Write global resource dictionary (fonts, images)
    const globalResources: string = ctx.resources.writeResources(writer, pageIds.length) ?? '<< >>';

    // ── Honest PDF/A claim ──────────────────────────────────────
    // PDF/A is an opt-in claim. Once resources have been written, ask the
    // conformance plan whether that claim can still be emitted honestly
    // (currently: no non-embedded standard-14 font references).
    conformancePlan = conformancePlan.withResourceRegistry(ctx.resources);

    // 6a. Write the global Resources object every page references.
    // PDF/A-2b clause 6.2.2.2 - see page-dict comment above.
    writer.writeRawObject(resourcesId, globalResources);

    // 6b. Write the /Pages parent object. /Resources is intentionally
    // omitted - the per-page indirect references are authoritative.
    writer.writeObject(
      pagesId,
      new Map<string, string>([
        ['/Type', '/Pages'],
        ['/Kids', '[ ' + pageIds.map(id => `${id} 0 R`).join(' ') + ' ]'],
        ['/Count', pageIds.length.toString()],
      ])
    );

    // 7. Write document info (/Info)
    const metadataWriter = new MetadataWriter(writer);
    metadataWriter.writeDocumentInfo(infoId, this.document.metadata);

    const catalogOptions = new CatalogOptions();

    // 8. Write ViewerPreferences if any non-default settings are active.
    // PDF/UA-1 mandates /DisplayDocTitle true (Matterhorn Protocol §7-1).
    if (hasViewerPreferences(settings) || conformancePlan.needsViewerPreferencesDisplayDocTitle) {
      catalogOptions.viewerPrefsId = writer.getNewId();
      const vp = conformancePlan.needsViewerPreferencesDisplayDocTitle
        ? { ...settings, displayDocTitle: true }
        : settings;
      writer.writeViewerPreferences(catalogOptions.viewerPrefsId, vp);
    }

    // 9. Write XMP metadata for PDF 1.7+ output. Pass the effective PDF/A
    // flag (not the raw settings flag) so we don't emit a pdfaid
    // claim we can't honour.
    if (conformancePlan.needsXmpMetadata) {
      catalogOptions.xmpMetadataId = writer.getNewId();
      metadataWriter.writeXmpMetadata(
        catalogOptions.xmpMetadataId,
        this.document.metadata,
        conformancePlan.createXmpSettings()
      );
    }

    // 10. Write bookmarks (outlines) for PDF 1.7+ output
    if (
      (conformancePlan.pdfVersion === PdfVersion.Pdf17 || conformancePlan.pdfVersion === PdfVersion.Pdf20) &&
      settings.hasBookmarks
    ) {
      const navWriter = new NavigationWriter(writer);
      const outlinesStartId = writer.getNewId();
      catalogOptions.outlinesId = navWriter.writeOutlineTree(outlinesStartId, settings.bookmarks, pageIds);
    }

    // 11. Write PDF/A output intents.
    // this feature guard (§6.3.4): for PDF/A, suppress the OutputIntent (and the pdfaid XMP claim)
    // when standard-14 fonts are not embedded - the claim would be dishonest.
    // For PDF/UA-1 the OutputIntent is needed for colour management regardless of font
    // embedding status (font embedding is a separate §6.3.4 violation on its own).
    if (conformancePlan.needsOutputIntent) {
      const complianceWriter = new ComplianceWriter(writer);
      catalogOptions.pdfAEnabled = conformancePlan.effectivePdfAEnabled;
      const iccProfileId = writer.getNewId();
      complianceWriter.writeIccProfile(iccProfileId);
      const outputIntentId = writer.getNewId();
      complianceWriter.writeOutputIntent(outputIntentId, iccProfileId);
      catalogOptions.outputIntentIds = [outputIntentId];
    }

    // 11b. Write PDF/UA structure tree. The in-memory tree currently only
    // contains the implicit Document root - actual semantic tagging arrives
    // once the renderer populates the tree. What lands here in this feature
    // is the catalog wiring: a valid empty StructTreeRoot referencing a
    // Document StructElem, plus /MarkInfo and /Lang.
    // 11b. Write PDF/UA structure tree. The tree was populated during
    // the render pass via taggingContext (this feature wire MCIDs and
    // semantic roles through the canvas). For this feature the tree is still a
    // Document-only skeleton; this feature adds the renderer-driven population.
    if (taggingContext) {
      const structureTreeWriter = new StructureTreeWriter(writer);
      catalogOptions.structTreeRootId = structureTreeWriter.write(taggingContext.tree, pageIds, annotBindings);
      catalogOptions.tagged = true;
      catalogOptions.language = settings.language;
    }

    // 12. Write /PageLabels number tree if configured (PDF §12.4.2).
    if (settings.pageLabel) {
      const label = settings.pageLabel;
      const styleMap: Record<string, string> = {
        decimal: '/D',
        'lowercase-roman': '/r',
        'uppercase-roman': '/R',
        'lowercase-alpha': '/a',
        'uppercase-alpha': '/A',
      };
      const parts: string[] = [`/S ${styleMap[label.style ?? 'decimal']}`];
      if (label.prefix) parts.push(`/P (${label.prefix})`);
      if (label.startAt != null && label.startAt !== 1) parts.push(`/St ${label.startAt}`);
      const pageLabelsId = writer.getNewId();
      writer.writeObject(pageLabelsId, new Map([['/Nums', `[ 0 << ${parts.join(' ')} >> ]`]]));
      catalogOptions.pageLabelsId = pageLabelsId;
    }

    // 12b. Write document attachments (embedded files) subject to the
    // conformance guard. Populates /Names /EmbeddedFiles and /AF.
    const attachmentsToWrite = this.resolveAttachments();
    if (attachmentsToWrite) {
      const attachmentWriter = new AttachmentWriter(writer);
      const result = attachmentWriter.writeAttachments(attachmentsToWrite);
      catalogOptions.namesEmbeddedFilesId = result.namesEmbeddedFilesId;
      catalogOptions.associatedFileIds = result.associatedFileIds;
    }

    // 13. Write /Catalog
    if (pageIds.length === 0) throw new Error('Document has no pages');
    writer.writeCatalog(catalogId, pagesId, pageIds[0], settings, catalogOptions);

    // 14. Write encryption dictionary if encrypted
    if (encryptId > 0) writer.writeEncryptDictionary(encryptId);

    // 15. Finalize: xref table + trailer + %%EOF
    writer.close(catalogId, infoId);
  }

  /**
   * Applies the embedded-file conformance guard ({@link allowsEmbeddedFiles})
   * and returns the attachments to write, or `undefined` when there is
   * nothing to embed. Under a PDF/A level that forbids embedded files the
   * attachments are dropped and a warning diagnostic recorded, keeping the
   * emitted PDF's conformance claim honest.
   */
  private resolveAttachments(): readonly FileAttachment[] | undefined {
    const attachments = this.document.attachments;
    if (!attachments || attachments.length === 0) return undefined;

    if (!allowsEmbeddedFiles(this.document.settings.conformance)) {
      this.diagnostics.addWarning(
        'attachment',
        `${this.document.settings.conformance} does not permit embedded files; ` +
          `${attachments.length} attachment(s) were dropped. Use PdfAConformance.PdfA3b ` +
          'for e-invoicing (ZUGFeRD / Factur-X).'
      );
      return undefined;
    }

    return attachments;
  }

  /**
   * Serializes the document asynchronously.
   *
   * Uses a two-phase approach so that embedded TrueType fonts are loaded before
   * the render pass begins - without rendering the document twice (which would
   * corrupt stateful element pagination state):
   *
   *   Phase 1 - Font scan: walks the element tree and document settings to
   *             collect every embedded font path / URL referenced by any element.
   *             No rendering happens; element state is untouched.
   *
   *   Phase 2 - Preload: creates a `PdfResourceRegistry`, registers every
   *             discovered embedded font path, then awaits
   *             `preloadAllFontsAsync()`.  In browser environments this fetches
   *             TTF bytes via the Fetch API (requires
   *             `configurePlatform(new BrowserPlatformIO())` to have been called
   *             first).
   *
   *   Phase 3 - Real render: calls `serialize()` with the pre-loaded registry
   *             injected into the `RenderContext` so content streams use GID hex
   *             encoding for every embedded font.
   *
   * @param writer  A synchronous `IPdfWriter` or an `AsyncPdfWriter` wrapper.
   */
  public async serializeAsync(writer: IPdfWriter | IAsyncPdfWriter): Promise<void> {
    // Resolve to a synchronous IPdfWriter regardless of which variant was passed.
    const syncWriter: IPdfWriter = writer instanceof AsyncPdfWriter ? writer.syncWriter : (writer as IPdfWriter);

    const settings = this.document.settings;

    // ── Phase 1: Scan element tree for embedded font paths ───────────────────
    const embeddedPaths = new Set<string>();
    const pages = this.document.pages;
    for (const page of pages) {
      for (const el of page.getElements()) {
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
    const wmFont = settings.watermark?.fontName;
    if (wmFont && PdfResourceRegistry.isEmbeddedFont(wmFont)) {
      embeddedPaths.add(wmFont);
    }

    // ── Phase 2: Pre-register and async-preload all discovered fonts ─────────
    const preRegistry = new PdfResourceRegistry();
    preRegistry.diagnostics = this.diagnostics;
    preRegistry.conformance = settings.conformance;
    for (const path of embeddedPaths) {
      preRegistry.registerFont(path); // registers with font=null initially
    }
    await preRegistry.preloadAllFontsAsync();

    // ── Phase 2b: Async-decode any PNG images that need it ──────────────────
    // Real-world PNGs use Huffman-compressed deflate, which the sync inflater
    // cannot decode.  Walk the element tree, gather every Image whose bytes
    // need async decode, then prepare them all in parallel via
    // `DecompressionStream`.  After this completes, the sync render pass can
    // read the cached ImageInfo on each Image directly.
    const imagesToDecode: Image[] = [];
    for (const page of pages) {
      for (const el of page.getElements()) {
        collectImagesNeedingDecode(el, imagesToDecode);
      }
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

    // ── Phase 2c: Async AES-256 encryptor init ──────────────────────────────
    // AES-256 key derivation requires SubtleCrypto (async). Initialise the
    // encryptor here so that the sync serialize() pass can use it via the
    // pure-JS SyncAesCipher. RC4 encryptors are created inside serialize().
    const settings2 = this.document.settings;
    if (settings2.isEncrypted && settings2.encryption!.algorithm === EncryptionAlgorithm.AES_256) {
      syncWriter.encryptor = await PdfEncryptor.create(settings2.encryption!);
    }

    // ── Phase 3: Real serialization with the pre-loaded registry ────────────
    // Only pass the registry when there are actually embedded fonts to inject -
    // otherwise let serialize() create its own fresh registry (no-op optimisation).
    this.serialize(syncWriter, embeddedPaths.size > 0 ? preRegistry : undefined);
  }
}

// ─── Module-level helpers ────────────────────────────────────────────────────

/**
 * Returns true if any non-default viewer preferences are configured,
 * indicating that a /ViewerPreferences dictionary should be written.
 */
function hasViewerPreferences(settings: DocumentSettings): boolean {
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
 * Recursively walks an element (and its children) to collect every embedded
 * TTF / OTF font path or URL referenced by any `fontName`-bearing property.
 *
 * Uses duck typing so it works across all element types without importing them.
 * Any property whose name is "fontName" and whose value ends with .ttf or .otf
 * is treated as an embedded font path.
 *
 * Container elements are traversed via common child-collection shapes:
 *   • `.children` (VerticalStack, HorizontalStack)
 *   • `.getChildren()`
 *   • `.content` / `.getElements()` (Container, Page)
 *   • `.rows` → `.cells` → `.content` (Table)
 *   • `.spans` (RichText)
 *   • `.defaultStyle?.fontName` (RichText default style)
 *   • `.style?.fontName` (TextSpan)
 */
/**
 * Walk the element tree and collect every `Image` whose raw bytes still need
 * an async decode step (i.e. a PNG that hasn't been prepared yet).  Uses the
 * same child-resolution rules as {@link collectEmbeddedFonts}.
 */
export function collectImagesNeedingDecode(element: unknown, out: Image[]): void {
  if (!element || typeof element !== 'object') return;

  // Guard against duplicates: containers can be reached through more than one
  // probe shape (e.g. `.children` and `getChildren()`), and each image must be
  // prepared exactly once.
  if (element instanceof Image && element.needsAsyncDecode() && !out.includes(element)) {
    out.push(element);
  }

  forEachChild(element, child => collectImagesNeedingDecode(child, out));
}

/**
 * Structural probe for the duck-typed element-tree walk: the child-collection
 * shapes exposed by the various container elements. Every member is optional -
 * an element exposes whichever shapes apply to it.
 */
interface WalkableElement {
  fontName?: unknown;
  defaultStyle?: { fontName?: unknown };
  style?: { fontName?: unknown };
  children?: unknown;
  getChildren?(): unknown;
  content?: unknown;
  getElements?(): unknown;
  spans?: unknown;
  getSpans?(): unknown;
  rows?: unknown;
  getRows?(): unknown;
}

interface WalkableRow {
  cells?: unknown;
  getCells?(): unknown;
}

interface WalkableCell {
  content?: unknown;
}

/** Resolves a Table-style row collection from `.rows` / `.getRows()`. */
function resolveRows(element: WalkableElement): unknown[] {
  if (Array.isArray(element.rows)) return element.rows;
  if (typeof element.getRows === 'function') {
    const r = element.getRows();
    if (Array.isArray(r)) return r;
  }
  return [];
}

/** Resolves a row's cell collection from `.cells` / `.getCells()`. */
function resolveCells(row: WalkableRow): unknown[] {
  if (Array.isArray(row.cells)) return row.cells;
  if (typeof row.getCells === 'function') {
    const c = row.getCells();
    if (Array.isArray(c)) return c;
  }
  return [];
}

function forEachChild(value: object, visit: (child: unknown) => void): void {
  const element = value as WalkableElement;
  if (Array.isArray(element.children)) for (const c of element.children) visit(c);
  if (typeof element.getChildren === 'function') {
    const c = element.getChildren();
    if (Array.isArray(c)) for (const ch of c) visit(ch);
  }
  if (Array.isArray(element.content)) for (const c of element.content) visit(c);
  if (typeof element.getElements === 'function') {
    const e = element.getElements();
    if (Array.isArray(e)) for (const el of e) visit(el);
  }
  if (Array.isArray(element.spans)) for (const s of element.spans) visit(s);
  if (typeof element.getSpans === 'function') {
    const s = element.getSpans();
    if (Array.isArray(s)) for (const sp of s) visit(sp);
  }
  for (const row of resolveRows(element)) {
    if (!row || typeof row !== 'object') continue;
    for (const cell of resolveCells(row as WalkableRow)) {
      if (!cell || typeof cell !== 'object') continue;
      const content = (cell as WalkableCell).content;
      if (Array.isArray(content)) for (const el of content) visit(el);
      else visit(content);
      visit(cell);
    }
  }
}

export function collectEmbeddedFonts(element: unknown, paths: Set<string>): void {
  if (!element || typeof element !== 'object') return;
  const el = element as WalkableElement;

  // ── fontName on the element itself ────────────────────────────────────────
  if (typeof el.fontName === 'string' && PdfResourceRegistry.isEmbeddedFont(el.fontName)) {
    paths.add(el.fontName);
  }

  // ── defaultStyle (RichText) ───────────────────────────────────────────────
  if (
    el.defaultStyle &&
    typeof el.defaultStyle.fontName === 'string' &&
    PdfResourceRegistry.isEmbeddedFont(el.defaultStyle.fontName)
  ) {
    paths.add(el.defaultStyle.fontName);
  }

  // ── style (TextSpan) ─────────────────────────────────────────────────────
  if (el.style && typeof el.style.fontName === 'string' && PdfResourceRegistry.isEmbeddedFont(el.style.fontName)) {
    paths.add(el.style.fontName);
  }

  // ── Recurse into every child-collection shape (stacks, Container/Page,
  // RichText spans, and Table rows → cells → cell content) ─────────────────
  forEachChild(element, child => collectEmbeddedFonts(child, paths));
}
