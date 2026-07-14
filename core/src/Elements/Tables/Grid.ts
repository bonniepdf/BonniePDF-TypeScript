import { Table } from './Table';

/**
 * A **layout grid**: arranges content in weighted columns and aligned rows for
 * visual layout — address blocks, totals boxes, forms, side-by-side panels — as
 * opposed to tabular *data*.
 *
 * `Grid` reuses `Table`'s column-weight, pagination, and cell engine (padding,
 * borders, backgrounds, per-cell alignment), so it is the right tool when you need
 * columns that stay aligned across multiple rows. What differs is **meaning**: a
 * `Grid` is tagged in the PDF structure tree as a generic `Div` grouping, and each
 * cell's content tags itself in reading order. It therefore carries no table
 * semantics — no phantom "table with N columns" announced to assistive tech, and
 * no PDF/UA §7.5 header requirement. It is accessible by construction.
 *
 * Choosing the right element:
 * - **A single row of columns** (a key/value pair, a label + amount) → prefer
 *   {@link HorizontalStack} with `WidthDistribution.Weighted`; it is lighter.
 * - **Multiple rows whose columns must line up** (a form, an invoice details
 *   block, side-by-side panels) → `Grid`.
 * - **Actual tabular data** (rows and columns with header relationships) → `Table`,
 *   and mark its header cells so it emits `TH`.
 *
 * `Grid` pins the layout-grid tagging on, so — unlike `Table.presentation` — it can
 * never be flipped back into a data table by mistake.
 */
export class Grid extends Table {
  /** @inheritdoc — always a layout grid (`Div`), independent of `presentation`. */
  protected override get isLayoutGrid(): boolean {
    return true;
  }
}
