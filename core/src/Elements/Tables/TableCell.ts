import { BorderedElementBase } from '../Layout/BorderedElementBase';
import {
  BORDERED_ELEMENT_OPTION_KEYS,
  applyBorderedElementOptions,
  type BorderedElementOptions,
} from '../Layout/BorderedElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { toThickness, type ThicknessInput } from '../../Normalize/toThickness';
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
/** Settable properties declared by {@link TableCell} itself. */
export const TABLE_CELL_OWN_OPTION_KEYS = ['content', 'color', 'padding', 'columnSpan', 'isHeader'] as const;

/** The full settable surface of a cell, bases included. */
export const TABLE_CELL_OPTION_KEYS = [...BORDERED_ELEMENT_OPTION_KEYS, ...TABLE_CELL_OWN_OPTION_KEYS] as const;

type TableCellOwnKey = (typeof TABLE_CELL_OWN_OPTION_KEYS)[number];

/** Options for {@link TableCell}. Intersects {@link BorderedElementOptions}. */
export type TableCellOptions = BorderedElementOptions &
  Partial<Omit<Pick<TableCell, TableCellOwnKey>, 'color' | 'padding'>> & {
    /** Cell text colour. Accepts a palette token or hex. */
    color?: ColorInput;
    /** Cell padding. Accepts `12`, `[h, v]`, `[l, t, r, b]` or `{ bottom: 12 }`. */
    padding?: ThicknessInput;
  };

/** Contains the content and styling for one table cell. */
export class TableCell extends BorderedElementBase implements IRoleProvider {
  /** The content element to display in this cell */
  public content!: IElement;

  /** Creates a cell, optionally configured in one expression. */
  constructor(options?: TableCellOptions) {
    super();
    applyBorderedElementOptions(this, options);
  }

  /** TextBlock color for this cell */
  private _textColor?: Color;

  /** Cell text colour. Accepts a palette token or hex. */
  public get color(): Color | undefined {
    return this._textColor;
  }
  public set color(value: ColorInput | undefined) {
    this._textColor = value === undefined ? undefined : toColor(value);
  }

  /** Custom padding for this cell (overrides table default if set) */
  private _padding?: Thickness;

  /** Cell padding. Undefined falls back to the row, then the table's `cellPadding`. */
  public get padding(): Thickness | undefined {
    return this._padding;
  }
  public set padding(value: ThicknessInput | undefined) {
    this._padding = value === undefined ? undefined : toThickness(value);
  }

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
    ctx.currentY = originalY + totalHeight;
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
  public withColor(color: Color): TableCell {
    this.color = color;
    return this;
  }

  /**
   * Sets the padding for this cell.
   * @param padding - A number (all sides), a `[horizontal, vertical]` pair, or a per-side object
   */
  public withPadding(padding: ThicknessInput): TableCell {
    this.padding = toThickness(padding);
    return this;
  }

  /**
   * Sets the border for this cell.
   * - `withBorder(color, width = 1)`: one colour, the same width on every side
   * - `withBorder(border, color)`: per-side widths, one colour
   * - `withBorder(border, borderColors)`: per-side widths and colours
   */
  public withBorder(color: Color, width?: number): TableCell;
  public withBorder(border: Border, colors: Color | BorderColors): TableCell;
  public withBorder(first: Color | Border, second?: number | Color | BorderColors): TableCell {
    if (first instanceof Border) {
      this.border = first;
      this.borderColors = second instanceof BorderColors ? second : new BorderColors(second as Color);
    } else {
      this.border = new Border(typeof second === 'number' ? second : 1);
      this.borderColors = new BorderColors(first);
    }
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
