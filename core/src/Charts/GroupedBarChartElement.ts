import { ChartData } from './Models/ChartData';
import { GroupedBarChart } from './GroupedBarChart';
import { ElementBase } from '../Elements/ElementBase';
import { RenderContext } from '../Rendering/RenderContext';
import { renderTaggedChart } from './ChartTagging';

/**
 * Element that renders a GroupedBarChart to the document.
 */
export class GroupedBarChartElement extends ElementBase {
  private readonly chart: GroupedBarChart;
  private readonly data: ChartData;

  /**
   * Creates a new GroupedBarChartElement.
   * @param chart The grouped bar chart to render
   * @param data The chart data containing series, axis options, and title
   */
  /**
   * Alternate text used when the document is generated as PDF/UA-1.
   * A chart with alt text is tagged as a Figure; without alt text it is
   * treated as decorative artifact content.
   */
  public altText: string;

  /** Marks the chart as decorative even when altText is set. */
  public isDecorative = false;

  constructor(chart: GroupedBarChart, data: ChartData, altText = '') {
    super();
    this.chart = chart;
    this.data = data;
    this.altText = altText;
  }

  /**
   * Measures the height of the chart content.
   */
  protected override measureContentHeight(_contentWidth: number): number {
    return this.chart.height;
  }

  /**
   * Renders the grouped bar chart to the document.
   */
  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    if (this.chart.stretchToFit) this.chart.width = contentWidth;

    const canvas = ctx.getCanvas(ctx.currentX, ctx.currentY);
    renderTaggedChart(ctx, canvas, this.altText, this.isDecorative, () => this.chart.draw(canvas, this.data));
    ctx.flushExternalCanvas(canvas);

    ctx.currentY += this.chart.height;
  }
}
