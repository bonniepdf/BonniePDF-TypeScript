// Generated chart source. Do not edit here; the source manifest records its provenance.
import { valueFraction } from './Graphics/ChartValueScale';
import { ChartOrientation } from './ChartOrientation';
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { CartesianChartBase } from './CartesianChartBase';

/**
 * Line chart that renders connected data points with straight lines.
 * Now supports multiple series for comparing datasets.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link LineChart} itself. */
export const LINE_CHART_OWN_OPTION_KEYS = [
  'defaultLineWidth',
  'sparkline',
  'defaultShowMarkers',
  'defaultMarkerRadius',
  'lineColor',
] as const;

/** The full option surface, bases included. */
export const LINE_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...LINE_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link LineChart}. */
export type LineChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<LineChart, (typeof LINE_CHART_OWN_OPTION_KEYS)[number]>, 'lineColor'>> & {
    /** lineColor colour. Accepts a palette token or hex. */
    lineColor?: ColorInput;
  };

/** Renders one or more data series as lines against Cartesian axes. */
export class LineChart extends CartesianChartBase {
  private static readonly DEFAULT_LINE_COLOR_HEX = '#4f46e5';
  private static readonly DEFAULT_DATA_POINT_RADIUS = 5;

  /** Creates a LineChart, optionally configured in one expression. */
  constructor(options?: LineChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /**
   * Default line width for all series (can be overridden per series via Style).
   */
  defaultLineWidth: number = 2;

  /** Use the chart box for a compact plot without axes, labels or legend. */
  sparkline = false;

  protected override drawCompact(canvas: ICanvas, data: ChartData): boolean {
    if (!this.sparkline) return false;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    for (const series of data.series) {
      const lineWidth = series.style?.lineWidth && series.style.lineWidth > 0 ? series.style.lineWidth : this.defaultLineWidth;
      const inset = Math.min(lineWidth / 2, this.width / 2, this.height / 2);
      const points = series.dataPoints.map(({ value }, index, all) => {
        const category = all.length > 1 ? index / (all.length - 1) : 0.5;
        const fraction = Math.max(0, Math.min(1, valueFraction(value, data.yAxis.minValue, data.yAxis.maxValue)));
        return new Point(
          inset + (horizontal ? fraction : category) * (this.width - 2 * inset),
          inset + (horizontal ? category : 1 - fraction) * (this.height - 2 * inset)
        );
      });
      this.drawConnectingLine(canvas, points, this.resolveSeriesColor(series), lineWidth);
    }
    return true;
  }

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
  private _lineColor: Color = Color.fromHex(LineChart.DEFAULT_LINE_COLOR_HEX);

  /** Line colour. Accepts a palette token or hex. */
  public get lineColor(): Color {
    return this._lineColor;
  }
  public set lineColor(value: ColorInput) {
    this._lineColor = toColor(value);
  }

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
    const lineWidth =
      series.style?.lineWidth && series.style.lineWidth > 0 ? series.style.lineWidth : this.defaultLineWidth;
    const showMarkers = series.style?.showMarkers ?? this.defaultShowMarkers;
    const markerRadius =
      series.style?.markerRadius && series.style.markerRadius > 0
        ? series.style.markerRadius
        : this.defaultMarkerRadius;

    // Draw the connecting line
    this.drawConnectingLine(canvas, coordinates, this.resolveSeriesColor(series), lineWidth);

    // Draw data point markers if enabled
    if (showMarkers) {
      this.drawDataPointMarkers(canvas, coordinates, this.resolveSeriesColor(series), markerRadius);
    }
  }

  /**
   * Gets the vertical offset for value labels (accounts for data point marker radius).
   */
  protected override getLabelVerticalOffset(series: ChartSeries): number {
    const markerRadius =
      series.style?.markerRadius && series.style.markerRadius > 0
        ? series.style.markerRadius
        : this.defaultMarkerRadius;
    return markerRadius + 7;
  }

  /**
   * Draws circular markers at each data point for a series.
   */
  private drawDataPointMarkers(canvas: ICanvas, coordinates: Point[], color: Color, radius: number): void {
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
