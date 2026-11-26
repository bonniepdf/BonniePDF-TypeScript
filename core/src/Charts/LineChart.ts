// Generated chart source. Do not edit here; the source manifest records its provenance.
import { buildCurveCommands, type ChartCurveMode } from './Graphics/ChartCurves';
import { drawChartMarker, type ChartMarkerFill, type ChartMarkerShape } from './Graphics/ChartMarkers';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';
import { ChartOrientation } from './ChartOrientation';
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { CartesianChartBase } from './CartesianChartBase';
import type { ChartUpDownBars } from './Graphics/ChartAnalysis';

/** Settable properties declared by {@link LineChart} itself. */
export const LINE_CHART_OWN_OPTION_KEYS = [
  'defaultLineWidth',
  'sparkline',
  'sparklineFillOpacity',
  'sparklineShowEndpoints',
  'sparklineHighlightMinMax',
  'sparklineReferenceValue',
  'defaultShowMarkers',
  'defaultMarkerRadius',
  'defaultMarkerShape',
  'defaultMarkerFill',
  'defaultMarkerHaloWidth',
  'curve',
  'lineColor',
  'dropLines',
  'highLowLines',
  'upDownBars',
] as const;

/** The full option surface, bases included. */
export const LINE_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...LINE_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link LineChart}. */
export type LineChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<LineChart, (typeof LINE_CHART_OWN_OPTION_KEYS)[number]>, 'lineColor'>> & {
    /** Default line colour for series without an explicit colour. */
    lineColor?: ColorInput;
  };

/** Renders one or more data series as lines against Cartesian axes. */
export class LineChart extends CartesianChartBase {
  protected override get supportsAnnotations(): boolean {
    return true;
  }

  protected override get supportsTimeAxis(): boolean {
    return true;
  }

  private static readonly DEFAULT_LINE_COLOR_HEX = '#4f46e5';
  private static readonly DEFAULT_DATA_POINT_RADIUS = 5;

  constructor(options?: LineChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /** Default stroke width for line series in points. */
  defaultLineWidth: number = 2;
  /** Thin lines from each point to the category axis. */
  dropLines: boolean = false;
  /** A line from the lowest to the highest series value at each category (two or more series). */
  highLowLines: boolean = false;
  /** A bar between the first and the last series at each category, coloured by direction (two or more series). */
  upDownBars: ChartUpDownBars | undefined;

  protected override drawAllSeries(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, topY: number): void {
    this.drawBandLines(canvas, data, chartAreaWidth, chartAreaHeight, baselineY, this.highLowLines, this.upDownBars);
    if (this.dropLines) this.drawDropLines(canvas, data, chartAreaWidth, chartAreaHeight, baselineY);
    super.drawAllSeries(canvas, data, chartAreaWidth, chartAreaHeight, baselineY, topY);
  }
  /** Draws the chart as a compact sparkline without axes, gridlines, or legend. */
  sparkline = false;
  /** Optional subtle fill opacity (`0..1`) beneath sparkline curves. */
  sparklineFillOpacity: number = 0;
  /** Draws small endpoint dots at first and last sparkline points. */
  sparklineShowEndpoints: boolean = false;
  /** Highlights minimum (`#e11d48`) and maximum (`#0d9488`) points on sparklines. */
  sparklineHighlightMinMax: boolean = false;
  /** Optional dashed horizontal reference baseline across the sparkline. */
  sparklineReferenceValue: number | undefined;

  /** Whether to draw data point markers by default. */
  defaultShowMarkers: boolean = true;
  /** Default radius of data point markers in points. */
  defaultMarkerRadius: number = LineChart.DEFAULT_DATA_POINT_RADIUS;
  /** Default geometric shape of data point markers. */
  defaultMarkerShape: ChartMarkerShape = 'circle';
  /** Default fill mode of data point markers (`solid` or `hollow`). */
  defaultMarkerFill: ChartMarkerFill = 'solid';
  /** Default background-coloured halo width around markers in points. */
  defaultMarkerHaloWidth: number = 0;
  /** Default curve interpolation mode (`linear`, `smooth`, `stepBefore`, `stepAfter`, `stepMiddle`). */
  curve: ChartCurveMode = 'linear';

  protected override get supportsInlineLegend(): boolean {
    return true;
  }

  protected override drawLegendSwatch(canvas: ICanvas, x: number, y: number, size: number, series: ChartSeries): void {
    if (!this.appearance.roundedLegendSwatches) {
      super.drawLegendSwatch(canvas, x, y, size, series);
      return;
    }
    const color = this.resolveSeriesStrokeColor(series);
    const idx = (this._renderData ?? this.data).series.indexOf(series);
    const dash = this.resolveSeriesDashPattern(series, idx);
    const midY = y + size / 2;
    if (dash && dash.length > 0) {
      strokeChartPath(canvas, { commands: [{ op: 'M', values: [x, midY] }, { op: 'L', values: [x + size + 2, midY] }], color, lineWidth: 2, dashPattern: dash });
    } else {
      canvas.drawLine(x, midY, x + size + 2, midY, color, 2);
    }
    if (series.style?.showMarkers ?? this.defaultShowMarkers) {
      const shape = this.resolveSeriesMarkerShape(series, idx, this.defaultMarkerShape);
      drawChartMarker(canvas, x + (size + 2) / 2, midY, 2.8, color, shape, series.style?.markerFill ?? this.defaultMarkerFill, 0, this.effectiveBackgroundColor ?? Color.white, 1.2);
    }
  }

  protected override drawCompact(canvas: ICanvas, data: ChartData): boolean {
    if (!this.sparkline) return false;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    if (this.sparklineReferenceValue !== undefined) {
      const frac = Math.max(0, Math.min(1, this.fraction(this.sparklineReferenceValue)));
      const ry = (1 - frac) * this.height;
      strokeChartPath(canvas, {
        commands: [{ op: 'M', values: [0, ry] }, { op: 'L', values: [this.width, ry] }],
        color: this.axisColor,
        lineWidth: 0.75,
        dashPattern: [2, 2],
      });
    }
    for (let sIdx = 0; sIdx < data.series.length; sIdx++) {
      const series = data.series[sIdx];
      const lineWidth = series.style?.lineWidth && series.style.lineWidth > 0 ? series.style.lineWidth : this.defaultLineWidth;
      const inset = Math.min(lineWidth / 2 + (this.sparklineShowEndpoints || this.sparklineHighlightMinMax ? 2 : 0), this.width / 2, this.height / 2);
      const points = series.dataPoints.map(({ value }, index, all) => {
        const category = all.length > 1 ? index / (all.length - 1) : 0.5;
        const fraction = Math.max(0, Math.min(1, this.fraction(value)));
        return new Point(
          inset + (horizontal ? fraction : category) * (this.width - 2 * inset),
          inset + (horizontal ? category : 1 - fraction) * (this.height - 2 * inset)
        );
      });
      const color = this.resolveSeriesStrokeColor(series);
      const curve = series.style?.curve ?? this.curve;
      const dash = this.resolveSeriesDashPattern(series, sIdx);
      if (this.sparklineFillOpacity > 0 && points.length >= 2) {
        const curveCmds = buildCurveCommands(points, curve, horizontal, false);
        const cmds = horizontal
          ? [{ op: 'M' as const, values: [inset, points[0].y] }, ...curveCmds, { op: 'L' as const, values: [inset, points[points.length - 1].y] }, { op: 'Z' as const, values: [] }]
          : [{ op: 'M' as const, values: [points[0].x, this.height - inset] }, ...curveCmds, { op: 'L' as const, values: [points[points.length - 1].x, this.height - inset] }, { op: 'Z' as const, values: [] }];
        fillChartPath(canvas, { commands: cmds, color: color.withAlpha(this.sparklineFillOpacity) });
      }
      this.drawSeriesLine(canvas, points, color, lineWidth, curve, dash, this.resolveLineEffects(series));
      if (this.sparklineShowEndpoints && points.length > 0) {
        canvas.fillCircle(points[0].x, points[0].y, 2.5, color);
        if (points.length > 1) canvas.fillCircle(points[points.length - 1].x, points[points.length - 1].y, 2.5, color);
      }
      if (this.sparklineHighlightMinMax && points.length > 0) {
        let minIdx = 0;
        let maxIdx = 0;
        for (let i = 1; i < series.dataPoints.length; i++) {
          if (series.dataPoints[i].value < series.dataPoints[minIdx].value) minIdx = i;
          if (series.dataPoints[i].value > series.dataPoints[maxIdx].value) maxIdx = i;
        }
        canvas.fillCircle(points[minIdx].x, points[minIdx].y, 2.5, Color.fromHex('#e11d48'));
        canvas.fillCircle(points[maxIdx].x, points[maxIdx].y, 2.5, Color.fromHex('#0d9488'));
      }
    }
    return true;
  }

  private _lineColor: Color = Color.fromHex(LineChart.DEFAULT_LINE_COLOR_HEX);
  /** Default line colour for series without an explicit colour. */
  public get lineColor(): Color {
    return this._lineColor;
  }
  public set lineColor(value: ColorInput) {
    this._lineColor = toColor(value);
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
    const lineWidth = series.style?.lineWidth && series.style.lineWidth > 0 ? series.style.lineWidth : this.defaultLineWidth;
    const showMarkers = series.style?.showMarkers ?? this.defaultShowMarkers;
    const markerRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultMarkerRadius;
    const seriesIdx = data.series.indexOf(series);
    const color = this.resolveSeriesStrokeColor(series);
    const curve = series.style?.curve ?? this.curve;
    const dash = this.resolveSeriesDashPattern(series, seriesIdx);

    this.drawSeriesLine(canvas, coordinates, color, lineWidth, curve, dash, this.resolveLineEffects(series));

    if (showMarkers) {
      const shape = this.resolveSeriesMarkerShape(series, seriesIdx, this.defaultMarkerShape);
      const fill = series.style?.markerFill ?? this.defaultMarkerFill;
      const halo = series.style?.markerHaloWidth ?? this.defaultMarkerHaloWidth;
      const bg = this.effectiveBackgroundColor ?? Color.white;
      for (const p of coordinates) {
        drawChartMarker(canvas, p.x, p.y, markerRadius, color, shape, fill, halo, bg, lineWidth);
      }
    }
  }

  protected override resolveSeriesColor(series: ChartSeries): Color {
    // Pale fill palettes (pastel) keep lines legible through a darker stroke palette.
    return this.appearance.strokePalette.length > 0 && !series.hasColor ? this.resolveSeriesStrokeColor(series) : super.resolveSeriesColor(series);
  }

  protected override getLabelVerticalOffset(series: ChartSeries): number {
    const markerRadius =
      series.style?.markerRadius && series.style.markerRadius > 0 ? series.style.markerRadius : this.defaultMarkerRadius;
    return markerRadius + 7;
  }

  protected override getDefaultSeriesColor(): Color {
    return this.lineColor;
  }
}
