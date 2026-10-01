import { TtfFont } from './TrueType/TtfFont';
import {
  cacheDocumentFontInstance,
  getFontInstanceAlias,
  getFontPathAlias,
  registerFontInstanceAlias,
  registerFontPathAlias,
  resolveStandardFontMetric,
  shouldUseEmbeddedStandardMetrics,
} from './DocumentFontMetricScope';

/**
 * Provides font metrics for calculating text width in PDF documents.
 * Supports both standard PDF fonts and custom TTF fonts.
 */
export class FontMetrics {
  /**
   * Cache of TTF fonts parsed from a file path (used by {@link getTtfWidth}).
   * A cached `null` records a path that failed to load so we don't retry it.
   */
  private static readonly TtfInstanceCache: Map<string, TtfFont | null> = new Map();

  /**
   * Registers a logical font name alias pointing to a specific TTF file path.
   * Should be called by PdfResourceRegistry when PDF/A mode maps a standard font to an embedded TTF.
   * Ensures getStringWidth measures using actual TTF glyph metrics rather than
   * the approximate standard-font width tables, so layout matches rendering.
   * @param logicalName - The logical font name (e.g., "Helvetica-Bold")
   * @param ttfPath - The path to the TTF file
   */
  public static registerFontAlias(logicalName: string, ttfPath: string): void {
    registerFontPathAlias(logicalName, ttfPath);
  }

  /**
   * Registers a logical font name alias pointing to an already-parsed TtfFont.
   * Used when the font was loaded from bytes (e.g., bundled Liberation Sans) rather
   * than a file path, so file-based caching is bypassed entirely.
   * @internal
   */
  public static registerFontInstance(logicalName: string, font: TtfFont): void {
    registerFontInstanceAlias(logicalName, font);
  }

  // ── Standard-14 advance-width tables ──────────────────────────────────────
  //
  // Source: ISO 32000-1 (PDF 1.7) Annex D, which tabulates the advance widths
  // of the 14 standard Type 1 fonts. These are factual font metrics reproduced
  // from the published international standard. A conformant PDF reader lays out
  // non-embedded standard fonts with these same values, so matching them keeps
  // our text measurement aligned with what the viewer actually renders.
  //
  // Each table is indexed by (codePoint - 32) over ASCII 32–126 (95 entries),
  // in the 1000-unit em used by PDF standard fonts.

  // Helvetica
  private static readonly HelveticaWidths = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
    722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
    556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
    260, 334, 584,
  ];

  // Helvetica-Bold
  private static readonly HelveticaBoldWidths = [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833,
    722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611,
    556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389,
    280, 389, 584,
  ];

  // Times-Bold
  private static readonly TimesBoldWidths = [
    250, 333, 555, 500, 500, 1000, 833, 278, 333, 333, 500, 570, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500,
    500, 500, 500, 333, 333, 570, 570, 570, 500, 930, 722, 667, 722, 722, 667, 611, 778, 778, 389, 500, 778, 667, 944,
    722, 778, 611, 778, 722, 556, 667, 722, 722, 1000, 722, 722, 667, 333, 278, 333, 581, 500, 333, 500, 556, 444, 556,
    444, 333, 500, 556, 278, 333, 556, 278, 833, 556, 500, 556, 556, 444, 389, 333, 556, 500, 722, 500, 500, 444, 394,
    220, 394, 520,
  ];

  // Times-Italic
  private static readonly TimesItalicWidths = [
    250, 333, 420, 500, 500, 833, 778, 214, 333, 333, 500, 675, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500,
    500, 500, 500, 333, 333, 675, 675, 675, 500, 920, 611, 611, 667, 722, 611, 611, 722, 722, 333, 444, 667, 556, 833,
    667, 722, 611, 722, 611, 500, 556, 722, 611, 833, 611, 556, 556, 389, 278, 389, 422, 500, 333, 500, 500, 444, 500,
    444, 278, 500, 500, 278, 278, 444, 278, 722, 500, 500, 500, 500, 389, 389, 278, 500, 444, 667, 444, 444, 389, 400,
    275, 400, 541,
  ];

  // Times-BoldItalic
  private static readonly TimesBoldItalicWidths = [
    250, 389, 555, 500, 500, 833, 778, 278, 333, 333, 500, 570, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500,
    500, 500, 500, 333, 333, 570, 570, 570, 500, 832, 667, 667, 667, 722, 667, 667, 722, 778, 389, 500, 667, 611, 889,
    722, 722, 611, 722, 667, 556, 611, 722, 667, 889, 667, 611, 611, 333, 278, 333, 570, 500, 333, 500, 500, 444, 500,
    444, 333, 500, 556, 278, 278, 500, 278, 778, 556, 500, 500, 500, 389, 389, 278, 556, 444, 667, 500, 444, 389, 348,
    220, 348, 570,
  ];

  // Times-Roman
  private static readonly TimesWidths = [
    250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500,
    500, 500, 500, 278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889,
    722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500,
    444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480,
    200, 480, 541,
  ];

  // Symbol and ZapfDingbats use their own font-specific encodings, so unlike the
  // Latin tables above these span codes 32–254 (223 entries, indexed by
  // code - 32). Unencoded positions (the C1 control block 127–159, and code 240)
  // are 0. A non-embedded standard font is drawn with its built-in encoding, so
  // measuring by the same code keeps layout aligned with the rendered glyph.

  // Symbol
  private static readonly SymbolWidths = [
    250, 333, 713, 500, 549, 833, 778, 439, 333, 333, 500, 549, 250, 549, 250, 278, 500, 500, 500, 500, 500, 500, 500,
    500, 500, 500, 278, 278, 549, 549, 549, 444, 549, 722, 667, 722, 612, 611, 763, 603, 722, 333, 631, 722, 686, 889,
    722, 722, 768, 741, 556, 592, 611, 690, 439, 768, 645, 795, 611, 333, 863, 333, 658, 500, 500, 631, 549, 549, 494,
    439, 521, 411, 603, 329, 603, 549, 549, 576, 521, 549, 549, 521, 549, 603, 439, 576, 713, 686, 493, 686, 494, 480,
    200, 480, 549, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    750, 620, 247, 549, 167, 713, 500, 753, 753, 753, 753, 1042, 987, 603, 987, 603, 400, 549, 411, 549, 549, 713, 494,
    460, 549, 549, 549, 549, 1000, 603, 1000, 658, 823, 686, 795, 987, 768, 768, 823, 768, 768, 713, 713, 713, 713, 713,
    713, 713, 768, 713, 790, 790, 890, 823, 549, 250, 713, 603, 603, 1042, 987, 603, 987, 603, 494, 329, 790, 790, 786,
    713, 384, 384, 384, 384, 384, 384, 494, 494, 494, 494, 0, 329, 274, 686, 686, 686, 384, 384, 384, 384, 384, 384,
    494, 494, 494,
  ];

  // ZapfDingbats
  private static readonly ZapfDingbatsWidths = [
    278, 974, 961, 974, 980, 719, 789, 790, 791, 690, 960, 939, 549, 855, 911, 933, 911, 945, 974, 755, 846, 762, 761,
    571, 677, 763, 760, 759, 754, 494, 552, 537, 577, 692, 786, 788, 788, 790, 793, 794, 816, 823, 789, 841, 823, 833,
    816, 831, 923, 744, 723, 749, 790, 792, 695, 776, 768, 792, 759, 707, 708, 682, 701, 826, 815, 789, 789, 707, 687,
    696, 689, 786, 787, 713, 791, 785, 791, 873, 761, 762, 762, 759, 759, 892, 892, 788, 784, 438, 138, 277, 415, 392,
    392, 668, 668, 0, 390, 390, 317, 317, 276, 276, 509, 509, 410, 410, 234, 234, 334, 334, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 732, 544, 544, 910, 667, 760, 760, 776, 595, 694, 626, 788, 788, 788, 788, 788, 788,
    788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788,
    788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 788, 894, 838, 1016, 458, 748, 924, 748, 918, 927, 928, 928, 834,
    873, 828, 924, 924, 917, 930, 931, 463, 883, 836, 836, 867, 867, 696, 696, 874, 0, 874, 760, 946, 771, 865, 771,
    888, 967, 888, 831, 873, 927, 970, 918,
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
    // Prefer a pre-loaded TtfFont instance registered under this exact path -
    // populated by PdfResourceRegistry after async font preloading, or
    // explicitly by `loadFontFromUrl(url)`. Falling through to `getTtfWidth`
    // uses an approximate width table that under-measures supplementary-plane glyphs.
    const lowerIdentifier = fontIdentifier.toLowerCase();
    if (lowerIdentifier.endsWith('.ttf') || lowerIdentifier.endsWith('.otf')) {
      const pathInstance = getFontInstanceAlias(fontIdentifier);
      if (pathInstance) {
        return this.getKernedStringWidth(text, pathInstance, fontSize);
      }
      return this.getTtfWidth(text, fontIdentifier, fontSize);
    }

    // B1. IS IT A REGISTERED ALIAS TO A TtfFont INSTANCE (bytes-based)?
    const fontInstance = getFontInstanceAlias(fontIdentifier);
    if (fontInstance) return this.getKernedStringWidth(text, fontInstance, fontSize);

    const ttfPath = getFontPathAlias(fontIdentifier);
    if (ttfPath) return this.getTtfWidth(text, ttfPath, fontSize);

    // PDF/A and PDF/UA embed registered substitutes for the standard 12 Latin
    // Type-1 fonts. Resolve the exact face before layout makes its first
    // wrapping or pagination decision.
    if (shouldUseEmbeddedStandardMetrics()) {
      const embedded = resolveStandardFontMetric(fontIdentifier);
      if (embedded) {
        cacheDocumentFontInstance(fontIdentifier, embedded);
        return this.getKernedStringWidth(text, embedded, fontSize);
      }
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
   * @internal
   */
  public static getKernedStringWidth(text: string, font: TtfFont, fontSize: number): number {
    if (!text || !font) return 0;

    const scale = fontSize / font.unitsPerEm;
    let width = 0;

    let prevGid = 0;
    let hasPrev = false;

    for (const rune of text) {
      // `for...of` yields one Unicode code point per iteration (so `rune` is a
      // string of length 1 for BMP chars, 2 for surrogate-pair supplementary
      // chars). `charCodeAt(0)` only sees the high surrogate of supplementary
      // chars (e.g. 0xD83D for U+1F600), causing emoji to miss their glyph and
      // fall through to a 500-unit fallback - which under-measures wide emoji
      // glyphs and prevents word-wrap from triggering. Use codePointAt to get
      // the full code point so the cmap lookup succeeds.
      const code = rune.codePointAt(0) ?? 0;
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
    // Parse the TTF (once per path) and measure with real per-glyph advances and
    // kern pairs. This replaces the former approximation that returned a flat 500-unit
    // advance for every character, which mis-measured every embedded-by-path font
    // and broke wrapping/alignment. In non-Node contexts (no filesystem) the
    // sync load throws and we fall back to a coarse estimate.
    let font = this.TtfInstanceCache.get(filepath);
    if (font === undefined) {
      try {
        font = TtfFont.fromFileSync(filepath);
      } catch {
        font = null;
      }
      this.TtfInstanceCache.set(filepath, font);
    }

    if (font) {
      return this.getKernedStringWidth(text, font, fontSize);
    }

    // Fallback when the font cannot be loaded (e.g. browser, missing/corrupt file).
    return text.length * (fontSize * 0.5);
  }

  private static getStandardFontTable(fontName: string): readonly number[] | null {
    switch (fontName) {
      case 'Helvetica':
      case 'Helvetica-Oblique':
        return this.HelveticaWidths;
      case 'Helvetica-Bold':
      case 'Helvetica-BoldOblique':
        return this.HelveticaBoldWidths;
      case 'Times-Roman':
        return this.TimesWidths;
      case 'Times-Bold':
        return this.TimesBoldWidths;
      case 'Times-Italic':
        return this.TimesItalicWidths;
      case 'Times-BoldItalic':
        return this.TimesBoldItalicWidths;
      case 'Symbol':
        return this.SymbolWidths;
      case 'ZapfDingbats':
        return this.ZapfDingbatsWidths;
      default:
        return null;
    }
  }

  private static getStandardFontWidth(text: string, fontName: string, fontSize: number): number {
    // Courier variants: all use a fixed 600-unit advance (monospace)
    if (fontName.includes('Courier')) {
      return text.length * (fontSize * 0.6);
    }

    const table = this.getStandardFontTable(fontName);
    let totalWidth = 0;
    for (const c of text) {
      const index = c.charCodeAt(0) - 32;
      const w = table && index >= 0 && index < table.length ? table[index] : 500;
      totalWidth += w;
    }
    return (totalWidth / 1000) * fontSize;
  }
}
