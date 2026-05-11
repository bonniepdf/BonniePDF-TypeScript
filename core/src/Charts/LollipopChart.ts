import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';



  /**
   * Lollipop chart that renders vertical lines (stems) with circular markers (heads).
   * Now supports multiple series for comparing datasets.
   * Uses the ICanvas interface for rendering, making it backend-agnostic.
   */
  export class LollipopChart extends CartesianChartBase {
    private static readonly DEFAULT_COLOR_HEX = "#4f46e5";
    private static readonly DEFAULT_HEAD_RADIUS_VALUE = 8;

    /**
     * Default stem width for all series (can be overridden per series via Style).
     */
    defaultStemWidth: number = 2;

    /**
     * Default head radius for all series (can be overridden per series via Style).
     */
    defaultHeadRadius: number = LollipopChart.DEFAULT_HEAD_RADIUS_VALUE;

    /**
     * Color for the lollipop stems and heads (backward compatibility).
     */
    lollipopColor: Color = Color.fromHex(LollipopChart.DEFAULT_COLOR_HEX);

    /**
     * Width of the stem line (backward compatibility).
     */
    stemWidth: number = 2;

    /**
     * Radius of the lollipop head (circle) (backward compatibility).
     */
    headRadius: number = LollipopChart.DEFAULT_HEAD_RADIUS_VALUE;

    /**
     * Draws the lollipop chart elements for a single series (stems and heads).
     * In vertical mode stems are vertical lines; in horizontal mode they are horizontal lines.
     */
    protected override drawSeriesElements(
      canvas: ICanvas,
      _data: ChartData,
      series: ChartSeries,
      coordinates: Point[],
      _chartAreaWidth: number,
      _chartAreaHeight: number,
      baselineY: number,
      _topY: number
    ): void {
      const stemWidth = series.style?.stemWidth && series.style.stemWidth > 0
        ? series.style.stemWidth
        : this.defaultStemWidth;
      const headRadius = series.style?.markerRadius && series.style.markerRadius > 0
        ? series.style.markerRadius
        : this.defaultHeadRadius;

      this.drawLollipopStems(canvas, coordinates, baselineY, series.color, stemWidth);
      this.drawLollipopHeads(canvas, coordinates, series.color, headRadius);
    }

    /**
     * Gets the offset for value labels (accounts for lollipop head radius).
     */
    protected override getLabelVerticalOffset(series: ChartSeries): number {
      const headRadius = series.style?.markerRadius && series.style.markerRadius > 0
        ? series.style.markerRadius
        : this.defaultHeadRadius;
      return headRadius + 7;
    }

    /**
     * Draws lollipop stems from the axis baseline to each data point.
     * In vertical mode: vertical lines from baselineY up to p.Y.
     * In horizontal mode: horizontal lines from LeftPadding right to p.X.
     */
    private drawLollipopStems(
      canvas: ICanvas,
      coordinates: Point[],
      baselineY: number,
      color: Color,
      stemWidth: number
    ): void {
      for (const p of coordinates) {
        if (this.orientation === ChartOrientation.Horizontal) {
          canvas.drawLine(CartesianChartBase.LEFT_PADDING, p.y, p.x, p.y, color, stemWidth);
        } else {
          canvas.drawLine(p.x, baselineY, p.x, p.y, color, stemWidth);
        }
      }
    }

    /**
     * Draws the lollipop heads (circles at data points) for a series.
     */
    private drawLollipopHeads(
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
     * Returns the chart's LollipopColor property for backward compatibility.
     */
    protected override getDefaultSeriesColor(): Color {
      return this.lollipopColor;
    }
  }
