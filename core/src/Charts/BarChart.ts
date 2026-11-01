// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartBarStyle, type ChartBarStyleOptions } from './ChartBarStyle';
import { drawChartBar } from './Graphics/ChartBars';
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';

/**
 * Bar chart that renders vertical bars with value labels above each bar.
 * Now supports multiple series.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link BarChart} itself. */
export const BAR_CHART_OWN_OPTION_KEYS = ['barColor', 'barWidthRatio', 'barStyle'] as const;

/** The full option surface, bases included. */
export const BAR_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...BAR_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link BarChart}. */
export type BarChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<BarChart, (typeof BAR_CHART_OWN_OPTION_KEYS)[number]>, 'barColor' | 'barStyle'>> & {
    /** barColor colour. Accepts a palette token or hex. */
    barColor?: ColorInput;
    /** Value-end rounding and optional opaque linear gradient. */
    barStyle?: ChartBarStyle | ChartBarStyleOptions;
  };

/** Renders a data series as vertical or horizontal bars. */
export class BarChart extends CartesianChartBase {
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

  private static readonly BAR_COLOR_HEX = '#4f46e5';

  /** Bars and gridlines are axis-aligned, so crisp edges render sharper than antialiased. */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  /**
   * Color for the bars (backward compatibility).
   */
  /** Creates a BarChart, optionally configured in one expression. */
  constructor(options?: BarChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  private _barColor: Color = Color.fromHex(BarChart.BAR_COLOR_HEX);

  /** Bar colour. Accepts a palette token or hex. */
  public get barColor(): Color {
    return this._barColor;
  }
  public set barColor(value: ColorInput) {
    this._barColor = toColor(value);
  }

  /**
   * Width of bars as percentage of available space (0.0 to 1.0, default: 0.6).
   */
  barWidthRatio: number = 0.6;

  /**
   * Draws the bar chart elements for a single series.
   * In vertical mode draws upward bars; in horizontal mode draws rightward bars.
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
    const dataPointCount = series.dataPoints.length;
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);

    if (this.orientation === ChartOrientation.Horizontal) {
      const totalBarSpace = chartAreaHeight / dataPointCount;
      const barThickness = Math.min(totalBarSpace * this.barWidthRatio, 50);
      this.drawBars(
        canvas,
        coordinates,
        barThickness,
        origin,
        this.resolveSeriesColor(series),
        chartAreaWidth,
        chartAreaHeight,
        _topY
      );
    } else {
      const totalBarSpace = chartAreaWidth / dataPointCount;
      const barWidth = Math.min(totalBarSpace * this.barWidthRatio, 50);
      this.drawBars(
        canvas,
        coordinates,
        barWidth,
        origin,
        this.resolveSeriesColor(series),
        chartAreaWidth,
        chartAreaHeight,
        _topY
      );
    }
  }

  /**
   * Gets the offset for value labels (spacing above bars in vertical mode, to the right in horizontal).
   */
  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  /**
   * Draws bars for each data point.
   * Bars run from the value origin to each point, up or right for values above it.
   */
  private drawBars(
    canvas: ICanvas,
    coordinates: Point[],
    thickness: number,
    origin: number,
    color: Color,
    plotWidth: number,
    plotHeight: number,
    plotY: number
  ): void {
    for (const p of coordinates) {
      if (this.orientation === ChartOrientation.Horizontal) {
        const barWidth = p.x - origin;
        drawChartBar(
          canvas,
          origin,
          p.y - thickness / 2,
          barWidth,
          thickness,
          color,
          this.barStyle,
          this.appearance,
          true,
          CartesianChartBase.LEFT_PADDING,
          plotY,
          plotWidth,
          plotHeight
        );
      } else {
        const barHeight = origin - p.y;
        const barX = p.x - thickness / 2;
        drawChartBar(
          canvas,
          barX,
          p.y,
          thickness,
          barHeight,
          color,
          this.barStyle,
          this.appearance,
          false,
          CartesianChartBase.LEFT_PADDING,
          plotY,
          plotWidth,
          plotHeight
        );
      }
    }
  }

  /**
   * Gets the default color for the series when converting from old API (DataPoints) to new API (Series).
   * Returns the chart's BarColor property for backward compatibility.
   */
  protected override getDefaultSeriesColor(): Color {
    return this.barColor;
  }
}
