import { PdfResourceRegistry, ResolvedTextRun } from './PdfResourceRegistry';
import { PdfSize } from '../Configuration/PdfSize';
import { ICanvas } from '../Drawing/ICanvas';
import { PdfCanvas } from '../Drawing/PdfCanvas';
import { SvgCanvas, SvgCanvasOptions } from '../Drawing/SvgCanvas';
import { Color } from '../Core/Color';
import { ImageInfo } from './Images/ImageInfo';
import { EmbeddedFontInfo } from '../Typography/EmbeddedFontInfo';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import type { TaggingContext } from './Tagging/TaggingContext';

/** Container roles that use BMC (no MCID) in the content stream. */
const CONTAINER_ROLE_TAGS = new Set([
  'Table',
  'TR',
  'THead',
  'TBody',
  'TFoot',
  'Document',
  'Sect',
  'Art',
  'Div',
  'TOC',
  'L',
  'LI',
]);

export class DeferredXObjectInfo {
  public resourceName!: string;
  public fontIdentifier!: string;
  public fontResourceName!: string;
  public fontSize: number = 0;
  public color!: Color;
}

export class RenderContext {
  public readonly resources: PdfResourceRegistry;
  public readonly pages: string[] = [];
  public readonly pageHyperlinks: Map<number, any[]> = new Map();
  public readonly tocEntries: Map<string, number> = new Map();

  public canvas: ICanvas;
  public readonly isSvgMode: boolean;

  /**
   * Low-level SVG canvas options threaded into every {@link SvgCanvas} created
   * by this context (precision, image embedding, PDF baseline parity). Set by
   * the SVG render pipeline before rendering begins.
   */
  public svgOptions: SvgCanvasOptions = {};

  /**
   * One persisted {@link SvgCanvas} per page index in SVG mode. Unlike the PDF
   * path - which flushes operator strings into `pages[]` - the SVG canvas is a
   * stateful object, so it must survive page switches and overflow page
   * creation rather than being recreated and discarded.
   */
  private readonly svgPages: SvgCanvas[] = [];
  public currentPageIndex: number = 0;
  public currentX: number = 0;
  public currentY: number = 0;
  public pageSize: PdfSize;
  public margin: number;
  public isLastPage: boolean = false;
  public onPageCreated?: (pageNumber: number) => void;

  /**
   * PDF/UA tagging context. Non-undefined when the document opted into
   * AccessibilityMode.PdfUa1; undefined otherwise. Held on the context
   * so each per-page PdfCanvas gets it via updateCanvas.
   */
  public tagging?: TaggingContext;

  /**
   * @param size            Page size for the first page.
   * @param margin          Page margin in points.
   * @param isSvgMode       When true the context emits SVG operators instead of PDF operators.
   * @param existingResources  Pass a pre-populated (and pre-loaded) registry to reuse font/image
   *                          registrations from a previous dry-run pass.  When omitted a fresh
   *                          registry is created automatically.
   */
  constructor(
    size: PdfSize,
    margin: number,
    isSvgMode = false,
    existingResources?: PdfResourceRegistry,
    svgOptions?: SvgCanvasOptions
  ) {
    this.isSvgMode = isSvgMode;
    this.pageSize = size;
    this.margin = margin;
    this.pages.push('');
    this.currentX = margin;
    this.currentY = margin;
    this.resources = existingResources ?? new PdfResourceRegistry();
    if (svgOptions) this.svgOptions = svgOptions;

    this.updateCanvas();
  }

  /** Returns the persisted SVG canvas for a page index, if one exists. */
  public getSvgPage(index: number): SvgCanvas | undefined {
    return this.svgPages[index];
  }

  /** Factory for an SVG canvas wired to this context's font resolver + options. */
  private createSvgCanvas(): SvgCanvas {
    return new SvgCanvas(
      this.pageSize.width,
      this.pageSize.height,
      family => {
        // PDF rendering registers a font before drawing it. SVG drawing has no
        // resource operator of its own, so do the equivalent here before asking
        // for the parsed face. This is particularly important for PDF/A and
        // PDF/UA documents: their standard-14 names resolve lazily to embedded
        // Liberation fonts, whose metrics must also drive the SVG preview.
        this.resources.registerFont(family);
        return this.resolveEmbeddedFont(family);
      },
      this.svgOptions
    );
  }

  public get pdfAEnabled(): boolean {
    return this.resources.pdfAEnabled;
  }

  public set pdfAEnabled(value: boolean) {
    this.resources.pdfAEnabled = value;
  }

  public get currentStream(): string {
    return this.pages[this.currentPageIndex];
  }

  public get maxY(): number {
    return this.pageSize.height - this.margin;
  }

  /**
   * Saves the current PdfCanvas stream into `pages[currentPageIndex]` (appending).
   * Must be called before switching pages or creating a new page, otherwise the
   * canvas operators accumulated so far would be lost when the canvas is replaced.
   */
  private flushCanvasToPage(): void {
    if (this.isSvgMode) return;
    const pdfCanvas = this.canvas as PdfCanvas;
    if (!pdfCanvas || typeof pdfCanvas.getStream !== 'function') return;
    const ops = pdfCanvas.getStream();
    if (ops.length === 0) return;
    this.pages[this.currentPageIndex] = (this.pages[this.currentPageIndex] ?? '') + ops.join('');
  }

  private updateCanvas(): void {
    if (this.isSvgMode) {
      // Reuse the persisted canvas for this page so content survives page
      // switches (e.g. the second watermark/template pass) and overflow.
      let svg = this.svgPages[this.currentPageIndex];
      if (!svg) {
        svg = this.createSvgCanvas();
        this.svgPages[this.currentPageIndex] = svg;
      }
      this.canvas = svg;
    } else {
      const pdfCanvas = new PdfCanvas(
        this.pageSize.height,
        0,
        0,
        this.registerFont.bind(this),
        this.resolveImageResource.bind(this),
        this.resolveEmbeddedFont.bind(this),
        this.trackGlyphUsage.bind(this),
        this.registerAlphaGraphicsState.bind(this),
        this.resolveTextRuns.bind(this),
        this.reportUntaggedImage.bind(this)
      );
      if (this.tagging) pdfCanvas.setTaggingContext(this.tagging);
      this.canvas = pdfCanvas;
    }
  }

  public getCanvas(x: number, y: number): ICanvas {
    if (this.isSvgMode) {
      // Positioned child canvas. The child records its origin so
      // flushExternalCanvas can composite it into the page via a translate
      // group, mirroring the xOffset/yOffset baked into the PDF child canvas.
      const child = this.createSvgCanvas();
      child.offsetX = x;
      child.offsetY = y;
      return child;
    }
    const pdfCanvas = new PdfCanvas(
      this.pageSize.height,
      x,
      y,
      this.registerFont.bind(this),
      this.resolveImageResource.bind(this),
      this.resolveEmbeddedFont.bind(this),
      this.trackGlyphUsage.bind(this),
      this.registerAlphaGraphicsState.bind(this)
    );
    if (this.tagging) pdfCanvas.setTaggingContext(this.tagging);
    return pdfCanvas;
  }

  private resolveImageResource(info: ImageInfo): string {
    const id = this.registerImage(info);
    return this.resources.getImageResourceName(id);
  }

  public resolveEmbeddedFont(fontIdentifier: string): TtfFont | null {
    return this.resources.resolveEmbeddedFont(fontIdentifier);
  }

  public trackGlyphUsage(fontIdentifier: string, text: string): void {
    this.resources.trackGlyphUsage(fontIdentifier, text);
  }

  public resolveTextRuns(fontIdentifier: string, text: string): ResolvedTextRun[] {
    return this.resources.resolveTextRuns(fontIdentifier, text);
  }

  /**
   * Called when an image/XObject reaches the canvas in a tagged document with
   * no enclosing structure tag or artifact scope, so it was auto-wrapped as an
   * /Artifact to stay PDF/UA-valid. Surfacing this as a diagnostic keeps a
   * meaningful image from being demoted to an artifact *silently* — the author
   * should tag it (alt text -> Figure) or mark it decorative on purpose.
   */
  public reportUntaggedImage(): void {
    this.resources.diagnostics.addWarning(
      'tagging',
      'An image was drawn in a tagged document without a structure tag or artifact scope; ' +
        'it was emitted as an /Artifact. Provide alt text (tags it as /Figure) or mark it decorative to silence this.'
    );
  }

  public registerFont(fontIdentifier: string): string {
    return this.resources.registerFont(fontIdentifier);
  }

  public registerAlphaGraphicsState(alpha: number): string {
    return this.resources.registerAlphaGraphicsState(alpha);
  }

  public static isEmbeddedFont(fontIdentifier: string): boolean {
    return PdfResourceRegistry.isEmbeddedFont(fontIdentifier);
  }

  public getEmbeddedFont(filePath: string): EmbeddedFontInfo | null {
    return this.resources.getEmbeddedFont(filePath);
  }

  public newPage(): void {
    // this feature page-break-aware tagging: marked-content scopes (BDC/EMC)
    // cannot cross a page boundary per PDF spec, but structure
    // elements can. Snapshot any marked-content currently open, emit
    // EMC on the outgoing page so the marks are balanced, then on the
    // new page reopen the same roles with fresh MCIDs. All MCIDs
    // (both pages) attach to the same structure elements because the
    // StructureTreeBuilder stack is untouched.
    let reopenRoles: string[] | undefined;
    if (this.tagging && this.tagging.openMarkedContentCount > 0) {
      reopenRoles = this.tagging.snapshotOpenRolesBottomUp();
      for (let i = reopenRoles.length - 1; i >= 0; i--) {
        this.canvas.endMarkedContent();
      }
    }

    this.flushCanvasToPage(); // save current page before moving on
    this.pages.push('');
    this.currentPageIndex++;
    this.currentX = this.margin;
    this.currentY = this.margin;
    // MCIDs restart at 0 per PDF page (ISO 32000-1 §14.7.4). Pass the
    // new page index so any subsequent MCID can be paired with its
    // page for /Pg + /ParentTree emission later.
    this.tagging?.resetPage(this.currentPageIndex);
    this.updateCanvas();

    if (reopenRoles) {
      for (const role of reopenRoles) {
        // Container roles (Table, TR, …) use BMC on the new page; leaf
        // roles use BDC with a fresh MCID, as on the original page.
        if (CONTAINER_ROLE_TAGS.has(role)) {
          this.canvas.beginContainerContent(role);
        } else {
          this.canvas.beginMarkedContent(role);
        }
      }
    }

    if (this.onPageCreated) {
      this.onPageCreated(this.currentPageIndex);
    }
  }

  public getFixedCanvas(): ICanvas {
    return this.getCanvas(0, 0);
  }

  /**
   * Flushes an externally-created canvas (e.g. from getCanvas) into the
   * current page stream. Necessary for chart elements that draw to a
   * positioned canvas rather than ctx.canvas.
   */
  public flushExternalCanvas(canvas: ICanvas): void {
    if (this.isSvgMode) {
      const child = canvas as SvgCanvas;
      if (typeof child.getInnerSvg !== 'function') return;
      const inner = child.getInnerSvg();
      if (!inner) return;
      const pageCanvas = this.canvas as SvgCanvas;
      const tx = child.offsetX;
      const ty = child.offsetY;
      const wrapped = tx !== 0 || ty !== 0 ? `<g transform="translate(${tx} ${ty})">${inner}</g>` : `<g>${inner}</g>`;
      pageCanvas.appendRawMarkup(wrapped);
      return;
    }
    const pdfCanvas = canvas as PdfCanvas;
    if (!pdfCanvas || typeof pdfCanvas.getStream !== 'function') return;
    const ops = pdfCanvas.getStream();
    if (ops.length === 0) return;
    this.pages[this.currentPageIndex] = (this.pages[this.currentPageIndex] ?? '') + ops.join('');
  }

  public setCanvas(canvas: ICanvas): void {
    this.canvas = canvas;
  }

  public switchToPage(index: number): void {
    if (index < 0 || index >= this.pages.length) {
      throw new Error(`Page index ${index} out of range`);
    }
    this.flushCanvasToPage(); // save current canvas before switching
    this.currentPageIndex = index;
    // Keep the tagging context's page tracking in lock-step with the
    // physical page. newPage() does this for automatic overflow breaks;
    // switchToPage handles the boundaries between explicit input Page
    // objects. Without it, MCIDs allocated on the new page keep the
    // previous page's index and counter, so the structure tree's /Pg and
    // /ParentTree point at the wrong page - veraPDF then reports the
    // content as untagged real content (PDF/UA 7.1). MCIDs restart at 0
    // per page (ISO 32000-1 §14.7.4).
    this.tagging?.resetPage(index);
    this.updateCanvas();
  }

  public getNewImageId(): number {
    return this.resources.getNewImageId();
  }

  public registerImage(info: ImageInfo): number {
    return this.resources.registerImage(info);
  }

  public getImageResourceName(imageId: number): string {
    return this.resources.getImageResourceName(imageId);
  }

  public registerHyperlink(hyperlink: any): void {
    if (!this.pageHyperlinks.has(this.currentPageIndex)) {
      this.pageHyperlinks.set(this.currentPageIndex, []);
    }
    this.pageHyperlinks.get(this.currentPageIndex)!.push(hyperlink);
  }

  public registerDeferredXObject(fontFamily: string, fontSize: number, color: Color): string {
    return this.resources.registerDeferredXObject(fontFamily, fontSize, color);
  }

  /**
   * Loads every embedded TTF font that has been registered.
   * Must be awaited before rendering begins.
   */
  public async preloadAllFontsAsync(): Promise<void> {
    await this.resources.preloadAllFontsAsync();
  }
}
