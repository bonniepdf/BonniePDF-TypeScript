// Generated chart source. Do not edit here; the source manifest records its provenance.
import { drawPlacedLabel, type ChartLabelBox } from './Graphics/ChartLabels';
import { formatChartNumber } from './ChartNumberFormat';
import { type ICanvas, Color, toColor, type ColorInput, Point, TextAlignment, StandardFonts, toLength, type LengthInput } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions } from './ChartBase';
import { ChartData } from './Models/ChartData';
import { ChartSeries } from './Models/ChartSeries';
import { AxisOptions, type AxisOptionsOptions } from './Models/AxisOptions';
import { ChartOrientation } from './ChartOrientation';
import { ChartBase } from './ChartBase';
import { CHART_THEMES, themedSeriesColor } from './ChartTheme';
import { checkValueRange, isBelowOrigin, originFraction, valueFraction } from './Graphics/ChartValueScale';

/**
 * Base class for Cartesian charts (charts with X and Y axes).
 * Provides common functionality for drawing axes, grid lines, labels, and legends.
 * Uses the Template Method pattern to ensure consistent drawing order across all derived charts.
 */
/** Settable properties declared by {@link CartesianChartBase} itself. */
export const CARTESIAN_CHART_OWN_OPTION_KEYS = [
  'xAxis',
  'yAxis',
  'fontFamily',
  'showValueLabels',
  'labelFontSize',
  'showLegend',
  'orientation',
  'references',
] as const;

/** The full option surface of a cartesian chart, base included. */
export const CARTESIAN_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...CARTESIAN_CHART_OWN_OPTION_KEYS] as const;

/** Options common to cartesian charts. Intersects {@link ChartBaseOptions}. */
export type CartesianChartOptions = ChartBaseOptions &
  Partial<
    Omit<
      Pick<CartesianChartBase, (typeof CARTESIAN_CHART_OWN_OPTION_KEYS)[number]>,
      'xAxis' | 'yAxis' | 'labelFontSize'
    >
  > & {
    /** Axis label font size. Accepts a length: `9`, `'9pt'`, or `{ value, unit }`. */
    labelFontSize?: LengthInput;
    /** Category axis presentation; accepts an AxisOptions instance or literal. */
    xAxis?: AxisOptions | AxisOptionsOptions;
    /** Value axis presentation; accepts an AxisOptions instance or literal. */
    yAxis?: AxisOptions | AxisOptionsOptions;
  };

/** A value-axis line, or a band when endValue is supplied. */
export interface ChartReference {
  /** The line value or the first band endpoint. */
  value: number;
  /** Fill or stroke colour. */
  color: ColorInput;
  /** The second band endpoint. Omit it for a line. */
  endValue?: number;
  /** The line thickness in points. Defaults to one. */
  thickness?: number;
  /** Optional alternating dash and gap lengths in points. */
  dashPattern?: readonly number[];
}

/** Provides shared axis, scale, grid, and label behavior for Cartesian charts. */
export abstract class CartesianChartBase extends ChartBase {
  private _labelBoxes: ChartLabelBox[] = [];
  private _renderData?: ChartData;
  protected drawPlacedLabel(
    canvas: ICanvas,
    x: number,
    y: number,
    text: string,
    color: Color,
    size: number,
    family: string,
    align: TextAlignment
  ): void {
    if (this.appearance.measuredLabels)
      drawPlacedLabel(canvas, this._labelBoxes, this.width, this.height, x, y, text, color, size, family, align);
    else canvas.drawText(x, y, text, color, size, family, align);
  }

  private get axisColor(): Color {
    return this.appearance.axisColor;
  }
  private get gridLineColor(): Color {
    return this.appearance.gridLineColor;
  }

  // Layout constants (relative to chart height)
  protected static readonly TITLE_AREA_HEIGHT = 60;
  protected static readonly BOTTOM_PADDING = 70;
  /**
   * Top band reserved when {@link ChartData.title} is empty. Just enough
   * headroom for value labels sitting above the tallest data point, so a
   * titleless chart's plot area stretches up instead of leaving the title
   * gap empty.
   */
  protected static readonly TOP_PADDING = 20;
  /**
   * Bottom band reserved when no legend is drawn there. Holds only the
   * category/value tick labels ({@link drawXAxisLabels} at `baselineY + 15`,
   * font {@link AXIS_LABEL_FONT_SIZE}), so a legend-free chart's plot area
   * stretches down instead of reserving the full {@link BOTTOM_PADDING} band.
   */
  protected static readonly AXIS_LABEL_BAND = 30;
  protected static readonly LEFT_PADDING = 80;
  protected static readonly RIGHT_PADDING = 40;
  protected static readonly AXIS_LINE_WIDTH = 1;
  protected static readonly GRID_LINE_WIDTH = 0.5;
  protected static readonly AXIS_LABEL_FONT_SIZE = 10;
  protected static readonly LEGEND_FONT_SIZE = 11;

  // Legacy styling constants; the active theme supplies the colours actually drawn.
  protected static readonly AXIS_COLOR = CHART_THEMES.legacy.axisColor;
  protected static readonly GRID_LINE_COLOR = CHART_THEMES.legacy.gridLineColor;

  /** Category-axis presentation owned by this chart. */
  public get xAxis(): AxisOptions {
    return this.data.xAxis;
  }
  public set xAxis(value: AxisOptions | AxisOptionsOptions) {
    this.data.xAxis = value instanceof AxisOptions ? value : new AxisOptions(value);
  }

  /** Value-axis presentation owned by this chart. */
  public get yAxis(): AxisOptions {
    return this.data.yAxis;
  }
  public set yAxis(value: AxisOptions | AxisOptionsOptions) {
    this.data.yAxis = value instanceof AxisOptions ? value : new AxisOptions(value);
  }

  /**
   * Font family for labels
   */
  fontFamily: string = StandardFonts.Helvetica;

  /**
   * Whether to show value labels above each data point
   */
  showValueLabels: boolean = true;

  private _labelFontSize: number = 9;

  /**
   * Font size for value labels above data points
   *
   * Accepts a length: a number of points, `'9pt'`, or `{ value, unit }`.
   */
  public get labelFontSize(): number {
    return this._labelFontSize;
  }
  public set labelFontSize(value: LengthInput) {
    this._labelFontSize = toLength(value);
  }

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

  /** Reference lines and bands on the value axis. */
  references: readonly ChartReference[] = [];

  protected drawCompact(_canvas: ICanvas, _data: ChartData): boolean {
    return false;
  }

  /**
   * Draws the chart content using a Template Method pattern.
   * This ensures consistent drawing order across all Cartesian chart types.
   */
  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const previousData=this._renderData;
    try {
    this._labelBoxes = [];
    this._renderData = data;
    if (data.series.length === 0) return;
    checkValueRange(data.yAxis.minValue, data.yAxis.maxValue);

    if (this.drawCompact(canvas, data)) return;
    const layout = this.calculateLayout(data);
    this.drawReferences(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, true);

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

    this.drawReferences(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, false);

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
    if (this.appearance.axisFrame)
      CartesianChartBase.drawAxisLines(canvas, layout.chartAreaWidth, layout.baselineY, layout.topY);
    else {
      const baseline =
        this.orientation === ChartOrientation.Horizontal
          ? layout.baselineY
          : this.valueOrigin(data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);
      canvas.drawLine(
        CartesianChartBase.LEFT_PADDING,
        baseline,
        CartesianChartBase.LEFT_PADDING + layout.chartAreaWidth,
        baseline,
        this.axisColor,
        this.appearance.axisLineWidth
      );
    }

    // 9. Draw legend for multi-series charts
    if (this.showLegend && data.series.length > 1) {
      this.drawLegend(canvas, data, layout.chartAreaWidth);
    }

    } finally {this._renderData=previousData;this._labelBoxes=[];}
  }

  private drawReferences(
    canvas: ICanvas, data: ChartData, width: number, height: number, baseline: number, bands: boolean
  ): void {
    const { minValue, maxValue } = data.yAxis;
    const left = CartesianChartBase.LEFT_PADDING;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    for (const { value, endValue, thickness = 1, color, dashPattern } of this.references) {
      if ((endValue !== undefined) !== bands) continue;
      const a = valueFraction(value, minValue, maxValue);
      const paint = toColor(color);
      if (endValue !== undefined) {
        const b = valueFraction(endValue, minValue, maxValue);
        const low = Math.max(0, Math.min(a, b));
        const high = Math.min(1, Math.max(a, b));
        if (!(high > low)) continue;
        if (horizontal) canvas.fillRect(left + low * width, baseline - height, (high - low) * width, height, paint);
        else canvas.fillRect(left, baseline - high * height, width, (high - low) * height, paint);
      } else if (a >= 0 && a <= 1 && Number.isFinite(thickness) && thickness > 0) {
        const x = horizontal ? left + a * width : left;
        const y = baseline - (horizontal ? height : a * height);
        this.drawReferenceLine(canvas, x, y, horizontal ? height : width, horizontal, paint, thickness, dashPattern);
      }
    }
  }

  private drawReferenceLine(
    canvas: ICanvas, x: number, y: number, length: number, vertical: boolean, color: Color,
    thickness: number, pattern?: readonly number[]
  ): void {
    const draw = (from: number, to: number): void => {
      if (vertical) canvas.drawLine(x, y + from, x, y + to, color, thickness);
      else canvas.drawLine(x + from, y, x + to, y, color, thickness);
    };
    if (!pattern?.length) {
      draw(0, length);
      return;
    }

    const minimum = Math.min(...pattern);
    if (pattern.some(dash => !Number.isFinite(dash)) || minimum <= 0 || length / minimum > 100_000)
      throw new RangeError('Reference dash lengths must be finite and positive and allow at most 100,000 segments.');
    let from = 0;
    for (let i = 0; from < length; i++) {
      const to = Math.min(length, from + pattern[i % pattern.length]);
      if (i % 2 === 0) draw(from, to);
      from = to;
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
        const normalizedValue = valueFraction(series.dataPoints[i].value, data.yAxis.minValue, data.yAxis.maxValue);
        const x = CartesianChartBase.LEFT_PADDING + normalizedValue * chartAreaWidth;
        coordinates.push(new Point(x, y));
      }
    } else {
      const totalSpace = chartAreaWidth / dataPointCount;

      for (let i = 0; i < dataPointCount; i++) {
        const x = CartesianChartBase.LEFT_PADDING + i * totalSpace + totalSpace / 2;
        const normalizedValue = valueFraction(series.dataPoints[i].value, data.yAxis.minValue, data.yAxis.maxValue);
        const y = baselineY - normalizedValue * chartAreaHeight;
        coordinates.push(new Point(x, y));
      }
    }

    return coordinates;
  }

  /**
   * Where bars, area fills and stems start: value zero limited to the axis range. A y coordinate in
   * vertical mode and an x coordinate in horizontal mode.
   * @internal
   */
  protected valueOrigin(data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): number {
    const fraction = originFraction(data.yAxis.minValue, data.yAxis.maxValue);
    return this.orientation === ChartOrientation.Horizontal
      ? CartesianChartBase.LEFT_PADDING + fraction * chartAreaWidth
      : baselineY - fraction * chartAreaHeight;
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
   * Draws value labels beyond each point, away from the value origin: above or right of a value at
   * or above it, below or left of a value below it.
   */
  protected drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    if (!this.showValueLabels) return;

    for (const series of data.series) {
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);

      const labelColor = this.resolveSeriesColor(series);
      const offset = this.getLabelVerticalOffset(series);

      for (let i = 0; i < series.dataPoints.length; i++) {
        const point = coordinates[i];
        const text = series.dataPoints[i].formattedValue;
        const below = isBelowOrigin(series.dataPoints[i].value, data.yAxis.minValue, data.yAxis.maxValue);

        if (this.orientation === ChartOrientation.Horizontal) {
          this.drawPlacedLabel(
            canvas,
            below ? point.x - offset : point.x + offset,
            point.y - this.labelFontSize / 2,
            text,
            labelColor,
            this.labelFontSize,
            this.fontFamily,
            below ? TextAlignment.Right : TextAlignment.Left
          );
        } else {
          this.drawPlacedLabel(
            canvas,
            point.x,
            below ? point.y + offset : point.y - offset - this.labelFontSize,
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
  protected getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  /**
   * Draws the legend showing all series names and colors.
   */
  protected drawLegendSwatch(canvas: ICanvas, x: number, y: number, size: number, series: ChartSeries): void {
    canvas.fillRect(x, y, size, size, this.resolveSeriesColor(series));
  }
  protected drawLegend(canvas: ICanvas, data: ChartData, _chartAreaWidth: number): void {
    if (this.appearance.flowLegend) {
      let x = CartesianChartBase.LEFT_PADDING,
        y = this.height - 42;
      for (const series of data.series) {
        const w = canvas.measureText(series.name, 11, this.fontFamily).width + 32;
        if (x + w > this.width - 16 && x > CartesianChartBase.LEFT_PADDING) {
          x = CartesianChartBase.LEFT_PADDING;
          y += 18;
        }
        if (y + 12 > this.height - 4) break;
        this.drawLegendSwatch(canvas, x, y, 12, series);
        canvas.drawText(x + 18, y, series.name, this.axisColor, 11, this.fontFamily, TextAlignment.Left);
        x += w;
      }
      return;
    }
    const legendY = this.height - 40;
    const legendStartX = CartesianChartBase.LEFT_PADDING;
    const legendItemWidth = 150;
    const colorBoxSize = 12;

    for (let i = 0; i < data.series.length; i++) {
      const series = data.series[i];
      const x = legendStartX + i * legendItemWidth;

      this.drawLegendSwatch(canvas, x, legendY, colorBoxSize, series);

      canvas.drawText(
        x + colorBoxSize + 5,
        legendY + colorBoxSize / 2 - CartesianChartBase.LEGEND_FONT_SIZE / 2,
        series.name,
        this.axisColor,
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
        canvas.drawLine(x, topY, x, baselineY, this.gridLineColor, CartesianChartBase.GRID_LINE_WIDTH);
      }
    } else {
      const stepHeight = chartAreaHeight / stepCount;
      for (let i = 1; i <= stepCount; i++) {
        const y = baselineY - i * stepHeight;
        const x1 = CartesianChartBase.LEFT_PADDING;
        const x2 = CartesianChartBase.LEFT_PADDING + chartAreaWidth;
        canvas.drawLine(x1, y, x2, y, this.gridLineColor, CartesianChartBase.GRID_LINE_WIDTH);
      }
    }
  }

  /**
   * Draws the X and Y axis lines.
   */
  protected static drawAxisLines(canvas: ICanvas, chartAreaWidth: number, baselineY: number, topY: number): void {
    // The X and Y axis lines are axis-aligned, so render them with crisp edges
    // on every chart type (a sharp, fully-opaque hairline rather than a blurred
    // antialiased one) while leaving any diagonal/curved series geometry smooth.
    canvas.beginCrispEdges?.();

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

    canvas.endCrispEdges?.();
  }

  /**
   * Draws value-axis labels.
   */
  protected drawYAxisLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
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
        const label = `${data.yAxis.prefix}${formatChartNumber(value, 'N0')}${data.yAxis.suffix}`;
        canvas.drawText(
          x,
          baselineY + 8,
          label,
          this.axisColor,
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
        const label = `${data.yAxis.prefix}${formatChartNumber(value, 'N0')}${data.yAxis.suffix}`;
        canvas.drawText(
          CartesianChartBase.LEFT_PADDING - 8,
          y - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2,
          label,
          this.axisColor,
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
    _baselineY: number
  ): void {
    if (this.orientation === ChartOrientation.Horizontal) {
      const x = CartesianChartBase.LEFT_PADDING + chartAreaWidth / 2;
      const y = this.height - 15;
      canvas.drawText(
        x,
        y,
        yAxis.legend,
        this.axisColor,
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
        this.axisColor,
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
        this.axisColor,
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
      canvas.drawTextRotated(x, y, legend, this.axisColor, CartesianChartBase.LEGEND_FONT_SIZE, this.fontFamily, 90);
    } else {
      const x = CartesianChartBase.LEFT_PADDING + chartAreaWidth / 2;
      // Center the legend in the space below the x-axis tick labels (within the
      // bottom-padding band), then shift up by half the font size to account for
      // drawText's `y` representing the top of the text box rather than its visual center.
      const labelsBottom = baselineY + 15 + CartesianChartBase.AXIS_LABEL_FONT_SIZE;
      const marginBottom = baselineY + CartesianChartBase.BOTTOM_PADDING;
      const y = (labelsBottom + marginBottom) / 2 - CartesianChartBase.LEGEND_FONT_SIZE / 2;
      canvas.drawText(
        x,
        y,
        legend,
        this.axisColor,
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
        this.drawPlacedLabel(
          canvas,
          CartesianChartBase.LEFT_PADDING - 8,
          y - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2,
          label,
          this.axisColor,
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
        this.drawPlacedLabel(
          canvas,
          x,
          labelY,
          label,
          this.axisColor,
          CartesianChartBase.AXIS_LABEL_FONT_SIZE,
          this.fontFamily,
          TextAlignment.Center
        );
      }
    }
  }

  /**
   * Draws the connecting line between consecutive data points for a series.
   * @internal
   */
  protected drawConnectingLine(canvas: ICanvas, coordinates: Point[], color: Color, lineWidth: number): void {
    if (coordinates.length < 2) return;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      canvas.drawLine(p1.x, p1.y, p2.x, p2.y, color, lineWidth);
    }
  }

  /**
   * Gets the default color for a series the author gave no colour.
   */
  protected getDefaultSeriesColor(): Color {
    return Color.fromHex('#4f46e5');
  }

  /**
   * The colour a series is drawn in: its own when the author set one, otherwise the chart's own colour
   * (`barColor`, `lineColor`, `areaColor`, `dotColor`, `lollipopColor`).
   */
  protected resolveSeriesColor(series: ChartSeries): Color {
    if (series.hasColor) return series.color;
    const color = this.getDefaultSeriesColor();
    return themedSeriesColor(this.appearance, color, (this._renderData ?? this.data).series.indexOf(series));
  }

  /**
   * Reports whether a legend occupies the bottom band for this chart+data, which
   * requires reserving the full {@link BOTTOM_PADDING}. Mirrors where each legend
   * is actually drawn: the multi-series legend sits at `height - 40`; in
   * horizontal mode the value-axis legend runs along the bottom; in vertical mode
   * the category-axis legend sits below the tick labels. (A vertical-mode
   * value-axis legend is drawn on the left, so it does not reserve bottom space.)
   */
  protected reservesBottomLegendBand(data: ChartData): boolean {
    if (this.showLegend && data.series.length > 1) return true;
    if (this.orientation === ChartOrientation.Horizontal) return data.yAxis.legend !== '';
    return data.xAxis.legend !== '';
  }

  /**
   * Calculates the chart layout dimensions.
   *
   * The top and bottom bands are content-aware so a chart's plot area fills the
   * available box instead of reserving space for absent decorations. The title
   * band collapses to {@link TOP_PADDING} when there is no title, and the bottom
   * band collapses to {@link AXIS_LABEL_BAND} when no legend is drawn there.
   * `baselineY` (and therefore the axis, tick labels, and legends) depends only
   * on the bottom band, so collapsing the title band shifts nothing below it — it
   * only lets the bars/series grow taller.
   */
  protected calculateLayout(data: ChartData): {
    chartAreaWidth: number;
    chartAreaHeight: number;
    baselineY: number;
    topY: number;
  } {
    const topBand = data.title !== '' ? CartesianChartBase.TITLE_AREA_HEIGHT : CartesianChartBase.TOP_PADDING;
    const bottomBand = this.reservesBottomLegendBand(data)
      ? CartesianChartBase.BOTTOM_PADDING
      : CartesianChartBase.AXIS_LABEL_BAND;

    const chartAreaWidth = this.width - CartesianChartBase.LEFT_PADDING - CartesianChartBase.RIGHT_PADDING;
    const chartAreaHeight = this.height - topBand - bottomBand;
    const baselineY = topBand + chartAreaHeight;
    const topY = topBand;

    return { chartAreaWidth, chartAreaHeight, baselineY, topY };
  }
}
