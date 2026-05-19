import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { CartesianChartBase } from './CartesianChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';

/**
 * Dot plot chart that renders circular data points with value labels.
 * Now supports multiple series for comparing datasets.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
export class DotPlotChart extends CartesianChartBase {
  private static readonly DEFAULT_COLOR_HEX = '#4f46e5';
  private static readonly DEFAULT_DOT_RADIUS_VALUE = 10;

  /**
   * Default dot radius for all series (can be overridden per series via Style).
   */
  defaultDotRadius: number = DotPlotChart.DEFAULT_DOT_RADIUS_VALUE;

  /**
   * Color for the data point circles (backward compatibility).
   */
  dotColor: Color = Color.fromHex(DotPlotChart.DEFAULT_COLOR_HEX);

  /**
   * Radius of the data point circles (backward compatibility).
   */
  dotRadius: number = DotPlotChart.DEFAULT_DOT_RADIUS_VALUE;

  /**
   * Draws the dot plot chart elements for a single series (circular data points).
   */
  protected override drawSeriesElements(
    canvas: ICanvas,
    _data: ChartData,
    series: ChartSeries,
    coordinates: Point[],
    _chartAreaWidth: number,
    _chartAreaHeight: number,
    _baselineY: number,
    _topY: number
  ): void {
    // Get series-specific styling or use defaults
    const dotRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultDotRadius;

    // Draw data point circles
    this.drawDataPoints(canvas, coordinates, series.color, dotRadius);
  }

  /**
   * Gets the vertical offset for value labels (accounts for dot radius).
   */
  protected override getLabelVerticalOffset(series: ChartSeries): number {
    const dotRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultDotRadius;
    return dotRadius + 7;
  }

  /**
   * Draws the data point circles for a series.
   */
  private drawDataPoints(canvas: ICanvas, coordinates: Point[], color: Color, radius: number): void {
    for (const p of coordinates) {
      canvas.fillCircle(p.x, p.y, radius, color);
    }
  }

  /**
   * Gets the default color for the series when converting from old API (DataPoints) to new API (Series).
   * Returns the chart's DotColor property for backward compatibility.
   */
  protected override getDefaultSeriesColor(): Color {
    return this.dotColor;
  }
}
