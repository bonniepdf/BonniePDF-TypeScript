import { describe, it, expect } from 'vitest';
import { Table, TABLE_OPTION_KEYS } from '../../src/Elements/Tables/Table';
import { TableRow, TABLE_ROW_OPTION_KEYS } from '../../src/Elements/Tables/TableRow';
import { TableCell, TABLE_CELL_OPTION_KEYS } from '../../src/Elements/Tables/TableCell';
import { Grid, GRID_OPTION_KEYS } from '../../src/Elements/Tables/Grid';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Thickness } from '../../src/Core/Thickness';
import { Border } from '../../src/Core/Border';
import { ColorPalette } from '../../src/Core/ColorPalette';

const INTERNAL = {
  elementBase: ['startingY'],
  table: ['columnWeights', 'footers', 'headers', 'rows', 'lastRowRendered', 'headersPending', 'taggedHeaderEmitted'],
} as const;

function settableSurface(instance: object, internal: readonly string[] = []): string[] {
  const skip = new Set<string>([...INTERNAL.elementBase, ...internal]);
  const names = new Set<string>();
  for (const k of Object.keys(instance)) {
    if (!k.startsWith('_') && !skip.has(k)) names.add(k);
  }
  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (typeof d.set === 'function' && !k.startsWith('_') && !skip.has(k)) names.add(k);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...names].sort();
}

const cell = (t: string) => TableCell.from(new TextBlock(t));

describe('Table dispatch — the rest-param conflict (09a §5)', () => {
  it('keeps the rest-param weight form', () => {
    const t = new Table(1, 2, 1);
    // Column weights are private; assert via layout behaviour instead.
    const widths = (t as unknown as { calculateColumnWidths(w: number): number[] }).calculateColumnWidths(400);
    expect(widths).toEqual([100, 200, 100]);
  });

  it('treats a single non-array object as options, not weights', () => {
    const t = new Table({ columns: [1, 3], cellPadding: 8 });
    expect(t.cellPadding).toBe(8);
    const widths = (t as unknown as { calculateColumnWidths(w: number): number[] }).calculateColumnWidths(400);
    expect(widths).toEqual([100, 300]);
  });

  it('the no-argument form still works', () => {
    const t = new Table();
    expect(t.cellPadding).toBe(5);
  });

  it('applies styling, border sugar, and row sugar from the bag', () => {
    const header = TableRow.fromCells(cell('H1'), cell('H2'));
    const body = TableRow.fromCells(cell('a'), cell('b'));
    const t = new Table({
      columns: [1, 1],
      cellPadding: 6,
      headerBackgroundColor: 'slate-800',
      headerTextColor: '#ffffff',
      rowBackgroundColor: 'slate-50',
      border: { width: 0.5, color: 'slate-300' },
      margin: { bottom: 8 },
      header,
      rows: [body],
    });

    expect(t.cellPadding).toBe(6);
    expect(t.headerBackgroundColor).toBe(ColorPalette.slate[800]);
    expect(t.rowBackgroundColor).toBe(ColorPalette.slate[50]);
    expect(t.border).toEqual(new Border(0.5));
    expect(t.borderColors.left).toBe(ColorPalette.slate[300]);
    expect(t.margin).toEqual(new Thickness(0, 0, 0, 8));
    expect(header.isHeader).toBe(true); // addHeader marked it
    expect(body.isHeader).toBe(false);
  });

  it('covers its property surface (columns/rows/header/footer are sugar)', () => {
    expect(settableSurface(new Table(), INTERNAL.table)).toEqual([...TABLE_OPTION_KEYS].sort());
  });
});

describe('TableCell / TableRow options', () => {
  it('TableCell accepts content, styling, and border sugar', () => {
    const content = new TextBlock('x');
    const c = new TableCell({
      content,
      textColor: 'slate-700',
      padding: 4,
      columnSpan: 2,
      isHeader: true,
      backgroundColor: 'slate-50',
      border: { width: 1, color: 'slate-300' },
    });
    expect(c.content).toBe(content);
    expect(c.textColor).toBe(ColorPalette.slate[700]);
    expect(c.padding).toEqual(new Thickness(4));
    expect(c.columnSpan).toBe(2);
    expect(c.isHeader).toBe(true);
    expect(c.backgroundColor).toBe(ColorPalette.slate[50]);
    expect(c.borderColors.left).toBe(ColorPalette.slate[300]);
  });

  it('TableCell still constructs empty and via the static factory', () => {
    expect(new TableCell().columnSpan).toBe(1);
    expect(TableCell.from(new TextBlock('y')).content).toBeInstanceOf(TextBlock);
  });

  it('TableRow keeps the positional cells form and accepts options', () => {
    const cells = [cell('a'), cell('b')];
    expect(new TableRow(cells).cells).toBe(cells);

    const r = new TableRow({
      cells,
      textColor: 'gray-600',
      padding: { bottom: 3 },
      minHeight: 20,
      isFooter: true,
      backgroundColor: 'slate-100',
    });
    expect(r.cells).toBe(cells);
    expect(r.textColor).toBe(ColorPalette.gray[600]);
    expect(r.padding).toEqual(new Thickness(0, 0, 0, 3));
    expect(r.minHeight).toBe(20);
    expect(r.isFooter).toBe(true);
    expect(r.backgroundColor).toBe(ColorPalette.slate[100]);
  });

  it('the with* methods still work alongside options', () => {
    const r = new TableRow({ minHeight: 10 }).withBackground(ColorPalette.rose[500]);
    expect(r.minHeight).toBe(10);
    expect(r.backgroundColor).toBe(ColorPalette.rose[500]);
  });

  it('covers their settable surfaces', () => {
    expect(settableSurface(new TableCell())).toEqual([...TABLE_CELL_OPTION_KEYS].sort());
    expect(settableSurface(new TableRow())).toEqual([...TABLE_ROW_OPTION_KEYS].sort());
  });
});

describe('Grid options', () => {
  it('shares Table options and is a Table', () => {
    const g = new Grid({ columns: [1, 1], cellPadding: 4 });
    expect(g).toBeInstanceOf(Table);
    expect(g.cellPadding).toBe(4);
    expect(GRID_OPTION_KEYS).toEqual(TABLE_OPTION_KEYS);
  });
});
