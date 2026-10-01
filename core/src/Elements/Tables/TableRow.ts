import { IElement, RenderContext } from '../IElement';
import { applyOptions } from '../../Core/applyOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { toThickness, type ThicknessInput } from '../../Normalize/toThickness';
import { IBackgroundColor } from '../Layout/IBackgroundColor';
import { Color } from '../../Core/Color';
import { Thickness } from '../../Core/Thickness';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

/**
 * A table row with support for custom styling and background color
 */
/** Settable properties declared by {@link TableRow} itself. */
export const TABLE_ROW_OPTION_KEYS = [
  'cells',
  'color',
  'padding',
  'isHeader',
  'isFooter',
  'minHeight',
  'backgroundColor',
] as const;

type TableRowKey = (typeof TABLE_ROW_OPTION_KEYS)[number];

/** Options for {@link TableRow}. */
export type TableRowOptions = Partial<
  Omit<Pick<TableRow, TableRowKey>, 'color' | 'padding' | 'backgroundColor' | 'minHeight'>
> & {
  /** Minimum row height. Accepts a length: `24`, `'1cm'`, or `{ value, unit }`. */
  minHeight?: LengthInput;
  /** Row text colour. Accepts a palette token or hex. */
  color?: ColorInput;
  /** Row padding. Accepts `12`, `[h, v]`, `[l, t, r, b]` or `{ bottom: 12 }`. */
  padding?: ThicknessInput;
  /** Row fill. Accepts a palette token or hex. */
  backgroundColor?: ColorInput;
};

/** Contains the cells and styling for one table row. */
export class TableRow implements IElement, IBackgroundColor, IRoleProvider {
  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return SemanticRole.TR;
  }

  /** The cells in this row */
  public cells!: TableCell[];

  /** TextBlock color for this row (applied to cells without their own text color) */
  private _textColor?: Color;

  /** Row text colour. Accepts a palette token or hex. */
  public get color(): Color | undefined {
    return this._textColor;
  }
  public set color(value: ColorInput | undefined) {
    this._textColor = value === undefined ? undefined : toColor(value);
  }

  /** Custom padding for this row (applied to cells without their own padding) */
  private _padding?: Thickness;

  /** Row padding. Undefined falls back to the table's `cellPadding`. */
  public get padding(): Thickness | undefined {
    return this._padding;
  }
  public set padding(value: ThicknessInput | undefined) {
    this._padding = value === undefined ? undefined : toThickness(value);
  }

  /** Whether this is a header row */
  public isHeader = false;

  /** Whether this is a footer row */
  public isFooter = false;

  private _minHeight?: number;

  /** Minimum height for this row (optional)
   *
   * Accepts a length: a number of points, `'1cm'`, or `{ value, unit }` (§4A.3).
   */
  public get minHeight(): number | undefined {
    return this._minHeight;
  }
  public set minHeight(value: LengthInput | undefined) {
    this._minHeight = toOptionalLength(value);
  }

  /** Background color for this row (applied to cells without their own background) */
  private _backgroundColor?: Color;

  /** Row fill. Accepts a palette token or hex. */
  public get backgroundColor(): Color | undefined {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput | undefined) {
    this._backgroundColor = value === undefined ? undefined : toColor(value);
  }

  /** Creates a row from its cells. */
  constructor(cells?: TableCell[]);
  /** Creates a row configured in one expression. */
  constructor(options: TableRowOptions);
  constructor(cellsOrOptions?: TableCell[] | TableRowOptions) {
    if (Array.isArray(cellsOrOptions)) {
      this.cells = cellsOrOptions;
    } else if (cellsOrOptions !== undefined) {
      applyOptions(this, cellsOrOptions);
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
  public withColor(color: Color): TableRow {
    this.color = color;
    return this;
  }

  /**
   * Sets the padding for this row: a number (all sides), a `[horizontal, vertical]` pair, or a per-side object.
   */
  public withPadding(padding: ThicknessInput): TableRow {
    this.padding = toThickness(padding);
    return this;
  }

  /**
   * Sets the minimum height for this row
   */
  public withMinHeight(height: number): TableRow {
    this.minHeight = height;
    return this;
  }

  public measureHeight(_availableWidth: number): number {
    return 0;
  }
  public getPreferredWidth(): number {
    return 0;
  }
  public render(_ctx: RenderContext, _width: number): void {}
}

import { TableCell } from './TableCell';
import { toOptionalLength, type LengthInput } from '../../Normalize/toLength';
