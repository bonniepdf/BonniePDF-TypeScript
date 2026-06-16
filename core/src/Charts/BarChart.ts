import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';

/**
 * Bar chart that renders vertical bars with value labels above each bar.
 * Now supports multiple series.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
export class BarChart extends CartesianChartBase {
  private static readonly BAR_COLOR_HEX = '#4f46e5';

  /** Bars and gridlines are axis-aligned, so crisp edges render sharper than antialiased. */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  /**
   * Color for the bars (backward compatibility).
   */
  barColor: Color = Color.fromHex(BarChart.BAR_COLOR_HEX);

  /**
   * Width of bars as percentage of available space (0.0 to 1.0, default: 0.6).
   */
  barWidthRatio: number = 0.6;

  /**
   * Draws the bar chart elements for a single series.
   * In vertical mode draws upward bars; in horizontal mode draws rightward bars.
   */
  protected override drawSeriesElements(
    canvas: ICanvas,
    _data: ChartData,
    series: ChartSeries,
    coordinates: Point[],
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    const dataPointCount = series.dataPoints.length;

    if (this.orientation === ChartOrientation.Horizontal) {
      const totalBarSpace = chartAreaHeight / dataPointCount;
      const barThickness = Math.min(totalBarSpace * this.barWidthRatio, 50);
      this.drawBars(canvas, coordinates, barThickness, baselineY, series.color);
    } else {
      const totalBarSpace = chartAreaWidth / dataPointCount;
      const barWidth = Math.min(totalBarSpace * this.barWidthRatio, 50);
      this.drawBars(canvas, coordinates, barWidth, baselineY, series.color);
    }
  }

  /**
   * Gets the offset for value labels (spacing above bars in vertical mode, to the right in horizontal).
   */
  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  /**
   * Draws bars for each data point.
   * In vertical mode bars grow upward; in horizontal mode bars grow rightward from LeftPadding.
   */
  private drawBars(canvas: ICanvas, coordinates: Point[], thickness: number, baselineY: number, color: Color): void {
    for (const p of coordinates) {
      if (this.orientation === ChartOrientation.Horizontal) {
        const barWidth = p.x - CartesianChartBase.LEFT_PADDING;
        canvas.fillRect(CartesianChartBase.LEFT_PADDING, p.y - thickness / 2, barWidth, thickness, color);
      } else {
        const barHeight = baselineY - p.y;
        const barX = p.x - thickness / 2;
        canvas.fillRect(barX, p.y, thickness, barHeight, color);
      }
    }
  }

  /**
   * Gets the default color for the series when converting from old API (DataPoints) to new API (Series).
   * Returns the chart's BarColor property for backward compatibility.
   */
  protected override getDefaultSeriesColor(): Color {
    return this.barColor;
  }
}
