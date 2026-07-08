import { TextElementBase } from './TextElementBase';
import { IStatefulElement } from '../IElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';
import type { SvgCanvas } from '../../Drawing/SvgCanvas';
import { TextAlignment } from './TextAlignment';
import { TextDecoration } from './TextDecoration';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

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
  public alignment: TextAlignment = TextAlignment.Left;

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

  constructor(text?: string) {
    super();
    if (text !== undefined) {
      this.text = text;
    }
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

    // Calculate how many lines fit on this page
    let linesThatFit = 0;
    let testY = startY;
    for (let i = startLine; i < lines.length; i++) {
      if (testY + this.lineHeight > ctx.maxY) break;
      linesThatFit++;
      testY += this.lineHeight;
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
      this.drawSingleLine(ctx, lines[i], contentWidth, y, ctx.currentX + this.margin.left, isLastLine);
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
    this.cachedContentWidth = -1;
  }

  protected override getPreferredContentWidth(): number {
    return this.measureTextWidth(this.text);
  }

  protected override measureContentHeight(contentWidth: number): number {
    const lines = this.getOrComputeLines(contentWidth);
    return lines.length * this.lineHeight;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const lines = this.getOrComputeLines(contentWidth);
    let y = ctx.currentY;

    for (let i = 0; i < lines.length; i++) {
      const isLastLine = i === lines.length - 1;
      this.drawSingleLine(ctx, lines[i], contentWidth, y, ctx.currentX, isLastLine);
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
    const thickness = Math.max(0.5, this.fontSize / 18);

    if ((this.textDecoration & TextDecoration.Underline) !== 0) {
      // Underline: drawn below the baseline.
      // Baseline is approximately at y + fontSize. Underline offset below baseline ~fontSize/7.
      const underlineY = y + this.fontSize + this.fontSize / 7;
      ctx.canvas.drawLine(x, underlineY, x + width, underlineY, this.textColor, thickness);
    }

    if ((this.textDecoration & TextDecoration.Strikethrough) !== 0) {
      // Strikethrough: drawn at approximately half the cap height.
      // Cap height is roughly 0.7 * fontSize, so midpoint is ~0.35 * fontSize from top,
      // offset by the ascent baseline positioning (~0.5 * fontSize from line top).
      const strikeY = y + this.fontSize * 0.55;
      ctx.canvas.drawLine(x, strikeY, x + width, strikeY, this.textColor, thickness);
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

    this.cachedLines = this.computeLines(this.text, contentWidth);
    this.cachedContentWidth = contentWidth;
    return this.cachedLines;
  }
}
