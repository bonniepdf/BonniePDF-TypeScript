import { Color } from '../../Core/Color';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { ChartDataPoint, type ChartDataPointOptions } from './ChartDataPoint';
import { applyOptions } from '../../Core/applyOptions';
import { toLength, type LengthInput } from '../../Normalize/toLength';

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
export type ChartSeriesStyleOptions = Partial<
  Omit<
    Pick<ChartSeriesStyle, (typeof CHART_SERIES_STYLE_OPTION_KEYS)[number]>,
    'lineWidth' | 'markerRadius' | 'stemWidth'
  >
> & {
  /** Line thickness. Accepts a length: `2`, `'0.5mm'`, or `{ value, unit }`. */
  lineWidth?: LengthInput;
  /** Marker radius. Accepts a length: `5`, `'2mm'`, or `{ value, unit }`. */
  markerRadius?: LengthInput;
  /** Stem thickness. Accepts a length: `2`, `'0.5mm'`, or `{ value, unit }`. */
  stemWidth?: LengthInput;
};

/** Configures the colors and stroke used to render a chart series. */
export class ChartSeriesStyle {
  /**
   * Line width for Line and Area charts (default: 2f).
   */
  /** Creates series styling, optionally configured in one expression. */
  constructor(options?: ChartSeriesStyleOptions) {
    applyOptions(this, options);
  }

  private _lineWidth: number = 2;

  /**
   * Line thickness for this series.
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }` (§4A.3).
   */
  public get lineWidth(): number {
    return this._lineWidth;
  }
  public set lineWidth(value: LengthInput) {
    this._lineWidth = toLength(value);
  }

  /**
   * Fill opacity for Area charts (0.0 to 1.0, default: 0.3f).
   */
  fillOpacity: number = 0.3;

  private _markerRadius: number = 5;

  /**
   * Marker radius for Line, Lollipop, and DotPlot charts (default: 5f).
   *
   * Accepts a length: a number of points, `'2mm'`, or `{ value, unit }` (§4A.3).
   */
  public get markerRadius(): number {
    return this._markerRadius;
  }
  public set markerRadius(value: LengthInput) {
    this._markerRadius = toLength(value);
  }

  /**
   * Whether to show circular markers at data points in Line charts (default: true).
   */
  showMarkers: boolean = true;

  private _stemWidth: number = 2;

  /**
   * Stem width for Lollipop charts (default: 2f).
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }` (§4A.3).
   */
  public get stemWidth(): number {
    return this._stemWidth;
  }
  public set stemWidth(value: LengthInput) {
    this._stemWidth = toLength(value);
  }
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
