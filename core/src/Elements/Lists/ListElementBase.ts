import { TextElementBase } from '../Text/TextElementBase';
import { TEXT_ELEMENT_OPTION_KEYS, type TextElementOptions } from '../Text/TextElementOptions';
import { RenderContext } from '../../Rendering/RenderContext';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/**
 * Base class for list elements (ordered and unordered) that provides common functionality
 * for item spacing, indentation, and nested list handling.
 */
/** Settable properties declared by {@link ListElementBase} itself. */
export const LIST_ELEMENT_OWN_OPTION_KEYS = ['indent', 'itemSpacing'] as const;

/** The full settable surface of a list, text/element bases included. */
export const LIST_ELEMENT_OPTION_KEYS = [...TEXT_ELEMENT_OPTION_KEYS, ...LIST_ELEMENT_OWN_OPTION_KEYS] as const;

/**
 * Options common to both list types. Intersects {@link TextElementOptions}.
 * `items` is synthetic sugar over `addItem` on the concrete lists, not a
 * property here.
 */
export type ListElementOptions = TextElementOptions &
  Partial<Omit<Pick<ListElementBase, (typeof LIST_ELEMENT_OWN_OPTION_KEYS)[number]>, 'indent' | 'itemSpacing'>> & {
    /** Marker indent. Accepts a length: `20`, `'7mm'`, or `{ value, unit }`. */
    indent?: LengthInput;
    /** Gap between items. Accepts a length: `5`, `'2mm'`, or `{ value, unit }`. */
    itemSpacing?: LengthInput;
  };

/** Provides shared marker, indentation, spacing, and pagination behavior for lists. */
export abstract class ListElementBase extends TextElementBase {
  private _indent: number = 20;

  /** Indentation for nested lists (in points)
   *
   * Accepts a length: a number of points, `'7mm'`, or `{ value, unit }` (§4A.3).
   */
  public get indent(): number {
    return this._indent;
  }
  public set indent(value: LengthInput) {
    this._indent = toLength(value);
  }

  private _itemSpacing: number = 5;

  /** Spacing between list items (in points)
   *
   * Accepts a length: a number of points, `'2mm'`, or `{ value, unit }` (§4A.3).
   */
  public get itemSpacing(): number {
    return this._itemSpacing;
  }
  public set itemSpacing(value: LengthInput) {
    this._itemSpacing = toLength(value);
  }

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
      totalHeight += lines.length * this.effectiveLineHeight + this.itemSpacing;
    }

    // Remove spacing after last item
    if (totalHeight > 0) totalHeight -= this.itemSpacing;

    return totalHeight;
  }

  /** Measures text items and nested lists using the shared list indentation rules. */
  protected measureListHeight(items: string[], nestedLists: readonly ListElementBase[], contentWidth: number): number {
    let totalHeight = this.measureItemsHeight(items, contentWidth - this.indent);
    for (const nestedList of nestedLists) {
      totalHeight += nestedList.measureHeight(contentWidth - this.indent) + this.itemSpacing;
    }
    return totalHeight;
  }

  /** Renders nested lists at the shared indentation and restores the parent cursor. */
  protected renderNestedLists(ctx: RenderContext, nestedLists: readonly ListElementBase[], contentWidth: number): void {
    for (const nestedList of nestedLists) {
      const originalX = ctx.currentX;
      ctx.currentX += this.indent;
      nestedList.render(ctx, contentWidth - this.indent);
      ctx.currentX = originalX;
      ctx.currentY += this.itemSpacing;
    }
  }

  /**
   * Checks if a new page is needed before rendering content.
   */
  protected static checkPageBreak(ctx: RenderContext, lineHeight: number): boolean {
    if (ctx.currentY + lineHeight > ctx.maxY && ctx.currentY > ctx.contentTop) {
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

        ListElementBase.checkPageBreak(ctx, this.effectiveLineHeight);
        y = ctx.currentY;

        const markerX = ctx.currentX;
        const textX = ctx.currentX + markerWidth + 5;

        if (!tagging) {
          // Non-tagged: original behavior - marker drawn on every wrapped line
          renderMarker(markerX, y);
          ctx.canvas.drawText(textX, y, line, this.color, this.fontSize, this.fontName, 0);
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
          ctx.canvas.drawText(textX, y, line, this.color, this.fontSize, this.fontName, 0);
          ctx.canvas.endMarkedContent();
        }

        y += this.effectiveLineHeight;
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
