/**
 * Your First PDF.
 * A one-page invoice in a few lines: document title and language, a heading, a two-column table and a total.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import { Document, Heading, Line, StandardFonts, Table, TextBlock } from '@bonniepdf/core';

export function generate(
  _assets?: ReadonlyMap<string, Uint8Array>,
  context: { now?: Date; locale?: string; timeZone?: string } = {}
): Document {
  // Convert the visitor’s date to a UTC calendar value for date-only arithmetic.
  const now = context.now ?? new Date();
  const day = new Date(
    new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: context.timeZone,
    }).format(now) + 'T00:00:00Z'
  );
  const date = new Intl.DateTimeFormat(context.locale ?? 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  });
  const title = `Invoice #${day.getUTCFullYear()}-014`;
  const due = new Date(day);
  due.setUTCDate(due.getUTCDate() + 14);
  const money = new Intl.NumberFormat(context.locale ?? 'en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const doc = new Document({
    metadata: { title: title },
    settings: { language: 'en-GB', defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' } },
  });

  doc.add(
    new Heading(title, {
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
    new TextBlock(`Billed to Sample Customer Ltd · issued ${date.format(day)} · due ${date.format(due)}`, {
      margin: { bottom: 12 },
    })
  );

  // Cells take plain strings; a TextBlock gives a cell its own alignment.
  const items = new Table({ columns: [4, 1], headerBackgroundColor: 'slate-800', headerTextColor: '#ffffff' });
  items.addHeader('Description', new TextBlock('Amount', { alignment: 'right' }));
  items.addRow('Brand workshop, two days', new TextBlock(money.format(1800), { alignment: 'right' }));
  items.addRow('Logo and colour palette', new TextBlock(money.format(950), { alignment: 'right' }));
  doc.add(items);

  doc.add(new Line({ thickness: 1, color: 'slate-300', margin: { top: 12, bottom: 8 } }));
  doc.add(
    new TextBlock(`Total due  ${money.format(2750)}`, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 14,
      alignment: 'right',
    })
  );
  doc.add(
    new TextBlock(
      `Pay by bank transfer to Northlight Studio, sort code 00-00-00, account 12345678, quoting INV-${day.getUTCFullYear()}-014.`,
      {
        fontSize: 9,
        color: 'slate-500',
        margin: { top: 28 },
      }
    )
  );
  return doc;
}
