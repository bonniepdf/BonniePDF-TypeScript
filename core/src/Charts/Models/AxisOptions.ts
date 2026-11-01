// Generated chart source. Do not edit here; the source manifest records its provenance.
import { applyOptions } from '../ChartHost';
/**
 * Options for configuring chart axis display
 */
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
] as const;

/** Options for {@link AxisOptions}. */
export type AxisOptionsOptions = Partial<Pick<AxisOptions, (typeof AXIS_OPTIONS_OPTION_KEYS)[number]>>;

/** Configures the labels, range, interval, and appearance of a chart axis. */
export class AxisOptions {
  /** Creates axis options, optionally configured in one expression. */
  constructor(options?: AxisOptionsOptions) {
    applyOptions(this, options);
  }

  /**
   * Prefix for value labels (e.g., "£", "$")
   */
  prefix: string = '';

  /**
   * Suffix for value labels (e.g., "%", "k")
   */
  suffix: string = '';

  /**
   * Highest value on the value axis. Must be greater than `minValue` when a chart with series is drawn.
   */
  maxValue: number = 10000;

  /**
   * Lowest value on the value axis (default: 0). Values are placed linearly between this and
   * `maxValue`, and bars, areas and stems start at zero limited to that range.
   */
  minValue: number = 0;

  /**
   * Number of grid lines/steps on the axis
   */
  stepCount: number = 5;

  /**
   * Legend/title for this axis (e.g., "Sales (£)", "Month")
   */
  legend: string = '';

  /**
   * Whether to show grid lines for this axis
   */
  showGridLines: boolean = true;

  /**
   * Whether to render the legend vertically (rotated 90 degrees) instead of horizontally.
   * This is particularly useful for Y-axis labels where vertical orientation saves horizontal space.
   */
  verticalLegend: boolean = false;
}
