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
        drawChartBar(canvas, origin, slot.start, barWidth, slot.thickness, color, this.barStyle, this.appearance, true, this._plotLeft, topAreaY, chartAreaWidth, chartAreaHeight);
        if (pat !== 'none') {
          const rx = barWidth < 0 ? origin + barWidth : origin;
          fillPatternRect(canvas, rx, slot.start, Math.abs(barWidth), slot.thickness, { kind: pat, foreground: Color.white });
        }
      }
    } else {
      for (let i = 0; i < coordinates.length; i++) {
        const p = coordinates[i];
        const barHeight = origin - p.y;
        const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, this._plotLeft, chartAreaWidth);
        drawChartBar(canvas, slot.start, p.y, slot.thickness, barHeight, color, this.barStyle, this.appearance, false, this._plotLeft, baselineY - chartAreaHeight, chartAreaWidth, chartAreaHeight);
        if (pat !== 'none') {
          const ry = barHeight < 0 ? p.y + barHeight : p.y;
          fillPatternRect(canvas, slot.start, ry, slot.thickness, Math.abs(barHeight), { kind: pat, foreground: Color.white });
        }
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

      for (let i = 0; i < categoryCount; i++) {
        const point = coordinates[i];
        const text = this.formatPointValue(series.dataPoints[i]);
        const below = isBelowOrigin(series.dataPoints[i].value, this._effectiveMin, this._effectiveMax);

        if (this.orientation === ChartOrientation.Horizontal) {
          const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, topAreaY, chartAreaHeight);
          this.drawBarValueLabel(canvas, origin, slot.start, point.x - origin, slot.thickness, text, color, below, offset, point.x, slot.start + slot.thickness / 2);
        } else {
          const slot = this.barSlot(i, seriesIndex, seriesCount, categoryCount, this._plotLeft, chartAreaWidth);
          this.drawBarValueLabel(canvas, slot.start, point.y, slot.thickness, origin - point.y, text, color, below, offset, slot.start + slot.thickness / 2, point.y);
        }
      }
    }
  }

  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }
}
