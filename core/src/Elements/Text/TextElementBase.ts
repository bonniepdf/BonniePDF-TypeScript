import { TextFlow } from '../../Typography/TextFlow';
import { SharedTextOptions } from '../SharedOptions';
import { Graphemes } from '../../Typography/Engine/Unicode/Segmentation/Graphemes';
import { ElementBase } from '../ElementBase';
import { FontFamilyResolver } from '../../Typography/FontFamilyResolver';
import { isGeneratingDocument } from '../../Typography/DocumentFontMetricScope';
import { FontWeight } from '../../Typography/FontWeight';
import { FontMetrics } from '../../Typography/FontMetrics';
import { ParagraphWidths } from '../../Typography/ParagraphWidths';
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

  // â”€â”€ Font properties (backing fields + explicit-set tracking) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // The text style and text-block options, shared with every element that has the same values
  // (see SharedOptions).
  /** @internal */
  protected _text: SharedTextOptions = SharedTextOptions.default;

  /** OpenType feature overrides for embedded text, such as { kern: 0, liga: 0 }. */
  public get fontFeatures(): Readonly<Record<string, number>> | undefined {
    return this._text.fontFeatures;
  }
  public set fontFeatures(value: Readonly<Record<string, number>> | undefined) {
    // TextStyle validates the features and takes a frozen copy.
    const features = value == null ? undefined : Object.assign(new TextStyle(), { fontFeatures: value }).fontFeatures;
    this._text = this._text.with('fontFeatures', features);
  }
  private get _fontFamily(): string | undefined {
    return this._text.fontFamily;
  }
  private set _fontFamily(value: string | undefined) {
    this._text = this._text.with('fontFamily', value);
  }
  private get _fontWeight(): FontWeight {
    return this._text.fontWeight;
  }
  private set _fontWeight(value: FontWeight) {
    this._text = this._text.with('fontWeight', value);
  }
  private get _italic(): boolean {
    return this._text.italic;
  }
  private set _italic(value: boolean) {
    this._text = this._text.with('italic', value);
  }

  private get _fontName(): string {
    return this._text.fontName;
  }
  private set _fontName(value: string) {
    this._text = this._text.with('fontName', value);
  }

  /**
   * The TTF/OTF path or PDF standard font name for rendering.
   * Assigning marks the font as explicitly set, so the document-level
   * defaultTextStyle cascade will not override it.
   */
  public get fontName(): string {
    // A family is resolved when the document is generated, against the document's fonts and the fonts registered
    // by then, so the order of registering a font and setting the family does not matter. Outside generation the
    // name resolved when the family was set stands.
    if (this._fontFamily !== undefined && isGeneratingDocument()) {
      return FontFamilyResolver.resolve(this._fontFamily, this._fontWeight, this._italic);
    }
    return this._fontName;
  }
  public set fontName(value: string) {
    this._fontName = value;
    this._fontFamily = undefined;
    this._fontExplicit = true;
    this._fontFamilyExplicit = true;
  }

  /** True once user code explicitly sets any font-related property. */
  private get _fontExplicit(): boolean {
    return this._text.fontExplicit;
  }
  private set _fontExplicit(value: boolean) {
    this._text = this._text.with('fontExplicit', value);
  }

  // Per-property tracking: the cascade fills each of family, weight and italic independently, so an
  // explicit weight does not stop defaultTextStyle supplying the family (and the reverse).
  private get _fontFamilyExplicit(): boolean {
    return this._text.fontFamilyExplicit;
  }
  private set _fontFamilyExplicit(value: boolean) {
    this._text = this._text.with('fontFamilyExplicit', value);
  }
  private get _fontWeightExplicit(): boolean {
    return this._text.fontWeightExplicit;
  }
  private set _fontWeightExplicit(value: boolean) {
    this._text = this._text.with('fontWeightExplicit', value);
  }
  private get _italicExplicit(): boolean {
    return this._text.italicExplicit;
  }
  private set _italicExplicit(value: boolean) {
    this._text = this._text.with('italicExplicit', value);
  }

  constructor() {
    super();
  }

  // â”€â”€ Nullable backing fields for cascade-aware properties â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private get _fontSize(): number | undefined {
    return this._text.fontSize;
  }
  private set _fontSize(value: number | undefined) {
    this._text = this._text.with('fontSize', value);
  }
  private get _textColor(): Color | undefined {
    return this._text.textColor;
  }
  private set _textColor(value: Color | undefined) {
    this._text = this._text.with('textColor', value);
  }
  private get _lineHeight(): number | undefined {
    return this._text.lineHeight;
  }
  private set _lineHeight(value: number | undefined) {
    this._text = this._text.with('lineHeight', value);
  }
  // Whether user code assigned the property. A value the default text style supplied is not explicit, so
  // a later generation can replace it (and a definition writer does not mistake it for the author's).
  private get _fontSizeExplicit(): boolean {
    return this._text.fontSizeExplicit;
  }
  private set _fontSizeExplicit(value: boolean) {
    this._text = this._text.with('fontSizeExplicit', value);
  }
  private get _textColorExplicit(): boolean {
    return this._text.textColorExplicit;
  }
  private set _textColorExplicit(value: boolean) {
    this._text = this._text.with('textColorExplicit', value);
  }
  private get _lineHeightExplicit(): boolean {
    return this._text.lineHeightExplicit;
  }
  private set _lineHeightExplicit(value: boolean) {
    this._text = this._text.with('lineHeightExplicit', value);
  }
  private get _textDecorationExplicit(): boolean {
    return this._text.textDecorationExplicit;
  }
  private set _textDecorationExplicit(value: boolean) {
    this._text = this._text.with('textDecorationExplicit', value);
  }
  private get _textDecoration(): TextDecoration | undefined {
    return this._text.textDecoration;
  }
  private set _textDecoration(value: TextDecoration | undefined) {
    this._text = this._text.with('textDecoration', value);
  }

  /**
   * Font size for text rendering. Defaults to 12 if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get fontSize(): number {
    return this._fontSize ?? 12;
  }
  public set fontSize(value: LengthInput) {
    this._fontSize = toLength(value);
    this._fontSizeExplicit = true;
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
    this._textColorExplicit = true;
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
    this._textDecorationExplicit = true;
  }

  private get _decorationColor(): Color | undefined {
    return this._text.decorationColor;
  }
  private set _decorationColor(value: Color | undefined) {
    this._text = this._text.with('decorationColor', value);
  }

  /**
   * Colour of the decoration lines. Undefined = use {@link color}, the default.
   */
  public get decorationColor(): Color | undefined {
    return this._decorationColor;
  }
  public set decorationColor(value: ColorInput | undefined) {
    this._decorationColor = value === undefined ? undefined : toColor(value);
  }

  private get _decorationThickness(): number | undefined {
    return this._text.decorationThickness;
  }
  private set _decorationThickness(value: number | undefined) {
    this._text = this._text.with('decorationThickness', value);
  }

  /**
   * Thickness of the decoration lines in points. Null = the default derived from
   * font size (`max(0.5, fontSize / 18)`).
   *
   * Accepts a length: a number of points, `'0.5pt'`, or `{ value, unit }`.
   */
  public get decorationThickness(): number | undefined {
    return this._decorationThickness;
  }
  public set decorationThickness(value: LengthInput | undefined) {
    this._decorationThickness = toOptionalLength(value);
  }

  private get _letterSpacing(): number {
    return this._text.letterSpacing;
  }
  private set _letterSpacing(value: number) {
    this._text = this._text.with('letterSpacing', value);
  }

  /**
   * Letter spacing (tracking) in points, added after every glyph.
   * Default 0. Changes advances, so it is reflected in measurement and both
   * PDF and SVG output.
   *
   * Accepts a length: a number of points, `'0.2mm'`, or `{ value, unit }`.
   */
  public get letterSpacing(): number {
    return this._letterSpacing;
  }
  public set letterSpacing(value: LengthInput) {
    this._letterSpacing = toLength(value);
  }

  private get _wordSpacing(): number {
    return this._text.wordSpacing;
  }
  private set _wordSpacing(value: number) {
    this._text = this._text.with('wordSpacing', value);
  }

  /**
   * Word spacing in points, added after every space. Default 0.
   *
   * Accepts a length: a number of points, `'0.5mm'`, or `{ value, unit }`.
   */
  public get wordSpacing(): number {
    return this._wordSpacing;
  }
  public set wordSpacing(value: LengthInput) {
    this._wordSpacing = toLength(value);
  }

  private get _decorationStyle(): DecorationStyle {
    return this._text.decorationStyle;
  }
  private set _decorationStyle(value: DecorationStyle) {
    this._text = this._text.with('decorationStyle', value);
  }

  /**
   * Line style for decorations (solid/wavy/dashed/dotted). Default solid.
   */
  public get decorationStyle(): DecorationStyle {
    return this._decorationStyle;
  }
  public set decorationStyle(value: DecorationStyleInput) {
    this._decorationStyle = toDecorationStyle(value);
  }

  // â”€â”€ Smart font getters/setters (mark _fontExplicit on assignment) â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    if (value !== undefined) {
      this._fontExplicit = true;
      this._fontFamilyExplicit = true;
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
    this._fontWeightExplicit = true;
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
    this._italicExplicit = true;
    this.resolveFontName();
  }

  // â”€â”€ Cascade application â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    this.fontFeatures ??= style.fontFeatures;
    // Font: family, weight and italic cascade independently, each only if the user hasn't set it.
    // A property the style does not supply returns to its library default, so a default that was changed
    // or removed since the last cascade does not leave its old value behind.
    let fontChanged = false;
    if (!this._fontFamilyExplicit && this._fontFamily !== style.fontFamily) {
      this._fontFamily = style.fontFamily;
      fontChanged = true;
    }
    // A font named directly bypasses family resolution, so weight and italic do not apply to it.
    if (!(this._fontFamilyExplicit && this._fontFamily === undefined)) {
      if (!this._fontWeightExplicit && this._fontWeight !== style.fontWeight) {
        this._fontWeight = style.fontWeight;
        fontChanged = true;
      }
      if (!this._italicExplicit && this._italic !== style.italic) {
        this._italic = style.italic;
        fontChanged = true;
      }
    }
    if (fontChanged) {
      // Without a family the name is resolved from the base font, not from an earlier cascade's result.
      if (!this._fontFamilyExplicit && this._fontFamily === undefined) {
        this._fontName = SharedTextOptions.default.fontName;
      }
      this.resolveFontName();
    }
    // Writing the backing fields leaves the explicit flags alone, so a later generation with a different
    // default can replace what this one supplied.
    if (!this._fontSizeExplicit) this._fontSize = style.fontSize;
    if (!this._textColorExplicit) this._textColor = style.color;
    if (!this._lineHeightExplicit) this._lineHeight = style.lineHeight;
    if (!this._textDecorationExplicit) {
      this._textDecoration = style.decoration === TextDecoration.None ? undefined : style.decoration;
    }
  }

  /**
   * (Legacy path used by subclasses.) Unconditionally applies a default style -
   * marks all set properties as explicit so cascade won't re-override them.
   */
  protected applyDefaultStyle(style: TextStyle): void {
    this.fontFeatures ??= style.fontFeatures;
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

  // â”€â”€ Font resolution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Line height â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Line-height multiplier applied to font size. Defaults to 1.2 if not set.
   * Setting this marks the property as explicitly set, preventing cascade override.
   */
  public get lineHeight(): number {
    return this._lineHeight ?? 1.2;
  }
  public set lineHeight(value: number) {
    this._lineHeight = value;
    this._lineHeightExplicit = true;
  }

  /**
   * Line height in points, calculated from font size and the lineHeight multiplier.
   */
  protected get effectiveLineHeight(): number {
    return this.fontSize * this.lineHeight;
  }

  // â”€â”€ Text measurement and wrapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // No hard breaks: the text is one segment, so its wrapped lines are the result.
    if (text.indexOf('\n') < 0 && text.indexOf('\r') < 0) {
      const single = this.wrapSegment(text, maxWidth);
      return single.length === 0 ? [''] : single;
    }

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
   * Wraps a single break-free segment, keeping every space.
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

    const bounds = Graphemes.boundaries(text);
    let rest = bounds.slice(0, -1).map((start, i) => text.slice(start, bounds[i + 1]));
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
      let count = lo;
      const isSafeBreak = FontMetrics.getTextBreakPredicate(rest.join(''), this.fontName, this.fontFeatures);
      let breakOffset = rest.slice(0, count).join('').length;
      for (let safe = count; safe > 0; safe--) {
        if (isSafeBreak(breakOffset)) {
          count = safe;
          break;
        }
        breakOffset -= rest[safe - 1].length;
      }

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

    // Words are the spans between single spaces; only their ends are needed, so the text is not split.
    const widths = hasTwoSpaces(text) ? this.paragraphWidthsFor(text) : null;

    // The current line and each candidate are spans of text: words joined by the single
    // spaces between them are exactly the text between their ends.
    let lineStart = 0,
      lineEnd = 0,
      wordStart = 0;
    while (wordStart <= text.length) {
      const space = text.indexOf(' ', wordStart);
      const wordEnd = space < 0 ? text.length : space;
      const lineEmpty = lineStart === lineEnd;
      const testStart = lineEmpty ? wordStart : lineStart;

      // Calculate exact width of the test line (handling tokens)
      const testWidth = this.measureSpan(text, testStart, wordEnd, widths);

      if (testWidth > maxWidth) {
        // Current line is full, add it and start new line with current word
        if (!lineEmpty) this.addLine(lines, text, lineStart, lineEnd, widths);
        lineStart = wordStart;
      } else {
        // Word fits, add it to current line
        lineStart = testStart;
      }
      lineEnd = wordEnd;
      wordStart = wordEnd + 1;
    }

    // Don't forget the last line
    if (lineStart !== lineEnd) this.addLine(lines, text, lineStart, lineEnd, widths);

    return lines;
  }

  /**
   * Candidate-line widths from one shaping of `text`, or null when the element measures in a
   * way one shaping cannot answer (spacing, page-number tokens, right-to-left text, or what
   * {@link ParagraphWidths.tryCreate} declines).
   * @internal
   */
  protected paragraphWidthsFor(text: string): ParagraphWidths | null {
    if (this.letterSpacing !== 0 || this.wordSpacing !== 0 || this.isRightToLeft) return null;
    if (text.includes(TextElementBase.TotalPagesToken) || text.includes(TextElementBase.CurrentPageToken)) return null;
    const restoreDirection = TextFlow.enter(this.effectiveContentDirection);
    try {
      return ParagraphWidths.tryCreate(text, this.fontName, this.fontSize, this.fontFeatures);
    } finally {
      restoreDirection();
    }
  }

  /**
   * {@link measureTextWidth} of `text[start..end)`, read from `widths` when it knows the span.
   * @internal
   */
  protected measureSpan(text: string, start: number, end: number, widths: ParagraphWidths | null): number {
    return widths?.tryGetWidth(start, end) ?? this.measureTextWidth(text.substring(start, end));
  }

  /**
   * Adds a wrapped line, handing its glyphs from the paragraph's shaping to the shaping cache so
   * drawing the line does not shape it again. Seeded under the text flow drawing uses for
   * left-to-right text; under any other flow the entry is simply never read.
   * @internal
   */
  protected addLine(lines: string[], text: string, start: number, end: number, widths: ParagraphWidths | null): void {
    const line = text.substring(start, end);
    lines.push(line);
    const glyphs = widths?.tryGetGlyphs(start, end);
    if (!widths || !glyphs) return;
    const restoreDirection = TextFlow.enter(this.effectiveContentDirection);
    try {
      widths.font.seedShaped(line, this.fontFeatures, glyphs);
    } finally {
      restoreDirection();
    }
  }

  /**
   * Measures the width of a text string using the current font settings.
   * Handles substitution tokens like {{TotalPages}} by measuring a placeholder.
   */
  protected measureTextWidth(text: string): number {
    const restoreDirection = TextFlow.enter(this.effectiveContentDirection);
    try {
      // Replace tokens with estimated placeholders (2 digits) for measurement
      const measuredText = text
        .replaceAll(TextElementBase.TotalPagesToken, '00')
        .replaceAll(TextElementBase.CurrentPageToken, '00');
      return (
        FontMetrics.getStringWidth(measuredText, this.fontName, this.fontSize, this.fontFeatures) +
        this.spacingWidth(measuredText)
      );
    } finally {
      restoreDirection();
    }
  }

  /**
   * Extra advance contributed by {@link letterSpacing}/{@link wordSpacing} for a
   * string: letter spacing after every glyph plus word spacing after
   * every space. Matches the PDF/SVG painters and the reserved layout width.
   * Zero when no spacing is set.
   */
  protected spacingWidth(text: string): number {
    return getTextSpacingWidth(text, this.letterSpacing, this.wordSpacing, this.fontName, this.fontFeatures);
  }
}

/** @internal Whether `text` has at least two spaces, that is, at least three words. */
export function hasTwoSpaces(text: string): boolean {
  const first = text.indexOf(' ');
  return first >= 0 && text.indexOf(' ', first + 1) >= 0;
}
