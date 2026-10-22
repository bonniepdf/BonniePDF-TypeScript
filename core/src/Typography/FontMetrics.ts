import type { GlyphRun } from './Engine/Api/GlyphRun';
import { FontManager } from './FontManager';
import { winAnsiByte } from './WinAnsi';
import { primaryCovers, shapeTextRuns } from './TextRunShaper';
import { getActiveDocumentFonts } from './DocumentFontMetricScope';
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
   * Cache of TTF fonts parsed from a file path (used by {@link loadMeasuringTtf}).
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

  // Codes 0x80-0xFF (WinAnsiEncoding). Derived from the metric-compatible Liberation faces, which agree with
  // the tables above on every ASCII character; ISO 32000-1 Annex D does not tabulate these codes.

  // Helvetica: codes 0x80-0x9F then 0xA0-0xFF. 0 marks an undefined code.
  private static readonly HelveticaHighWidths = [
    556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 222, 222, 333, 333, 350, 556, 1000,
    333, 1000, 500, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737,
    552, 400, 549, 333, 333, 333, 576, 537, 333, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667,
    1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722,
    667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556,
    556, 556, 556, 549, 611, 556, 556, 556, 556, 500, 556, 500,
  ];

  // HelveticaBold: codes 0x80-0x9F then 0xA0-0xFF. 0 marks an undefined code.
  private static readonly HelveticaBoldHighWidths = [
    556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 278, 278, 500, 500, 350, 556, 1000,
    333, 1000, 556, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737,
    552, 400, 549, 333, 333, 333, 576, 556, 333, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722,
    1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722,
    667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611,
    611, 611, 611, 549, 611, 611, 611, 611, 611, 556, 611, 556,
  ];

  // Times: codes 0x80-0x9F then 0xA0-0xFF. 0 marks an undefined code.
  private static readonly TimesHighWidths = [
    500, 0, 333, 500, 444, 1000, 500, 500, 333, 1000, 556, 333, 889, 0, 611, 0, 0, 333, 333, 444, 444, 350, 500, 1000,
    333, 980, 389, 333, 722, 0, 444, 722, 250, 333, 500, 500, 500, 500, 200, 500, 333, 760, 276, 500, 564, 333, 760,
    500, 400, 549, 300, 300, 333, 576, 453, 333, 333, 300, 310, 500, 750, 750, 750, 444, 722, 722, 722, 722, 722, 722,
    889, 667, 611, 611, 611, 611, 333, 333, 333, 333, 722, 722, 722, 722, 722, 722, 722, 564, 722, 722, 722, 722, 722,
    722, 556, 500, 444, 444, 444, 444, 444, 444, 667, 444, 444, 444, 444, 444, 278, 278, 278, 278, 500, 500, 500, 500,
    500, 500, 500, 549, 500, 500, 500, 500, 500, 500, 500, 500,
  ];

  // TimesBold: codes 0x80-0x9F then 0xA0-0xFF. 0 marks an undefined code.
  private static readonly TimesBoldHighWidths = [
    500, 0, 333, 500, 500, 1000, 500, 500, 333, 1000, 556, 333, 1000, 0, 667, 0, 0, 333, 333, 500, 500, 350, 500, 1000,
    333, 1000, 389, 333, 722, 0, 444, 722, 250, 333, 500, 500, 500, 500, 220, 500, 333, 747, 300, 500, 570, 333, 747,
    500, 400, 549, 300, 300, 333, 576, 540, 333, 333, 300, 330, 500, 750, 750, 750, 500, 722, 722, 722, 722, 722, 722,
    1000, 722, 667, 667, 667, 667, 389, 389, 389, 389, 722, 722, 778, 778, 778, 778, 778, 570, 778, 722, 722, 722, 722,
    722, 611, 556, 500, 500, 500, 500, 500, 500, 722, 444, 444, 444, 444, 444, 278, 278, 278, 278, 500, 556, 500, 500,
    500, 500, 500, 549, 500, 556, 556, 556, 556, 500, 556, 500,
  ];

  // TimesItalic: codes 0x80-0x9F then 0xA0-0xFF. 0 marks an undefined code.
  private static readonly TimesItalicHighWidths = [
    500, 0, 333, 500, 556, 889, 500, 500, 333, 1000, 500, 333, 944, 0, 556, 0, 0, 333, 333, 556, 556, 350, 500, 889,
    333, 980, 389, 333, 667, 0, 389, 556, 250, 389, 500, 500, 500, 500, 275, 500, 333, 760, 276, 500, 675, 333, 760,
    500, 400, 549, 300, 300, 333, 576, 523, 250, 333, 300, 310, 500, 750, 750, 750, 500, 611, 611, 611, 611, 611, 611,
    889, 667, 611, 611, 611, 611, 333, 333, 333, 333, 722, 667, 722, 722, 722, 722, 722, 675, 722, 722, 722, 722, 722,
    556, 611, 500, 500, 500, 500, 500, 500, 500, 667, 444, 444, 444, 444, 444, 278, 278, 278, 278, 500, 500, 500, 500,
    500, 500, 500, 549, 500, 500, 500, 500, 500, 444, 500, 444,
  ];

  // TimesBoldItalic: codes 0x80-0x9F then 0xA0-0xFF. 0 marks an undefined code.
  private static readonly TimesBoldItalicHighWidths = [
    500, 0, 333, 500, 500, 1000, 500, 500, 333, 1000, 556, 333, 944, 0, 611, 0, 0, 333, 333, 500, 500, 350, 500, 1000,
    333, 1000, 389, 333, 722, 0, 389, 611, 250, 389, 500, 500, 500, 500, 220, 500, 333, 747, 266, 500, 606, 333, 747,
    500, 400, 549, 300, 300, 333, 576, 500, 250, 333, 300, 300, 500, 750, 750, 750, 500, 667, 667, 667, 667, 667, 667,
    944, 667, 667, 667, 667, 667, 389, 389, 389, 389, 722, 722, 722, 722, 722, 722, 722, 570, 722, 722, 722, 722, 722,
    611, 611, 500, 500, 500, 500, 500, 500, 500, 722, 444, 444, 444, 444, 444, 278, 278, 278, 278, 500, 556, 500, 500,
    500, 500, 500, 549, 500, 556, 556, 556, 556, 444, 500, 444,
  ];

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
  public static getStringWidth(
    text: string,
    fontIdentifier: string,
    fontSize: number,
    features?: Readonly<Record<string, number>>
  ): number {
    if (!text) return 0;

    const resolved = this.resolveShapingFont(fontIdentifier);
    if (resolved.font) return this.getKernedStringWidth(text, resolved.font, fontSize, features);
    // Fallback when the font cannot be loaded (e.g. browser, missing/corrupt file).
    if (resolved.unparsed) return text.length * (fontSize * 0.5);

    // C. IS IT A STANDARD FONT? (approximate hardcoded tables)
    return this.getStandardFontWidth(text, fontIdentifier, fontSize);
  }

  /**
   * The font {@link getStringWidth} measures `fontIdentifier` with by shaping (through
   * {@link getKernedStringWidth}), or `font: null` when it uses a width table: a standard
   * font, or a TrueType file that could not be loaded (`unparsed`).
   * @internal
   */
  public static resolveShapingFont(fontIdentifier: string): { font: TtfFont | null; unparsed: boolean } {
    // A. IS IT A CUSTOM TTF FILE (direct path)?
    // Prefer a pre-loaded TtfFont instance registered under this exact path -
    // populated by PdfResourceRegistry after async font preloading, or
    // explicitly by `loadFontFromUrl(url)`. Falling back to a load from the path otherwise.
    if (hasFontFileExtension(fontIdentifier)) {
      const pathInstance = getFontInstanceAlias(fontIdentifier);
      if (pathInstance) return parsedFont(pathInstance);
      return this.loadMeasuringTtf(fontIdentifier);
    }

    // B1. IS IT A REGISTERED ALIAS TO A TtfFont INSTANCE (bytes-based)?
    const fontInstance = getFontInstanceAlias(fontIdentifier);
    if (fontInstance) return parsedFont(fontInstance);

    const ttfPath = getFontPathAlias(fontIdentifier);
    if (ttfPath) return this.loadMeasuringTtf(ttfPath);

    // PDF/A and PDF/UA embed registered substitutes for the standard 12 Latin
    // Type-1 fonts. Resolve the exact face before layout makes its first
    // wrapping or pagination decision.
    if (shouldUseEmbeddedStandardMetrics()) {
      const embedded = resolveStandardFontMetric(fontIdentifier);
      if (embedded) {
        cacheDocumentFontInstance(fontIdentifier, embedded);
        return { font: embedded, unparsed: false };
      }
    }
    return { font: null, unparsed: false };
  }

  /**
   * Measures the width of a string using actual per-glyph advances and kerning
   * from an embedded TrueType font. This is the embedded-font measurement path
   * used by getStringWidth, including feature overrides and font fallback.
   * Returns 0 if font is null or text is empty.
   * @param text - The text to measure
   * @param font - The embedded TTF font
   * @param fontSize - The font size in points
   * @internal
   */
  public static getKernedStringWidth(
    text: string,
    font: TtfFont,
    fontSize: number,
    features?: Readonly<Record<string, number>>
  ): number {
    if (!text || !font) return 0;

    if (primaryCovers(text, font)) return (sumAdvances(font.shape(text, features)) * fontSize) / font.unitsPerEm;
    const candidates = [
      { fontIdentifier: 'primary', font },
      ...[...(getActiveDocumentFonts()?.fallbackFonts() ?? []), ...FontManager.getFallbackFonts()]
        .filter(f => f.font !== font)
        .map(f => ({ fontIdentifier: f.key, font: f.font })),
    ];
    return shapeTextRuns(text, candidates).runs.reduce((sum, run) => {
      const face = candidates[run.fontIndex].font;
      return sum + (sumAdvances(face.shape(run.text, features)) * fontSize) / face.unitsPerEm;
    }, 0);
  }

  // Parse the TTF (once per path) for measuring with real per-glyph advances and kern
  // pairs. In non-Node contexts (no filesystem) the sync load throws, and the caller falls
  // back to a coarse estimate.
  private static loadMeasuringTtf(filepath: string): { font: TtfFont | null; unparsed: boolean } {
    let font = this.TtfInstanceCache.get(filepath);
    if (font === undefined) {
      try {
        font = TtfFont.fromFileSync(filepath);
      } catch {
        font = null;
      }
      this.TtfInstanceCache.set(filepath, font);
    }
    return font ? { font, unparsed: false } : { font: null, unparsed: true };
  }

  private static metricFace(identifier: string): TtfFont | null {
    const face =
      getFontInstanceAlias(identifier) ??
      this.TtfInstanceCache.get(identifier) ??
      (shouldUseEmbeddedStandardMetrics() ? resolveStandardFontMetric(identifier) : null);
    if (face) return face;
    identifier = getFontPathAlias(identifier) ?? identifier;
    if (/\.(?:ttf|otf)$/i.test(identifier) && !this.TtfInstanceCache.has(identifier)) this.loadMeasuringTtf(identifier);
    return this.TtfInstanceCache.get(identifier) ?? null;
  }
  /** @internal Whether layout is using an embedded font face. */
  public static usesEmbeddedMetrics(identifier: string): boolean {
    return this.metricFace(identifier) !== null;
  }
  /** @internal Number of painted glyphs, after substitutions and fallback. */
  public static getGlyphCount(text: string, identifier: string, features?: Readonly<Record<string, number>>): number {
    const font = this.metricFace(identifier);
    if (!font) return Array.from(text).filter(c => c.codePointAt(0)! >= 32).length;
    if (primaryCovers(text, font)) return font.shape(text, features).count;
    const candidates = [
      { fontIdentifier: 'primary', font },
      ...[...(getActiveDocumentFonts()?.fallbackFonts() ?? []), ...FontManager.getFallbackFonts()]
        .filter(f => f.font !== font)
        .map(f => ({ fontIdentifier: f.key, font: f.font })),
    ];
    return shapeTextRuns(text, candidates).runs.reduce(
      (sum, run) => sum + candidates[run.fontIndex].font.shape(run.text, features).count,
      0
    );
  }
  /** @internal Emergency wrapping prefers safe shaped cluster boundaries. */
  public static isSafeTextBreak(
    text: string,
    identifier: string,
    offset: number,
    features?: Readonly<Record<string, number>>
  ): boolean {
    return this.getTextBreakPredicate(text, identifier, features)(offset);
  }

  /** @internal Retains one shaped remainder while checking successive emergency breaks. */
  public static getTextBreakPredicate(
    text: string,
    identifier: string,
    features?: Readonly<Record<string, number>>
  ): (offset: number) => boolean {
    const glyphs = this.metricFace(identifier)?.shape(text, features);
    return offset => {
      if (!glyphs) return true;
      for (let i = 0; i < glyphs.count; i++) {
        const cluster = glyphs.cluster(i);
        if (
          (cluster < offset && offset < cluster + glyphs.sourceLength(i)) ||
          (cluster === offset && glyphs.unsafeToBreak(i))
        )
          return false;
      }
      return true;
    };
  }

  private static getStandardFontHighTable(fontName: string): readonly number[] | null {
    switch (fontName) {
      case 'Helvetica':
      case 'Helvetica-Oblique':
        return this.HelveticaHighWidths;
      case 'Helvetica-Bold':
      case 'Helvetica-BoldOblique':
        return this.HelveticaBoldHighWidths;
      case 'Times-Roman':
        return this.TimesHighWidths;
      case 'Times-Bold':
        return this.TimesBoldHighWidths;
      case 'Times-Italic':
        return this.TimesItalicHighWidths;
      case 'Times-BoldItalic':
        return this.TimesBoldItalicHighWidths;
      default:
        return null;
    }
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
      let count = 0;
      for (const _ of text) count++;
      return count * (fontSize * 0.6);
    }

    const table = this.getStandardFontTable(fontName);
    const highTable = this.getStandardFontHighTable(fontName);
    let totalWidth = 0;
    for (const c of text) {
      // The text fonts show a character through its WinAnsi byte, so measure that byte.
      const code = highTable ? winAnsiByte(c.codePointAt(0)!) : c.charCodeAt(0);
      const w =
        (code >= 128 && highTable
          ? highTable[code - 128]
          : table && code >= 32 && code - 32 < table.length
            ? table[code - 32]
            : 0) || 500;
      totalWidth += w;
    }
    return (totalWidth / 1000) * fontSize;
  }
}

/** The same left-to-right sum as `reduce((sum, g) => sum + g.advanceX, 0)`, without a closure. */
// Advances are integers summed left to right, so the total is exact.
function sumAdvances(glyphs: GlyphRun): number {
  return glyphs.totalAdvanceX();
}

// One result per font for resolveShapingFont, which is asked on every measurement.
const parsedFonts = new WeakMap<TtfFont, { readonly font: TtfFont; readonly unparsed: false }>();
function parsedFont(font: TtfFont): { font: TtfFont; unparsed: boolean } {
  let result = parsedFonts.get(font);
  if (!result) parsedFonts.set(font, (result = Object.freeze({ font, unparsed: false as const })));
  return result;
}

/** Whether `identifier` ends with `.ttf` or `.otf` in any case, without lower-casing it. */
function hasFontFileExtension(identifier: string): boolean {
  const n = identifier.length;
  if (n < 4 || identifier.charCodeAt(n - 4) !== 46) return false; // '.'
  const a = identifier.charCodeAt(n - 3) | 32,
    b = identifier.charCodeAt(n - 2) | 32,
    c = identifier.charCodeAt(n - 1) | 32;
  return (a === 116 || a === 111) && b === 116 && c === 102; // t|o, t, f
}
