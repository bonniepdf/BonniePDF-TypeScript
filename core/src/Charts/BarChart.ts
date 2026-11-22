// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ChartBarStyle, type ChartBarStyleOptions } from './ChartBarStyle';
import { drawChartBar } from './Graphics/ChartBars';
import { fillPatternRect } from './Graphics/ChartPatterns';
import { isBelowOrigin } from './Graphics/ChartValueScale';
import { ChartData } from './Models/ChartData';
import { CARTESIAN_CHART_OPTION_KEYS, type CartesianChartOptions } from './CartesianChartBase';
import { applyOptions, toColor, type ColorInput, Color, Point, type ICanvas } from './ChartHost';
import { ChartSeries } from './Models/ChartSeries';
import { ChartOrientation } from './ChartOrientation';
import { CartesianChartBase } from './CartesianChartBase';

/** Settable properties declared by {@link BarChart} itself. */
export const BAR_CHART_OWN_OPTION_KEYS = ['barColor', 'barWidthRatio', 'barStyle'] as const;

/** The full option surface, bases included. */
export const BAR_CHART_OPTION_KEYS = [...CARTESIAN_CHART_OPTION_KEYS, ...BAR_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link BarChart}. */
export type BarChartOptions = CartesianChartOptions &
  Partial<Omit<Pick<BarChart, (typeof BAR_CHART_OWN_OPTION_KEYS)[number]>, 'barColor' | 'barStyle'>> & {
    /** Default bar colour for series without an explicit colour. */
    barColor?: ColorInput;
    /** Corner rounding and gradient style applied to bars. */
    barStyle?: ChartBarStyle | ChartBarStyleOptions;
  };

/** Renders a data series as vertical or horizontal bars. */
export class BarChart extends CartesianChartBase {
  protected override drawLegendSwatch(canvas: ICanvas, x: number, y: number, size: number, series: ChartSeries): void {
    const color = this.resolveSeriesColor(series);
    const idx = (this._renderData ?? this.data).series.indexOf(series);
    const pat = this.resolveSeriesPattern(series, idx);
    drawChartBar(canvas, x, y, size, size, color, this.barStyle, this.appearance, false, x, y, size, size);
    if (pat !== 'none') fillPatternRect(canvas, x, y, size, size, { kind: pat, foreground: Color.white });
  }

  private _barStyle = new ChartBarStyle();
  /** Corner rounding and gradient style applied to bars. */
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

  private static readonly BAR_COLOR_HEX = '#4f46e5';

  /** SVG `shape-rendering` hint (`auto` or `crispEdges`). */
  override svgShapeRendering: 'auto' | 'crispEdges' | undefined = 'crispEdges';

  constructor(options?: BarChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  private _barColor: Color = Color.fromHex(BarChart.BAR_COLOR_HEX);
  /** Default bar colour for series without an explicit colour. */
  public get barColor(): Color {
    return this._barColor;
  }
  public set barColor(value: ColorInput) {
    this._barColor = toColor(value);
  }

  /** Fraction of each category slot occupied by the bar (`0..1`). */
  barWidthRatio: number = 0.6;

  protected override drawSeriesElements(
    canvas: ICanvas,
    data: ChartData,
    series: ChartSeries,
    coordinates: Point[],
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    const dataPointCount = series.dataPoints.length;
    if (dataPointCount === 0) return;
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);
    const color = this.resolveSeriesColor(series);
    const seriesIdx = data.series.indexOf(series);
    const pat = this.resolveSeriesPattern(series, seriesIdx);

    if (this.orientation === ChartOrientation.Horizontal) {
      const totalBarSpace = chartAreaHeight / dataPointCount;
      const barThickness = Math.min(totalBarSpace * this.barWidthRatio, 50);
      for (const p of coordinates) {
        const barWidth = p.x - origin;
        const barY = p.y - barThickness / 2;
        drawChartBar(canvas, origin, barY, barWidth, barThickness, color, this.barStyle, this.appearance, true, this._plotLeft, topY, chartAreaWidth, chartAreaHeight);
        if (pat !== 'none') {
          const rx = barWidth < 0 ? origin + barWidth : origin;
          fillPatternRect(canvas, rx, barY, Math.abs(barWidth), barThickness, { kind: pat, foreground: Color.white });
        }
      }
    } else {
      const totalBarSpace = chartAreaWidth / dataPointCount;
      const barWidth = Math.min(totalBarSpace * this.barWidthRatio, 50);
      for (const p of coordinates) {
        const barHeight = origin - p.y;
        const barX = p.x - barWidth / 2;
        drawChartBar(canvas, barX, p.y, barWidth, barHeight, color, this.barStyle, this.appearance, false, this._plotLeft, topY, chartAreaWidth, chartAreaHeight);
        if (pat !== 'none') {
          const ry = barHeight < 0 ? p.y + barHeight : p.y;
          fillPatternRect(canvas, barX, ry, barWidth, Math.abs(barHeight), { kind: pat, foreground: Color.white });
        }
      }
    }
  }

  protected override drawValueLabels(
    canvas: ICanvas,
    data: ChartData,
    chartAreaWidth: number,
    chartAreaHeight: number,
    baselineY: number,
    topY: number
  ): void {
    if (!this.showValueLabels) return;
    if (this.valueLabelPosition === 'outside') {
      super.drawValueLabels(canvas, data, chartAreaWidth, chartAreaHeight, baselineY, topY);
      return;
    }
    const origin = this.valueOrigin(data, chartAreaWidth, chartAreaHeight, baselineY);
    for (const series of data.series) {
      const dataPointCount = series.dataPoints.length;
      if (dataPointCount === 0) continue;
      const coordinates = this.calculateSeriesCoordinates(series, data, chartAreaWidth, chartAreaHeight, baselineY);
      const color = this.resolveSeriesColor(series);
      const offset = this.getLabelVerticalOffset(series);
      const thickness =
        this.orientation === ChartOrientation.Horizontal
          ? Math.min((chartAreaHeight / dataPointCount) * this.barWidthRatio, 50)
          : Math.min((chartAreaWidth / dataPointCount) * this.barWidthRatio, 50);
      for (let i = 0; i < dataPointCount; i++) {
        const p = coordinates[i];
        const text = this.formatPointValue(series.dataPoints[i]);
        const below = isBelowOrigin(series.dataPoints[i].value, this._effectiveMin, this._effectiveMax);
        if (this.orientation === ChartOrientation.Horizontal) {
          this.drawBarValueLabel(canvas, origin, p.y - thickness / 2, p.x - origin, thickness, text, color, below, offset, p.x, p.y);
        } else {
          this.drawBarValueLabel(canvas, p.x - thickness / 2, p.y, thickness, origin - p.y, text, color, below, offset, p.x, p.y);
        }
      }
    }
  }

  protected override getLabelVerticalOffset(_series: ChartSeries): number {
    return 7;
  }

  protected override getDefaultSeriesColor(): Color {
    return this.barColor;
  }
}
