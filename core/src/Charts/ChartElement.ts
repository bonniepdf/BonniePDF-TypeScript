import { ChartData } from './Models/ChartData';
import { ChartBase } from './ChartBase';
import { ICanvas } from '../Drawing/ICanvas';
import { ElementBase } from '../Elements/ElementBase';
import { RenderContext } from '../Rendering/RenderContext';

/**
 * Custom element that renders a chart using ICanvas to PDF.
 */
export class ChartElement extends ElementBase {
  private readonly chart: ChartBase;
  private readonly data: ChartData;

  constructor(chart: ChartBase, data: ChartData) {
    super();
    this.chart = chart;
    this.data = data;
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
    this.chart.draw(canvas, this.data);
    ctx.flushExternalCanvas(canvas);

    ctx.currentY += this.chart.height;
  }
}
