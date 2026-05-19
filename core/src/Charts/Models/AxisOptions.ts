/**
 * Options for configuring chart axis display
 */
export class AxisOptions {
  /**
   * Prefix for value labels (e.g., "£", "$")
   */
  prefix: string = '';

  /**
   * Suffix for value labels (e.g., "%", "k")
   */
  suffix: string = '';

  /**
   * Maximum value for the axis scale
   */
  maxValue: number = 10000;

  /**
   * Minimum value for the axis scale (default: 0)
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
