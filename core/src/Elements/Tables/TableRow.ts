import { IElement } from '../IElement';
import { IBackgroundColor } from '../Layout/IBackgroundColor';
import { Color } from '../../Core/Color';
import { Thickness } from '../../Core/Thickness';

/**
 * A table row with support for custom styling and background color
 */
export class TableRow implements IElement, IBackgroundColor {
  /** The cells in this row */
  public cells!: TableCell[];

  /** TextBlock color for this row (applied to cells without their own text color) */
  public textColor?: Color;

  /** Custom padding for this row (applied to cells without their own padding) */
  public padding?: Thickness;

  /** Whether this is a header row */
  public isHeader = false;

  /** Whether this is a footer row */
  public isFooter = false;

  /** Minimum height for this row (optional) */
  public minHeight?: number;

  /** Background color for this row (applied to cells without their own background) */
  public backgroundColor?: Color;

  constructor(cells?: TableCell[]) {
    if (cells) {
      this.cells = cells;
    }
  }

  /**
   * Creates a TableRow from an array of IElements.
   * If an element is already a TableCell, it's used directly.
   * Otherwise, it's wrapped in a TableCell.
   */
  public static fromElements(...elements: IElement[]): TableRow {
    return new TableRow(
      elements.map(e => {
        if (e instanceof TableCell) {
          return e;
        }
        const cell = new TableCell();
        cell.content = e;
        return cell;
      })
    );
  }

  /**
   * Creates a TableRow from an array of TableCells
   */
  public static fromCells(...cells: TableCell[]): TableRow {
    const row = new TableRow();
    row.cells = cells;
    return row;
  }

  /**
   * Marks this row as a header row
   */
  public asHeader(): TableRow {
    this.isHeader = true;
    return this;
  }

  /**
   * Marks this row as a footer row
   */
  public asFooter(): TableRow {
    this.isFooter = true;
    return this;
  }

  /**
   * Sets the background color for this row
   */
  public withBackground(color: Color): TableRow {
    this.backgroundColor = color;
    return this;
  }

  /**
   * Sets the text color for this row
   */
  public withTextColor(color: Color): TableRow {
    this.textColor = color;
    return this;
  }

  /**
   * Sets the padding for this row
   */
  public withPadding(padding: number): TableRow {
    this.padding = new Thickness(padding);
    return this;
  }

  /**
   * Sets the padding for this row with individual values
   */
  public withPadding4(left: number, top: number, right: number, bottom: number): TableRow {
    this.padding = new Thickness(left, top, right, bottom);
    return this;
  }

  /**
   * Sets the minimum height for this row
   */
  public withMinHeight(height: number): TableRow {
    this.minHeight = height;
    return this;
  }

  public measureHeight(availableWidth: number): number {
    return 0;
  }
  public getPreferredWidth(): number {
    return 0;
  }
  public render(ctx: any, width: number): void {}
}

import { TableCell } from './TableCell';
