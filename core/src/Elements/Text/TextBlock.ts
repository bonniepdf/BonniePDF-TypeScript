import { TextElementBase } from './TextElementBase';
import { toTextAlignment, type TextAlignmentInput } from '../../Normalize/toEnum';
import { IStatefulElement } from '../IElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';
import type { SvgCanvas } from '../../Drawing/SvgCanvas';
import { TextAlignment } from './TextAlignment';
import { TextDecoration } from './TextDecoration';
import { paintDecorationLine } from './DecorationStyle';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { applyOptions } from '../../Core/applyOptions';
import { TEXT_ELEMENT_OPTION_KEYS, type TextElementOptions } from './TextElementOptions';

/** Settable properties declared by {@link TextBlock} itself. */
export const TEXT_BLOCK_OWN_OPTION_KEYS = [
  'text',
  'alignment',
  'minLinesBeforeBreak',
  'minLinesAfterBreak',
  'maxLines',
  'ellipsis',
  'firstLineIndent',
  'paragraphSpacing',
] as const;

/** The full settable surface of a text block, bases included. */
export const TEXT_BLOCK_OPTION_KEYS = [...TEXT_ELEMENT_OPTION_KEYS, ...TEXT_BLOCK_OWN_OPTION_KEYS] as const;

type TextBlockOwnKey = (typeof TEXT_BLOCK_OWN_OPTION_KEYS)[number];

/** Options for {@link TextBlock}. Intersects {@link TextElementOptions}. */
export type TextBlockOptions = TextElementOptions &
  Partial<Omit<Pick<TextBlock, TextBlockOwnKey>, 'alignment'>> & {
    /** Paragraph alignment. Accepts `'left' | 'center' | 'right' | 'middle' | 'justify'`. */
    alignment?: TextAlignmentInput;
  };

/**
 * A text block element that supports word wrapping, alignment, font customization,
 * and automatic pagination across page boundaries.
 */
export class TextBlock extends TextElementBase implements IStatefulElement, IRoleProvider {
  private cachedContentWidth = -1;
  private cachedLines?: string[];

  // State tracking for multipage rendering
  private lastLineRendered = -1;

  public text!: string;

  /**
   * PDF/UA structure role for this element. Defaults to
   * {@link SemanticRole.P} (a paragraph). {@link Heading} overrides
   * this to return one of H1…H6.
   */
  public get semanticRole(): SemanticRole {
    return SemanticRole.P;
  }
  private _alignment: TextAlignment = TextAlignment.Left;

  /** Paragraph alignment. Accepts `'left' | 'center' | 'right' | 'middle' | 'justify'`. */
  public get alignment(): TextAlignment {
    return this._alignment;
  }
  public set alignment(value: TextAlignmentInput) {
    this._alignment = toTextAlignment(value);
  }

  /**
   * Minimum number of lines to render before a page break (orphan control).
   * If fewer lines fit on the current page, the entire block moves to the next page.
   * Set to 1 to disable orphan control. Default is 2.
   */
  public minLinesBeforeBreak = 2;

  /**
   * Minimum number of lines that must appear after a page break (widow control).
   * If fewer lines remain for the next page, the break point is adjusted
   * to push more lines forward. Set to 1 to disable widow control. Default is 2.
   */
  public minLinesAfterBreak = 2;

  /**
   * this feature line clamp: maximum number of lines to render. When set and the text
   * wraps to more lines, the block is truncated to this many lines and
   * {@link ellipsis} is appended to the last visible line. Null = no clamp.
   */
  public maxLines?: number;

  /**
   * Ellipsis appended to the last line when {@link maxLines} clamps the text.
   * Default `…` (U+2026).
   */
  public ellipsis = '…';

  /**
   * this feature paragraph layout: horizontal indent (points) applied to the first line
   * of each paragraph (a paragraph = text between hard `\n` breaks). Default 0.
   */
  public firstLineIndent = 0;

  /**
   * this feature paragraph layout: extra vertical space (points) inserted before each
   * paragraph after the first. Default 0.
   */
  public paragraphSpacing = 0;

  /** Per-line horizontal indent, parallel to {@link cachedLines}. */
  private cachedIndents?: number[];
  /** Per-line extra leading above the line, parallel to {@link cachedLines}. */
  private cachedSpaceBefore?: number[];

  /** Creates a text block, optionally with its text. */
  constructor(text?: string);
  /**
   * Creates a text block configured in one expression.
   *
   * ```typescript
   * new TextBlock({ text: 'Hello', fontSize: 11, textColor: 'slate-600' });
   * ```
   */
  constructor(options: TextBlockOptions);
  /** Convenience: the text as a positional payload, plus options. */
  constructor(text: string, options?: TextBlockOptions);
  constructor(textOrOptions?: string | TextBlockOptions, options?: TextBlockOptions) {
    super();
    // Resolve the two accepted shapes into one text + one options bag. A string
    // first argument is the payload; anything else is the options bag itself
    // (`09a §3.4`: an options object is the only bare-object argument form).
    const isPositional = typeof textOrOptions === 'string';
    if (isPositional) {
      this.text = textOrOptions;
    }
    applyOptions(this, isPositional ? options : textOrOptions);
  }

  /**
   * Renders this text block with state tracking for pagination.
   * Text that doesn't fit on the current page will be continued on the next page.
   * Respects MinLinesBeforeBreak (orphan) and MinLinesAfterBreak (widow) settings.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    // Apply top margin only on first render (not on continuation pages)
    if (this.lastLineRendered < 0) {
      ctx.currentY += this.margin.top;
    }

    const contentWidth = width - this.margin.left - this.margin.right;
    const lines = this.getOrComputeLines(contentWidth);

    // Start from the next unrendered line
    const startLine = this.lastLineRendered + 1;

    if (startLine >= lines.length) {
      // All lines already rendered
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    const remainingLines = lines.length - startLine;
    const startY = ctx.currentY;

    // Calculate how many lines fit on this page. Each line's slot is the base
    // line height plus any paragraph leading above it (this feature; zero when unused).
    let linesThatFit = 0;
    let testY = startY;
    for (let i = startLine; i < lines.length; i++) {
      if (testY + this.spaceBeforeOf(i) + this.lineHeight > ctx.maxY) break;
      linesThatFit++;
      testY += this.spaceBeforeOf(i) + this.lineHeight;
    }

    // If all remaining lines fit, just render them all (no break needed)
    if (linesThatFit >= remainingLines) {
      return this.renderLines(ctx, lines, startLine, lines.length, contentWidth, startY);
    }

    const notAtTop = ctx.currentY > ctx.margin;

    // Orphan control: if this is the first chunk of this block on the current page
    // and too few lines would appear before the break, move the whole block
    if (startLine === 0 && linesThatFit < this.minLinesBeforeBreak && notAtTop) {
      return RenderStatus.WrapRequired;
    }

    // Widow control: if too few lines would remain after the break,
    // reduce how many we render so at least MinLinesAfterBreak go to the next page
    const linesAfterBreak = remainingLines - linesThatFit;
    if (linesThatFit > 0 && linesAfterBreak > 0 && linesAfterBreak < this.minLinesAfterBreak) {
      const targetFit = remainingLines - this.minLinesAfterBreak;

      // Don't violate orphan control when adjusting for widows
      if (startLine === 0 && targetFit < this.minLinesBeforeBreak && notAtTop) {
        // Can't satisfy both constraints - move the entire block
        return RenderStatus.WrapRequired;
      }

      linesThatFit = Math.max(0, targetFit);
    }

    // If we have zero lines to render (widow adjustment pushed everything out)
    if (linesThatFit <= 0) {
      return startLine === 0 ? RenderStatus.WrapRequired : RenderStatus.Overflow;
    }

    // Render the lines that fit
    const endLine = startLine + linesThatFit;
    return this.renderLines(ctx, lines, startLine, endLine, contentWidth, startY);
  }

  /**
   * Renders lines from startLine (inclusive) to endLine (exclusive).
   */
  private renderLines(
    ctx: RenderContext,
    lines: string[],
    startLine: number,
    endLine: number,
    contentWidth: number,
    startY: number
  ): RenderStatus {
    let y = startY;
    for (let i = startLine; i < endLine; i++) {
      const isLastLine = i === lines.length - 1;
      y += this.spaceBeforeOf(i); // this feature paragraph leading (0 when unused)
      this.drawSingleLine(
        ctx,
        lines[i],
        contentWidth,
        y,
        ctx.currentX + this.margin.left + this.indentOf(i),
        isLastLine
      );
      y += this.lineHeight;
    }

    this.lastLineRendered = endLine - 1;
    ctx.currentY = y;

    if (endLine >= lines.length) {
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    return RenderStatus.Overflow;
  }

  /**
   * Resets the internal state, preparing the element for a fresh render.
   */
  public resetState(): void {
    this.lastLineRendered = -1;
    this.cachedLines = undefined;
    this.cachedIndents = undefined;
    this.cachedSpaceBefore = undefined;
    this.cachedContentWidth = -1;
  }

  protected override getPreferredContentWidth(): number {
    return this.measureTextWidth(this.text) + this.firstLineIndent;
  }

  protected override measureContentHeight(contentWidth: number): number {
    const lines = this.getOrComputeLines(contentWidth);
    let height = lines.length * this.lineHeight;
    for (let i = 0; i < lines.length; i++) height += this.spaceBeforeOf(i);
    return height;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const lines = this.getOrComputeLines(contentWidth);
    let y = ctx.currentY;

    for (let i = 0; i < lines.length; i++) {
      const isLastLine = i === lines.length - 1;
      y += this.spaceBeforeOf(i); // this feature paragraph leading (0 when unused)
      this.drawSingleLine(ctx, lines[i], contentWidth, y, ctx.currentX + this.indentOf(i), isLastLine);
      y += this.lineHeight;
    }

    // Advance Y by the total content height
    ctx.currentY = y;
  }

  /**
   * Draws a single line of text, handling alignment (including justification) and decorations.
   */
  private drawSingleLine(
    ctx: RenderContext,
    line: string,
    contentWidth: number,
    y: number,
    baseX: number,
    isLastLine: boolean
  ): void {
    // apply letter/word spacing as canvas state around this line so the
    // painters advance by the same amount the layout reserved. No-op (and
    // byte-identical) when both are zero.
    const spaced = this.letterSpacing !== 0 || this.wordSpacing !== 0;
    if (spaced) ctx.canvas.setTextSpacing(this.letterSpacing, this.wordSpacing);
    try {
      this.drawSingleLineInner(ctx, line, contentWidth, y, baseX, isLastLine);
    } finally {
      if (spaced) ctx.canvas.setTextSpacing(0, 0);
    }
  }

  private drawSingleLineInner(
    ctx: RenderContext,
    line: string,
    contentWidth: number,
    y: number,
    baseX: number,
    isLastLine: boolean
  ): void {
    // Substitute current page number inline - it is known at render time
    let processedLine = line;
    if (line.includes(TextElementBase.CurrentPageToken)) {
      processedLine = line.replace(TextElementBase.CurrentPageToken, (ctx.currentPageIndex + 1).toString());
    }

    if (line.includes(TextElementBase.TotalPagesToken)) {
      this.drawLineWithTokens(ctx, processedLine, contentWidth, y, baseX);
      // Decorations for token lines use the measured width
      if (this.textDecoration !== TextDecoration.None) {
        const lineWidth = this.measureTextWidth(processedLine);
        let decoX = baseX;
        if (this.alignment === TextAlignment.Center) {
          decoX += (contentWidth - lineWidth) / 2;
        } else if (this.alignment === TextAlignment.Right) {
          decoX += contentWidth - lineWidth;
        }
        this.drawDecorations(ctx, decoX, y, lineWidth);
      }

      return;
    }

    // Determine effective alignment: justified text uses left for the last line
    const useJustify = this.alignment === TextAlignment.Justify && !isLastLine && line.includes(' ');

    if (useJustify) {
      ctx.canvas.drawTextJustified(baseX, y, processedLine, this.textColor, this.fontSize, this.fontName, contentWidth);

      if (this.textDecoration !== TextDecoration.None) {
        this.drawDecorations(ctx, baseX, y, contentWidth);
      }
    } else {
      // For justified last lines, fall back to left alignment
      const effectiveAlign = this.alignment === TextAlignment.Justify ? TextAlignment.Left : this.alignment;

      let x = baseX;
      if (effectiveAlign === TextAlignment.Center) {
        x += contentWidth / 2;
      } else if (effectiveAlign === TextAlignment.Right) {
        x += contentWidth;
      }

      ctx.canvas.drawText(x, y, processedLine, this.textColor, this.fontSize, this.fontName, effectiveAlign);

      if (this.textDecoration !== TextDecoration.None) {
        const lineWidth = this.measureTextWidth(processedLine);
        let decoX = baseX;
        if (effectiveAlign === TextAlignment.Center) {
          decoX += (contentWidth - lineWidth) / 2;
        } else if (effectiveAlign === TextAlignment.Right) {
          decoX += contentWidth - lineWidth;
        }
        this.drawDecorations(ctx, decoX, y, lineWidth);
      }
    }
  }

  /**
   * Draws text decorations (underline and/or strikethrough) for a rendered line.
   */
  private drawDecorations(ctx: RenderContext, x: number, y: number, width: number): void {
    // Line thickness scales with font size (typical: 1/18th of font size, min 0.5pt)
    // unless an explicit decorationThickness is set.
    const thickness = this.decorationThickness ?? Math.max(0.5, this.fontSize / 18);
    const color = this.decorationColor ?? this.textColor;

    if ((this.textDecoration & TextDecoration.Overline) !== 0) {
      // Overline: drawn above the text, just over the cap height.
      paintDecorationLine(ctx.canvas, x, y + this.fontSize * 0.15, width, color, thickness, this.decorationStyle);
    }

    if ((this.textDecoration & TextDecoration.Underline) !== 0) {
      // Underline: drawn below the baseline.
      // Baseline is approximately at y + fontSize. Underline offset below baseline ~fontSize/7.
      paintDecorationLine(
        ctx.canvas,
        x,
        y + this.fontSize + this.fontSize / 7,
        width,
        color,
        thickness,
        this.decorationStyle
      );
    }

    if ((this.textDecoration & TextDecoration.Strikethrough) !== 0) {
      // Strikethrough: drawn at approximately half the cap height.
      paintDecorationLine(ctx.canvas, x, y + this.fontSize * 0.55, width, color, thickness, this.decorationStyle);
    }
  }

  private drawLineWithTokens(ctx: RenderContext, line: string, contentWidth: number, y: number, baseX: number): void {
    // 1. Calculate total width of the line (using placeholder for tokens)
    const totalLineWidth = this.measureTextWidth(line);

    // 2. Determine Start X
    let startX = baseX;
    if (this.alignment === TextAlignment.Center) {
      startX += (contentWidth - totalLineWidth) / 2;
    } else if (this.alignment === TextAlignment.Right) {
      startX += contentWidth - totalLineWidth;
    }

    // 3. Draw Parts
    const parts = line.split(TextElementBase.TotalPagesToken);
    let currentX = startX;

    for (let i = 0; i < parts.length; i++) {
      // Draw text part
      const part = parts[i];
      if (part !== '') {
        // Draw normal text
        ctx.canvas.drawText(currentX, y, part, this.textColor, this.fontSize, this.fontName, TextAlignment.Left);
        currentX += this.measureTextWidth(part);
      }

      // Draw token if not the last part
      if (i < parts.length - 1) {
        // Width of the placeholder
        const tokenWidth = this.measureTextWidth('00'); // Matches TextElementBase substitution

        if (ctx.isSvgMode) {
          const svgCanvas = ctx.canvas as SvgCanvas;
          if (typeof svgCanvas.drawDeferredTotalPages === 'function') {
            svgCanvas.drawDeferredTotalPages(currentX, y, this.textColor, this.fontSize, this.fontName);
          } else {
            ctx.canvas.drawText(currentX, y, '00', this.textColor, this.fontSize, this.fontName, TextAlignment.Left);
          }
        } else {
          const resourceName = ctx.registerDeferredXObject(this.fontName, this.fontSize, this.textColor);
          // DrawFormXObject draws at x, y (top-left of form)
          ctx.canvas.drawFormXObject(resourceName, currentX, y);
        }

        currentX += tokenWidth;
      }
    }
  }

  /**
   * Gets cached lines or computes them if needed.
   * Caching prevents re-computation during multipage rendering.
   */
  private getOrComputeLines(contentWidth: number): string[] {
    // Use tolerance for floating point comparison
    if (this.cachedLines && Math.abs(this.cachedContentWidth - contentWidth) < 0.001) {
      return this.cachedLines;
    }

    const paragraphs = this.firstLineIndent !== 0 || this.paragraphSpacing !== 0;
    let lines: string[];
    let indents: number[];
    let spaceBefore: number[];

    if (paragraphs) {
      ({ lines, indents, spaceBefore } = this.computeParagraphLayout(this.text, contentWidth));
    } else {
      lines = this.computeLines(this.text, contentWidth);
      indents = new Array(lines.length).fill(0);
      spaceBefore = new Array(lines.length).fill(0);
    }

    if (this.maxLines != null && this.maxLines > 0 && lines.length > this.maxLines) {
      lines = this.clampLines(lines, contentWidth);
      indents = indents.slice(0, lines.length);
      spaceBefore = spaceBefore.slice(0, lines.length);
    }

    this.cachedLines = lines;
    this.cachedIndents = indents;
    this.cachedSpaceBefore = spaceBefore;
    this.cachedContentWidth = contentWidth;
    return this.cachedLines;
  }

  /** Per-line horizontal indent; 0 when paragraph controls are unused. */
  private indentOf(i: number): number {
    return this.cachedIndents?.[i] ?? 0;
  }

  /** Per-line extra leading above the line; 0 when unused. */
  private spaceBeforeOf(i: number): number {
    return this.cachedSpaceBefore?.[i] ?? 0;
  }

  /**
   * this feature paragraph-aware line layout. Splits on hard `\n` breaks; the first line
   * of each paragraph wraps to a narrower column (by {@link firstLineIndent}) and
   * carries that indent, and every paragraph after the first carries
   * {@link paragraphSpacing} of leading before its first line.
   */
  private computeParagraphLayout(
    text: string,
    contentWidth: number
  ): { lines: string[]; indents: number[]; spaceBefore: number[] } {
    const lines: string[] = [];
    const indents: number[] = [];
    const spaceBefore: number[] = [];

    const segments = (text ?? '').replace(/\r\n?/g, '\n').split('\n');
    segments.forEach((segment, si) => {
      const wrapped = this.wrapWithFirstIndent(segment, contentWidth);
      if (wrapped.length === 0) wrapped.push('');
      wrapped.forEach((line, li) => {
        lines.push(line);
        indents.push(li === 0 ? this.firstLineIndent : 0);
        spaceBefore.push(li === 0 && si > 0 ? this.paragraphSpacing : 0);
      });
    });

    return { lines, indents, spaceBefore };
  }

  /**
   * Greedy word-wrap where the first line fits `contentWidth - firstLineIndent`
   * and the remainder fits the full `contentWidth`.
   */
  private wrapWithFirstIndent(segment: string, contentWidth: number): string[] {
    if (segment === '') return [];
    const words = segment.split(' ');
    const lines: string[] = [];
    let current = '';
    let widthLimit = contentWidth - this.firstLineIndent;

    for (const word of words) {
      const test = current === '' ? word : current + ' ' + word;
      if (this.measureTextWidth(test) > widthLimit && current !== '') {
        lines.push(current);
        current = word;
        widthLimit = contentWidth; // subsequent lines are full width
      } else {
        current = test;
      }
    }
    if (current !== '') lines.push(current);
    return lines;
  }

  /**
   * this feature line clamp: keeps the first {@link maxLines} lines and appends
   * {@link ellipsis} to the last visible one, trimming whole words (then
   * characters) until `line + ellipsis` fits `contentWidth`. The dropped lines
   * are never drawn, so no hidden text reaches the content stream or the
   * structure tree - the clamp is PDF/UA-safe by construction, and the ellipsis
   * is real, measured content.
   */
  private clampLines(lines: string[], contentWidth: number): string[] {
    const kept = lines.slice(0, this.maxLines);
    const lastIndex = kept.length - 1;
    let last = kept[lastIndex];
    const ell = this.ellipsis;

    // Trim trailing whitespace, then whole words, then characters, until it fits.
    last = last.replace(/\s+$/, '');
    while (last.length > 0 && this.measureTextWidth(last + ell) > contentWidth) {
      const lastSpace = last.replace(/\s+$/, '').lastIndexOf(' ');
      if (lastSpace > 0) {
        last = last.slice(0, lastSpace).replace(/\s+$/, '');
      } else {
        last = last.slice(0, -1).replace(/\s+$/, '');
      }
    }

    kept[lastIndex] = last + ell;
    return kept;
  }
}
