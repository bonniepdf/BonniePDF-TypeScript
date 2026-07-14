import { BorderedElementBase } from '../Layout/BorderedElementBase';
import { IElement, RenderStatus, RenderContext } from '../IElement';
import { TableRow } from './TableRow';
import { TableCell } from './TableCell';
import { Color } from '../../Core/Color';
import { Thickness } from '../../Core/Thickness';
import { TextBlock } from '../Text/TextBlock';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole, toPdfTag } from '../../Rendering/Tagging/SemanticRole';
import { TaggingContext } from '../../Rendering/Tagging/TaggingContext';
import { captureTypeOf, captureNameOf } from '../../Rendering/LayoutRecorder';
import { beginChildTag, endChildTag, ChildTagToken } from '../../Rendering/Tagging/ChildTagging';

/**
 * A table element with support for column weights, cell padding, borders, headers, and footers
 */
export class Table extends BorderedElementBase implements IRoleProvider {
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
  private readonly rows: TableRow[] = [];

  // State tracking for multipage rendering
  private lastRowRendered = -1;
  private headersPending = true;
  private taggedHeaderEmitted = false;

  constructor(...columnWeights: number[]) {
    super();
    this.columnWeights = columnWeights;
  }

  /**
   * Default padding for all cells
   */
  public cellPadding = 5;
  /**
   * Whether to repeat headers on each new page
   */
  public repeatHeadersOnNewPage = true;
  /**
   * Whether to show footers on each page (only last page if false)
   */
  public showFootersOnAllPages = false;
  /**
   * Default background color for header rows
   */
  public headerBackgroundColor?: Color;
  /**
   * Default text color for header rows
   */
  public headerTextColor?: Color;
  /**
   * Default background color for footer rows
   */
  public footerBackgroundColor?: Color;
  /**
   * Default text color for footer rows
   */
  public footerTextColor?: Color;
  /**
   * Default background color for data rows
   */
  public rowBackgroundColor?: Color;
  /**
   * Default background color for data rows
   */
  public rowTextColor?: Color;

  /** Adds a header row to the table. */
  public addHeader(...elements: IElement[]): void;
  public addHeader(cells: TableCell[]): void;
  public addHeader(row: TableRow): void;
  public addHeader(...args: Array<IElement | TableCell[] | TableRow>): void {
    const row = this.createRowFromArgs(args);
    row.isHeader = true;
    // Propagate to cells so each cell's PDF/UA role resolves to TH.
    for (const c of row.cells) c.isHeader = true;
    this.headers.push(row);
  }

  /** Adds a footer row to the table. */
  public addFooter(...elements: IElement[]): void;
  public addFooter(cells: TableCell[]): void;
  public addFooter(row: TableRow): void;
  public addFooter(...args: Array<IElement | TableCell[] | TableRow>): void {
    const row = this.createRowFromArgs(args);
    row.isFooter = true;
    this.footers.push(row);
  }

  /** Adds a data row to the table. */
  public addRow(...elements: IElement[]): void;
  public addRow(cells: TableCell[]): void;
  public addRow(row: TableRow): void;
  public addRow(...args: Array<IElement | TableCell[] | TableRow>): void {
    const row = this.createRowFromArgs(args);
    this.rows.push(row);
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

  /** Returns all rows (headers + data rows + footers) for tree-walking. */
  public getAllRows(): ReadonlyArray<TableRow> {
    return [...this.headers, ...this.rows, ...this.footers];
  }

  /** @inheritdoc - every cell's content across headers, body rows, and footers. */
  public getChildren(): readonly IElement[] {
    const children: IElement[] = [];
    for (const row of this.getAllRows()) {
      for (const cell of row.cells) {
        if (cell?.content) children.push(cell.content);
      }
    }
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
      ctx.currentX = originalX;
      if (ownTable) tagging!.tree.end();
    }
  }

  private renderStatefulRows(ctx: RenderContext, width: number, tagging: TaggingContext | undefined): RenderStatus {
    const contentWidth = this.getContentWidth(width);
    const widths = this.calculateColumnWidths(contentWidth);
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

        if (ctx.currentY + headerHeight > ctx.maxY && ctx.currentY > ctx.margin) {
          if (rowGroupOpen && groupTagging) tagging!.tree.end();
          return this.lastRowRendered < 0 ? RenderStatus.WrapRequired : RenderStatus.Overflow;
        }

        if (!rowGroupOpen && groupTagging) {
          tagging!.tree.begin(headerGroupRole);
          rowGroupOpen = true;
        }
        this.renderRowDirect(ctx, headerRow, widths);
      }

      if (rowGroupOpen && groupTagging) tagging!.tree.end();
      if (groupTagging && !this.taggedHeaderEmitted) this.taggedHeaderEmitted = true;
      this.headersPending = false;
    }

    // Start from the next unrendered row
    const startRow = this.lastRowRendered + 1;

    if (startRow >= this.rows.length) {
      this.renderFootersGrouped(ctx, widths, tagging);
      ctx.currentY += this.margin.bottom;
      return RenderStatus.Complete;
    }

    // Render data rows
    let tbodyOpen = false;
    for (let i = startRow; i < this.rows.length; i++) {
      const row = this.rows[i];
      const rowHeight = this.measureRowHeight(row, widths);

      // Pagination check
      if (ctx.currentY + rowHeight > ctx.maxY && ctx.currentY > ctx.margin) {
        if (tbodyOpen && groupTagging) tagging!.tree.end();
        this.lastRowRendered = i - 1;
        this.headersPending = this.repeatHeadersOnNewPage && this.headers.length > 0;
        return i === startRow ? RenderStatus.WrapRequired : RenderStatus.Overflow;
      }

      if (!tbodyOpen && groupTagging) {
        tagging!.tree.begin(SemanticRole.TBody);
        tbodyOpen = true;
      }
      this.renderRowDirect(ctx, row, widths);
      this.lastRowRendered = i;
    }
    if (tbodyOpen && groupTagging) tagging!.tree.end();

    this.renderFootersGrouped(ctx, widths, tagging);
    ctx.currentY += this.margin.bottom;
    this.lastRowRendered = this.rows.length - 1;
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
    this.lastRowRendered = -1;
    this.headersPending = true;
    this.taggedHeaderEmitted = false;
  }

  protected override measureContentHeight(contentWidth: number): number {
    const widths = this.calculateColumnWidths(contentWidth);
    let totalHeight = 0;

    // Headers
    for (const row of this.headers) {
      totalHeight += this.measureRowHeight(row, widths);
    }

    // Data rows
    for (const row of this.rows) {
      totalHeight += this.measureRowHeight(row, widths);
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
    if (this.rows.length > 0) {
      if (groupTagging) tagging!.tree.begin(SemanticRole.TBody);
      try {
        for (const row of this.rows) {
          const rowHeight = this.measureRowHeight(row, widths);

          // Pagination check
          if (ctx.currentY + rowHeight > ctx.maxY && ctx.currentY > ctx.margin) {
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

          this.renderRow(ctx, row, widths, isFirstPage && !headersAddedOnNewPage);
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
    const page = ctx.currentPageIndex;
    const endY = rowY + rowHeight;
    rec?.openNode(row, captureTypeOf(row), captureNameOf(row), page, rowX, rowY, rowWidth);
    return {
      openCell: (cell, x, width) => rec?.openNode(cell, captureTypeOf(cell), captureNameOf(cell), page, x, rowY, width),
      closeCell: cell => rec?.closeNode(cell, page, endY, true),
      closeRow: () => rec?.closeNode(row, page, endY, true),
    };
  }

  private renderRow(ctx: RenderContext, row: TableRow, widths: number[], _isFirstPage: boolean): void {
    // For footers, only show on last page if ShowFootersOnAllPages is false
    if (row.isFooter && !this.showFootersOnAllPages && !this.isLastPage(ctx)) {
      return;
    }

    const rowHeight = this.measureRowHeight(row, widths);

    // Pagination check
    if (ctx.currentY + rowHeight > ctx.maxY && ctx.currentY > ctx.margin) {
      ctx.newPage();
    }

    // this feature tagging: push /TR around the row and /TH or /TD around each
    // cell so the structure tree mirrors the visible table. ColumnSpan
    // surfaces as /Attributes /ColSpan on the cell's StructElem.
    // Header-ness inherited from the row when the cell doesn't already
    // declare it. No-op when tagging is off.
    const tagging = ctx.tagging;
    // Data tables tag TR/TH/TD; presentation (layout) tables tag each cell's
    // content in reading order instead (no table structure). Exactly one applies.
    const dataTagging = tagging != null && !this.isLayoutGrid;
    const presTagging = tagging != null && this.isLayoutGrid;
    if (dataTagging) {
      tagging!.tree.begin(SemanticRole.TR);
      ctx.canvas.beginContainerContent('TR');
    }

    const rowWidth = widths.reduce((a, b) => a + b, 0);
    const capture = this.captureRow(ctx, row, ctx.currentX, ctx.currentY, rowWidth, rowHeight);

    try {
      const startX = ctx.currentX;
      let currentX = startX;

      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];

        // Defensive: cells added via fromElements() don't know their
        // row's header-ness. Propagate at render time so the structure
        // role resolves to TH instead of TD.
        if (row.isHeader && !cell.isHeader) cell.isHeader = true;

        let colWidth = widths[i];
        if (cell.columnSpan > 1) {
          for (let j = 1; j < cell.columnSpan && i + j < widths.length; j++) {
            colWidth += widths[i + j];
          }
        }

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
          // Layout cell: tag the content with its own natural role (P, Figure, …)
          // in reading order, exactly as a stack tags a child.
          childTag = beginChildTag(ctx, cell.content);
        }

        try {
          this.renderCell(ctx, cell, row, currentX, colWidth, rowHeight);
        } finally {
          if (dataTagging) {
            ctx.canvas.endMarkedContent();
            tagging!.tree.end();
          } else if (childTag) {
            endChildTag(ctx, childTag);
          }
          capture.closeCell(cell);
        }

        currentX += widths[i]; // Move by original column width (not spanned width)
      }

      // Move down by row height
      ctx.currentX = startX;
      ctx.currentY += rowHeight;
    } finally {
      if (dataTagging) {
        ctx.canvas.endMarkedContent();
        tagging!.tree.end();
      }
      capture.closeRow();
    }
  }

  private renderCell(
    ctx: RenderContext,
    cell: TableCell,
    row: TableRow,
    x: number,
    width: number,
    rowHeight: number
  ): void {
    // Determine effective styling (cell > row > table defaults)
    const bgColor =
      cell.backgroundColor ??
      row.backgroundColor ??
      (row.isHeader ? this.headerBackgroundColor : undefined) ??
      (row.isFooter ? this.footerBackgroundColor : undefined) ??
      this.rowBackgroundColor;

    const textColor =
      cell.textColor ??
      row.textColor ??
      (row.isHeader ? this.headerTextColor : undefined) ??
      (row.isFooter ? this.footerTextColor : undefined) ??
      this.rowTextColor;

    const padding = cell.padding ?? row.padding ?? new Thickness(this.cellPadding);

    const cellBorder = cell.border;
    const cellBorderColors = cell.borderColors;

    // Apply text color to TextBlock content if specified
    let content = cell.content;
    if (textColor && content instanceof TextBlock) {
      // Create a copy with the text color applied
      const tb = new TextBlock();
      tb.text = content.text;
      tb.fontName = content.fontName;
      tb.fontSize = content.fontSize;
      tb.textColor = textColor;
      tb.alignment = content.alignment;
      content = tb;
    }

    // Draw background (fills entire cell including padding area)
    if (bgColor) {
      this.drawBackground(ctx, x, ctx.currentY, width, rowHeight, bgColor);
    }

    // Render content with padding
    const originalX = ctx.currentX;
    const yBeforeCell = ctx.currentY;
    ctx.currentX = x + padding.left;
    ctx.currentY += padding.top;

    const contentWidth = width - padding.left - padding.right;
    content.render(ctx, contentWidth);

    // Restore X and Y positions
    ctx.currentX = originalX;
    ctx.currentY = yBeforeCell;

    // Draw border
    if (cellBorder || this.border) {
      const effectiveBorder = cellBorder ?? this.border!;
      const effectiveBorderColors = cellBorderColors ?? this.borderColors!;
      // Save and restore border settings for per-cell borders
      const savedBorder = this.border;
      const savedBorderColors = this.borderColors;
      this.border = effectiveBorder;
      this.borderColors = effectiveBorderColors;
      this.drawBorder(ctx, x, ctx.currentY, width, rowHeight);
      this.border = savedBorder;
      this.borderColors = savedBorderColors;
    }
  }

  /**
   * Renders a row without internal pagination checks
   * @private
   */
  private renderRowDirect(ctx: RenderContext, row: TableRow, widths: number[]): void {
    const rowHeight = this.measureRowHeight(row, widths);

    // this feature tagging: pushes /TR around the row and /TH or /TD around each
    // cell when the document opts into PDF/UA. Mirror of the same wrap
    // in renderRow (the non-stateful twin). No-op when tagging is off.
    const tagging = ctx.tagging;
    const dataTagging = tagging != null && !this.isLayoutGrid;
    const presTagging = tagging != null && this.isLayoutGrid;
    if (dataTagging) {
      tagging!.tree.begin(SemanticRole.TR);
      ctx.canvas.beginContainerContent('TR');
    }

    const rowWidth = widths.reduce((a, b) => a + b, 0);
    const capture = this.captureRow(ctx, row, ctx.currentX, ctx.currentY, rowWidth, rowHeight);

    try {
      const startX = ctx.currentX;
      let currentX = startX;

      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];

        if (row.isHeader && !cell.isHeader) cell.isHeader = true;

        let colWidth = widths[i];
        if (cell.columnSpan > 1) {
          for (let j = 1; j < cell.columnSpan && i + j < widths.length; j++) {
            colWidth += widths[i + j];
          }
        }

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
          this.renderCell(ctx, cell, row, currentX, colWidth, rowHeight);
        } finally {
          if (dataTagging) {
            ctx.canvas.endMarkedContent();
            tagging!.tree.end();
          } else if (childTag) {
            endChildTag(ctx, childTag);
          }
          capture.closeCell(cell);
        }

        currentX += widths[i];
      }

      ctx.currentX = startX;
      ctx.currentY += rowHeight;
    } finally {
      if (dataTagging) {
        ctx.canvas.endMarkedContent();
        tagging!.tree.end();
      }
      capture.closeRow();
    }
  }

  private calculateColumnWidths(totalWidth: number): number[] {
    const totalWeight = this.columnWeights.reduce((sum, w) => sum + w, 0);
    return this.columnWeights.map(w => (w / totalWeight) * totalWidth);
  }

  private measureRowHeight(row: TableRow, widths: number[]): number {
    let maxHeight = row.minHeight ?? 0;

    for (let i = 0; i < row.cells.length; i++) {
      const cell = row.cells[i];
      const padding = cell.padding ?? row.padding ?? new Thickness(this.cellPadding);

      // Calculate effective width considering column span
      let cellWidth = widths[i];
      if (cell.columnSpan > 1) {
        for (let j = 1; j < cell.columnSpan && i + j < widths.length; j++) {
          cellWidth += widths[i + j];
        }
      }

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

  private isLastPage(ctx: RenderContext): boolean {
    return ctx.isLastPage;
  }
}
