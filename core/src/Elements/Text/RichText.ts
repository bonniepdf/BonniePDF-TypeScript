import { ElementBase } from '../ElementBase';
import { IStatefulElement } from './IStatefulElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';
import { TextAlignment } from './TextAlignment';
import { TextStyle } from './TextStyle';
import { TextSpan } from './TextSpan';
import { TextDecoration } from './TextDecoration';
import { StandardFonts } from '../../Typography/StandardFonts';
import { FontMetrics } from '../../Typography/FontMetrics';
import { Color } from '../../Core/Color';

/**
 * A rich text element that supports mixed styling within a single flowing paragraph.
 * Text spans with different fonts, sizes, colors, weights, and decorations flow together
 * with automatic word wrapping across span boundaries.
 */
export class RichText extends ElementBase implements IStatefulElement {
  private readonly spans: TextSpan[] = [];
  private cachedContentWidth = -1;
  private cachedLines?: RichTextLine[];

  // State tracking for multipage rendering
  private lastLineRendered = -1;

  /** Text alignment for the paragraph. */
  public alignment: TextAlignment = TextAlignment.Left;

  /**
   * Default style inherited by all spans. Span-level styles override these values.
   */
  public defaultStyle: TextStyle = new TextStyle();

  public get DefaultStyle(): TextStyle {
    return this.defaultStyle;
  }

  public set DefaultStyle(value: TextStyle) {
    this.defaultStyle = value || new TextStyle();
    // Set default values
    if (!this.defaultStyle.fontFamily) {
      this.defaultStyle.fontFamily = 'Helvetica';
    }
    if (!this.defaultStyle.fontSize) {
      this.defaultStyle.fontSize = 12;
    }
    if (!this.defaultStyle.color) {
      this.defaultStyle.color = Color.black;
    }
  }

  /** Minimum number of lines to render before a page break (orphan control). */
  public minLinesBeforeBreak = 2;

  /** Minimum number of lines that must appear after a page break (widow control). */
  public minLinesAfterBreak = 2;

  // --- Builder API ---

  /**
   * Adds a text span with an explicit style.
   */
  public span(text: string, style?: TextStyle): RichText {
    const textSpan = new TextSpan();
    textSpan.text = text;
    textSpan.style = style;
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
    textSpan.style = style;
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

    const notAtTop = ctx.currentY > ctx.margin;

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

  protected override getPreferredContentWidth(): number {
    // Measure the total width of all spans without wrapping
    let totalWidth = 0;
    for (const span of this.spans) {
      const resolved = this.resolveStyle(span.style);
      totalWidth += FontMetrics.getStringWidth(
        span.text ?? '',
        resolved.effectiveFontName,
        resolved.effectiveFontSize
      );
    }

    return totalWidth;
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
        // Line is full — wrap to next line
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
          if (currentLine.runs.length > 0 && this.stylesEqual(currentLine.runs[currentLine.runs.length - 1].style, spaceStyle)) {
            currentLine.runs[currentLine.runs.length - 1].text += ' ';
          } else {
            currentLine.runs.push(new StyledRun(' ', spaceStyle));
          }
          currentWidth += word.leadingSpaceWidth;
        }

        // Add the word text with its own style
        if (currentLine.runs.length > 0 && this.stylesEqual(currentLine.runs[currentLine.runs.length - 1].style, word.style)) {
          currentLine.runs[currentLine.runs.length - 1].text += word.text;
        } else {
          currentLine.runs.push(new StyledRun(word.text, word.style));
        }

        currentWidth += wordWidth;
      }
    }

    // Add the final line
    if (currentLine.runs.length > 0) {
      currentLine.totalWidth = currentWidth;
      this.updateLineHeight(currentLine);
      lines.push(currentLine);
    }

    // If no content at all, add one empty line with default height
    if (lines.length === 0) {
      const emptyLine = new RichTextLine();
      emptyLine.height = this.defaultStyle.effectiveFontSize * 1.2;
      lines.push(emptyLine);
    }

    return lines;
  }

  /**
   * Breaks all spans into a flat list of styled words.
   */
  private buildStyledWords(): StyledWord[] {
    const words: StyledWord[] = [];
    let prevSpanEndedWithSpace = false;
    let prevResolvedStyle: TextStyle | undefined;

    for (const span of this.spans) {
      const resolved = this.resolveStyle(span.style);
      const text = span.text ?? '';

      if (!text) {
        if (span.isLineBreak) {
          words.push(new StyledWord(resolved, '', true));
          prevSpanEndedWithSpace = false;
        }
        continue;
      }

      // Split by spaces, preserving awareness of leading/trailing spaces
      const parts = text.split(' ');

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        const hasLeadingSpace = i > 0 || (words.length > 0 && (text.startsWith(' ') || prevSpanEndedWithSpace));

        // Determine which style owns the leading space
        const isInterSpanSpace = hasLeadingSpace && i === 0 && prevSpanEndedWithSpace && !text.startsWith(' ');
        const spaceStyle = isInterSpanSpace && prevResolvedStyle ? prevResolvedStyle : resolved;

        const partWidth = FontMetrics.getStringWidth(part, resolved.effectiveFontName, resolved.effectiveFontSize);
        const spaceWidth = hasLeadingSpace
          ? FontMetrics.getStringWidth(' ', spaceStyle.effectiveFontName, spaceStyle.effectiveFontSize)
          : 0;

        const word = new StyledWord(resolved, part, false);
        word.width = partWidth;
        word.hasLeadingSpace = hasLeadingSpace;
        word.leadingSpaceWidth = spaceWidth;
        word.leadingSpaceStyle = hasLeadingSpace ? spaceStyle : undefined;
        words.push(word);
      }

      // Handle trailing line break from the span
      if (span.isLineBreak) {
        words.push(new StyledWord(resolved, '', true));
        prevSpanEndedWithSpace = false;
      } else {
        prevSpanEndedWithSpace = text.endsWith(' ');
      }

      prevResolvedStyle = resolved;
    }

    return words;
  }

  /**
   * Sets the line height to the maximum font size across all runs * 1.2.
   */
  private updateLineHeight(line: RichTextLine): void {
    let maxFontSize = this.defaultStyle.effectiveFontSize;
    for (const run of line.runs) {
      const fontSize = run.style.effectiveFontSize;
      if (fontSize > maxFontSize) maxFontSize = fontSize;
    }

    line.height = maxFontSize * 1.2;
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

    // Calculate starting X based on alignment
    let startX = baseX;
    if (this.alignment === TextAlignment.Center) {
      startX += (contentWidth - line.totalWidth) / 2;
    } else if (this.alignment === TextAlignment.Right) {
      startX += contentWidth - line.totalWidth;
    }

    // For justify, calculate extra space per space character
    let extraWordSpacing = 0;
    const useJustify = this.alignment === TextAlignment.Justify && !isLastLine;
    if (useJustify) {
      let spaceCount = 0;
      for (const run of line.runs) {
        for (const c of run.text) {
          if (c === ' ') spaceCount++;
        }
      }

      if (spaceCount > 0) {
        extraWordSpacing = (contentWidth - line.totalWidth) / spaceCount;
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
        const runWidth = this.measureRunWidth(run, extraWordSpacing);
        ctx.canvas.fillRect(currentX, y, runWidth, line.height, style.backgroundColor);
      }

      // Draw each word segment separately when justified (to apply extra spacing)
      if (useJustify && extraWordSpacing > 0 && run.text.includes(' ')) {
        currentX = this.drawJustifiedRun(ctx, run, currentX, y, line.height, extraWordSpacing);
      } else {
        // Draw the run as a single text call
        ctx.canvas.drawText(currentX, y, run.text, color, fontSize, fontName, TextAlignment.Left);

        const runWidth = FontMetrics.getStringWidth(run.text, fontName, fontSize);

        // Draw decorations
        if (style.decoration !== TextDecoration.None) {
          this.drawRunDecorations(ctx, style, currentX, y, runWidth, fontSize);
        }

        currentX += runWidth;
      }
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
    lineHeight: number,
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

      // Add space before word (except first)
      if (i > 0) {
        const spaceWidth = FontMetrics.getStringWidth(' ', fontName, fontSize);
        currentX += spaceWidth + extraWordSpacing;
      }

      if (word !== '') {
        ctx.canvas.drawText(currentX, y, word, color, fontSize, fontName, TextAlignment.Left);
        const wordWidth = FontMetrics.getStringWidth(word, fontName, fontSize);

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
    const thickness = Math.max(0.5, fontSize / 18);

    if ((style.decoration & TextDecoration.Underline) !== 0) {
      const underlineY = y + fontSize + fontSize / 7;
      ctx.canvas.drawLine(x, underlineY, x + width, underlineY, style.effectiveColor, thickness);
    }

    if ((style.decoration & TextDecoration.Strikethrough) !== 0) {
      const strikeY = y + fontSize * 0.55;
      ctx.canvas.drawLine(x, strikeY, x + width, strikeY, style.effectiveColor, thickness);
    }
  }

  // --- Helpers ---

  private resolveStyle(spanStyle?: TextStyle): TextStyle {
    if (!spanStyle) {
      return this.defaultStyle || new TextStyle();
    }
    return spanStyle.mergeWith(this.defaultStyle);
  }

  private measureRunWidth(run: StyledRun, extraWordSpacing: number): number {
    let baseWidth = FontMetrics.getStringWidth(
      run.text,
      run.style.effectiveFontName,
      run.style.effectiveFontSize
    );

    if (extraWordSpacing > 0) {
      let spaceCount = 0;
      for (const c of run.text) {
        if (c === ' ') spaceCount++;
      }
      baseWidth += spaceCount * extraWordSpacing;
    }

    return baseWidth;
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

  constructor(style: TextStyle, text: string, isLineBreak: boolean) {
    this.style = style;
    this.text = text;
    this.isLineBreak = isLineBreak;
  }
}
