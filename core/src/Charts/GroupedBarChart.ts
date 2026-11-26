// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartBarStyle, type ChartBarStyleOptions } from './ChartBarStyle';
import { drawChartBar } from './Graphics/ChartBars';
import { fillPatternRect } from './Graphics/ChartPatterns';
import { ChartData } from './Models/ChartData';
import { isBelowOrigin } from './Graphics/ChartValueScale';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';

/** Settable properties declared by {@link GroupedBarChart} itself. */
export const GROUPED_BAR_CHART_OWN_OPTION_KEYS = ['barWidthRatio', 'groupGapRatio', 'barStyle'] as const;

/** The full option surface, bases included. */
export const GROUPED_BAR_CHART_OPTION_KEYS = [
  ...CARTESIAN_CHART_OPTION_KEYS,
  ...GROUPED_BAR_CHART_OWN_OPTION_KEYS,
] as const;

/** Options for {@link GroupedBarChart}. */
export type GroupedBarChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<GroupedBarChart, (typeof GROUPED_BAR_CHART_OWN_OPTION_KEYS)[number]>, 'barStyle'>> & {
    /** Corner rounding and gradient style applied to grouped bars. */
    barStyle?: ChartBarStyle | ChartBarStyleOptions;
  };

/** Renders multiple data series as groups of adjacent bars. */
export class GroupedBarChart extends CartesianChartBase {
  protected override get supportsAnnotations(): boolean {
    return true;
  }

  protected override annotationBarThickness(slot: number, seriesCount: number): number {
    return this.barSlotThickness(slot, seriesCount);
  }

  protected override annotationMarkPoint(
    series: ChartSeries,
    seriesIndex: number,
    pointIndex: number,
    coordinates: Point[],
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number
  ): Point {
    const p = coordinates[pointIndex];
    const count = series.dataPoints.length;
    if (this.orientation === ChartOrientation.Horizontal) {
      const slot = this.barSlot(pointIndex, seriesIndex, data.series.length, count, baselineY - chartAreaHeight, chartAreaHeight);
      return new Point(p.x, slot.start + slot.thickness / 2);
    }
    const slot = this.barSlot(pointIndex, seriesIndex, data.series.length, count, this._plotLeft, chartAreaWidth);
    return new Point(slot.start + slot.thickness / 2, p.y);
  }

  private barSlotThickness(slot: number, seriesCount: number): number {
    const group = slot - slot * this.groupGapRatio;
    return (group / seriesCount) * this.barWidthRatio;
  }

  protected override drawLegendSwatch(canvas: ICanvas, x: number, y: number, size: number, series: ChartSeries): void {
    const color = this.resolveSeriesColor(series);
    const idx = (this._renderData ?? this.data).series.indexOf(series);
    const pat = this.resolveSeriesPattern(series, idx);
    drawChartBar(canvas, x, y, size, size, color, this.barStyle, this.appearance, false, x, y, size, size);
    if (pat !== 'none') fillPatternRect(canvas, x, y, size, size, { kind: pat, foreground: Color.white });
  }

  private _barStyle = new ChartBarStyle();
  /** Corner rounding and gradient style applied to grouped bars. */
  get barStyle(): ChartBarStyle {
    return this._barStyle;
  }
  set barStyle(value: ChartBarStyle | ChartBarStyleOptions) {
    this._barStyle = value instanceof ChartBarStyle ? value : new ChartBarStyle(value);
  }
  /** @internal */
  override get usesStyledGeometry(): boolean {
    return super.usesStyledGeometry || (this.barStyle.cornerRadius ?? 0) > 0 || this.barStyle.gradient !== undefined;
  }

  /** SVG `shape-rendering` hint (`auto` or `crispEdges`). */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  constructor(options?: GroupedBarChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /** Fraction of each category slot occupied by the bar group (`0..1`). */
  barWidthRatio: number = 0.6;
  /** Relative gap between bars inside a group (`0..1`). */
  groupGapRatio: number = 0.2;

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
    const seriesCount = data.series.length;
    const categoryCount = series.dataPoints.length;
    if (categoryCount === 0) return;
    const seriesIndex = data.series.indexOf(series);
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);
    const color = this.resolveSeriesColor(series);
    const pat = this.resolveSeriesPattern(series, seriesIndex);

    if (this.orientation === ChartOrientation.Horizontal) {
      const topAreaY = baselineY - chartAreaHeight;
      for (let i = 0; i < coordinates.length; i++) {
        const p = coordinates[i];
        const barWidth = p.x - origin;
        const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, topAreaY, chartAreaHeight);
        const paint = this.resolveMarkPaint(series, series.dataPoints[i], color);
        this.markGroup(canvas, data, series, i, { x: origin, y: slot.start + slot.thickness / 2, axis: 'x' }, () => {
          this.drawBarDepth(canvas, origin, slot.start, barWidth, slot.thickness, paint.color);
          drawChartBar(canvas, origin, slot.start, barWidth, slot.thickness, paint.color, this.barStyle, this.appearance, true, this._plotLeft, topAreaY, chartAreaWidth, chartAreaHeight, paint.fill && { fill: paint.fill, boxes: (m) => this.fillBoxes(m) }, this.resolveBarEffects(series, this.barStyle.effects));
          if (pat !== 'none') {
            const rx = barWidth < 0 ? origin + barWidth : origin;
            fillPatternRect(canvas, rx, slot.start, Math.abs(barWidth), slot.thickness, { kind: pat, foreground: Color.white });
          }
        });
      }
    } else {
      for (let i = 0; i < coordinates.length; i++) {
        const p = coordinates[i];
        const barHeight = origin - p.y;
        const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, this._plotLeft, chartAreaWidth);
        const paint = this.resolveMarkPaint(series, series.dataPoints[i], color);
        this.markGroup(canvas, data, series, i, { x: slot.start + slot.thickness / 2, y: origin, axis: 'y' }, () => {
          this.drawBarDepth(canvas, slot.start, p.y, slot.thickness, barHeight, paint.color);
          drawChartBar(canvas, slot.start, p.y, slot.thickness, barHeight, paint.color, this.barStyle, this.appearance, false, this._plotLeft, baselineY - chartAreaHeight, chartAreaWidth, chartAreaHeight, paint.fill && { fill: paint.fill, boxes: (m) => this.fillBoxes(m) }, this.resolveBarEffects(series, this.barStyle.effects));
          if (pat !== 'none') {
            const ry = barHeight < 0 ? p.y + barHeight : p.y;
            fillPatternRect(canvas, slot.start, ry, slot.thickness, Math.abs(barHeight), { kind: pat, foreground: Color.white });
          }
        });
      }
    }
  }

  private barSlot(
    categoryIndex: number,
    seriesIndex: number,
    seriesCount: number,
    categoryCount: number,
    axisStart: number,
    axisLength: number
  ): { start: number; thickness: number } {
    const totalGroupSpace = axisLength / categoryCount;
    const groupPadding = totalGroupSpace * this.groupGapRatio;
    const barGroupSize = totalGroupSpace - groupPadding;
    const thickness = (barGroupSize / seriesCount) * this.barWidthRatio;
    const groupStart = axisStart + categoryIndex * totalGroupSpace + groupPadding / 2;
    const start = groupStart + seriesIndex * (barGroupSize / seriesCount) + (barGroupSize / seriesCount - thickness) / 2;
    return { start, thickness };
  }

  protected override drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    _topY: number
  ): void {
    if (!this.showValueLabels) return;
    const seriesCount = data.series.length;
    const topAreaY = baselineY - chartAreaHeight;
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const series = data.series[seriesIndex];
      const categoryCount = series.dataPoints.length;
      if (categoryCount === 0) continue;
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);
      const offset = this.getLabelVerticalOffset(series);
      const color = this.resolveSeriesColor(series);
      const labelColor = this.rawSeriesStrokeColor(series);

      for (let i = 0; i < categoryCount; i++) {
        const point = coordinates[i];
        const text = this.formatPointValue(series.dataPoints[i]);
        const below = isBelowOrigin(series.dataPoints[i].value, this._effectiveMin, this._effectiveMax);

        if (this.orientation === ChartOrientation.Horizontal) {
          const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, topAreaY, chartAreaHeight);
          this.drawBarValueLabel(canvas, origin, slot.start, point.x - origin, slot.thickness, text, this.dimMark(series, i, color), below, offset, point.x, slot.start + slot.thickness / 2, true, this.dimMark(series, i, labelColor));
        } else {
          const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, this._plotLeft, chartAreaWidth);
          this.drawBarValueLabel(canvas, slot.start, point.y, slot.thickness, origin - point.y, text, this.dimMark(series, i, color), below, offset, slot.start + slot.thickness / 2, point.y, true, this.dimMark(series, i, labelColor));
        }
      }
    }
  }

  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7 + (this.orientation === ChartOrientation.Horizontal ? this.depthShift.dx : this.depthShift.dy);
  }

  protected override get supportsDepth3d(): boolean {
    return true;
  }
}
