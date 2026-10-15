import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Table } from '../../src/Elements/Tables/Table';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { TableRow } from '../../src/Elements/Tables/TableRow';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Color } from '../../src/Core/Color';
import type { IElement } from '../../src/Elements/IElement';
import { maskedPdf } from '../definition/helpers';

// A row added as plain content is kept compact. These pin that callers cannot tell: the same
// output, the same row object on every read, and changes through it kept.
function generate(fill: (table: Table) => void, afterFill?: (table: Table) => void): string {
  const doc = new Document();
  const table = new Table(2, 1);
  table.cellPadding = 2;
  table.repeatHeadersOnNewPage = true;
  table.addHeader(new TextBlock('Item'), new TextBlock('Qty'));
  fill(table);
  afterFill?.(table);
  doc.add(table);
  return maskedPdf(doc.generateBytes());
}

const isCompact = (table: Table, index: number): boolean =>
  !((table as unknown as { _rows: unknown[] })._rows[index] instanceof TableRow);

describe('compact table rows', () => {
  it('render as the equivalent explicit rows', () => {
    // Enough rows to break across pages, so repeated headers and continuation are covered.
    const compact = generate(t => {
      for (let i = 0; i < 200; i++) t.addRow(new TextBlock(`Row ${i}`), new TextBlock(`${i}`));
    });
    const explicit = generate(t => {
      for (let i = 0; i < 200; i++) t.addRow(TableRow.fromElements(new TextBlock(`Row ${i}`), new TextBlock(`${i}`)));
    });
    expect(compact).toBe(explicit);
  });

  it('keep a read row, and its changes stay', () => {
    const table = new Table(1);
    table.addRow(new TextBlock('a'));
    expect(isCompact(table, 0)).toBe(true);
    const first = table.getAllRows()[0];
    expect(table.getAllRows()[0]).toBe(first);
    expect(table.rows[0]).toBe(first);
    expect(isCompact(table, 0)).toBe(false);
    expect((first.cells[0].content as TextBlock).text).toBe('a');
  });

  it('carry changes through a read row into the output', () => {
    const coloured = generate(
      t => t.addRow(new TextBlock('x'), new TextBlock('1')),
      t => t.rows[0].withBackground(Color.fromHex('#ff0000'))
    );
    const explicit = generate(t =>
      t.addRow(TableRow.fromElements(new TextBlock('x'), new TextBlock('1')).withBackground(Color.fromHex('#ff0000')))
    );
    expect(coloured).toBe(explicit);
    expect(coloured).not.toBe(generate(t => t.addRow(new TextBlock('x'), new TextBlock('1'))));
  });

  it('ignore changes to the arguments after adding', () => {
    const table = new Table(2);
    const cells: IElement[] = [new TextBlock('a'), new TextBlock('b')];
    table.addRow(...cells);
    cells[0] = new TextBlock('changed');
    expect((table.rows[0].cells[0].content as TextBlock).text).toBe('a');
  });

  it('are not materialised by tree walks or saving', () => {
    const table = new Table(2);
    const a = new TextBlock('a'),
      b = new TextBlock('b');
    table.addRow(a, b);
    table.addRow(new TextBlock('c'));
    expect(table.getChildren().slice(0, 2)).toEqual([a, b]);
    expect(table.getChildren()).toHaveLength(3);
    const doc = new Document();
    doc.add(table);
    doc.generateBytes();
    expect(isCompact(table, 0)).toBe(true);
    expect(isCompact(table, 1)).toBe(true);
  });

  it('keep a row containing a caller cell as given', () => {
    const table = new Table(2);
    const cell = new TableCell();
    cell.content = new TextBlock('mine');
    table.addRow(cell, new TextBlock('b'));
    expect(isCompact(table, 0)).toBe(false);
    expect(table.rows[0].cells[0]).toBe(cell);
  });

  it('store later rows as real rows once the rows array has been read', () => {
    const table = new Table(1);
    const held = table.rows;
    table.addRow(new TextBlock('late'));
    expect(held[0]).toBeInstanceOf(TableRow);
  });
});
