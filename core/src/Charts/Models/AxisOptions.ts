// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions } from '../ChartHost';
import type { ChartNegativeStyle } from '../ChartNumberFormat';

/** Overflow handling strategy for dense categorical axis labels. */
export type AxisLabelOverflow = 'auto' | 'omit' | 'rotate' | 'wrap';

/** Settable properties of {@link AxisOptions}. */
export const AXIS_OPTIONS_OPTION_KEYS = [
  'prefix',
  'suffix',
  'maxValue',
  'minValue',
  'stepCount',
  'legend',
  'showGridLines',
  'verticalLegend',
  'autoScale',
  'includeZero',
  'headroom',
  'valueFormat',
  'labelOverflow',
  'negativeStyle',
  'scale',
  'logBase',
  'showMinorGridLines',
] as const;

/** Options for {@link AxisOptions}. */
export type AxisOptionsOptions = Partial<Pick<AxisOptions, (typeof AXIS_OPTIONS_OPTION_KEYS)[number]>>;

/** Configures the labels, range, interval, and appearance of a chart axis. */
export class AxisOptions {
  /** Creates axis options, optionally configured in one expression. */
  constructor(options?: AxisOptionsOptions) {
    applyOptions(this, options);
  }

  /** Prefix for value labels (e.g., "£", "$") */
  prefix: string = '';

  /** Suffix for value labels (e.g., "%", "k") */
  suffix: string = '';

  /** Highest value on the value axis. Must be greater than `minValue` when a chart with series is drawn. */
  maxValue: number = 10000;
  /** @internal */
  get hasMaxValue(): boolean {
    return this.maxValue !== 10000;
  }

  /** Lowest value on the value axis (default: 0). */
  minValue: number = 0;
  /** @internal */
  get hasMinValue(): boolean {
    return this.minValue !== 0;
  }

  /** Number of grid lines/steps on the axis */
  stepCount: number = 5;

  /** Legend/title for this axis (e.g., "Sales (£)", "Month") */
  legend: string = '';

  /** Whether to show grid lines for this axis */
  showGridLines: boolean = true;

  /** Whether to render the legend vertically (rotated 90 degrees) instead of horizontally. */
  verticalLegend: boolean = false;

  /** Compute nice axis bounds and tick spacing from plotted data using Heckbert scaling. */
  autoScale: boolean = false;

  /** Include zero in the auto-scaled range; undefined defers to the chart family's default. */
  includeZero: boolean | undefined;

  /** Fractional headroom (0..0.5) beyond extreme values before rounding; undefined defers to chart default. */
  headroom: number | undefined;

  /** Number format string (`G`, `F<n>`, `N<n>`, `P<n>`, `K<n>`) for axis tick labels. */
  valueFormat: string | undefined;

  /** Category-axis label overflow strategy: `omit` (default), `rotate`, `wrap`, or `auto`. */
  labelOverflow: AxisLabelOverflow = 'omit';

  /** Where a negative tick's minus sign goes relative to `prefix`: `minusAfterPrefix` (default, `$-1`), `minus` (`-$1`) or `parentheses` (`($1)`). */
  negativeStyle: ChartNegativeStyle = 'minusAfterPrefix';

  /** `linear` (default) or `log`. A logarithmic value axis needs every plotted value and bound above zero; bars then start at the lower bound. */
  scale: 'linear' | 'log' = 'linear';

  /** Base of a logarithmic axis, above 1 (`10`). Ticks sit at its integer powers. */
  logBase: number = 10;

  /** On a logarithmic axis, draw faint gridlines at 2 to base-1 times each power. */
  showMinorGridLines: boolean = false;
}
