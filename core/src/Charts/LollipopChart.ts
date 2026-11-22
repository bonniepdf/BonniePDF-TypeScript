// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { drawChartMarker, type ChartMarkerFill, type ChartMarkerShape } from './Graphics/ChartMarkers';

/** Settable properties declared by {@link LollipopChart} itself. */
export const LOLLIPOP_CHART_OWN_OPTION_KEYS = [
  'defaultStemWidth',
  'defaultHeadRadius',
  'lollipopColor',
  'defaultMarkerShape',
  'defaultMarkerFill',
  'defaultMarkerHaloWidth',
] as const;

/** The full option surface, bases included. */
export const LOLLIPOP_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...LOLLIPOP_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link LollipopChart}. */
export type LollipopChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<LollipopChart, (typeof LOLLIPOP_CHART_OWN_OPTION_KEYS)[number]>, 'lollipopColor'>> & {
    /** Default stem and head colour for series without an explicit colour. */
    lollipopColor?: ColorInput;
  };

/** Renders each data value as a marker connected to its baseline by a stem. */
export class LollipopChart extends CartesianChartBase {
  private static readonly DEFAULT_COLOR_HEX = '#4f46e5';
  private static readonly DEFAULT_HEAD_RADIUS_VALUE = 8;

  constructor(options?: LollipopChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /** Default stroke width of lollipop stems in points. */
  defaultStemWidth: number = 2;
  /** Default radius of lollipop head markers in points. */
  defaultHeadRadius: number = LollipopChart.DEFAULT_HEAD_RADIUS_VALUE;
  /** Default geometric marker shape for lollipop heads. */
  defaultMarkerShape: ChartMarkerShape = 'circle';
  /** Default marker fill mode (`solid` or `hollow`). */
  defaultMarkerFill: ChartMarkerFill = 'solid';
  /** Default background-coloured halo width around lollipop heads in points. */
  defaultMarkerHaloWidth: number = 0;

  private _lollipopColor: Color = Color.fromHex(LollipopChart.DEFAULT_COLOR_HEX);
  /** Default stem and head colour for series without an explicit colour. */
  public get lollipopColor(): Color {
    return this._lollipopColor;
  }
  public set lollipopColor(value: ColorInput) {
    this._lollipopColor = toColor(value);
  }

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
    const stemWidth = series.style?.stemWidth && series.style.stemWidth > 0 ? series.style.stemWidth : this.defaultStemWidth;
    const headRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultHeadRadius;
    const seriesIdx = data.series.indexOf(series);
    const color = this.resolveSeriesColor(series);
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);

    for (const p of coordinates) {
      if (this.orientation === ChartOrientation.Horizontal) {
        canvas.drawLine(origin, p.y, p.x, p.y, color, stemWidth);
      } else {
        canvas.drawLine(p.x, origin, p.x, p.y, color, stemWidth);
      }
    }

    const shape = this.resolveSeriesMarkerShape(series, seriesIdx, this.defaultMarkerShape);
    const fill = series.style?.markerFill ?? this.defaultMarkerFill;
    const halo = series.style?.markerHaloWidth ?? this.defaultMarkerHaloWidth;
    const bg = this.effectiveBackgroundColor ?? Color.white;
    for (const p of coordinates) {
      drawChartMarker(canvas, p.x, p.y, headRadius, color, shape, fill, halo, bg, stemWidth);
    }
  }

  protected override getLabelVerticalOffset(series: ChartSeries): number {
    const headRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultHeadRadius;
    return headRadius + 7;
  }

  protected override getDefaultSeriesColor(): Color {
    return this.lollipopColor;
  }
}
