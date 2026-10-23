import { DocumentSettings } from '../Configuration/DocumentSettings';
import { Page } from '../Elements/Layout/Page';
import { IElement } from '../Elements/IElement';
import { Color } from '../Core/Color';
import { RenderContext } from './RenderContext';
import { PdfRenderPipeline } from './PdfRenderPipeline';
import { chromeReservationFor } from './ChromeReservation';
import { SvgCanvas } from '../Drawing/SvgCanvas';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';
import type { RegisteredLink } from './RegisteredLink';

/** A single laid-out page rendered to an SVG surface. */
export interface SvgPageRenderOutput {
  /** One-based page number. */
  pageNumber: number;
  /** Page width in PDF points. */
  width: number;
  /** Page height in PDF points. */
  height: number;
  /** The page's render surface, ready to be serialized to a standalone SVG. */
  canvas: SvgCanvas;
  /**
   * The page's resolved solid fill (per-page `pageColor` overriding the document
   * default), when one is set. Recorded for the layout snapshot so the contrast
   * preflight can resolve a backdrop for text with no coloured ancestor.
   */
  pageColor?: Color;
  /**
   * True when this page paints a background *element* rather than (or as well as)
   * a flat colour, so its backdrop cannot be reduced to one opaque colour.
   */
  pageBackdropUnknown?: boolean;
  /**
   * Clickable link-overlay markup for this page (external `<a>` anchors and
   * internal `data-bp-link-page` rects), kept separate from the canvas body so
   * the assembler can position it above — but outside — the atomic-image group.
   * Empty when the page has no registered links.
   */
  linkOverlays: string;
}

/**
 * Measures, paginates, and renders document elements into standalone SVG pages:
 * the SVG sibling of {@link PdfRenderPipeline}. It runs the exact same layout
 * and pagination loop as PDF output - so page count, overflow, and stateful
 * continuation make identical layout decisions - but drives an
 * {@link SvgCanvas} per page and finalises each page with watermark, header,
 * and footer drawn through the canvas rather than via raw PDF operators.
 *
 * It must run inside a {@link RenderContext} created with `isSvgMode = true`.
 */
export class SvgRenderPipeline {
  /**
   * Lays out every page (including overflow pages), applies page-level
   * finalisation (watermark, header, footer), and returns one render output per
   * final page.
   */
  public static renderPages(
    pages: readonly Page[],
    settings: DocumentSettings,
    ctx: RenderContext
  ): SvgPageRenderOutput[] {
    if (!pages || pages.length === 0) {
      throw new Error('Document must have at least one page');
    }
    if (!ctx.isSvgMode) {
      throw new Error('SvgRenderPipeline requires a RenderContext created with isSvgMode = true');
    }

    // Header/footer consume body content height, so the SVG preview paginates exactly where the PDF does.
    ctx.emojiRendering = settings.emojiRendering;
    ctx.setChromeReservation(chromeReservationFor(settings, ctx));

    const pageDimensions = new Map<
      number,
      {
        width: number;
        height: number;
        margin: number;
        pageColor?: Color;
        pageBackground?: IElement;
        pageForeground?: IElement;
      }
    >();

    // ── Pass 1: lay out content, allowing elements to overflow onto new pages ──
    let currentOutputIndex = 0;
    for (const page of pages) {
      while (ctx.pages.length <= currentOutputIndex) {
        ctx.pages.push('');
      }

      // Pages created from document settings inherit the margin lazily, so a
      // DocumentSettings assigned after construction still reaches page 1.
      const pageMargin = page.hasExplicitMargin ? page.margin : settings.margin;

      ctx.pageSize = page.size;
      ctx.margin = pageMargin;
      ctx.switchToPage(currentOutputIndex);
      ctx.resetCursorToContentTop();

      const contentWidth = page.width - pageMargin * 2;
      pageDimensions.set(currentOutputIndex, {
        width: page.width,
        height: page.height,
        margin: pageMargin,
        pageColor: page.pageColor,
        pageBackground: page.pageBackground,
        pageForeground: page.pageForeground,
      });

      // Layout capture: wrap each input page's body content in a Page node so
      // the snapshot tree reads Document → Page → content. Overflow onto further
      // physical pages splits the Page node's rect via ctx.newPage().
      ctx.layoutRecorder?.openNode(page, 'Page', undefined, currentOutputIndex, pageMargin, ctx.currentY, contentWidth);
      PdfRenderPipeline.layoutElements(page.getElements(), ctx, contentWidth);
      ctx.layoutRecorder?.closeNode(page, ctx.currentPageIndex, ctx.currentY, true);

      for (let i = currentOutputIndex + 1; i <= ctx.currentPageIndex; i++) {
        pageDimensions.set(i, {
          width: page.width,
          height: page.height,
          margin: pageMargin,
          pageColor: page.pageColor,
          pageBackground: page.pageBackground,
          pageForeground: page.pageForeground,
        });
      }

      currentOutputIndex = ctx.currentPageIndex + 1;
    }

    // ── Pass 2: finalise each page (watermark + header/footer) and collect ─────
    // Page chrome is not body content, so stop recording the layout tree here.
    if (ctx.layoutRecorder) ctx.layoutRecorder.capturing = false;
    const totalPages = ctx.pages.length;
    const outputs: SvgPageRenderOutput[] = [];
    for (let i = 0; i < totalPages; i++) {
      const dim = pageDimensions.get(i) ?? {
        width: ctx.pageSize.width,
        height: ctx.pageSize.height,
        margin: settings.margin,
      };

      ctx.pageSize = pages[0].size; // restore a sensible default for child canvases
      ctx.margin = dim.margin;
      ctx.switchToPage(i);

      const canvas = ctx.getSvgPage(i);
      if (!canvas) continue;

      // Page slots, mirroring PdfRenderPipeline: the background is prepended
      // so it paints behind everything, and the foreground is appended so it
      // paints on top of all content. Both ignore margins and span the full page.
      // A per-page Page.pageBackground/pageForeground element overrides the
      // document-level template for this page.
      if (dim.pageBackground) {
        this.renderPageSlotElement(ctx, canvas, dim.pageBackground, dim.width, true, totalPages);
      } else {
        this.renderPageSlot(ctx, canvas, settings.pageBackground, i, dim.width, true, totalPages);
      }
      // Solid page colour: prepended last so it lands at the very front of the
      // SVG (the backmost paint layer), behind the pageBackground slot. A
      // per-page Page.pageColor overrides the document-level setting.
      this.renderPageColor(canvas, dim.pageColor ?? settings.pageColor, dim.width, dim.height);
      this.renderTemplate(ctx, settings, i, dim.width, dim.height, dim.margin);
      // The watermark is appended after the body content and header/footer so it
      // overlays them and is never occluded; only the foreground slot sits above.
      this.renderWatermark(canvas, settings, dim.width, dim.height);
      if (dim.pageForeground) {
        this.renderPageSlotElement(ctx, canvas, dim.pageForeground, dim.width, false, totalPages);
      } else {
        this.renderPageSlot(ctx, canvas, settings.pageForeground, i, dim.width, false, totalPages);
      }
      // Link overlays are kept OUT of the canvas body and returned separately so
      // the assembler can place them above the painted layers while keeping them
      // outside the page's atomic-image group — an ARIA role="img" prunes its
      // subtree, so a live <a> nested inside it is invalid (see assemblePageSvg).
      const linkOverlays = this.renderLinkOverlays(ctx.pageHyperlinks.get(i) ?? [], dim.height);

      canvas.resolveTotalPages(totalPages);
      const output: SvgPageRenderOutput = {
        pageNumber: i + 1,
        width: dim.width,
        height: dim.height,
        canvas,
        linkOverlays,
      };
      const resolvedPageColor = dim.pageColor ?? settings.pageColor;
      if (resolvedPageColor) output.pageColor = resolvedPageColor;
      // A background *element* can paint anything, so a page carrying one has an
      // unmodellable backdrop for contrast purposes.
      if (dim.pageBackground ?? settings.pageBackground) output.pageBackdropUnknown = true;
      outputs.push(output);
    }

    return outputs;
  }

  /**
   * Builds the clickable link overlays for the hyperlinks registered on this
   * page, mirroring the /Link annotations the PDF pipeline writes. External
   * links (`uri`) become SVG `<a>` elements, so they are live links in any SVG
   * host; internal links (`targetPageIndex`, e.g. VisualToc entries) become
   * rects carrying `data-bp-link-page="N"` (1-based) that a host such as
   * @bonniepdf/previewer wires to page navigation. The rects paint nothing
   * (`fill="none"`) but hit-test (`pointer-events="all"`). Hyperlink render
   * bounds are PDF coordinates (bottom-left origin), so Y is flipped here.
   *
   * Every external `<a>` carries an `aria-label` giving it a discernible
   * accessible name. The name is the link's visible text — the same value the
   * PDF pipeline writes into the annotation `/Contents` (PDF/UA 7-18) — so the
   * link reads identically across the PDF and its SVG preview. Without a name an
   * SVG anchor wrapping only an invisible hit-rect is an unnamed link (WCAG
   * 2.4.4 / axe `link-name`).
   */
  private static renderLinkOverlays(links: readonly RegisteredLink[], pageHeight: number): string {
    const parts: string[] = [];
    for (const link of links) {
      const w = link.renderWidth;
      const h = link.renderHeight;
      if (!(w > 0) || !(h > 0)) continue;

      const rect =
        `x="${fmtNum(link.renderX)}" y="${fmtNum(pageHeight - link.renderY - h)}" ` +
        `width="${fmtNum(w)}" height="${fmtNum(h)}" fill="none" pointer-events="all"`;

      if (typeof link.uri === 'string' && link.uri.length > 0) {
        // Prefer the visible link text; fall back to the URI so the anchor is
        // never nameless even for links created without display text.
        const name = link.text && link.text.length > 0 ? link.text : link.uri;
        parts.push(
          `<a href="${escapeAttr(link.uri)}" target="_blank" rel="noopener" ` +
            `aria-label="${escapeAttr(name)}"><rect ${rect}/></a>`
        );
      } else if (typeof link.targetPageIndex === 'number' && link.targetPageIndex >= 0) {
        parts.push(`<rect ${rect} data-bp-link-page="${link.targetPageIndex + 1}" style="cursor:pointer"/>`);
      }
    }
    return parts.join('');
  }

  /**
   * Draws the document watermark over page content. Mirrors
   * {@link PdfRenderPipeline.renderWatermark}: centred, rotated, semi-transparent
   * text - emitted as an SVG group appended to the page so it paints on top.
   */
  private static renderWatermark(
    canvas: SvgCanvas,
    settings: DocumentSettings,
    pageWidth: number,
    pageHeight: number
  ): void {
    const wm = settings.watermark;
    if (!wm || !wm.text) return;

    const cx = pageWidth / 2;
    const cy = pageHeight / 2;
    const hex = wm.color.toHexString();
    const text = escapeXml(wm.text);

    // rotate() in SVG is clockwise-positive; the layout model treats positive as
    // counter-clockwise (matching the PDF rotate operator), so negate the angle.
    const markup =
      `<g transform="rotate(${-wm.rotationDegrees} ${cx} ${cy})" opacity="${wm.opacity}">` +
      `<text x="${cx}" y="${cy}" fill="${hex}" font-size="${wm.fontSize}" ` +
      `font-family="${escapeAttr(wm.fontName)}" text-anchor="middle" dominant-baseline="central">${text}</text>` +
      `</g>`;

    canvas.appendRawMarkup(markup);
  }

  /**
   * Renders a full-page background/foreground slot, mirroring
   * {@link PdfRenderPipeline.renderPageSlot}. The slot element ignores margins
   * (origin at the page's top-left, full page width) and is composited as a
   * single SVG group: prepended for backgrounds (behind all content) and
   * appended for foregrounds (on top). The element renders into a throwaway
   * child canvas so its markup can be extracted and positioned without
   * disturbing the page canvas or the layout cursor.
   */
  private static renderPageSlot(
    ctx: RenderContext,
    canvas: SvgCanvas,
    template: ((pageNumber: number) => IElement | undefined) | undefined,
    pageIndex: number,
    pageWidth: number,
    isBackground: boolean,
    totalPages: number
  ): void {
    if (!template) return;
    const element = template(pageIndex + 1);
    if (!element) return;
    this.renderPageSlotElement(ctx, canvas, element, pageWidth, isBackground, totalPages);
  }

  /**
   * Renders a single element as a full-page background/foreground slot,
   * mirroring {@link PdfRenderPipeline.renderPageSlotElement}. The element
   * ignores margins (origin at the page's top-left, full page width) and is
   * composited as a single SVG group: prepended for backgrounds (behind all
   * content) and appended for foregrounds (on top). Shared by the document-level
   * template path and the per-page element override path.
   */
  private static renderPageSlotElement(
    ctx: RenderContext,
    canvas: SvgCanvas,
    element: IElement,
    pageWidth: number,
    isBackground: boolean,
    totalPages: number
  ): void {
    const slotCanvas = ctx.getCanvas(0, 0) as SvgCanvas;
    const originalCanvas = ctx.canvas;
    const originalX = ctx.currentX;
    const originalY = ctx.currentY;

    ctx.setCanvas(slotCanvas);
    ctx.currentX = 0;
    ctx.currentY = 0;
    try {
      element.render(ctx, pageWidth);
    } finally {
      ctx.setCanvas(originalCanvas);
      ctx.currentX = originalX;
      ctx.currentY = originalY;
    }

    slotCanvas.resolveTotalPages(totalPages);
    const inner = slotCanvas.getInnerSvg();
    if (!inner) return;
    const markup = `<g>${inner}</g>`;
    if (isBackground) canvas.prependRawMarkup(markup);
    else canvas.appendRawMarkup(markup);
  }

  /**
   * Paints a solid full-page background colour (ignoring margins), prepended so
   * it sits behind everything else on the page - mirroring
   * {@link PdfRenderPipeline.renderPageColor}. No-op when pageColor is unset.
   */
  private static renderPageColor(
    canvas: SvgCanvas,
    color: Color | undefined,
    pageWidth: number,
    pageHeight: number
  ): void {
    if (!color) return;
    const markup = `<rect x="0" y="0" width="${pageWidth}" height="${pageHeight}" fill="${color.toHexString()}"/>`;
    canvas.prependRawMarkup(markup);
  }

  /**
   * Renders the header/footer templates for a page directly onto the page
   * canvas. Mirrors {@link PdfRenderPipeline.renderTemplate} band placement.
   */
  private static renderTemplate(
    ctx: RenderContext,
    settings: DocumentSettings,
    pageIndex: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): void {
    const pageNumber = pageIndex + 1;
    const hasHeader = !!settings.headerTemplate;
    const hasFooter = !!settings.footerTemplate;
    if (!hasHeader && !hasFooter) return;

    const originalX = ctx.currentX;
    const originalY = ctx.currentY;
    const originalSuspended = ctx.chromeReservationSuspended;
    const contentWidth = pageWidth - margin * 2;
    const startX = margin;

    // A header is not laid out inside the band it reserves for the body.
    ctx.chromeReservationSuspended = true;

    try {
      if (hasHeader) {
        const headerElement = settings.headerTemplate!(pageNumber);
        if (headerElement) {
          const headerHeight = headerElement.measureHeight(contentWidth);
          ctx.currentX = startX;
          ctx.currentY = Math.max(0, (margin - headerHeight) / 2);
          headerElement.render(ctx, contentWidth);
        }
      }

      if (hasFooter) {
        const footerElement = settings.footerTemplate!(pageNumber);
        if (footerElement) {
          const footerHeight = footerElement.measureHeight(contentWidth);
          const bandTop = pageHeight - Math.max(margin, footerHeight);
          ctx.currentX = startX;
          ctx.currentY = bandTop + Math.max(0, (margin - footerHeight) / 2);
          footerElement.render(ctx, contentWidth);
        }
      }
    } finally {
      ctx.currentX = originalX;
      ctx.currentY = originalY;
      ctx.chromeReservationSuspended = originalSuspended;
    }
  }
}

/** Formats a coordinate for link-overlay markup (2 dp, no trailing zeros). */
function fmtNum(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return `${Number(value.toFixed(2))}`;
}
