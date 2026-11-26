// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas, toLength, type LengthInput } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';
import { buildCurveCommands, type ChartCurveMode } from './Graphics/ChartCurves';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';
import { fillChartPath } from './Graphics/ChartVector';

/** Settable properties declared by {@link AreaChart} itself. */
export const AREA_CHART_OWN_OPTION_KEYS = [
  'defaultFillOpacity',
  'defaultLineWidth',
  'areaColor',
  'fillOpacity',
  'lineWidth',
  'curve',
  'areaGradient',
  'dropLines',
] as const;

/** The full option surface, bases included. */
export const AREA_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...AREA_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link AreaChart}. */
export type AreaChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<AreaChart, (typeof AREA_CHART_OWN_OPTION_KEYS)[number]>, 'areaColor' | 'lineWidth'>> & {
    /** Stroke width of the upper area boundary line. */
    lineWidth?: LengthInput;
    /** Default colour for series without an explicit colour. */
    areaColor?: ColorInput;
  };

/** Renders one or more data series as filled areas against Cartesian axes. */
export class AreaChart extends CartesianChartBase {
  protected override get supportsAnnotations(): boolean {
    return true;
  }

  protected override get supportsTimeAxis(): boolean {
    return true;
  }

  private static readonly DEFAULT_AREA_COLOR_HEX = '#4f46e5';

  constructor(options?: AreaChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /** Thin lines from each point to the category axis. */
  dropLines: boolean = false;

  protected override drawAllSeries(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, topY: number): void {
    if (this.dropLines) this.drawDropLines(canvas, data, chartAreaWidth, chartAreaHeight, baselineY);
    super.drawAllSeries(canvas, data, chartAreaWidth, chartAreaHeight, baselineY, topY);
  }

  /** Default fill opacity for series without an explicit opacity (`0..1`). */
  defaultFillOpacity: number = 0.3;
  /** Default stroke width for series boundary lines in points. */
  defaultLineWidth: number = 2;

  private _areaColor: Color = Color.fromHex(AreaChart.DEFAULT_AREA_COLOR_HEX);
  /** Default colour for series without an explicit colour. */
  public get areaColor(): Color {
    return this._areaColor;
  }
  public set areaColor(value: ColorInput) {
    this._areaColor = toColor(value);
  }

  /** Fill opacity for area polygons (`0..1`). */
  fillOpacity: number = 0.3;

  private _lineWidth: number = 2;
  /** Stroke width of the upper area boundary line in points. */
  public get lineWidth(): number {
    return this._lineWidth;
  }
  public set lineWidth(value: LengthInput) {
    this._lineWidth = toLength(value);
  }

  /** Curve interpolation mode: `linear` (default), `smooth`, `stepBefore`, `stepAfter`, `stepMiddle`. */
  curve: ChartCurveMode = 'linear';

  /** Vertical (or horizontal) fade gradient from series colour to near-transparent at the baseline. */
  areaGradient: boolean = false;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return super.usesStyledGeometry || this.areaGradient || this.curve !== 'linear';
  }

  protected override get supportsInlineLegend(): boolean {
    return true;
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
    const fillOpacity =
      series.style?.fillOpacity && series.style.fillOpacity > 0 && series.style.fillOpacity !== this.defaultFillOpacity
        ? series.style.fillOpacity
        : data.series.length === 1
          ? this.fillOpacity
          : this.defaultFillOpacity;
    const lineWidth =
      series.style?.lineWidth && series.style.lineWidth > 0 && series.style.lineWidth !== this.defaultLineWidth
        ? series.style.lineWidth
        : data.series.length === 1
          ? this.lineWidth
          : this.defaultLineWidth;

    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);
    const color = this.resolveSeriesColor(series);
    const curve = series.style?.curve ?? this.curve;
    const seriesIdx = data.series.indexOf(series);
    const dash = this.resolveSeriesDashPattern(series, seriesIdx);

    this.drawAreaFill(canvas, coordinates, origin, color, fillOpacity, curve);
    this.drawSeriesLine(canvas, coordinates, this.resolveSeriesStrokeColor(series), lineWidth, curve, dash, this.resolveLineEffects(series));
  }

  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  private drawAreaFill(
    canvas: ICanvas,
    coordinates: Point[],
    origin: number,
    color: Color,
    opacity: number,
    curve: ChartCurveMode
  ): void {
    if (coordinates.length < 2) return;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    if (!this.areaGradient && curve === 'linear') {
      const fillColor = color.withAlpha(opacity);
      if (horizontal) {
        canvas.fillPath([new Point(origin, first.y), ...coordinates, new Point(origin, last.y)], fillColor);
      } else {
        canvas.fillPath([new Point(first.x, origin), ...coordinates, new Point(last.x, origin)], fillColor);
      }
      return;
    }

    const curveCmds = buildCurveCommands(coordinates, curve, horizontal, false);
    const commands: ChartPathCommand[] = horizontal
      ? [{ op: 'M', values: [origin, first.y] }, ...curveCmds, { op: 'L', values: [origin, last.y] }, { op: 'Z', values: [] }]
      : [{ op: 'M', values: [first.x, origin] }, ...curveCmds, { op: 'L', values: [last.x, origin] }, { op: 'Z', values: [] }];

    if (!this.areaGradient) {
      fillChartPath(canvas, { commands, color: color.withAlpha(opacity) });
      return;
    }

    const topColor = color.withAlpha(opacity);
    const bottomColor = color.withAlpha(0.02);
    let peak = origin;
    for (const p of coordinates) {
      if (horizontal) {
        if (Math.abs(p.x - origin) > Math.abs(peak - origin)) peak = p.x;
      } else {
        if (Math.abs(p.y - origin) > Math.abs(peak - origin)) peak = p.y;
      }
    }
    if (peak === origin) peak = horizontal ? origin + 1 : origin - 1;

    fillChartPath(canvas, {
      commands,
      color: topColor,
      gradient: {
        startX: horizontal ? peak : first.x,
        startY: horizontal ? first.y : peak,
        endX: horizontal ? origin : first.x,
        endY: horizontal ? first.y : origin,
        startColor: topColor,
        endColor: bottomColor,
        stops: [
          { offset: 0, color: topColor },
          { offset: 1, color: bottomColor },
        ],
      },
    });
  }

  protected override getDefaultSeriesColor(): Color {
    return this.areaColor;
  }
}
