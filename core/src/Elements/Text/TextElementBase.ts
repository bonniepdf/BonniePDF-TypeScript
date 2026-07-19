import { ElementBase } from '../ElementBase';
import { FontFamilyResolver } from '../../Typography/FontFamilyResolver';
import { FontWeight } from '../../Typography/FontWeight';
import { StandardFonts } from '../../Typography/StandardFonts';
import { FontMetrics } from '../../Typography/FontMetrics';
import { Color } from '../../Core/Color';
import { TextDecoration } from './TextDecoration';
import { TextStyle } from './TextStyle';

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
  private _lineHeightMultiplier?: number;
  private _textDecoration?: TextDecoration;

  /**
   * Font size for text rendering. Defaults to 12 if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get fontSize(): number {
    return this._fontSize ?? 12;
  }
  public set fontSize(value: number) {
    this._fontSize = value;
  }

  /**
   * Text color for rendering. Defaults to black if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get textColor(): Color {
    return this._textColor ?? Color.black;
  }
  public set textColor(value: Color) {
    this._textColor = value;
  }

  /**
   * Text decoration (underline, strikethrough, or both). Defaults to None if not set.
   */
  public get textDecoration(): TextDecoration {
    return this._textDecoration ?? TextDecoration.None;
  }
  public set textDecoration(value: TextDecoration) {
    this._textDecoration = value;
  }

  /**
   * Line-height multiplier applied to font size. Defaults to 1.2 if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get lineHeightMultiplier(): number {
    return this._lineHeightMultiplier ?? 1.2;
  }
  public set lineHeightMultiplier(value: number) {
    this._lineHeightMultiplier = value;
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

  public set fontWeight(value: FontWeight) {
    this._fontWeight = value;
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
    if (this._lineHeightMultiplier === undefined && style.lineHeightMultiplier !== undefined) {
      this._lineHeightMultiplier = style.lineHeightMultiplier;
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
      this.textColor = style.color;
    }
    if (style.decoration !== TextDecoration.None) {
      this.textDecoration = style.decoration;
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
   * Line height calculated from font size and lineHeightMultiplier
   */
  protected get lineHeight(): number {
    return this.fontSize * this.lineHeightMultiplier;
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
   * Word-wraps a single break-free segment to maxWidth.
   */
  private wrapSegment(text: string, maxWidth: number): string[] {
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
    return FontMetrics.getStringWidth(measuredText, this.fontName, this.fontSize);
  }
}
