/** Column spans, wrapping, aligned numbers, repeated headers, and empty data. */
import { Document, Heading, TextBlock, Table, TableRow, TableCell, PageBreak, Container } from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document({
    metadata: { title: 'Tables with real-world content' },
    settings: { language: 'en-GB', margin: 40 },
  });
  doc.add(new Heading('Tables with real-world content', { level: 1, fontSize: 23 }));
  doc.add(
    new TextBlock(
      'The description column has most of the available width. Numbers align right, headers repeat, and a spanning row labels each section.',
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
  // These are relative weights, not fixed pixel widths.
  const table = new Table({ columns: [1.3, 5, 0.7, 1.2], cellPadding: 7, repeatHeadersOnNewPage: true });
  table.addHeader('Item', 'Description', 'Qty', 'Amount');
  table.addRow(new TableRow({ cells: [new TableCell({ content: new TextBlock('Order detail'), columnSpan: 4 })] }));
  if (!items.length)
    table.addRow(
      new TableRow({
        cells: [new TableCell({ content: new TextBlock('No items match this selection.'), columnSpan: 4 })],
      })
    );
  for (const item of items)
    table.addRow(
      new TextBlock(item.id, { fontSize: 10 }),
      new TextBlock(item.description, { fontSize: 10 }),
      new TextBlock(String(item.quantity), { alignment: 'right', fontSize: 10 }),
      new TextBlock((item.amount / 100).toFixed(2), { alignment: 'right', fontSize: 10 })
    );
  return table;
}
