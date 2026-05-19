import { StandardFonts } from './StandardFonts';
import { FontWeight } from './FontWeight';

/**
 * Defines the TTF file paths for each variant of a custom font family.
 */
export class FontFamilyDefinition {
  /**
   * Regular (Normal weight, non-italic) variant path
   */
  public regular: string;
  /**
   * Bold variant path. Falls back to Regular if not set.
   */
  public bold?: string;
  /**
   * Italic variant path. Falls back to Regular if not set.
   */
  public italic?: string;
  /**
   * Bold Italic variant path. Falls back to Bold, then Italic, then Regular.
   */
  public boldItalic?: string;

  /**
   * Gets the best matching variant path for the requested style.
   * Falls back gracefully when a specific variant isn't available.
   * @param bold - Whether bold style is requested
   * @param italic - Whether italic style is requested
   */
  public getVariant(bold: boolean, italic: boolean): string {
    if (bold && italic) {
      return this.boldItalic ?? this.bold ?? this.italic ?? this.regular;
    }
    if (bold) {
      return this.bold ?? this.regular;
    }
    if (italic) {
      return this.italic ?? this.regular;
    }
    return this.regular;
  }
}

/**
 * Resolves a font family name + weight + italic to the actual PDF font name or TTF file path.
 * Handles the 14 standard PDF fonts (Helvetica, Times, Courier families) and custom TTF families.
 */
export class FontFamilyResolver {
  /**
   * Registered custom font families mapping family name to variant paths.
   */
  private static readonly customFamilies = new Map<string, FontFamilyDefinition>();

  /**
   * Standard font family lookup: (family, isBold, isItalic) → PDF font name.
   * Maps the 3 standard families (Helvetica, Times, Courier) to their 4 variants each.
   */
  private static readonly standardFonts = new Map<string, string>();

  static {
    // Helvetica family
    FontFamilyResolver.standardFonts.set('Helvetica,false,false', StandardFonts.Helvetica);
    FontFamilyResolver.standardFonts.set('Helvetica,true,false', StandardFonts.HelveticaBold);
    FontFamilyResolver.standardFonts.set('Helvetica,false,true', StandardFonts.HelveticaOblique);
    FontFamilyResolver.standardFonts.set('Helvetica,true,true', StandardFonts.HelveticaBoldOblique);

    // Times family
    FontFamilyResolver.standardFonts.set('Times,false,false', StandardFonts.TimesRoman);
    FontFamilyResolver.standardFonts.set('Times,true,false', StandardFonts.TimesBold);
    FontFamilyResolver.standardFonts.set('Times,false,true', StandardFonts.TimesItalic);
    FontFamilyResolver.standardFonts.set('Times,true,true', StandardFonts.TimesBoldItalic);

    // Courier family
    FontFamilyResolver.standardFonts.set('Courier,false,false', StandardFonts.Courier);
    FontFamilyResolver.standardFonts.set('Courier,true,false', StandardFonts.CourierBold);
    FontFamilyResolver.standardFonts.set('Courier,false,true', StandardFonts.CourierOblique);
    FontFamilyResolver.standardFonts.set('Courier,true,true', StandardFonts.CourierBoldOblique);
  }

  /**
   * Maps family name aliases to their canonical family name.
   * Allows users to specify "Arial" or "sans-serif" and get Helvetica.
   */
  private static readonly familyAliases = new Map<string, string>([
    ['arial', 'Helvetica'],
    ['sans-serif', 'Helvetica'],
    ['helvetica', 'Helvetica'],
    ['times', 'Times'],
    ['times new roman', 'Times'],
    ['times-roman', 'Times'],
    ['serif', 'Times'],
    ['courier', 'Courier'],
    ['courier new', 'Courier'],
    ['monospace', 'Courier'],
    ['mono', 'Courier'],
  ]);

  /**
   * Resolves a font family + weight + italic to the actual font name or path.
   * @param family - Font family name (e.g. "Helvetica", "Arial", or a TTF path)
   * @param weight - Font weight (Normal, Bold, etc.)
   * @param italic - Whether italic/oblique is requested
   * @returns The resolved PDF font name or TTF file path
   */
  public static resolve(family: string, weight: FontWeight, italic: boolean): string {
    if (!family) return StandardFonts.Helvetica;

    // If the family is already a fully-qualified standard font name, return it directly
    if (FontFamilyResolver.isStandardFontName(family)) return family;

    // If it's a TTF file path, check custom families first
    if (family.toLowerCase().endsWith('.ttf') || family.toLowerCase().endsWith('.otf')) {
      return family; // Direct file path — no variant resolution
    }

    const isBold = weight >= FontWeight.SemiBold;

    // Check custom registered families
    const customFamily = FontFamilyResolver.customFamilies.get(family);
    if (customFamily) {
      return customFamily.getVariant(isBold, italic);
    }

    // Resolve alias to canonical family name
    const canonicalFamily = FontFamilyResolver.resolveAlias(family);

    // Look up standard font
    const key = `${canonicalFamily},${isBold},${italic}`;
    const fontName = FontFamilyResolver.standardFonts.get(key);
    if (fontName) {
      return fontName;
    }

    // Fallback: return Helvetica variant
    const fallbackKey = `Helvetica,${isBold},${italic}`;
    return FontFamilyResolver.standardFonts.get(fallbackKey) ?? StandardFonts.Helvetica;
  }

  /**
   * Registers a custom font family with paths to its variant TTF files.
   * @param familyName - The family name
   * @param definition - The font family definition with variant paths
   */
  public static registerFamily(familyName: string, definition: FontFamilyDefinition): void {
    FontFamilyResolver.customFamilies.set(familyName, definition);
  }

  /**
   * Clears all registered custom font families.
   */
  public static clearCustomFamilies(): void {
    FontFamilyResolver.customFamilies.clear();
  }

  /**
   * Resolves a family name alias to its canonical name (case-insensitive).
   * Returns the original name if no alias is found.
   */
  private static resolveAlias(family: string): string {
    const lower = family.toLowerCase().trim();
    return FontFamilyResolver.familyAliases.get(lower) ?? family;
  }

  /**
   * Checks whether a font name is already a fully-qualified standard font variant name
   * (e.g. "Helvetica-Bold", "Times-Italic") that should be passed through as-is.
   * Base family names ("Helvetica", "Times-Roman", "Courier") are intentionally excluded
   * so that Weight and Italic parameters are still applied when resolving them.
   */
  private static isStandardFontName(name: string): boolean {
    return (
      name === StandardFonts.HelveticaBold ||
      name === StandardFonts.HelveticaOblique ||
      name === StandardFonts.HelveticaBoldOblique ||
      name === StandardFonts.TimesBold ||
      name === StandardFonts.TimesItalic ||
      name === StandardFonts.TimesBoldItalic ||
      name === StandardFonts.CourierBold ||
      name === StandardFonts.CourierOblique ||
      name === StandardFonts.CourierBoldOblique ||
      name === StandardFonts.Symbol ||
      name === StandardFonts.ZapfDingbats
    );
  }
}
