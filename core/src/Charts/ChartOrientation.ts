/**
 * Controls the orientation of a Cartesian chart.
 */
export enum ChartOrientation {
  /**
   * Categories run along the X-axis (bottom) and values along the Y-axis (left). Default.
   */
  Vertical = 'Vertical',

  /**
   * Categories run along the Y-axis (left) and values along the X-axis (bottom).
   * Bars, stems, and filled areas extend horizontally from the left axis baseline.
   */
  Horizontal = 'Horizontal',
}
