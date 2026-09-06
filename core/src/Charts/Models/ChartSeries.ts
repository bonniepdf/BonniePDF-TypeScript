import { Color } from '../../Core/Color';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { ChartDataPoint, type ChartDataPointOptions } from './ChartDataPoint';
import { applyOptions } from '../../Core/applyOptions';

/**
 * Series-specific styling options for fine-grained control over appearance.
 */
/** Settable properties of {@link ChartSeriesStyle}. */
export const CHART_SERIES_STYLE_OPTION_KEYS = [
  'lineWidth',
  'fillOpacity',
  'markerRadius',
  'showMarkers',
  'stemWidth',
] as const;

/** Options for {@link ChartSeriesStyle}. */
export type ChartSeriesStyleOptions = Partial<Pick<ChartSeriesStyle, (typeof CHART_SERIES_STYLE_OPTION_KEYS)[number]>>;

/** Configures the colors and stroke used to render a chart series. */
export class ChartSeriesStyle {
  /**
   * Line width for Line and Area charts (default: 2f).
   */
  /** Creates series styling, optionally configured in one expression. */
  constructor(options?: ChartSeriesStyleOptions) {
    applyOptions(this, options);
  }

  lineWidth: number = 2;

  /**
   * Fill opacity for Area charts (0.0 to 1.0, default: 0.3f).
   */
  fillOpacity: number = 0.3;

  /**
   * Marker radius for Line, Lollipop, and DotPlot charts (default: 5f).
   */
  markerRadius: number = 5;

  /**
   * Whether to show circular markers at data points in Line charts (default: true).
   */
  showMarkers: boolean = true;

  /**
   * Stem width for Lollipop charts (default: 2f).
   */
  stemWidth: number = 2;
}

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
  /**
   * Series name/label (e.g., "Year Sales", "Product A", "Q1 Revenue")
   * Used in legends and tooltips.
   */
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

  name: string = '';

  /**
   * Color to use for this series (lines, bars, markers, etc.)
   */
  private _color: Color = Color.fromHex('#4f46e5');

  /** Series colour. Accepts a palette token or hex. */
  public get color(): Color {
    return this._color;
  }
  public set color(value: ColorInput) {
    this._color = toColor(value);
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
