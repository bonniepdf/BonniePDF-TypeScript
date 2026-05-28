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

  public fontFamily?: string;
  public weight: FontWeight = FontWeight.Normal;
  public isItalic = false;

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
    this.fontFamily = undefined;
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
   * When set, FontName is automatically resolved via FontFamilyResolver using
   * the current Weight and IsItalic values.
   */
  public get FontFamily(): string | undefined {
    return this.fontFamily;
  }

  public set FontFamily(value: string | undefined) {
    this.fontFamily = value;
    this._fontExplicit = true;
    if (value !== undefined) {
      this.resolveFontName();
    }
  }

  /**
   * Font weight (100-900). Normal = 400, Bold = 700.
   * When FontFamily is set, triggers automatic resolution.
   * When FontFamily is not set, uses the current FontName as the base family for resolution.
   */
  public get Weight(): FontWeight {
    return this.weight;
  }

  public set Weight(value: FontWeight) {
    this.weight = value;
    this._fontExplicit = true;
    this.resolveFontName();
  }

  /**
   * Whether the text should be rendered in italic/oblique style.
   * When FontFamily is set, triggers automatic resolution.
   * When FontFamily is not set, uses the current FontName as the base family for resolution.
   */
  public get IsItalic(): boolean {
    return this.isItalic;
  }

  public set IsItalic(value: boolean) {
    this.isItalic = value;
    this._fontExplicit = true;
    this.resolveFontName();
  }

  /**
   * The resolved PDF font name used for rendering.
   * Can be set directly (e.g. "Helvetica-Bold") for backward compatibility,
   * or resolved automatically from FontFamily + Weight + IsItalic.
   * Setting this directly clears FontFamily.
   */
  public get FontName(): string {
    return this._fontName;
  }

  public set FontName(value: string) {
    this._fontName = value;
    this.fontFamily = undefined;
    this._fontExplicit = true;
  }

  // ── Cascade application ───────────────────────────────────────────────────

  /**
   * Applies style properties from `style` only for properties that have not
   * been explicitly set by user code. Called by Document.generateBytes() when
   * DocumentSettings.defaultTextStyle is set.
   *
   * Writes directly to backing fields so it does NOT mark properties as
   * "explicitly set" — a second call (e.g. after updating defaultTextStyle)
   * can still override cascade values.
   */
  public applyDefaultStyleIfNotSet(style: TextStyle): void {
    // Font: only apply if user hasn't touched any font property
    if (!this._fontExplicit) {
      if (style.fontFamily !== undefined) {
        this.fontFamily = style.fontFamily;
        if (style.weight !== FontWeight.Normal) this.weight = style.weight;
        if (style.italic) this.isItalic = true;
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
   * (Legacy path used by subclasses.) Unconditionally applies a default style —
   * marks all set properties as explicit so cascade won't re-override them.
   */
  protected applyDefaultStyle(style: TextStyle): void {
    if (style.fontFamily !== undefined) {
      this.FontFamily = style.fontFamily; // goes through setter → _fontExplicit = true
    }
    if (style.weight !== FontWeight.Normal) {
      this.Weight = style.weight;
    }
    if (style.italic) {
      this.IsItalic = true;
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
   * Resolves FontName from FontFamily + Weight + IsItalic via FontFamilyResolver.
   * Falls back to the current FontName as the base family when FontFamily is not set,
   * enabling .Bold() and .Italic() to work without an explicit .Font() call.
   */
  private resolveFontName(): void {
    const family = this.fontFamily ?? this._fontName;
    // Write to the backing field directly so the default-style cascade
    // (which calls resolveFontName via applyDefaultStyleIfNotSet) does not
    // mark the font as explicitly set.
    this._fontName = FontFamilyResolver.resolve(family, this.weight, this.isItalic);
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
   * Computes wrapped lines for text that exceeds the maximum width.
   * Uses word wrapping to break lines at appropriate positions.
   */
  protected computeLines(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    if (!text) return lines;

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
