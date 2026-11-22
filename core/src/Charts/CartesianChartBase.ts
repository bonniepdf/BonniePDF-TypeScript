// Generated chart source. Do not edit here; the source manifest records its provenance.
import { drawPlacedLabel, type ChartLabelBox } from './Graphics/ChartLabels';
import { formatChartNumber } from './ChartNumberFormat';
import { type ICanvas, Color, toColor, type ColorInput, Point, TextAlignment, StandardFonts, toLength, type LengthInput } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions } from './ChartBase';
import { ChartData } from './Models/ChartData';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { ChartSeries } from './Models/ChartSeries';
import { AxisOptions, type AxisOptionsOptions } from './Models/AxisOptions';
import { ChartOrientation } from './ChartOrientation';
import { ChartBase } from './ChartBase';
import { CHART_THEMES, themedSeriesColor } from './ChartTheme';
import { checkValueRange, computeNiceScale, contrastTextColor, isBelowOrigin, originFraction, valueFraction } from './Graphics/ChartValueScale';
import { buildCurveCommands, polylineLength, validateDashPattern, type ChartCurveMode } from './Graphics/ChartCurves';
import type { ChartMarkerShape } from './Graphics/ChartMarkers';
import type { ChartPathCommand, ChartPatternKind } from './Graphics/ChartPathPlan';
import { fillChartPath, popClip, pushClipRect, strokeChartPath } from './Graphics/ChartVector';

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
  'valueLabelPosition',
  'showLegend',
  'legendPosition',
  'orientation',
  'references',
  'clipToPlotArea',
] as const;

/** The full option surface of a cartesian chart, base included. */
export const CARTESIAN_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...CARTESIAN_CHART_OWN_OPTION_KEYS] as const;

/** Options common to cartesian charts. Intersects {@link ChartBaseOptions}. */
export type CartesianChartOptions = ChartBaseOptions &
  Partial<
    Omit<
      Pick<CartesianChartBase, (typeof CARTESIAN_CHART_OWN_OPTION_KEYS)[number]>,
      'xAxis' | 'yAxis' | 'labelFontSize'
    >
  > & {
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

  /** Value label placement on bar charts: `outside` (default), `inside`, or `auto`. */
  valueLabelPosition: ChartValueLabelPosition = 'outside';

  /** Whether to show a legend for multiple series (default: true). */
  showLegend: boolean = true;

  /** Where to draw the legend: `bottom` (default), `top`, `right`, `inline`, or `none`. */
  legendPosition: ChartLegendPosition = 'bottom';

  /** Controls whether the chart renders with vertical or horizontal orientation. */
  orientation: ChartOrientation = ChartOrientation.Vertical;

  /** Reference lines and bands on the value axis. */
  references: readonly ChartReference[] = [];

  /** Optional clip of plotted series geometry to the plot area; undefined defers to chart family default. */
  clipToPlotArea: boolean | undefined;

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
          if (dp.value < min) min = dp.value;
          if (dp.value > max) max = dp.value;
        }
      }
    }
    return min <= max ? [min, max] : undefined;
  }

  protected resolveValueScale(data: ChartData): void {
    const axis = data.yAxis;
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

  protected formatPointValue(dp: ChartDataPoint, overrideValue?: number): string {
    const val = overrideValue ?? dp.value;
    const fmt = dp.hasExplicitLabelFormat ? dp.labelFormat : (this.valueLabelFormat ?? dp.labelFormat);
    return `${this.valueLabelPrefix}${formatChartNumber(val, fmt)}${this.valueLabelSuffix}`;
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
      this.resolveValueScale(data);
      checkValueRange(this._effectiveMin, this._effectiveMax);

      if (this.drawCompact(canvas, data)) return;
      const layout = this.calculateLayoutWithCanvas(canvas, data);
      this._plotLeft = layout.plotLeft;
      this._plotRight = layout.plotRight;

      this.drawReferences(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, true);

      // 1. Grid lines
      if (data.yAxis.showGridLines && this.appearance.gridLineStyle !== 'none') {
        this.drawGridLines(canvas, data, layout.chartAreaWidth, layout.chartAreaHeight, layout.baselineY, layout.topY);
      }

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

      // 9. Legend
      if (this.shouldDrawLegend(data)) {
        this.drawLegendInPosition(canvas, data, layout);
      }
    } finally {
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
      const a = valueFraction(value, minValue, maxValue);
      const paint = toColor(color);
      if (endValue !== undefined) {
        const b = valueFraction(endValue, minValue, maxValue);
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
    const textColor = ref.labelColor
      ? toColor(ref.labelColor)
      : baseColor.scA < 0.5
        ? baseColor.withAlpha(1)
        : baseColor;

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
    for (const series of data.series) {
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);
      this.drawSeriesElements(canvas, data, series, coordinates, chartAreaWidth, chartAreaHeight, baselineY, topY);
    }
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

    if (this.orientation === ChartOrientation.Horizontal) {
      const topY = baselineY - chartAreaHeight;
      const totalSpace = chartAreaHeight / dataPointCount;
      for (let i = 0; i < dataPointCount; i++) {
        const y = topY + i * totalSpace + totalSpace / 2;
        const normalizedValue = valueFraction(series.dataPoints[i].value, this._effectiveMin, this._effectiveMax);
        const x = this._plotLeft + normalizedValue * chartAreaWidth;
        coordinates.push(new Point(x, y));
      }
    } else {
      const totalSpace = chartAreaWidth / dataPointCount;
      for (let i = 0; i < dataPointCount; i++) {
        const x = this._plotLeft + i * totalSpace + totalSpace / 2;
        const normalizedValue = valueFraction(series.dataPoints[i].value, this._effectiveMin, this._effectiveMax);
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
    outsideAlignCenter = true
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
        barColor,
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
        barColor,
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
      const labelColor = this.resolveSeriesColor(series);
      const offset = this.getLabelVerticalOffset(series);

      for (let i = 0; i < series.dataPoints.length; i++) {
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

    if (this.orientation === ChartOrientation.Horizontal) {
      const stepWidth = chartAreaWidth / stepCount;
      for (let i = 1; i <= stepCount; i++) {
        const x = this._plotLeft + i * stepWidth;
        if (dashed) {
          strokeChartPath(canvas, {
            commands: [{ op: 'M', values: [x, topY] }, { op: 'L', values: [x, baselineY] }],
            color: this.gridLineColor,
            lineWidth: CartesianChartBase.GRID_LINE_WIDTH,
            dashPattern: [3, 3],
          });
        } else {
          canvas.drawLine(x, topY, x, baselineY, this.gridLineColor, CartesianChartBase.GRID_LINE_WIDTH);
        }
      }
    } else {
      const stepHeight = chartAreaHeight / stepCount;
      for (let i = 1; i <= stepCount; i++) {
        const y = baselineY - i * stepHeight;
        const x1 = this._plotLeft;
        const x2 = this._plotLeft + chartAreaWidth;
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

    if (this.orientation === ChartOrientation.Horizontal) {
      const chartAreaWidth = this.width - this._plotLeft - this._plotRight;
      const stepWidth = chartAreaWidth / stepCount;
      for (let i = 0; i <= stepCount; i++) {
        const x = this._plotLeft + i * stepWidth;
        const value = minValue + i * stepValue;
        const label = `${data.yAxis.prefix}${formatChartNumber(value, fmt)}${data.yAxis.suffix}`;
        canvas.drawText(x, baselineY + 8, label, this.axisColor, CartesianChartBase.AXIS_LABEL_FONT_SIZE, family, TextAlignment.Center);
      }
    } else {
      const stepHeight = chartAreaHeight / stepCount;
      for (let i = 0; i <= stepCount; i++) {
        const y = baselineY - i * stepHeight;
        const value = minValue + i * stepValue;
        const label = `${data.yAxis.prefix}${formatChartNumber(value, fmt)}${data.yAxis.suffix}`;
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
    dashPattern?: readonly number[]
  ): void {
    if (coordinates.length < 2) return;
    const hasDash = dashPattern !== undefined && dashPattern.length > 0;
    if (curve === 'linear' && !hasDash) {
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
    const topBand = data.title !== '' ? CartesianChartBase.TITLE_AREA_HEIGHT : CartesianChartBase.TOP_PADDING;
    const bottomBand = this.reservesBottomLegendBand(data)
      ? CartesianChartBase.BOTTOM_PADDING
      : CartesianChartBase.AXIS_LABEL_BAND;

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
    const extraRight = this.getExtraRightMargin(canvas, data);
    const hasEnhancedLayout =
      this.autoLayout ||
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
          const lbl = `${data.yAxis.prefix}${formatChartNumber(v, this._effectiveTickFormat)}${data.yAxis.suffix}`;
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

    let topBand = data.title !== '' ? CartesianChartBase.TITLE_AREA_HEIGHT : CartesianChartBase.TOP_PADDING;
    if (data.subtitle !== '') topBand += data.title !== '' ? 18 : 24;
    if (legendPos === 'top') topBand += 24;

    let bottomBand = this.reservesBottomLegendBand(data)
      ? CartesianChartBase.BOTTOM_PADDING
      : CartesianChartBase.AXIS_LABEL_BAND;
    if (this.caption !== '') bottomBand += 16;

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
