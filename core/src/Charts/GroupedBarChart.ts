import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions } from '../Core/applyOptions';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';
import { TextAlignment } from '../Elements/Text/TextAlignment';

/**
 * Grouped bar chart that renders multiple bars per category.
 * Extends CartesianChartBase and uses standard ChartData model with ChartSeries.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link GroupedBarChart} itself. */
export const GROUPED_BAR_CHART_OWN_OPTION_KEYS = ['barWidthRatio', 'groupGapRatio'] as const;

/** The full option surface, bases included. */
export const GROUPED_BAR_CHART_OPTION_KEYS = [
  ...CARTESIAN_CHART_OPTION_KEYS,
  ...GROUPED_BAR_CHART_OWN_OPTION_KEYS,
] as const;

/** Options for {@link GroupedBarChart}. */
export type GroupedBarChartOptions = CartesianChartOptions &
  Partial<Pick<GroupedBarChart, (typeof GROUPED_BAR_CHART_OWN_OPTION_KEYS)[number]>>;

/** Renders multiple data series as groups of adjacent bars. */
export class GroupedBarChart extends CartesianChartBase {
  /** Bars and gridlines are axis-aligned, so crisp edges render sharper than antialiased. */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  /**
   * Width of bars as percentage of available space (0.0 to 1.0, default: 0.6).
   */
  /** Creates a GroupedBarChart, optionally configured in one expression. */
  constructor(options?: GroupedBarChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

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
      const topAreaY = baselineY - chartAreaHeight;

      for (let i = 0; i < coordinates.length; i++) {
        const p = coordinates[i];
        const barWidth = p.x - CartesianChartBase.LEFT_PADDING;
        const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, topAreaY, chartAreaHeight);

        canvas.fillRect(CartesianChartBase.LEFT_PADDING, slot.start, barWidth, slot.thickness, series.color);
      }
    } else {
      for (let i = 0; i < coordinates.length; i++) {
        const p = coordinates[i];
        const barHeight = baselineY - p.y;
        const slot = this.barSlot(
          i,
          seriesIndex,
          seriesCount,
          categoryCount,
          CartesianChartBase.LEFT_PADDING,
          chartAreaWidth
        );

        canvas.fillRect(slot.start, p.y, slot.thickness, barHeight, series.color);
      }
    }
  }

  /**
   * Where one bar sits along the category axis: its leading edge and its thickness.
   * The axis runs from `axisStart` for `axisLength` (left to right in vertical mode, top to
   * bottom in horizontal mode). Bars and their value labels both take their position from
   * here, so a label always follows its bar.
   */
  private barSlot(
    categoryIndex: number,
    seriesIndex: number,
    seriesCount: number,
    categoryCount: number,
    axisStart: number,
    axisLength: number
  ): { start: number; thickness: number } {
    const totalGroupSpace = axisLength / categoryCount;
    const groupPadding = totalGroupSpace * this.groupGapRatio;
    const barGroupSize = totalGroupSpace - groupPadding;
    const thickness = (barGroupSize / seriesCount) * this.barWidthRatio;

    const groupStart = axisStart + categoryIndex * totalGroupSpace + groupPadding / 2;
    const start =
      groupStart + seriesIndex * (barGroupSize / seriesCount) + (barGroupSize / seriesCount - thickness) / 2;

    return { start, thickness };
  }

  /**
   * Draws each value label against its own bar: centred above it in vertical mode, and to the
   * right of it, centred on its thickness, in horizontal mode. The base implementation places
   * labels at the middle of the category, which is right for one mark per category but would
   * print the labels of every series in a group on top of each other.
   */
  protected override drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    if (!this.showValueLabels) return;

    const seriesCount = data.series.length;
    const topAreaY = baselineY - chartAreaHeight;

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const series = data.series[seriesIndex];
      const categoryCount = series.dataPoints.length;
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);
      const offset = this.getLabelVerticalOffset(series);

      for (let i = 0; i < categoryCount; i++) {
        const point = coordinates[i];
        const text = series.dataPoints[i].formattedValue;

        if (this.orientation === ChartOrientation.Horizontal) {
          const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, topAreaY, chartAreaHeight);
          canvas.drawText(
            point.x + offset,
            slot.start + slot.thickness / 2 - this.labelFontSize / 2,
            text,
            series.color,
            this.labelFontSize,
            this.fontFamily,
            TextAlignment.Left
          );
        } else {
          const slot = this.barSlot(
            i,
            seriesIndex,
            seriesCount,
            categoryCount,
            CartesianChartBase.LEFT_PADDING,
            chartAreaWidth
          );
          canvas.drawText(
            slot.start + slot.thickness / 2,
            point.y - offset - this.labelFontSize,
            text,
            series.color,
            this.labelFontSize,
            this.fontFamily,
            TextAlignment.Center
          );
        }
      }
    }
  }

  /**
   * Gets the offset for value labels (simple spacing above/beside bars).
   */
  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }
}
