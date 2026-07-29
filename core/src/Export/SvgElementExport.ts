import { Page } from '../Elements/Layout/Page';
import { ChartBase } from '../Charts/ChartBase';
import { ChartData } from '../Charts/Models/ChartData';
import { IElement } from '../Elements/IElement';
import { Barcode } from '../Elements/Shapes/Barcode';
import { DataMatrix } from '../Elements/Shapes/DataMatrix';
import { QRCode } from '../Elements/Shapes/QRCode';
import { RenderContext } from '../Rendering/RenderContext';
import { PdfSize } from '../Configuration/PdfSize';
import { SvgCanvas } from '../Drawing/SvgCanvas';

/**
 * Synchronous, element-level SVG export.
 *
 * This is the counterpart to the document-level async exporters in
 * `SvgPageExporter` (`exportSvgPagesAsync` / `exportSvgDocumentAsync`): those
 * render a whole {@link Document} with font loading; these render a single
 * page, chart, or symbology synchronously.
 */

/** Renders the page to an SVG string. */
export function toSvg(page: Page): string {
  // Create RenderContext in SVG mode
  const ctx = new RenderContext(new PdfSize(page.width, page.height), page.margin, true);

  // Mimic the layout loop from PdfRenderPipeline
  for (const element of page.getElements()) {
    // Measure height to ensure consistent layout behavior (some elements might cache calculations)
    element.measureHeight(page.contentWidth);

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
export function chartToSvg(chart: ChartBase, data: ChartData): string {
  // Charts use standard fonts internally, so no per-glyph font resolver is needed here.
  // Axis-aligned charts (bar, grouped bar) opt into crisp edges via
  // `svgShapeRendering`; others keep the default antialiasing for their
  // diagonals/arcs/circles.
  const canvas = new SvgCanvas(
    chart.width,
    chart.height,
    undefined,
    chart.svgShapeRendering ? { shapeRendering: chart.svgShapeRendering } : undefined
  );

  // Draw the chart
  chart.draw(canvas, data);

  // Finalize SVG
  return canvas.getSvg();
}

/**
 * Renders a 1D barcode to a standalone SVG string using the same vector
 * element renderer as PDF output.
 */
export function barcodeToSvg(barcode: Barcode): string {
  return elementToSvg(barcode);
}

/**
 * Renders a QR code to a standalone SVG string using the same vector element
 * renderer as PDF output.
 */
export function qrCodeToSvg(qrCode: QRCode): string {
  return elementToSvg(qrCode);
}

/**
 * Renders a Data Matrix symbol to a standalone SVG string using the same
 * vector element renderer as PDF output.
 */
export function dataMatrixToSvg(dataMatrix: DataMatrix): string {
  return elementToSvg(dataMatrix);
}

function elementToSvg(element: IElement): string {
  const width = element.getPreferredWidth();
  const height = element.measureHeight(width);
  // Barcodes, QR, and Data Matrix are pixel-grid symbologies drawn as a mosaic
  // of abutting rectangles. crispEdges snaps module edges to the device pixel
  // grid so adjacent modules meet exactly, eliminating the faint anti-aliasing
  // seams ("1px lines") that otherwise appear between blocks.
  const ctx = new RenderContext(new PdfSize(width, height), 0, true, undefined, {
    shapeRendering: 'crispEdges',
  });

  element.render(ctx, width);

  if (ctx.canvas instanceof SvgCanvas) {
    return ctx.canvas.getSvg();
  }

  return ctx.currentStream.toString();
}
