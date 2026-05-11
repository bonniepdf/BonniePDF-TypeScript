import { TextElementBase } from '../Text/TextElementBase';
import { RenderContext } from '../../Rendering/RenderContext';

/**
 * Base class for list elements (ordered and unordered) that provides common functionality
 * for item spacing, indentation, and nested list handling.
 */
export abstract class ListElementBase extends TextElementBase {
  /** Indentation for nested lists (in points) */
  public indent = 20;

  /** Spacing between list items (in points) */
  public itemSpacing = 5;

  /**
   * Measures the height of list items, accounting for item spacing.
   */
  protected measureItemsHeight(items: string[], itemWidth: number): number {
    let totalHeight = 0;

    for (const item of items) {
      const lines = this.computeLines(item, itemWidth);
      totalHeight += lines.length * this.lineHeight + this.itemSpacing;
    }

    // Remove spacing after last item
    if (totalHeight > 0) totalHeight -= this.itemSpacing;

    return totalHeight;
  }

  /**
   * Checks if a new page is needed before rendering content.
   */
  protected static checkPageBreak(ctx: RenderContext, lineHeight: number): boolean {
    if (ctx.currentY + lineHeight > ctx.maxY && ctx.currentY > ctx.margin) {
      ctx.newPage();
      return true;
    }
    return false;
  }

  /**
   * Renders a list item with proper pagination handling.
   */
  protected renderListItem(
    ctx: RenderContext,
    lines: string[],
    renderMarker: (x: number, y: number) => void,
    markerWidth: number
  ): void {
    let y = ctx.currentY;

    for (const line of lines) {
      // Check if we need a new page
      ListElementBase.checkPageBreak(ctx, this.lineHeight);
      y = ctx.currentY;

      // Render marker at the left edge
      const markerX = ctx.currentX + this.margin.left;
      renderMarker(markerX, y);

      // Render text after the marker
      const textX = ctx.currentX + this.margin.left + markerWidth + 5;
      ctx.canvas.drawText(textX, y, line, this.textColor, this.fontSize, this.fontName, 0); // TextAlignment.Left

      y += this.lineHeight;
      ctx.currentY = y;
    }

    // Add spacing after the item
    ctx.currentY += this.itemSpacing;
  }
}
