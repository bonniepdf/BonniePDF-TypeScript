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
    private static readonly DEFAULT_AREA_COLOR_HEX = "#4f46e5";

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
      const fillOpacity = series.style?.fillOpacity && series.style.fillOpacity > 0
        ? series.style.fillOpacity
        : this.defaultFillOpacity;
      const lineWidth = series.style?.lineWidth && series.style.lineWidth > 0
        ? series.style.lineWidth
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
     * Draws the area fill using thin rectangles spanning from the axis baseline to the line.
     * In vertical mode: thin vertical rectangles from baselineY up to the line.
     * In horizontal mode: thin horizontal rectangles from LeftPadding right to the line.
     */
    private drawAreaFill(
      canvas: ICanvas,
      coordinates: Point[],
      baselineY: number,
      color: Color,
      opacity: number
    ): void {
      if (coordinates.length < 2) return;

      const fillColor = color.withAlpha(opacity);
      const stepSize = 2;

      if (this.orientation === ChartOrientation.Horizontal) {
        const minY = coordinates[0].y;
        const maxY = coordinates[coordinates.length - 1].y;

        for (let y = minY; y < maxY; y += stepSize) {
          const x = this.interpolateX(coordinates, y);
          const rectWidth = x - CartesianChartBase.LEFT_PADDING;
          canvas.fillRect(CartesianChartBase.LEFT_PADDING, y, rectWidth, stepSize, fillColor);
        }

        const lastY = maxY - (maxY - minY) % stepSize;
        if (lastY < maxY) {
          const x = this.interpolateX(coordinates, maxY);
          canvas.fillRect(CartesianChartBase.LEFT_PADDING, lastY, x - CartesianChartBase.LEFT_PADDING, maxY - lastY, fillColor);
        }
      } else {
        const minX = coordinates[0].x;
        const maxX = coordinates[coordinates.length - 1].x;

        for (let x = minX; x < maxX; x += stepSize) {
          const y = this.interpolateY(coordinates, x);
          const rectHeight = baselineY - y;
          canvas.fillRect(x, y, stepSize, rectHeight, fillColor);
        }

        const lastX = maxX - (maxX - minX) % stepSize;
        if (lastX < maxX) {
          const y = this.interpolateY(coordinates, maxX);
          const rectHeight = baselineY - y;
          canvas.fillRect(lastX, y, maxX - lastX, rectHeight, fillColor);
        }
      }
    }

    /**
     * Interpolates the X value on the line connecting data points for a given Y position.
     * Used in horizontal mode to find how far right the line is at a given vertical position.
     */
    private interpolateX(coordinates: Point[], y: number): number {
      for (let i = 0; i < coordinates.length - 1; i++) {
        const p1 = coordinates[i];
        const p2 = coordinates[i + 1];

        if (y >= p1.y && y <= p2.y) {
          const t = (p2.y - p1.y) === 0 ? 0 : (y - p1.y) / (p2.y - p1.y);
          return p1.x + t * (p2.x - p1.x);
        }
      }

      if (y < coordinates[0].y) return coordinates[0].x;
      return coordinates[coordinates.length - 1].x;
    }

    /**
     * Interpolates the y value for a given x position on the line connecting data points.
     */
    private interpolateY(coordinates: Point[], x: number): number {
      // Find the two data points that x lies between
      for (let i = 0; i < coordinates.length - 1; i++) {
        const p1 = coordinates[i];
        const p2 = coordinates[i + 1];

        if (x >= p1.x && x <= p2.x) {
          // Linear interpolation
          const t = (x - p1.x) / (p2.x - p1.x);
          return p1.y + t * (p2.y - p1.y);
        }
      }

      // If x is outside the range, return the closest point's y
      if (x < coordinates[0].x) return coordinates[0].y;
      return coordinates[coordinates.length - 1].y;
    }

    /**
     * Draws the connecting line on top of the area fill for a series.
     */
    private drawConnectingLine(
      canvas: ICanvas,
      coordinates: Point[],
      color: Color,
      lineWidth: number
    ): void {
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
