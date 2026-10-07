/**
 * Watermarking: Confidential.
 * A CONFIDENTIAL variant of the diagonal watermark, tinted red and repeated behind every page of a multi-section quarterly financial report.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import { Document, TextBlock, Table, StandardFonts } from '@bonniepdf/core';

/**
 * A confidential financial report with a faint red CONFIDENTIAL watermark on
 * every page, authored through the options-object front door. The watermark is a
 * nested `watermark` literal on `settings`; colours are tokens/hex and the table
 * border uses the `{ width, color }` sugar.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 60,
      conformance: 'pdf/a-2b',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-600' },
      watermark: { text: 'CONFIDENTIAL', fontSize: 60, color: '#ff0000', opacity: 0.08, rotationDegrees: -55 },
    },
    metadata: {
      title: 'Confidential Report',
      author: 'BonniePDF',
    },
  });

  const year = new Date().getFullYear();

  doc.add(
    new TextBlock(`Financial Performance Report Q4 ${year}`, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: 'slate-800',
      margin: { bottom: 20 },
    })
  );

  const table = new Table({
    columns: [200, 120, 120],
    border: { width: 0.5, color: 'slate-200' },
    cellPadding: 6,
    headerBackgroundColor: 'slate-700',
    headerTextColor: '#ffffff',
  });

  const headerCell = (text: string): TextBlock =>
    new TextBlock(text, { fontName: StandardFonts.HelveticaBold, fontSize: 11 });
  table.addHeader(headerCell('Metric'), headerCell(`Q3 ${year}`), headerCell(`Q4 ${year}`));

  const rows = [
    ['Revenue', '$4.2M', '$5.1M'],
    ['Operating Costs', '$2.8M', '$2.9M'],
    ['Net Profit', '$1.4M', '$2.2M'],
    ['Headcount', '142', '158'],
    ['Customer Growth', '+12%', '+18%'],
  ];

  const cell = (text: string): TextBlock => new TextBlock(text, { fontName: StandardFonts.Helvetica, fontSize: 11 });
  for (const [metric, q3, q4] of rows) {
    table.addRow(cell(metric), cell(q3), cell(q4));
  }

  doc.add(table);

  doc.add(
    new TextBlock(
      'This report contains proprietary financial data and is intended solely for ' +
        'authorised recipients. Unauthorised disclosure or distribution is prohibited.',
      { fontName: StandardFonts.TimesItalic, fontSize: 10, color: 'slate-500', margin: { top: 20 } }
    )
  );

  return doc;
}
