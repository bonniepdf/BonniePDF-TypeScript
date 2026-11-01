// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartBarStyle, type ChartBarStyleOptions } from './ChartBarStyle';
import { drawChartBar } from './Graphics/ChartBars';
import { ChartData } from './Models/ChartData';
import { isBelowOrigin } from './Graphics/ChartValueScale';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, Point, type ICanvas, TextAlignment } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';

/**
 * Grouped bar chart that renders multiple bars per category.
 * Extends CartesianChartBase and uses standard ChartData model with ChartSeries.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link GroupedBarChart} itself. */
export const GROUPED_BAR_CHART_OWN_OPTION_KEYS = ['barWidthRatio', 'groupGapRatio', 'barStyle'] as const;

/** The full option surface, bases included. */
export const GROUPED_BAR_CHART_OPTION_KEYS = [
  ...CARTESIAN_CHART_OPTION_KEYS,
  ...GROUPED_BAR_CHART_OWN_OPTION_KEYS,
] as const;

/** Options for {@link GroupedBarChart}. */
export type GroupedBarChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<GroupedBarChart, (typeof GROUPED_BAR_CHART_OWN_OPTION_KEYS)[number]>, 'barStyle'>> & {
    /** Value-end rounding and optional opaque linear gradient. */
    barStyle?: ChartBarStyle | ChartBarStyleOptions;
  };

/** Renders multiple data series as groups of adjacent bars. */
export class GroupedBarChart extends CartesianChartBase {
  protected override drawLegendSwatch(
    canvas: ICanvas,
    x: number,
    y: number,
    size: number,
    series: ChartSeries
  ): void {
    drawChartBar(
      canvas,
      x,
      y,
      size,
      size,
      this.resolveSeriesColor(series),
      this.barStyle,
      this.appearance,
      false,
      x,
      y,
      size,
      size
    );
  }
  private _barStyle = new ChartBarStyle();
  /** Value-end rounding and optional opaque linear gradient. */
  get barStyle(): ChartBarStyle {
    return this._barStyle;
  }
  set barStyle(value: ChartBarStyle | ChartBarStyleOptions) {
    this._barStyle = value instanceof ChartBarStyle ? value : new ChartBarStyle(value);
  }
  /** @internal */
  override get usesStyledGeometry(): boolean {
    return super.usesStyledGeometry || (this.barStyle.cornerRadius ?? 0) > 0 || this.barStyle.gradient !== undefined;
  }

  /** Bars and gridlines are axis-aligned, so crisp edges render sharper than antialiased. */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  /** Creates a GroupedBarChart, optionally configured in one expression. */
  constructor(options?: GroupedBarChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

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
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);

    if (this.orientation === ChartOrientation.Horizontal) {
      const topAreaY = baselineY - chartAreaHeight;

      for (let i = 0; i < coordinates.length; i++) {
        const p = coordinates[i];
        const barWidth = p.x - origin;
        const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, topAreaY, chartAreaHeight);

        drawChartBar(
          canvas,
          origin,
          slot.start,
          barWidth,
          slot.thickness,
          this.resolveSeriesColor(series),
          this.barStyle,
          this.appearance,
          true,
          CartesianChartBase.LEFT_PADDING,
          topAreaY,
          chartAreaWidth,
          chartAreaHeight
        );
      }
    } else {
      for (let i = 0; i < coordinates.length; i++) {
        const p = coordinates[i];
        const barHeight = origin - p.y;
        const slot = this.barSlot(
          i,
          seriesIndex,
          seriesCount,
          categoryCount,
          CartesianChartBase.LEFT_PADDING,
          chartAreaWidth
        );

        drawChartBar(
          canvas,
          slot.start,
          p.y,
          slot.thickness,
          barHeight,
          this.resolveSeriesColor(series),
          this.barStyle,
          this.appearance,
          false,
          CartesianChartBase.LEFT_PADDING,
          baselineY - chartAreaHeight,
          chartAreaWidth,
          chartAreaHeight
        );
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
        const below = isBelowOrigin(series.dataPoints[i].value, data.yAxis.minValue, data.yAxis.maxValue);

        if (this.orientation === ChartOrientation.Horizontal) {
          const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, topAreaY, chartAreaHeight);
          this.drawPlacedLabel(
            canvas,
            below ? point.x - offset : point.x + offset,
            slot.start + slot.thickness / 2 - this.labelFontSize / 2,
            text,
            this.resolveSeriesColor(series),
            this.labelFontSize,
            this.fontFamily,
            below ? TextAlignment.Right : TextAlignment.Left
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
          this.drawPlacedLabel(
            canvas,
            slot.start + slot.thickness / 2,
            below ? point.y + offset : point.y - offset - this.labelFontSize,
            text,
            this.resolveSeriesColor(series),
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
