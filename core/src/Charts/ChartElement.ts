import { ChartData } from './Models/ChartData';
import { ChartBase } from './ChartBase';
import { ElementBase } from '../Elements/ElementBase';
import { RenderContext } from '../Rendering/RenderContext';
import { renderTaggedChart } from './ChartTagging';

/**
 * Custom element that renders a chart using ICanvas to PDF.
 */
export class ChartElement extends ElementBase {
  private readonly chart: ChartBase;
  private readonly data: ChartData;

  /**
   * Alternate text used when the document is generated as PDF/UA-1.
   * A chart with alt text is tagged as a Figure; without alt text it is
   * treated as decorative artifact content.
   */
  public altText: string;

  /** Marks the chart as decorative even when altText is set. */
  public isDecorative = false;

  constructor(chart: ChartBase, data: ChartData, altText = '') {
    super();
    this.chart = chart;
    this.data = data;
    this.altText = altText;
  }

  protected override getPreferredContentWidth(): number {
    return this.chart.width;
  }

  protected override measureContentHeight(_contentWidth: number): number {
    // If stretching to fit, use container width for measurement
    if (this.chart.stretchToFit) return this.chart.height;
    return this.chart.height;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    if (this.chart.stretchToFit) this.chart.width = contentWidth;

    const canvas = ctx.getCanvas(ctx.currentX, ctx.currentY);
    renderTaggedChart(ctx, canvas, this.altText, this.isDecorative, () => this.chart.draw(canvas, this.data));
    ctx.flushExternalCanvas(canvas);

    ctx.currentY += this.chart.height;
  }
}
