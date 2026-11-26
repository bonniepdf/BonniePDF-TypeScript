// Generated chart source. Do not edit here; the source manifest records its provenance.
import { drawPlacedLabel, type ChartLabelBox } from './Graphics/ChartLabels';
import { applyChartAffixes, formatChartNumber, type ChartNegativeStyle } from './ChartNumberFormat';
import { type ICanvas, Color, toColor, type ColorInput, Point, TextAlignment, StandardFonts, toLength, type LengthInput } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions } from './ChartBase';
import { ChartData } from './Models/ChartData';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { ChartSeries } from './Models/ChartSeries';
import { AxisOptions, type AxisOptionsOptions } from './Models/AxisOptions';
import { ChartOrientation } from './ChartOrientation';
import { ChartBase } from './ChartBase';
import { CHART_THEMES, themedSeriesColor } from './ChartTheme';
import { blendOverOpaque, checkValueRange, logFraction, computeNiceScale, contrastRatio, contrastTextColor, isBelowOrigin, originFraction, valueFraction } from './Graphics/ChartValueScale';
import { buildCurveCommands, polylineLength, validateDashPattern, type ChartCurveMode } from './Graphics/ChartCurves';
import type { ChartMarkerShape } from './Graphics/ChartMarkers';
import type { ChartPathCommand, ChartPatternKind, ChartResolvedEffect } from './Graphics/ChartPathPlan';
import { fillChartPath, popClip, pushClipRect, strokeChartPath, withChartGroup } from './Graphics/ChartVector';
import { ChartAnnotationPainter, resolveHighlight, validateAnnotations, type AnnotationContext, type AnnotationRect, type ChartAnnotation, type HighlightSelection } from './Graphics/ChartAnnotations';
import { dimColor, shadeFace, tintFace } from './Graphics/ChartTint';
import { resolveDepth3d, type ChartDepth3d, type DepthShift } from './Graphics/ChartDepth3d';
import type { ChartGroupAnchor } from './Graphics/ChartGroups';
import { validateTrendlines, type ChartDataTable, type ChartTrendline, type ChartUpDownBars } from './Graphics/ChartAnalysis';
import { fitTrendline, formatSignificant, sampleStandardDeviation } from './Graphics/ChartTrendlineMath';
import { chooseTimeUnit, defaultDateFormat, formatChartDate, parseChartDate, timeTicks, type ChartTimeAxis, type ChartTimeUnit } from './Graphics/ChartDates';
import { ChartFill, type ChartBox, type ChartFillInput } from './Graphics/ChartFill';

/** Legend placement relative to the plot area (`bottom`, `top`, `right`, `inline`, or `none`). */
export type ChartLegendPosition = 'bottom' | 'top' | 'right' | 'inline' | 'none';
/** Value label placement relative to bars (`outside`, `inside`, or `auto`). */
export type ChartValueLabelPosition = 'outside' | 'inside' | 'auto';
/** Position of a reference annotation label along the line or band (`start`, `center`, or `end`). */
export type ChartReferenceLabelPosition = 'start' | 'center' | 'end';
/** Placement of a reference annotation label relative to the line or band (`above`, `below`, or `inside`). */
export type ChartReferenceLabelPlacement = 'above' | 'below' | 'inside';

/** Settable properties declared by {@link CartesianChartBase} itself. */
export const CARTESIAN_CHART_OWN_OPTION_KEYS = [
  'xAxis',
  'yAxis',
  'fontFamily',
  'showValueLabels',
  'labelFontSize',
  'valueLabelFormat',
  'valueLabelPrefix',
  'valueLabelSuffix',
  'negativeStyle',
  'valueLabelPosition',
  'plotAreaFill',
  'plotAreaBorderColor',
  'plotAreaBorderWidth',
  'showLegend',
  'legendPosition',
  'orientation',
  'references',
  'annotations',
  'trendlines',
  'depth3d',
  'dataTable',
  'timeAxis',
  'clipToPlotArea',
] as const;

/** The full option surface of a cartesian chart, base included. */
export const CARTESIAN_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...CARTESIAN_CHART_OWN_OPTION_KEYS] as const;

/** Options common to cartesian charts. Intersects {@link ChartBaseOptions}. */
export type CartesianChartOptions = ChartBaseOptions &
  Partial<
    Omit<
      Pick<CartesianChartBase, (typeof CARTESIAN_CHART_OWN_OPTION_KEYS)[number]>,
      'xAxis' | 'yAxis' | 'labelFontSize' | 'plotAreaFill' | 'plotAreaBorderColor'
    >
  > & {
    /** Fill of the plot rectangle (a colour or gradient), drawn behind references and gridlines. */
    plotAreaFill?: ChartFillInput;
    /** Colour of a border around the plot rectangle. */
    plotAreaBorderColor?: Color | ColorInput;
    /** Axis label font size. Accepts a length: `9`, `'9pt'`, or `{ value, unit }`. */
    labelFontSize?: LengthInput;
    /** Category axis presentation; accepts an AxisOptions instance or literal. */
    xAxis?: AxisOptions | AxisOptionsOptions;
    /** Value axis presentation; accepts an AxisOptions instance or literal. */
    yAxis?: AxisOptions | AxisOptionsOptions;
  };

/** A value-axis line, or a band when endValue is supplied. */
export interface ChartReference {
  /** The line value or the first band endpoint. */
  value: number;
  /** Fill or stroke colour. */
  color: ColorInput;
  /** The second band endpoint. Omit it for a line. */
  endValue?: number;
  /** The line thickness in points. Defaults to one. */
  thickness?: number;
  /** Optional alternating dash and gap lengths in points. */
  dashPattern?: readonly number[];
  /** Optional annotation label text. */
  label?: string;
  /** Position along the line or band: `start`, `center`, or `end` (default). */
  labelPosition?: ChartReferenceLabelPosition;
  /** Placement relative to the line or band: `above`, `below`, or `inside`. */
  labelPlacement?: ChartReferenceLabelPlacement;
  /** Optional label colour override. */
  labelColor?: ColorInput;
  /** Optional rounded pill background behind the label. */
  labelBackgroundColor?: ColorInput;
}

/** Provides shared axis, scale, grid, and label behavior for Cartesian charts. */
export abstract class CartesianChartBase extends ChartBase {
  private _labelBoxes: ChartLabelBox[] = [];
  protected _renderData?: ChartData;
  protected _plotLeft: number = 80;
  protected _plotRight: number = 40;
  protected _effectiveMin: number = 0;
  protected _effectiveMax: number = 10000;
  protected _effectiveStepCount: number = 5;
  protected _effectiveTickFormat: string = 'N0';

  protected drawPlacedLabel(
    canvas: ICanvas,
    x: number,
    y: number,
    text: string,
    color: Color,
    size: number,
    family: string,
    align: TextAlignment
  ): void {
    if (this.appearance.measuredLabels)
      drawPlacedLabel(canvas, this._labelBoxes, this.width, this.height, x, y, text, color, size, family, align);
    else canvas.drawText(x, y, text, color, size, family, align);
  }

  protected get axisColor(): Color {
    return this.appearance.axisColor;
  }
  protected get gridLineColor(): Color {
    return this.appearance.gridLineColor;
  }

  // Layout constants (relative to chart height)
  protected static readonly TITLE_AREA_HEIGHT = 60;
  protected static readonly BOTTOM_PADDING = 70;
  protected static readonly TOP_PADDING = 20;
  protected static readonly AXIS_LABEL_BAND = 30;
  protected static readonly LEFT_PADDING = 80;
  protected static readonly RIGHT_PADDING = 40;
  protected static readonly AXIS_LINE_WIDTH = 1;
  protected static readonly GRID_LINE_WIDTH = 0.5;
  protected static readonly AXIS_LABEL_FONT_SIZE = 10;
  protected static readonly LEGEND_FONT_SIZE = 11;

  protected static readonly AXIS_COLOR = CHART_THEMES.legacy.axisColor;
  protected static readonly GRID_LINE_COLOR = CHART_THEMES.legacy.gridLineColor;

  /** Category-axis presentation owned by this chart. */
  public get xAxis(): AxisOptions {
    return this.data.xAxis;
  }
  public set xAxis(value: AxisOptions | AxisOptionsOptions) {
    this.data.xAxis = value instanceof AxisOptions ? value : new AxisOptions(value);
  }

  /** Value-axis presentation owned by this chart. */
  public get yAxis(): AxisOptions {
    return this.data.yAxis;
  }
  public set yAxis(value: AxisOptions | AxisOptionsOptions) {
    this.data.yAxis = value instanceof AxisOptions ? value : new AxisOptions(value);
  }

  /** Font family for labels */
  fontFamily: string = StandardFonts.Helvetica;

  /** Whether to show value labels above each data point */
  showValueLabels: boolean = true;

  private _labelFontSize: number = 9;

  /** Font size for value labels above data points */
  public get labelFontSize(): number {
    return this._labelFontSize;
  }
  public set labelFontSize(value: LengthInput) {
    this._labelFontSize = toLength(value);
  }

  /** Chart-level number format for value labels when a point did not set its own labelFormat. */
  valueLabelFormat: string | undefined;

  /** Optional prefix prepended to value labels. */
  valueLabelPrefix: string = '';

  /** Optional suffix appended to value labels. */
  valueLabelSuffix: string = '';

  /** Where a negative value label's minus sign goes relative to its prefix: `minusAfterPrefix` (default, `$-1`), `minus` (`-$1`) or `parentheses` (`($1)`). */
  negativeStyle: ChartNegativeStyle = 'minusAfterPrefix';

  /** Value label placement on bar charts: `outside` (default), `inside`, or `auto`. */
  valueLabelPosition: ChartValueLabelPosition = 'outside';

  private _plotAreaFill: ChartFill | undefined;
  /** Fill of the plot rectangle (a colour or a gradient), drawn behind references and gridlines. */
  get plotAreaFill(): ChartFill | undefined {
    return this._plotAreaFill;
  }
  set plotAreaFill(value: ChartFillInput | undefined) {
    this._plotAreaFill = value === undefined ? undefined : ChartFill.from(value);
  }

  private _plotAreaBorderColor: Color | undefined;
  /** Colour of a border drawn around the plot rectangle. */
  get plotAreaBorderColor(): Color | undefined {
    return this._plotAreaBorderColor;
  }
  set plotAreaBorderColor(value: ColorInput | undefined) {
    this._plotAreaBorderColor = value === undefined ? undefined : toColor(value);
  }

  /** Width of the plot-area border in points. */
  plotAreaBorderWidth: number = 1;

  private _currentPlot: ChartBox | undefined;
  protected override get plotBox(): ChartBox {
    return this._currentPlot ?? super.plotBox;
  }

  /** Whether to show a legend for multiple series (default: true). */
  showLegend: boolean = true;

  /** Where to draw the legend: `bottom` (default), `top`, `right`, `inline`, or `none`. */
  legendPosition: ChartLegendPosition = 'bottom';

  /** Controls whether the chart renders with vertical or horizontal orientation. */
  orientation: ChartOrientation = ChartOrientation.Vertical;

  /** Reference lines and bands on the value axis. */
  references: readonly ChartReference[] = [];

  private _annotations: readonly ChartAnnotation[] = [];
  /**
   * Annotations drawn over the chart: text, callouts, arrows, growth and CAGR brackets, category brackets, ranges, highlights
   * and markers. Supported on bar, grouped bar, line and area charts.
   */
  get annotations(): readonly ChartAnnotation[] {
    return this._annotations;
  }
  set annotations(value: readonly ChartAnnotation[]) {
    validateAnnotations(value);
    this._annotations = [...value];
  }

  private _trendlines: readonly ChartTrendline[] = [];
  /** Regression lines over series of a category chart: linear, exponential, logarithmic, power, polynomial and moving average. Bar, grouped bar, line, area and dot plot charts. */
  get trendlines(): readonly ChartTrendline[] {
    return this._trendlines;
  }
  set trendlines(value: readonly ChartTrendline[]) {
    validateTrendlines(value);
    this._trendlines = [...value];
  }

  /** Thin lines from each point to the category axis. Used by line and area charts. */
  protected drawDropLines(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): void {
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    for (const series of data.series) {
      const color = this.rawSeriesStrokeColor(series);
      for (const p of this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY)) {
        if (vertical) canvas.drawLine(p.x, p.y, p.x, origin, color, 0.75);
        else canvas.drawLine(p.x, p.y, origin, p.y, color, 0.75);
      }
    }
  }

  /** At each category a line from the lowest to the highest series value, and optionally a bar from the first to the last series. */
  protected drawBandLines(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, highLow: boolean, upDown: ChartUpDownBars | undefined): void {
    if (!highLow && upDown === undefined) return;
    if (data.series.length < 2) throw new RangeError('highLowLines and upDownBars need at least two series.');
    const ratio = upDown?.widthRatio ?? 0.3;
    if (!(ratio > 0 && ratio <= 1)) throw new RangeError('upDownBars widthRatio must be above 0 and at most 1.');
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const coords = data.series.map((s) => this.calculateSeriesCoordinates(s, data, chartAreaWidth, chartAreaHeight, baselineY));
    const categories = coords.reduce((m, c) => Math.max(m, c.length), 0);
    const slot = (vertical ? chartAreaWidth : chartAreaHeight) / Math.max(1, categories);
    const up = upDown?.upColor !== undefined ? toColor(upDown.upColor) : (this.appearance.positiveColor ?? Color.fromHex('#15803d'));
    const down = upDown?.downColor !== undefined ? toColor(upDown.downColor) : (this.appearance.negativeColor ?? Color.fromHex('#b91c1c'));
    for (let i = 0; i < categories; i++) {
      const pts = coords.filter((c) => i < c.length).map((c) => c[i]);
      if (pts.length < 2) continue;
      const h = (p: Point): number => (vertical ? p.y : p.x);
      const c = vertical ? pts[0].x : pts[0].y;
      const lo = pts.reduce((a, b) => (h(b) < h(a) ? b : a));
      const hi = pts.reduce((a, b) => (h(b) > h(a) ? b : a));
      if (upDown !== undefined) {
        const first = h(pts[0]);
        const last = h(pts[pts.length - 1]);
        const rising = vertical ? last <= first : last >= first;
        const color = rising ? up : down;
        const t = slot * ratio;
        const a = Math.min(first, last);
        const len = Math.max(1, Math.abs(last - first));
        if (vertical) canvas.fillRect(c - t / 2, a, t, len, color);
        else canvas.fillRect(a, c - t / 2, len, t, color);
      }
      if (highLow) canvas.drawLine(vertical ? c : h(lo), vertical ? h(lo) : c, vertical ? c : h(hi), vertical ? h(hi) : c, this.appearance.legendTextColor, 1);
    }
  }

  /** Position points by their `date` along a time axis instead of in equal category slots. Line, area and candlestick charts, vertical only. */
  timeAxis: ChartTimeAxis | undefined;

  private _timeMin = 0;
  private _timeMax = 1;

  /** Whether this chart family can place points on a time axis. */
  protected get supportsTimeAxis(): boolean {
    return false;
  }

  /** Whether the chart being drawn positions its points by date. */
  protected get timeAxisActive(): boolean {
    return this.timeAxis !== undefined;
  }

  private resolveTimeScale(data: ChartData): void {
    const axis = this.timeAxis;
    if (axis === undefined) return;
    if (this.orientation === ChartOrientation.Horizontal) throw new Error('A time axis needs a vertical chart.');
    const times = data.series.flatMap((s) =>
      s.dataPoints.map((p) => {
        if (p.date === undefined) throw new RangeError('Every point needs a date on a time axis.');
        return parseChartDate(p.date);
      })
    );
    let min = axis.minDate !== undefined ? parseChartDate(axis.minDate) : Math.min(...times);
    let max = axis.maxDate !== undefined ? parseChartDate(axis.maxDate) : Math.max(...times);
    if (!(max > min)) {
      min -= 86_400_000;
      max += 86_400_000;
    }
    this._timeMin = min;
    this._timeMax = max;
  }

  /** The horizontal position of a point on the time axis, in chart coordinates. */
  protected timeX(point: ChartDataPoint, chartAreaWidth: number): number {
    return this._plotLeft + ((parseChartDate(point.date!) - this._timeMin) / (this._timeMax - this._timeMin)) * chartAreaWidth;
  }

  private timeUnit(chartAreaWidth: number): ChartTimeUnit {
    const unit = this.timeAxis?.unit;
    return unit === undefined || unit === 'auto' ? chooseTimeUnit(this._timeMin, this._timeMax, chartAreaWidth) : unit;
  }

  private drawTimeGridLines(canvas: ICanvas, chartAreaWidth: number, baselineY: number, topY: number): void {
    if (this.timeAxis === undefined || this.timeAxis.showGridLines === false) return;
    for (const t of timeTicks(this._timeMin, this._timeMax, this.timeUnit(chartAreaWidth))) {
      const x = this._plotLeft + ((t - this._timeMin) / (this._timeMax - this._timeMin)) * chartAreaWidth;
      canvas.drawLine(x, topY, x, baselineY, this.gridLineColor, CartesianChartBase.GRID_LINE_WIDTH);
    }
  }

  private drawTimeAxisLabels(canvas: ICanvas, chartAreaWidth: number, baselineY: number): void {
    const unit = this.timeUnit(chartAreaWidth);
    const format = this.timeAxis?.format ?? defaultDateFormat(unit);
    const family = this.effectiveFontFamily;
    for (const t of timeTicks(this._timeMin, this._timeMax, unit)) {
      const x = this._plotLeft + ((t - this._timeMin) / (this._timeMax - this._timeMin)) * chartAreaWidth;
      canvas.drawText(x, baselineY + 12, formatChartDate(t, format), this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, TextAlignment.Center);
    }
  }

  /** A grid of the plotted values beneath the plot: a row per series, a column per category. Vertical charts only. */
  dataTable: ChartDataTable | undefined;

  private get dataTableShown(): boolean {
    return this.dataTable !== undefined && this.dataTable.show !== false;
  }

  /** Extra height families reserve below the category axis labels, such as a volume pane. */
  protected getExtraBottomBand(_data: ChartData): number {
    return 0;
  }

  /** Height the data table takes below the category axis labels. */
  private dataTableHeight(data: ChartData): number {
    return this.dataTableShown ? data.series.length * 16 + 10 : 0;
  }

  private drawDataTable(canvas: ICanvas, data: ChartData, chartAreaWidth: number, baselineY: number): void {
    const table = this.dataTable;
    if (table === undefined || table.show === false) return;
    const family = this.effectiveFontFamily;
    const categories = data.series.reduce((m, s) => Math.max(m, s.dataPoints.length), 0);
    const slot = chartAreaWidth / Math.max(1, categories);
    const top = baselineY + 26;
    const size = this.labelFontSize;
    const gridColor = this.gridLineColor;
    canvas.drawLine(this._plotLeft, top - 3, this._plotLeft + chartAreaWidth, top - 3, gridColor, CartesianChartBase.GRID_LINE_WIDTH);
    data.series.forEach((series, r) => {
      const y = top + r * 16;
      const color = this.rawSeriesStrokeColor(series);
      const nameWidth = canvas.measureText(series.name, size, family).width;
      canvas.drawText(this._plotLeft - 8, y, series.name, this.appearance.legendTextColor, size, family, TextAlignment.Right);
      if (table.showLegendKeys !== false) canvas.fillRect(this._plotLeft - 8 - nameWidth - 12, y + 1, 8, 8, color);
      series.dataPoints.forEach((p, c) => {
        const text = table.format !== undefined ? formatChartNumber(p.value, table.format) : this.formatPointValue(p);
        canvas.drawText(this._plotLeft + slot * (c + 0.5), y, text, this.appearance.legendTextColor, size, family, TextAlignment.Center);
      });
      canvas.drawLine(this._plotLeft, y + 13, this._plotLeft + chartAreaWidth, y + 13, gridColor, CartesianChartBase.GRID_LINE_WIDTH);
    });
  }

  private _depth3d: ChartDepth3d | undefined;
  /** Oblique depth for bars: each bar gains a top face and a right face. Bar and grouped bar charts. Two-dimensional charts are easier to read accurately. */
  get depth3d(): ChartDepth3d | undefined {
    return this._depth3d;
  }
  set depth3d(value: ChartDepth3d | undefined) {
    resolveDepth3d(value);
    this._depth3d = value === undefined ? undefined : { ...value };
  }

  /** Whether this chart family can draw error bars. */
  protected get supportsErrorBars(): boolean {
    return this.supportsAnnotations;
  }

  /** Whether this chart family can draw {@link depth3d}. */
  protected get supportsDepth3d(): boolean {
    return false;
  }

  /** How far full depth moves a point right and up; zero without `depth3d`. */
  protected get depthShift(): DepthShift {
    return resolveDepth3d(this._depth3d) ?? { dx: 0, dy: 0 };
  }

  /** Where the back wall sits relative to the front plane: the gridlines and wall move by this when `depth3d.walls` is on, else zero. */
  private get wallShift(): { x: number; y: number } {
    if (this._depth3d?.walls !== true) return { x: 0, y: 0 };
    const { dx, dy } = this.depthShift;
    return { x: dx, y: -dy };
  }

  /** Draws the top and right faces of a bar whose front face is the rectangle (`x`, `y`, `w`, `h`), either sign of `w` and `h`. */
  protected drawBarDepth(canvas: ICanvas, x: number, y: number, w: number, h: number, color: Color): void {
    if (this._depth3d === undefined) return;
    const { dx, dy } = this.depthShift;
    const left = w < 0 ? x + w : x;
    const top = h < 0 ? y + h : y;
    const width = Math.abs(w);
    const height = Math.abs(h);
    if (width < 0.5 || height < 0.5) return;
    const face = (pts: number[][], c: Color): void => {
      const commands: ChartPathCommand[] = pts.map((p, i) => ({ op: i === 0 ? 'M' : 'L', values: p }));
      commands.push({ op: 'Z', values: [] });
      fillChartPath(canvas, { commands, color: c });
    };
    face([[left, top], [left + width, top], [left + width + dx, top - dy], [left + dx, top - dy]], tintFace(color));
    face([[left + width, top], [left + width + dx, top - dy], [left + width + dx, top + height - dy], [left + width, top + height]], shadeFace(color));
  }

  private _highlight: HighlightSelection | undefined;
  private _highlightKeep = 1;

  /** Optional clip of plotted series geometry to the plot area; undefined defers to chart family default. */
  clipToPlotArea: boolean | undefined;

  /** Whether this chart family can place annotations: marks whose value end is a single point per category. */
  protected get supportsAnnotations(): boolean {
    return false;
  }

  /** The thickness of a bar for annotation collision boxes, or `undefined` when marks are points. */
  protected annotationBarThickness(_slot: number, _seriesCount: number): number | undefined {
    return undefined;
  }

  /** The value end of a mark, in chart coordinates. Families that offset marks within a slot override this. */
  protected annotationMarkPoint(
    _series: ChartSeries,
    _seriesIndex: number,
    pointIndex: number,
    coordinates: Point[],
    _data: ChartData,
    _chartAreaWidth: number,
    _chartAreaHeight: number,
    _baselineY: number
  ): Point {
    return coordinates[pointIndex];
  }

  private annotationLookups(data: ChartData): {
    seriesIndex(ref: number | string): number;
    categoryIndex(ref: number | string): number;
    pointIndex(series: number, ref: number | string): number;
  } {
    const categories = data.series.reduce<string[]>((best, s) => (s.dataPoints.length > best.length ? s.dataPoints.map((p) => p.label) : best), []);
    return {
      seriesIndex: (ref) => {
        const i = typeof ref === 'number' ? ref : data.series.findIndex((s) => s.name === ref);
        if (!Number.isInteger(i) || i < 0 || i >= data.series.length) throw new RangeError(`Annotation anchor names a missing series '${ref}'.`);
        return i;
      },
      categoryIndex: (ref) => {
        const i = typeof ref === 'number' ? ref : categories.indexOf(ref);
        if (!Number.isInteger(i) || i < 0 || i >= categories.length) throw new RangeError(`Annotation anchor names a missing category '${ref}'.`);
        return i;
      },
      pointIndex: (series, ref) => {
        const points = data.series[series].dataPoints;
        const i = typeof ref === 'number' ? ref : points.findIndex((p) => p.label === ref);
        if (!Number.isInteger(i) || i < 0 || i >= points.length) throw new RangeError(`Annotation anchor names a missing point '${ref}'.`);
        return i;
      },
    };
  }

  private annotationContext(
    canvas: ICanvas,
    data: ChartData,
    layout: { chartAreaWidth: number; chartAreaHeight: number; baselineY: number; topY: number }
  ): AnnotationContext {
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const lookups = this.annotationLookups(data);
    const { chartAreaWidth: width, chartAreaHeight: height, baselineY: baseline } = layout;
    const categoryCount = data.series.reduce((m, s) => Math.max(m, s.dataPoints.length), 0);
    const slot = (vertical ? width : height) / Math.max(1, categoryCount);
    const origin = this.valueOrigin(data, width, height, baseline);
    const topY = baseline - height;
    const coordinates = data.series.map((s) => this.calculateSeriesCoordinates(s, data, width, height, baseline));
    const markPoint = (s: number, p: number): Point => this.annotationMarkPoint(data.series[s], s, p, coordinates[s], data, width, height, baseline);
    const positive = this.appearance.positiveColor ?? toColor('#15803d');
    const negative = this.appearance.negativeColor ?? toColor('#b91c1c');
    return {
      canvas,
      family: this.effectiveFontFamily,
      vertical,
      plot: { x: this._plotLeft, y: topY, width, height },
      chartWidth: this.width,
      chartHeight: this.height,
      textColor: this.appearance.legendTextColor,
      background: this.effectiveBackgroundColor ?? Color.white,
      positive,
      negative,
      categoryCount,
      slot,
      origin,
      labelAllowance: this.showValueLabels ? this.labelFontSize + 7 : 0,
      ...lookups,
      value: (s, p) => data.series[s].dataPoints[p].value,
      markPoint,
      categoryCentre: (i) => (vertical ? this._plotLeft : topY) + slot * (i + 0.5),
      valueToCoordinate: (v) => {
        const f = this.fraction(v);
        return vertical ? baseline - f * height : this._plotLeft + f * width;
      },
      seriesCount: data.series.length,
      categoryPointCount: (s) => data.series[s].dataPoints.length,
      markBoxes: (): AnnotationRect[] => {
        const thickness = this.annotationBarThickness(slot, data.series.length);
        const boxes: AnnotationRect[] = [];
        data.series.forEach((s, si) => {
          for (let p = 0; p < s.dataPoints.length; p++) {
            const m = markPoint(si, p);
            if (thickness === undefined) boxes.push({ x: m.x - 4, y: m.y - 4, width: 8, height: 8 });
            else if (vertical) boxes.push({ x: m.x - thickness / 2, y: Math.min(m.y, origin), width: thickness, height: Math.abs(origin - m.y) });
            else boxes.push({ x: Math.min(m.x, origin), y: m.y - thickness / 2, width: Math.abs(m.x - origin), height: thickness });
          }
        });
        return boxes;
      },
    };
  }

  protected get defaultAutoScale(): boolean {
    return false;
  }
  protected get defaultIncludeZero(): boolean {
    return true;
  }
  protected get defaultClipToPlotArea(): boolean {
    return false;
  }
  protected get supportsInlineLegend(): boolean {
    return false;
  }
  protected get effectiveClipToPlotArea(): boolean {
    return this.clipToPlotArea ?? this.defaultClipToPlotArea;
  }
  protected get effectiveFontFamily(): string {
    return this.resolveFontFamily(this.fontFamily);
  }

  protected drawCompact(_canvas: ICanvas, _data: ChartData): boolean {
    return false;
  }

  protected getValueDataRange(data: ChartData): [number, number] | undefined {
    let min = Infinity;
    let max = -Infinity;
    for (const series of data.series) {
      for (const dp of series.dataPoints) {
        if (Number.isFinite(dp.value)) {
          const index = series.dataPoints.indexOf(dp);
          const amounts = this.errorAmounts(series, index);
          const low = dp.value - (amounts?.minus ?? 0);
          const high = dp.value + (amounts?.plus ?? 0);
          if (low < min) min = low;
          if (high > max) max = high;
        }
      }
    }
    return min <= max ? [min, max] : undefined;
  }

  /** Whether the value axis being drawn is logarithmic. */
  protected get isLogScale(): boolean {
    return (this._renderData ?? this.data).yAxis.scale === 'log';
  }

  /** Whether this chart family can draw a logarithmic value axis. */
  protected get supportsLogAxis(): boolean {
    return this.supportsAnnotations;
  }

  /** The fraction of the value axis, from the minimum (`0`) to the maximum (`1`), at which `value` sits. */
  protected fraction(value: number): number {
    return this.isLogScale ? logFraction(value, this._effectiveMin, this._effectiveMax) : valueFraction(value, this._effectiveMin, this._effectiveMax);
  }

  /** Tick values of a logarithmic axis: the integer powers of its base within the range. */
  protected logTicks(base: number): number[] {
    const lo = Math.ceil(Math.log(this._effectiveMin) / Math.log(base) - 1e-9);
    const hi = Math.floor(Math.log(this._effectiveMax) / Math.log(base) + 1e-9);
    const ticks: number[] = [];
    for (let k = lo; k <= hi; k++) ticks.push(Math.pow(base, k));
    return ticks;
  }

  private resolveLogScale(data: ChartData): void {
    const axis = data.yAxis;
    const base = axis.logBase;
    if (!(base > 1) || !Number.isFinite(base)) throw new RangeError('logBase must be above 1.');
    if ((axis.hasMinValue && !(axis.minValue > 0)) || (axis.hasMaxValue && !(axis.maxValue > 0))) throw new RangeError('A logarithmic axis needs bounds above zero.');
    const range = this.getValueDataRange(data);
    if (range !== undefined && !(range[0] > 0)) throw new RangeError('A logarithmic axis needs every value above zero.');
    const exponent = (v: number): number => Math.log(v) / Math.log(base);
    this._effectiveMin = axis.hasMinValue ? axis.minValue : range === undefined ? 1 : Math.pow(base, Math.floor(exponent(range[0]) + 1e-9));
    this._effectiveMax = axis.hasMaxValue ? axis.maxValue : range === undefined ? base : Math.pow(base, Math.ceil(exponent(range[1]) - 1e-9));
    if (!(this._effectiveMax > this._effectiveMin)) this._effectiveMax = this._effectiveMin * base;
    this._effectiveStepCount = Math.max(1, Math.round(exponent(this._effectiveMax / this._effectiveMin)));
    this._effectiveTickFormat = axis.valueFormat ?? 'G';
  }

  protected resolveValueScale(data: ChartData): void {
    const axis = data.yAxis;
    if (axis.scale === 'log') {
      this.resolveLogScale(data);
      return;
    }
    const useAuto = axis.autoScale || (this.defaultAutoScale && !axis.hasMaxValue);
    if (useAuto) {
      const range = this.getValueDataRange(data);
      if (range) {
        const nice = computeNiceScale(
          range[0],
          range[1],
          axis.stepCount,
          axis.includeZero ?? this.defaultIncludeZero,
          axis.headroom ?? (this.showValueLabels ? 0.05 : 0),
          axis.hasMinValue ? axis.minValue : undefined,
          axis.hasMaxValue ? axis.maxValue : undefined
        );
        this._effectiveMin = nice.minValue;
        this._effectiveMax = nice.maxValue;
        this._effectiveStepCount = nice.stepCount;
        this._effectiveTickFormat = axis.valueFormat ?? nice.autoFormat;
        return;
      }
    }
    this._effectiveMin = axis.minValue;
    this._effectiveMax = axis.maxValue;
    this._effectiveStepCount = axis.stepCount > 0 ? axis.stepCount : 5;
    this._effectiveTickFormat = axis.valueFormat ?? 'N0';
  }

  /** Paints the plot rectangle's fill and border (draw layer L2). */
  private drawPlotArea(canvas: ICanvas, plot: ChartBox): void {
    const plotFill = this._plotAreaFill ?? this.appearance.plotAreaFill;
    const plotBorder = this._plotAreaBorderColor ?? this.appearance.plotAreaBorderColor;
    if (this._depth3d?.walls === true) {
      const { dx, dy } = this.depthShift;
      const { x, y, width, height } = plot;
      const back: ChartBox = { x: x + dx, y: y - dy, width, height };
      const paint = plotFill !== undefined ? plotFill.resolve(this.fillBoxes(back)) : { color: Color.fromHex('#f8fafc') };
      const poly = (pts: number[][]): ChartPathCommand[] => [...pts.map((p, i): ChartPathCommand => ({ op: i === 0 ? 'M' : 'L', values: p })), { op: 'Z', values: [] }];
      fillChartPath(canvas, { commands: poly([[x + dx, y - dy], [x + dx + width, y - dy], [x + dx + width, y + height - dy], [x + dx, y + height - dy]]), ...paint });
      fillChartPath(canvas, { commands: poly([[x, y + height], [x + width, y + height], [x + width + dx, y + height - dy], [x + dx, y + height - dy]]), ...paint });
    } else if (plotFill !== undefined) {
      const { x, y, width, height } = plot;
      const commands: ChartPathCommand[] = [
        { op: 'M', values: [x, y] },
        { op: 'L', values: [x + width, y] },
        { op: 'L', values: [x + width, y + height] },
        { op: 'L', values: [x, y + height] },
        { op: 'Z', values: [] },
      ];
      fillChartPath(canvas, { commands, ...plotFill.resolve(this.fillBoxes(plot)) });
    }
    if (plotBorder !== undefined && this.plotAreaBorderWidth > 0) {
      const inset = this.plotAreaBorderWidth / 2;
      const { x, y, width, height } = plot;
      strokeChartPath(canvas, {
        commands: [
          { op: 'M', values: [x + inset, y + inset] },
          { op: 'L', values: [x + width - inset, y + inset] },
          { op: 'L', values: [x + width - inset, y + height - inset] },
          { op: 'L', values: [x + inset, y + height - inset] },
          { op: 'Z', values: [] },
        ],
        color: plotBorder,
        lineWidth: this.plotAreaBorderWidth,
        lineJoin: 'miter',
      });
    }
  }

  /**
   * The colour and optional gradient of the mark for `dp`: the point's `fill` or `color`, else the series style's
   * `fill`, else the series colour.
   */
  protected resolveMarkPaint(series: ChartSeries, dp: ChartDataPoint | undefined, seriesColor: Color): { color: Color; fill?: ChartFill } {
    const f = dp?.fill ?? (dp?.color !== undefined ? ChartFill.solid(dp.color) : series.style.fill);
    const paint = f === undefined ? { color: seriesColor } : f.kind === 'solid' ? { color: f.color } : { color: f.color, fill: f };
    const dimmed = this.dimMark(series, dp === undefined ? -1 : series.dataPoints.indexOf(dp), paint.color);
    return dimmed === paint.color ? paint : { color: dimmed };
  }

  /** `color` as a mark drawn under the current highlight: unchanged when selected or when nothing is highlighted, else dimmed. */
  protected dimMark(series: ChartSeries, pointIndex: number, color: Color): Color {
    if (this._highlight === undefined) return color;
    const s = (this._renderData ?? this.data).series.indexOf(series);
    return pointIndex >= 0 && this._highlight.selects(s, pointIndex) ? color : dimColor(color, this.effectiveBackgroundColor ?? Color.white, this._highlightKeep);
  }

  /** Effects for the bars of `series`: the series style's, else the bar style's, else the theme's. */
  protected resolveBarEffects(series: ChartSeries, barEffects: readonly ChartResolvedEffect[]): readonly ChartResolvedEffect[] {
    if (series.style.effects.length > 0) return series.style.effects;
    return barEffects.length > 0 ? barEffects : this.appearance.barEffects;
  }

  /** Effects for the line of `series`: the series style's, else the theme's. */
  protected resolveLineEffects(series: ChartSeries): readonly ChartResolvedEffect[] {
    return series.style.effects.length > 0 ? series.style.effects : this.appearance.lineEffects;
  }

  /** The colour of the line and markers of `series`: its own colour, else the theme's stroke palette, else its fill colour. */
  protected resolveSeriesStrokeColor(series: ChartSeries): Color {
    const index = (this._renderData ?? this.data).series.indexOf(series);
    const base = this.rawSeriesStrokeColor(series);
    return this._highlight?.selectsSeries(index) === false ? dimColor(base, this.effectiveBackgroundColor ?? Color.white, this._highlightKeep) : base;
  }

  /** {@link resolveSeriesStrokeColor} before any highlight dimming; value labels dim it per point instead. */
  protected rawSeriesStrokeColor(series: ChartSeries): Color {
    const palette = this.appearance.strokePalette;
    if (!series.hasColor && palette.length > 0) return palette[Math.max(0, (this._renderData ?? this.data).series.indexOf(series)) % palette.length];
    return this.resolveSeriesColor(series);
  }

  protected formatPointValue(dp: ChartDataPoint, overrideValue?: number): string {
    const val = overrideValue ?? dp.value;
    const fmt = dp.hasExplicitLabelFormat ? dp.labelFormat : (this.valueLabelFormat ?? dp.labelFormat);
    return applyChartAffixes(formatChartNumber(val, fmt), this.valueLabelPrefix, this.valueLabelSuffix, this.negativeStyle);
  }

  protected getExtraRightMargin(_canvas: ICanvas, _data: ChartData): number {
    return 0;
  }

  protected drawAfterSeries(
    _canvas: ICanvas,
    _data: ChartData,
    _chartAreaWidth: number,
    _chartAreaHeight: number,
    _baselineY: number,
    _topY: number
  ): void {}

  protected shouldDrawLegend(data: ChartData): boolean {
    if (this.dataTableShown && this.dataTable?.showLegendKeys !== false) return false;
    return this.showLegend && this.legendPosition !== 'none' && data.series.length > 1;
  }

  protected effectiveLegendPosition(): ChartLegendPosition {
    if (this.legendPosition === 'inline' && !this.supportsInlineLegend) return 'top';
    return this.legendPosition;
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    const previousData = this._renderData;
    const prevLeft = this._plotLeft;
    const prevRight = this._plotRight;
    try {
      this._labelBoxes = [];
      this._renderData = data;
      if (data.series.length === 0) return;
      if (this._annotations.length > 0 && !this.supportsAnnotations) throw new Error(`Annotations are not supported on ${this.constructor.name}.`);
      if (this.dataTableShown && this.orientation === ChartOrientation.Horizontal) throw new Error('A data table needs a vertical chart.');
      if (data.yAxis.scale === 'log' && !this.supportsLogAxis) throw new Error(`A logarithmic axis is not supported on ${this.constructor.name}.`);
      if (this._depth3d !== undefined && !this.supportsDepth3d) throw new Error(`3D depth is not supported on ${this.constructor.name}.`);
      if (!this.supportsErrorBars && data.series.some((s) => s.style.errorBars !== undefined || s.dataPoints.some((p) => p.errorPlus !== undefined || p.errorMinus !== undefined))) {
        throw new Error(`Error bars are not supported on ${this.constructor.name}.`);
      }
      this._highlight = undefined;
      if (this._annotations.length > 0) {
        const probe = this.annotationLookups(data);
        this._highlight = resolveHighlight(this._annotations, probe.seriesIndex, probe.categoryIndex, probe.pointIndex);
        this._highlightKeep = this._highlight?.keep ?? 1;
      }
      if (this.timeAxis !== undefined && !this.supportsTimeAxis) throw new Error(`A time axis is not supported on ${this.constructor.name}.`);
      this.resolveTimeScale(data);
      this.resolveValueScale(data);
      checkValueRange(this._effectiveMin, this._effectiveMax);

      if (this.drawCompact(canvas, data)) return;
      const layout = this.calculateLayoutWithCanvas(canvas, data);
      this._plotLeft = layout.plotLeft;
      this._plotRight = layout.plotRight;

      this._currentPlot = { x: this._plotLeft, y: layout.topY, width: layout.chartAreaWidth, height: layout.chartAreaHeight };
      this.drawPlotArea(canvas, this._currentPlot);

      this.drawReferences(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, true);
      const painter = this._annotations.length > 0 ? new ChartAnnotationPainter(this.annotationContext(canvas, data, layout)) : undefined;
      painter?.drawBehind(this._annotations);

      // 1. Grid lines
      if (data.yAxis.showGridLines && this.appearance.gridLineStyle !== 'none') {
        this.drawGridLines(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
      }
      this.drawTimeGridLines(canvas, layout.chartAreaWidth, layout.baselineY, layout.topY);

      // 2. Value-axis labels
      this.drawYAxisLabels(canvas, data, layout.chartAreaHeight, layout.baselineY, layout.topY);

      // 3. Value-axis legend
      if (data.yAxis.legend !== '') {
        this.drawYAxisLegend(
          canvas,
          data.yAxis,
          layout.chartAreaWidth,
          layout.chartAreaHeight,
          layout.topY,
          layout.baselineY
        );
      }

      // 4. Series elements (optionally clipped to plot area)
      if (this.effectiveClipToPlotArea) {
        pushClipRect(canvas, this._plotLeft, layout.topY, layout.chartAreaWidth, layout.chartAreaHeight);
        try {
          this.drawAllSeries(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
        } finally {
          popClip(canvas);
        }
      } else {
        this.drawAllSeries(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
      }

      this.drawAfterSeries(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
      this.drawTrendlines(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);
      this.drawReferences(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, false);

      // 5. Value labels
      if (this.showValueLabels) {
        this.drawValueLabels(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
      }

      // 6. Category-axis labels
      this.drawXAxisLabels(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);

      // 7. Category-axis legend
      if (data.xAxis.legend !== '') {
        this.drawXAxisLegend(canvas, data.xAxis.legend, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);
      }

      this.drawDataTable(canvas, data, layout.chartAreaWidth, layout.baselineY);

      // 8. Axis lines LAST
      if (this.appearance.axisFrame)
        this.drawAxisFrameLines(canvas, layout.chartAreaWidth, layout.baselineY, layout.topY);
      else {
        const baseline =
          this.orientation === ChartOrientation.Horizontal
            ? layout.baselineY
            : this.valueOrigin(data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);
        canvas.drawLine(
          this._plotLeft,
          baseline,
          this._plotLeft + layout.chartAreaWidth,
          baseline,
          this.axisColor,
          this.appearance.axisLineWidth
        );
      }

      painter?.drawFront(this._annotations);

      // 9. Legend
      if (this.shouldDrawLegend(data)) {
        this.drawLegendInPosition(canvas, data, layout);
      }
    } finally {
      this._highlight = undefined;
      this._currentPlot = undefined;
      this._renderData = previousData;
      this._plotLeft = prevLeft;
      this._plotRight = prevRight;
      this._labelBoxes = [];
    }
  }

  protected drawReferences(
    canvas: ICanvas,
    _data: ChartData,
    width: number,
    height: number,
    baseline: number,
    bands: boolean,
    customRefs?: readonly ChartReference[],
    customMin?: number,
    customMax?: number,
    forceHorizontal?: boolean
  ): void {
    const minValue = customMin ?? this._effectiveMin;
    const maxValue = customMax ?? this._effectiveMax;
    const left = this._plotLeft;
    const horizontal = forceHorizontal ?? (this.orientation === ChartOrientation.Horizontal);
    const list = customRefs ?? this.references;
    for (const ref of list) {
      const { value, endValue, thickness = 1, color, dashPattern } = ref;
      if ((endValue !== undefined) !== bands) continue;
      const a = customMin === undefined ? this.fraction(value) : valueFraction(value, minValue, maxValue);
      const paint = toColor(color);
      if (endValue !== undefined) {
        const b = customMin === undefined ? this.fraction(endValue) : valueFraction(endValue, minValue, maxValue);
        const low = Math.max(0, Math.min(a, b));
        const high = Math.min(1, Math.max(a, b));
        if (!(high > low)) continue;
        const rx = horizontal ? left + low * width : left;
        const ry = horizontal ? baseline - height : baseline - high * height;
        const rw = horizontal ? (high - low) * width : width;
        const rh = horizontal ? height : (high - low) * height;
        canvas.fillRect(rx, ry, rw, rh, paint);
        if (ref.label) this.drawReferenceLabel(canvas, ref, rx, ry, rw, rh, true, horizontal, paint);
      } else if (a >= 0 && a <= 1 && Number.isFinite(thickness) && thickness > 0) {
        const x = horizontal ? left + a * width : left;
        const y = baseline - (horizontal ? height : a * height);
        const len = horizontal ? height : width;
        this.drawReferenceLine(canvas, x, y, len, horizontal, paint, thickness, dashPattern);
        if (ref.label) this.drawReferenceLabel(canvas, ref, x, y, horizontal ? 0 : len, horizontal ? len : 0, false, horizontal, paint);
      }
    }
  }

  private drawReferenceLabel(
    canvas: ICanvas,
    ref: ChartReference,
    x: number,
    y: number,
    w: number,
    h: number,
    isBand: boolean,
    verticalLine: boolean,
    baseColor: Color
  ): void {
    const label = ref.label!;
    const fontSize = 8.5;
    const family = this.effectiveFontFamily;
    const measured = canvas.measureText(label, fontSize, family);
    const pos = ref.labelPosition ?? 'end';
    const placement = ref.labelPlacement ?? (isBand ? 'inside' : 'above');
    let textColor = ref.labelColor
      ? toColor(ref.labelColor)
      : baseColor.scA < 0.5
        ? baseColor.withAlpha(1)
        : baseColor;
    if (!ref.labelColor && this.appearance.adaptiveReferenceLabels) {
      // A pale reference colour (a band, typically) is unreadable as text: fall back to the legend text colour.
      const surface = ref.labelBackgroundColor !== undefined ? toColor(ref.labelBackgroundColor) : (this.effectiveBackgroundColor ?? Color.white);
      const opaque = surface.scA < 1 ? blendOverOpaque(surface, Color.white) : surface;
      if (contrastRatio(textColor.scA < 1 ? blendOverOpaque(textColor, opaque) : textColor, opaque) < 4.5) textColor = this.appearance.legendTextColor;
    }

    let tx: number;
    let ty: number;
    let align: TextAlignment;

    if (isBand) {
      if (pos === 'start') {
        tx = x + 6;
        align = TextAlignment.Left;
      } else if (pos === 'center') {
        tx = x + w / 2;
        align = TextAlignment.Center;
      } else {
        tx = x + w - 6;
        align = TextAlignment.Right;
      }
      ty = placement === 'below' ? y + h + 3 : placement === 'above' ? y - fontSize - 3 : y + 4;
    } else if (verticalLine) {
      tx = placement === 'below' ? x - 4 : x + 4;
      align = placement === 'below' ? TextAlignment.Right : TextAlignment.Left;
      ty = pos === 'start' ? y + h - fontSize - 4 : pos === 'center' ? y + h / 2 - fontSize / 2 : y + 4;
    } else {
      if (pos === 'start') {
        tx = x + 4;
        align = TextAlignment.Left;
      } else if (pos === 'center') {
        tx = x + w / 2;
        align = TextAlignment.Center;
      } else {
        tx = x + w - 4;
        align = TextAlignment.Right;
      }
      ty = placement === 'below' ? y + 4 : y - fontSize - 4;
    }

    if (ref.labelBackgroundColor !== undefined) {
      const pillBg = toColor(ref.labelBackgroundColor);
      const px = align === TextAlignment.Right ? tx - measured.width - 4 : align === TextAlignment.Center ? tx - measured.width / 2 - 4 : tx - 4;
      const py = ty - 2;
      const pw = measured.width + 8;
      const ph = fontSize + 4;
      const r = 2;
      const cmds: ChartPathCommand[] = [
        { op: 'M', values: [px + r, py] },
        { op: 'L', values: [px + pw - r, py] },
        { op: 'L', values: [px + pw, py + r] },
        { op: 'L', values: [px + pw, py + ph - r] },
        { op: 'L', values: [px + pw - r, py + ph] },
        { op: 'L', values: [px + r, py + ph] },
        { op: 'L', values: [px, py + ph - r] },
        { op: 'L', values: [px, py + r] },
        { op: 'Z', values: [] },
      ];
      fillChartPath(canvas, { commands: cmds, color: pillBg });
    }

    canvas.drawText(tx, ty, label, textColor, fontSize, family, align);
  }

  private drawReferenceLine(
    canvas: ICanvas,
    x: number,
    y: number,
    length: number,
    vertical: boolean,
    color: Color,
    thickness: number,
    pattern?: readonly number[]
  ): void {
    const draw = (from: number, to: number): void => {
      if (vertical) canvas.drawLine(x, y + from, x, y + to, color, thickness);
      else canvas.drawLine(x + from, y, x + to, y, color, thickness);
    };
    if (!pattern?.length) {
      draw(0, length);
      return;
    }

    const minimum = Math.min(...pattern);
    if (pattern.some((dash) => !Number.isFinite(dash)) || minimum <= 0 || length / minimum > 100_000)
      throw new RangeError('Reference dash lengths must be finite and positive and allow at most 100,000 segments.');
    let from = 0;
    for (let i = 0; from < length; i++) {
      const to = Math.min(length, from + pattern[i % pattern.length]);
      if (i % 2 === 0) draw(from, to);
      from = to;
    }
  }

  protected drawAllSeries(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    data.series.forEach((series, seriesIndex) => {
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);
      withChartGroup(canvas, () => ({ role: 'series', seriesIndex, name: series.name }), () => {
        this.drawSeriesElements(canvas, data, series, coordinates, chartAreaWidth, chartAreaHeight, baselineY, topY);
        this.drawErrorBars(canvas, data, series, coordinates, chartAreaWidth, chartAreaHeight, baselineY);
      });
    });
  }

  /** Draws one mark of a category chart (a bar, a segment, a point) inside a mark group. @internal */
  protected markGroup(canvas: ICanvas, data: ChartData, series: ChartSeries, pointIndex: number, anchor: ChartGroupAnchor | undefined, draw: () => void, value?: number): void {
    withChartGroup(
      canvas,
      () => {
        const point = series.dataPoints[pointIndex];
        const description = this.describeMark('{series}, {label}: {value}', { series: series.name, label: point.label, value: this.formatPointValue(point, value), raw: value ?? point.value });
        return { role: 'mark', seriesIndex: data.series.indexOf(series), pointIndex, name: point.label, description, anchor };
      },
      draw
    );
  }

  /** The amounts below and above the value of a point that its error bars span, or `undefined` when it has none. */
  protected errorAmounts(series: ChartSeries, index: number): { plus: number; minus: number } | undefined {
    const config = series.style.errorBars;
    const point = series.dataPoints[index];
    if (config === undefined && point.errorPlus === undefined && point.errorMinus === undefined) return undefined;
    let plus: number;
    let minus: number;
    if (config === undefined) {
      plus = point.errorPlus ?? point.errorMinus ?? 0;
      minus = point.errorMinus ?? point.errorPlus ?? 0;
    } else {
      const values = series.dataPoints.map((p) => p.value);
      let base = config.amount;
      if (config.type === 'percent') base = (Math.abs(point.value) * config.amount) / 100;
      else if (config.type === 'stdDev') base = sampleStandardDeviation(values) * config.amount;
      else if (config.type === 'stdError') base = (sampleStandardDeviation(values) / Math.sqrt(values.length)) * config.amount;
      const direction = config.direction ?? 'both';
      plus = direction === 'minus' ? 0 : base;
      minus = direction === 'plus' ? 0 : base;
      if (point.errorPlus !== undefined) plus = point.errorPlus;
      if (point.errorMinus !== undefined) minus = point.errorMinus;
    }
    if (!(plus >= 0 && minus >= 0) || !Number.isFinite(plus + minus)) throw new RangeError('Error bar amounts must be finite and nonnegative.');
    return { plus, minus };
  }

  private drawErrorBars(canvas: ICanvas, data: ChartData, series: ChartSeries, coordinates: Point[], chartAreaWidth: number, chartAreaHeight: number, baselineY: number): void {
    const config = series.style.errorBars;
    const seriesIndex = data.series.indexOf(series);
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const color = config?.color !== undefined ? toColor(config.color) : this.appearance.legendTextColor;
    const width = config?.width ?? 1;
    const cap = config?.capWidth ?? 6;
    for (let i = 0; i < series.dataPoints.length; i++) {
      const amounts = this.errorAmounts(series, i);
      if (amounts === undefined) continue;
      if (!this.supportsAnnotations) throw new Error(`Error bars are not supported on ${this.constructor.name}.`);
      const mark = this.annotationMarkPoint(series, seriesIndex, i, coordinates, data, chartAreaWidth, chartAreaHeight, baselineY);
      const value = series.dataPoints[i].value;
      const toCoordinate = (v: number): number => {
        const f = this.fraction(v);
        return vertical ? baselineY - f * chartAreaHeight : this._plotLeft + f * chartAreaWidth;
      };
      const c = vertical ? mark.x : mark.y;
      const low = toCoordinate(value - amounts.minus);
      const high = toCoordinate(value + amounts.plus);
      const at = (cc: number, h: number): Point => (vertical ? new Point(cc, h) : new Point(h, cc));
      const a = at(c, low);
      const b = at(c, high);
      canvas.drawLine(a.x, a.y, b.x, b.y, color, width);
      for (const [amount, h] of [[amounts.minus, low], [amounts.plus, high]] as const) {
        if (amount <= 0 || cap <= 0) continue;
        const p = at(c - cap / 2, h);
        const q = at(c + cap / 2, h);
        canvas.drawLine(p.x, p.y, q.x, q.y, color, width);
      }
    }
  }

  protected drawTrendlines(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): void {
    if (this._trendlines.length === 0) return;
    if (this.timeAxisActive) throw new Error('Trendlines cannot be combined with a time axis.');
    if (!this.supportsAnnotations) throw new Error(`Trendlines are not supported on ${this.constructor.name}.`);
    const vertical = this.orientation !== ChartOrientation.Horizontal;
    const categories = data.series.reduce((m, s) => Math.max(m, s.dataPoints.length), 0);
    const axisStart = vertical ? this._plotLeft : baselineY - chartAreaHeight;
    const slot = (vertical ? chartAreaWidth : chartAreaHeight) / Math.max(1, categories);
    const family = this.effectiveFontFamily;
    this._trendlines.forEach((t) => {
      const index = typeof t.series === 'number' ? t.series : data.series.findIndex((s) => s.name === t.series);
      if (!Number.isInteger(index) || index < 0 || index >= data.series.length) throw new RangeError(`Trendline names a missing series '${t.series}'.`);
      const series = data.series[index];
      const xs = series.dataPoints.map((_, i) => i + 1);
      const ys = series.dataPoints.map((p) => p.value);
      const fit = fitTrendline(t.type, xs, ys, t.order ?? 2, t.period ?? 2);
      const color = t.color !== undefined ? toColor(t.color) : this.rawSeriesStrokeColor(series);
      const pts = fit.points.map((p) => {
        const c = axisStart + slot * (p.x - 0.5);
        const f = this.fraction(p.y);
        const h = vertical ? baselineY - f * chartAreaHeight : this._plotLeft + f * chartAreaWidth;
        return vertical ? new Point(c, h) : new Point(h, c);
      });
      this.strokeFit(canvas, t, fit, pts, color, family, vertical);
    });
  }

  /** Draws a fitted trendline through its mapped points, with its equation and R² labels. */
  protected strokeFit(canvas: ICanvas, t: ChartTrendline, fit: { equation: string | undefined; r2: number | undefined }, pts: Point[], color: Color, family: string, vertical: boolean): void {
    if (pts.length < 2) return;
    const commands: ChartPathCommand[] = pts.map((p, i) => ({ op: i === 0 ? 'M' : 'L', values: [p.x, p.y] }));
    strokeChartPath(canvas, { commands, color, lineWidth: 1.5, lineCap: 'round', lineJoin: 'round', miterLimit: 10, dashPattern: t.dashPattern ?? [6, 4] });
    const lines: string[] = [];
    if ((t.label === 'equation' || t.label === 'both') && fit.equation !== undefined) lines.push(fit.equation);
    if ((t.label === 'r2' || t.label === 'both') && fit.r2 !== undefined) lines.push(`R² = ${formatSignificant(fit.r2)}`);
    const end = pts[pts.length - 1];
    lines.forEach((text, i) => {
      if (vertical) canvas.drawText(end.x, end.y - 14 - (lines.length - 1 - i) * 11, text, color, 9, family, TextAlignment.Right);
      else canvas.drawText(end.x - 4, end.y - 14 - (lines.length - 1 - i) * 11, text, color, 9, family, TextAlignment.Right);
    });
  }

  protected calculateSeriesCoordinates(
    series: ChartSeries,
    _data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): Point[] {
    const dataPointCount = series.dataPoints.length;
    const coordinates: Point[] = [];
    if (dataPointCount === 0) return coordinates;

    if (this.timeAxisActive) {
      for (let i = 0; i < dataPointCount; i++) {
        coordinates.push(new Point(this.timeX(series.dataPoints[i], chartAreaWidth), baselineY - this.fraction(series.dataPoints[i].value) * chartAreaHeight));
      }
      return coordinates;
    }

    if (this.orientation === ChartOrientation.Horizontal) {
      const topY = baselineY - chartAreaHeight;
      const totalSpace = chartAreaHeight / dataPointCount;
      for (let i = 0; i < dataPointCount; i++) {
        const y = topY + i * totalSpace + totalSpace / 2;
        const normalizedValue = this.fraction(series.dataPoints[i].value);
        const x = this._plotLeft + normalizedValue * chartAreaWidth;
        coordinates.push(new Point(x, y));
      }
    } else {
      const totalSpace = chartAreaWidth / dataPointCount;
      for (let i = 0; i < dataPointCount; i++) {
        const x = this._plotLeft + i * totalSpace + totalSpace / 2;
        const normalizedValue = this.fraction(series.dataPoints[i].value);
        const y = baselineY - normalizedValue * chartAreaHeight;
        coordinates.push(new Point(x, y));
      }
    }

    return coordinates;
  }

  /** @internal */
  protected valueOrigin(_data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number): number {
    const fraction = originFraction(this._effectiveMin, this._effectiveMax);
    return this.orientation === ChartOrientation.Horizontal
      ? this._plotLeft + fraction * chartAreaWidth
      : baselineY - fraction * chartAreaHeight;
  }

  protected abstract drawSeriesElements(
    canvas: ICanvas,
    data: ChartData,
    series: ChartSeries,
    coordinates: Point[],
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void;

  /** Places a bar value label inside, outside, or auto-selected with WCAG luminance contrast. */
  protected drawBarValueLabel(
    canvas: ICanvas,
    barX: number,
    barY: number,
    barW: number,
    barH: number,
    text: string,
    barColor: Color,
    below: boolean,
    offset: number,
    pointX: number,
    pointY: number,
    outsideAlignCenter = true,
    outsideColor: Color = barColor
  ): void {
    const family = this.effectiveFontFamily;
    const pos = this.valueLabelPosition;
    if (pos === 'inside' || pos === 'auto') {
      const measured = canvas.measureText(text, this.labelFontSize, family);
      const absW = Math.abs(barW);
      const absH = Math.abs(barH);
      const fits = absW >= measured.width + 6 && absH >= this.labelFontSize + 6;
      if (fits) {
        const rx = barW < 0 ? barX + barW : barX;
        const ry = barH < 0 ? barY + barH : barY;
        const contrast = contrastTextColor(barColor);
        canvas.drawText(
          rx + absW / 2,
          ry + absH / 2 - this.labelFontSize / 2,
          text,
          contrast,
          this.labelFontSize,
          family,
          TextAlignment.Center
        );
        return;
      }
      if (pos === 'inside') return;
    }

    if (this.orientation === ChartOrientation.Horizontal) {
      this.drawPlacedLabel(
        canvas,
        below ? pointX - offset : pointX + offset,
        pointY - this.labelFontSize / 2,
        text,
        outsideColor,
        this.labelFontSize,
        family,
        below ? TextAlignment.Right : TextAlignment.Left
      );
    } else {
      this.drawPlacedLabel(
        canvas,
        pointX,
        below ? pointY + offset : pointY - offset - this.labelFontSize,
        text,
        outsideColor,
        this.labelFontSize,
        family,
        outsideAlignCenter ? TextAlignment.Center : TextAlignment.Left
      );
    }
  }

  protected drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    if (!this.showValueLabels) return;
    const family = this.effectiveFontFamily;

    for (const series of data.series) {
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);
      const rawLabelColor = this.rawSeriesStrokeColor(series);
      const offset = this.getLabelVerticalOffset(series);

      for (let i = 0; i < series.dataPoints.length; i++) {
        const labelColor = this.dimMark(series, i, rawLabelColor);
        const point = coordinates[i];
        const text = this.formatPointValue(series.dataPoints[i]);
        const below = isBelowOrigin(series.dataPoints[i].value, this._effectiveMin, this._effectiveMax);

        if (this.orientation === ChartOrientation.Horizontal) {
          this.drawPlacedLabel(
            canvas,
            below ? point.x - offset : point.x + offset,
            point.y - this.labelFontSize / 2,
            text,
            labelColor,
            this.labelFontSize,
            family,
            below ? TextAlignment.Right : TextAlignment.Left
          );
        } else {
          this.drawPlacedLabel(
            canvas,
            point.x,
            below ? point.y + offset : point.y - offset - this.labelFontSize,
            text,
            labelColor,
            this.labelFontSize,
            family,
            TextAlignment.Center
          );
        }
      }
    }
  }

  protected getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  protected drawLegendSwatch(canvas: ICanvas, x: number, y: number, size: number, series: ChartSeries): void {
    canvas.fillRect(x, y, size, size, this.resolveSeriesColor(series));
  }

  protected drawLegendInPosition(
    canvas: ICanvas,
    data: ChartData,
    layout: { plotLeft: number; plotRight: number; chartAreaWidth: number; chartAreaHeight: number; baselineY: number; topY: number }
  ): void {
    const pos = this.effectiveLegendPosition();
    if (pos === 'none') return;
    if (pos === 'bottom') {
      this.drawLegend(canvas, data, layout.chartAreaWidth);
      return;
    }
    const family = this.effectiveFontFamily;
    if (pos === 'top') {
      const t = this.appearance;
      let y = data.title !== '' ? t.titleY + t.titleFontSize + (data.subtitle !== '' ? 19 : 8) : 10;
      let x = this._plotLeft;
      for (const series of data.series) {
        const w = canvas.measureText(series.name, 11, family).width + 32;
        if (x + w > this.width - 16 && x > this._plotLeft) {
          x = this._plotLeft;
          y += 18;
        }
        this.drawLegendSwatch(canvas, x, y, 12, series);
        canvas.drawText(x + 18, y, series.name, this.axisColor, 11, family, TextAlignment.Left);
        x += w;
      }
      return;
    }
    if (pos === 'right') {
      const rowH = 20;
      const totalH = data.series.length * rowH;
      const startY = layout.topY + Math.max(0, (layout.chartAreaHeight - totalH) / 2);
      const x = this._plotLeft + layout.chartAreaWidth + 16;
      for (let i = 0; i < data.series.length; i++) {
        const series = data.series[i];
        const y = startY + i * rowH;
        this.drawLegendSwatch(canvas, x, y, 12, series);
        canvas.drawText(x + 18, y, series.name, this.axisColor, 11, family, TextAlignment.Left);
      }
      return;
    }
    if (pos === 'inline') {
      const items: { series: ChartSeries; targetY: number; y: number }[] = [];
      for (const series of data.series) {
        const coords = this.calculateSeriesCoordinates(series, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY);
        if (coords.length === 0) continue;
        const last = coords[coords.length - 1];
        items.push({ series, targetY: last.y - 5.5, y: last.y - 5.5 });
      }
      items.sort((a, b) => a.targetY - b.targetY);
      const minGap = 14;
      for (let i = 1; i < items.length; i++) {
        if (items[i].y < items[i - 1].y + minGap) items[i].y = items[i - 1].y + minGap;
      }
      const maxY = layout.baselineY - 11;
      if (items.length > 0 && items[items.length - 1].y > maxY) {
        items[items.length - 1].y = maxY;
        for (let i = items.length - 2; i >= 0; i--) {
          if (items[i].y > items[i + 1].y - minGap) items[i].y = items[i + 1].y - minGap;
        }
      }
      const x = this._plotLeft + layout.chartAreaWidth + 8;
      for (const item of items) {
        canvas.drawText(x, item.y, item.series.name, this.resolveSeriesColor(item.series), 10, family, TextAlignment.Left);
      }
    }
  }

  protected drawLegend(canvas: ICanvas, data: ChartData, _chartAreaWidth: number): void {
    const family = this.effectiveFontFamily;
    const captionLift = this.caption !== '' ? 16 : 0;
    if (this.appearance.flowLegend) {
      let x = this._plotLeft;
      let y = this.height - 42 - captionLift;
      for (const series of data.series) {
        const w = canvas.measureText(series.name, 11, family).width + 32;
        if (x + w > this.width - 16 && x > this._plotLeft) {
          x = this._plotLeft;
          y += 18;
        }
        if (y + 12 > this.height - 4 - captionLift) break;
        this.drawLegendSwatch(canvas, x, y, 12, series);
        canvas.drawText(x + 18, y, series.name, this.axisColor, 11, family, TextAlignment.Left);
        x += w;
      }
      return;
    }
    const legendY = this.height - 40 - captionLift;
    const legendStartX = this._plotLeft;
    const legendItemWidth = 150;
    const colorBoxSize = 12;

    for (let i = 0; i < data.series.length; i++) {
      const series = data.series[i];
      const x = legendStartX + i * legendItemWidth;

      this.drawLegendSwatch(canvas, x, legendY, colorBoxSize, series);

      canvas.drawText(
        x + colorBoxSize + 5,
        legendY + colorBoxSize / 2 - CartesianChartBase.LEGEND_FONT_SIZE / 2,
        series.name,
        this.axisColor,
        CartesianChartBase.LEGEND_FONT_SIZE,
        family,
        TextAlignment.Left
      );
    }
  }

  protected drawGridLines(
    canvas: ICanvas,
    _data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    const stepCount = this._effectiveStepCount > 0 ? this._effectiveStepCount : 5;
    const dashed = this.appearance.gridLineStyle === 'dashed';

    if (this.isLogScale) {
      this.drawLogGridLines(canvas, _data, chartAreaWidth, chartAreaHeight, baselineY, topY, dashed);
      return;
    }
    const wall = this.wallShift;
    if (this.orientation === ChartOrientation.Horizontal) {
      const stepWidth = chartAreaWidth / stepCount;
      for (let i = 1; i <= stepCount; i++) {
        const x = this._plotLeft + i * stepWidth + wall.x;
        if (dashed) {
          strokeChartPath(canvas, {
            commands: [{ op: 'M', values: [x, topY + wall.y] }, { op: 'L', values: [x, baselineY + wall.y] }],
            color: this.gridLineColor,
            lineWidth: CartesianChartBase.GRID_LINE_WIDTH,
            dashPattern: [3, 3],
          });
        } else {
          canvas.drawLine(x, topY + wall.y, x, baselineY + wall.y, this.gridLineColor, CartesianChartBase.GRID_LINE_WIDTH);
        }
      }
    } else {
      const stepHeight = chartAreaHeight / stepCount;
      for (let i = 1; i <= stepCount; i++) {
        const y = baselineY - i * stepHeight + wall.y;
        const x1 = this._plotLeft + wall.x;
        const x2 = this._plotLeft + chartAreaWidth + wall.x;
        if (dashed) {
          strokeChartPath(canvas, {
            commands: [{ op: 'M', values: [x1, y] }, { op: 'L', values: [x2, y] }],
            color: this.gridLineColor,
            lineWidth: CartesianChartBase.GRID_LINE_WIDTH,
            dashPattern: [3, 3],
          });
        } else {
          canvas.drawLine(x1, y, x2, y, this.gridLineColor, CartesianChartBase.GRID_LINE_WIDTH);
        }
      }
    }
  }

  protected drawAxisFrameLines(canvas: ICanvas, chartAreaWidth: number, baselineY: number, topY: number): void {
    canvas.beginCrispEdges?.();
    canvas.drawLine(this._plotLeft, topY, this._plotLeft, baselineY, this.axisColor, CartesianChartBase.AXIS_LINE_WIDTH);
    canvas.drawLine(
      this._plotLeft,
      baselineY,
      this._plotLeft + chartAreaWidth,
      baselineY,
      this.axisColor,
      CartesianChartBase.AXIS_LINE_WIDTH
    );
    canvas.endCrispEdges?.();
  }

  protected static drawAxisLines(canvas: ICanvas, chartAreaWidth: number, baselineY: number, topY: number): void {
    canvas.beginCrispEdges?.();
    canvas.drawLine(
      CartesianChartBase.LEFT_PADDING,
      topY,
      CartesianChartBase.LEFT_PADDING,
      baselineY,
      CartesianChartBase.AXIS_COLOR,
      CartesianChartBase.AXIS_LINE_WIDTH
    );
    canvas.drawLine(
      CartesianChartBase.LEFT_PADDING,
      baselineY,
      CartesianChartBase.LEFT_PADDING + chartAreaWidth,
      baselineY,
      CartesianChartBase.AXIS_COLOR,
      CartesianChartBase.AXIS_LINE_WIDTH
    );
    canvas.endCrispEdges?.();
  }

  private drawLogGridLines(canvas: ICanvas, data: ChartData, chartAreaWidth: number, chartAreaHeight: number, baselineY: number, topY: number, dashed: boolean): void {
    const base = data.yAxis.logBase;
    const horizontal = this.orientation === ChartOrientation.Horizontal;
    const wall = this.wallShift;
    const line = (v: number, width: number): void => {
      const f = this.fraction(v);
      if (!(f > 0.0000001 && f <= 1.0000001)) return;
      const [x1, y1, x2, y2] = horizontal
        ? [this._plotLeft + f * chartAreaWidth + wall.x, topY + wall.y, this._plotLeft + f * chartAreaWidth + wall.x, baselineY + wall.y]
        : [this._plotLeft + wall.x, baselineY - f * chartAreaHeight + wall.y, this._plotLeft + chartAreaWidth + wall.x, baselineY - f * chartAreaHeight + wall.y];
      if (dashed) strokeChartPath(canvas, { commands: [{ op: 'M', values: [x1, y1] }, { op: 'L', values: [x2, y2] }], color: this.gridLineColor, lineWidth: width, dashPattern: [3, 3] });
      else canvas.drawLine(x1, y1, x2, y2, this.gridLineColor, width);
    };
    for (const t of this.logTicks(base)) line(t, CartesianChartBase.GRID_LINE_WIDTH);
    if (data.yAxis.showMinorGridLines) {
      const lo = Math.floor(Math.log(this._effectiveMin) / Math.log(base) + 1e-9);
      const hi = Math.ceil(Math.log(this._effectiveMax) / Math.log(base) - 1e-9);
      for (let k = lo; k < hi; k++) for (let m = 2; m < base; m++) line(m * Math.pow(base, k), CartesianChartBase.GRID_LINE_WIDTH / 2);
    }
  }

  protected drawYAxisLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    const stepCount = this._effectiveStepCount > 0 ? this._effectiveStepCount : 5;
    const minValue = this._effectiveMin;
    const maxValue = this._effectiveMax;
    const stepValue = (maxValue - minValue) / stepCount;
    const family = this.effectiveFontFamily;
    const fmt = this._effectiveTickFormat;

    if (this.isLogScale) {
      const horizontal = this.orientation === ChartOrientation.Horizontal;
      const width = this.width - this._plotLeft - this._plotRight;
      for (const v of this.logTicks(data.yAxis.logBase)) {
        const f = this.fraction(v);
        const label = applyChartAffixes(formatChartNumber(v, fmt), data.yAxis.prefix, data.yAxis.suffix, data.yAxis.negativeStyle);
        if (horizontal) canvas.drawText(this._plotLeft + f * width, baselineY + 8, label, this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, TextAlignment.Center);
        else canvas.drawText(this._plotLeft - 8, baselineY - f * chartAreaHeight - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2, label, this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, TextAlignment.Right);
      }
      return;
    }

    if (this.orientation === ChartOrientation.Horizontal) {
      const chartAreaWidth = this.width - this._plotLeft - this._plotRight;
      const stepWidth = chartAreaWidth / stepCount;
      for (let i = 0; i <= stepCount; i++) {
        const x = this._plotLeft + i * stepWidth;
        const value = minValue + i * stepValue;
        const label = applyChartAffixes(formatChartNumber(value, fmt), data.yAxis.prefix, data.yAxis.suffix, data.yAxis.negativeStyle);
        canvas.drawText(x, baselineY + 8, label, this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, TextAlignment.Center);
      }
    } else {
      const stepHeight = chartAreaHeight / stepCount;
      for (let i = 0; i <= stepCount; i++) {
        const y = baselineY - i * stepHeight;
        const value = minValue + i * stepValue;
        const label = applyChartAffixes(formatChartNumber(value, fmt), data.yAxis.prefix, data.yAxis.suffix, data.yAxis.negativeStyle);
        canvas.drawText(
          this._plotLeft - 8,
          y - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2,
          label,
          this.axisColor,
          CartesianChartBase.AXIS_LABEL_FONT_SIZE,
          family,
          TextAlignment.Right
        );
      }
    }
  }

  protected drawYAxisLegend(
    canvas: ICanvas,
    yAxis: AxisOptions,
    chartAreaWidth: number,
    chartAreaHeight: number,
    topY: number,
    _baselineY: number
  ): void {
    const family = this.effectiveFontFamily;
    if (this.orientation === ChartOrientation.Horizontal) {
      const x = this._plotLeft + chartAreaWidth / 2;
      const y = this.height - 15 - (this.caption !== '' ? 16 : 0);
      canvas.drawText(x, y, yAxis.legend, this.axisColor, CartesianChartBase.LEGEND_FONT_SIZE, family, TextAlignment.Center);
    } else if (yAxis.verticalLegend) {
      const x = 15;
      const textWidth = canvas.measureText(yAxis.legend, CartesianChartBase.LEGEND_FONT_SIZE, family).width;
      const y = topY + chartAreaHeight / 2 + textWidth / 2 - CartesianChartBase.LEGEND_FONT_SIZE;
      canvas.drawTextRotated(x, y, yAxis.legend, this.axisColor, CartesianChartBase.LEGEND_FONT_SIZE, family, 90);
    } else {
      const x = 10;
      const y = topY + chartAreaHeight / 2;
      canvas.drawText(x, y, yAxis.legend, this.axisColor, CartesianChartBase.LEGEND_FONT_SIZE, family, TextAlignment.Left);
    }
  }

  protected drawXAxisLegend(
    canvas: ICanvas,
    legend: string,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): void {
    const family = this.effectiveFontFamily;
    if (this.orientation === ChartOrientation.Horizontal) {
      const x = 15;
      const textWidth = canvas.measureText(legend, CartesianChartBase.LEGEND_FONT_SIZE, family).width;
      const y =
        CartesianChartBase.TITLE_AREA_HEIGHT +
        chartAreaHeight / 2 +
        textWidth / 2 -
        CartesianChartBase.LEGEND_FONT_SIZE;
      canvas.drawTextRotated(x, y, legend, this.axisColor, CartesianChartBase.LEGEND_FONT_SIZE, family, 90);
    } else {
      const x = this._plotLeft + chartAreaWidth / 2;
      const labelsBottom = baselineY + 15 + CartesianChartBase.AXIS_LABEL_FONT_SIZE;
      const marginBottom = baselineY + CartesianChartBase.BOTTOM_PADDING;
      const y = (labelsBottom + marginBottom) / 2 - CartesianChartBase.LEGEND_FONT_SIZE / 2;
      canvas.drawText(x, y, legend, this.axisColor, CartesianChartBase.LEGEND_FONT_SIZE, family, TextAlignment.Center);
    }
  }

  private wrapLabelTwoLines(canvas: ICanvas, text: string, maxWidth: number, fontSize: number, family: string): string[] {
    if (canvas.measureText(text, fontSize, family).width <= maxWidth) return [text];
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
      let truncated = text;
      while (truncated.length > 1 && canvas.measureText(truncated + '...', fontSize, family).width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      return [truncated + '...'];
    }
    let bestSplit = 1;
    let bestMax = Infinity;
    for (let s = 1; s < words.length; s++) {
      const w1 = canvas.measureText(words.slice(0, s).join(' '), fontSize, family).width;
      const w2 = canvas.measureText(words.slice(s).join(' '), fontSize, family).width;
      const m = Math.max(w1, w2);
      if (m < bestMax) {
        bestMax = m;
        bestSplit = s;
      }
    }
    return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
  }

  protected resolveEffectiveOverflow(canvas: ICanvas, data: ChartData, chartAreaWidth: number): 'omit' | 'rotate' | 'wrap' {
    const mode = data.xAxis.labelOverflow;
    if (mode !== 'auto') return mode;
    const pts = data.series[0]?.dataPoints ?? [];
    if (pts.length === 0) return 'omit';
    const slot = chartAreaWidth / pts.length;
    const family = this.effectiveFontFamily;
    let collides = false;
    let allFitTwoLines = true;
    for (const dp of pts) {
      const w = canvas.measureText(dp.label, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family).width;
      if (w > slot - 4) {
        collides = true;
        const lines = this.wrapLabelTwoLines(canvas, dp.label, slot - 4, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family);
        if (lines.some((l) => l.endsWith('...') || canvas.measureText(l, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family).width > slot - 2)) {
          allFitTwoLines = false;
        }
      }
    }
    if (!collides) return 'omit';
    return allFitTwoLines ? 'wrap' : 'rotate';
  }

  protected drawXAxisLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): void {
    if (data.series.length === 0) return;
    if (this.timeAxisActive) {
      this.drawTimeAxisLabels(canvas, chartAreaWidth, baselineY);
      return;
    }

    const firstSeries = data.series[0];
    const dataPointCount = firstSeries.dataPoints.length;
    if (dataPointCount === 0) return;
    const family = this.effectiveFontFamily;

    if (this.orientation === ChartOrientation.Horizontal) {
      const topY = baselineY - chartAreaHeight;
      const totalSpace = chartAreaHeight / dataPointCount;
      for (let i = 0; i < dataPointCount; i++) {
        const y = topY + i * totalSpace + totalSpace / 2;
        const label = firstSeries.dataPoints[i].label;
        this.drawPlacedLabel(
          canvas,
          this._plotLeft - 8,
          y - CartesianChartBase.AXIS_LABEL_FONT_SIZE / 2,
          label,
          this.axisColor,
          CartesianChartBase.AXIS_LABEL_FONT_SIZE,
          family,
          TextAlignment.Right
        );
      }
    } else {
      const labelY = baselineY + 15;
      const totalSpace = chartAreaWidth / dataPointCount;
      const overflow = this.resolveEffectiveOverflow(canvas, data, chartAreaWidth);

      for (let i = 0; i < dataPointCount; i++) {
        const x = this._plotLeft + i * totalSpace + totalSpace / 2;
        const label = firstSeries.dataPoints[i].label;
        if (overflow === 'rotate') {
          const w = canvas.measureText(label, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family).width;
          const dx = w * Math.SQRT1_2;
          canvas.drawTextRotated(x - dx * 0.5, labelY + dx * 0.5, label, this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, 45);
        } else if (overflow === 'wrap') {
          const lines = this.wrapLabelTwoLines(canvas, label, totalSpace - 4, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family);
          for (let li = 0; li < lines.length; li++) {
            canvas.drawText(
              x,
              labelY + li * (CartesianChartBase.AXIS_LABEL_FONT_SIZE + 2),
              lines[li],
              this.axisColor,
              CartesianChartBase.AXIS_LABEL_FONT_SIZE,
              family,
              TextAlignment.Center
            );
          }
        } else {
          this.drawPlacedLabel(
            canvas,
            x,
            labelY,
            label,
            this.axisColor,
            CartesianChartBase.AXIS_LABEL_FONT_SIZE,
            family,
            TextAlignment.Center
          );
        }
      }
    }
  }

  /** @internal */
  protected drawConnectingLine(canvas: ICanvas, coordinates: Point[], color: Color, lineWidth: number): void {
    if (coordinates.length < 2) return;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      canvas.drawLine(p1.x, p1.y, p2.x, p2.y, color, lineWidth);
    }
  }

  /** Draws a series curve using `strokeChartPath` when curved/dashed, or `drawConnectingLine` for linear solid lines. */
  protected drawSeriesLine(
    canvas: ICanvas,
    coordinates: Point[],
    color: Color,
    lineWidth: number,
    curve: ChartCurveMode = 'linear',
    dashPattern?: readonly number[],
    effects?: readonly ChartResolvedEffect[]
  ): void {
    if (coordinates.length < 2) return;
    const hasDash = dashPattern !== undefined && dashPattern.length > 0;
    if (curve === 'linear' && !hasDash && !(effects && effects.length > 0)) {
      this.drawConnectingLine(canvas, coordinates, color, lineWidth);
      return;
    }
    if (hasDash) validateDashPattern(dashPattern, polylineLength(coordinates));
    const commands = buildCurveCommands(coordinates, curve, this.orientation === ChartOrientation.Horizontal);
    strokeChartPath(canvas, {
      commands,
      color,
      lineWidth,
      lineCap: hasDash ? 'butt' : 'round',
      lineJoin: 'round',
      dashPattern,
      effects: effects && effects.length > 0 ? effects : undefined,
    });
  }

  protected getDefaultSeriesColor(): Color {
    return Color.fromHex('#4f46e5');
  }

  protected resolveSeriesColor(series: ChartSeries): Color {
    if (series.hasColor) return series.color;
    const color = this.getDefaultSeriesColor();
    return themedSeriesColor(this.appearance, color, (this._renderData ?? this.data).series.indexOf(series));
  }

  protected resolveSeriesPattern(series: ChartSeries, index: number): ChartPatternKind {
    if (series.style?.pattern !== undefined) return series.style.pattern;
    const patterns = this.appearance.seriesPatterns;
    return patterns.length > 0 ? patterns[Math.max(0, index) % patterns.length] : 'none';
  }

  protected resolveSeriesMarkerShape(series: ChartSeries, index: number, fallback: ChartMarkerShape = 'circle'): ChartMarkerShape {
    if (series.style?.markerShape !== undefined) return series.style.markerShape;
    const shapes = this.appearance.seriesMarkerShapes;
    return shapes.length > 0 ? shapes[Math.max(0, index) % shapes.length] : fallback;
  }

  protected resolveSeriesDashPattern(series: ChartSeries, index: number): readonly number[] | undefined {
    if (series.style?.dashPattern !== undefined) return series.style.dashPattern;
    const dashes = this.appearance.seriesDashPatterns;
    return dashes.length > 0 ? dashes[Math.max(0, index) % dashes.length] : undefined;
  }

  protected reservesBottomLegendBand(data: ChartData): boolean {
    if (this.shouldDrawLegend(data) && this.effectiveLegendPosition() === 'bottom') return true;
    if (this.orientation === ChartOrientation.Horizontal) return data.yAxis.legend !== '';
    return data.xAxis.legend !== '';
  }

  protected calculateLayout(data: ChartData): {
    chartAreaWidth: number;
    chartAreaHeight: number;
    baselineY: number;
    topY: number;
  } {
    const topBand = (data.title !== '' ? CartesianChartBase.TITLE_AREA_HEIGHT : CartesianChartBase.TOP_PADDING) + this.depthShift.dy;
    const bottomBand =
      (this.reservesBottomLegendBand(data) ? CartesianChartBase.BOTTOM_PADDING : CartesianChartBase.AXIS_LABEL_BAND) + this.dataTableHeight(data) + this.getExtraBottomBand(data);

    const chartAreaWidth = this.width - CartesianChartBase.LEFT_PADDING - CartesianChartBase.RIGHT_PADDING;
    const chartAreaHeight = this.height - topBand - bottomBand;
    const baselineY = topBand + chartAreaHeight;
    const topY = topBand;

    return { chartAreaWidth, chartAreaHeight, baselineY, topY };
  }

  protected calculateLayoutWithCanvas(
    canvas: ICanvas,
    data: ChartData
  ): {
    plotLeft: number;
    plotRight: number;
    chartAreaWidth: number;
    chartAreaHeight: number;
    baselineY: number;
    topY: number;
  } {
    const extraRight = this.getExtraRightMargin(canvas, data) + this.depthShift.dx;
    // Content sits inside the card, so every margin grows by the card inset.
    const cardInset = this.effectiveCardInset;
    const hasEnhancedLayout =
      this.autoLayout ||
      cardInset > 0 ||
      data.subtitle !== '' ||
      this.caption !== '' ||
      this.legendPosition !== 'bottom' ||
      data.xAxis.labelOverflow !== 'omit' ||
      extraRight > 0;

    if (!hasEnhancedLayout) {
      const base = this.calculateLayout(data);
      return {
        plotLeft: CartesianChartBase.LEFT_PADDING,
        plotRight: CartesianChartBase.RIGHT_PADDING,
        ...base,
      };
    }

    const family = this.effectiveFontFamily;
    let plotLeft = CartesianChartBase.LEFT_PADDING;
    let plotRight = Math.max(CartesianChartBase.RIGHT_PADDING, extraRight);

    if (this.autoLayout) {
      let maxLeftText = 0;
      if (this.orientation === ChartOrientation.Horizontal) {
        for (const dp of data.series[0]?.dataPoints ?? []) {
          const w = canvas.measureText(dp.label, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family).width;
          if (w > maxLeftText) maxLeftText = w;
        }
      } else {
        const steps = this._effectiveStepCount > 0 ? this._effectiveStepCount : 5;
        const stepVal = (this._effectiveMax - this._effectiveMin) / steps;
        for (let i = 0; i <= steps; i++) {
          const v = this._effectiveMin + i * stepVal;
          const lbl = applyChartAffixes(formatChartNumber(v, this._effectiveTickFormat), data.yAxis.prefix, data.yAxis.suffix, data.yAxis.negativeStyle);
          const w = canvas.measureText(lbl, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family).width;
          if (w > maxLeftText) maxLeftText = w;
        }
      }
      const hasLeftLegend = this.orientation === ChartOrientation.Horizontal ? data.xAxis.legend !== '' : data.yAxis.legend !== '';
      plotLeft = Math.max(24, Math.min(this.width * 0.35, Math.ceil(maxLeftText + 16 + (hasLeftLegend ? 24 : 0))));
      plotRight = Math.max(20, extraRight);
      if (this.orientation === ChartOrientation.Horizontal && this.showValueLabels) {
        let maxValW = 0;
        for (const s of data.series) {
          for (const dp of s.dataPoints) {
            const w = canvas.measureText(this.formatPointValue(dp), this.labelFontSize, family).width;
            if (w > maxValW) maxValW = w;
          }
        }
        plotRight = Math.max(plotRight, Math.min(this.width * 0.25, Math.ceil(maxValW + 20)));
      }
    }

    const legendPos = this.shouldDrawLegend(data) ? this.effectiveLegendPosition() : 'none';
    if (legendPos === 'right' || legendPos === 'inline') {
      let maxNameW = 0;
      for (const s of data.series) {
        const w = canvas.measureText(s.name, 11, family).width;
        if (w > maxNameW) maxNameW = w;
      }
      const needed = Math.min(this.width * 0.35, Math.ceil(maxNameW + (legendPos === 'right' ? 40 : 20)));
      plotRight = Math.max(plotRight, needed);
    }

    let topBand = (data.title !== '' ? CartesianChartBase.TITLE_AREA_HEIGHT : CartesianChartBase.TOP_PADDING) + this.depthShift.dy;
    if (data.subtitle !== '') topBand += data.title !== '' ? 18 : 24;
    if (legendPos === 'top') topBand += 24;

    let bottomBand = this.reservesBottomLegendBand(data)
      ? CartesianChartBase.BOTTOM_PADDING
      : CartesianChartBase.AXIS_LABEL_BAND;
    if (this.caption !== '') bottomBand += 16;
    bottomBand += this.dataTableHeight(data) + this.getExtraBottomBand(data);

    const prelimW = Math.max(40, this.width - plotLeft - plotRight);
    if (this.orientation === ChartOrientation.Vertical && data.xAxis.labelOverflow !== 'omit') {
      const eff = this.resolveEffectiveOverflow(canvas, data, prelimW);
      if (eff === 'rotate') {
        let maxLbl = 0;
        for (const dp of data.series[0]?.dataPoints ?? []) {
          const w = canvas.measureText(dp.label, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family).width;
          if (w > maxLbl) maxLbl = w;
        }
        bottomBand += Math.min(60, Math.ceil(maxLbl * Math.SQRT1_2 * 0.65));
      } else if (eff === 'wrap') {
        bottomBand += 14;
      }
    }

    plotLeft += cardInset;
    plotRight += cardInset;
    topBand += cardInset;
    bottomBand += cardInset;

    // Preserve at least 40% plot area
    const maxHorizMargin = this.width * 0.6;
    if (plotLeft + plotRight > maxHorizMargin) {
      const scale = maxHorizMargin / (plotLeft + plotRight);
      plotLeft *= scale;
      plotRight *= scale;
    }
    const maxVertMargin = this.height * 0.6;
    if (topBand + bottomBand > maxVertMargin) {
      const scale = maxVertMargin / (topBand + bottomBand);
      topBand *= scale;
      bottomBand *= scale;
    }

    const chartAreaWidth = this.width - plotLeft - plotRight;
    const chartAreaHeight = this.height - topBand - bottomBand;
    return {
      plotLeft,
      plotRight,
      chartAreaWidth,
      chartAreaHeight,
      baselineY: topBand + chartAreaHeight,
      topY: topBand,
    };
  }
}
