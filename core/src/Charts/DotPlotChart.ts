// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { CartesianChartBase } from './CartesianChartBase';

/**
 * Dot plot chart that renders circular data points with value labels.
 * Now supports multiple series for comparing datasets.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link DotPlotChart} itself. */
export const DOT_PLOT_CHART_OWN_OPTION_KEYS = ['defaultDotRadius', 'dotColor'] as const;

/** The full option surface, bases included. */
export const DOT_PLOT_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...DOT_PLOT_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link DotPlotChart}. */
export type DotPlotChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<DotPlotChart, (typeof DOT_PLOT_CHART_OWN_OPTION_KEYS)[number]>, 'dotColor'>> & {
    /** dotColor colour. Accepts a palette token or hex. */
    dotColor?: ColorInput;
  };

/** Renders each data value as a dot positioned along a Cartesian scale. */
export class DotPlotChart extends CartesianChartBase {
  private static readonly DEFAULT_COLOR_HEX = '#4f46e5';
  private static readonly DEFAULT_DOT_RADIUS_VALUE = 10;

  /** Creates a DotPlotChart, optionally configured in one expression. */
  constructor(options?: DotPlotChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /**
   * Default dot radius for all series (can be overridden per series via Style).
   */
  defaultDotRadius: number = DotPlotChart.DEFAULT_DOT_RADIUS_VALUE;

  /**
   * Color for the data point circles (backward compatibility).
   */
  private _dotColor: Color = Color.fromHex(DotPlotChart.DEFAULT_COLOR_HEX);

  /** Dot colour. Accepts a palette token or hex. */
  public get dotColor(): Color {
    return this._dotColor;
  }
  public set dotColor(value: ColorInput) {
    this._dotColor = toColor(value);
  }

  /**
   * Draws the dot plot chart elements for a single series (circular data points).
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
    const dotRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultDotRadius;

    // Draw data point circles
    this.drawDataPoints(canvas, coordinates, this.resolveSeriesColor(series), dotRadius);
  }

  /**
   * Gets the vertical offset for value labels (accounts for dot radius).
   */
  protected override getLabelVerticalOffset(series: ChartSeries): number {
    const dotRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultDotRadius;
    return dotRadius + 7;
  }

  /**
   * Draws the data point circles for a series.
   */
  private drawDataPoints(canvas: ICanvas, coordinates: Point[], color: Color, radius: number): void {
    for (const p of coordinates) {
      canvas.fillCircle(p.x, p.y, radius, color);
    }
  }

  /**
   * Gets the default color for the series when converting from old API (DataPoints) to new API (Series).
   * Returns the chart's DotColor property for backward compatibility.
   */
  protected override getDefaultSeriesColor(): Color {
    return this.dotColor;
  }
}
