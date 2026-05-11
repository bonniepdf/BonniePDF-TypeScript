/**
 * Standard PDF font names (14 Type 1 fonts built into every PDF reader)
 */
export class StandardFonts {
  // Serif
  /**
   * Times-Roman - standard serif font
   */
  static readonly TimesRoman = 'Times-Roman';
  /**
   * Times-Bold - bold serif font
   */
  static readonly TimesBold = 'Times-Bold';
  /**
   * Times-Italic - italic serif font
   */
  static readonly TimesItalic = 'Times-Italic';
  /**
   * Times-BoldItalic - bold italic serif font
   */
  static readonly TimesBoldItalic = 'Times-BoldItalic';

  // Sans-Serif
  /**
   * Helvetica - standard sans-serif font
   */
  static readonly Helvetica = 'Helvetica';
  /**
   * Helvetica-Bold - bold sans-serif font
   */
  static readonly HelveticaBold = 'Helvetica-Bold';
  /**
   * Helvetica-Oblique - italic sans-serif font
   */
  static readonly HelveticaOblique = 'Helvetica-Oblique';
  /**
   * Helvetica-BoldOblique - bold italic sans-serif font
   */
  static readonly HelveticaBoldOblique = 'Helvetica-BoldOblique';

  // Monospace
  /**
   * Courier - monospace font
   */
  static readonly Courier = 'Courier';
  /**
   * Courier-Bold - bold monospace font
   */
  static readonly CourierBold = 'Courier-Bold';
  /**
   * Courier-Oblique - italic monospace font
   */
  static readonly CourierOblique = 'Courier-Oblique';
  /**
   * Courier-BoldOblique - bold italic monospace font
   */
  static readonly CourierBoldOblique = 'Courier-BoldOblique';

  // Special
  /**
   * Symbol - symbol font
   */
  static readonly Symbol = 'Symbol';
  /**
   * ZapfDingbats - dingbat font
   */
  static readonly ZapfDingbats = 'ZapfDingbats';
}
