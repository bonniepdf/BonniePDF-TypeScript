import { ElementBase } from '../ElementBase';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toTextAlignment, type TextAlignmentInput } from '../../Normalize/toEnum';
import { IStatefulElement } from '../IElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';
import { TextAlignment } from './TextAlignment';
import { TextElementBase } from './TextElementBase';
import { TextStyle } from './TextStyle';
import { TextSpan } from './TextSpan';
import { TextDecoration } from './TextDecoration';
import { resolveBaselineShift } from './BaselineAlignment';
import { paintDecorationLine } from './DecorationStyle';
import { FontMetrics } from '../../Typography/FontMetrics';
import { Color } from '../../Core/Color';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { getTextSpacingWidth } from '../../Typography/TextSpacing';
import type { SvgCanvas } from '../../Drawing/SvgCanvas';

/**
 * A rich text element that supports mixed styling within a single flowing paragraph.
 * Text spans with different fonts, sizes, colors, weights, and decorations flow together
 * with automatic word wrapping across span boundaries.
 */
/** Settable properties declared by {@link RichText} itself. */
export const RICH_TEXT_OWN_OPTION_KEYS = [
  'alignment',
  'defaultStyle',
  'minLinesBeforeBreak',
  'minLinesAfterBreak',
] as const;

/** The full settable surface, base included. */
export const RICH_TEXT_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...RICH_TEXT_OWN_OPTION_KEYS] as const;

type RichTextOwnKey = (typeof RICH_TEXT_OWN_OPTION_KEYS)[number];

/** Options for {@link RichText}. Intersects {@link ElementOptions}. */
export type RichTextOptions = ElementOptions &
  Partial<Omit<Pick<RichText, RichTextOwnKey>, 'alignment'>> & {
    /** Paragraph alignment. Accepts `'left' | 'center' | 'right' | 'middle' | 'justify'`. */
    alignment?: TextAlignmentInput;
  };

/** Lays out styled text spans with wrapping and pagination. */
export class RichText extends ElementBase implements IStatefulElement, IRoleProvider {
  /**
   * RichText renders one flowing paragraph, so it tags as /P. Without a role
   * the pipeline would emit its text as untagged content (PDF/UA 7.1).
   */
  get semanticRole(): SemanticRole {
    return SemanticRole.P;
  }

  private readonly spans: TextSpan[] = [];
  private cachedContentWidth = -1;
  private cachedLines?: RichTextLine[];

  // State tracking for multipage rendering
  private lastLineRendered = -1;

  /** Text alignment for the paragraph. */
  private _alignment: TextAlignment = TextAlignment.Left;
  private _alignmentExplicit = false;

  /**
   * Paragraph alignment. Accepts `'left' | 'center' | 'right' | 'middle' | 'justify'`. When not set
   * explicitly, an enclosing Container whose horizontalAlignment is Start/Center/End supplies an ambient
   * default instead of the plain Left below (spec 01 "Document Model" §3.2); see `effectiveAlignment`.
   */
  public get alignment(): TextAlignment {
    return this._alignment;
  }
  public set alignment(value: TextAlignmentInput) {
    this._alignment = toTextAlignment(value);
    this._alignmentExplicit = true;
  }

  /** The alignment this render actually uses: the explicit value, or the render context's ambient. */
  private effectiveAlignment(ctx: RenderContext): TextAlignment {
    return this._alignmentExplicit
      ? this._alignment
      : ((ctx.ambientHorizontalTextAlignment as TextAlignment | undefined) ?? TextAlignment.Left);
  }

  /**
   * Default style inherited by all spans. Span-level styles override these values.
   */
  public defaultStyle: TextStyle = new TextStyle();

  /** Minimum number of lines to render before a page break (orphan control). */
  public minLinesBeforeBreak = 2;

  /** Minimum number of lines that must appear after a page break (widow control). */
  public minLinesAfterBreak = 2;

  /**
   * Creates a rich-text block, optionally configured in one expression.
   *
   * ```typescript
   * new RichText({ alignment: 'justify', defaultStyle: new TextStyle({ fontSize: 11 }) });
   * ```
   */
  constructor(options?: RichTextOptions) {
    super();
    applyOptions(this, options);
  }

  // --- Builder API ---

  /**
   * Adds a text span with an explicit style.
   */
  public span(text: string, style?: TextStyle): RichText {
    const textSpan = new TextSpan();
    textSpan.text = text;
    // Snapshot the style: the fluent builders mutate and return `this`, so a
    // style shared across spans and mutated between them would otherwise leak
    // its final state onto every span that references it.
    textSpan.style = style?.clone();
    this.spans.push(textSpan);
    this.invalidateCache();
    return this;
  }

  /**
   * Adds a text span with a style configured via callback.
   */
  public spanWithConfigure(text: string, configure: (style: TextStyle) => void): RichText {
    const style = new TextStyle();
    configure(style);
    return this.span(text, style);
  }

  /**
   * Adds a text span followed by a line break.
   */
  public line(text: string, style?: TextStyle): RichText {
    const textSpan = new TextSpan();
    textSpan.text = text;
    // Snapshot the style - see span() for why.
    textSpan.style = style?.clone();
    textSpan.isLineBreak = true;
    this.spans.push(textSpan);
    this.invalidateCache();
    return this;
  }

  /**
   * Adds a line break (empty line).
   */
  public lineBreak(): RichText {
    const textSpan = new TextSpan();
    textSpan.text = '';
    textSpan.isLineBreak = true;
    this.spans.push(textSpan);
    this.invalidateCache();
    return this;
  }

  // --- Rendering ---

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    // Apply top margin only on first render
    if (this.lastLineRendered < 0) {
      ctx.currentY += this.margin.top;
    }

    const contentWidth = width - this.margin.left - this.margin.right;
    const lines = this.getOrComputeLines(contentWidth);

    const startLine = this.lastLineRendered + 1;
    if (startLine >= lines.length) {
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    const remainingLines = lines.length - startLine;
    const startY = ctx.currentY;

    // Calculate how many lines fit on this page
    let linesThatFit = 0;
    let testY = startY;
    for (let i = startLine; i < lines.length; i++) {
      if (testY + lines[i].height > ctx.maxY) break;
      linesThatFit++;
      testY += lines[i].height;
    }

    // If all remaining lines fit, render them all
    if (linesThatFit >= remainingLines) {
      return this.renderLines(ctx, lines, startLine, lines.length, contentWidth, startY);
    }

    const notAtTop = ctx.currentY > ctx.contentTop;

    // Orphan control
    if (startLine === 0 && linesThatFit < this.minLinesBeforeBreak && notAtTop) {
      return RenderStatus.WrapRequired;
    }

    // Widow control
    const linesAfterBreak = remainingLines - linesThatFit;
    if (linesThatFit > 0 && linesAfterBreak > 0 && linesAfterBreak < this.minLinesAfterBreak) {
      const targetFit = remainingLines - this.minLinesAfterBreak;
      if (startLine === 0 && targetFit < this.minLinesBeforeBreak && notAtTop) {
        return RenderStatus.WrapRequired;
      }
      linesThatFit = Math.max(0, targetFit);
    }

    if (linesThatFit <= 0) {
      return startLine === 0 ? RenderStatus.WrapRequired : RenderStatus.Overflow;
    }

    const endLine = startLine + linesThatFit;
    return this.renderLines(ctx, lines, startLine, endLine, contentWidth, startY);
  }

  private renderLines(
    ctx: RenderContext,
    lines: RichTextLine[],
    startLine: number,
    endLine: number,
    contentWidth: number,
    startY: number
  ): RenderStatus {
    let y = startY;
    for (let i = startLine; i < endLine; i++) {
      const line = lines[i];
      const isLastLine = i === lines.length - 1;
      this.drawRichLine(ctx, line, contentWidth, y, ctx.currentX + this.margin.left, isLastLine);
      y += line.height;
    }

    this.lastLineRendered = endLine - 1;
    ctx.currentY = y;

    if (endLine >= lines.length) {
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    return RenderStatus.Overflow;
  }

  public resetState(): void {
    this.lastLineRendered = -1;
    this.invalidateCache();
  }

  /**
   * The width the text takes on one line, with no wrapping. Measured by the same word flow that
   * breaks lines, so a container that hands this width back as the maximum can never wrap the text
   * (summing whole span widths instead disagrees by float rounding, and by trailing spaces, and
   * wrapped a centred "Page 1 of 2" footer onto two lines).
   */
  protected override getPreferredContentWidth(): number {
    let widest = 0;
    for (const line of this.computeLines(Number.POSITIVE_INFINITY)) {
      widest = Math.max(widest, line.totalWidth);
    }

    return widest;
  }

  protected override measureContentHeight(contentWidth: number): number {
    const lines = this.getOrComputeLines(contentWidth);
    return lines.reduce((sum, line) => sum + line.height, 0);
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const lines = this.getOrComputeLines(contentWidth);
    let y = ctx.currentY;

    for (let i = 0; i < lines.length; i++) {
      const isLastLine = i === lines.length - 1;
      this.drawRichLine(ctx, lines[i], contentWidth, y, ctx.currentX, isLastLine);
      y += lines[i].height;
    }

    ctx.currentY = y;
  }

  // --- Line Building ---

  /**
   * Builds word-wrapped lines from the spans. Each line contains a list of styled runs.
   * Words from different spans can coexist on the same line.
   */
  private computeLines(maxWidth: number): RichTextLine[] {
    // 1. Break spans into styled words (word = text + style)
    const words = this.buildStyledWords();

    // 2. Flow words into lines, wrapping when width exceeds maxWidth
    const lines: RichTextLine[] = [];
    let currentLine = new RichTextLine();
    let currentWidth = 0;

    for (const word of words) {
      if (word.isLineBreak) {
        // Add any text before the break
        if (word.text !== '') {
          currentLine.runs.push(new StyledRun(word.text, word.style));
          currentWidth += word.width;
        }

        currentLine.totalWidth = currentWidth;
        this.updateLineHeight(currentLine);
        lines.push(currentLine);
        currentLine = new RichTextLine();
        currentWidth = 0;
        continue;
      }

      const wordWidth = word.width;
      const spaceWidth = word.leadingSpaceWidth;
      const totalNeeded = currentWidth > 0 ? spaceWidth + wordWidth : wordWidth;

      if (currentWidth + totalNeeded > maxWidth && currentWidth > 0) {
        // Line is full - wrap to next line
        currentLine.totalWidth = currentWidth;
        this.updateLineHeight(currentLine);
        lines.push(currentLine);
        currentLine = new RichTextLine();
        currentWidth = 0;
        // Don't add leading space at start of new line
        const newWordWidth = wordWidth;
        currentLine.runs.push(new StyledRun(word.text, word.style));
        currentWidth = newWordWidth;
      } else {
        // Add leading space with its own style
        if (currentWidth > 0 && word.hasLeadingSpace) {
          const spaceStyle = word.leadingSpaceStyle ?? word.style;
          if (
            currentLine.runs.length > 0 &&
            this.stylesEqual(currentLine.runs[currentLine.runs.length - 1].style, spaceStyle)
          ) {
            currentLine.runs[currentLine.runs.length - 1].text += ' ';
          } else {
            currentLine.runs.push(new StyledRun(' ', spaceStyle));
          }
          currentWidth += word.leadingSpaceWidth;
        }

        // Add the word text with its own style
        if (
          currentLine.runs.length > 0 &&
          this.stylesEqual(currentLine.runs[currentLine.runs.length - 1].style, word.style)
        ) {
          currentLine.runs[currentLine.runs.length - 1].text += word.text;
        } else {
          currentLine.runs.push(new StyledRun(word.text, word.style));
        }

        currentWidth += wordWidth;
      }
    }

    // Add the final line. A paragraph that ends immediately after a raw
    // text break ("a\n") keeps its trailing blank line, matching the
    // TextBlock string rule; a structural line()/lineBreak() terminal
    // break does not create one.
    const lastWord = words.length > 0 ? words[words.length - 1] : undefined;
    if (currentLine.runs.length > 0 || (lastWord?.isLineBreak && lastWord.isTextBreak)) {
      currentLine.totalWidth = currentWidth;
      this.updateLineHeight(currentLine);
      lines.push(currentLine);
    }

    // If no content at all, add one empty line with default height.
    if (lines.length === 0) {
      const emptyLine = new RichTextLine();
      emptyLine.height = this.getStyleLineHeight(this.defaultStyle);
      lines.push(emptyLine);
    }

    return lines;
  }

  /**
   * Breaks all spans into a flat list of styled words.
   *
   * Raw break characters in span text (`\n`, with `\r\n`/`\r` normalised)
   * split the span into segments; each break becomes a text-break word and
   * each segment flows like a mini-span.
   */
  private buildStyledWords(): StyledWord[] {
    const words: StyledWord[] = [];
    let prevSpanEndedWithSpace = false;
    let prevResolvedStyle: TextStyle | undefined;

    for (const span of this.spans) {
      const resolved = this.resolveStyle(span.style);
      const rawText = span.text ?? '';

      if (!rawText) {
        if (span.isLineBreak) {
          words.push(new StyledWord(resolved, '', true));
          prevSpanEndedWithSpace = false;
        }
        continue;
      }

      const segments = rawText.replace(/\r\n?/g, '\n').split('\n');

      for (let s = 0; s < segments.length; s++) {
        if (s > 0) {
          const brk = new StyledWord(resolved, '', true);
          brk.isTextBreak = true;
          words.push(brk);
          // A break consumes any pending trailing space; the next word
          // starts its line flush (the flow loop also drops leading spaces
          // at line starts).
          prevSpanEndedWithSpace = false;
        }

        const text = segments[s];
        if (!text) continue;

        // Split by spaces, preserving awareness of leading/trailing spaces
        const parts = text.split(' ');

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part) continue;

          const hasLeadingSpace = i > 0 || (words.length > 0 && (text.startsWith(' ') || prevSpanEndedWithSpace));

          // Determine which style owns the leading space
          const isInterSpanSpace = hasLeadingSpace && i === 0 && prevSpanEndedWithSpace && !text.startsWith(' ');
          const spaceStyle = isInterSpanSpace && prevResolvedStyle ? prevResolvedStyle : resolved;

          const measuredPart = RichText.measured(part);
          const partWidth =
            FontMetrics.getStringWidth(measuredPart, resolved.effectiveFontName, resolved.effectiveFontSize) +
            RichText.styleSpacing(measuredPart, resolved);
          const spaceWidth = hasLeadingSpace
            ? FontMetrics.getStringWidth(' ', spaceStyle.effectiveFontName, spaceStyle.effectiveFontSize) +
              RichText.styleSpacing(' ', spaceStyle)
            : 0;

          const word = new StyledWord(resolved, part, false);
          word.width = partWidth;
          word.hasLeadingSpace = hasLeadingSpace;
          word.leadingSpaceWidth = spaceWidth;
          word.leadingSpaceStyle = hasLeadingSpace ? spaceStyle : undefined;
          words.push(word);
        }

        prevSpanEndedWithSpace = text.endsWith(' ');
      }

      // Handle trailing line break from the span
      if (span.isLineBreak) {
        words.push(new StyledWord(resolved, '', true));
        prevSpanEndedWithSpace = false;
      }

      prevResolvedStyle = resolved;
    }

    return words;
  }

  /** Sets the line height to the greatest effective line height across all runs. */
  private updateLineHeight(line: RichTextLine): void {
    let maxLineHeight = this.getStyleLineHeight(this.defaultStyle);
    for (const run of line.runs) {
      const lineHeight = this.getStyleLineHeight(run.style);
      if (lineHeight > maxLineHeight) maxLineHeight = lineHeight;
    }

    line.height = maxLineHeight;
  }

  /** Returns font size multiplied by the style's line-height multiplier (default 1.2). */
  private getStyleLineHeight(style: TextStyle): number {
    return style.effectiveFontSize * (style.lineHeight ?? 1.2);
  }

  // --- Drawing ---

  /**
   * Draws a single rich text line by iterating its styled runs.
   */
  private drawRichLine(
    ctx: RenderContext,
    line: RichTextLine,
    contentWidth: number,
    y: number,
    baseX: number,
    isLastLine: boolean
  ): void {
    if (line.runs.length === 0) return;

    // Layout reserved two digits for each page token; alignment uses the width the line really has
    // on this page (the current page number may be one digit or three). Equal to line.totalWidth
    // for a line with no tokens.
    const lineWidth = this.actualLineWidth(ctx, line);

    // Calculate starting X based on alignment
    const alignment = this.effectiveAlignment(ctx);
    let startX = baseX;
    if (alignment === TextAlignment.Center) {
      startX += (contentWidth - lineWidth) / 2;
    } else if (alignment === TextAlignment.Right) {
      startX += contentWidth - lineWidth;
    }

    // For justify, calculate extra space per space character
    let extraWordSpacing = 0;
    const useJustify = alignment === TextAlignment.Justify && !isLastLine;
    if (useJustify) {
      let spaceCount = 0;
      for (const run of line.runs) {
        for (const c of run.text) {
          if (c === ' ') spaceCount++;
        }
      }

      if (spaceCount > 0) {
        extraWordSpacing = (contentWidth - lineWidth) / spaceCount;
      }
    }

    let currentX = startX;

    for (const run of line.runs) {
      if (!run.text) continue;

      const style = run.style;
      const fontName = style.effectiveFontName;
      const fontSize = style.effectiveFontSize;
      const color = style.effectiveColor;

      // Draw background highlight if specified
      if (style.backgroundColor) {
        const runWidth = RichText.hasPageToken(run.text)
          ? this.actualRunWidth(ctx, run)
          : this.measureRunWidth(run, extraWordSpacing);
        ctx.canvas.fillRect(currentX, y, runWidth, line.height, style.backgroundColor);
      }

      // Baseline shift (super/subscript) moves the glyphs vertically without
      // affecting the run's advance width, so `currentX` and measurement are
      // untouched. Positive shift = up, so subtract from the top-down y.
      const shift = resolveBaselineShift(style.baselineAlignment, style.baselineShift, fontSize);
      const runY = y - shift;

      // Letter/word spacing as canvas state for this run.
      const ls = style.letterSpacing ?? 0;
      const ws = style.wordSpacing ?? 0;
      const spaced = ls !== 0 || ws !== 0;
      if (spaced) ctx.canvas.setTextSpacing(ls, ws);

      // Draw each word segment separately when justified (to apply extra spacing)
      if (useJustify && extraWordSpacing > 0 && run.text.includes(' ')) {
        currentX = this.drawJustifiedRun(ctx, run, currentX, runY, extraWordSpacing);
      } else if (RichText.hasPageToken(run.text)) {
        const runWidth = this.drawTokenText(ctx, run.text, currentX, runY, style);

        if (style.decoration !== TextDecoration.None) {
          this.drawRunDecorations(ctx, style, currentX, runY, runWidth, fontSize);
        }

        currentX += runWidth;
      } else {
        // Draw the run as a single text call
        ctx.canvas.drawText(currentX, runY, run.text, color, fontSize, fontName, TextAlignment.Left);

        const runWidth =
          FontMetrics.getStringWidth(run.text, fontName, fontSize) + RichText.styleSpacing(run.text, style);

        // Draw decorations
        if (style.decoration !== TextDecoration.None) {
          this.drawRunDecorations(ctx, style, currentX, runY, runWidth, fontSize);
        }

        currentX += runWidth;
      }

      if (spaced) ctx.canvas.setTextSpacing(0, 0);
    }
  }

  /**
   * Draws a justified run by splitting at spaces and adding extra spacing.
   */
  private drawJustifiedRun(
    ctx: RenderContext,
    run: StyledRun,
    startX: number,
    y: number,
    extraWordSpacing: number
  ): number {
    const style = run.style;
    const fontName = style.effectiveFontName;
    const fontSize = style.effectiveFontSize;
    const color = style.effectiveColor;

    let currentX = startX;
    const words = run.text.split(' ');

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Add space before word (except first). The space glyph carries its own
      // letter/word spacing in addition to the justification spread.
      if (i > 0) {
        const spaceWidth = FontMetrics.getStringWidth(' ', fontName, fontSize) + RichText.styleSpacing(' ', style);
        currentX += spaceWidth + extraWordSpacing;
      }

      if (word !== '') {
        let wordWidth: number;
        if (RichText.hasPageToken(word)) {
          wordWidth = this.drawTokenText(ctx, word, currentX, y, style);
        } else {
          ctx.canvas.drawText(currentX, y, word, color, fontSize, fontName, TextAlignment.Left);
          wordWidth = FontMetrics.getStringWidth(word, fontName, fontSize) + RichText.styleSpacing(word, style);
        }

        if (style.decoration !== TextDecoration.None) {
          this.drawRunDecorations(ctx, style, currentX, y, wordWidth, fontSize);
        }

        currentX += wordWidth;
      }
    }

    return currentX;
  }

  /**
   * Draws underline and/or strikethrough decorations for a styled run.
   */
  private drawRunDecorations(
    ctx: RenderContext,
    style: TextStyle,
    x: number,
    y: number,
    width: number,
    fontSize: number
  ): void {
    const thickness = style.decorationThickness ?? Math.max(0.5, fontSize / 18);
    const color = style.decorationColor ?? style.effectiveColor;
    const lineStyle = style.decorationStyle;

    if ((style.decoration & TextDecoration.Overline) !== 0) {
      paintDecorationLine(ctx.canvas, x, y + fontSize * 0.15, width, color, thickness, lineStyle);
    }

    if ((style.decoration & TextDecoration.Underline) !== 0) {
      paintDecorationLine(ctx.canvas, x, y + fontSize + fontSize / 7, width, color, thickness, lineStyle);
    }

    if ((style.decoration & TextDecoration.Strikethrough) !== 0) {
      paintDecorationLine(ctx.canvas, x, y + fontSize * 0.55, width, color, thickness, lineStyle);
    }
  }

  // --- Helpers ---

  private resolveStyle(spanStyle?: TextStyle): TextStyle {
    if (!spanStyle) {
      return this.defaultStyle || new TextStyle();
    }
    return spanStyle.mergeWith(this.defaultStyle);
  }

  // --- Page tokens ---
  //
  // {{CurrentPage}} and {{TotalPages}} in a span's text behave as they do in a TextBlock: the current
  // page number is substituted when the line is drawn, the total page count is drawn as a deferred
  // object that resolves once the whole document has been laid out, and layout reserves the width of
  // two digits for each. Text with no token takes the original code path untouched.

  private static hasPageToken(text: string): boolean {
    return (
      text.includes('{{') &&
      (text.includes(TextElementBase.CurrentPageToken) || text.includes(TextElementBase.TotalPagesToken))
    );
  }

  /** The text as layout measures it: each page token counts as two digits. */
  private static measured(text: string): string {
    return RichText.hasPageToken(text)
      ? text.split(TextElementBase.TotalPagesToken).join('00').split(TextElementBase.CurrentPageToken).join('00')
      : text;
  }

  private static withCurrentPage(ctx: RenderContext, text: string): string {
    return text.split(TextElementBase.CurrentPageToken).join(String(ctx.currentPageIndex + 1));
  }

  /** A run's advance on this page: the real current page number, two digits for the total. */
  private actualRunWidth(ctx: RenderContext, run: StyledRun): number {
    const actual = RichText.withCurrentPage(ctx, run.text).split(TextElementBase.TotalPagesToken).join('00');
    return (
      FontMetrics.getStringWidth(actual, run.style.effectiveFontName, run.style.effectiveFontSize) +
      RichText.styleSpacing(actual, run.style)
    );
  }

  /**
   * The line's width on this page. Layout measured each page token as two digits; the current page
   * number may be shorter or longer, so alignment corrects by the difference. Exactly
   * `line.totalWidth` when no run holds a token.
   */
  private actualLineWidth(ctx: RenderContext, line: RichTextLine): number {
    let width = line.totalWidth;
    for (const run of line.runs) {
      if (!run.text || !RichText.hasPageToken(run.text)) continue;
      width += this.actualRunWidth(ctx, run) - this.measureRunWidth(run, 0);
    }

    return width;
  }

  /**
   * Draws text that holds page tokens at (x, y) and returns its advance. The total page count is a
   * deferred object, exactly as in a TextBlock.
   */
  private drawTokenText(ctx: RenderContext, text: string, x: number, y: number, style: TextStyle): number {
    const fontName = style.effectiveFontName;
    const fontSize = style.effectiveFontSize;
    const color = style.effectiveColor;

    const parts = RichText.withCurrentPage(ctx, text).split(TextElementBase.TotalPagesToken);
    let currentX = x;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.length > 0) {
        ctx.canvas.drawText(currentX, y, part, color, fontSize, fontName, TextAlignment.Left);
        currentX += FontMetrics.getStringWidth(part, fontName, fontSize) + RichText.styleSpacing(part, style);
      }

      if (i === parts.length - 1) continue;

      if (ctx.isSvgMode) {
        const svgCanvas = ctx.canvas as SvgCanvas;
        if (typeof svgCanvas.drawDeferredTotalPages === 'function') {
          svgCanvas.drawDeferredTotalPages(currentX, y, color, fontSize, fontName);
        } else {
          ctx.canvas.drawText(currentX, y, '00', color, fontSize, fontName, TextAlignment.Left);
        }
      } else {
        ctx.canvas.drawFormXObject(ctx.registerDeferredXObject(fontName, fontSize, color), currentX, y);
      }

      currentX += FontMetrics.getStringWidth('00', fontName, fontSize) + RichText.styleSpacing('00', style);
    }

    return currentX - x;
  }

  private measureRunWidth(run: StyledRun, extraWordSpacing: number): number {
    const measured = RichText.measured(run.text);
    let baseWidth =
      FontMetrics.getStringWidth(measured, run.style.effectiveFontName, run.style.effectiveFontSize) +
      RichText.styleSpacing(measured, run.style);

    if (extraWordSpacing > 0) {
      let spaceCount = 0;
      for (const c of run.text) {
        if (c === ' ') spaceCount++;
      }
      baseWidth += spaceCount * extraWordSpacing;
    }

    return baseWidth;
  }

  /**
   * Extra advance from a style's {@link TextStyle.letterSpacing}/
   * {@link TextStyle.wordSpacing} for a string: letter spacing after
   * every glyph plus word spacing after every space. Zero when neither is set.
   */
  private static styleSpacing(text: string, style: TextStyle): number {
    return getTextSpacingWidth(text, style.letterSpacing ?? 0, style.wordSpacing ?? 0);
  }

  private stylesEqual(a: TextStyle, b: TextStyle): boolean {
    return (
      a.effectiveFontName === b.effectiveFontName &&
      Math.abs(a.effectiveFontSize - b.effectiveFontSize) < 0.01 &&
      a.effectiveColor.equals(b.effectiveColor) &&
      a.decoration === b.decoration &&
      this.colorsEqual(a.backgroundColor, b.backgroundColor)
    );
  }

  private colorsEqual(a?: Color, b?: Color): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.equals(b);
  }

  private getOrComputeLines(contentWidth: number): RichTextLine[] {
    if (this.cachedLines && Math.abs(this.cachedContentWidth - contentWidth) < 0.001) {
      return this.cachedLines;
    }

    this.cachedLines = this.computeLines(contentWidth);
    this.cachedContentWidth = contentWidth;
    return this.cachedLines;
  }

  private invalidateCache(): void {
    this.cachedLines = undefined;
    this.cachedContentWidth = -1;
  }
}

/**
 * A single line of rich text, composed of multiple styled runs.
 */
export class RichTextLine {
  /** The styled runs that make up this line */
  public runs: StyledRun[] = [];

  /** The total width of all runs in this line */
  public totalWidth = 0;

  /** The height of this line (determined by the tallest font) */
  public height = 0;
}

/**
 * A contiguous piece of text with a single style, used for rendering.
 */
export class StyledRun {
  /** The text content */
  public text: string;

  /** The resolved style for this run */
  public style: TextStyle;

  constructor(text: string, style: TextStyle) {
    this.text = text;
    this.style = style;
  }
}

/**
 * An intermediate word representation used during line building.
 */
export class StyledWord {
  public text: string;
  public style: TextStyle;
  public width = 0;
  public hasLeadingSpace = false;
  public leadingSpaceWidth = 0;
  public leadingSpaceStyle?: TextStyle;
  public isLineBreak = false;

  /**
   * True when this line break came from a raw break character (`\n`) inside
   * span text rather than the structural `line()`/`lineBreak()` API. A
   * paragraph-final text break yields a trailing blank line (matching the
   * TextBlock string rule); a paragraph-final structural break does not.
   */
  public isTextBreak = false;

  constructor(style: TextStyle, text: string, isLineBreak: boolean) {
    this.style = style;
    this.text = text;
    this.isLineBreak = isLineBreak;
  }
}
