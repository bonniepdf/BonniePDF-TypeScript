/**
 * Provides unit conversion utilities for measurements
 */
import { Unit } from './Unit';

/** Converts measurements between points and common physical units. */
export class Units {
  private static readonly PointsPerInch = 72;
  private static readonly PointsPerCentimeter = 72 / 2.54;
  private static readonly PointsPerMillimeter = 72 / 25.4;

  /**
   * Converts a value from the specified unit to points
   * @param value - The value to convert
   * @param unit - The unit to convert from
   * @returns The value in points
   */
  public static toPoints(value: number, unit: Unit): number {
    switch (unit) {
      case Unit.Point:
        return value;
      case Unit.Inch:
        return value * Units.PointsPerInch;
      case Unit.Centimeter:
        return value * Units.PointsPerCentimeter;
      case Unit.Millimeter:
        return value * Units.PointsPerMillimeter;
      default:
        return value;
    }
  }

  /**
   * Converts inches to points
   */
  public static inch(value: number): number {
    return value * Units.PointsPerInch;
  }

  /**
   * Converts centimeters to points
   */
  public static cm(value: number): number {
    return value * Units.PointsPerCentimeter;
  }

  /**
   * Converts millimeters to points
   */
  public static mm(value: number): number {
    return value * Units.PointsPerMillimeter;
  }
}
