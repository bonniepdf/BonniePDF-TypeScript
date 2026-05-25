import { BorderedElementBase } from '../Layout/BorderedElementBase';
import { IElement } from '../IElement';
import { RenderContext } from '../../Rendering/RenderContext';
import { Thickness } from '../../Core/Thickness';
import { Border } from '../../Core/Border';
import { BorderColors } from '../../Core/BorderColors';
import { Color } from '../../Core/Color';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

/**
 * A table cell with support for custom styling, background color, and padding overrides
 */
export class TableCell extends BorderedElementBase implements IRoleProvider {
  /** The content element to display in this cell */
  public content!: IElement;

  /** TextBlock color for this cell */
  public textColor?: Color;

  /** Custom padding for this cell (overrides table default if set) */
  public padding?: Thickness;

  /** Number of columns this cell spans (default: 1) */
  public columnSpan = 1;

  /**
   * Whether this cell is a header cell (renders as `/TH` in PDF/UA
   * tagged output instead of `/TD`). Set automatically by
   * `Table.addHeader*` on each cell in a header row, and at render
   * time from the owning row's `isHeader` flag for cells added
   * directly to a row. Can also be set explicitly for individual
   * cells acting as headers (e.g. first-column row labels).
   */
  public isHeader = false;

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this.isHeader ? SemanticRole.TH : SemanticRole.TD;
  }

  protected override measureContentHeight(contentWidth: number): number {
    const pad = this.padding ?? new Thickness(5);
    return this.content.measureHeight(contentWidth - pad.left - pad.right) + pad.top + pad.bottom;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    // This is used when TableCell is used as a standalone element (not in a table)
    const totalHeight = this.measureContentHeight(contentWidth);

    if (this.backgroundColor) {
      this.drawBackground(ctx, ctx.currentX, ctx.currentY, contentWidth, totalHeight, this.backgroundColor);
    }

    const pad = this.padding ?? new Thickness(5);
    const originalX = ctx.currentX;
    const originalY = ctx.currentY;
    ctx.currentX += pad.left;
    ctx.currentY += pad.top;

    this.content.render(ctx, contentWidth - pad.left - pad.right);

    ctx.currentX = originalX;
    ctx.currentY = originalY;
  }

  /**
   * Creates a TableCell from an IElement
   * @param content - The element to place inside the cell
   */
  public static from(content: IElement): TableCell {
    const cell = new TableCell();
    cell.content = content;
    return cell;
  }

  /**
   * Sets the background color for this cell
   * @param color - The background color
   */
  public withBackground(color: Color): TableCell {
    this.backgroundColor = color;
    return this;
  }

  /**
   * Sets the text color for this cell
   * @param color - The text color
   */
  public withTextColor(color: Color): TableCell {
    this.textColor = color;
    return this;
  }

  /**
   * Sets the padding for this cell (uniform on all sides)
   * @param padding - The padding value in points
   */
  public withPadding(padding: number): TableCell {
    this.padding = new Thickness(padding);
    return this;
  }

  /**
   * Sets the padding for this cell with individual values
   * @param left - Left padding
   * @param top - Top padding
   * @param right - Right padding
   * @param bottom - Bottom padding
   */
  public withPadding4(left: number, top: number, right: number, bottom: number): TableCell {
    this.padding = new Thickness(left, top, right, bottom);
    return this;
  }

  /**
   * Sets the border for this cell (uniform color, same width on all sides)
   * @param color - Border color
   * @param width - Border width in points (default: 1)
   */
  public withBorder(color: Color, width = 1): TableCell {
    this.border = new Border(width);
    this.borderColors = new BorderColors(color);
    return this;
  }

  /**
   * Sets the border with per-side widths and colors
   * @param border - Border widths
   * @param borderColors - Border colors
   */
  public withBorderFull(border: Border, borderColors: BorderColors): TableCell {
    this.border = border;
    this.borderColors = borderColors;
    return this;
  }

  /**
   * Sets the border with per-side widths (single color)
   * @param border - Border widths
   * @param color - Border color (applied to all sides)
   */
  public withBorderAndColor(border: Border, color: Color): TableCell {
    this.border = border;
    this.borderColors = new BorderColors(color);
    return this;
  }

  /**
   * Sets the column span for this cell
   * @param span - Number of columns to span
   */
  public withColumnSpan(span: number): TableCell {
    this.columnSpan = span;
    return this;
  }
}
