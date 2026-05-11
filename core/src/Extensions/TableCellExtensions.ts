import { Color } from '../Core/Color';
import { IElement } from '../Elements/IElement';
import { TableCell } from '../Elements/Tables/TableCell';
import { Thickness } from '../Core/Thickness';
import { Border } from '../Core/Border';
import { BorderColors } from '../Core/BorderColors';



  /**
   * Extension methods for TableCell
   */
  export class TableCellExtensions {
    /**
     * Converts an IElement to a TableCell
     */
    static asCell(e: IElement): TableCell {
      const cell = new TableCell();
      cell.content = e;
      return cell;
    }

    /**
     * Sets the background color for a TableCell
     */
    static background(c: TableCell, color: Color): TableCell {
      c.backgroundColor = color;
      return c;
    }

    /**
     * Sets the text color for a TableCell
     */
    static textColor(c: TableCell, color: Color): TableCell {
      c.textColor = color;
      return c;
    }

    /**
     * Sets the padding for a TableCell
     */
    static padding(c: TableCell, padding: number): TableCell;
    static padding(c: TableCell, left: number, top: number, right: number, bottom: number): TableCell;
    static padding(c: TableCell, arg1: number, arg2?: number, arg3?: number, arg4?: number): TableCell {
      if (arg2 === undefined) {
        c.padding = new Thickness(arg1);
      } else {
        c.padding = new Thickness(arg1, arg2, arg3!, arg4!);
      }
      return c;
    }

    /**
     * Sets the border for a TableCell
     */
    static border(c: TableCell, color: Color, width: number = 1): TableCell {
      c.border = new Border(width);
      c.borderColors = new BorderColors(color);
      return c;
    }

    /**
     * Sets the column span for a TableCell
     */
    static colSpan(c: TableCell, span: number): TableCell {
      c.columnSpan = span;
      return c;
    }
  }

  /**
   * Shortcut functions for TableCellExtensions
   */
  export function asCell(e: IElement): TableCell {
    return TableCellExtensions.asCell(e);
  }

  export function cellBackground(c: TableCell, color: Color): TableCell {
    return TableCellExtensions.background(c, color);
  }

  export function cellTextColor(c: TableCell, color: Color): TableCell {
    return TableCellExtensions.textColor(c, color);
  }

  export function cellPadding(c: TableCell, padding: number): TableCell;
  export function cellPadding(c: TableCell, left: number, top: number, right: number, bottom: number): TableCell;
  export function cellPadding(c: TableCell, arg1: number, arg2?: number, arg3?: number, arg4?: number): TableCell {
    return TableCellExtensions.padding(c, arg1, arg2, arg3, arg4);
  }

  export function cellBorder(c: TableCell, color: Color, width?: number): TableCell {
    return TableCellExtensions.border(c, color, width);
  }

  export function cellColSpan(c: TableCell, span: number): TableCell {
    return TableCellExtensions.colSpan(c, span);
  }
