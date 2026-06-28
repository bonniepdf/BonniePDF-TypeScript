import { Color } from '../../Core/Color';
import { Border } from '../../Core/Border';
import { BorderColors } from '../../Core/BorderColors';
import { IElement } from '../../Elements/IElement';
import { Table } from '../../Elements/Tables/Table';
import { TableRow } from '../../Elements/Tables/TableRow';
import { TextBlock } from '../../Elements/Text/TextBlock';
import { TableRowDescriptor } from './TableRowDescriptor';
import { ContentSlot } from '../ContentSlot';
import { IContentContainer } from '../IContentContainer';

/**
 * Describes a table layout. Provides scoped methods for defining columns, headers, footers, and cells.
 * Maps to a Table element internally.
 */
export class TableDescriptor {
  private _columnWeights: number[] = [1];
  private readonly headerActions: ((desc: TableRowDescriptor) => void)[] = [];
  private readonly footerActions: ((desc: TableRowDescriptor) => void)[] = [];
  private readonly bodyItems: (ContentSlot | RowDefinition | ((desc: TableRowDescriptor) => void))[] = [];

  // Table styling
  private _headerBackgroundColor: Color | undefined;
  private _headerTextColor: Color | undefined;
  private _cellPadding: number = 5;
  private _repeatHeaders: boolean = true;
  private _border: Border = new Border(0);
  private _borderColors: BorderColors | undefined;

  /**
   * Defines the column weights for the table.
   */
  columns(...weights: number[]): void {
    this._columnWeights = weights;
  }

  /**
   * Sets the default cell padding in points.
   */
  cellPadding(padding: number): void {
    this._cellPadding = padding;
  }

  /**
   * Sets whether headers repeat on each page.
   */
  repeatHeaders(repeat: boolean = true): void {
    this._repeatHeaders = repeat;
  }

  /**
   * Sets the header background color.
   */
  headerBackground(color: Color): void {
    this._headerBackgroundColor = color;
  }

  /**
   * Sets the header text color.
   */
  headerTextColor(color: Color): void {
    this._headerTextColor = color;
  }

  /**
   * Sets a uniform border for all cells.
   */
  border(width: number, color?: Color): void {
    this._border = new Border(width);
    this._borderColors = new BorderColors(color ?? Color.black);
  }

  /**
   * Adds a header row to the table.
   */
  header(handler: (desc: TableRowDescriptor) => void): void {
    this.headerActions.push(handler);
  }

  /**
   * Adds a footer row to the table.
   */
  footer(handler: (desc: TableRowDescriptor) => void): void {
    this.footerActions.push(handler);
  }

  /**
   * Adds a full row to the table, with optional background color.
   */
  row(
    handlerOrBackground: ((desc: TableRowDescriptor) => void) | Color,
    handler?: (desc: TableRowDescriptor) => void
  ): void {
    if (typeof handlerOrBackground === 'function') {
      this.bodyItems.push(handlerOrBackground);
    } else {
      this.bodyItems.push(new RowDefinition(handlerOrBackground, handler!));
    }
  }

  /**
   * Returns a container for the next cell.
   */
  cell(): IContentContainer {
    const slot = new ContentSlot();
    this.bodyItems.push(slot);
    return slot;
  }

  /**
   * Builds the Table element from the descriptor configuration.
   */
  build(): Table {
    const table = new Table(...this._columnWeights);
    table.cellPadding = this._cellPadding;
    table.repeatHeadersOnNewPage = this._repeatHeaders;
    table.headerBackgroundColor = this._headerBackgroundColor;
    table.headerTextColor = this._headerTextColor;
    table.border = this._border;
    table.borderColors = this._borderColors;

    // Build header rows
    for (const headerAction of this.headerActions) {
      const rowDesc = new TableRowDescriptor();
      headerAction(rowDesc);
      table.addHeader(rowDesc.build());
    }

    // Build footer rows
    for (const footerAction of this.footerActions) {
      const rowDesc = new TableRowDescriptor();
      footerAction(rowDesc);
      table.addFooter(rowDesc.build());
    }

    // Build data rows from cell slots and explicit rows
    const colCount = this._columnWeights.length;
    const currentSlots: ContentSlot[] = [];

    const flushCells = (): void => {
      if (currentSlots.length === 0) return;

      for (let i = 0; i < currentSlots.length; i += colCount) {
        const cellsInRow: IElement[] = [];
        for (let j = 0; j < colCount && i + j < currentSlots.length; j++) {
          const child = currentSlots[i + j].child;
          if (child) {
            cellsInRow.push(child);
          } else {
            const tb = new TextBlock();
            tb.text = '';
            cellsInRow.push(tb);
          }
        }
        table.addRow(...cellsInRow);
      }
      currentSlots.length = 0;
    };

    for (const item of this.bodyItems) {
      if (item instanceof ContentSlot) {
        currentSlots.push(item);
      } else if (item instanceof RowDefinition) {
        flushCells();
        const rowDesc = new TableRowDescriptor();
        item.handler(rowDesc);
        const row = rowDesc.build();
        row.withBackground(item.background);
        table.addRow(row);
      } else if (typeof item === 'function') {
        flushCells();
        const rowDesc = new TableRowDescriptor();
        item(rowDesc);
        table.addRow(rowDesc.build());
      }
    }

    flushCells();

    return table;
  }
}

class RowDefinition {
  constructor(
    public background: Color,
    public handler: (desc: TableRowDescriptor) => void
  ) {}
}
