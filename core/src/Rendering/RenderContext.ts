import { Thickness } from '../Core/Thickness';
import { type PaintTransform, mapPaintBox } from '../Drawing/PaintTransform';
import { FALLBACK_PREFIX, PdfResourceRegistry, ResolvedTextRun, type TextRunFont } from './PdfResourceRegistry';
import type { ShadingRequest } from './Pdf/GradientShading';
import { PdfSize } from '../Configuration/PdfSize';
import { ICanvas } from '../Drawing/ICanvas';
import { PdfCanvas } from '../Drawing/PdfCanvas';
import { SvgCanvas, SvgCanvasOptions, SvgIdAllocator, type SvgTextRun } from '../Drawing/SvgCanvas';
import { FontManager } from '../Typography/FontManager';
import { isStandardTextFace, standardFaceCoversAll } from '../Typography/StandardFontCoverage';
import { Color } from '../Core/Color';
import { ImageInfo } from './Images/ImageInfo';
import { EmbeddedFontInfo } from '../Typography/EmbeddedFontInfo';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import type { TaggingContext } from './Tagging/TaggingContext';
import type { LayoutRecorder } from './LayoutRecorder';
import type { RegisteredLink } from './RegisteredLink';
import type { RenderContext as RenderContextContract } from '../Elements/IElement';
import { NO_CHROME, type ChromeReservation } from './ChromeReservation';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { compressContent } from './Writers/ContentCompression';
import { encodeIso88591 } from './Writers/Iso88591';

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

/** Describes an external object whose content is written after page rendering. */
export class DeferredXObjectInfo {
  public resourceName!: string;
  public fontIdentifier!: string;
  public fontResourceName!: string;
  public fontSize: number = 0;
  public color!: Color;
}

// `implements` the structural contract elements program against
// (Elements/IElement.ts) so any drift between the two is a compile error.
/** Carries page, canvas, resource, navigation, tagging, and cursor state through layout. */
export class RenderContext implements RenderContextContract {
  /** @internal */
  public emojiRendering: 'outline' | 'colour' = 'outline';
  /** @internal */
  public atomicLayoutBounds?: { top: number; bottom: number };
  /** @internal */
  public elementTransform?: PaintTransform;
  /** @internal */
  public readonly resources: PdfResourceRegistry;
  /** The content stream of each page rendered so far. */
  public readonly pages: string[] = [];
  /**
   * @internal How finished body pages are held. `compressed`: compressed when layout leaves
   * them, for documents with no page chrome. `discard`: dropped (a layout dry run). Set by
   * the render pipeline from {@link sealFinishedPages} and {@link discardFinishedPages}.
   */
  finishedPageStorage: 'keep' | 'compressed' | 'discard' = 'keep';
  /** @internal Lets the render pipeline compress finished pages. Set by the PDF serializer. */
  sealFinishedPages = false;
  /** @internal A layout dry run whose pages are never written. */
  discardFinishedPages = false;
  readonly #sealedPages = new Map<number, Uint8Array>();

  /**
   * @internal Hands a page whose body layout is complete to the finished-page store.
   * Nothing writes to a page's body after layout leaves it.
   */
  sealPage(index: number): void {
    if (this.isSvgMode || this.finishedPageStorage === 'keep') return;
    if (this.finishedPageStorage === 'compressed')
      this.#sealedPages.set(index, compressContent(encodeIso88591(this.pages[index] ?? '')));
    this.pages[index] = '';
  }

  /** @internal Removes and returns a sealed page's compressed content. */
  takeSealedPage(index: number): Uint8Array | undefined {
    const sealed = this.#sealedPages.get(index);
    this.#sealedPages.delete(index);
    return sealed;
  }
  /** @internal */
  public readonly pageHyperlinks: Map<number, RegisteredLink[]> = new Map();
  /** Page numbers of the headings registered for the table of contents, keyed by heading identifier. */
  public readonly tocEntries: Map<string, number> = new Map();

  /** The canvas that elements currently draw onto. */
  public canvas!: ICanvas;
  /** `true` when rendering to SVG rather than PDF. */
  public readonly isSvgMode: boolean;

  /**
   * Low-level SVG canvas options threaded into every {@link SvgCanvas} created
   * by this context (precision, image embedding, PDF baseline parity). Set by
   * the SVG render pipeline before rendering begins.
   * @internal
   */
  public svgOptions: SvgCanvasOptions = {};

  /**
   * One persisted {@link SvgCanvas} per page index in SVG mode. Unlike the PDF
   * path - which flushes operator strings into `pages[]` - the SVG canvas is a
   * stateful object, so it must survive page switches and overflow page
   * creation rather than being recreated and discarded.
   */
  private readonly svgPages: SvgCanvas[] = [];

  /**
   * Shared across every {@link SvgCanvas} this context creates (main page
   * canvases and positioned child canvases alike), so `clip`/`grad` ids stay
   * unique across a page composited from several canvases - see
   * {@link SvgIdAllocator}.
   */
  private readonly svgIdAllocator = new SvgIdAllocator();
  public currentPageIndex: number = 0;
  /** Horizontal position of the layout cursor, in points. */
  public currentX: number = 0;
  /** Vertical position of the layout cursor, in points from the top of the page. */
  public currentY: number = 0;
  /** The size of the page being rendered. */
  public pageSize: PdfSize;
  /** The page margin, in points. */
  /** @internal */
  public margins: Thickness;

  /** Left page margin in points. Setting it assigns the same margin on all sides. */
  public get margin(): number {
    return this.margins.left;
  }
  public set margin(value: number) {
    this.margins = new Thickness(value);
  }
  /** `true` while the last page is being rendered. */
  public isLastPage: boolean = false;
  /** Called with the page index each time a new page is started. */
  public onPageCreated?: (pageNumber: number) => void;

  /**
   * Per-page header/footer measurement, installed by the render pipeline via
   * {@link setChromeReservation}. Undefined for a document with no page chrome,
   * in which case the reservation is a constant zero and the content band is
   * the margin box.
   */
  private chromeProvider?: (pageNumber: number) => ChromeReservation;

  /** Memoised per page index, so a template function is measured once per page. */
  private readonly chromeCache = new Map<number, ChromeReservation>();

  private chrome: ChromeReservation = NO_CHROME;

  /**
   * While true, {@link contentTop} and {@link maxY} ignore the chrome
   * reservation. Set only while the engine paints the chrome itself: a header
   * is not laid out inside the band it reserves for the body.
   */
  public chromeReservationSuspended: boolean = false;

  /**
   * While a table draws a cell whose content is a `Container` (seen through pass-through wrappers),
   * that container. It fills {@link cellStretchHeight}, so a border or background applied to a cell's
   * content spans the whole row rather than only the cell's own text. `undefined` everywhere else;
   * no other container is affected.
   */
  public cellStretchTarget: import('../Elements/Layout/Container').Container | undefined = undefined;

  /** The height {@link cellStretchTarget} fills: the row height less the cell's padding. */
  public cellStretchHeight: number = 0;
  /** @internal Greater than zero while oversized content is drawn inside its clip, so nested content is not reported again. */
  public oversizedClipDepth: number = 0;

  /**
   * The horizontal text alignment a Container establishes for descendant text (TextBlock/Heading/RichText)
   * that sets none of its own, cascading through nesting the way CSS text-align is inherited. `undefined` means no ambient is in effect: unset text stays at its own default
   * (Left). Scoped to the container's subtree by the container itself, which restores the value it found
   * on the way in.
   */
  public ambientHorizontalTextAlignment: TextAlignment | undefined = undefined;

  /**
   * PDF/UA tagging context. Non-undefined when the document opted into
   * AccessibilityMode.PdfUa1; undefined otherwise. Held on the context
   * so each per-page PdfCanvas gets it via updateCanvas.
   * @internal
   */
  public tagging?: TaggingContext;

  /**
   * Optional layout-snapshot recorder. Attached only when a caller opted into
   * `captureLayout` (currently the SVG exporter). When undefined, all capture is
   * a guarded no-op and output is byte-identical to the un-instrumented path.
   * @internal
   */
  public layoutRecorder?: LayoutRecorder;

  /**
   * @param size            Page size for the first page.
   * @param margin          Page margin in points.
   * @param isSvgMode       When true the context emits SVG operators instead of PDF operators.
   * @param existingResources  Pass a pre-populated (and pre-loaded) registry to reuse font/image
   *                          registrations from a previous dry-run pass.  When omitted a fresh
   *                          registry is created automatically.
   * @internal
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
    this.margins = new Thickness(margin);
    this.pages.push('');
    this.currentX = margin;
    this.currentY = this.contentTop;
    this.resources = existingResources ?? new PdfResourceRegistry();
    if (svgOptions) this.svgOptions = svgOptions;

    this.updateCanvas();
  }

  /**
   * Returns the persisted SVG canvas for a page index, if one exists.
   * @internal
   */
  public getSvgPage(index: number): SvgCanvas | undefined {
    return this.svgPages[index];
  }

  /** Factory for an SVG canvas wired to this context's font resolver + options. */
  private createSvgCanvas(): SvgCanvas {
    const canvas = new SvgCanvas(
      this.pageSize.width,
      this.pageSize.height,
      {
        resolveFont: family => {
          // PDF rendering registers a font before drawing it. SVG drawing has no
          // resource operator of its own, so do the equivalent here before asking
          // for the parsed face. This is particularly important for PDF/A and
          // PDF/UA documents: their standard-14 names resolve lazily to embedded
          // Liberation fonts, whose metrics must also drive the SVG preview.
          this.resources.registerFont(family);
          return this.resolveEmbeddedFont(family);
        },
        // Both render paths share one run resolver, so the SVG preview cannot
        // drift from the PDF in which font draws which code point — and the
        // preview inherits the same `font` diagnostics for dropped glyphs.
        resolveRuns: (family, text) => this.resolveSvgRuns(family, text),
      },
      this.svgOptions,
      this.svgIdAllocator
    );
    canvas.emojiRendering = () => this.emojiRendering;
    return canvas;
  }

  /**
   * The runs an SVG draw paints as positioned glyphs. A draw a non-embedded standard font shows whole has none:
   * the viewer draws it. A standard text face's draw that needs fallback is painted as glyphs throughout, its own
   * pieces in the face's metric-compatible Liberation substitute, so the viewer never draws a character the PDF
   * dropped. Without the substitute the viewer draws it all.
   */
  private resolveSvgRuns(family: string, text: string): SvgTextRun[] {
    const runs = this.resolveTextRuns(family, text);
    if (runs.every(run => run.embeddedFont !== null))
      return runs.map(run => ({ fontFamily: run.fontIdentifier, font: run.embeddedFont!, text: run.text }));
    if (!isStandardTextFace(family) || standardFaceCoversAll(text)) return [];
    const substitute = FontManager.getStandardSubstitute(family);
    if (!substitute) return [];
    return runs.map(run =>
      run.embeddedFont
        ? { fontFamily: run.fontIdentifier, font: run.embeddedFont, text: run.text }
        : { fontFamily: `${FALLBACK_PREFIX}${substitute.key}`, font: substitute.font, text: run.text }
    );
  }

  /** `true` when PDF/A output is being produced. */
  public get pdfAEnabled(): boolean {
    return this.resources.pdfAEnabled;
  }

  public set pdfAEnabled(value: boolean) {
    this.resources.pdfAEnabled = value;
  }

  /** The content stream of the current page. */
  public get currentStream(): string {
    return this.pages[this.currentPageIndex];
  }

  /**
   * Installs (or clears) the per-page header/footer measurement. Clearing the
   * memo on every call keeps a context that is re-driven for a second pass -
   * the streaming pipeline's compositing loop, a TOC dry run - from reusing
   * heights measured against a different page size or margin.
   *
   * See the shared specification, "Layout & Pagination" §5.1.
   * @internal
   */
  public setChromeReservation(provider: ((pageNumber: number) => ChromeReservation) | undefined): void {
    this.chromeProvider = provider;
    this.chromeCache.clear();
    // Deliberately not measured here: the pipeline assigns this run's page size
    // and margin per page and then switches to the page, which is what triggers
    // the first measurement against the right content width.
    this.chrome = NO_CHROME;
  }

  /**
   * Re-measures the current page's chrome. Called on every page switch and on
   * every page break; the pipelines also call it directly after assigning a
   * new page size or margin, because those change the width the chrome is
   * measured against.
   */
  public refreshChromeReservation(): void {
    if (!this.chromeProvider) {
      this.chrome = NO_CHROME;
      return;
    }
    let reservation = this.chromeCache.get(this.currentPageIndex);
    if (!reservation) {
      reservation = this.chromeProvider(this.currentPageIndex + 1);
      this.chromeCache.set(this.currentPageIndex, reservation);
    }
    this.chrome = reservation;
    this.assertUsableContentBand();
  }

  /** Measured header height for the current page, in points (0 when there is none). */
  public get reservedHeaderHeight(): number {
    return this.chrome.header;
  }

  /** Measured footer height for the current page, in points (0 when there is none). */
  public get reservedFooterHeight(): number {
    return this.chrome.footer;
  }

  /**
   * Top of the body content band: `max(margin, headerHeight)`. Chrome that fits
   * inside the top margin reserves nothing beyond the margin the page already
   * had, so this reduces to `margin` for the overwhelming majority of
   * documents.
   */
  public get contentTop(): number {
    if (this.atomicLayoutBounds) return this.atomicLayoutBounds.top;
    if (this.chromeReservationSuspended) return this.margins.top;
    return Math.max(this.margins.top, this.chrome.header);
  }

  /** Bottom of the body content band: `pageHeight - max(margin, footerHeight)`. */
  public get contentBottom(): number {
    if (this.atomicLayoutBounds) return this.atomicLayoutBounds.bottom;
    if (this.chromeReservationSuspended) return this.pageSize.height - this.margins.bottom;
    return this.pageSize.height - Math.max(this.margins.bottom, this.chrome.footer);
  }

  /** The bottom of the area available for body content on this page, in points from the top. */
  public get maxY(): number {
    return this.contentBottom;
  }

  /**
   * Usable body height on the current page: the full content band, not just
   * what is left below the cursor. Elements use it to ask "would this fit on a
   * fresh page at all?" before deciding to break rather than split.
   */
  public get contentHeight(): number {
    return this.contentBottom - this.contentTop;
  }

  /** Moves the cursor to the top-left of the current page's body content band. */
  public resetCursorToContentTop(): void {
    this.currentX = this.margin;
    this.currentY = this.contentTop;
  }

  /**
   * Honest failure rather than silent clipping: a header and footer that
   * between them consume the whole page leave nowhere for body content, and
   * every subsequent break decision would be made against a negative band.
   */
  private assertUsableContentBand(): void {
    const top = Math.max(this.margins.top, this.chrome.header);
    const bottom = this.pageSize.height - Math.max(this.margins.bottom, this.chrome.footer);
    if (bottom > top) return;
    throw new Error(
      `Page ${this.currentPageIndex + 1}: the header (${round(this.chrome.header)}pt) and footer ` +
        `(${round(this.chrome.footer)}pt) leave no room for content on a ${round(this.pageSize.height)}pt-tall ` +
        `page with a ${round(this.margin)}pt margin. Reduce the header/footer height, reduce the margin, ` +
        `or use a larger page.`
    );
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
        this.reportUntaggedImage.bind(this),
        this.registerShading.bind(this),
        this.resources.noteImagePlacement.bind(this.resources)
      );
      pdfCanvas.emojiRendering = () => this.emojiRendering;
      pdfCanvas.wholeTextFontResolver = this.wholeTextFont;
      if (this.tagging) pdfCanvas.setTaggingContext(this.tagging);
      this.canvas = pdfCanvas;
    }
  }

  /**
   * Creates a canvas whose origin is `(x, y)` on the current page. Content drawn on it is placed with {@link flushExternalCanvas}.
   */
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
      this.registerAlphaGraphicsState.bind(this),
      // A positioned canvas resolves glyph fallback like the page's, so chart labels and
      // canvas drawings get the same fallback fonts as body text.
      this.resolveTextRuns.bind(this),
      this.reportUntaggedImage.bind(this),
      this.registerShading.bind(this),
      this.resources.noteImagePlacement.bind(this.resources)
    );
    pdfCanvas.emojiRendering = () => this.emojiRendering;
    pdfCanvas.wholeTextFontResolver = this.wholeTextFont;
    if (this.tagging) {
      pdfCanvas.setTaggingContext(this.tagging);
      // The new canvas appends to the same stream as the one already rendering, so it has to
      // see the marked-content scopes that canvas has open - otherwise it treats itself as top
      // level and wraps its marks in a redundant /Artifact nested inside them.
      if (this.canvas instanceof PdfCanvas)
        pdfCanvas.inheritOpenScopes(this.canvas.openTaggedDepth, this.canvas.openArtifactDepth);
    }
    return pdfCanvas;
  }

  private resolveImageResource(info: ImageInfo): string {
    const id = this.registerImage(info);
    return this.resources.getImageResourceName(id);
  }

  /** @internal */
  public resolveEmbeddedFont(fontIdentifier: string): TtfFont | null {
    return this.resources.resolveEmbeddedFont(fontIdentifier);
  }

  /** @internal */
  public trackGlyphUsage(fontIdentifier: string, text: string): void {
    this.resources.trackGlyphUsage(fontIdentifier, text);
  }

  // One bound function for every canvas of this context.
  private readonly wholeTextFont = (fontIdentifier: string, text: string): TextRunFont | null =>
    this.resources.wholeTextFont(fontIdentifier, text);

  /** @internal */
  public resolveTextRuns(fontIdentifier: string, text: string): ResolvedTextRun[] {
    return this.resources.resolveTextRuns(fontIdentifier, text);
  }

  /**
   * Called when an image/XObject reaches the canvas in a tagged document with
   * no enclosing structure tag or artifact scope, so it was auto-wrapped as an
   * /Artifact to stay PDF/UA-valid. Surfacing this as a diagnostic keeps a
   * meaningful image from being demoted to an artifact *silently* — the author
   * should tag it (alt text -> Figure) or mark it decorative on purpose.
   * @internal
   */
  public reportUntaggedImage(): void {
    this.resources.diagnostics.addWarning(
      'tagging',
      'An image was drawn in a tagged document without a structure tag or artifact scope; ' +
        'it was emitted as an /Artifact. Provide alt text (tags it as /Figure) or mark it decorative to silence this.'
    );
  }

  /** Registers a font for use on the page and returns its resource name. */
  public registerFont(fontIdentifier: string): string {
    return this.resources.registerFont(fontIdentifier);
  }

  /** Registers a graphics state with the given opacity (0 to 1) and returns its resource name. */
  public registerAlphaGraphicsState(alpha: number): string {
    return this.resources.registerAlphaGraphicsState(alpha);
  }

  /** @internal */
  public registerShading(request: ShadingRequest): { shadingName: string; softMaskGs: string | null } | null {
    return this.resources.registerShading(request);
  }

  /** Returns `true` when the font identifier refers to an embedded font file rather than a standard font. */
  public static isEmbeddedFont(fontIdentifier: string): boolean {
    return PdfResourceRegistry.isEmbeddedFont(fontIdentifier);
  }

  /** @internal */
  public getEmbeddedFont(filePath: string): EmbeddedFontInfo | null {
    return this.resources.getEmbeddedFont(filePath);
  }

  /** Finishes the current page and starts the next, carrying tagging and artifact regions across the break. */
  public newPage(): void {
    if (this.atomicLayoutBounds) throw new Error('Transformed content cannot create a page.');
    // Header and footer chrome is painted at a fixed position in the margin band, which lies outside
    // the body's content area. An element in it that checks "does this fit?" (a Container, say)
    // would see the band as overflow and break the page in the middle of painting the chrome,
    // losing the content. Chrome never paginates.
    if (this.chromeReservationSuspended) return;

    // Layout capture: the Y where content stopped on the outgoing page, taken
    // before the reset below so open nodes can close their rect at the boundary.
    const outgoingBottomY = this.currentY;

    // Page-break-aware tagging: marked-content scopes (BDC/EMC)
    // cannot cross a page boundary per PDF spec, but structure
    // elements can. Snapshot any marked-content currently open, emit
    // EMC on the outgoing page so the marks are balanced, then on the
    // new page reopen the same roles with fresh MCIDs. All MCIDs
    // (both pages) attach to the same structure elements because the
    // StructureTreeBuilder stack is untouched.
    //
    // /Artifact regions are handled the same way. They are innermost (nothing
    // inside an artifact is tagged), so they close first and reopen last; the
    // new page's canvas would otherwise not know it is inside one, and would
    // tag decorative content as real content.
    const reopenArtifacts = this.canvas instanceof PdfCanvas ? this.canvas.openArtifactDepth : 0;
    for (let i = 0; i < reopenArtifacts; i++) this.canvas.endArtifact();

    let reopenRoles: string[] | undefined;
    if (this.tagging && this.tagging.openMarkedContentCount > 0) {
      reopenRoles = this.tagging.snapshotOpenRolesBottomUp();
      for (let i = reopenRoles.length - 1; i >= 0; i--) {
        this.canvas.endMarkedContent();
      }
    }

    // Graphics state gets the same treatment, and for the same reason: a `q`
    // without its `Q` (or a `<g>` without its `</g>`) may not cross a page
    // boundary. An element that breaks the page from inside its own render leaves
    // the caller's saveState open here — the caller's finally will restoreState
    // against the *new* page, which would otherwise silently drop the close and
    // leave the outgoing page unbalanced. Close them here, reopen below, so both
    // pages balance and the caller's restoreState still has a scope to close.
    const reopenStateDepth = this.canvas.graphicsStateDepth ?? 0;
    for (let i = 0; i < reopenStateDepth; i++) this.canvas.restoreState();

    this.flushCanvasToPage(); // save current page before moving on
    this.sealPage(this.currentPageIndex);
    this.pages.push('');
    this.currentPageIndex++;
    // The new page measures its own chrome: header/footer templates are
    // functions of the page number, so a taller header on page 2 moves page 2's
    // content band down. Must precede the cursor reset, which reads contentTop.
    this.refreshChromeReservation();
    this.resetCursorToContentTop();
    // MCIDs restart at 0 per PDF page (ISO 32000-1 §14.7.4). Pass the
    // new page index so any subsequent MCID can be paired with its
    // page for /Pg + /ParentTree emission later.
    this.tagging?.resetPage(this.currentPageIndex);
    this.updateCanvas();

    // Layout capture: split every open node's rect across the page boundary.
    this.layoutRecorder?.pageBreak(outgoingBottomY, this.currentPageIndex, this.currentY);

    for (let i = 0; i < reopenStateDepth; i++) this.canvas.saveState();

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
    for (let i = 0; i < reopenArtifacts; i++) this.canvas.beginArtifact();

    if (this.onPageCreated) {
      this.onPageCreated(this.currentPageIndex);
    }
  }

  /** Creates a canvas whose origin is the top-left corner of the page. */
  public getFixedCanvas(): ICanvas {
    return this.getCanvas(0, 0);
  }

  /**
   * Flushes an externally-created canvas (e.g. from getCanvas) into the
   * *currently active* canvas (`this.canvas`) - not directly into
   * `pages[currentPageIndex]`. Necessary for chart elements that draw to a
   * positioned canvas rather than ctx.canvas.
   *
   * This distinction matters whenever `this.canvas` is not the page's own
   * live canvas - most notably the fixed canvas a page background/foreground
   * slot renders into (see `PdfRenderPipeline.renderPageSlotElement`), which
   * accumulates its own operators separately and is prepended/appended to the
   * page stream only after the slot element finishes rendering. A chart or
   * `CanvasElement` used as that slot's content calls `getCanvas()` to get a
   * positioned child canvas, exactly like any other caller of this method; if
   * this method wrote straight into `pages[]`, that write would land
   * immediately - ahead of the slot's own prepend/append step, and outside
   * the fixed canvas entirely, so the slot's rendered background would land
   * in the wrong place in the painter's-model order (observed: a
   * `CanvasElement` used as `pageBackground` painted over already-rendered
   * page content instead of behind it, in PDF output only - SVG export
   * writes into `this.canvas` already, via `appendRawMarkup` below, so it
   * never exhibited the bug). Writing into `this.canvas`'s own stream keeps
   * this method's PDF behaviour symmetric with its SVG branch: both append
   * into whatever canvas is currently active, letting the caller (ordinary
   * page rendering, or a slot's fixed-canvas redirect) decide where that
   * ends up.
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
      const wrapped =
        tx !== 0 || ty !== 0
          ? `<g transform="translate(${pageCanvas.formatNumber(tx)} ${pageCanvas.formatNumber(ty)})">${inner}</g>`
          : `<g>${inner}</g>`;
      pageCanvas.appendRawMarkup(wrapped);
      return;
    }
    const pdfCanvas = canvas as PdfCanvas;
    if (!pdfCanvas || typeof pdfCanvas.getStream !== 'function') return;
    const ops = pdfCanvas.getStream();
    if (ops.length === 0) return;
    const activeCanvas = this.canvas as PdfCanvas;
    if (activeCanvas && typeof activeCanvas.getStream === 'function' && activeCanvas !== pdfCanvas) {
      activeCanvas.getStream().push(...ops);
    } else {
      this.pages[this.currentPageIndex] = (this.pages[this.currentPageIndex] ?? '') + ops.join('');
    }
  }

  /** Replaces the canvas elements draw onto. */
  public setCanvas(canvas: ICanvas): void {
    this.canvas = canvas;
  }

  /** Makes the page at `index` current, saving the page being left. Throws when the index is out of range. */
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
    this.refreshChromeReservation();
    this.updateCanvas();
  }

  /** Allocates a new image identifier. */
  public getNewImageId(): number {
    return this.resources.getNewImageId();
  }

  /** Registers an image for embedding and returns its identifier. Identical images share one identifier. */
  public registerImage(info: ImageInfo): number {
    return this.resources.registerImage(info);
  }

  /** Returns the resource name used to draw the image with the given identifier. */
  public getImageResourceName(imageId: number): string {
    return this.resources.getImageResourceName(imageId);
  }

  /** @internal */
  public registerHyperlink(hyperlink: RegisteredLink): void {
    if (this.elementTransform) {
      const y = this.pageSize.height - hyperlink.renderY - hyperlink.renderHeight;
      const [x0, y0, x1, y1] = mapPaintBox(this.elementTransform, [
        hyperlink.renderX,
        y,
        hyperlink.renderX + hyperlink.renderWidth,
        y + hyperlink.renderHeight,
      ]);
      if (hyperlink.setRenderBounds) hyperlink.setRenderBounds(x0, this.pageSize.height - y1, x1 - x0, y1 - y0);
      else
        Object.assign(hyperlink, {
          renderX: x0,
          renderY: this.pageSize.height - y1,
          renderWidth: x1 - x0,
          renderHeight: y1 - y0,
        });
    }
    if (!this.pageHyperlinks.has(this.currentPageIndex)) {
      this.pageHyperlinks.set(this.currentPageIndex, []);
    }
    this.pageHyperlinks.get(this.currentPageIndex)!.push(hyperlink);
  }

  /** Registers a reusable form for text drawn in the given font, size and colour, and returns its resource name. */
  public registerDeferredXObject(fontFamily: string, fontSize: number, color: Color): string {
    return this.resources.registerDeferredXObject(fontFamily, fontSize, color);
  }

  /**
   * Loads every embedded TTF font that has been registered.
   * Must be awaited before rendering begins.
   * @internal
   */
  public async preloadAllFontsAsync(): Promise<void> {
    await this.resources.preloadAllFontsAsync();
  }
}

/** Formats a point measurement for a diagnostic message (2 dp, no trailing zeros). */
function round(value: number): number {
  return Number(value.toFixed(2));
}
