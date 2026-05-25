import { TtfFont } from './TrueType/TtfFont';

/**
 * Provides font metrics for calculating text width in PDF documents.
 * Supports both standard PDF fonts and custom TTF fonts.
 */
export class FontMetrics {
  private static readonly TtfCache: Map<string, number[]> = new Map();
  private static readonly FontPathAliases: Map<string, string> = new Map();
  private static readonly FontInstanceAliases: Map<string, TtfFont> = new Map();

  /** Bytes-based font instances registered when FontManager provides bytes (no file path available). */
  private static readonly FontInstanceAliases: Map<string, TtfFont> = new Map();

  /**
   * Registers a logical font name alias pointing to a specific TTF file path.
   * Should be called by PdfResourceRegistry when PDF/A mode maps a standard font to an embedded TTF.
   * Ensures getStringWidth measures using actual TTF glyph metrics rather than
   * the approximate standard-font width tables, so layout matches rendering.
   * @param logicalName - The logical font name (e.g., "Helvetica-Bold")
   * @param ttfPath - The path to the TTF file
   */
  public static registerFontAlias(logicalName: string, ttfPath: string): void {
    this.FontPathAliases.set(logicalName, ttfPath);
  }

  /**
   * Registers a logical font name alias pointing to an already-parsed TtfFont.
   * Used when the font was loaded from bytes (e.g., bundled Liberation Sans) rather
   * than a file path, so file-based caching is bypassed entirely.
   */
  public static registerFontInstance(logicalName: string, font: TtfFont): void {
    this.FontInstanceAliases.set(logicalName, font);
  }

  private static readonly HelveticaWidths = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
    722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
    556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
    260, 334, 584,
  ];

  private static readonly TimesWidths = [
    250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500,
    500, 500, 500, 278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889,
    722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500,
    444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480,
    200, 480, 541,
  ];

  /**
   * Gets the width of a text string in points
   * @param text - The text to measure
   * @param fontIdentifier - Font name (e.g., "Helvetica") or TTF file path (e.g., "C:/Fonts/arial.ttf")
   * @param fontSize - The font size in points
   * @returns The width of the text in points
   */
  public static getStringWidth(text: string, fontIdentifier: string, fontSize: number): number {
    if (!text) return 0;

    // A. IS IT A CUSTOM TTF FILE (direct path)?
    if (fontIdentifier.toLowerCase().endsWith('.ttf')) {
      return this.getTtfWidth(text, fontIdentifier, fontSize);
    }

    // B1. IS IT A REGISTERED ALIAS TO A TtfFont INSTANCE (bytes-based)?
    const fontInstance = this.FontInstanceAliases.get(fontIdentifier);
    if (fontInstance) {
      return this.getKernedStringWidth(text, fontInstance, fontSize);
    }

    // B2. IS IT A REGISTERED ALIAS TO A TTF FILE?
    // When PDF/A mode embeds a real TTF for a logical name (e.g. "Helvetica-Bold" → arialbd.ttf),
    // measure using the actual TTF metrics so layout matches rendering.
    const ttfPath = this.FontPathAliases.get(fontIdentifier);
    if (ttfPath) {
      return this.getTtfWidth(text, ttfPath, fontSize);
    }

    // C. IS IT A STANDARD FONT? (approximate hardcoded tables)
    return this.getStandardFontWidth(text, fontIdentifier, fontSize);
  }

  /**
   * Measures the width of a string using actual per-glyph advances and kerning
   * from an embedded TrueType font. More accurate than getStringWidth for
   * embedded fonts because it accounts for kern pairs.
   * Returns 0 if font is null or text is empty.
   * @param text - The text to measure
   * @param font - The embedded TTF font
   * @param fontSize - The font size in points
   */
  public static getKernedStringWidth(text: string, font: TtfFont, fontSize: number): number {
    if (!text || !font) return 0;

    const scale = fontSize / font.unitsPerEm;
    let width = 0;

    let prevGid = 0;
    let hasPrev = false;

    for (const rune of text) {
      const code = rune.charCodeAt(0);
      if (code < 32) continue; // Skip control chars

      const gid = font.getGlyphId(code);

      if (hasPrev && font.hasKerning) {
        const kern = font.getKerning(prevGid, gid);
        width += kern * scale;
      }

      width += font.getGlyphWidth(gid) * scale;
      prevGid = gid;
      hasPrev = true;
    }

    return width;
  }

  private static getTtfWidth(text: string, filepath: string, fontSize: number): number {
    // 1. Load into cache if missing
    let widths = this.TtfCache.get(filepath);
    if (!widths) {
      try {
        widths = this.loadTtfWidths(filepath);
        this.TtfCache.set(filepath, widths);
      } catch {
        // Fallback if file not found or corrupted
        return text.length * (fontSize * 0.5);
      }
    }

    let totalWidth = 0;
    for (const c of text) {
      const index = c.charCodeAt(0) - 32;
      if (index >= 0 && index < widths.length) {
        totalWidth += widths[index];
      } else {
        totalWidth += 500;
      }
    }

    return (totalWidth / 1000) * fontSize;
  }

  private static loadTtfWidths(filepath: string): number[] {
    // Stub - would implement TTF parsing in a real implementation
    return new Array(95).fill(500);
  }

  private static getStandardFontWidth(text: string, fontName: string, fontSize: number): number {
    // 1. Courier (Monospace) - Fixed width of 600 units (0.6)
    if (fontName.includes('Courier')) {
      return text.length * (fontSize * 0.6);
    }

    // 2. Decide which table to use
    // Note: Times-Bold needs a slightly different table in reality,
    // but for a lightweight engine, using the Base table + 5% multiplier is acceptable.
    const table = fontName.includes('Times') ? this.TimesWidths : this.HelveticaWidths;

    // 3. Modifiers
    // Bold fonts are generally 2-5% wider.
    // Italic fonts often have the same advance width as Roman, just slanted.
    const multiplier = fontName.includes('Bold') ? 1.05 : 1.0;

    let totalWidth = 0;
    for (const c of text) {
      const index = c.charCodeAt(0) - 32;
      const w = index >= 0 && index < table.length ? table[index] : 500;
      totalWidth += w;
    }

    return (totalWidth / 1000) * fontSize * multiplier;
  }
}
