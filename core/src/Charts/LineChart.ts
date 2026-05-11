import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { CartesianChartBase } from './CartesianChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';



  /**
   * Line chart that renders connected data points with straight lines.
   * Now supports multiple series for comparing datasets.
   * Uses the ICanvas interface for rendering, making it backend-agnostic.
   */
  export class LineChart extends CartesianChartBase {
    private static readonly DEFAULT_LINE_COLOR_HEX = "#4f46e5";
    private static readonly DEFAULT_DATA_POINT_RADIUS = 5;

    /**
     * Default line width for all series (can be overridden per series via Style).
     */
    defaultLineWidth: number = 2;

    /**
     * Whether to show data point markers by default (can be overridden per series via Style).
     */
    defaultShowMarkers: boolean = true;

    /**
     * Default marker radius for all series (can be overridden per series via Style).
     */
    defaultMarkerRadius: number = LineChart.DEFAULT_DATA_POINT_RADIUS;

    /**
     * Default color for single-series charts (backward compatibility).
     */
    lineColor: Color = Color.fromHex(LineChart.DEFAULT_LINE_COLOR_HEX);

    /**
     * Width of the line stroke for single-series charts (backward compatibility).
     */
    lineWidth: number = 2;

    /**
     * Whether to show circular markers at data points for single-series charts (backward compatibility).
     */
    showDataPointMarkers: boolean = true;

    /**
     * Draws the line chart elements for a single series (connecting line and optional data point markers).
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
      const lineWidth = series.style?.lineWidth && series.style.lineWidth > 0
        ? series.style.lineWidth
        : this.defaultLineWidth;
      const showMarkers = series.style?.showMarkers ?? this.defaultShowMarkers;
      const markerRadius = series.style?.markerRadius && series.style.markerRadius > 0
        ? series.style.markerRadius
        : this.defaultMarkerRadius;

      // Draw the connecting line
      this.drawConnectingLine(canvas, coordinates, series.color, lineWidth);

      // Draw data point markers if enabled
      if (showMarkers) {
        this.drawDataPointMarkers(canvas, coordinates, series.color, markerRadius);
      }
    }

    /**
     * Gets the vertical offset for value labels (accounts for data point marker radius).
     */
    protected override getLabelVerticalOffset(series: ChartSeries): number {
      const markerRadius = series.style?.markerRadius && series.style.markerRadius > 0
        ? series.style.markerRadius
        : this.defaultMarkerRadius;
      return markerRadius + 7;
    }

    /**
     * Draws the connecting line between all data points for a series.
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
     * Draws circular markers at each data point for a series.
     */
    private drawDataPointMarkers(
      canvas: ICanvas,
      coordinates: Point[],
      color: Color,
      radius: number
    ): void {
      for (const p of coordinates) {
        canvas.fillCircle(p.x, p.y, radius, color);
      }
    }

    /**
     * Gets the default color for the series when converting from old API (DataPoints) to new API (Series).
     * Returns the chart's LineColor property for backward compatibility.
     */
    protected override getDefaultSeriesColor(): Color {
      return this.lineColor;
    }
  }
