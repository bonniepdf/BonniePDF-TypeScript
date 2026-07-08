import { TextElementBase } from '../Text/TextElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

/**
 * Base class for list elements (ordered and unordered) that provides common functionality
 * for item spacing, indentation, and nested list handling.
 */
export abstract class ListElementBase extends TextElementBase {
  /** Indentation for nested lists (in points) */
  public indent = 20;

  /** Spacing between list items (in points) */
  public itemSpacing = 5;

  /** Child lists rendered as nested list content. */
  public getNestedLists(): readonly ListElementBase[] {
    return [];
  }

  /** @inheritdoc */
  public getChildren(): readonly ListElementBase[] {
    return this.getNestedLists();
  }

  /**
   * Wraps the subclass item rendering in an `L` structure element when tagging is
   * active, so the outer container is present in the structure tree for both
   * top-level and nested lists. Delegates actual content to {@link renderItems}.
   */
  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const tagging = ctx.tagging;
    if (tagging) {
      tagging.tree.begin(SemanticRole.L);
      ctx.canvas.beginContainerContent('L');
    }
    try {
      this.renderItems(ctx, contentWidth);
    } finally {
      if (tagging) {
        ctx.canvas.endMarkedContent();
        tagging.tree.end();
      }
    }
  }

  /**
   * Renders the list items. Implemented by {@link OrderedList} and
   * {@link UnorderedList}; called from {@link renderContent} which
   * handles the outer `L` structure-element wrapper.
   */
  protected abstract renderItems(ctx: RenderContext, contentWidth: number): void;

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
   * Renders one list item with tagged `LI > Lbl + LBody` structure when
   * tagging is active, or the original untagged layout otherwise.
   *
   * Tagged path emits the marker only on the first wrapped line (inside
   * `Lbl`); continuation lines are text-only inside separate `LBody`
   * marked-content sequences that all share a single `LBody` StructElem.
   */
  protected renderListItem(
    ctx: RenderContext,
    lines: string[],
    renderMarker: (x: number, y: number) => void,
    markerWidth: number
  ): void {
    if (lines.length === 0) return;

    const tagging = ctx.tagging;

    // Open LI container around the whole item when tagging
    if (tagging) {
      tagging.tree.begin(SemanticRole.LI);
      ctx.canvas.beginContainerContent('LI');
    }

    try {
      let y = ctx.currentY;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        ListElementBase.checkPageBreak(ctx, this.lineHeight);
        y = ctx.currentY;

        const markerX = ctx.currentX;
        const textX = ctx.currentX + markerWidth + 5;

        if (!tagging) {
          // Non-tagged: original behavior - marker drawn on every wrapped line
          renderMarker(markerX, y);
          ctx.canvas.drawText(textX, y, line, this.textColor, this.fontSize, this.fontName, 0);
        } else {
          if (i === 0) {
            // Lbl - list item label (drawn once, on the first line only)
            tagging.tree.begin(SemanticRole.Lbl);
            ctx.canvas.beginMarkedContent('Lbl');
            renderMarker(markerX, y);
            ctx.canvas.endMarkedContent();
            tagging.tree.end();

            // Open the LBody StructElem; individual marked-content sequences
            // below will each add their own MCID to this single StructElem.
            tagging.tree.begin(SemanticRole.LBody);
          }
          // Each wrapped line gets its own MCID, all recorded under LBody
          ctx.canvas.beginMarkedContent('LBody');
          ctx.canvas.drawText(textX, y, line, this.textColor, this.fontSize, this.fontName, 0);
          ctx.canvas.endMarkedContent();
        }

        y += this.lineHeight;
        ctx.currentY = y;
      }

      if (tagging) {
        tagging.tree.end(); // end LBody
      }
    } finally {
      if (tagging) {
        ctx.canvas.endMarkedContent(); // end LI BMC
        tagging.tree.end(); // end LI StructElem
      }
    }

    ctx.currentY += this.itemSpacing;
  }
}
