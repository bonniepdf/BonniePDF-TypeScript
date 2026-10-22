import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions } from '../Core/applyOptions';
import { toColor, type ColorInput } from '../Normalize/toColor';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';

/**
 * Bar chart that renders vertical bars with value labels above each bar.
 * Now supports multiple series.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link BarChart} itself. */
export const BAR_CHART_OWN_OPTION_KEYS = ['barColor', 'barWidthRatio'] as const;

/** The full option surface, bases included. */
export const BAR_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...BAR_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link BarChart}. */
export type BarChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<BarChart, (typeof BAR_CHART_OWN_OPTION_KEYS)[number]>, 'barColor'>> & {
    /** barColor colour. Accepts a palette token or hex. */
    barColor?: ColorInput;
  };

/** Renders a data series as vertical or horizontal bars. */
export class BarChart extends CartesianChartBase {
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
    _data: ChartData,
    series: ChartSeries,
    coordinates: Point[],
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    const dataPointCount = series.dataPoints.length;

    if (this.orientation === ChartOrientation.Horizontal) {
      const totalBarSpace = chartAreaHeight / dataPointCount;
      const barThickness = Math.min(totalBarSpace * this.barWidthRatio, 50);
      this.drawBars(canvas, coordinates, barThickness, baselineY, this.resolveSeriesColor(series));
    } else {
      const totalBarSpace = chartAreaWidth / dataPointCount;
      const barWidth = Math.min(totalBarSpace * this.barWidthRatio, 50);
      this.drawBars(canvas, coordinates, barWidth, baselineY, this.resolveSeriesColor(series));
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
   * In vertical mode bars grow upward; in horizontal mode bars grow rightward from LeftPadding.
   */
  private drawBars(canvas: ICanvas, coordinates: Point[], thickness: number, baselineY: number, color: Color): void {
    for (const p of coordinates) {
      if (this.orientation === ChartOrientation.Horizontal) {
        const barWidth = p.x - CartesianChartBase.LEFT_PADDING;
        canvas.fillRect(CartesianChartBase.LEFT_PADDING, p.y - thickness / 2, barWidth, thickness, color);
      } else {
        const barHeight = baselineY - p.y;
        const barX = p.x - thickness / 2;
        canvas.fillRect(barX, p.y, thickness, barHeight, color);
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
