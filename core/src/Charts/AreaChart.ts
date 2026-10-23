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
import { toLength, type LengthInput } from '../Normalize/toLength';

/**
 * Area chart that renders a filled polygon with a line overlay.
 * Now supports multiple series with transparency for overlapping areas.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 */
/** Settable properties declared by {@link AreaChart} itself. */
export const AREA_CHART_OWN_OPTION_KEYS = [
  'defaultFillOpacity',
  'defaultLineWidth',
  'areaColor',
  'fillOpacity',
  'lineWidth',
] as const;

/** The full option surface, bases included. */
export const AREA_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...AREA_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link AreaChart}. */
export type AreaChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<AreaChart, (typeof AREA_CHART_OWN_OPTION_KEYS)[number]>, 'areaColor' | 'lineWidth'>> & {
    /** Line thickness. Accepts a length: `2`, `'0.5mm'`, or `{ value, unit }`. */
    lineWidth?: LengthInput;
    /** areaColor colour. Accepts a palette token or hex. */
    areaColor?: ColorInput;
  };

/** Renders one or more data series as filled areas against Cartesian axes. */
export class AreaChart extends CartesianChartBase {
  private static readonly DEFAULT_AREA_COLOR_HEX = '#4f46e5';

  /** Creates an AreaChart, optionally configured in one expression. */
  constructor(options?: AreaChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /**
   * Default fill opacity for all series (can be overridden per series via Style).
   */
  defaultFillOpacity: number = 0.3;

  /**
   * Default line width for all series (can be overridden per series via Style).
   */
  defaultLineWidth: number = 2;

  /**
   * Color for the area fill and line (backward compatibility for single-series charts).
   */
  private _areaColor: Color = Color.fromHex(AreaChart.DEFAULT_AREA_COLOR_HEX);

  /** Area colour. Accepts a palette token or hex. */
  public get areaColor(): Color {
    return this._areaColor;
  }
  public set areaColor(value: ColorInput) {
    this._areaColor = toColor(value);
  }

  /**
   * Opacity for the area fill (backward compatibility for single-series charts).
   */
  fillOpacity: number = 0.3;

  private _lineWidth: number = 2;

  /**
   * Width of the line stroke (backward compatibility for single-series charts).
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }`.
   */
  public get lineWidth(): number {
    return this._lineWidth;
  }
  public set lineWidth(value: LengthInput) {
    this._lineWidth = toLength(value);
  }

  /**
   * Draws the area chart elements for a single series (area fill and connecting line).
   * In horizontal mode the area fill extends leftward from the line to the value-axis baseline.
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
    const fillOpacity =
      series.style?.fillOpacity && series.style.fillOpacity > 0 && series.style.fillOpacity !== this.defaultFillOpacity
        ? series.style.fillOpacity
        : _data.series.length === 1
          ? this.fillOpacity
          : this.defaultFillOpacity;
    const lineWidth =
      series.style?.lineWidth && series.style.lineWidth > 0 && series.style.lineWidth !== this.defaultLineWidth
        ? series.style.lineWidth
        : _data.series.length === 1
          ? this.lineWidth
          : this.defaultLineWidth;

    this.drawAreaFill(canvas, coordinates, baselineY, this.resolveSeriesColor(series), fillOpacity);
    this.drawConnectingLine(canvas, coordinates, this.resolveSeriesColor(series), lineWidth);
  }

  /**
   * Gets the vertical offset for value labels (simple spacing above area/line).
   */
  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  /**
   * Draws the area fill as a single closed polygon spanning from the axis baseline to the line.
   */
  private drawAreaFill(canvas: ICanvas, coordinates: Point[], baselineY: number, color: Color, opacity: number): void {
    if (coordinates.length < 2) return;

    const fillColor = color.withAlpha(opacity);
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    if (this.orientation === ChartOrientation.Horizontal) {
      canvas.fillPath(
        [
          new Point(CartesianChartBase.LEFT_PADDING, first.y),
          ...coordinates,
          new Point(CartesianChartBase.LEFT_PADDING, last.y),
        ],
        fillColor
      );
    } else {
      canvas.fillPath([new Point(first.x, baselineY), ...coordinates, new Point(last.x, baselineY)], fillColor);
    }
  }

  /**
   * Gets the default color for the series when converting from old API (DataPoints) to new API (Series).
   * Returns the chart's AreaColor property for backward compatibility.
   */
  protected override getDefaultSeriesColor(): Color {
    return this.areaColor;
  }
}
