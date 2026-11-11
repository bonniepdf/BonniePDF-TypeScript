import { BorderedElementBase } from '../Layout/BorderedElementBase';
import {
  BORDERED_ELEMENT_OPTION_KEYS,
  applyBorderedElementOptions,
  type BorderedElementOptions,
} from '../Layout/BorderedElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { IElement, IStatefulElement, RenderStatus, RenderContext } from '../IElement';
import { drawPossiblyOversized } from '../../Rendering/OversizedContent';
import type { StructureElement } from '../../Rendering/Tagging/StructureElement';
import { TableRow } from './TableRow';
import { Container } from '../Layout/Container';
import { PaginationWrapperBase } from '../Layout/Pagination/PaginationWrapperBase';
import type { IBorderFrameHost } from './IBorderFrameHost';
import { Border } from '../../Core/Border';
import { VerticalAlignment } from '../../Core/VerticalAlignment';
import type { BorderColors } from '../../Core/BorderColors';
import { TableCell } from './TableCell';
import { Color } from '../../Core/Color';
import { Thickness } from '../../Core/Thickness';
import { TextBlock } from '../Text/TextBlock';
import type { TextStyle } from '../Text/TextStyle';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole, toPdfTag, isContainerRole } from '../../Rendering/Tagging/SemanticRole';
import { TaggingContext } from '../../Rendering/Tagging/TaggingContext';
import { captureTypeOf, captureNameOf, paintForBackground } from '../../Rendering/LayoutRecorder';
import { beginChildTag, endChildTag, ChildTagToken } from '../../Rendering/Tagging/ChildTagging';
import { toLength, type LengthInput } from '../../Normalize/toLength';
import { formatChartNumber, sumChartNumbers } from '../../Charts/ChartNumberFormat';

/**
 * A table element with support for column weights, cell padding, borders, headers, and footers
 */
/** Settable properties declared by {@link Table} itself. */
export const TABLE_OWN_OPTION_KEYS = [
  'presentation',
  'cellPadding',
  'repeatHeadersOnNewPage',
  'showFootersOnAllPages',
  'runningTotalColumn',
  'carriedForwardLabel',
  'broughtForwardLabel',
  'runningTotalFormat',
  'runningTotalPrefix',
  'headerBackgroundColor',
  'headerTextColor',
  'footerBackgroundColor',
  'footerTextColor',
  'rowBackgroundColor',
  'alternateRowBackgroundColor',
  'rowTextColor',
] as const;

/** The full settable *property* surface of a table, bases included. */
export const TABLE_OPTION_KEYS = [...BORDERED_ELEMENT_OPTION_KEYS, ...TABLE_OWN_OPTION_KEYS] as const;

type TableOwnKey = (typeof TABLE_OWN_OPTION_KEYS)[number];

type TableColorKey =
  | 'headerBackgroundColor'
  | 'headerTextColor'
  | 'footerBackgroundColor'
  | 'footerTextColor'
  | 'rowBackgroundColor'
  | 'alternateRowBackgroundColor'
  | 'rowTextColor';

/**
 * Options for {@link Table}. Intersects {@link BorderedElementOptions}.
 *
 * `columns`, `rows`, `header` and `footer` are synthetic sugar, not properties:
 * column weights are constructor-only (`columnWeights` is private readonly), and
 * rows/header/footer route through `addRow` / `addHeader` / `addFooter`.
 */
export type TableOptions = BorderedElementOptions &
  Partial<Omit<Pick<Table, TableOwnKey>, TableColorKey | 'cellPadding'>> & {
    /** Padding inside every cell. Accepts a length: `5`, `'2mm'`, or `{ value, unit }`. */
    cellPadding?: LengthInput;
    /** Header row fill. Accepts a palette token or hex. */
    headerBackgroundColor?: ColorInput;
    /** Header row text colour. Accepts a palette token or hex. */
    headerTextColor?: ColorInput;
    /** Footer row fill. Accepts a palette token or hex. */
    footerBackgroundColor?: ColorInput;
    /** Footer row text colour. Accepts a palette token or hex. */
    footerTextColor?: ColorInput;
    /** Body row fill. Accepts a palette token or hex. */
    rowBackgroundColor?: ColorInput;
    /** Fill for every second data row. */
    alternateRowBackgroundColor?: ColorInput;
    /** Body row text colour. Accepts a palette token or hex. */
    rowTextColor?: ColorInput;
    /** Relative column weights, e.g. `[1, 2, 1]`. Constructor-only sugar. */
    columns?: number[];
    /** Body rows to add, in order. Sugar over {@link Table.addRow}. */
    rows?: TableRow[];
    /** Header row. Sugar over {@link Table.addHeader}. */
    header?: TableRow;
    /** Footer row. Sugar over {@link Table.addFooter}. */
    footer?: TableRow;
  };

/** Lays out rows and cells with column sizing, headers, footers, borders, and pagination. */
export class Table extends BorderedElementBase implements IRoleProvider, IBorderFrameHost {
  /** A container wrapped directly around a table becomes its frame (see {@link IBorderFrameHost}). */
  public get acceptsBorderFrame(): true {
    return true;
  }

  /**
   * When `true`, the table is a **layout (presentation) table**: it arranges
   * content in a grid with no tabular data relationships. Per ISO 14289-1 §7.5 /
   * Matterhorn checkpoint 15, such a table MUST NOT be tagged with table
   * structure — so it is tagged as a generic `Div` grouping and each cell's
   * content is tagged with its own natural role in row-major reading order (no
   * `Table`/`THead`/`TR`/`TH`/`TD`, and `addHeader`/`isHeader` are ignored for
   * tagging). Visual output is unchanged. Default `false` (a semantic data table).
   *
   * Set this for address blocks, totals boxes, and side-by-side panels; keep it
   * `false` for real tabular data (and mark that data's header cells).
   */
  public presentation = false;

  /**
   * Whether this element tags as a layout grid (a `Div` grouping) rather than a
   * data table. Routed through a protected hook so {@link Grid} can pin it on;
   * defaults to the public {@link presentation} escape hatch.
   */
  protected get isLayoutGrid(): boolean {
    return this.presentation;
  }

  /** The grouping role this table tags under: `Table` for data, `Div` for layout. */
  private get groupRole(): SemanticRole {
    return this.isLayoutGrid ? SemanticRole.Div : SemanticRole.Table;
  }

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this.groupRole;
  }

  private readonly columnWeights: number[];
  private readonly footers: TableRow[] = [];
  private readonly headers: TableRow[] = [];
  // Body rows. A row added as plain content (addRow with elements, none a TableCell) is kept as
  // that content alone: the element for a one-cell row, a copy of the elements otherwise. Its row
  // and cell objects would hold only defaults, and the table made them, so no caller holds them.
  // Layout reads a temporary row with the same values (rowForLayout); reading `rows` or
  // `getAllRows()` replaces compact entries with real rows, which are then kept.
  private readonly _rows: Array<TableRow | IElement | IElement[]> = [];
  // Set once `rows` has handed out the array itself: later rows are stored as real rows, so a
  // caller holding the array never sees a compact entry.
  #rowsExposed = false;

  // State tracking for multipage rendering
  private lastRowRendered = -1;
  private headersPending = true;
  private taggedHeaderEmitted = false;
  /** The running values of the body rows drawn so far, for the carried-forward total. */
  private runningValues: number[] = [];
  /** A page ended with a carried-forward row, so the next page opens with a brought-forward one. */
  private carryPending = false;
  /** The document's default text style, handed over by the style cascade for the rows the table makes itself. */
  private cascadedTextStyle: TextStyle | undefined;

  /**
   * Receives the document's default text style. The running-total rows are built during layout,
   * after the cascade has visited the tree, so the table applies the style to them itself.
   * @internal
   */
  public applyCascadedTextStyle(style: TextStyle): void {
    this.cascadedTextStyle = style;
  }

  /** Creates a table with the given relative column weights, e.g. `new Table(1, 2, 1)`. */
  constructor(...columnWeights: number[]);
  /** Creates a table configured in one expression. */
  constructor(options: TableOptions);
  constructor(...args: number[] | [TableOptions]) {
    super();

    // Dispatch: the rest-param weight form is all-numbers; the sole
    // non-array object argument is the options bag. Everything else is weights.
    const first = args[0];
    const isOptions = args.length === 1 && typeof first === 'object' && first !== null && !Array.isArray(first);

    if (!isOptions) {
      this.columnWeights = args as number[];
      return;
    }

    const { columns, rows, header, footer, ...styleOptions } = first as TableOptions;
    this.columnWeights = columns ?? [];
    applyBorderedElementOptions(this, styleOptions);
    if (header !== undefined) this.addHeader(header);
    if (footer !== undefined) this.addFooter(footer);
    for (const row of rows ?? []) this.addRow(row);
  }

  private _cellPadding: number = 5;

  /**
   * Default padding for all cells
   *
   * Accepts a length: a number of points, `'2mm'`, or `{ value, unit }`.
   */
  public get cellPadding(): number {
    return this._cellPadding;
  }
  public set cellPadding(value: LengthInput) {
    this._cellPadding = toLength(value);
  }
  /**
   * Whether to repeat headers on each new page
   */
  public repeatHeadersOnNewPage = true;
  /**
   * Whether to show footers on each page (only last page if false)
   */
  public showFootersOnAllPages = false;

  /**
   * Turns on a running total: the column (0-based, at least 1) that shows it. When the body breaks
   * across pages, each page that continues ends with a "carried forward" row holding the total of
   * the rows' `runningValue` so far, and the next page opens, after any repeated header, with a
   * "brought forward" row holding the same total. The label spans the columns before this one.
   * Both rows are drawn in the footer colours and left out of the accessibility structure, since
   * they repeat what the rows already say. Unset (the default) turns the feature off.
   */
  public runningTotalColumn?: number;
  /** Label of the row that ends a page that continues. Default `'Carried forward'`. */
  public carriedForwardLabel = 'Carried forward';
  /** Label of the row that opens a continuation page. Default `'Brought forward'`. */
  public broughtForwardLabel = 'Brought forward';
  /** Number format of the running total: `G`, `F<n>`, `N<n>` or `P<n>`, as for charts. Default `'N2'`. */
  public runningTotalFormat = 'N2';
  /** Text written before the running total, such as a currency symbol. Default empty. */
  public runningTotalPrefix = '';
  /**
   * Default background color for header rows
   */
  private _headerBackgroundColor?: Color;

  /** Header row fill. Accepts a palette token or hex. */
  public get headerBackgroundColor(): Color | undefined {
    return this._headerBackgroundColor;
  }
  public set headerBackgroundColor(value: ColorInput | undefined) {
    this._headerBackgroundColor = value === undefined ? undefined : toColor(value);
  }
  /**
   * Default text color for header rows
   */
  private _headerTextColor?: Color;

  /** Header row text colour. Accepts a palette token or hex. */
  public get headerTextColor(): Color | undefined {
    return this._headerTextColor;
  }
  public set headerTextColor(value: ColorInput | undefined) {
    this._headerTextColor = value === undefined ? undefined : toColor(value);
  }
  /**
   * Default background color for footer rows
   */
  private _footerBackgroundColor?: Color;

  /** Footer row fill. Accepts a palette token or hex. */
  public get footerBackgroundColor(): Color | undefined {
    return this._footerBackgroundColor;
  }
  public set footerBackgroundColor(value: ColorInput | undefined) {
    this._footerBackgroundColor = value === undefined ? undefined : toColor(value);
  }
  /**
   * Default text color for footer rows
   */
  private _footerTextColor?: Color;

  /** Footer row text colour. Accepts a palette token or hex. */
  public get footerTextColor(): Color | undefined {
    return this._footerTextColor;
  }
  public set footerTextColor(value: ColorInput | undefined) {
    this._footerTextColor = value === undefined ? undefined : toColor(value);
  }
  /**
   * Default background color for data rows
   */
  private _alternateRowBackgroundColor?: Color;

  /** Fill for every second data row. Explicit row and cell fills take precedence. */
  public get alternateRowBackgroundColor(): Color | undefined {
    return this._alternateRowBackgroundColor;
  }
  public set alternateRowBackgroundColor(value: ColorInput | undefined) {
    this._alternateRowBackgroundColor = value === undefined ? undefined : toColor(value);
  }

  private _rowBackgroundColor?: Color;

  /** Body row fill. Accepts a palette token or hex. */
  public get rowBackgroundColor(): Color | undefined {
    return this._rowBackgroundColor;
  }
  public set rowBackgroundColor(value: ColorInput | undefined) {
    this._rowBackgroundColor = value === undefined ? undefined : toColor(value);
  }
  /**
   * Default background color for data rows
   */
  private _rowTextColor?: Color;

  /** Body row text colour. Accepts a palette token or hex. */
  public get rowTextColor(): Color | undefined {
    return this._rowTextColor;
  }
  public set rowTextColor(value: ColorInput | undefined) {
    this._rowTextColor = value === undefined ? undefined : toColor(value);
  }

  /**
   * Adds a header row to the table.
   *
   * @example
   * ```ts
   * table.addHeader(new TextBlock('Item'), new TextBlock('Qty'), new TextBlock('Price'));
   * ```
   */
  public addHeader(...elements: Array<IElement | string>): void;
  public addHeader(cells: Array<TableCell | string>): void;
  public addHeader(row: TableRow): void;
  public addHeader(...input: Array<IElement | string | Array<TableCell | string> | TableRow>): void {
    const args = this.normaliseRowArgs(input);
    const row = this.createRowFromArgs(args);
    row.isHeader = true;
    // Propagate to cells so each cell's PDF/UA role resolves to TH.
    for (const c of row.cells) c.isHeader = true;
    this.headers.push(row);
  }

  /**
   * Adds a footer row to the table.
   *
   * @example
   * ```ts
   * table.addFooter(new TextBlock('Total'), new TextBlock('4'), new TextBlock('£48.00'));
   * ```
   */
  public addFooter(...elements: Array<IElement | string>): void;
  public addFooter(cells: Array<TableCell | string>): void;
  public addFooter(row: TableRow): void;
  public addFooter(...input: Array<IElement | string | Array<TableCell | string> | TableRow>): void {
    const args = this.normaliseRowArgs(input);
    const row = this.createRowFromArgs(args);
    row.isFooter = true;
    this.footers.push(row);
  }

  /**
   * Adds a data row to the table.
   *
   * @example
   * ```ts
   * table.addRow(new TextBlock('Widget'), new TextBlock('4'), new TextBlock('£12.00'));
   * ```
   */
  public addRow(...elements: Array<IElement | string>): void;
  public addRow(cells: Array<TableCell | string>): void;
  public addRow(row: TableRow): void;
  public addRow(...input: Array<IElement | string | Array<TableCell | string> | TableRow>): void {
    const args = this.normaliseRowArgs(input);
    if (!this.#rowsExposed && isPlainContent(args)) {
      const contents = args as IElement[];
      // A single null content stays in an array, so it is not mistaken for a null row.
      this._rows.push(contents.length === 1 && contents[0] != null ? contents[0] : contents.slice());
      return;
    }
    const row = this.createRowFromArgs(args);
    this._rows.push(row);
  }

  /** Body row `index` as a real row, replacing a compact entry with it (and keeping it). */
  private materialiseRow(index: number): TableRow {
    const entry = this._rows[index];
    if (entry instanceof TableRow || entry == null) return entry as TableRow;
    const row = buildRow(entry);
    this._rows[index] = row;
    return row;
  }

  /** Body row `index` for measuring and drawing: the stored row, or a temporary equal to it. */
  /**
   * With `reuse`, a compact entry is loaded into one scratch row the table keeps, valid until
   * the next call: for a caller that is done with each row before reading the next and keeps no
   * reference to it (a layout recorder keys its nodes by row and cell, so recording passes false).
   */
  private rowForLayout(index: number, reuse = false): TableRow {
    const entry = this._rows[index];
    if (entry instanceof TableRow || entry == null) return entry as TableRow;
    if (!reuse) return buildRow(entry);
    const count = Array.isArray(entry) ? entry.length : 1;
    if (this.#scratch?.cells.length !== count) this.#scratch = TableRow.fromElements(...new Array<IElement>(count));
    const cells = this.#scratch.cells;
    if (Array.isArray(entry)) for (let i = 0; i < count; i++) cells[i].content = entry[i];
    else cells[0].content = entry;
    return this.#scratch;
  }

  // The scratch row rowForLayout fills; its cells are never changed except for their content.
  #scratch: TableRow | undefined;

  /**
   * @internal The rows that exist as objects (headers, body rows that have been materialised,
   * footers), for the serializer's tree walk. Compact body rows have only default cells, whose
   * contents {@link getChildren} already yields.
   */
  public walkRows(): readonly TableRow[] {
    return [
      ...this.headers,
      ...this._rows.filter((entry): entry is TableRow => entry instanceof TableRow),
      ...this.footers,
    ];
  }

  private normaliseRowArgs(
    input: Array<IElement | string | Array<TableCell | string> | TableRow>
  ): Array<IElement | TableCell[] | TableRow> {
    return input.map(value => {
      if (value == null) throw new TypeError('Cell content cannot be null.');
      if (typeof value === 'string') return new TextBlock(value);
      if (Array.isArray(value))
        return value.map(cell => {
          if (cell == null) throw new TypeError('Cell content cannot be null.');
          return typeof cell === 'string' ? new TableCell({ content: new TextBlock(cell) }) : cell;
        });
      return value;
    });
  }

  private createRowFromArgs(args: Array<IElement | TableCell[] | TableRow>): TableRow {
    if (args.length === 1) {
      const first = args[0];
      if (first instanceof TableRow) {
        return first;
      }
      if (Array.isArray(first) && first.every(cell => cell instanceof TableCell)) {
        return TableRow.fromCells(...first);
      }
    }

    return TableRow.fromElements(...(args as IElement[]));
  }

  /** The body rows, in order: not the header or footer rows (see {@link getAllRows}). Add rows with {@link addRow}. */
  public get rows(): ReadonlyArray<TableRow> {
    for (let i = 0; i < this._rows.length; i++) this.materialiseRow(i);
    this.#rowsExposed = true;
    return this._rows as TableRow[];
  }

  /** Returns all rows (headers + data rows + footers) for tree-walking. */
  public getAllRows(): ReadonlyArray<TableRow> {
    for (let i = 0; i < this._rows.length; i++) this.materialiseRow(i);
    return [...this.headers, ...(this._rows as TableRow[]), ...this.footers];
  }

  /** @inheritdoc - every cell's content across headers, body rows, and footers. */
  public getChildren(): readonly IElement[] {
    // Read without materialising compact body rows.
    const children: IElement[] = [];
    const addCells = (row: TableRow): void => {
      for (const cell of row.cells) {
        if (cell?.content) children.push(cell.content);
      }
    };
    for (const row of this.headers) addCells(row);
    for (const entry of this._rows) {
      if (entry instanceof TableRow || entry == null) {
        if (entry) addCells(entry);
      } else if (Array.isArray(entry)) {
        for (const content of entry) if (content) children.push(content);
      } else children.push(entry);
    }
    for (const row of this.footers) addCells(row);
    return children;
  }

  /**
   * Renders this table with state tracking for pagination.
   * Rows that don't fit on the current page will be continued on the next page.
   * Headers repeat on each continuation page if repeatHeadersOnNewPage is true.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    // Apply top margin only on first render
    if (this.lastRowRendered < 0 && this.headersPending) {
      ctx.currentY += this.margin.top;
    }
    const originalX = ctx.currentX;
    ctx.currentX += this.margin.left;

    const tagging = ctx.tagging;
    // Guarantee a Table ancestor for the row-groups. The pipeline/stack opens
    // the Table for the first fragment, but a continuation fragment after a
    // page break re-enters with only the page/Document open - so open a Table
    // here when one isn't already current (PDF/UA 7.2). Guard avoids
    // double-wrapping the common (already-wrapped) case. A paginated table can
    // yield one Table per page fragment, which is structurally valid.
    const ownTable = tagging != null && tagging.tree.current.role !== this.groupRole;
    if (ownTable) tagging!.tree.begin(this.groupRole);
    try {
      return this.renderStatefulRows(ctx, width, tagging);
    } finally {
      // Each call draws one page's fragment: the last row's bottom edges belong to this page.
      this.flushBottomEdges(ctx);
      ctx.currentX = originalX;
      if (ownTable) tagging!.tree.end();
    }
  }

  private renderStatefulRows(ctx: RenderContext, width: number, tagging: TaggingContext | undefined): RenderStatus {
    const contentWidth = this.getContentWidth(width);
    const widths = this.paginatedColumnWidths(contentWidth);
    // Layout (presentation) tables emit no TR/TH/TD and therefore no row-groups.
    const groupTagging = tagging != null && !this.isLayoutGrid;
    // PDF/UA 7.2: rows must sit inside a THead/TBody/TFoot row-group. Groups are
    // opened lazily (only once a row actually renders, so no empty groups) and
    // closed before every return so the structure tree stays balanced across
    // pagination.

    // Render headers if pending
    if (this.headersPending) {
      let rowGroupOpen = false;
      const headerGroupRole = this.taggedHeaderEmitted ? SemanticRole.TBody : SemanticRole.THead;
      for (const headerRow of this.headers) {
        const headerHeight = this.measureRowHeight(headerRow, widths);

        if (ctx.currentY + headerHeight > ctx.maxY && ctx.currentY > ctx.contentTop) {
          if (rowGroupOpen && groupTagging) tagging!.tree.end();
          return this.lastRowRendered < 0 ? RenderStatus.WrapRequired : RenderStatus.Overflow;
        }

        if (!rowGroupOpen && groupTagging) {
          tagging!.tree.begin(headerGroupRole);
          rowGroupOpen = true;
        }
        drawPossiblyOversized(ctx, headerRow, headerHeight, () => this.renderRowDirect(ctx, headerRow, widths));
      }

      if (rowGroupOpen && groupTagging) tagging!.tree.end();
      if (groupTagging && !this.taggedHeaderEmitted) this.taggedHeaderEmitted = true;
      this.headersPending = false;
    }

    // Start from the next unrendered row
    const startRow = this.lastRowRendered + 1;

    if (startRow >= this._rows.length) {
      this.renderFootersGrouped(ctx, widths, tagging);
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    // Render data rows
    let tbodyOpen = false;
    const running = this.runningTotalColumn !== undefined;
    // The first row drawn here starts a page of the table when nothing of the table is above it on the page.
    const tableAtPageTop = ctx.currentY <= ctx.contentTop + (startRow === 0 ? this.margin.top : 0) + 0.01;
    for (let i = startRow; i < this._rows.length; i++) {
      // A row taller than a page continues from where its previous fragment stopped (spec 02 §4.2).
      if (this._split?.index === i) {
        if (groupTagging && !tbodyOpen && this._split.tbody) {
          tagging!.tree.resume(this._split.tbody);
          tbodyOpen = true;
        }
        const splitRow = this._split.row;
        const status = this.renderSplitFragment(ctx, widths, i);
        if (status === RenderStatus.Complete) {
          if (running) this.runningValues.push(splitRow.runningValue ?? 0);
          this.lastRowRendered = i;
          continue;
        }
        if (tbodyOpen && groupTagging) tagging!.tree.end();
        this.lastRowRendered = i - 1;
        this.headersPending = this.repeatHeadersOnNewPage && this.headers.length > 0;
        return status === RenderStatus.WrapRequired && i === startRow
          ? RenderStatus.WrapRequired
          : RenderStatus.Overflow;
      }

      const row = this.rowForLayout(i, ctx.layoutRecorder === undefined);
      const rowHeight = this.measureRowHeight(row, widths);
      // A running total opens a continuation page with a brought-forward row, and needs room after
      // every row but the last for the carried-forward row that may end the page.
      const broughtForward = running && this.carryPending ? this.runningRow(this.broughtForwardLabel) : undefined;
      const broughtForwardHeight = broughtForward ? this.measureRowHeight(broughtForward, widths) : 0;
      const carryHeight =
        running && i < this._rows.length - 1
          ? this.measureRowHeight(this.runningRow(this.carriedForwardLabel), widths)
          : 0;

      // A row taller than the space an empty page leaves for it splits instead of moving (spec 02 §4.2). It
      // moves first when content in it that cannot split would be cut here but fits on the next page.
      const fitsHere = ctx.currentY + broughtForwardHeight + rowHeight + carryHeight <= ctx.maxY;
      if (!fitsHere && rowHeight > this.freshPageSpace(ctx, widths, running) + 0.001) {
        const firstOnPage = i === startRow && tableAtPageTop;
        if (firstOnPage || !this.unsplittableCellOverruns(ctx, row, widths, broughtForwardHeight)) {
          if (broughtForward) {
            this.renderRowDirect(ctx, broughtForward, widths, true);
            this.carryPending = false;
          }
          if (!tbodyOpen && groupTagging) {
            tagging!.tree.begin(SemanticRole.TBody);
            tbodyOpen = true;
          }
          const stable = this.materialiseRow(i);
          this._split = {
            index: i,
            row: stable,
            fragments: 0,
            contents: stable.cells.map(cell => this.effectiveCellContent(cell, stable)),
            done: stable.cells.map(() => false),
            tbody: groupTagging ? tagging!.tree.current : undefined,
            tr: undefined,
            cells: [],
          };
          i--; // draw its first fragment through the continuation branch above
          continue;
        }
      }

      // Pagination check
      if (ctx.currentY + broughtForwardHeight + rowHeight + carryHeight > ctx.maxY && ctx.currentY > ctx.contentTop) {
        if (tbodyOpen && groupTagging) tagging!.tree.end();
        if (running && i > startRow) {
          this.renderRowDirect(ctx, this.runningRow(this.carriedForwardLabel), widths, true);
          this.carryPending = true;
        }
        this.lastRowRendered = i - 1;
        this.headersPending = this.repeatHeadersOnNewPage && this.headers.length > 0;
        return i === startRow ? RenderStatus.WrapRequired : RenderStatus.Overflow;
      }
      if (broughtForward) {
        this.renderRowDirect(ctx, broughtForward, widths, true);
        this.carryPending = false;
      }
      if (!tbodyOpen && groupTagging) {
        tagging!.tree.begin(SemanticRole.TBody);
        tbodyOpen = true;
      }
      this.renderRowDirect(ctx, row, widths, false, i);
      if (running) this.runningValues.push(row.runningValue ?? 0);
      this.lastRowRendered = i;
    }
    if (tbodyOpen && groupTagging) tagging!.tree.end();

    this.renderFootersGrouped(ctx, widths, tagging);
    ctx.currentY += this.margin.bottom;
    this.lastRowRendered = this._rows.length - 1;
    return RenderStatus.Complete;
  }

  /** Renders footer rows wrapped in a TFoot row-group (PDF/UA 7.2). */
  private renderFootersGrouped(ctx: RenderContext, widths: number[], tagging: TaggingContext | undefined): void {
    if (this.footers.length === 0) return;
    const groupTagging = tagging != null && !this.isLayoutGrid;
    if (groupTagging) tagging!.tree.begin(SemanticRole.TFoot);
    for (const footerRow of this.footers) {
      this.renderRowDirect(ctx, footerRow, widths);
    }
    if (groupTagging) tagging!.tree.end();
  }

  /**
   * Resets the internal state, preparing the table for a fresh render.
   */
  public resetState(): void {
    if (this._split) for (const content of this._split.contents) (content as Partial<IStatefulElement>).resetState?.();
    this._split = undefined;
    this.lastRowRendered = -1;
    this.headersPending = true;
    this.runningValues = [];
    this.carryPending = false;
    this.taggedHeaderEmitted = false;
    this._bottomsAbove = undefined;
    this._edgePlan.clear();
    this._pendingBottoms = [];
    this._paginatedWidths = undefined;
  }

  // --- Border collapse ---
  //
  // Two adjacent cells share an edge: the right edge of the left cell is the left edge of the right cell, and
  // the bottom edge of a cell is the top edge of the cell below it. Each shared edge is drawn once. The cell
  // earlier in reading order (the left one, the upper one) always draws it; the later cell draws it only when
  // its own border is more prominent, and so paints over the earlier one: the wider line wins, then the
  // darker, and a tie goes to the earlier cell.

  // Each cell's planned shared edges: DRAW_LEFT and DRAW_TOP bits.
  private readonly _edgePlan = new Map<TableCell, number>();

  // The bottom edges of the row last drawn, held until the next row's fills are down (see paintCellFill).
  private _pendingBottoms: { x: number; y: number; width: number; lineWidth: number; color: Color }[] = [];
  private _pendingBottomsPage = -1;

  // The bottom edge of each column in the row above, on the page being drawn; undefined when there is none.
  private _bottomsAbove: { width: number; color: Color | undefined }[] | undefined = undefined;
  private _bottomsAbovePage = -1;

  // A cell that sets any border of its own uses it; every other cell takes the table's. (A cell's border is
  // never undefined, so falling back only when it is unset would never use the table's at all.)
  private edgesOf(cell: TableCell): { border: Border; colors: BorderColors } {
    return cell.border.hasAnyBorder
      ? { border: cell.border, colors: cell.borderColors }
      : { border: this.border, colors: this.borderColors };
  }

  /** The width a side actually draws at: nothing when it has no colour. */
  private static drawn(width: number, color: Color | undefined): number {
    return color ? width : 0;
  }

  private static luminance(c: Color): number {
    return 0.2126 * c.R + 0.7152 * c.G + 0.0722 * c.B;
  }

  /** True when the first edge is strictly more prominent than the second. */
  private static outranks(
    widthA: number,
    colorA: Color | undefined,
    widthB: number,
    colorB: Color | undefined
  ): boolean {
    const a = Table.drawn(widthA, colorA);
    const b = Table.drawn(widthB, colorB);
    if (a !== b) return a > b;
    if (a === 0 || !colorA || !colorB) return false;
    return Table.luminance(colorA) < Table.luminance(colorB);
  }

  private planRowEdges(ctx: RenderContext, row: TableRow): void {
    this._edgePlan.clear();
    const above =
      this._bottomsAbove !== undefined && this._bottomsAbovePage === ctx.currentPageIndex
        ? this._bottomsAbove
        : undefined;

    // Read each cell's edges straight from its owner (see edgesOf) rather than through a pair.
    let previousBorder: Border | undefined;
    let previousColors: BorderColors | undefined;
    let col = 0;
    for (const cell of row.cells) {
      const own = cell.border.hasAnyBorder;
      const border = own ? cell.border : this.border;
      const colors = own ? cell.borderColors : this.borderColors;
      const span = Math.max(1, cell.columnSpan);

      const drawLeft =
        previousBorder === undefined ||
        Table.outranks(border.left, colors.left, previousBorder.right, previousColors!.right);

      let drawTop = true;
      if (above) {
        // Against the most prominent bottom edge among the columns this cell covers.
        let strongestWidth = 0;
        let strongestColor: Color | undefined;
        for (let j = 0; j < span && col + j < above.length; j++) {
          const edge = above[col + j];
          if (Table.outranks(edge.width, edge.color, strongestWidth, strongestColor)) {
            strongestWidth = edge.width;
            strongestColor = edge.color;
          }
        }

        drawTop = Table.outranks(border.top, colors.top, strongestWidth, strongestColor);
      }

      this._edgePlan.set(cell, (drawLeft ? DRAW_LEFT : 0) | (drawTop ? DRAW_TOP : 0));
      previousBorder = border;
      previousColors = colors;
      col += span;
    }
  }

  private recordRowBottoms(ctx: RenderContext, row: TableRow, widths: number[]): void {
    // The row above's edges are read only while planning this row, so they are refilled in place.
    let bottoms = this._bottomsAbove;
    if (bottoms?.length !== widths.length) bottoms = widths.map(() => ({ width: 0, color: undefined }));
    else
      for (const edge of bottoms) {
        edge.width = 0;
        edge.color = undefined;
      }
    let col = 0;
    for (const cell of row.cells) {
      const colors = cell.border.hasAnyBorder ? cell.borderColors : this.borderColors;
      const bottom = (cell.border.hasAnyBorder ? cell.border : this.border).bottom;
      const span = Math.max(1, cell.columnSpan);
      for (let j = 0; j < span && col + j < bottoms.length; j++) {
        bottoms[col + j].width = Table.drawn(bottom, colors.bottom);
        bottoms[col + j].color = colors.bottom;
      }

      col += span;
    }

    this._bottomsAbove = bottoms;
    this._bottomsAbovePage = ctx.currentPageIndex;
  }

  /** @internal */
  public override minimumStartHeight(width: number): number {
    if (!this.breakAllowed || this._rows.length === 0) return this.measureHeight(width);
    const widths = this.calculateColumnWidths(this.getContentWidth(width));
    let height = this.margin.top;
    for (const header of this.headers) height += this.measureRowHeight(header, widths);
    height += this.measureRowHeight(this.rowForLayout(0, true), widths);
    if (this.runningTotalColumn !== undefined && this._rows.length > 1) {
      height += this.measureRowHeight(this.runningRow(this.carriedForwardLabel), widths);
    }
    return height;
  }

  protected override measureContentHeight(contentWidth: number): number {
    const widths = this.calculateColumnWidths(contentWidth);
    let totalHeight = 0;

    // Headers
    for (const row of this.headers) {
      totalHeight += this.measureRowHeight(row, widths);
    }

    // Data rows
    for (let i = 0; i < this._rows.length; i++) {
      totalHeight += this.measureRowHeight(this.rowForLayout(i, true), widths);
    }

    // Footers
    for (const row of this.footers) {
      totalHeight += this.measureRowHeight(row, widths);
    }

    return totalHeight;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const tagging = ctx.tagging;
    // Some hosts (e.g. VerticalStack) already open a Table struct element for
    // role-providing children before calling render. Only open our own when one
    // isn't already current, so the THead/TBody/TFoot groups get exactly one
    // Table ancestor (PDF/UA 7.2) instead of Table-in-Table.
    const ownTable = tagging != null && tagging.tree.current.role !== this.groupRole;
    if (ownTable) tagging!.tree.begin(this.groupRole);
    try {
      this.renderContentRows(ctx, contentWidth);
    } finally {
      this.flushBottomEdges(ctx);
      if (ownTable) tagging!.tree.end();
    }
  }

  private renderContentRows(ctx: RenderContext, contentWidth: number): void {
    const widths = this.calculateColumnWidths(contentWidth);
    let isFirstPage = true;
    let headersAddedOnNewPage = false;
    const tagging = ctx.tagging;
    // Layout (presentation) tables emit no TR/TH/TD, so they need no
    // THead/TBody/TFoot row-groups either — content is tagged in reading order.
    const groupTagging = tagging != null && !this.isLayoutGrid;

    // Render headers - grouped under a THead structure element so the rows
    // satisfy PDF/UA 7.2 (TR must live in Table/THead/TBody/TFoot).
    if (this.headers.length > 0) {
      if (groupTagging) tagging!.tree.begin(SemanticRole.THead);
      try {
        for (const row of this.headers) {
          this.renderRow(ctx, row, widths, isFirstPage && !headersAddedOnNewPage);
        }
      } finally {
        if (groupTagging) tagging!.tree.end();
      }
    }

    // Render data rows - grouped under TBody.
    if (this._rows.length > 0) {
      if (groupTagging) tagging!.tree.begin(SemanticRole.TBody);
      try {
        for (let i = 0; i < this._rows.length; i++) {
          const row = this.rowForLayout(i, ctx.layoutRecorder === undefined);
          const rowHeight = this.measureRowHeight(row, widths);

          // Pagination check
          if (ctx.currentY + rowHeight > ctx.maxY && ctx.currentY > ctx.contentTop) {
            this.flushBottomEdges(ctx);
            ctx.newPage();
            isFirstPage = false;

            // Repeat headers on new page if enabled
            if (this.repeatHeadersOnNewPage && this.headers.length > 0) {
              headersAddedOnNewPage = true;
              for (const headerRow of this.headers) {
                this.renderRow(ctx, headerRow, widths, false);
              }
            }
          }

          this.renderRow(ctx, row, widths, isFirstPage && !headersAddedOnNewPage, i);
        }
      } finally {
        if (groupTagging) tagging!.tree.end();
      }
    }

    // Render footers - grouped under TFoot.
    if (this.footers.length > 0) {
      if (groupTagging) tagging!.tree.begin(SemanticRole.TFoot);
      try {
        for (const row of this.footers) {
          this.renderRow(ctx, row, widths, isFirstPage);
        }
      } finally {
        if (groupTagging) tagging!.tree.end();
      }
    }
  }

  /**
   * Records the row + per-cell nodes into the layout snapshot so the structure
   * and compliance views see the real `Table → TableRow → TableCell` (TR/TH/TD)
   * hierarchy — mirroring what the tagging pipeline writes to the PDF structure
   * tree. A no-op without a recorder, so PDF/SVG output is unchanged. The cell's
   * intrinsic `semanticRole` (TH/TD) is read by the recorder's a11y capture, so a
   * table with header cells is correctly seen as having headers. Returns a
   * `finish(cell?)` closure to call after a cell renders and after the row loop.
   */
  private captureRow(
    ctx: RenderContext,
    row: TableRow,
    rowX: number,
    rowY: number,
    rowWidth: number,
    rowHeight: number
  ): { openCell(cell: TableCell, x: number, width: number): void; closeCell(cell: TableCell): void; closeRow(): void } {
    // Presentation tables emit no TR/TH/TD structure, so we don't record row/cell
    // nodes either — the cell *contents* (tagged in reading order) nest directly
    // under the table's Div node, mirroring the structure tree.
    const rec = this.isLayoutGrid ? undefined : ctx.layoutRecorder;
    // Without a recorder (every PDF save), share no-op callbacks instead of allocating three per row.
    if (!rec) return noRowCapture;
    const page = ctx.currentPageIndex;
    const endY = rowY + rowHeight;
    rec.openNode(row, captureTypeOf(row), captureNameOf(row), page, rowX, rowY, rowWidth);
    return {
      openCell: (cell, x, width) => rec.openNode(cell, captureTypeOf(cell), captureNameOf(cell), page, x, rowY, width),
      closeCell: cell => rec.closeNode(cell, page, endY, true),
      closeRow: () => rec.closeNode(row, page, endY, true),
    };
  }

  private renderRow(ctx: RenderContext, row: TableRow, widths: number[], _isFirstPage: boolean, dataIndex = 0): void {
    const rowHeight = this.measureRowHeight(row, widths);

    // Pagination check
    if (ctx.currentY + rowHeight > ctx.maxY && ctx.currentY > ctx.contentTop) {
      this.flushBottomEdges(ctx);
      ctx.newPage();
    }
    this.renderRowDirect(ctx, row, widths, false, dataIndex);
  }

  /**
   * The container that is the cell's own content, looking through the wrappers that only pass a child
   * along (the pagination primitives), or `undefined` when the content is anything else.
   */
  private static stretchableContainer(content: IElement): Container | undefined {
    let current: IElement = content;
    for (;;) {
      if (current instanceof Container) return current;
      if (current instanceof PaginationWrapperBase && current.child) {
        current = current.child;
        continue;
      }
      return undefined;
    }
  }

  private renderCell(
    ctx: RenderContext,
    cell: TableCell,
    row: TableRow,
    x: number,
    width: number,
    rowHeight: number,
    dataIndex: number
  ): void {
    // The fill cascade is the only place a cell's effective fill is known — the
    // cell element itself carries no `backgroundColor` when the colour came from
    // the row or the table. Hand it to the recorder so the contrast rules measure
    // the cell's text against its real backdrop rather than against the page.
    const bgColor = this.cellFill(cell, row, dataIndex);
    if (bgColor) ctx.layoutRecorder?.annotatePaint(cell, paintForBackground(bgColor));

    // Determine effective styling (cell > row > table defaults)
    const textColor =
      cell.color ??
      row.color ??
      (row.isHeader ? this.headerTextColor : undefined) ??
      (row.isFooter ? this.footerTextColor : undefined) ??
      this.rowTextColor;

    const padding = cell.padding ?? row.padding ?? new Thickness(this.cellPadding);
    const content = this.effectiveCellContent(cell, row, textColor);

    // Render content with padding
    const originalX = ctx.currentX;
    const yBeforeCell = ctx.currentY;
    ctx.currentX = x + padding.left;
    ctx.currentY += padding.top;

    const contentWidth = width - padding.left - padding.right;
    const innerHeight = rowHeight - padding.top - padding.bottom;
    const alignment = cell.verticalAlignment;
    if (alignment === VerticalAlignment.Center || alignment === VerticalAlignment.End) {
      const slack = Math.max(0, innerHeight - content.measureHeight(contentWidth));
      ctx.currentY += alignment === VerticalAlignment.Center ? slack / 2 : slack;
    } else {
      ctx.cellStretchTarget = Table.stretchableContainer(content);
      ctx.cellStretchHeight = innerHeight;
    }
    try {
      content.render(ctx, contentWidth);
    } finally {
      ctx.cellStretchTarget = undefined;
    }

    // Restore X and Y positions
    ctx.currentX = originalX;
    ctx.currentY = yBeforeCell;
  }

  /** A cell's content as drawn: a TextBlock takes the colour the cascade gives it, on a copy. */
  private effectiveCellContent(
    cell: TableCell,
    row: TableRow,
    textColor: Color | undefined = this.effectiveTextColor(cell, row)
  ): IElement {
    const content = cell.content;
    if (!textColor || !(content instanceof TextBlock)) return content;
    const tb = new TextBlock();
    tb.text = content.text;
    tb.fontName = content.fontName;
    tb.fontSize = content.fontSize;
    tb.color = textColor;
    if (content.alignmentIsExplicit) tb.alignment = content.alignment;
    tb.contentDirection = content.effectiveContentDirection;
    return tb;
  }

  /** A cell's effective text colour: cell, then row, then the table's header, footer or row default. */
  private effectiveTextColor(cell: TableCell, row: TableRow): Color | undefined {
    return (
      cell.color ??
      row.color ??
      (row.isHeader ? this.headerTextColor : undefined) ??
      (row.isFooter ? this.footerTextColor : undefined) ??
      this.rowTextColor
    );
  }

  /** Height left on an empty page for a body row, after the repeated headers and any running-total rows. */
  private freshPageSpace(ctx: RenderContext, widths: number[], running: boolean): number {
    let reserved = 0;
    if (this.repeatHeadersOnNewPage)
      for (const header of this.headers) reserved += this.measureRowHeight(header, widths);
    if (running) {
      reserved += this.measureRowHeight(this.runningRow(this.broughtForwardLabel), widths);
      reserved += this.measureRowHeight(this.runningRow(this.carriedForwardLabel), widths);
    }
    return ctx.contentHeight - reserved;
  }

  /** Whether a cell's content that cannot split would run past the bottom of this page. */
  private unsplittableCellOverruns(ctx: RenderContext, row: TableRow, widths: number[], above: number): boolean {
    const columns = this.cellColumns(row, widths, 0);
    for (let i = 0; i < row.cells.length; i++) {
      const cell = row.cells[i];
      if (splitsAcrossPages(cell.content)) continue;
      const padding = cell.padding ?? row.padding ?? new Thickness(this.cellPadding);
      const height = cell.content.measureHeight(columns.width[i] - padding.left - padding.right) + padding.top;
      if (ctx.currentY + above + height > ctx.maxY) return true;
    }
    return false;
  }

  /** Each cell's left edge and width. A cell spanning columns takes their combined width. */
  private cellColumns(row: TableRow, widths: number[], startX: number): { x: number[]; width: number[] } {
    const rowWidth = sumWidths(widths);
    const x: number[] = [];
    const width: number[] = [];
    let currentX = startX + (this.isRightToLeft ? rowWidth : 0);
    let col = 0;
    for (const cell of row.cells) {
      const span = Math.max(1, cell.columnSpan);
      let colWidth = 0;
      for (let j = 0; j < span && col + j < widths.length; j++) colWidth += widths[col + j];
      if (this.isRightToLeft) currentX -= colWidth;
      x.push(currentX);
      width.push(colWidth);
      if (!this.isRightToLeft) currentX += colWidth;
      col += span;
    }
    return { x, width };
  }

  /** A body row taller than a page, while it is drawn in fragments (spec 02 §4.2). */
  private _split: SplitRowState | undefined;

  /**
   * Draws the next page's fragment of a split row: every unfinished cell from the same top, content that can
   * split continuing where it stopped and content that cannot drawn once, in the first fragment. Fills cover the
   * fragment and are painted behind the content; the top edges are drawn on the first fragment and the bottom
   * edges on the last.
   */
  private renderSplitFragment(ctx: RenderContext, widths: number[], dataIndex: number): RenderStatus {
    const split = this._split!;
    const row = split.row;
    const first = split.fragments === 0;
    const startX = ctx.currentX;
    const top = ctx.currentY;
    const columns = this.cellColumns(row, widths, startX);
    const rowWidth = sumWidths(widths);
    if (first) this.planRowEdges(ctx, row);

    const tagging = ctx.tagging;
    const dataTagging = tagging != null && !this.isLayoutGrid;
    const presTagging = tagging != null && this.isLayoutGrid;
    const canvas = ctx.canvas;
    const page = ctx.currentPageIndex;
    const mark = canvas.streamLength?.();
    const rec = this.isLayoutGrid ? undefined : ctx.layoutRecorder;

    if (dataTagging) {
      if (split.tr) tagging!.tree.resume(split.tr);
      else split.tr = tagging!.tree.begin(SemanticRole.TR);
      canvas.beginContainerContent('TR');
    }
    rec?.openNode(row, captureTypeOf(row), captureNameOf(row), page, startX, top, rowWidth);

    let bottom = top;
    let progress = false;
    let allDone = true;
    try {
      for (let i = 0; i < row.cells.length; i++) {
        if (split.done[i]) continue;
        const cell = row.cells[i];
        const padding = cell.padding ?? row.padding ?? new Thickness(this.cellPadding);
        const contentWidth = columns.width[i] - padding.left - padding.right;
        const content = split.contents[i];
        const cellTop = top + (first ? padding.top : 0);
        ctx.currentX = columns.x[i] + padding.left;
        ctx.currentY = cellTop;
        rec?.openNode(cell, captureTypeOf(cell), captureNameOf(cell), page, columns.x[i], top, columns.width[i]);

        const tag = this.openSplitCellTag(ctx, split, i, cell, content, dataTagging, presTagging);
        try {
          if (splitsAcrossPages(content)) {
            const status = (content as IStatefulElement).renderStateful(ctx, contentWidth);
            if (status !== RenderStatus.WrapRequired) {
              progress ||= status === RenderStatus.Complete || ctx.currentY > cellTop;
              bottom = Math.max(bottom, ctx.currentY + (status === RenderStatus.Complete ? padding.bottom : 0));
            }
            if (status === RenderStatus.Complete) {
              split.done[i] = true;
              (content as IStatefulElement).resetState?.();
            }
          } else {
            const height = content.measureHeight(contentWidth);
            drawPossiblyOversized(ctx, content, height, () => content.render(ctx, contentWidth));
            bottom = Math.max(bottom, cellTop + height + padding.bottom);
            progress = true;
            split.done[i] = true;
          }
        } finally {
          if (tag === 'tag') {
            canvas.endMarkedContent();
            tagging!.tree.end();
          } else if (tag === 'artifact') {
            canvas.endArtifact();
          }
          rec?.closeNode(cell, page, Math.max(bottom, ctx.currentY), split.done[i]);
        }
        if (!split.done[i]) allDone = false;
      }
    } finally {
      ctx.currentX = startX;
      if (dataTagging) {
        canvas.endMarkedContent();
        tagging!.tree.end();
      }
    }

    if (!progress) {
      rec?.closeNode(row, page, top, false);
      ctx.currentY = top;
      return RenderStatus.WrapRequired;
    }

    const last = allDone;
    const height = bottom - top;
    if (ctx.canvas === canvas && ctx.currentPageIndex === page) {
      ctx.currentY = top;
      const decorationStart = canvas.streamLength?.();
      for (let i = 0; i < row.cells.length; i++)
        this.paintCellFill(ctx, row.cells[i], row, columns.x[i], columns.width[i], height, dataIndex);
      if (first) this.flushBottomEdges(ctx);
      if (mark !== undefined && decorationStart !== undefined && canvas.streamLength!() > decorationStart) {
        canvas.moveTail?.(decorationStart, mark);
      }
      for (let i = 0; i < row.cells.length; i++)
        this.drawCellEdges(ctx, row.cells[i], columns.x[i], columns.width[i], height, first, last);
    }
    rec?.closeNode(row, page, top + height, last);

    ctx.currentY = top + height;
    if (!last) {
      split.fragments++;
      return RenderStatus.Overflow;
    }
    this.recordRowBottoms(ctx, row, widths);
    this._split = undefined;
    return RenderStatus.Complete;
  }

  /** Opens, or reopens on a later page, the structure element a split row's cell is marked under. */
  private openSplitCellTag(
    ctx: RenderContext,
    split: SplitRowState,
    index: number,
    cell: TableCell,
    content: IElement,
    dataTagging: boolean,
    presTagging: boolean
  ): 'tag' | 'artifact' | 'none' {
    const tree = ctx.tagging?.tree;
    if (!tree) return 'none';
    const known = split.cells[index];
    if (known) {
      tree.resume(known.element);
      if (known.container) ctx.canvas.beginContainerContent(known.tag);
      else ctx.canvas.beginMarkedContent(known.tag);
      return 'tag';
    }
    if (dataTagging) {
      if (split.row.isHeader && !cell.isHeader) cell.isHeader = true;
      const role = cell.semanticRole;
      const element = tree.begin(role);
      const attrs: string[] = [];
      if (cell.columnSpan > 1) attrs.push(`/ColSpan ${cell.columnSpan}`);
      if (role === SemanticRole.TH) attrs.push('/Scope /Column');
      if (attrs.length > 0) tree.setAttributes(`<< /O /Table ${attrs.join(' ')} >>`);
      const tag = toPdfTag(role);
      ctx.canvas.beginMarkedContent(tag);
      split.cells[index] = { element, tag, container: false };
      return 'tag';
    }
    if (presTagging) {
      const token = beginChildTag(ctx, content);
      if (token.isArtifact) return 'artifact';
      if (!token.tagThis) return 'none';
      const role = (content as unknown as IRoleProvider).semanticRole;
      split.cells[index] = { element: tree.current, tag: toPdfTag(role), container: isContainerRole(role) };
      return 'tag';
    }
    return 'none';
  }

  /**
   * Paints a cell's fill. Every fill in a row is painted before any of the row's edges, and a row's
   * bottom edges wait for the next row's fills, so no fill covers an edge (spec: Paint order).
   */
  private paintCellFill(
    ctx: RenderContext,
    cell: TableCell,
    row: TableRow,
    x: number,
    width: number,
    rowHeight: number,
    dataIndex: number
  ): void {
    const bgColor = this.cellFill(cell, row, dataIndex);
    if (bgColor) this.drawBackground(ctx, x, ctx.currentY, width, rowHeight, bgColor);
  }

  /** A cell's effective fill: cell, then row, then the table's header, footer or row default. */
  private cellFill(cell: TableCell, row: TableRow, dataIndex: number): Color | undefined {
    return (
      cell.backgroundColor ??
      row.backgroundColor ??
      (row.isHeader ? this.headerBackgroundColor : undefined) ??
      (row.isFooter ? this.footerBackgroundColor : undefined) ??
      (dataIndex % 2 === 1 ? this.alternateRowBackgroundColor : undefined) ??
      this.rowBackgroundColor
    );
  }

  /**
   * Draws a cell's left, top and right edges, and holds its bottom edge for {@link flushBottomEdges}.
   * A rounded cell draws its whole outline at once.
   */
  private drawCellEdges(
    ctx: RenderContext,
    cell: TableCell,
    x: number,
    width: number,
    rowHeight: number,
    drawTop = true,
    drawBottom = true
  ): void {
    const edges = this.edgesOf(cell);
    if (!edges.border.hasAnyBorder) return;
    // A shared edge is drawn once, by the cell that wins it (planRowEdges).
    const plan = this._edgePlan.get(cell);
    const rounded = this.cornerRadius > 0;
    const left = plan !== undefined && !(plan & DRAW_LEFT) ? 0 : edges.border.left;
    const top = !drawTop || (plan !== undefined && !(plan & DRAW_TOP)) ? 0 : edges.border.top;
    const bottom = drawBottom ? edges.border.bottom : 0;
    if (!rounded && bottom > 0 && edges.colors.bottom) {
      this._pendingBottomsPage = ctx.currentPageIndex;
      this._pendingBottoms.push({
        x,
        y: ctx.currentY + rowHeight,
        width,
        lineWidth: bottom,
        color: edges.colors.bottom,
      });
    }
    // Save and restore border settings for per-cell borders
    const savedBorder = this.border;
    const savedBorderColors = this.borderColors;
    this.border = new Border(left, top, edges.border.right, rounded ? bottom : 0);
    this.borderColors = edges.colors;
    this.drawBorder(ctx, x, ctx.currentY, width, rowHeight, false);
    this.border = savedBorder;
    this.borderColors = savedBorderColors;
  }

  /**
   * Draws the bottom edges held back from the row above, once the row below has painted its fills, or
   * when the table leaves the page. Edges held on another page are already drawn there.
   */
  private flushBottomEdges(ctx: RenderContext): void {
    const edges = this._pendingBottoms;
    const page = this._pendingBottomsPage;
    if (edges.length === 0) return;
    this._pendingBottoms = [];
    if (page !== ctx.currentPageIndex) return;
    ctx.canvas.beginArtifact();
    try {
      for (const edge of edges)
        ctx.canvas.drawLine(edge.x, edge.y, edge.x + edge.width, edge.y, edge.color, edge.lineWidth);
    } finally {
      ctx.canvas.endArtifact();
    }
  }

  /**
   * Renders a row without internal pagination checks. Shared body for
   * renderRow (which adds the footer-visibility and pagination checks first).
   * @private
   */
  private renderRowDirect(
    ctx: RenderContext,
    row: TableRow,
    widths: number[],
    asArtifact = false,
    dataIndex = 0
  ): void {
    // A carried- or brought-forward row repeats what the rows already say: draw it as an artifact.
    const artifact = asArtifact && ctx.tagging != null && !ctx.canvas.isInsideArtifact?.();
    if (artifact) ctx.canvas.beginArtifact();
    try {
      this.renderRowContent(ctx, row, widths, artifact, dataIndex);
    } finally {
      if (artifact) ctx.canvas.endArtifact();
    }
  }

  /**
   * The carried-forward or brought-forward row: the label across the columns before
   * `runningTotalColumn`, the running total formatted in that column, and empty cells after it.
   */
  private runningRow(label: string): TableRow {
    const column = this.runningTotalColumn!;
    if (!Number.isInteger(column) || column < 1 || column >= this.columnCount())
      throw new RangeError('runningTotalColumn must be a column index from 1 to the last column.');
    const value =
      this.runningTotalPrefix + formatChartNumber(sumChartNumbers(this.runningValues), this.runningTotalFormat);
    const labelText = new TextBlock(label, { fontWeight: 'bold' });
    const valueText = new TextBlock(value, { fontWeight: 'bold', alignment: 'right' });
    if (this.cascadedTextStyle) {
      labelText.applyDefaultStyleIfNotSet(this.cascadedTextStyle);
      valueText.applyDefaultStyleIfNotSet(this.cascadedTextStyle);
    }
    const labelCell = new TableCell({ content: labelText, columnSpan: column });
    const cells = [labelCell, new TableCell({ content: valueText })];
    for (let k = column + 1; k < this.columnCount(); k++) cells.push(new TableCell({ content: new TextBlock('') }));
    const row = new TableRow(cells);
    if (this.footerBackgroundColor) row.backgroundColor = this.footerBackgroundColor;
    if (this.footerTextColor) row.color = this.footerTextColor;
    return row;
  }

  private renderRowContent(
    ctx: RenderContext,
    row: TableRow,
    widths: number[],
    suppressTagging: boolean,
    dataIndex: number
  ): void {
    const rowHeight = this.measureRowHeight(row, widths);
    this.planRowEdges(ctx, row);

    // Tagging: pushes /TR around the row and /TH or /TD around each
    // cell when the document opts into PDF/UA. ColumnSpan surfaces as
    // /Attributes /ColSpan on the cell's StructElem; header-ness is
    // inherited from the row when the cell doesn't already declare it.
    // Data tables tag TR/TH/TD; presentation (layout) tables tag each cell's
    // content in reading order instead (no table structure). Exactly one
    // applies. No-op when tagging is off.
    const tagging = suppressTagging ? undefined : ctx.tagging;
    const dataTagging = tagging != null && !this.isLayoutGrid;
    const presTagging = tagging != null && this.isLayoutGrid;
    if (dataTagging) {
      tagging!.tree.begin(SemanticRole.TR);
      ctx.canvas.beginContainerContent('TR');
    }

    const rowWidth = sumWidths(widths);
    const capture = this.captureRow(ctx, row, ctx.currentX, ctx.currentY, rowWidth, rowHeight);

    try {
      const startX = ctx.currentX;
      // Each cell's left edge and width. `col` tracks the column the cell starts in, which runs ahead
      // of the cell index once any cell in the row spans more than one column.
      const cellX: number[] = [];
      const cellWidth: number[] = [];
      let currentX = startX + (this.isRightToLeft ? rowWidth : 0);
      let col = 0;
      for (const cell of row.cells) {
        const span = Math.max(1, cell.columnSpan);
        let colWidth = 0;
        for (let j = 0; j < span && col + j < widths.length; j++) {
          colWidth += widths[col + j];
        }
        if (this.isRightToLeft) currentX -= colWidth;
        cellX.push(currentX);
        cellWidth.push(colWidth);
        if (!this.isRightToLeft) currentX += colWidth;
        col += span;
      }

      // Paint order: the row's fills, then the edges held back from the row above, then the cells'
      // content, then the row's own edges. No fill is painted over an edge.
      for (let i = 0; i < row.cells.length; i++)
        this.paintCellFill(ctx, row.cells[i], row, cellX[i], cellWidth[i], rowHeight, dataIndex);
      this.flushBottomEdges(ctx);

      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];

        if (row.isHeader && !cell.isHeader) cell.isHeader = true;

        const colWidth = cellWidth[i];
        currentX = cellX[i];
        capture.openCell(cell, currentX, colWidth);

        let childTag: ChildTagToken | null = null;
        if (dataTagging) {
          const cellRole = cell.semanticRole;
          tagging!.tree.begin(cellRole);
          const cellAttrs: string[] = [];
          if (cell.columnSpan > 1) cellAttrs.push(`/ColSpan ${cell.columnSpan}`);
          // PDF/UA 7.5: TH cells need a Scope when the table isn't navigable via
          // Headers/IDs. Our header rows are column headers → /Scope /Column.
          if (cellRole === SemanticRole.TH) cellAttrs.push('/Scope /Column');
          if (cellAttrs.length > 0) {
            tagging!.tree.setAttributes(`<< /O /Table ${cellAttrs.join(' ')} >>`);
          }
          ctx.canvas.beginMarkedContent(toPdfTag(cellRole));
        } else if (presTagging) {
          childTag = beginChildTag(ctx, cell.content);
        }

        try {
          this.renderCell(ctx, cell, row, currentX, colWidth, rowHeight, dataIndex);
        } finally {
          if (dataTagging) {
            ctx.canvas.endMarkedContent();
            tagging!.tree.end();
          } else if (childTag) {
            endChildTag(ctx, childTag);
          }
          capture.closeCell(cell);
        }
      }

      for (let i = 0; i < row.cells.length; i++)
        this.drawCellEdges(ctx, row.cells[i], cellX[i], cellWidth[i], rowHeight);

      ctx.currentX = startX;
      this.recordRowBottoms(ctx, row, widths);
      ctx.currentY += rowHeight;
    } finally {
      if (dataTagging) {
        ctx.canvas.endMarkedContent();
        tagging!.tree.end();
      }
      capture.closeRow();
    }
  }

  /**
   * Column widths for the page fragments of one render. Finding the column count
   * scans every row, so recomputing it on each page made one table O(rows x pages).
   * The tree is frozen while it renders; resetState() drops the cache.
   */
  private paginatedColumnWidths(totalWidth: number): number[] {
    if (this._paginatedWidths === undefined || this._paginatedWidthsFor !== totalWidth) {
      this._paginatedWidths = this.calculateColumnWidths(totalWidth);
      this._paginatedWidthsFor = totalWidth;
    }
    return this._paginatedWidths;
  }
  private _paginatedWidths: number[] | undefined;
  private _paginatedWidthsFor = 0;

  private calculateColumnWidths(totalWidth: number): number[] {
    const weights = this.effectiveColumnWeights();
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => (w / totalWeight) * totalWidth);
  }

  /**
   * The declared column weights, extended with equal weights out to the widest
   * row. A table may be built with no weights at all, or with fewer than some
   * row actually fills; the columns those rows imply share the width evenly
   * rather than being left without one.
   */
  private effectiveColumnWeights(): number[] {
    const columns = this.columnCount();
    if (columns <= this.columnWeights.length) return this.columnWeights;

    const weights = [...this.columnWeights];
    while (weights.length < columns) weights.push(1);
    return weights;
  }

  /**
   * The number of columns the table spans: the declared weight count, widened to
   * the most columns any single row occupies once column spans are counted.
   */
  private columnCount(): number {
    let columns = this.columnWeights.length;

    for (const rows of [this.headers, this.footers]) {
      for (const row of rows) {
        let spanned = 0;
        for (const cell of row.cells) spanned += Math.max(1, cell.columnSpan);
        if (spanned > columns) columns = spanned;
      }
    }
    // Body rows, without materialising compact ones: their default cells each span one column.
    for (const entry of this._rows) {
      let spanned = 0;
      if (entry instanceof TableRow) for (const cell of entry.cells) spanned += Math.max(1, cell.columnSpan);
      else spanned = Array.isArray(entry) ? entry.length : 1;
      if (spanned > columns) columns = spanned;
    }

    return columns;
  }

  private measureRowHeight(row: TableRow, widths: number[]): number {
    let maxHeight = row.minHeight ?? 0;

    // `col` tracks the column the cell starts in, which runs ahead of the cell's
    // position in the row once any cell in the row spans more than one column.
    let col = 0;

    for (const cell of row.cells) {
      const padding = cell.padding ?? row.padding ?? new Thickness(this.cellPadding);

      // Calculate effective width considering column span
      const span = Math.max(1, cell.columnSpan);
      let cellWidth = 0;
      for (let j = 0; j < span && col + j < widths.length; j++) {
        cellWidth += widths[col + j];
      }
      col += span;

      // Measure content height with padding
      const contentWidth = cellWidth - padding.left - padding.right;
      const contentHeight = cell.content.measureHeight(contentWidth);
      const totalCellHeight = contentHeight + padding.top + padding.bottom;

      if (totalCellHeight > maxHeight) {
        maxHeight = totalCellHeight;
      }
    }

    return maxHeight;
  }
}

/** Whether content can continue on a later page, rather than being drawn whole (spec 02 §4). */
function splitsAcrossPages(content: IElement): boolean {
  if (!('renderStateful' in content)) return false;
  const marker = (content as { splitsAcrossPages?: boolean }).splitsAcrossPages;
  return marker ?? true;
}

/** The state of a body row drawn in fragments across pages (spec 02 §4.2). */
interface SplitRowState {
  index: number;
  row: TableRow;
  fragments: number;
  contents: IElement[];
  done: boolean[];
  tbody: StructureElement | undefined;
  tr: StructureElement | undefined;
  cells: Array<{ element: StructureElement; tag: string; container: boolean } | undefined>;
}

const noRowCapture: {
  openCell(cell: TableCell, x: number, width: number): void;
  closeCell(cell: TableCell): void;
  closeRow(): void;
} = {
  openCell: () => {},
  closeCell: () => {},
  closeRow: () => {},
};

/** The same left-to-right sum as `widths.reduce((a, b) => a + b, 0)`, without a closure. */
function sumWidths(widths: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < widths.length; i++) sum += widths[i];
  return sum;
}

/** Whether addRow's arguments are plain content: elements, none of them a TableCell or TableRow. */
function isPlainContent(args: ReadonlyArray<IElement | TableCell[] | TableRow>): boolean {
  for (const arg of args) if (arg instanceof TableCell || arg instanceof TableRow || Array.isArray(arg)) return false;
  return true;
}

/** The row TableRow.fromElements builds for a compact entry. */
const DRAW_LEFT = 1,
  DRAW_TOP = 2;

function buildRow(entry: IElement | IElement[]): TableRow {
  return Array.isArray(entry) ? TableRow.fromElements(...entry) : TableRow.fromElements(entry);
}
