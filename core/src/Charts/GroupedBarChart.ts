import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';
import { TextAlignment } from '../Elements/Text/TextAlignment';



  /**
   * Grouped bar chart that renders multiple bars per category.
   * Extends CartesianChartBase and uses standard ChartData model with ChartSeries.
   * Uses the ICanvas interface for rendering, making it backend-agnostic.
   */
  export class GroupedBarChart extends CartesianChartBase {
    /**
     * Width of bars as percentage of available space (0.0 to 1.0, default: 0.6).
     */
    barWidthRatio: number = 0.6;

    /**
     * Gap between groups as percentage of available space (0.0 to 1.0, default: 0.2).
     */
    groupGapRatio: number = 0.2;

    /**
     * Draws the grouped bar chart elements for a single series.
     * In vertical mode draws grouped vertical bars; in horizontal mode draws grouped horizontal bars.
     */
    protected override drawSeriesElements(
      canvas: ICanvas,
      data: ChartData,
      series: ChartSeries,
      coordinates: Point[],
      chartAreaWidth: number,
      chartAreaHeight: number,
      baselineY: number,
      _topY: number
    ): void {
      const seriesCount = data.series.length;
      const categoryCount = series.dataPoints.length;
      const seriesIndex = data.series.indexOf(series);

      if (this.orientation === ChartOrientation.Horizontal) {
        const totalGroupSpace = chartAreaHeight / categoryCount;
        const groupPadding = totalGroupSpace * this.groupGapRatio;
        const barGroupHeight = totalGroupSpace - groupPadding;
        const barHeight = (barGroupHeight / seriesCount) * this.barWidthRatio;
        const topAreaY = baselineY - chartAreaHeight;

        for (let i = 0; i < coordinates.length; i++) {
          const p = coordinates[i];
          const barWidth = p.x - CartesianChartBase.LEFT_PADDING;

          const groupStartY = topAreaY + i * totalGroupSpace + groupPadding / 2;
          const barY = groupStartY + seriesIndex * (barGroupHeight / seriesCount)
            + (barGroupHeight / seriesCount - barHeight) / 2;

          canvas.fillRect(CartesianChartBase.LEFT_PADDING, barY, barWidth, barHeight, series.color);
        }
      } else {
        const totalGroupSpace = chartAreaWidth / categoryCount;
        const groupPadding = totalGroupSpace * this.groupGapRatio;
        const barGroupWidth = totalGroupSpace - groupPadding;
        const barWidth = (barGroupWidth / seriesCount) * this.barWidthRatio;

        for (let i = 0; i < coordinates.length; i++) {
          const p = coordinates[i];
          const barHeight = baselineY - p.y;

          const groupStartX = CartesianChartBase.LEFT_PADDING + i * totalGroupSpace + groupPadding / 2;
          const barX = groupStartX + seriesIndex * (barGroupWidth / seriesCount)
            + (barGroupWidth / seriesCount - barWidth) / 2;

          canvas.fillRect(barX, p.y, barWidth, barHeight, series.color);
        }
      }
    }

    /**
     * Gets the offset for value labels (simple spacing above/beside bars).
     */
    protected override getLabelVerticalOffset(series: ChartSeries): number {
      return 7;
    }

    /**
     * Draws category-axis labels using the first series' labels.
     * In vertical mode: below each group. In horizontal mode: to the left of each group.
     */
    protected override drawXAxisLabels(
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
        const totalGroupSpace = chartAreaHeight / dataPointCount;

        for (let i = 0; i < dataPointCount; i++) {
          const y = topY + i * totalGroupSpace + totalGroupSpace / 2;
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
        const totalGroupSpace = chartAreaWidth / dataPointCount;

        for (let i = 0; i < dataPointCount; i++) {
          const x = CartesianChartBase.LEFT_PADDING + i * totalGroupSpace + totalGroupSpace / 2;
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
  }
