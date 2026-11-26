// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { ColorInput } from '../ChartHost';
import type { ChartTrendlineType } from './ChartTrendlineMath';

/** Error bars for every point of a series. A point's own `errorPlus` and `errorMinus` take precedence. */
export interface ChartErrorBars {
  /** `fixed`: `amount`. `percent`: `amount` percent of the value. `stdDev`: `amount` sample standard deviations of the series. `stdError`: `amount` standard errors. */
  type: 'fixed' | 'percent' | 'stdDev' | 'stdError';
  /** The size, as `type` describes. */
  amount: number;
  /** Which sides are drawn: `both` (default), `plus` or `minus`. */
  direction?: 'both' | 'plus' | 'minus';
  /** Width of the end caps in points (`6`). */
  capWidth?: number;
  /** Line colour. Defaults to the theme's text colour. */
  color?: ColorInput;
  /** Line width in points (`1`). */
  width?: number;
}

/** A regression line over one series of a category chart; `x` is the category number from 1. */
export interface ChartTrendline {
  /** The series, by index or name. */
  series: number | string;
  /** The model to fit. */
  type: ChartTrendlineType;
  /** Points averaged by a `movingAverage` (at least 2). */
  period?: number;
  /** Order of a `polynomial`, from 2 to 4 (`2`). */
  order?: number;
  /** What to write beside the line: `none` (default), `equation`, `r2` or `both`. */
  label?: 'none' | 'equation' | 'r2' | 'both';
  /** Line colour. Defaults to the series colour. */
  color?: ColorInput;
  /** Alternating dash and gap lengths in points (`[6, 4]`). */
  dashPattern?: readonly number[];
}

/** A bar between the first and the last series at each category, coloured by direction. */
export interface ChartUpDownBars {
  /** Colour where the last series is at or above the first. Defaults to the theme's positive colour. */
  upColor?: ColorInput;
  /** Colour where it is below. Defaults to the theme's negative colour. */
  downColor?: ColorInput;
  /** The fraction of a category slot the bar fills (`0.3`). */
  widthRatio?: number;
}

/** A grid of the plotted values beneath a vertical category chart. */
export interface ChartDataTable {
  /** Draw the table (`true`). */
  show?: boolean;
  /** Put each series' legend swatch in its row, and hide the legend (`true`). */
  showLegendKeys?: boolean;
  /** Number format of the cells. Defaults to the chart's value label format. */
  format?: string;
}

const ERROR_TYPES = ['fixed', 'percent', 'stdDev', 'stdError'];
const TRENDLINE_TYPES = ['linear', 'exponential', 'logarithmic', 'power', 'polynomial', 'movingAverage'];

/** Throws on error bar settings that are never valid. */
export function validateErrorBars(e: ChartErrorBars | undefined): void {
  if (e === undefined) return;
  if (!ERROR_TYPES.includes(e.type)) throw new RangeError(`Unknown error bar type '${e.type}'.`);
  if (!(e.amount >= 0) || !Number.isFinite(e.amount)) throw new RangeError('Error bar amount must be finite and nonnegative.');
  if (e.direction !== undefined && !['both', 'plus', 'minus'].includes(e.direction)) throw new RangeError(`Unknown error bar direction '${e.direction}'.`);
  if (e.capWidth !== undefined && !(e.capWidth >= 0)) throw new RangeError('Error bar capWidth must be nonnegative.');
  if (e.width !== undefined && !(e.width > 0)) throw new RangeError('Error bar width must be positive.');
}

/** Throws on trendline settings that are never valid. */
export function validateTrendlines(list: readonly ChartTrendline[]): void {
  for (const t of list) {
    if (!TRENDLINE_TYPES.includes(t.type)) throw new RangeError(`Unknown trendline type '${t.type}'.`);
    if (t.label !== undefined && !['none', 'equation', 'r2', 'both'].includes(t.label)) throw new RangeError(`Unknown trendline label '${t.label}'.`);
  }
}
