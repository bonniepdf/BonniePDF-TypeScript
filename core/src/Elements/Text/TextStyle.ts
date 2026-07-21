import { FontFamilyResolver } from '../../Typography/FontFamilyResolver';
import { FontWeight } from '../../Typography/FontWeight';
import { Color } from '../../Core/Color';
import { TextDecoration } from './TextDecoration';
import { BaselineAlignment } from './BaselineAlignment';
import { DecorationStyle } from './DecorationStyle';

/**
 * Defines the visual style for text rendering. Properties set to null inherit
 * from the parent RichText element's defaultStyle.
 */
export class TextStyle {
  /** Font family name (e.g. "Helvetica") or TTF file path. Null = inherit from parent. */
  public fontFamily?: string;

  /** Font weight (100-900). Normal = 400, Bold = 700. */
  public fontWeight: FontWeight = FontWeight.Normal;

  /** Whether the text should be rendered in italic/oblique style. */
  public italic = false;

  /** Font size in points. Null = inherit from parent. */
  public fontSize?: number;

  /** Text color. Null = inherit from parent. */
  public color?: Color;

  /** Background highlight color behind the text. Null = no highlight. */
  public backgroundColor?: Color;

  /** Text decoration (underline, strikethrough, overline, or a combination). */
  public decoration: TextDecoration = TextDecoration.None;

  /**
   * Colour of the decoration lines (underline/strikethrough/overline). Null =
   * use the text {@link color}, matching the pre-G-39 behaviour.
   */
  public decorationColor?: Color;

  /**
   * Thickness of the decoration lines in points. Null = the default derived from
   * font size (`max(0.5, fontSize / 18)`).
   */
  public decorationThickness?: number;

  /** Line style for decorations (solid/wavy/dashed/dotted). Default solid. */
  public decorationStyle: DecorationStyle = DecorationStyle.Solid;

  /**
   * Semantic vertical alignment (super/subscript). See {@link BaselineAlignment}.
   * The shift magnitude derives from {@link effectiveFontSize} unless
   * {@link baselineShift} is set explicitly.
   */
  public baselineAlignment: BaselineAlignment = BaselineAlignment.Baseline;

  /**
   * Explicit baseline shift in points (positive = up). Overrides the magnitude
   * implied by {@link baselineAlignment}. Null = derive from the alignment.
   */
  public baselineShift?: number;

  /**
   * Extra spacing in points added after every glyph (tracking). Null = 0.
   * Changes advances, so it flows through measurement, PDF (`Tc`), and SVG.
   */
  public letterSpacing?: number;

  /**
   * Extra spacing in points added after every space (word spacing). Null = 0.
   * Changes advances, so it flows through measurement, PDF, and SVG.
   */
  public wordSpacing?: number;

  /**
   * Line-height multiplier applied to font size. Null = inherit (1.2 if not set anywhere).
   * Set to 1.5 for looser leading or 1.0 for tight leading.
   */
  public lineHeightMultiplier?: number;

  /**
   * Resolves the actual PDF font name by combining fontFamily + weight + italic
   * through the FontFamilyResolver.
   */
  public get resolvedFontName(): string | undefined {
    if (this.fontFamily !== undefined) {
      return FontFamilyResolver.resolve(this.fontFamily, this.fontWeight, this.italic);
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
    merged.fontWeight =
      this.fontWeight !== FontWeight.Normal || this.fontFamily !== undefined ? this.fontWeight : baseStyle.fontWeight;
    merged.italic = this.italic || (this.fontFamily === undefined && baseStyle.italic);
    merged.fontSize = this.fontSize ?? baseStyle.fontSize;
    merged.color = this.color ?? baseStyle.color;
    merged.backgroundColor = this.backgroundColor ?? baseStyle.backgroundColor;
    merged.decoration = this.decoration !== TextDecoration.None ? this.decoration : baseStyle.decoration;
    merged.decorationColor = this.decorationColor ?? baseStyle.decorationColor;
    merged.decorationThickness = this.decorationThickness ?? baseStyle.decorationThickness;
    merged.decorationStyle =
      this.decorationStyle !== DecorationStyle.Solid ? this.decorationStyle : baseStyle.decorationStyle;
    merged.baselineAlignment =
      this.baselineAlignment !== BaselineAlignment.Baseline ? this.baselineAlignment : baseStyle.baselineAlignment;
    merged.baselineShift = this.baselineShift ?? baseStyle.baselineShift;
    merged.letterSpacing = this.letterSpacing ?? baseStyle.letterSpacing;
    merged.wordSpacing = this.wordSpacing ?? baseStyle.wordSpacing;
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
   * When fontFamily is null, uses Helvetica as the base family so that weight/italic are still applied
   * (e.g. Bold with no family → "Helvetica-Bold", not plain "Helvetica").
   */
  public get effectiveFontName(): string {
    return FontFamilyResolver.resolve(this.fontFamily ?? 'Helvetica', this.fontWeight, this.italic);
  }

  // --- Fluent API ---

  /** Sets font weight to Bold (700) */
  public bold(): TextStyle {
    this.fontWeight = FontWeight.Bold;
    return this;
  }

  /** Sets font weight to Light (300) */
  public light(): TextStyle {
    this.fontWeight = FontWeight.Light;
    return this;
  }

  /** Sets font weight to Thin (100) */
  public thin(): TextStyle {
    this.fontWeight = FontWeight.Thin;
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
    this.fontWeight = weight;
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

  /** Adds overline decoration (a line above the text) */
  public overline(): TextStyle {
    this.decoration |= TextDecoration.Overline;
    return this;
  }

  /** Sets the decoration line colour (underline/strikethrough/overline) */
  public withDecorationColor(color: Color): TextStyle {
    this.decorationColor = color;
    return this;
  }

  /** Sets the decoration line thickness in points */
  public withDecorationThickness(thickness: number): TextStyle {
    this.decorationThickness = thickness;
    return this;
  }

  /** Sets the decoration line style (solid/wavy/dashed/dotted) */
  public withDecorationStyle(style: DecorationStyle): TextStyle {
    this.decorationStyle = style;
    return this;
  }

  /** Adds a wavy underline (spell-check style) */
  public wavyUnderline(): TextStyle {
    this.decoration |= TextDecoration.Underline;
    this.decorationStyle = DecorationStyle.Wavy;
    return this;
  }

  /** Raises the text above the baseline (superscript) */
  public superscript(): TextStyle {
    this.baselineAlignment = BaselineAlignment.Superscript;
    return this;
  }

  /** Lowers the text below the baseline (subscript) */
  public subscript(): TextStyle {
    this.baselineAlignment = BaselineAlignment.Subscript;
    return this;
  }

  /** Sets an explicit baseline shift in points (positive = up) */
  public withBaselineShift(points: number): TextStyle {
    this.baselineShift = points;
    return this;
  }

  /** Sets letter spacing (tracking) in points, added after every glyph */
  public withLetterSpacing(points: number): TextStyle {
    this.letterSpacing = points;
    return this;
  }

  /** Sets word spacing in points, added after every space */
  public withWordSpacing(points: number): TextStyle {
    this.wordSpacing = points;
    return this;
  }
}
