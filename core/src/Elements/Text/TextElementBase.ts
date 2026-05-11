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

  public fontFamily?: string;
  public weight: FontWeight = FontWeight.Normal;
  public isItalic = false;
  public fontName: string = StandardFonts.Helvetica;

  constructor() {
    super();
    // Apply default style if set in the ambient context
    // TypeScript doesn't have AsyncLocal, so this would need to be handled differently
  }

  protected applyDefaultStyle(style: TextStyle): void {
    if (style.fontFamily !== undefined) {
      this.fontFamily = style.fontFamily;
    }
    if (style.weight !== FontWeight.Normal) {
      this.weight = style.weight;
    }
    if (style.italic) {
      this.isItalic = true;
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
    this.resolveFontName();
  }

  /**
   * The resolved PDF font name used for rendering.
   * Can be set directly (e.g. "Helvetica-Bold") for backward compatibility,
   * or resolved automatically from FontFamily + Weight + IsItalic.
   * Setting this directly clears FontFamily.
   */
  public get FontName(): string {
    return this.fontName;
  }

  public set FontName(value: string) {
    this.fontName = value;
    this.fontFamily = undefined; // Direct font name bypasses family resolution
  }

  /**
   * Font size for text rendering
   */
  public fontSize: number = 12;

  /**
   * TextBlock color for rendering
   */
  public textColor: Color = Color.black;

  /**
   * Text decoration (underline, strikethrough, or both)
   */
  public textDecoration: TextDecoration = TextDecoration.None;

  /**
   * Resolves FontName from FontFamily + Weight + IsItalic via FontFamilyResolver.
   * Falls back to the current FontName as the base family when FontFamily is not set,
   * enabling .Bold() and .Italic() to work without an explicit .Font() call.
   */
  private resolveFontName(): void {
    const family = this.fontFamily ?? this.fontName;
    this.fontName = FontFamilyResolver.resolve(family, this.weight, this.isItalic);
  }

  /**
   * Multiplier applied to font size to compute line height. Default is 1.2.
   * Set to a value like 1.5 for looser leading or 1.0 for tight leading.
   */
  public lineHeightMultiplier: number = 1.2;

  /**
   * Line height calculated from font size and LineHeightMultiplier
   */
  protected get lineHeight(): number {
    return this.fontSize * this.lineHeightMultiplier;
  }

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
