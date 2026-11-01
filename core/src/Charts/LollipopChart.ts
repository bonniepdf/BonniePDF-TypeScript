// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';

/**
 * Lollipop chart that renders vertical lines (stems) with circular markers (heads).
 * Now supports multiple series for comparing datasets.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link LollipopChart} itself. */
export const LOLLIPOP_CHART_OWN_OPTION_KEYS = ['defaultStemWidth', 'defaultHeadRadius', 'lollipopColor'] as const;

/** The full option surface, bases included. */
export const LOLLIPOP_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...LOLLIPOP_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link LollipopChart}. */
export type LollipopChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<LollipopChart, (typeof LOLLIPOP_CHART_OWN_OPTION_KEYS)[number]>, 'lollipopColor'>> & {
    /** lollipopColor colour. Accepts a palette token or hex. */
    lollipopColor?: ColorInput;
  };

/** Renders each data value as a marker connected to its baseline by a stem. */
export class LollipopChart extends CartesianChartBase {
  private static readonly DEFAULT_COLOR_HEX = '#4f46e5';
  private static readonly DEFAULT_HEAD_RADIUS_VALUE = 8;

  /** Creates a LollipopChart, optionally configured in one expression. */
  constructor(options?: LollipopChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

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
  private _lollipopColor: Color = Color.fromHex(LollipopChart.DEFAULT_COLOR_HEX);

  /** Lollipop colour. Accepts a palette token or hex. */
  public get lollipopColor(): Color {
    return this._lollipopColor;
  }
  public set lollipopColor(value: ColorInput) {
    this._lollipopColor = toColor(value);
  }

  /**
   * Draws the lollipop chart elements for a single series (stems and heads).
   * In vertical mode stems are vertical lines; in horizontal mode they are horizontal lines.
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
    const stemWidth =
      series.style?.stemWidth && series.style.stemWidth > 0 ? series.style.stemWidth : this.defaultStemWidth;
    const headRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultHeadRadius;

    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);
    this.drawLollipopStems(canvas, coordinates, origin, this.resolveSeriesColor(series), stemWidth);
    this.drawLollipopHeads(canvas, coordinates, this.resolveSeriesColor(series), headRadius);
  }

  /**
   * Gets the offset for value labels (accounts for lollipop head radius).
   */
  protected override getLabelVerticalOffset(series: ChartSeries): number {
    const headRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultHeadRadius;
    return headRadius + 7;
  }

  /**
   * Draws lollipop stems from the value origin to each data point: vertical lines in vertical
   * mode and horizontal lines in horizontal mode.
   */
  private drawLollipopStems(
    canvas: ICanvas,
    coordinates: Point[],
    origin: number,
    color: Color,
    stemWidth: number
  ): void {
    for (const p of coordinates) {
      if (this.orientation === ChartOrientation.Horizontal) {
        canvas.drawLine(origin, p.y, p.x, p.y, color, stemWidth);
      } else {
        canvas.drawLine(p.x, origin, p.x, p.y, color, stemWidth);
      }
    }
  }

  /**
   * Draws the lollipop heads (circles at data points) for a series.
   */
  private drawLollipopHeads(canvas: ICanvas, coordinates: Point[], color: Color, radius: number): void {
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
