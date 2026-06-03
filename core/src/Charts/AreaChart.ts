import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';

/**
 * Area chart that renders a filled polygon with a line overlay.
 * Now supports multiple series with transparency for overlapping areas.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
export class AreaChart extends CartesianChartBase {
  private static readonly DEFAULT_AREA_COLOR_HEX = '#4f46e5';

  /**
   * Default fill opacity for all series (can be overridden per series via Style).
   */
  defaultFillOpacity: number = 0.3;

  /**
   * Default line width for all series (can be overridden per series via Style).
   */
  defaultLineWidth: number = 2;

  /**
   * Color for the area fill and line (backward compatibility for single-series charts).
   */
  areaColor: Color = Color.fromHex(AreaChart.DEFAULT_AREA_COLOR_HEX);

  /**
   * Opacity for the area fill (backward compatibility for single-series charts).
   */
  fillOpacity: number = 0.3;

  /**
   * Width of the line stroke (backward compatibility for single-series charts).
   */
  lineWidth: number = 2;

  /**
   * Draws the area chart elements for a single series (area fill and connecting line).
   * In horizontal mode the area fill extends leftward from the line to the value-axis baseline.
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
    const fillOpacity =
      series.style?.fillOpacity && series.style.fillOpacity > 0 && series.style.fillOpacity !== this.defaultFillOpacity
        ? series.style.fillOpacity
        : _data.series.length === 1
          ? this.fillOpacity
          : this.defaultFillOpacity;
    const lineWidth =
      series.style?.lineWidth && series.style.lineWidth > 0 && series.style.lineWidth !== this.defaultLineWidth
        ? series.style.lineWidth
        : _data.series.length === 1
          ? this.lineWidth
          : this.defaultLineWidth;

    this.drawAreaFill(canvas, coordinates, baselineY, series.color, fillOpacity);
    this.drawConnectingLine(canvas, coordinates, series.color, lineWidth);
  }

  /**
   * Gets the vertical offset for value labels (simple spacing above area/line).
   */
  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  /**
   * Draws the area fill as a single closed polygon spanning from the axis baseline to the line.
   */
  private drawAreaFill(canvas: ICanvas, coordinates: Point[], baselineY: number, color: Color, opacity: number): void {
    if (coordinates.length < 2) return;

    const fillColor = color.withAlpha(opacity);
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    if (this.orientation === ChartOrientation.Horizontal) {
      canvas.fillPath(
        [
          new Point(CartesianChartBase.LEFT_PADDING, first.y),
          ...coordinates,
          new Point(CartesianChartBase.LEFT_PADDING, last.y),
        ],
        fillColor
      );
    } else {
      canvas.fillPath([new Point(first.x, baselineY), ...coordinates, new Point(last.x, baselineY)], fillColor);
    }
  }

  /**
   * Draws the connecting line on top of the area fill for a series.
   */
  private drawConnectingLine(canvas: ICanvas, coordinates: Point[], color: Color, lineWidth: number): void {
    if (coordinates.length < 2) return;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      canvas.drawLine(p1.x, p1.y, p2.x, p2.y, color, lineWidth);
    }
  }

  /**
   * Gets the default color for the series when converting from old API (DataPoints) to new API (Series).
   * Returns the chart's AreaColor property for backward compatibility.
   */
  protected override getDefaultSeriesColor(): Color {
    return this.areaColor;
  }
}
