import { Color } from '../Core/Color';
import { IElement } from '../Elements/IElement';
import { DocumentSettings } from '../Configuration/DocumentSettings';
import { Page } from '../Elements/Layout/Page';
import { PdfRenderResult, PageRenderOutput } from './PageDimensions';
import { RenderContext } from './RenderContext';
import { PdfSyntax } from './Pdf/PdfSyntax';
import { PdfOperators } from './Pdf/PdfOperators';
import { FontMetrics } from '../Typography/FontMetrics';
import { StandardFonts } from '../Typography/StandardFonts';
import { RenderStatus } from '../Elements/RenderStatus';

export class PdfRenderPipeline {
  public static renderPages(pages: Page[], settings: DocumentSettings): PdfRenderResult {
    if (!pages || pages.length === 0) {
      throw new Error('Document must have at least one page');
    }

    const orientedPageSize = settings.getOrientedPageSize();
    const ctx = new RenderContext(orientedPageSize, settings.margin);

    const result = new PdfRenderResult(ctx, orientedPageSize);

    let currentOutputIndex = 0;

    for (const page of pages) {
      while (ctx.pages.length <= currentOutputIndex) {
        ctx.pages.push('');
      }

      const pageWidth = page.width;
      const pageHeight = page.height;
      const pageMargin = page.margin;

      ctx.pageSize = page.size;
      ctx.margin = pageMargin;

      ctx.switchToPage(currentOutputIndex);
      ctx.currentX = pageMargin;
      ctx.currentY = pageMargin;

      const contentWidth = pageWidth - pageMargin * 2;

      result.pageDimensions.set(currentOutputIndex, {
        size: page.size,
        margin: pageMargin
      });

      this.renderElementsWithOverflow(page.getElements() as IElement[], ctx, contentWidth);

      for (let i = currentOutputIndex + 1; i <= ctx.currentPageIndex; i++) {
        result.pageDimensions.set(i, {
          size: page.size,
          margin: pageMargin
        });
      }

      currentOutputIndex = ctx.currentPageIndex + 1;
    }

    for (const stream of ctx.pages) {
      result.pageContentStreams.push(stream);
    }

    return result;
  }

  private static renderElementsWithOverflow(elements: IElement[], ctx: RenderContext, contentWidth: number): void {
    for (const element of elements) {
      this.renderElementWithOverflow(element, ctx, contentWidth);
    }
  }

  /** Safety cap — prevents infinite loops if an element never returns Complete. */
  private static readonly maxPageGuard = 500;

  private static renderElementWithOverflow(element: IElement, ctx: RenderContext, contentWidth: number): void {
    // Stateful elements (VerticalStack, Table, TextBlock, etc.) implement renderStateful
    // and track their own continuation state so they can resume across page breaks.
    if ('renderStateful' in element && typeof (element as any).renderStateful === 'function') {
      const stateful = element as any;
      let guard = 0;
      let status: RenderStatus;
      do {
        try {
          ctx.canvas.saveState();
          status = stateful.renderStateful(ctx, contentWidth) as RenderStatus;
        } finally {
          ctx.canvas.restoreState();
        }
        if (status === RenderStatus.Overflow || status === RenderStatus.WrapRequired) {
          ctx.newPage();
        }
        guard++;
      } while (status !== RenderStatus.Complete && guard < this.maxPageGuard);
    } else {
      // Non-stateful fallback — render once without pagination
      try {
        ctx.canvas.saveState();
        element.render(ctx, contentWidth);
      } finally {
        ctx.canvas.restoreState();
      }
    }
  }

  public static* renderPagesStreaming(pages: Page[], settings: DocumentSettings, ctx: RenderContext): Generator<PageRenderOutput> {
    if (!pages || !ctx) {
      throw new Error('Pages and context cannot be null');
    }

    const orientedPageSize = settings.getOrientedPageSize();
    const pageDimensions = new Map<number, { size: any; margin: number }>();

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

      pageDimensions.set(currentOutputIndex, {
        size: page.size,
        margin: page.margin
      });

      this.renderElementsWithOverflow(page.getElements() as IElement[], ctx, contentWidth);

      for (let i = currentOutputIndex + 1; i <= ctx.currentPageIndex; i++) {
        pageDimensions.set(i, {
          size: page.size,
          margin: page.margin
        });
      }

      currentOutputIndex = ctx.currentPageIndex + 1;
    }

    const totalPages = ctx.pages.length;
    for (let i = 0; i < totalPages; i++) {
      let pageSize = ctx.pageSize;

      const dimensions = pageDimensions.get(i);
      if (dimensions) {
        pageSize = dimensions.size;
      }

      ctx.pageSize = pageSize;
      ctx.margin = (dimensions?.margin || settings.margin) as any;
      ctx.switchToPage(i);

      this.renderWatermark(ctx, settings, i, pageSize.width, pageSize.height);
      this.renderTemplate(ctx, settings, i);

      const output = new PageRenderOutput(
        ctx.pages[i],
        pageSize,
        ctx.pageHyperlinks.get(i) || []
      );

      yield output;
    }
  }

  private static renderWatermark(ctx: RenderContext, settings: DocumentSettings, pageIndex: number, pageWidth: number, pageHeight: number): void {
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

    const embeddedFont = ctx.resolveEmbeddedFont(wm.fontName);
    const textOperand = embeddedFont
      ? PdfSyntax.toGlyphIdHexString(wm.text, embeddedFont)
      : `(${PdfSyntax.escape(wm.text)})`;

    const wmOps: string[] = [];
    PdfOperators.saveState(wmOps);
    PdfOperators.setGraphicsState(wmOps, '/GS_WM');
    PdfOperators.concatMatrix(wmOps, cos, sin, -sin, cos, cx, cy);
    PdfOperators.beginText(wmOps);
    PdfOperators.setFont(wmOps, fontResourceName, wm.fontSize);

    let fillColor = wm.textColor;
    if (ctx.pdfAEnabled && wm.opacity < 1.0) {
      // For PDF/A, blend opacity into color (no transparency allowed)
      fillColor = fillColor.withAlpha(Math.round(wm.opacity * 255));
    }

    PdfOperators.setFillColor(wmOps, fillColor);
    PdfOperators.setTextPosition(wmOps, -textWidth / 2, 0);
    PdfOperators.showText(wmOps, textOperand);
    PdfOperators.endText(wmOps);
    PdfOperators.restoreState(wmOps);

    ctx.pages[pageIndex] = wmOps.join('') + ctx.pages[pageIndex];
  }

  private static renderTemplate(ctx: RenderContext, settings: DocumentSettings, pageIndex: number): void {
    const pageNumber = pageIndex + 1;

    const hasHeader = !!settings.headerTemplate;
    const hasFooter = !!settings.footerTemplate;

    if (!hasHeader && !hasFooter) return;

    const originalCanvas = ctx.canvas;
    const originalX = ctx.currentX;
    const originalY = ctx.currentY;

    ctx.setCanvas(ctx.getFixedCanvas());

    try {
      const contentWidth = ctx.pageSize.width - ctx.margin * 2;
      const startX = ctx.margin;

      if (hasHeader) {
        const headerElement = settings.headerTemplate!(pageNumber);
        if (headerElement) {
          ctx.currentX = startX;
          ctx.currentY = 0;
          headerElement.render(ctx, contentWidth);
        }
      }

      if (hasFooter) {
        const footerElement = settings.footerTemplate!(pageNumber);
        if (footerElement) {
          ctx.currentX = startX;
          ctx.currentY = ctx.pageSize.height - ctx.margin;
          footerElement.render(ctx, contentWidth);
        }
      }

      // Flush the template canvas stream into the page before restoring
      const fixedCanvas = ctx.canvas as any;
      if (typeof fixedCanvas.getStream === 'function') {
        const templateOps: string[] = fixedCanvas.getStream();
        if (templateOps.length > 0) {
          ctx.pages[pageIndex] = (ctx.pages[pageIndex] ?? '') + templateOps.join('');
        }
      }
    } finally {
      ctx.setCanvas(originalCanvas);
      ctx.currentX = originalX;
      ctx.currentY = originalY;
    }
  }
}
