import { FontFamilyResolver } from '../../Typography/FontFamilyResolver';
import { FontWeight } from '../../Typography/FontWeight';
import { Color } from '../../Core/Color';
import { TextDecoration } from './TextDecoration';

/**
 * Defines the visual style for text rendering. Properties set to null inherit
 * from the parent RichText element's DefaultStyle.
 */
export class TextStyle {
  /** Font family name (e.g. "Helvetica") or TTF file path. Null = inherit from parent. */
  public fontFamily?: string;

  /** Font weight (100-900). Normal = 400, Bold = 700. */
  public weight: FontWeight = FontWeight.Normal;

  /** Whether the text should be rendered in italic/oblique style. */
  public italic = false;

  /** Font size in points. Null = inherit from parent. */
  public fontSize?: number;

  /** Text color. Null = inherit from parent. */
  public color?: Color;

  /** Background highlight color behind the text. Null = no highlight. */
  public backgroundColor?: Color;

  /** Text decoration (underline, strikethrough, or both). */
  public decoration: TextDecoration = TextDecoration.None;

  /**
   * Line-height multiplier applied to font size. Null = inherit (1.2 if not set anywhere).
   * Set to 1.5 for looser leading or 1.0 for tight leading.
   */
  public lineHeightMultiplier?: number;

  /**
   * Resolves the actual PDF font name by combining FontFamily + Weight + Italic
   * through the FontFamilyResolver.
   */
  public get resolvedFontName(): string | undefined {
    if (this.fontFamily !== undefined) {
      return FontFamilyResolver.resolve(this.fontFamily, this.weight, this.italic);
    }
    return undefined;
  }

  /**
   * Creates a merged style where this style's non-null values override the base style's values.
   * Used to combine a span's local style with the RichText element's default style.
   */
  public mergeWith(baseStyle: TextStyle): TextStyle {
    if (!baseStyle) return this;

    const merged = new TextStyle();
    merged.fontFamily = this.fontFamily ?? baseStyle.fontFamily;
    merged.weight = this.weight !== FontWeight.Normal || this.fontFamily !== undefined ? this.weight : baseStyle.weight;
    merged.italic = this.italic || (this.fontFamily === undefined && baseStyle.italic);
    merged.fontSize = this.fontSize ?? baseStyle.fontSize;
    merged.color = this.color ?? baseStyle.color;
    merged.backgroundColor = this.backgroundColor ?? baseStyle.backgroundColor;
    merged.decoration = this.decoration !== TextDecoration.None ? this.decoration : baseStyle.decoration;
    merged.lineHeightMultiplier = this.lineHeightMultiplier ?? baseStyle.lineHeightMultiplier;

    return merged;
  }

  /**
   * Returns the effective font size, defaulting to 12 if not set.
   */
  public get effectiveFontSize(): number {
    return this.fontSize ?? 12;
  }

  /**
   * Returns the effective text color, defaulting to black if not set.
   */
  public get effectiveColor(): Color {
    return this.color ?? Color.black;
  }

  /**
   * Returns the effective font name, resolving family+weight+italic or defaulting to Helvetica.
   * When FontFamily is null, uses Helvetica as the base family so that Weight/Italic are still applied
   * (e.g. Bold with no family → "Helvetica-Bold", not plain "Helvetica").
   */
  public get effectiveFontName(): string {
    return FontFamilyResolver.resolve(this.fontFamily ?? 'Helvetica', this.weight, this.italic);
  }

  // --- Fluent API ---

  /** Sets font weight to Bold (700) */
  public bold(): TextStyle {
    this.weight = FontWeight.Bold;
    return this;
  }

  /** Sets font weight to Light (300) */
  public light(): TextStyle {
    this.weight = FontWeight.Light;
    return this;
  }

  /** Sets font weight to Thin (100) */
  public thin(): TextStyle {
    this.weight = FontWeight.Thin;
    return this;
  }

  /** Sets italic to true */
  public withItalic(): TextStyle {
    this.italic = true;
    return this;
  }

  /** Sets the font size */
  public withSize(size: number): TextStyle {
    this.fontSize = size;
    return this;
  }

  /** Sets the text color */
  public withColor(color: Color): TextStyle {
    this.color = color;
    return this;
  }

  /** Sets the background highlight color */
  public withBackground(color: Color): TextStyle {
    this.backgroundColor = color;
    return this;
  }

  /** Sets the font weight */
  public withWeight(weight: FontWeight): TextStyle {
    this.weight = weight;
    return this;
  }

  /** Sets the font family */
  public withFamily(family: string): TextStyle {
    this.fontFamily = family;
    return this;
  }

  /** Sets the line-height multiplier (e.g. 1.5 for looser leading) */
  public withLineHeight(multiplier: number): TextStyle {
    this.lineHeightMultiplier = multiplier;
    return this;
  }

  /** Adds underline decoration */
  public underline(): TextStyle {
    this.decoration |= TextDecoration.Underline;
    return this;
  }

  /** Adds strikethrough decoration */
  public strikethrough(): TextStyle {
    this.decoration |= TextDecoration.Strikethrough;
    return this;
  }
}
