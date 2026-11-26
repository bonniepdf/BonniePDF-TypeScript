// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { CartesianChartBase } from './CartesianChartBase';
import { drawChartMarker, type ChartMarkerFill, type ChartMarkerShape } from './Graphics/ChartMarkers';

/** Settable properties declared by {@link DotPlotChart} itself. */
export const DOT_PLOT_CHART_OWN_OPTION_KEYS = [
  'defaultDotRadius',
  'dotColor',
  'defaultMarkerShape',
  'defaultMarkerFill',
  'defaultMarkerHaloWidth',
] as const;

/** The full option surface, bases included. */
export const DOT_PLOT_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...DOT_PLOT_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link DotPlotChart}. */
export type DotPlotChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<DotPlotChart, (typeof DOT_PLOT_CHART_OWN_OPTION_KEYS)[number]>, 'dotColor'>> & {
    /** Default dot colour for series without an explicit colour. */
    dotColor?: ColorInput;
  };

/** Renders each data value as a dot positioned along a Cartesian scale. */
export class DotPlotChart extends CartesianChartBase {
  protected override get supportsAnnotations(): boolean {
    return true;
  }

  private static readonly DEFAULT_COLOR_HEX = '#4f46e5';
  private static readonly DEFAULT_DOT_RADIUS_VALUE = 10;

  constructor(options?: DotPlotChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /** Default radius of plotted dots in points. */
  defaultDotRadius: number = DotPlotChart.DEFAULT_DOT_RADIUS_VALUE;
  /** Default geometric marker shape for plotted dots. */
  defaultMarkerShape: ChartMarkerShape = 'circle';
  /** Default marker fill mode (`solid` or `hollow`). */
  defaultMarkerFill: ChartMarkerFill = 'solid';
  /** Default background-coloured halo width around dots in points. */
  defaultMarkerHaloWidth: number = 0;

  private _dotColor: Color = Color.fromHex(DotPlotChart.DEFAULT_COLOR_HEX);
  /** Default dot colour for series without an explicit colour. */
  public get dotColor(): Color {
    return this._dotColor;
  }
  public set dotColor(value: ColorInput) {
    this._dotColor = toColor(value);
  }

  protected override drawSeriesElements(
    canvas: ICanvas,
    data: ChartData,
    series: ChartSeries,
    coordinates: Point[],
    _chartAreaWidth: number,
    _chartAreaHeight: number,
    _baselineY: number,
    _topY: number
  ): void {
    const dotRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultDotRadius;
    const seriesIdx = data.series.indexOf(series);
    const color = this.resolveSeriesColor(series);
    const shape = this.resolveSeriesMarkerShape(series, seriesIdx, this.defaultMarkerShape);
    const fill = series.style?.markerFill ?? this.defaultMarkerFill;
    const halo = series.style?.markerHaloWidth ?? this.defaultMarkerHaloWidth;
    const bg = this.effectiveBackgroundColor ?? Color.white;
    for (const p of coordinates) {
      drawChartMarker(canvas, p.x, p.y, dotRadius, color, shape, fill, halo, bg, 2);
    }
  }

  protected override getLabelVerticalOffset(series: ChartSeries): number {
    const dotRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultDotRadius;
    return dotRadius + 7;
  }

  protected override getDefaultSeriesColor(): Color {
    return this.dotColor;
  }
}
