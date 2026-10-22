import { ContentDirection } from '../Configuration/ContentDirection';
import { applyContentDirection } from '../Elements/ContentDirectionResolver';
import { IElement, IStatefulElement } from '../Elements/IElement';
import { Color } from '../Core/Color';
import { PdfSize } from '../Configuration/PdfSize';
import type { PdfCanvas } from '../Drawing/PdfCanvas';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { DocumentSettings } from '../Configuration/DocumentSettings';
import { Page } from '../Elements/Layout/Page';
import { PdfRenderResult, PageRenderOutput } from './PageDimensions';
import { RenderContext } from './RenderContext';
import { captureTypeOf, captureNameOf } from './LayoutRecorder';
import { PdfSyntax } from './Pdf/PdfSyntax';
import { PdfOperators } from './Pdf/PdfOperators';
import { FontMetrics } from '../Typography/FontMetrics';
import { StandardFonts } from '../Typography/StandardFonts';
import { RenderStatus } from '../Elements/RenderStatus';
import { beginChildTag, endChildTag } from './Tagging/ChildTagging';
import { chromeReservationFor } from './ChromeReservation';

/** True when the element supports stateful rendering across page boundaries. */
function isStatefulElement(element: IElement): element is IStatefulElement {
  return typeof (element as Partial<IStatefulElement>).renderStateful === 'function';
}

/** Measures, paginates, and renders document elements into PDF page content streams. */
export class PdfRenderPipeline {
  public static renderPages(pages: readonly Page[], settings: DocumentSettings): PdfRenderResult {
    if (!pages || pages.length === 0) {
      throw new Error('Document must have at least one page');
    }

    const orientedPageSize = settings.getOrientedPageSize();
    const ctx = new RenderContext(orientedPageSize, settings.margin);
    ctx.emojiRendering = settings.emojiRendering;
    // Header/footer consume body content height (spec: Layout & Pagination
    // §5.1). Installed before any layout so the very first page's cursor and
    // break threshold already account for the chrome.
    ctx.emojiRendering = settings.emojiRendering;
    ctx.setChromeReservation(chromeReservationFor(settings, ctx));

    const result = new PdfRenderResult(ctx, orientedPageSize);

    let currentOutputIndex = 0;

    for (const page of pages) {
      while (ctx.pages.length <= currentOutputIndex) {
        ctx.pages.push('');
      }

      const pageWidth = page.width;
      // Pages created from document settings inherit the margin lazily, so a
      // DocumentSettings assigned after construction still reaches page 1.
      const pageMargin = page.hasExplicitMargin ? page.margin : settings.margin;

      ctx.pageSize = page.size;
      ctx.margin = pageMargin;

      ctx.switchToPage(currentOutputIndex); // also resets the tagging context's per-page MCID state
      ctx.resetCursorToContentTop();

      const contentWidth = pageWidth - pageMargin * 2;

      result.pageDimensions.set(currentOutputIndex, {
        size: page.size,
        margin: pageMargin,
      });

      this.renderElementsWithOverflow(page.getElements(), ctx, contentWidth);

      for (let i = currentOutputIndex + 1; i <= ctx.currentPageIndex; i++) {
        result.pageDimensions.set(i, {
          size: page.size,
          margin: pageMargin,
        });
      }

      currentOutputIndex = ctx.currentPageIndex + 1;
    }

    for (const stream of ctx.pages) {
      result.pageContentStreams.push(stream);
    }

    return result;
  }

  /**
   * Lays out a page's elements through the same overflow/pagination loop used
   * for PDF output, driving everything through `ICanvas`. Exposed so the SVG
   * render pipeline shares the exact pagination decisions (page breaks,
   * stateful continuation) rather than re-implementing them and drifting.
   */
  public static layoutElements(elements: readonly IElement[], ctx: RenderContext, contentWidth: number): void {
    this.renderElementsWithOverflow(elements, ctx, contentWidth);
  }

  private static renderElementsWithOverflow(
    elements: readonly IElement[],
    ctx: RenderContext,
    contentWidth: number
  ): void {
    for (const element of elements) {
      this.renderElementWithOverflow(element, ctx, contentWidth);
    }
  }

  /**
   * Consecutive WrapRequired results tolerated before an element is abandoned.
   * WrapRequired means the element made no progress even after a page break, so
   * a third in a row can only loop forever. Overflow means progress was made and
   * resets the count: an element may span any number of pages.
   */
  private static readonly maxWrapAttempts = 2;

  private static renderElementWithOverflow(element: IElement, ctx: RenderContext, contentWidth: number): void {
    // When tagging is on and the element declares a structure role, wrap
    // its render in a marked-content sequence (BDC/EMC) or /Artifact region.
    // Shared with the layout containers via beginChildTag/endChildTag so every
    // child-render site tags consistently. No-op when tagging is off or the
    // element isn't role-providing. See the .NET mirror in
    // PdfRenderPipeline.cs for the page-break caveat.
    const token = beginChildTag(ctx, element);
    try {
      this.renderElementWithOverflowCore(element, ctx, contentWidth);
    } finally {
      endChildTag(ctx, token);
    }
  }

  private static renderElementWithOverflowCore(element: IElement, ctx: RenderContext, contentWidth: number): void {
    // Stateful elements (VerticalStack, Table, TextBlock, etc.) implement renderStateful
    // and track their own continuation state so they can resume across page breaks.
    if (isStatefulElement(element)) {
      const stateful = element;

      // Check if this element disallows breaking across pages
      if ((element as { breakAllowed?: boolean }).breakAllowed === false) {
        const elementHeight = element.measureHeight(contentWidth);
        const wouldOverflow = ctx.currentY + elementHeight > ctx.maxY;
        const notAtTop = ctx.currentY > ctx.contentTop;
        const wouldFitOnFreshPage = elementHeight <= ctx.contentHeight;

        if (wouldOverflow && notAtTop && wouldFitOnFreshPage) {
          ctx.newPage();
        }
      }

      // Layout capture: open one node around the whole element; the overflow
      // loop drives it to completion and ctx.newPage() splits its rect per page.
      ctx.layoutRecorder?.openNode(
        element,
        captureTypeOf(element),
        captureNameOf(element),
        ctx.currentPageIndex,
        ctx.currentX,
        ctx.currentY,
        contentWidth
      );
      let wrapAttempts = 0;
      for (;;) {
        let status: RenderStatus;
        try {
          ctx.canvas.saveState();
          status = stateful.renderStateful(ctx, contentWidth);
        } finally {
          ctx.canvas.restoreState();
        }
        if (status === RenderStatus.Complete) break;
        if (status === RenderStatus.WrapRequired) {
          // The element cannot fit even on a fresh page: skip it rather than loop.
          if (++wrapAttempts > this.maxWrapAttempts) {
            ctx.resources.diagnostics.addWarning(
              'render',
              `An element that does not fit on an empty page was skipped (page ${ctx.currentPageIndex + 1}).`,
              'pagination'
            );
            break;
          }
        } else {
          wrapAttempts = 0;
        }
        ctx.newPage();
      }

      ctx.layoutRecorder?.closeNode(element, ctx.currentPageIndex, ctx.currentY, true);

      // Clear continuation state once the element has finished so the document
      // tree returns to its pristine state. Without this a second export pass
      // (e.g. SVG preview followed by PDF download) sees stale lastLineRendered
      // markers and skips already-"rendered" content. Mirrors the .NET
      // reference pipeline (PdfRenderPipeline.cs ResetState after completion).
      if (typeof stateful.resetState === 'function') stateful.resetState();
    } else {
      // Non-stateful fallback - render once without pagination
      try {
        ctx.canvas.saveState();
        element.render(ctx, contentWidth);
      } finally {
        ctx.canvas.restoreState();
      }
    }
  }

  public static *renderPagesStreaming(
    pages: readonly Page[],
    settings: DocumentSettings,
    ctx: RenderContext
  ): Generator<PageRenderOutput> {
    if (!pages || !ctx) {
      throw new Error('Pages and context cannot be null');
    }

    // Header/footer consume body content height (spec: Layout & Pagination
    // §5.1). The context is supplied by the caller here, so the reservation is
    // installed at the top of the run rather than at construction.
    ctx.emojiRendering = settings.emojiRendering;
    ctx.setChromeReservation(chromeReservationFor(settings, ctx));

    // With no page chrome to add, a finished body page is the whole stream, so it is
    // compressed as soon as layout leaves it (the writer would compress the same text the
    // same way). A dry run's pages are never written, so they are not kept at all.
    ctx.finishedPageStorage = ctx.discardFinishedPages
      ? 'discard'
      : ctx.sealFinishedPages && !hasPageChrome(pages, settings)
        ? 'compressed'
        : 'keep';

    const pageDimensions = new Map<
      number,
      { size: PdfSize; margin: number; pageColor?: Color; pageBackground?: IElement; pageForeground?: IElement }
    >();

    let currentOutputIndex = 0;
    for (const page of pages) {
      const previousPage = ctx.currentPageIndex;
      while (ctx.pages.length <= currentOutputIndex) {
        ctx.pages.push('');
      }

      // See above: settings-derived pages resolve their margin at render time.
      const pageMargin = page.hasExplicitMargin ? page.margin : settings.margin;

      ctx.pageSize = page.size;
      ctx.margin = pageMargin;

      ctx.switchToPage(currentOutputIndex); // also resets the tagging context's per-page MCID state
      // The previous input page's body is complete; the switch has flushed its last operators.
      if (previousPage < currentOutputIndex) ctx.sealPage(previousPage);
      ctx.resetCursorToContentTop();

      const contentWidth = page.width - pageMargin * 2;

      pageDimensions.set(currentOutputIndex, {
        size: page.size,
        margin: pageMargin,
        pageColor: page.pageColor,
        pageBackground: page.pageBackground,
        pageForeground: page.pageForeground,
      });

      this.renderElementsWithOverflow(page.getElements(), ctx, contentWidth);

      for (let i = currentOutputIndex + 1; i <= ctx.currentPageIndex; i++) {
        pageDimensions.set(i, {
          size: page.size,
          margin: pageMargin,
          pageColor: page.pageColor,
          pageBackground: page.pageBackground,
          pageForeground: page.pageForeground,
        });
      }

      currentOutputIndex = ctx.currentPageIndex + 1;
    }

    // Body layout is over: a page break while chrome paints must not seal the page in hand.
    ctx.finishedPageStorage = 'keep';

    const totalPages = ctx.pages.length;
    for (let i = 0; i < totalPages; i++) {
      let pageSize = ctx.pageSize;

      const dimensions = pageDimensions.get(i);
      if (dimensions) {
        pageSize = dimensions.size;
      }

      ctx.pageSize = pageSize;
      ctx.margin = dimensions?.margin || settings.margin;
      ctx.switchToPage(i);

      // Full-page background slot. Painted behind everything, ignoring
      // margins. Prepended so it ends up at the very back of the
      // painter's-model stream. A per-page Page.pageBackground element overrides
      // the document-level template for this page.
      if (dimensions?.pageBackground) {
        this.renderPageSlotElement(ctx, dimensions.pageBackground, i, true, settings.contentDirection);
      } else {
        this.renderPageSlot(ctx, settings.pageBackground, i, true, settings.contentDirection);
      }

      // Solid page colour: prepended last so it lands at the very front of the
      // stream (the backmost position in the painter's model), behind the
      // pageBackground slot, headers, body content, and footers. A per-page
      // Page.pageColor overrides the document-level setting. Ignored when
      // neither is set.
      const pageColor = dimensions?.pageColor ?? settings.pageColor;
      this.renderPageColor(ctx, pageColor, i, pageSize.width, pageSize.height);

      this.renderTemplate(ctx, settings, i);

      // The watermark paints on top of the body content and header/footer so a
      // "DRAFT" / "CONFIDENTIAL" overlay is always visible and never occluded by
      // opaque page elements. Only the explicit foreground slot sits above it.
      this.renderWatermark(ctx, settings, i, pageSize.width, pageSize.height);

      // Full-page foreground slot. Painted on top of everything, ignoring
      // margins (explicit stamps / overlays). A per-page Page.pageForeground
      // element overrides the document-level template for this page.
      if (dimensions?.pageForeground) {
        this.renderPageSlotElement(ctx, dimensions.pageForeground, i, false, settings.contentDirection);
      } else {
        this.renderPageSlot(ctx, settings.pageForeground, i, false, settings.contentDirection);
      }

      const output = new PageRenderOutput(ctx.pages[i], pageSize, ctx.pageHyperlinks.get(i) || []);
      const sealed = ctx.takeSealedPage(i);
      if (sealed) {
        // Pages are sealed only when no page chrome is configured, so nothing can follow.
        if (ctx.pages[i] !== '') throw new Error('Internal error: page chrome was painted on a compressed page.');
        output.compressedContent = sealed;
      }

      yield output;

      // The page has been written: drop its content and links so a long document's
      // memory falls as it is written rather than being held until the end.
      ctx.pages[i] = '';
      ctx.pageHyperlinks.delete(i);
    }
  }

  private static renderWatermark(
    ctx: RenderContext,
    settings: DocumentSettings,
    pageIndex: number,
    pageWidth: number,
    pageHeight: number
  ): void {
    if (!settings.watermark || !settings.watermark.text) return;

    const wm = settings.watermark;

    const fontResourceName = ctx.registerFont(wm.fontName);
    ctx.trackGlyphUsage(wm.fontName, wm.text);

    const radians = wm.rotationDegrees * (Math.PI / 180.0);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const cx = pageWidth / 2;
    const cy = pageHeight / 2;

    const textWidth = FontMetrics.getStringWidth(wm.text, StandardFonts.Helvetica, wm.fontSize);

    // Kern the watermark like body text (the SVG export already
    // kerns it), falling back to a plain `Tj` operand when the font has no
    // kern pairs for this string.
    const embeddedFont = ctx.resolveEmbeddedFont(wm.fontName);
    const kernedOperand =
      embeddedFont && embeddedFont.hasKerning ? PdfSyntax.toKernedGlyphArray(wm.text, embeddedFont) : null;
    const textOperand =
      kernedOperand ??
      (embeddedFont ? PdfSyntax.toGlyphIdHexString(wm.text, embeddedFont) : `(${PdfSyntax.escapeWinAnsi(wm.text)})`);

    const wmOps: string[] = [];
    PdfOperators.saveState(wmOps);
    PdfOperators.setGraphicsState(wmOps, ctx.registerAlphaGraphicsState(wm.opacity));
    PdfOperators.concatMatrix(wmOps, cos, sin, -sin, cos, cx, cy);
    PdfOperators.beginText(wmOps);
    PdfOperators.setFont(wmOps, fontResourceName, wm.fontSize);

    let fillColor = wm.color;
    const isPdfA1 = settings.conformance === PdfAConformance.PdfA1b || settings.conformance === PdfAConformance.PdfA1a;
    if (isPdfA1 && wm.opacity < 1.0) {
      // PDF/A-1 forbids transparency (ISO 19005-1 §6.4), so its /ca alpha is forced
      // to 1.0 and a real transparency would render as solid text. Simulate the
      // faint watermark by blending the colour toward white instead. PDF/A-2/3/4
      // keep their real /ca alpha, so no blending is needed there.
      const o = wm.opacity;
      fillColor = Color.fromScRgb(
        o * fillColor.scR + (1 - o),
        o * fillColor.scG + (1 - o),
        o * fillColor.scB + (1 - o)
      );
    }

    PdfOperators.setFillColor(wmOps, fillColor);
    PdfOperators.setTextPosition(wmOps, -textWidth / 2, 0);
    if (kernedOperand != null) {
      PdfOperators.showTextPositioned(wmOps, kernedOperand);
    } else {
      PdfOperators.showText(wmOps, textOperand);
    }
    PdfOperators.endText(wmOps);
    PdfOperators.restoreState(wmOps);

    // Wrap watermark in /Artifact BMC ... EMC so screen readers skip it.
    if (ctx.tagging) {
      wmOps.unshift('/Artifact BMC\n');
      wmOps.push('EMC\n');
    }

    // Append (not prepend): the watermark paints after the page body so it
    // overlays the content rather than being hidden behind opaque elements.
    ctx.pages[pageIndex] = ctx.pages[pageIndex] + wmOps.join('');
  }

  private static renderTemplate(ctx: RenderContext, settings: DocumentSettings, pageIndex: number): void {
    const pageNumber = pageIndex + 1;

    const hasHeader = !!settings.headerTemplate;
    const hasFooter = !!settings.footerTemplate;

    if (!hasHeader && !hasFooter) return;

    const originalCanvas = ctx.canvas;
    const originalX = ctx.currentX;
    const originalY = ctx.currentY;
    const originalSuspended = ctx.chromeReservationSuspended;

    ctx.setCanvas(ctx.getFixedCanvas());
    // A header is not laid out inside the band it reserves for the body: while
    // the chrome itself paints, the content band is the plain margin box.
    ctx.chromeReservationSuspended = true;

    try {
      const contentWidth = ctx.pageSize.width - ctx.margin * 2;
      const startX = ctx.margin;

      if (hasHeader) {
        const headerElement = settings.headerTemplate!(pageNumber);
        applyContentDirection(headerElement, settings.contentDirection);
        if (headerElement) {
          const headerHeight = headerElement.measureHeight(contentWidth);
          ctx.currentX = startX;
          ctx.currentY = Math.max(0, (ctx.margin - headerHeight) / 2);
          if (ctx.tagging) ctx.canvas.beginArtifact();
          headerElement.render(ctx, contentWidth);
          if (ctx.tagging) ctx.canvas.endArtifact();
        }
      }

      if (hasFooter) {
        const footerElement = settings.footerTemplate!(pageNumber);
        applyContentDirection(footerElement, settings.contentDirection);
        if (footerElement) {
          const footerHeight = footerElement.measureHeight(contentWidth);
          // Centred in the bottom margin band while it fits there, flush to the
          // bottom page edge once it outgrows it - continuous at footerHeight ==
          // margin, and it never runs off the page (spec: Layout & Pagination §5.1).
          const bandTop = ctx.pageSize.height - Math.max(ctx.margin, footerHeight);
          ctx.currentX = startX;
          ctx.currentY = bandTop + Math.max(0, (ctx.margin - footerHeight) / 2);
          if (ctx.tagging) ctx.canvas.beginArtifact();
          footerElement.render(ctx, contentWidth);
          if (ctx.tagging) ctx.canvas.endArtifact();
        }
      }

      // Flush the template canvas stream into the page before restoring
      const fixedCanvas = ctx.canvas as PdfCanvas;
      if (typeof fixedCanvas.getStream === 'function') {
        const templateOps = fixedCanvas.getStream();
        if (templateOps.length > 0) {
          ctx.pages[pageIndex] = (ctx.pages[pageIndex] ?? '') + templateOps.join('');
        }
      }
    } finally {
      ctx.setCanvas(originalCanvas);
      ctx.currentX = originalX;
      ctx.currentY = originalY;
      ctx.chromeReservationSuspended = originalSuspended;
    }
  }

  /**
   * Renders a full-page slot element (page background / foreground). The
   * slot spans the entire page and ignores the margins, so the element is
   * rendered at the page origin (0, 0) with the full page width.
   *
   * When `isBackground` is true the slot's operators are prepended to the page
   * stream so they paint behind all existing content (including the
   * watermark); otherwise they are appended so they paint on top of everything.
   */
  private static renderPageSlot(
    ctx: RenderContext,
    template: ((pageNumber: number) => IElement | undefined) | undefined,
    pageIndex: number,
    isBackground: boolean,
    direction: ContentDirection
  ): void {
    if (!template) return;

    const element = template(pageIndex + 1);
    if (!element) return;

    this.renderPageSlotElement(ctx, element, pageIndex, isBackground, direction);
  }

  /**
   * Renders a single element as a full-page background/foreground slot
   * (ignoring margins, origin at the top-left, full page width). Backgrounds are
   * prepended so they paint behind everything; foregrounds are appended so they
   * paint on top. Shared by the document-level template path
   * ({@link renderPageSlot}) and the per-page element override path.
   */
  private static renderPageSlotElement(
    ctx: RenderContext,
    element: IElement,
    pageIndex: number,
    isBackground: boolean,
    direction: ContentDirection
  ): void {
    applyContentDirection(element, direction);
    const originalCanvas = ctx.canvas;
    const originalX = ctx.currentX;
    const originalY = ctx.currentY;

    // Fixed canvas accumulates the slot's operators in its own buffer so we can
    // decide where to splice them into the page stream.
    ctx.setCanvas(ctx.getFixedCanvas());

    let slotOps = '';
    try {
      // Slots ignore margins: full page width, origin at the top-left corner.
      const fullWidth = ctx.pageSize.width;
      ctx.currentX = 0;
      ctx.currentY = 0;

      // Page slots are decorative chrome - keep them out of the structure tree
      // (PDF/UA) by wrapping in an /Artifact marked-content section.
      if (ctx.tagging) ctx.canvas.beginArtifact();
      element.render(ctx, fullWidth);
      if (ctx.tagging) ctx.canvas.endArtifact();

      const fixedCanvas = ctx.canvas as PdfCanvas;
      if (typeof fixedCanvas.getStream === 'function') {
        slotOps = fixedCanvas.getStream().join('');
      }
    } finally {
      ctx.setCanvas(originalCanvas);
      ctx.currentX = originalX;
      ctx.currentY = originalY;
    }

    if (!slotOps) return;
    ctx.pages[pageIndex] = isBackground
      ? slotOps + (ctx.pages[pageIndex] ?? '')
      : (ctx.pages[pageIndex] ?? '') + slotOps;
  }

  /**
   * Paints a solid full-page background colour (ignoring margins) and prepends
   * it to the page stream so it lands at the very front (the backmost position
   * in the painter's model) — behind the {@link DocumentSettings.pageBackground}
   * slot, headers, body, and footers. Call after the background slot so the
   * colour ends up behind it. No-op when {@link DocumentSettings.pageColor} is
   * unset.
   */
  private static renderPageColor(
    ctx: RenderContext,
    color: Color | undefined,
    pageIndex: number,
    pageWidth: number,
    pageHeight: number
  ): void {
    if (!color) return;

    const originalCanvas = ctx.canvas;
    const originalX = ctx.currentX;
    const originalY = ctx.currentY;

    ctx.setCanvas(ctx.getFixedCanvas());
    let ops = '';
    try {
      ctx.currentX = 0;
      ctx.currentY = 0;
      // Decorative fill - keep it out of the structure tree (PDF/UA).
      if (ctx.tagging) ctx.canvas.beginArtifact();
      ctx.canvas.fillRect(0, 0, pageWidth, pageHeight, color);
      if (ctx.tagging) ctx.canvas.endArtifact();

      const fixedCanvas = ctx.canvas as PdfCanvas;
      if (typeof fixedCanvas.getStream === 'function') {
        ops = fixedCanvas.getStream().join('');
      }
    } finally {
      ctx.setCanvas(originalCanvas);
      ctx.currentX = originalX;
      ctx.currentY = originalY;
    }

    if (!ops) return;
    ctx.pages[pageIndex] = ops + (ctx.pages[pageIndex] ?? '');
  }
}

/**
 * Whether any page may receive chrome (colour, background or foreground slot, header,
 * footer or watermark) after layout: the conditions the chrome painters check.
 */
function hasPageChrome(pages: readonly Page[], settings: DocumentSettings): boolean {
  if (
    settings.pageColor ||
    settings.pageBackground ||
    settings.pageForeground ||
    settings.headerTemplate ||
    settings.footerTemplate ||
    settings.watermark?.text
  )
    return true;
  for (const page of pages) if (page.pageColor || page.pageBackground || page.pageForeground) return true;
  return false;
}
