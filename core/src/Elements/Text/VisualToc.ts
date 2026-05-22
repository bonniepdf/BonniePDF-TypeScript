import { TextAlignment } from './TextAlignment';
import { ElementBase } from '../ElementBase';
import { IStatefulElement } from './IStatefulElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';
import { StandardFonts } from '../../Typography/StandardFonts';
import { FontMetrics } from '../../Typography/FontMetrics';
import { Color } from '../../Core/Color';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

/**
 * Renders a visual Table of Contents with dotted leaders and right-aligned page numbers,
 * built from a list of heading identifiers that were registered during layout.
 * Supports multi-page overflow via IStatefulElement so that very long
 * tables of contents flow naturally across page boundaries.
 */
export class VisualToc extends ElementBase implements IStatefulElement, IRoleProvider {
  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return SemanticRole.TOC;
  }

  /**
   * Gets or sets the ordered list of TOC identifiers to render.
   * Each identifier must match the Heading.TocIdentifier of a rendered heading.
   */
  public headingIdentifiers: string[] = [];

  /**
   * Gets or sets the font name used to render TOC entry text.
   */
  public fontName: string = StandardFonts.Helvetica;

  /**
   * Gets or sets the font size (in points) used to render TOC entry text.
   */
  public fontSize = 12;

  /**
   * Gets or sets the text color used for TOC entries.
   */
  public textColor: Color = Color.black;

  private lastRenderedIndex = -1;

  /**
   * Returns the preferred content width. The element expands to fill all available width.
   */
  protected override getPreferredContentWidth(): number {
    return 0; // It will expand to available width
  }

  /**
   * Measures the total height required to render all TOC entries at the configured font size.
   */
  protected override measureContentHeight(contentWidth: number): number {
    return this.headingIdentifiers.length * (this.fontSize * 1.2);
  }

  /**
   * Renders all TOC entries at the current cursor position without page-boundary checks.
   * Used by the non-stateful render path when the entire TOC is known to fit.
   */
  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    let y = ctx.currentY;
    const lineHeight = this.fontSize * 1.2;

    for (let i = 0; i < this.headingIdentifiers.length; i++) {
      this.drawTaggedTocEntry(ctx, this.headingIdentifiers[i], contentWidth, y);
      y += lineHeight;
    }

    ctx.currentY = y;
  }

  /**
   * Renders as many TOC entries as fit on the current page, advancing the cursor and
   * returning RenderStatus.Overflow when more entries remain for the next page.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (this.lastRenderedIndex < 0) {
      ctx.currentY += this.margin.top;
    }

    const contentWidth = this.getContentWidth(width);
    const lineHeight = this.fontSize * 1.2;
    const startIndex = this.lastRenderedIndex + 1;

    if (startIndex >= this.headingIdentifiers.length) {
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    const startY = ctx.currentY;
    let itemsThatFit = 0;
    let testY = startY;

    for (let i = startIndex; i < this.headingIdentifiers.length; i++) {
      if (testY + lineHeight > ctx.maxY) break;
      itemsThatFit++;
      testY += lineHeight;
    }

    if (itemsThatFit === 0) {
      return startIndex === 0 ? RenderStatus.WrapRequired : RenderStatus.Overflow;
    }

    const endIndex = startIndex + itemsThatFit;
    let y = startY;
    for (let i = startIndex; i < endIndex; i++) {
      this.drawTaggedTocEntry(ctx, this.headingIdentifiers[i], contentWidth, y);
      y += lineHeight;
    }

    this.lastRenderedIndex = endIndex - 1;
    ctx.currentY = y;

    if (endIndex >= this.headingIdentifiers.length) {
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    return RenderStatus.Overflow;
  }

  /**
   * Draws a single TOC entry: the heading text on the left, a dotted leader in the middle,
   * and the resolved page number on the right. Also registers a clickable hyperlink annotation
   * spanning the full line width so the user can navigate directly to the heading.
   */
  /**
   * wraps drawTocEntry in a /TOCI struct element + marked-content
   * scope so each entry is its own addressable item in the PDF/UA
   * structure tree. The outer /TOC wrap comes from the pipeline's
   * IRoleProvider hook using {@link semanticRole}. No-op when tagging
   * is off.
   */
  private drawTaggedTocEntry(ctx: RenderContext, identifier: string, contentWidth: number, y: number): void {
    const tagging = ctx.tagging;
    const tagThisEntry = tagging != null;
    if (tagThisEntry) {
      tagging!.tree.begin(SemanticRole.TOCI);
      ctx.canvas.beginMarkedContent('TOCI');
    }

    try {
      this.drawTocEntry(ctx, identifier, contentWidth, y);
    } finally {
      if (tagThisEntry) {
        ctx.canvas.endMarkedContent();
        tagging!.tree.end();
      }
    }
  }

  private drawTocEntry(ctx: RenderContext, identifier: string, contentWidth: number, y: number): void {
    let pageNumStr = 'XX';
    if (ctx.tocEntries.has(identifier)) {
      pageNumStr = ctx.tocEntries.get(identifier)!.toString();
    }

    // Draw heading text
    ctx.canvas.drawText(ctx.currentX, y, identifier, this.textColor, this.fontSize, this.fontName, TextAlignment.Left);

    // Draw page number
    const pageNumWidth = FontMetrics.getStringWidth(pageNumStr, this.fontName, this.fontSize);
    const pageNumX = ctx.currentX + contentWidth - pageNumWidth;
    ctx.canvas.drawText(pageNumX, y, pageNumStr, this.textColor, this.fontSize, this.fontName, TextAlignment.Left);

    // Draw dotted leader
    const textWidth = FontMetrics.getStringWidth(identifier, this.fontName, this.fontSize);
    const startDotX = ctx.currentX + textWidth + 5;
    const endDotX = pageNumX - 5;

    if (endDotX > startDotX) {
      const dot = '.';
      const dotWidth = FontMetrics.getStringWidth(dot, this.fontName, this.fontSize);
      let currentDotX = startDotX;
      while (currentDotX + dotWidth <= endDotX) {
        ctx.canvas.drawText(currentDotX, y, dot, this.textColor, this.fontSize, this.fontName, TextAlignment.Left);
        currentDotX += dotWidth * 2; // Spacing between dots
      }
    }

    // Make the entire line clickable to the internal named destination
    const lineHeight = this.fontSize * 1.2;
    const pdfX = ctx.currentX;
    const pdfY = ctx.pageSize.height - (y + lineHeight); // PDF coordinate is bottom-up

    const targetPage = ctx.tocEntries.get(identifier) ?? 0;
    const link = {
      identifier,
      targetPageIndex: targetPage,
      renderX: pdfX,
      renderY: pdfY,
      renderWidth: contentWidth,
      renderHeight: lineHeight,
      setRenderBounds(rx: number, ry: number, rw: number, rh: number) {
        this.renderX = rx;
        this.renderY = ry;
        this.renderWidth = rw;
        this.renderHeight = rh;
      },
    } as any;
    ctx.registerHyperlink(link);
  }

  /**
   * Resets the render state so that rendering can restart from the first entry,
   * for example before a second layout pass.
   */
  public resetState(): void {
    this.lastRenderedIndex = -1;
  }
}
