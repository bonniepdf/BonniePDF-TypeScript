import { FontFamilyResolver } from '../../Typography/FontFamilyResolver';
import { FontWeight } from '../../Typography/FontWeight';
import { Color } from '../../Core/Color';
import { TextDecoration } from './TextDecoration';
import { BaselineAlignment } from './BaselineAlignment';
import { DecorationStyle } from './DecorationStyle';
import { applyOptions } from '../../Core/applyOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import {
  toTextDecoration,
  toDecorationStyle,
  toBaselineAlignment,
  toFontWeight,
  type TextDecorationInput,
  type DecorationStyleInput,
  type BaselineAlignmentInput,
  type FontWeightInput,
} from '../../Normalize/toEnum';

/**
 * Every settable {@link TextStyle} property, as a runtime list.
 *
 * Exists so a test can assert the options bag covers the class's whole settable
 * surface - `09a §9` risk 1 ("silent capability gaps"): a property that exists
 * on the class but not in its options is a knob TypeScript callers can reach and
 * C# callers cannot, which is a parity defect rather than a spelling difference.
 */
export const TEXT_STYLE_OPTION_KEYS = [
  'fontFamily',
  'fontWeight',
  'italic',
  'fontSize',
  'color',
  'backgroundColor',
  'decoration',
  'decorationColor',
  'decorationThickness',
  'decorationStyle',
  'baselineAlignment',
  'baselineShift',
  'letterSpacing',
  'wordSpacing',
  'lineHeight',
] as const;

type TextStyleOptionKey = (typeof TEXT_STYLE_OPTION_KEYS)[number];

/**
 * Keys whose accepted *input* is wider than the stored type, because the
 * property is an asymmetric accessor (reads canonical, writes forgiving).
 * `Pick` yields the getter type, so these are overridden explicitly - the
 * pattern `09a §3.1` prescribes.
 */
type TextStyleWidenedKey =
  | 'fontWeight'
  | 'color'
  | 'backgroundColor'
  | 'decoration'
  | 'decorationColor'
  | 'decorationStyle'
  | 'baselineAlignment';

/**
 * Options for constructing a {@link TextStyle}.
 *
 * Derived from the class rather than hand-written, so adding a property to
 * `TextStyle` and to {@link TEXT_STYLE_OPTION_KEYS} carries its JSDoc into
 * autocomplete with no second declaration to keep in step.
 */
export type TextStyleOptions = Partial<Omit<Pick<TextStyle, TextStyleOptionKey>, TextStyleWidenedKey>> & {
  /** Font weight. Accepts `'bold'`, `'semi-bold'`, … or the numeric value. */
  fontWeight?: FontWeightInput;
  /** Text colour. Accepts a palette token (`'slate-600'`) or hex (`'#ff00aa'`). */
  color?: ColorInput;
  /** Background highlight colour. Accepts a palette token or hex. */
  backgroundColor?: ColorInput;
  /** Decoration. Accepts one token or a list: `['underline', 'overline']`. */
  decoration?: TextDecorationInput;
  /** Decoration line colour. Accepts a palette token or hex. */
  decorationColor?: ColorInput;
  /** Decoration line style. Accepts `'solid' | 'wavy' | 'dashed' | 'dotted'`. */
  decorationStyle?: DecorationStyleInput;
  /** Baseline alignment. Accepts `'baseline' | 'superscript' | 'subscript'`. */
  baselineAlignment?: BaselineAlignmentInput;
};

/**
 * Defines the visual style for text rendering. Properties left unset inherit
 * from the parent RichText element's defaultStyle.
 */
export class TextStyle {
  /**
   * Creates a text style, optionally configured in one expression.
   *
   * ```typescript
   * new TextStyle({ fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' });
   * ```
   *
   * Every option is optional and omitted keys are left at their default, so the
   * no-argument form remains valid. Values go through the property setters, so
   * they accept the same forgiving inputs as direct assignment.
   */
  constructor(options?: TextStyleOptions) {
    applyOptions(this, options);
  }

  /**
   * Returns an independent copy of this style.
   *
   * The fluent builders (`bold()`, `withColor()`, `subscript()`, …) mutate and
   * return `this`, so a style shared across several `RichText` spans and mutated
   * between them would otherwise leak its final state back onto the earlier
   * spans. `RichText.span()` clones the style on the way in for exactly this
   * reason; callers can also clone explicitly to fork a base style. All fields
   * are value types (`Color` is immutable), so a shallow copy is a full copy.
   */
  public clone(): TextStyle {
    return Object.assign(new TextStyle(), this);
  }

  /** Font family name (e.g. "Helvetica") or TTF file path. Null = inherit from parent. */
  public fontFamily?: string;

  private _fontWeight: FontWeight = FontWeight.Normal;

  /**
   * Font weight (100-900). Normal = 400, Bold = 700.
   * Accepts `'bold'`, `'semi-bold'`, … or the numeric value.
   */
  public get fontWeight(): FontWeight {
    return this._fontWeight;
  }
  public set fontWeight(value: FontWeightInput) {
    this._fontWeight = toFontWeight(value);
  }

  /** Whether the text should be rendered in italic/oblique style. */
  public italic = false;

  /** Font size in points. Null = inherit from parent. */
  public fontSize?: number;

  private _color?: Color;

  /**
   * Text color. Undefined = inherit from parent.
   * Accepts a palette token (`'slate-600'`) or hex (`'#ff00aa'`).
   */
  public get color(): Color | undefined {
    return this._color;
  }
  public set color(value: ColorInput | undefined) {
    this._color = value === undefined ? undefined : toColor(value);
  }

  private _backgroundColor?: Color;

  /**
   * Background highlight color behind the text. Undefined = no highlight.
   * Accepts a palette token or hex.
   */
  public get backgroundColor(): Color | undefined {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput | undefined) {
    this._backgroundColor = value === undefined ? undefined : toColor(value);
  }

  private _decoration: TextDecoration = TextDecoration.None;

  /**
   * Text decoration (underline, strikethrough, overline, or a combination).
   * Accepts a single token, or a list for combinations:
   * `['underline', 'overline']`.
   */
  public get decoration(): TextDecoration {
    return this._decoration;
  }
  public set decoration(value: TextDecorationInput) {
    this._decoration = toTextDecoration(value);
  }

  private _decorationColor?: Color;

  /**
   * Colour of the decoration lines (underline/strikethrough/overline).
   * Undefined = use the text {@link color}, which is the default.
   * Accepts a palette token or hex.
   */
  public get decorationColor(): Color | undefined {
    return this._decorationColor;
  }
  public set decorationColor(value: ColorInput | undefined) {
    this._decorationColor = value === undefined ? undefined : toColor(value);
  }

  /**
   * Thickness of the decoration lines in points. Null = the default derived from
   * font size (`max(0.5, fontSize / 18)`).
   */
  public decorationThickness?: number;

  private _decorationStyle: DecorationStyle = DecorationStyle.Solid;

  /**
   * Line style for decorations. Default solid.
   * Accepts `'solid' | 'wavy' | 'dashed' | 'dotted'`.
   */
  public get decorationStyle(): DecorationStyle {
    return this._decorationStyle;
  }
  public set decorationStyle(value: DecorationStyleInput) {
    this._decorationStyle = toDecorationStyle(value);
  }

  private _baselineAlignment: BaselineAlignment = BaselineAlignment.Baseline;

  /**
   * Semantic vertical alignment (super/subscript). See {@link BaselineAlignment}.
   * The shift magnitude derives from {@link effectiveFontSize} unless
   * {@link baselineShift} is set explicitly.
   * Accepts `'baseline' | 'superscript' | 'subscript'`.
   */
  public get baselineAlignment(): BaselineAlignment {
    return this._baselineAlignment;
  }
  public set baselineAlignment(value: BaselineAlignmentInput) {
    this._baselineAlignment = toBaselineAlignment(value);
  }

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
  public lineHeight?: number;

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
    merged.lineHeight = this.lineHeight ?? baseStyle.lineHeight;

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
    this.lineHeight = multiplier;
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
