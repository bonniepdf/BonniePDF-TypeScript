import { ChartData } from './Models/ChartData';
import { GroupedBarChart } from './GroupedBarChart';
import { ICanvas } from '../Drawing/ICanvas';
import { ElementBase } from '../Elements/ElementBase';
import { RenderContext } from '../Rendering/RenderContext';

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
  constructor(chart: GroupedBarChart, data: ChartData) {
    super();
    this.chart = chart;
    this.data = data;
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
    this.chart.draw(canvas, this.data);
    ctx.flushExternalCanvas(canvas);

    ctx.currentY += this.chart.height;
  }
}
