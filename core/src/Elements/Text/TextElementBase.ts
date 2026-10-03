import { ElementBase } from '../ElementBase';
import { FontFamilyResolver } from '../../Typography/FontFamilyResolver';
import { getActiveDocumentFonts } from '../../Typography/DocumentFontMetricScope';
import { FontWeight } from '../../Typography/FontWeight';
import { StandardFonts } from '../../Typography/StandardFonts';
import { FontMetrics } from '../../Typography/FontMetrics';
import { Color } from '../../Core/Color';
import { TextDecoration } from './TextDecoration';
import { DecorationStyle } from './DecorationStyle';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import {
  toTextDecoration,
  toDecorationStyle,
  toFontWeight,
  type TextDecorationInput,
  type DecorationStyleInput,
  type FontWeightInput,
} from '../../Normalize/toEnum';
import { TextStyle } from './TextStyle';
import { getTextSpacingWidth } from '../../Typography/TextSpacing';
import { toLength, toOptionalLength, type LengthInput } from '../../Normalize/toLength';

/**
 * Base class for text-based PDF elements that provides common functionality for
 * font handling, text encoding, and line wrapping. This reduces code duplication
 * across text elements and ensures consistent text rendering behavior.
 */
export abstract class TextElementBase extends ElementBase {
  /**
   * Token for injecting total pages count
   */
  public static readonly TotalPagesToken = '{{TotalPages}}';

  /**
   * Token for injecting the current page number
   */
  public static readonly CurrentPageToken = '{{CurrentPage}}';

  // ── Font properties (backing fields + explicit-set tracking) ─────────────

  private _fontFamily?: string;
  private _fontWeight: FontWeight = FontWeight.Normal;
  private _italic = false;

  private _fontName: string = StandardFonts.Helvetica;

  /**
   * The TTF/OTF path or PDF standard font name for rendering.
   * Assigning marks the font as explicitly set, so the document-level
   * defaultTextStyle cascade will not override it.
   */
  public get fontName(): string {
    // While a document with its own fonts is being generated, a family is resolved
    // against them (spec 16 §4). Otherwise the name resolved when the family was set stands.
    if (this._fontFamily !== undefined && getActiveDocumentFonts()) {
      return FontFamilyResolver.resolve(this._fontFamily, this._fontWeight, this._italic);
    }
    return this._fontName;
  }
  public set fontName(value: string) {
    this._fontName = value;
    this._fontFamily = undefined;
    this._fontExplicit = true;
  }

  /** True once user code explicitly sets any font-related property. */
  private _fontExplicit = false;

  constructor() {
    super();
  }

  // ── Nullable backing fields for cascade-aware properties ─────────────────

  private _fontSize?: number;
  private _textColor?: Color;
  private _lineHeight?: number;
  private _textDecoration?: TextDecoration;

  /**
   * Font size for text rendering. Defaults to 12 if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get fontSize(): number {
    return this._fontSize ?? 12;
  }
  public set fontSize(value: LengthInput) {
    this._fontSize = toLength(value);
  }

  /**
   * Text color for rendering. Defaults to black if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get color(): Color {
    return this._textColor ?? Color.black;
  }
  public set color(value: ColorInput) {
    this._textColor = toColor(value);
  }

  /**
   * Text decoration (underline, strikethrough, overline, or a combination).
   * Defaults to None if not set.
   */
  public get decoration(): TextDecoration {
    return this._textDecoration ?? TextDecoration.None;
  }
  public set decoration(value: TextDecorationInput) {
    this._textDecoration = toTextDecoration(value);
  }

  private _decorationColor?: Color;

  /**
   * Colour of the decoration lines. Undefined = use {@link color}, the default.
   */
  public get decorationColor(): Color | undefined {
    return this._decorationColor;
  }
  public set decorationColor(value: ColorInput | undefined) {
    this._decorationColor = value === undefined ? undefined : toColor(value);
  }

  private _decorationThickness?: number;

  /**
   * Thickness of the decoration lines in points. Null = the default derived from
   * font size (`max(0.5, fontSize / 18)`).
   *
   * Accepts a length: a number of points, `'0.5pt'`, or `{ value, unit }` (§4A.3).
   */
  public get decorationThickness(): number | undefined {
    return this._decorationThickness;
  }
  public set decorationThickness(value: LengthInput | undefined) {
    this._decorationThickness = toOptionalLength(value);
  }

  private _letterSpacing = 0;

  /**
   * Letter spacing (tracking) in points, added after every glyph.
   * Default 0. Changes advances, so it is reflected in measurement and both
   * PDF and SVG output.
   *
   * Accepts a length: a number of points, `'0.2mm'`, or `{ value, unit }` (§4A.3).
   */
  public get letterSpacing(): number {
    return this._letterSpacing;
  }
  public set letterSpacing(value: LengthInput) {
    this._letterSpacing = toLength(value);
  }

  private _wordSpacing = 0;

  /**
   * Word spacing in points, added after every space. Default 0.
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }` (§4A.3).
   */
  public get wordSpacing(): number {
    return this._wordSpacing;
  }
  public set wordSpacing(value: LengthInput) {
    this._wordSpacing = toLength(value);
  }

  private _decorationStyle: DecorationStyle = DecorationStyle.Solid;

  /**
   * Line style for decorations (solid/wavy/dashed/dotted). Default solid.
   */
  public get decorationStyle(): DecorationStyle {
    return this._decorationStyle;
  }
  public set decorationStyle(value: DecorationStyleInput) {
    this._decorationStyle = toDecorationStyle(value);
  }

  // ── Smart font getters/setters (mark _fontExplicit on assignment) ─────────

  /**
   * Font family name (e.g. "Helvetica", "Times", "Arial") for weight/italic resolution.
   * When set, fontName is automatically resolved via FontFamilyResolver using
   * the current fontWeight and italic values.
   */
  public get fontFamily(): string | undefined {
    return this._fontFamily;
  }

  public set fontFamily(value: string | undefined) {
    this._fontFamily = value;
    this._fontExplicit = true;
    if (value !== undefined) {
      this.resolveFontName();
    }
  }

  /**
   * Font weight (100-900). Normal = 400, Bold = 700.
   * When fontFamily is set, triggers automatic resolution.
   * When fontFamily is not set, uses the current fontName as the base family for resolution.
   */
  public get fontWeight(): FontWeight {
    return this._fontWeight;
  }

  public set fontWeight(value: FontWeightInput) {
    this._fontWeight = toFontWeight(value);
    this._fontExplicit = true;
    this.resolveFontName();
  }

  /**
   * Whether the text should be rendered in italic/oblique style.
   * When fontFamily is set, triggers automatic resolution.
   * When fontFamily is not set, uses the current fontName as the base family for resolution.
   */
  public get italic(): boolean {
    return this._italic;
  }

  public set italic(value: boolean) {
    this._italic = value;
    this._fontExplicit = true;
    this.resolveFontName();
  }

  // ── Cascade application ───────────────────────────────────────────────────

  /**
   * Applies style properties from `style` only for properties that have not
   * been explicitly set by user code. Called by Document.generateBytes() when
   * DocumentSettings.defaultTextStyle is set.
   *
   * Writes directly to backing fields so it does NOT mark properties as
   * "explicitly set" - a second call (e.g. after updating defaultTextStyle)
   * can still override cascade values.
   */
  public applyDefaultStyleIfNotSet(style: TextStyle): void {
    // Font: only apply if user hasn't touched any font property
    if (!this._fontExplicit) {
      if (style.fontFamily !== undefined) {
        this._fontFamily = style.fontFamily;
        if (style.fontWeight !== FontWeight.Normal) this._fontWeight = style.fontWeight;
        if (style.italic) this._italic = true;
        this.resolveFontName();
      }
    }
    if (this._fontSize === undefined && style.fontSize !== undefined) {
      this._fontSize = style.fontSize;
    }
    if (this._textColor === undefined && style.color !== undefined) {
      this._textColor = style.color;
    }
    if (this._lineHeight === undefined && style.lineHeight !== undefined) {
      this._lineHeight = style.lineHeight;
    }
    if (this._textDecoration === undefined && style.decoration !== TextDecoration.None) {
      this._textDecoration = style.decoration;
    }
  }

  /**
   * (Legacy path used by subclasses.) Unconditionally applies a default style -
   * marks all set properties as explicit so cascade won't re-override them.
   */
  protected applyDefaultStyle(style: TextStyle): void {
    if (style.fontFamily !== undefined) {
      this.fontFamily = style.fontFamily;
    }
    if (style.fontWeight !== FontWeight.Normal) {
      this.fontWeight = style.fontWeight;
    }
    if (style.italic) {
      this.italic = true;
    }
    if (style.fontSize !== undefined) {
      this.fontSize = style.fontSize;
    }
    if (style.color !== undefined) {
      this.color = style.color;
    }
    if (style.decoration !== TextDecoration.None) {
      this.decoration = style.decoration;
    }
  }

  // ── Font resolution ───────────────────────────────────────────────────────

  /**
   * Resolves fontName from fontFamily + fontWeight + italic via FontFamilyResolver.
   * Falls back to the current fontName as the base family when fontFamily is not set,
   * enabling .Bold() and .Italic() to work without an explicit .Font() call.
   */
  private resolveFontName(): void {
    const family = this._fontFamily ?? this._fontName;
    // Write to the backing field directly so the default-style cascade
    // (which calls resolveFontName via applyDefaultStyleIfNotSet) does not
    // mark the font as explicitly set.
    this._fontName = FontFamilyResolver.resolve(family, this._fontWeight, this._italic);
  }

  // ── Line height ───────────────────────────────────────────────────────────

  /**
   * Line-height multiplier applied to font size. Defaults to 1.2 if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get lineHeight(): number {
    return this._lineHeight ?? 1.2;
  }
  public set lineHeight(value: number) {
    this._lineHeight = value;
  }

  /**
   * Line height in points, calculated from font size and the lineHeight multiplier.
   */
  protected get effectiveLineHeight(): number {
    return this.fontSize * this.lineHeight;
  }

  // ── Text measurement and wrapping ─────────────────────────────────────────

  /**
   * Computes wrapped lines for text.
   *
   * Explicit line breaks (`\n`, `\r\n`, or a bare `\r`) are honoured first and
   * split the text into segments; each segment is then word-wrapped to
   * maxWidth. An empty segment (from consecutive breaks, or a leading/trailing
   * break) yields one blank line, so `"a\n\nb"` produces `["a", "", "b"]`.
   * Text containing no break characters wraps exactly as before.
   */
  protected computeLines(text: string, maxWidth: number): string[] {
    if (!text) return [];

    const lines: string[] = [];
    // Normalise CRLF / CR to LF, then split on hard breaks.
    const segments = text.replace(/\r\n?/g, '\n').split('\n');

    for (const segment of segments) {
      const wrapped = this.wrapSegment(segment, maxWidth);
      if (wrapped.length === 0) {
        // Preserve the blank line represented by an empty segment.
        lines.push('');
      } else {
        for (const line of wrapped) lines.push(line);
      }
    }

    return lines;
  }

  /**
   * Wraps a single break-free segment, keeping every space (spec 03 "Preserved whitespace").
   *
   * Works by Unicode code point and never splits a surrogate pair. A line is the longest prefix that
   * fits: `firstWidth` for a segment's first line, `width` for the rest. It breaks at the last space
   * that has a non-space before it, trimming the line's trailing spaces and dropping the spaces at the
   * break; failing that, it breaks at the last code point that fits. At least one code point is placed
   * on every line, so it always terminates.
   */
  protected wrapPreservingWhitespace(text: string, firstWidth: number, width: number): string[] {
    const lines: string[] = [];
    if (text === '') return lines;

    let rest = Array.from(text);
    let limit = firstWidth;
    const fits = (count: number): boolean => this.measureTextWidth(rest.slice(0, count).join('')) <= limit;

    while (rest.length > 0) {
      if (fits(rest.length)) {
        lines.push(rest.join(''));
        break;
      }

      // One code point is always placed, even when it alone is wider than the line.
      if (rest.length === 1) {
        lines.push(rest[0]);
        break;
      }

      // The longest prefix that fits, never fewer than one code point.
      let lo = 1;
      let hi = rest.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (fits(mid)) lo = mid;
        else hi = mid - 1;
      }
      const count = lo;

      let cut = -1;
      if (rest[count] === ' ' && rest.slice(0, count).some(c => c !== ' ')) {
        cut = count;
      } else {
        for (let i = count - 1; i > 0; i--) {
          if (rest[i] === ' ' && rest.slice(0, i).some(c => c !== ' ')) {
            cut = i;
            break;
          }
        }
      }

      if (cut >= 0) {
        lines.push(rest.slice(0, cut).join('').replace(/ +$/, ''));
        rest = rest.slice(cut);
        while (rest[0] === ' ') rest.shift();
      } else {
        lines.push(rest.slice(0, count).join(''));
        rest = rest.slice(count);
      }
      limit = width;
    }

    return lines;
  }

  /**
   * Word-wraps a single break-free segment to maxWidth.
   */
  protected wrapSegment(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    if (text === '') return lines;

    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine === '' ? word : currentLine + ' ' + word;

      // Calculate exact width of the test line (handling tokens)
      const testWidth = this.measureTextWidth(testLine);

      if (testWidth > maxWidth) {
        // Current line is full, add it and start new line with current word
        if (currentLine !== '') {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        // Word fits, add it to current line
        currentLine = testLine;
      }
    }

    // Don't forget the last line
    if (currentLine !== '') {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Measures the width of a text string using the current font settings.
   * Handles substitution tokens like {{TotalPages}} by measuring a placeholder.
   */
  protected measureTextWidth(text: string): number {
    // Replace tokens with estimated placeholders (2 digits) for measurement
    const measuredText = text
      .replace(TextElementBase.TotalPagesToken, '00')
      .replace(TextElementBase.CurrentPageToken, '00');
    return FontMetrics.getStringWidth(measuredText, this.fontName, this.fontSize) + this.spacingWidth(measuredText);
  }

  /**
   * Extra advance contributed by {@link letterSpacing}/{@link wordSpacing} for a
   * string: letter spacing after every glyph plus word spacing after
   * every space. Matches the PDF/SVG painters and the reserved layout width.
   * Zero when no spacing is set.
   */
  protected spacingWidth(text: string): number {
    return getTextSpacingWidth(text, this.letterSpacing, this.wordSpacing);
  }
}
