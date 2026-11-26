// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, toColor, type ColorInput, applyOptions } from '../ChartHost';
import { ChartDataPoint, type ChartDataPointOptions } from './ChartDataPoint';
import { ChartSeriesStyle, type ChartSeriesStyleOptions } from './ChartSeriesStyle';

/** Mark type for a series inside a {@link ComboChart}. */
export type ChartSeriesType = 'bar' | 'line' | 'area' | 'range';
/** Value axis binding for a series inside a {@link ComboChart}. */
export type ChartAxisTarget = 'primary' | 'secondary';

/** Settable property surface of {@link ChartSeries}. */
export const CHART_SERIES_OPTION_KEYS = ['name', 'color', 'dataPoints', 'style', 'seriesType', 'valueAxis'] as const;

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
      this.dataPoints = dataPoints.map((p) => (p instanceof ChartDataPoint ? p : new ChartDataPoint(p)));
    }
    if (style !== undefined) {
      this.style = style instanceof ChartSeriesStyle ? style : new ChartSeriesStyle(style);
    }
  }

  /** Series name/label used in legends. */
  name: string = '';

  private _color: Color | undefined;

  /** Series colour. Accepts a palette token or hex. */
  public get color(): Color {
    return this._color ?? ChartSeries.DEFAULT_COLOR;
  }
  public set color(value: ColorInput) {
    this._color = toColor(value);
  }

  private static readonly DEFAULT_COLOR = Color.fromHex('#4f46e5');

  /** @internal Whether the author gave this series a colour. */
  public get hasColor(): boolean {
    return this._color !== undefined;
  }

  /** Data points for this series. */
  dataPoints: ChartDataPoint[] = [];

  /** Series-specific styling options. */
  style: ChartSeriesStyle = new ChartSeriesStyle();

  /** Renderer role when used in ComboChart: `bar` (default), `line`, or `area`. */
  seriesType: ChartSeriesType = 'bar';

  /** Value axis binding when used in ComboChart: `primary` (default) or `secondary`. */
  valueAxis: ChartAxisTarget = 'primary';
}
