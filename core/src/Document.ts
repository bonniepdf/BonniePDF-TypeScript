import { DocumentSettings } from './Configuration/DocumentSettings';
import { DocumentMetadata } from './Configuration/DocumentMetadata';
import { IElement } from './Elements/IElement';
import { Page } from './Elements/Layout/Page';
import { PdfSize } from './Configuration/PdfSize';
import { PageOrientation } from './Core/PageOrientation';
import { PdfVersion } from './Configuration/PdfVersion';
import { EncryptionAlgorithm } from './Security/Models/EncryptionAlgorithm';
import { PdfWriter } from './Rendering/Writers/PdfWriter';
import { PdfDocumentSerializer } from './Rendering/PdfDocumentSerializer';
import { getPlatformIO } from './Platform/PlatformIO';
import { TextElementBase } from './Elements/Text/TextElementBase';
import { IDiagnostic, DiagnosticsCollector } from './Core/Diagnostics';

/**
 * High-level entry point for creating PDF documents.
 * Provides a simplified API for adding elements, setting metadata, and saving PDFs.
 */
export class Document {
  private readonly _pages: Page[] = [];
  private _disposed = false;
  private readonly _diagnostics: DiagnosticsCollector = new DiagnosticsCollector();

  public settings: DocumentSettings;
  public metadata: DocumentMetadata;

  /**
   * Recoverable issues collected during the most recent `generateBytes` /
   * `generateBytesAsync` call — typically font load failures or subset
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
   * this implicitly — callers opt in.
   */
  public printDiagnostics(): void {
    this._diagnostics.print();
  }

  /** Creates a new document with default settings and an empty first page. */
  constructor();
  /** Creates a new document with the given settings and an empty first page. */
  constructor(settings: DocumentSettings);
  /** Creates a new document with the given metadata and an empty first page. */
  constructor(metadata: DocumentMetadata);
  /** Creates a new document with the given settings and metadata. */
  constructor(settings: DocumentSettings, metadata: DocumentMetadata);
  constructor(settingsOrMetadata?: DocumentSettings | DocumentMetadata, metadata?: DocumentMetadata) {
    if (settingsOrMetadata instanceof DocumentMetadata) {
      this.settings = new DocumentSettings();
      this.metadata = settingsOrMetadata;
    } else {
      this.settings = (settingsOrMetadata as DocumentSettings) ?? new DocumentSettings();
      this.metadata = metadata ?? new DocumentMetadata();
    }
    // Auto-create the first page (mirrors C# behaviour)
    this.addPage();
  }

  /** Gets the pages in this document (read-only). */
  public get pages(): ReadonlyArray<Page> {
    return this._pages;
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
  /** Adds a new page with the given size and the document's default margin. */
  public addPage(pageSize: PdfSize): Page;
  /** Adds a new page with the given size and margin. */
  public addPage(pageSize: PdfSize, margin: number): Page;
  /** Adds a new page with the given size and orientation (document margin). */
  public addPage(pageSize: PdfSize, orientation: PageOrientation): Page;
  /** Adds a new page with the given size, orientation, and margin. */
  public addPage(pageSize: PdfSize, orientation: PageOrientation, margin: number): Page;
  public addPage(pageSize?: PdfSize, orientationOrMargin?: PageOrientation | number, margin?: number): Page {
    if (!pageSize) {
      // Default: use document settings
      const size = this.settings.getOrientedPageSize();
      const page = new Page(size, this.settings.margin);
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
      this._pages.push(page);
      return page;
    }

    // addPage(size) — document margin
    const page = new Page(pageSize, this.settings.margin);
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
   * Fully synchronous — uses the RC4 encryption path if encryption is set
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

  /** Alias for generateBytes() — matches the C# ToByteArray() name. */
  public toByteArray(): Uint8Array {
    return this.generateBytes();
  }

  /**
   * Async alias for generateBytesAsync().
   * Prefer `generateBytesAsync()` for clarity; this overload exists for
   * compatibility with code that already calls `toByteArrayAsync()`.
   */
  public async toByteArrayAsync(): Promise<Uint8Array> {
    return this.generateBytesAsync();
  }

  /**
   * Saves the document to the given file path synchronously.
   * Requires a Node.js environment; throws in browser contexts — use saveAsync instead.
   */
  public save(path: string): void {
    if (!path) throw new Error('path cannot be null or empty.');
    const bytes = this.generateBytes();
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs: typeof import('fs') = require('fs');
      fs.writeFileSync(path, bytes);
    } catch (err) {
      throw new Error(`Document.save() requires Node.js. Use saveAsync() in browser environments. (${err})`);
    }
  }

  /**
   * Saves the document to the given file path asynchronously via the configured platform I/O.
   */
  public async saveAsync(path: string): Promise<void> {
    if (!path) throw new Error('path cannot be null or empty.');
    const bytes = this.generateBytes();
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

  private static applyStyleToElement(el: any, style: any): void {
    if (el instanceof TextElementBase) {
      el.applyDefaultStyleIfNotSet(style);
    }
    // Walk VerticalStack / HorizontalStack children (exposed as .Children)
    if (Array.isArray(el.Children)) {
      for (const child of el.Children) {
        Document.applyStyleToElement(child, style);
      }
    }
    // Walk Container.child (singular)
    if (el.child && typeof el.child.render === 'function') {
      Document.applyStyleToElement(el.child, style);
    }
    // Walk nested OrderedList / UnorderedList children.
    if (typeof el.getNestedLists === 'function') {
      for (const child of el.getNestedLists()) {
        Document.applyStyleToElement(child, style);
      }
    }
    // Walk Table rows via getAllRows()
    if (typeof el.getAllRows === 'function') {
      for (const row of el.getAllRows()) {
        if (Array.isArray(row.cells)) {
          for (const cell of row.cells) {
            if (cell?.content && typeof cell.content.render === 'function') {
              Document.applyStyleToElement(cell.content, style);
            }
          }
        }
      }
    }
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  private validateSettings(): void {
    const s = this.settings;

    if (s.isEncrypted && s.encryption!.algorithm === EncryptionAlgorithm.AES_256 && s.version !== PdfVersion.Pdf17) {
      throw new Error('AES-256 encryption requires PdfVersion.Pdf17. Set settings.version = PdfVersion.Pdf17.');
    }

    if (s.pdfAEnabled && s.version !== PdfVersion.Pdf17) {
      throw new Error('PDF/A-1b mode requires PdfVersion.Pdf17. Set settings.version = PdfVersion.Pdf17.');
    }

    if (s.pdfAEnabled && s.isEncrypted) {
      throw new Error('PDF/A-1b mode cannot be combined with encryption.');
    }

    if (s.hasBookmarks && s.version !== PdfVersion.Pdf17) {
      throw new Error('Bookmarks require PdfVersion.Pdf17. Set settings.version = PdfVersion.Pdf17.');
    }
  }

  // ─── Disposal ────────────────────────────────────────────────────────────────

  public dispose(): void {
    if (this._disposed) return;
    this._pages.length = 0;
    this._disposed = true;
  }
}
