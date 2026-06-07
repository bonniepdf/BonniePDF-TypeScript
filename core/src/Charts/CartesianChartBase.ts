import { ICanvas } from '../Drawing/ICanvas';
import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { AxisOptions } from './Models/AxisOptions';
import { ChartOrientation } from './ChartOrientation';
import { ChartBase } from './ChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { StandardFonts } from '../Typography/StandardFonts';

/**
 * Base class for Cartesian charts (charts with X and Y axes).
 * Provides common functionality for drawing axes, grid lines, labels, and legends.
 * Uses the Template Method pattern to ensure consistent drawing order across all derived charts.
 */
export abstract class CartesianChartBase extends ChartBase {
  // Layout constants (relative to chart height)
  protected static readonly TITLE_AREA_HEIGHT = 60;
  protected static readonly BOTTOM_PADDING = 70;
  protected static readonly LEFT_PADDING = 80;
  protected static readonly RIGHT_PADDING = 40;
  protected static readonly AXIS_LINE_WIDTH = 1;
  protected static readonly GRID_LINE_WIDTH = 0.5;
  protected static readonly AXIS_LABEL_FONT_SIZE = 10;
  protected static readonly LEGEND_FONT_SIZE = 11;

  // Styling constants
  protected static readonly AXIS_COLOR = Color.fromHex('#666666');
  protected static readonly GRID_LINE_COLOR = Color.fromHex('#e0e0e0');

  /**
   * Font family for labels
   */
  fontFamily: string = StandardFonts.Helvetica;

  /**
   * Whether to show value labels above each data point
   */
  showValueLabels: boolean = true;

  /**
   * Font size for value labels above data points
   */
  labelFontSize: number = 9;

  /**
   * Whether to show a legend for multiple series (default: true).
   */
  showLegend: boolean = true;

  /**
   * Controls whether the chart renders with vertical or horizontal orientation.
   * In horizontal mode, categories run along the Y-axis (left) and values along the X-axis (bottom).
   * Setting this on any chart type enables horizontal rendering without needing a separate class.
   */
  orientation: ChartOrientation = ChartOrientation.Vertical;

  /**
   * Draws the chart content using a Template Method pattern.
   * This ensures consistent drawing order across all Cartesian chart types.
   */
  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (data.series.length === 0) return;

    const layout = this.calculateLayout();

    // 1. Draw grid lines first (behind everything)
    if (data.yAxis.showGridLines) {
      this.drawGridLines(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
    }

    // 2. Draw value-axis labels (behind data)
    this.drawYAxisLabels(canvas, data, layout.chartAreaHeight, layout.baselineY, layout.topY);

    // 3. Draw value-axis legend
    if (data.yAxis.legend !== '') {
      this.drawYAxisLegend(
        canvas,
        data.yAxis,
        layout.chartAreaWidth,
        layout.chartAreaHeight,
        layout.topY,
        layout.baselineY
      );
    }

    // 4. Draw chart-specific data elements
    this.drawAllSeries(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);

    // 5. Draw value labels on top of data
    if (this.showValueLabels) {
      this.drawValueLabels(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
    }

    // 6. Draw category-axis labels
    this.drawXAxisLabels(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);

    // 7. Draw category-axis legend
    if (data.xAxis.legend !== '') {
      this.drawXAxisLegend(canvas, data.xAxis.legend, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);
    }

    // 8. Draw axis lines LAST (on top of everything to prevent overlap)
    CartesianChartBase.drawAxisLines(canvas, layout.chartAreaWidth, layout.baselineY, layout.topY);

    // 9. Draw legend for multi-series charts
    if (this.showLegend && data.series.length > 1) {
      this.drawLegend(canvas, data, layout.chartAreaWidth);
    }
  }

  /**
   * Draws all series in the chart.
   */
  protected drawAllSeries(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    for (const series of data.series) {
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);

      this.drawSeriesElements(canvas, data, series, coordinates, chartAreaWidth, chartAreaHeight, baselineY, topY);
    }
  }

  /**
   * Calculates screen-space coordinates for a series.
   */
  protected calculateSeriesCoordinates(
    series: ChartSeries,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): Point[] {
    const dataPointCount = series.dataPoints.length;
    const coordinates: Point[] = [];

    if (this.orientation === ChartOrientation.Horizontal) {
      const topY = baselineY - chartAreaHeight;
      const totalSpace = chartAreaHeight / dataPointCount;

      for (let i = 0; i < dataPointCount; i++) {
        const y = topY + i * totalSpace + totalSpace / 2;
        const normalizedValue = series.dataPoints[i].value / data.yAxis.maxValue;
        const x = CartesianChartBase.LEFT_PADDING + normalizedValue * chartAreaWidth;
        coordinates.push(new Point(x, y));
      }
    } else {
      const totalSpace = chartAreaWidth / dataPointCount;

      for (let i = 0; i < dataPointCount; i++) {
        const x = CartesianChartBase.LEFT_PADDING + i * totalSpace + totalSpace / 2;
        const normalizedValue = series.dataPoints[i].value / data.yAxis.maxValue;
        const y = baselineY - normalizedValue * chartAreaHeight;
        coordinates.push(new Point(x, y));
      }
    }

    return coordinates;
  }

  /**
   * Draws the chart-specific elements for a single series.
   */
  protected abstract drawSeriesElements(
    canvas: ICanvas,
    data: ChartData,
    series: ChartSeries,
    coordinates: Point[],
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void;

  /**
   * Draws value labels next to data points for all series.
   */
  protected drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    if (!this.showValueLabels) return;

    for (const series of data.series) {
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);

      const labelColor = series.color;
      const offset = this.getLabelVerticalOffset(series);

      for (let i = 0; i < series.dataPoints.length; i++) {
        const point = coordinates[i];
        const text = series.dataPoints[i].formattedValue;

        if (this.orientation === ChartOrientation.Horizontal) {
          canvas.drawText(
            point.x + offset,
            point.y - this.labelFontSize / 2,
            text,
            labelColor,
            this.labelFontSize,
            this.fontFamily,
            TextAlignment.Left
          );
        } else {
          canvas.drawText(
            point.x,
            point.y - offset - this.labelFontSize,
            text,
            labelColor,
            this.labelFontSize,
            this.fontFamily,
            TextAlignment.Center
          );
        }
      }
    }
  }

  /**
   * Gets the offset (in points) to apply when positioning value labels near data points.
   */
  protected getLabelVerticalOffset(series: ChartSeries): number {
    return 7;
  }

  /**
   * Draws the legend showing all series names and colors.
   */
  protected drawLegend(canvas: ICanvas, data: ChartData, chartAreaWidth: number): void {
    const legendY = this.height - 40;
    const legendStartX = CartesianChartBase.LEFT_PADDING;
    const legendItemWidth = 150;
    const colorBoxSize = 12;

    for (let i = 0; i < data.series.length; i++) {
      const series = data.series[i];
      const x = legendStartX + i * legendItemWidth;

      canvas.fillRect(x, legendY, colorBoxSize, colorBoxSize, series.color);

      canvas.drawText(
        x + colorBoxSize + 5,
        legendY + colorBoxSize / 2 - CartesianChartBase.LEGEND_FONT_SIZE / 2,
        series.name,
        CartesianChartBase.AXIS_COLOR,
        CartesianChartBase.LEGEND_FONT_SIZE,
        this.fontFamily,
        TextAlignment.Left
      );
    }
  }

  /**
   * Draws grid lines across the chart area.
   */
  protected drawGridLines(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    let stepCount = data.yAxis.stepCount;
    if (stepCount <= 0) stepCount = 5;

    if (this.orientation === ChartOrientation.Horizontal) {
      const stepWidth = chartAreaWidth / stepCount;
      for (let i = 1; i <= stepCount; i++) {
        const x = CartesianChartBase.LEFT_PADDING + i * stepWidth;
        canvas.drawLine(x, topY, x, baselineY, CartesianChartBase.GRID_LINE_COLOR, CartesianChartBase.GRID_LINE_WIDTH);
      }
    } else {
      const stepHeight = chartAreaHeight / stepCount;
      for (let i = 1; i <= stepCount; i++) {
        const y = baselineY - i * stepHeight;
        const x1 = CartesianChartBase.LEFT_PADDING;
        const x2 = CartesianChartBase.LEFT_PADDING + chartAreaWidth;
        canvas.drawLine(x1, y, x2, y, CartesianChartBase.GRID_LINE_COLOR, CartesianChartBase.GRID_LINE_WIDTH);
      }
    }
  }

  /**
   * Draws the X and Y axis lines.
   */
  protected static drawAxisLines(canvas: ICanvas, chartAreaWidth: number, baselineY: number, topY: number): void {
    // Left vertical line
    canvas.drawLine(
      CartesianChartBase.LEFT_PADDING,
      topY,
      CartesianChartBase.LEFT_PADDING,
      baselineY,
      CartesianChartBase.AXIS_COLOR,
      CartesianChartBase.AXIS_LINE_WIDTH
    );

    // Bottom horizontal line
    canvas.drawLine(
      CartesianChartBase.LEFT_PADDING,
      baselineY,
      CartesianChartBase.LEFT_PADDING + chartAreaWidth,
      baselineY,
      CartesianChartBase.AXIS_COLOR,
      CartesianChartBase.AXIS_LINE_WIDTH
    );
  }

  /**
   * Draws value-axis labels.
   */
  protected drawYAxisLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    let stepCount = data.yAxis.stepCount;
    if (stepCount <= 0) stepCount = 5;

    const minValue = data.yAxis.minValue;
    const maxValue = data.yAxis.maxValue;
    const range = maxValue - minValue;
    const stepValue = range / stepCount;

    if (this.orientation === ChartOrientation.Horizontal) {
      const chartAreaWidth = this.width - CartesianChartBase.LEFT_PADDING - CartesianChartBase.RIGHT_PADDING;
      const stepWidth = chartAreaWidth / stepCount;

      for (let i = 0; i <= stepCount; i++) {
        const x = CartesianChartBase.LEFT_PADDING + i * stepWidth;
        const value = minValue + i * stepValue;
        const label = `${data.yAxis.prefix}${Math.round(value)}${data.yAxis.suffix}`;
        canvas.drawText(
          x,
          baselineY + 8,
          label,
          CartesianChartBase.AXIS_COLOR,
          CartesianChartBase.AXIS_LABEL_FONT_SIZE,
          this.fontFamily,
          TextAlignment.Center
        );
      }
    } else {
      const stepHeight = chartAreaHeight / stepCount;

      for (let i = 0; i <= stepCount; i++) {
        const y = baselineY - i * stepHeight;
        const value = minValue + i * stepValue;
        const label = `${data.yAxis.prefix}${Math.round(value)}${data.yAxis.suffix}`;
        canvas.drawText(
          CartesianChartBase.LEFT_PADDING - 8,
          y - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2,
          label,
          CartesianChartBase.AXIS_COLOR,
          CartesianChartBase.AXIS_LABEL_FONT_SIZE,
          this.fontFamily,
          TextAlignment.Right
        );
      }
    }
  }

  /**
   * Draws the value-axis legend.
   */
  protected drawYAxisLegend(
    canvas: ICanvas,
    yAxis: AxisOptions,
    chartAreaWidth: number,
    chartAreaHeight: number,
    topY: number,
    baselineY: number
  ): void {
    if (this.orientation === ChartOrientation.Horizontal) {
      const x = CartesianChartBase.LEFT_PADDING + chartAreaWidth / 2;
      const y = this.height - 15;
      canvas.drawText(
        x,
        y,
        yAxis.legend,
        CartesianChartBase.AXIS_COLOR,
        CartesianChartBase.LEGEND_FONT_SIZE,
        this.fontFamily,
        TextAlignment.Center
      );
    } else if (yAxis.verticalLegend) {
      const x = 15;
      const textWidth = canvas.measureText(yAxis.legend, CartesianChartBase.LEGEND_FONT_SIZE, this.fontFamily).width;
      const y = topY + chartAreaHeight / 2 + textWidth / 2 - CartesianChartBase.LEGEND_FONT_SIZE;
      canvas.drawTextRotated(
        x,
        y,
        yAxis.legend,
        CartesianChartBase.AXIS_COLOR,
        CartesianChartBase.LEGEND_FONT_SIZE,
        this.fontFamily,
        90
      );
    } else {
      const x = 10;
      const y = topY + chartAreaHeight / 2;
      canvas.drawText(
        x,
        y,
        yAxis.legend,
        CartesianChartBase.AXIS_COLOR,
        CartesianChartBase.LEGEND_FONT_SIZE,
        this.fontFamily,
        TextAlignment.Left
      );
    }
  }

  /**
   * Draws the category-axis legend.
   */
  protected drawXAxisLegend(
    canvas: ICanvas,
    legend: string,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): void {
    if (this.orientation === ChartOrientation.Horizontal) {
      const x = 15;
      const textWidth = canvas.measureText(legend, CartesianChartBase.LEGEND_FONT_SIZE, this.fontFamily).width;
      const y =
        CartesianChartBase.TITLE_AREA_HEIGHT +
        chartAreaHeight / 2 +
        textWidth / 2 -
        CartesianChartBase.LEGEND_FONT_SIZE;
      canvas.drawTextRotated(
        x,
        y,
        legend,
        CartesianChartBase.AXIS_COLOR,
        CartesianChartBase.LEGEND_FONT_SIZE,
        this.fontFamily,
        90
      );
    } else {
      const x = CartesianChartBase.LEFT_PADDING + chartAreaWidth / 2;
      const y = baselineY + 50;
      canvas.drawText(
        x,
        y,
        legend,
        CartesianChartBase.AXIS_COLOR,
        CartesianChartBase.LEGEND_FONT_SIZE,
        this.fontFamily,
        TextAlignment.Center
      );
    }
  }

  /**
   * Draws category-axis labels (data point labels).
   */
  protected drawXAxisLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): void {
    if (data.series.length === 0) return;

    const firstSeries = data.series[0];
    const dataPointCount = firstSeries.dataPoints.length;

    if (this.orientation === ChartOrientation.Horizontal) {
      const topY = baselineY - chartAreaHeight;
      const totalSpace = chartAreaHeight / dataPointCount;

      for (let i = 0; i < dataPointCount; i++) {
        const y = topY + i * totalSpace + totalSpace / 2;
        const label = firstSeries.dataPoints[i].label;
        canvas.drawText(
          CartesianChartBase.LEFT_PADDING - 8,
          y - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2,
          label,
          CartesianChartBase.AXIS_COLOR,
          CartesianChartBase.AXIS_LABEL_FONT_SIZE,
          this.fontFamily,
          TextAlignment.Right
        );
      }
    } else {
      const labelY = baselineY + 15;
      const totalSpace = chartAreaWidth / dataPointCount;

      for (let i = 0; i < dataPointCount; i++) {
        const x = CartesianChartBase.LEFT_PADDING + i * totalSpace + totalSpace / 2;
        const label = firstSeries.dataPoints[i].label;
        canvas.drawText(
          x,
          labelY,
          label,
          CartesianChartBase.AXIS_COLOR,
          CartesianChartBase.AXIS_LABEL_FONT_SIZE,
          this.fontFamily,
          TextAlignment.Center
        );
      }
    }
  }

  /**
   * Gets the default color for the first series.
   */
  protected getDefaultSeriesColor(): Color {
    return Color.fromHex('#4f46e5');
  }

  /**
   * Calculates the chart layout dimensions.
   */
  protected calculateLayout(): {
    chartAreaWidth: number;
    chartAreaHeight: number;
    baselineY: number;
    topY: number;
  } {
    const chartAreaWidth = this.width - CartesianChartBase.LEFT_PADDING - CartesianChartBase.RIGHT_PADDING;
    const chartAreaHeight = this.height - CartesianChartBase.TITLE_AREA_HEIGHT - CartesianChartBase.BOTTOM_PADDING;
    const baselineY = CartesianChartBase.TITLE_AREA_HEIGHT + chartAreaHeight;
    const topY = CartesianChartBase.TITLE_AREA_HEIGHT;

    return { chartAreaWidth, chartAreaHeight, baselineY, topY };
  }
}
