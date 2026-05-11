/**
 * Measurement units for lengths and dimensions.
 * Following PDF specification, points (1/72 inch) are the default unit.
 */
export enum Unit {
  /**
   * Points - 1/72 inch (PDF default)
   */
  Point = 'Point',
  /**
   * Inches - 72 points
   */
  Inch = 'Inch',
  /**
   * Centimeters - 28.35 points
   */
  Centimeter = 'Centimeter',
  /**
   * Millimeters - 2.835 points
   */
  Millimeter = 'Millimeter'
}
