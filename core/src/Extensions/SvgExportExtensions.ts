import { Page } from '../Elements/Layout/Page';
import { ChartBase } from '../Charts/ChartBase';
import { ChartData } from '../Charts/Models/ChartData';
import { RenderContext } from '../Rendering/RenderContext';
import { PdfSize } from '../Configuration/PdfSize';
import { SvgCanvas } from '../Drawing/SvgCanvas';

/**
 * Extension methods for exporting Pages and Charts to SVG.
 */
export class SvgExportExtensions {
  /**
   * Renders the page to an SVG string.
   */
  static toSvg(page: Page): string {
    // Create RenderContext in SVG mode
    const ctx = new RenderContext(new PdfSize(page.width, page.height), page.margin, true);

    // Mimic the layout loop from PdfRenderPipeline
    for (const element of page.getElements()) {
      // Measure height to ensure consistent layout behavior (some elements might cache calculations)
      const elementHeight = element.measureHeight(page.contentWidth);

      // Render the element
      element.render(ctx, page.contentWidth);
    }

    // Get the underlying SvgCanvas to finalize the output
    if (ctx.canvas instanceof SvgCanvas) {
      return ctx.canvas.getSvg();
    }

    return ctx.currentStream.toString();
  }

  /**
   * Renders the chart to an SVG string.
   * Note: Chart SVG export uses standard font fallback rendering without per-glyph kerning.
   * For accurate kerning with embedded fonts, render the chart via a Page using toSvg(Page) instead.
   */
  static chartToSvg(chart: ChartBase, data: ChartData): string {
    // Charts use standard fonts internally, so no per-glyph font resolver is needed here.
    const canvas = new SvgCanvas(chart.width, chart.height);

    // Draw the chart
    chart.draw(canvas, data);

    // Finalize SVG
    return canvas.getSvg();
  }
}

/**
 * Shortcut functions for SvgExportExtensions
 */
export function toSvg(page: Page): string {
  return SvgExportExtensions.toSvg(page);
}

export function chartToSvg(chart: ChartBase, data: ChartData): string {
  return SvgExportExtensions.chartToSvg(chart, data);
}
