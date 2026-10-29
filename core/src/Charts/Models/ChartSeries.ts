import { Color } from '../../Core/Color';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { ChartDataPoint, type ChartDataPointOptions } from './ChartDataPoint';
import { applyOptions } from '../../Core/applyOptions';
import { ChartSeriesStyle, type ChartSeriesStyleOptions } from './ChartSeriesStyle';

/**
 * Represents a single data series in a chart.
 * Similar to datasets in Chart.js or series in ApexCharts.
 */
/**
 * Settable *property* surface of {@link ChartSeries}. `color` is widened to
 * accept tokens; `dataPoints` and `style` accept nested literals via the
 * constructor.
 */
export const CHART_SERIES_OPTION_KEYS = ['name', 'color', 'dataPoints', 'style'] as const;

/** Options for {@link ChartSeries}. */
export type ChartSeriesOptions = Partial<
  Omit<Pick<ChartSeries, (typeof CHART_SERIES_OPTION_KEYS)[number]>, 'color' | 'dataPoints' | 'style'>
> & {
  /** Series colour. Accepts a palette token or hex. */
  color?: ColorInput;
  /** Data points; each may be an instance or an options literal. */
  dataPoints?: (ChartDataPoint | ChartDataPointOptions)[];
  /** Series styling; an instance or an options literal. */
  style?: ChartSeriesStyle | ChartSeriesStyleOptions;
};

/** Contains the name, values, and optional style for one chart series. */
export class ChartSeries {
  /** Creates a series, optionally configured in one expression. */
  constructor(options?: ChartSeriesOptions) {
    const { dataPoints, style, ...rest } = options ?? {};
    applyOptions(this, rest);
    if (dataPoints !== undefined) {
      this.dataPoints = dataPoints.map(p => (p instanceof ChartDataPoint ? p : new ChartDataPoint(p)));
    }
    if (style !== undefined) {
      this.style = style instanceof ChartSeriesStyle ? style : new ChartSeriesStyle(style);
    }
  }

  /**
   * Series name/label (e.g., "Year Sales", "Product A", "Q1 Revenue")
   * Used in legends and tooltips.
   */
  name: string = '';

  /**
   * Color to use for this series (lines, bars, markers, etc.)
   */
  private _color: Color | undefined;

  /**
   * Series colour. Accepts a palette token or hex. A series the author gave no colour reads as `#4f46e5`
   * and is drawn in its chart's own colour (`barColor`, `lineColor`, `areaColor`, `dotColor`, `lollipopColor`).
   */
  public get color(): Color {
    return this._color ?? ChartSeries.DEFAULT_COLOR;
  }
  public set color(value: ColorInput) {
    this._color = toColor(value);
  }

  private static readonly DEFAULT_COLOR = Color.fromHex('#4f46e5');

  /** @internal Whether the author gave this series a colour; an unset series takes its chart's colour. */
  public get hasColor(): boolean {
    return this._color !== undefined;
  }

  /**
   * Data points for this series.
   * Each data point contains a label, value, and optional format string.
   */
  dataPoints: ChartDataPoint[] = [];

  /**
   * Series-specific styling options.
   * Allows customization of line width, opacity, marker size, etc.
   */
  style: ChartSeriesStyle = new ChartSeriesStyle();
}
