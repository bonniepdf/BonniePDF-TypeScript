/**
 * Your First PDF.
 * A one-page invoice in a few lines: document title and language, a heading, a two-column table and a total.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import { Document, Heading, Line, StandardFonts, Table, TextBlock } from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document({
    metadata: { title: 'Invoice #2026-014' },
    settings: { language: 'en-GB', defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' } },
  });

  doc.add(
    new Heading('Invoice #2026-014', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 26,
      color: 'slate-900',
    })
  );
  doc.add(
    new TextBlock('Northlight Studio · 14 Harbour Square, Bristol BS1 4QA', {
      color: 'slate-500',
      margin: { bottom: 24 },
    })
  );
  doc.add(
    new TextBlock('Billed to Sample Customer Ltd · issued 4 November 2026 · due within 14 days', {
      margin: { bottom: 12 },
    })
  );

  // Cells take plain strings; a TextBlock gives a cell its own alignment.
  const items = new Table({ columns: [4, 1], headerBackgroundColor: 'slate-800', headerTextColor: '#ffffff' });
  items.addHeader('Description', new TextBlock('Amount', { alignment: 'right' }));
  items.addRow('Brand workshop, two days', new TextBlock('£1,800.00', { alignment: 'right' }));
  items.addRow('Logo and colour palette', new TextBlock('£950.00', { alignment: 'right' }));
  doc.add(items);

  doc.add(new Line({ thickness: 1, color: 'slate-300', margin: { top: 12, bottom: 8 } }));
  doc.add(
    new TextBlock('Total due  £2,750.00', { fontName: StandardFonts.HelveticaBold, fontSize: 14, alignment: 'right' })
  );
  doc.add(
    new TextBlock(
      'Pay by bank transfer to Northlight Studio, sort code 00-00-00, account 12345678, quoting INV-2026-014.',
      {
        fontSize: 9,
        color: 'slate-500',
        margin: { top: 28 },
      }
    )
  );
  return doc;
}
