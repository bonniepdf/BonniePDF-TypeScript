/** A styled data table: banded rows, column spans, wrapping, aligned numbers, repeated headers, a subtotal carried across page breaks, a totals footer, and empty data. */
import { Document, Heading, TextBlock, Table, TableRow, TableCell, PageBreak, Container } from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document({
    metadata: { title: 'Tables with real-world content' },
    settings: {
      language: 'en-GB',
      margin: 40,
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: 'slate-700' },
    },
  });
  doc.add(new Heading('Tables with real-world content', { level: 1, fontSize: 23 }));
  doc.add(
    new TextBlock(
      'The description column has most of the available width. Numbers align right, headers repeat, a spanning row labels each section, and the amount subtotal is carried from page to page.',
      { margin: { bottom: 12 } }
    )
  );
  doc.add(
    buildTable(
      Array.from({ length: 36 }, (_, i) => ({
        id: `ITEM-${String(i + 1).padStart(3, '0')}`,
        description:
          i === 17
            ? 'Long description: '.concat('Installation, commissioning and handover documentation. '.repeat(14))
            : `Replacement component ${i + 1}, with delivery and installation notes that wrap naturally.`,
        quantity: (i % 3) + 1,
        amount: (i + 1) * 125,
      }))
    )
  );
  doc.add(new PageBreak());
  doc.add(new Heading('Empty results', { level: 2, fontSize: 18 }));
  doc.add(buildTable([]));
  doc.add(new Heading('A fixed-width table frame', { level: 2, fontSize: 18, margin: { top: 16 } }));
  doc.add(new TextBlock('The frame is 360 points wide; its columns still share that space using relative weights.'));
  doc.add(
    new Container({
      width: 360,
      child: buildTable([
        { id: 'FIXED-001', description: 'A table inside a fixed-width frame.', quantity: 1, amount: 1250 },
      ]),
    })
  );
  return doc;
}

interface Item {
  id: string;
  description: string;
  quantity: number;
  amount: number;
}

function buildTable(items: Item[]): Table {
  // These are relative weights, not fixed pixel widths. When the table breaks across pages it carries
  // its amount subtotal forward, and the footer totals the whole table.
  const table = new Table({
    columns: [1.3, 5, 0.7, 1.2],
    cellPadding: 7,
    repeatHeadersOnNewPage: true,
    border: { width: 0.5, color: 'slate-200' },
    headerBackgroundColor: 'slate-800',
    headerTextColor: '#ffffff',
    footerBackgroundColor: 'slate-100',
    footerTextColor: 'slate-900',
    runningTotalColumn: 3,
  });
  table.addHeader(
    ...['Item', 'Description', 'Qty', 'Amount'].map(
      (label, i) => new TextBlock(label, { fontWeight: 'bold', alignment: i >= 2 ? 'right' : 'left' })
    )
  );
  table.addRow(
    new TableRow({
      cells: [new TableCell({ content: new TextBlock('Order detail', { fontWeight: 'bold' }), columnSpan: 4 })],
      backgroundColor: 'slate-100',
    })
  );
  if (!items.length)
    table.addRow(
      new TableRow({
        cells: [
          new TableCell({
            content: new TextBlock('No items match this selection.', { italic: true, color: 'slate-500' }),
            columnSpan: 4,
          }),
        ],
      })
    );
  items.forEach((item, i) =>
    table.addRow(
      new TableRow({
        cells: [
          new TextBlock(item.id),
          new TextBlock(item.description),
          new TextBlock(String(item.quantity), { alignment: 'right' }),
          new TextBlock(money(item.amount), { alignment: 'right' }),
        ].map(content => new TableCell({ content })),
        // Every other row is banded, so a long row is easy to follow across the page.
        backgroundColor: i % 2 === 1 ? 'slate-50' : undefined,
        runningValue: item.amount / 100,
      })
    )
  );
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  table.addFooter(
    new TableRow({
      cells: [
        new TableCell({ content: new TextBlock('Total', { fontWeight: 'bold' }), columnSpan: 2 }),
        new TableCell({ content: new TextBlock(String(quantity), { fontWeight: 'bold', alignment: 'right' }) }),
        new TableCell({ content: new TextBlock(money(amount), { fontWeight: 'bold', alignment: 'right' }) }),
      ],
    })
  );
  return table;
}

function money(pence: number): string {
  return (pence / 100).toFixed(2);
}
