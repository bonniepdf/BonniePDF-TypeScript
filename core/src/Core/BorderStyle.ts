/**
 * Provides semantic border width presets for common use cases.
 * All values are in points (1/72 inch).
 */
export class BorderStyle {
  /**
   * No border (0 points)
   */
  static readonly None = 0;
  /**
   * Hairline border - the thinnest practical line (0.25 points).
   * May not render on all screens but prints well.
   */
  static readonly Hairline = 0.25;
  /**
   * Thin border (0.5 points) - subtle but visible on most displays.
   * Good for table cell borders and subtle separators.
   */
  static readonly Thin = 0.5;
  /**
   * Normal border (1 point) - standard visible border.
   * The PDF default, reliable across all renderers.
   */
  static readonly Normal = 1;
  /**
   * Medium border (1.5 points) - slightly emphasized.
   * Good for section separators or highlighted elements.
   */
  static readonly Medium = 1.5;
  /**
   * Thick border (2 points) - prominent border.
   * Good for emphasis or outer container borders.
   */
  static readonly Thick = 2;
  /**
   * Heavy border (3 points) - very prominent.
   * Use sparingly for strong visual emphasis.
   */
  static readonly Heavy = 3;
}
