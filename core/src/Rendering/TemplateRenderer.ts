import { RenderContext } from './RenderContext';
import { DocumentSettings } from '../Configuration/DocumentSettings';
import { IElement } from '../Elements/IElement';

export class TemplateRenderer {
  public static renderTemplates(ctx: RenderContext, settings: DocumentSettings): void {
    if (!settings.headerTemplate && !settings.footerTemplate) return;

    const totalPages = ctx.pages.length;

    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      ctx.switchToPage(i);
      ctx.isLastPage = i === totalPages - 1;

      if (settings.headerTemplate) {
        const headerElement = settings.headerTemplate(pageNumber);
        if (headerElement) this.renderHeader(ctx, headerElement);
      }

      if (settings.footerTemplate) {
        const footerElement = settings.footerTemplate(pageNumber);
        if (footerElement) this.renderFooter(ctx, footerElement);
      }
    }
  }

  private static renderHeader(ctx: RenderContext, element: IElement): void {
    const savedX = ctx.currentX;
    const savedY = ctx.currentY;

    ctx.currentX = ctx.margin;
    ctx.currentY = ctx.margin / 2;

    const contentWidth = ctx.pageSize.width - 2 * ctx.margin;
    element.render(ctx, contentWidth);

    ctx.currentX = savedX;
    ctx.currentY = savedY;
  }

  private static renderFooter(ctx: RenderContext, element: IElement): void {
    const savedX = ctx.currentX;
    const savedY = ctx.currentY;

    ctx.currentX = ctx.margin;

    const contentWidth = ctx.pageSize.width - 2 * ctx.margin;
    const footerHeight = element.measureHeight(contentWidth);

    ctx.currentY = ctx.pageSize.height - ctx.margin + (ctx.margin - footerHeight) / 2;

    element.render(ctx, contentWidth);

    ctx.currentX = savedX;
    ctx.currentY = savedY;
  }
}
