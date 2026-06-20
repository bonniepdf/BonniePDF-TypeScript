import { DocumentSettings } from '../Configuration/DocumentSettings';
import { Page } from '../Elements/Layout/Page';
import { IElement } from '../Elements/IElement';
import { RenderContext } from './RenderContext';
import { PdfRenderPipeline } from './PdfRenderPipeline';
import { SvgCanvas } from '../Drawing/SvgCanvas';
import { escapeXml, escapeAttr } from '../Core/XmlEscape';

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
}

/**
 * The SVG sibling of {@link PdfRenderPipeline}. It runs the exact same layout
 * and pagination loop as PDF output - so page count, overflow, and stateful
 * continuation match byte-for-byte in terms of layout decisions - but drives an
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
  public static renderPages(pages: Page[], settings: DocumentSettings, ctx: RenderContext): SvgPageRenderOutput[] {
    if (!pages || pages.length === 0) {
      throw new Error('Document must have at least one page');
    }
    if (!ctx.isSvgMode) {
      throw new Error('SvgRenderPipeline requires a RenderContext created with isSvgMode = true');
    }

    const pageDimensions = new Map<number, { width: number; height: number; margin: number }>();

    // ── Pass 1: lay out content, allowing elements to overflow onto new pages ──
    let currentOutputIndex = 0;
    for (const page of pages) {
      while (ctx.pages.length <= currentOutputIndex) {
        ctx.pages.push('');
      }

      ctx.pageSize = page.size;
      ctx.margin = page.margin;
      ctx.switchToPage(currentOutputIndex);
      ctx.currentX = page.margin;
      ctx.currentY = page.margin;

      const contentWidth = page.width - page.margin * 2;
      pageDimensions.set(currentOutputIndex, { width: page.width, height: page.height, margin: page.margin });

      PdfRenderPipeline.layoutElements(page.getElements() as IElement[], ctx, contentWidth);

      for (let i = currentOutputIndex + 1; i <= ctx.currentPageIndex; i++) {
        pageDimensions.set(i, { width: page.width, height: page.height, margin: page.margin });
      }

      currentOutputIndex = ctx.currentPageIndex + 1;
    }

    // ── Pass 2: finalise each page (watermark + header/footer) and collect ─────
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

      this.renderWatermark(canvas, settings, dim.width, dim.height);
      // this feature page slots, mirroring PdfRenderPipeline: the background is prepended
      // so it paints behind everything (even the watermark, which was prepended
      // just above), and the foreground is appended so it paints on top of all
      // content. Both ignore margins and span the full page.
      this.renderPageSlot(ctx, canvas, settings.pageBackground, i, dim.width, true);
      this.renderTemplate(ctx, settings, i, dim.width, dim.height, dim.margin);
      this.renderPageSlot(ctx, canvas, settings.pageForeground, i, dim.width, false);

      outputs.push({ pageNumber: i + 1, width: dim.width, height: dim.height, canvas });
    }

    return outputs;
  }

  /**
   * Draws the document watermark behind page content. Mirrors
   * {@link PdfRenderPipeline.renderWatermark}: centred, rotated, semi-transparent
   * text - but emitted as an SVG group prepended to the page so it paints first.
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
    const hex = wm.textColor.toHexString();
    const text = escapeXml(wm.text);

    // rotate() in SVG is clockwise-positive; the layout model treats positive as
    // counter-clockwise (matching the PDF rotate operator), so negate the angle.
    const markup =
      `<g transform="rotate(${-wm.rotationDegrees} ${cx} ${cy})" opacity="${wm.opacity}">` +
      `<text x="${cx}" y="${cy}" fill="${hex}" font-size="${wm.fontSize}" ` +
      `font-family="${escapeAttr(wm.fontName)}" text-anchor="middle" dominant-baseline="central">${text}</text>` +
      `</g>`;

    canvas.prependRawMarkup(markup);
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
    isBackground: boolean
  ): void {
    if (!template) return;
    const element = template(pageIndex + 1);
    if (!element) return;

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

    const inner = slotCanvas.getInnerSvg();
    if (!inner) return;
    const markup = `<g>${inner}</g>`;
    if (isBackground) canvas.prependRawMarkup(markup);
    else canvas.appendRawMarkup(markup);
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
    const contentWidth = pageWidth - margin * 2;
    const startX = margin;

    try {
      if (hasHeader) {
        const headerElement = settings.headerTemplate!(pageNumber) as unknown as IElement | undefined;
        if (headerElement) {
          const headerHeight = headerElement.measureHeight(contentWidth);
          ctx.currentX = startX;
          ctx.currentY = Math.max(0, (margin - headerHeight) / 2);
          headerElement.render(ctx, contentWidth);
        }
      }

      if (hasFooter) {
        const footerElement = settings.footerTemplate!(pageNumber) as unknown as IElement | undefined;
        if (footerElement) {
          const footerHeight = footerElement.measureHeight(contentWidth);
          const bandTop = pageHeight - margin;
          ctx.currentX = startX;
          ctx.currentY = bandTop + Math.max(0, (margin - footerHeight) / 2);
          footerElement.render(ctx, contentWidth);
        }
      }
    } finally {
      ctx.currentX = originalX;
      ctx.currentY = originalY;
    }
  }
}
