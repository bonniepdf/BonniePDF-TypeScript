import { DocumentSettings, type DocumentSettingsOptions } from './Configuration/DocumentSettings';
import { DocumentMetadata, type DocumentMetadataOptions } from './Configuration/DocumentMetadata';
import { IElement } from './Elements/IElement';
import { Page } from './Elements/Layout/Page';
import { PdfSize } from './Configuration/PdfSize';
import { PageOrientation } from './Core/PageOrientation';
import { PdfVersion } from './Configuration/PdfVersion';
import { PdfAConformance } from './Configuration/PdfAConformance';
import { AccessibilityMode } from './Configuration/AccessibilityMode';
import { EncryptionAlgorithm } from './Security/Models/EncryptionAlgorithm';
import { PdfWriter } from './Rendering/Writers/PdfWriter';
import { PdfDocumentSerializer } from './Rendering/PdfDocumentSerializer';
import { getPlatformIO } from './Platform/PlatformIO';
import { TextElementBase } from './Elements/Text/TextElementBase';
import type { TextStyle } from './Elements/Text/TextStyle';
import { IDiagnostic, DiagnosticsCollector } from './Core/Diagnostics';
import { exportSvgPagesAsync, exportSvgDocumentAsync, SvgDocumentExport } from './Export/SvgPageExporter';
import { SvgPageExportOptions } from './Export/SvgPageExportOptions';
import { FileAttachment } from './Attachments/FileAttachment';
import { AttachmentRelationship } from './Attachments/AttachmentRelationship';

/**
 * Options for creating a {@link Document}.
 *
 * The `settings` / `metadata` split is deliberate and binding (`09 §2.1`): it
 * mirrors the document model and the C# surface (`doc.Settings.X` /
 * `doc.Metadata.X`), so an option path here and a property path there are the
 * same path. Flattening `title`/`conformance`/… to the top level would invent a
 * TypeScript-only grouping with no neutral-spec counterpart.
 *
 * Each half accepts either an instance or its own options literal, so no
 * sub-type import is needed to configure a document.
 */
export interface DocumentOptions {
  /** Document settings; accepts an instance or an options literal. */
  settings?: DocumentSettings | DocumentSettingsOptions;
  /** Document metadata; accepts an instance or an options literal. */
  metadata?: DocumentMetadata | DocumentMetadataOptions;
}

/** Options for {@link Document.addPage}. */
export interface AddPageOptions {
  /** Page size; defaults to the document's configured page size. */
  size?: PdfSize;
  /**
   * Page orientation. When set, it is applied to `size` (or the document's
   * page size). When omitted with no `size`, the document orientation applies.
   */
  orientation?: PageOrientation;
  /** Page margin in points; defaults to the document's margin. */
  margin?: number;
}

/**
 * High-level entry point for creating PDF documents.
 * Provides a simplified API for adding elements, setting metadata, and saving PDFs.
 */
export class Document {
  private readonly _pages: Page[] = [];
  private readonly _attachments: FileAttachment[] = [];
  private _disposed = false;
  private readonly _diagnostics: DiagnosticsCollector = new DiagnosticsCollector();

  public settings: DocumentSettings;
  public metadata: DocumentMetadata;

  /**
   * Recoverable issues collected during the most recent `generateBytes` /
   * `generateBytesAsync` call - typically font load failures or subset
   * fallbacks. Empty before generation. Call {@link printDiagnostics} to
   * surface them via console, or inspect directly to feed into custom UI
   * / telemetry.
   */
  public get diagnostics(): readonly IDiagnostic[] {
    return this._diagnostics.all;
  }

  /**
   * Convenience: writes each diagnostic to `console.error` / `console.warn`
   * / `console.info` according to its severity. Library code never calls
   * this implicitly - callers opt in.
   */
  public printDiagnostics(): void {
    this._diagnostics.print();
  }

  /** Creates a new document with default settings and an empty first page. */
  constructor();
  /**
   * Creates a new document from an options object (the primary form).
   * @example new Document({ settings, metadata })
   */
  constructor(options: DocumentOptions);
  /** Convenience: creates a new document with the given settings. */
  constructor(settings: DocumentSettings);
  /** Convenience: creates a new document with the given metadata. */
  constructor(metadata: DocumentMetadata);
  /** Convenience: creates a new document with the given settings and metadata. */
  constructor(settings: DocumentSettings, metadata: DocumentMetadata);
  constructor(arg?: DocumentOptions | DocumentSettings | DocumentMetadata, metadata?: DocumentMetadata) {
    if (arg instanceof DocumentMetadata) {
      this.settings = new DocumentSettings();
      this.metadata = arg;
    } else if (arg instanceof DocumentSettings) {
      this.settings = arg;
      this.metadata = metadata ?? new DocumentMetadata();
    } else {
      // `DocumentOptions` is the only bare-object form (`09a §3.4` rule 1), so
      // anything reaching here is that bag; each half may be an instance or a
      // literal.
      const settings = arg?.settings;
      const metadata = arg?.metadata;
      this.settings = settings instanceof DocumentSettings ? settings : new DocumentSettings(settings ?? {});
      this.metadata = metadata instanceof DocumentMetadata ? metadata : new DocumentMetadata(metadata ?? {});
    }
    // Auto-create the first page (mirrors C# behaviour)
    this.addPage();
  }

  /** Gets the pages in this document (read-only). */
  public get pages(): ReadonlyArray<Page> {
    return this._pages;
  }

  // ─── Attachments ─────────────────────────────────────────────────────────────

  /**
   * Files embedded into the generated PDF as associated files (PDF/A-3 /
   * ZUGFeRD). Embedded files are honoured under `None`, PDF/A-3, and
   * PDF/A-4; under levels that forbid them (PDF/A-1, PDF/A-2) they are
   * dropped at generation time with a diagnostic, keeping the conformance
   * claim honest.
   */
  public get attachments(): ReadonlyArray<FileAttachment> {
    return this._attachments;
  }

  /** Embeds a file into the document. Returns this document for chaining. */
  public attach(attachment: FileAttachment): this;
  /**
   * Embeds a file into the document from a name and bytes. Returns this
   * document for chaining.
   */
  public attach(
    fileName: string,
    content: Uint8Array,
    options?: { relationship?: AttachmentRelationship; mediaType?: string }
  ): this;
  public attach(
    attachmentOrName: FileAttachment | string,
    content?: Uint8Array,
    options?: { relationship?: AttachmentRelationship; mediaType?: string }
  ): this {
    if (this._disposed) throw new Error('Document has been disposed.');
    if (typeof attachmentOrName === 'string') {
      this._attachments.push({
        fileName: attachmentOrName,
        content: content!,
        relationship: options?.relationship,
        mediaType: options?.mediaType,
      });
    } else {
      this._attachments.push(attachmentOrName);
    }
    return this;
  }

  // ─── Element helpers ─────────────────────────────────────────────────────────

  /** Adds an element to the current (last) page. */
  public add(element: IElement): void {
    if (this._disposed) throw new Error('Document has been disposed.');
    if (!element) throw new Error('element cannot be null.');
    if (this._pages.length === 0) this.addPage();
    this._pages[this._pages.length - 1].add(element);
  }

  /** Adds multiple elements to the current page. */
  public addRange(elements: Iterable<IElement>): void {
    for (const el of elements) this.add(el);
  }

  // ─── Page management ─────────────────────────────────────────────────────────

  /** Adds a new page using the document's default size and margin. */
  public addPage(): Page;
  /**
   * Adds a new page configured by an options object (the primary form).
   * @example doc.addPage({ orientation: PageOrientation.Landscape, margin: 30 })
   */
  public addPage(options: AddPageOptions): Page;
  /** Convenience: adds a new page with the given size and the document's default margin. */
  public addPage(pageSize: PdfSize): Page;
  /** Convenience: adds a new page with the given size and margin. */
  public addPage(pageSize: PdfSize, margin: number): Page;
  /** Convenience: adds a new page with the given size and orientation (document margin). */
  public addPage(pageSize: PdfSize, orientation: PageOrientation): Page;
  /** Convenience: adds a new page with the given size, orientation, and margin. */
  public addPage(pageSize: PdfSize, orientation: PageOrientation, margin: number): Page;
  public addPage(
    pageSize?: PdfSize | AddPageOptions,
    orientationOrMargin?: PageOrientation | number,
    margin?: number
  ): Page {
    if (pageSize && !(pageSize instanceof PdfSize)) {
      return this.addPageFromOptions(pageSize);
    }

    if (!pageSize) {
      // Default: use document settings
      const size = this.settings.getOrientedPageSize();
      const page = new Page(size, this.settings.margin);
      page.hasExplicitMargin = false;
      this._pages.push(page);
      return page;
    }

    if (typeof orientationOrMargin === 'number') {
      // addPage(size, margin)
      const page = new Page(pageSize, orientationOrMargin);
      this._pages.push(page);
      return page;
    }

    if (orientationOrMargin !== undefined) {
      // addPage(size, orientation[, margin])
      const oriented = pageSize.getOrientedSize(orientationOrMargin);
      const m = margin ?? this.settings.margin;
      const page = new Page(oriented, m);
      page.hasExplicitMargin = margin !== undefined;
      this._pages.push(page);
      return page;
    }

    // addPage(size) - document margin
    const page = new Page(pageSize, this.settings.margin);
    page.hasExplicitMargin = false;
    this._pages.push(page);
    return page;
  }

  /** Resolves an {@link AddPageOptions} object with the same defaults as the positional forms. */
  private addPageFromOptions(options: AddPageOptions): Page {
    const margin = options.margin ?? this.settings.margin;
    let size: PdfSize;
    if (options.size) {
      size = options.orientation !== undefined ? options.size.getOrientedSize(options.orientation) : options.size;
    } else {
      size =
        options.orientation !== undefined
          ? this.settings.pageSize.getOrientedSize(options.orientation)
          : this.settings.getOrientedPageSize();
    }
    const page = new Page(size, margin);
    page.hasExplicitMargin = options.margin !== undefined;
    this._pages.push(page);
    return page;
  }

  /**
   * Replaces the current (last) page with a new page of the given settings,
   * preserving any elements already added to it.
   */
  public setCurrentPageSettings(pageSize: PdfSize, orientation: PageOrientation, margin: number): void {
    if (this._pages.length === 0) return;
    const orientedSize = pageSize.getOrientedSize(orientation);
    const newPage = new Page(orientedSize, margin);
    const oldPage = this._pages[this._pages.length - 1];
    for (const el of oldPage.getElements()) newPage.add(el);
    this._pages[this._pages.length - 1] = newPage;
  }

  // ─── Output ───────────────────────────────────────────────────────────────────

  /**
   * Serializes the document to PDF bytes synchronously.
   *
   * Embedded TrueType fonts are loaded with `TtfFont.fromFileSync()`, which
   * requires a Node.js environment.  In browser contexts call
   * `generateBytesAsync()` instead so fonts are fetched via the Fetch API.
   *
   * Fully synchronous - uses the RC4 encryption path if encryption is set
   * (AES-256 encryption requires saveAsync).
   */
  public generateBytes(): Uint8Array {
    this._diagnostics.clear();
    this.applyDefaultStyleToTree();
    this.validateSettings();
    const writer = new PdfWriter(this.settings.version);
    const serializer = new PdfDocumentSerializer(this, this._diagnostics);
    serializer.serialize(writer);
    return writer.toUint8Array();
  }

  /**
   * Serializes the document to PDF bytes asynchronously.
   *
   * Uses a two-phase render:
   *  1. A quick dry-run to discover every embedded font referenced by the document.
   *  2. An async preload step that fetches TTF bytes via the configured platform
   *     I/O (works in both Node.js and browser environments when
   *     `configurePlatform(new BrowserPlatformIO())` has been called).
   *  3. The real render pass, which uses the loaded fonts to emit correct GID hex
   *     strings in content streams.
   *
   * Prefer this over `generateBytes()` whenever TTF font embedding is used in a
   * browser context.
   */
  public async generateBytesAsync(): Promise<Uint8Array> {
    this._diagnostics.clear();
    this.applyDefaultStyleToTree();
    this.validateSettings();
    const writer = new PdfWriter(this.settings.version);
    const serializer = new PdfDocumentSerializer(this, this._diagnostics);
    await serializer.serializeAsync(writer);
    return writer.toUint8Array();
  }

  // ─── SVG page export ────────────────────────────────────────────────

  /**
   * Renders every laid-out page of the document to a standalone SVG string.
   *
   * Runs the same layout, pagination, watermark, and header/footer pipeline as
   * PDF output, so the returned array has one entry per generated PDF page and
   * the visual layout matches. Embedded fonts and PNG images are preloaded
   * exactly as the async PDF path does, so this is the recommended export entry
   * point in both Node and the browser.
   */
  public async generateSvgPagesAsync(options?: SvgPageExportOptions): Promise<string[]> {
    this.applyDefaultStyleToTree();
    return exportSvgPagesAsync(this, options);
  }

  /**
   * Like {@link generateSvgPagesAsync}, but also returns `@font-face` CSS that
   * embeds a minimal subset of the fonts the document uses. Inject the CSS once
   * into the host page so the SVG renders with the exact fonts used for layout,
   * independent of what the viewer has installed. See {@link SvgDocumentExport}.
   */
  public async generateSvgDocumentAsync(options?: SvgPageExportOptions): Promise<SvgDocumentExport> {
    this.applyDefaultStyleToTree();
    return exportSvgDocumentAsync(this, options);
  }

  /**
   * Renders a single page (zero-based index) to a standalone SVG string.
   */
  public async generateSvgPageAsync(pageIndex: number, options?: SvgPageExportOptions): Promise<string> {
    const pages = await this.generateSvgPagesAsync(options);
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error(`Page index ${pageIndex} out of range (document has ${pages.length} page(s))`);
    }
    return pages[pageIndex];
  }

  /**
   * Convenience for example cards and social previews: renders the first page
   * to a standalone SVG string.
   */
  public async generateFirstPageSvgAsync(options?: SvgPageExportOptions): Promise<string> {
    return this.generateSvgPageAsync(0, options);
  }

  /**
   * @deprecated Use {@link generateBytes} instead. This alias exists only to
   * mirror the C# `ToByteArray()` name and will be removed in a future major.
   */
  public toByteArray(): Uint8Array {
    return this.generateBytes();
  }

  /**
   * @deprecated Use {@link generateBytesAsync} instead. This alias exists only
   * to mirror the C# `ToByteArrayAsync()` name and will be removed in a future
   * major.
   */
  public async toByteArrayAsync(): Promise<Uint8Array> {
    return this.generateBytesAsync();
  }

  /**
   * Saves the document to the given file path synchronously.
   * Requires a platform with synchronous file IO (Node.js via the node entry
   * point); throws in browser contexts - use saveAsync instead.
   */
  public save(path: string): void {
    if (!path) throw new Error('path cannot be null or empty.');
    const io = getPlatformIO();
    if (!io.writeFileSync) {
      throw new Error(
        'Document.save() requires synchronous file IO, which is only available in Node.js. ' +
          'Use saveAsync() in browser environments.'
      );
    }
    const bytes = this.generateBytes();
    io.writeFileSync(path, bytes);
  }

  /**
   * Saves the document to the given file path asynchronously via the configured
   * platform I/O. Uses the async generation path, so embedded fonts are
   * preloaded (browser-safe) and AES-256 encryption is supported.
   */
  public async saveAsync(path: string): Promise<void> {
    if (!path) throw new Error('path cannot be null or empty.');
    const bytes = await this.generateBytesAsync();
    await getPlatformIO().writeFile(path, bytes);
  }

  // ─── Default style cascade ────────────────────────────────────────────────────

  private applyDefaultStyleToTree(): void {
    const style = this.settings.defaultTextStyle;
    if (!style) return;
    for (const page of this._pages) {
      for (const el of page.getElements()) {
        Document.applyStyleToElement(el, style);
      }
    }
  }

  private static applyStyleToElement(el: IElement, style: TextStyle): void {
    if (el instanceof TextElementBase) {
      el.applyDefaultStyleIfNotSet(style);
    }
    // Canonical traversal: containers expose their renderable children via
    // IElement.getChildren() (stacks, Container, lists, Table).
    for (const child of el.getChildren?.() ?? []) {
      Document.applyStyleToElement(child, style);
    }
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  private validateSettings(): void {
    const s = this.settings;

    if (
      s.isEncrypted &&
      s.encryption!.algorithm === EncryptionAlgorithm.AES_256 &&
      s.version !== PdfVersion.Pdf17 &&
      s.version !== PdfVersion.Pdf20
    ) {
      throw new Error('AES-256 encryption requires PdfVersion.Pdf17 or PdfVersion.Pdf20.');
    }

    // PDF/A requires a matching PDF base version. Silently upgrade rather
    // than throw - the caller asked for archival output, so honour that intent.
    if (s.conformance === PdfAConformance.PdfA4 && s.version !== PdfVersion.Pdf20) {
      s.version = PdfVersion.Pdf20;
    } else if (
      s.conformance !== PdfAConformance.None &&
      s.conformance !== PdfAConformance.PdfA4 &&
      s.version !== PdfVersion.Pdf17
    ) {
      s.version = PdfVersion.Pdf17;
    }

    if (s.conformance !== PdfAConformance.None && s.isEncrypted) {
      throw new Error('PDF/A mode cannot be combined with encryption.');
    }

    // PDF/UA-1 tagging requires PDF 1.7 too, and nothing else upgrades the
    // version for an accessibility-only request (PDF/A above already covers
    // its own conformance levels). Silently upgrade the default rather than
    // silently dropping tagging - the caller asked for accessible output, so
    // honour that intent, same as the PDF/A branch above. An explicit
    // PdfVersion.Pdf20 request is left alone and still hits the throw below.
    if (
      s.accessibility === AccessibilityMode.PdfUa1 &&
      s.version !== PdfVersion.Pdf17 &&
      s.version !== PdfVersion.Pdf20
    ) {
      s.version = PdfVersion.Pdf17;
    }

    if (s.accessibility === AccessibilityMode.PdfUa1 && s.version === PdfVersion.Pdf20) {
      throw new Error(
        'PDF/UA-1 output is only supported with PdfVersion.Pdf17. PDF/UA-2 for PdfVersion.Pdf20 is not implemented yet.'
      );
    }

    // "a" levels require tagged output (PDF/UA-1).
    if (requiresTagging(s.conformance) && s.accessibility !== AccessibilityMode.PdfUa1) {
      throw new Error(
        `${s.conformance} requires tagged output. Set settings.accessibility = AccessibilityMode.PdfUa1.`
      );
    }

    if (s.hasBookmarks && s.version !== PdfVersion.Pdf17 && s.version !== PdfVersion.Pdf20) {
      throw new Error('Bookmarks require PdfVersion.Pdf17 or PdfVersion.Pdf20.');
    }
  }

  // ─── Disposal ────────────────────────────────────────────────────────────────

  public dispose(): void {
    if (this._disposed) return;
    this._pages.length = 0;
    this._disposed = true;
  }
}

/**
 * True for PDF/A "a" (accessible) conformance levels, which mandate
 * tagged structure on top of the underlying "b" requirements.
 */
function requiresTagging(conformance: PdfAConformance): boolean {
  return (
    conformance === PdfAConformance.PdfA1a ||
    conformance === PdfAConformance.PdfA2a ||
    conformance === PdfAConformance.PdfA3a
  );
}
