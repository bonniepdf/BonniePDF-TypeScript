/**
 * Report with Embedded Data.
 * A PDF/A-3 report that carries its source CSV inside the file, so a reader can check the numbers without re-keying them. Built with the general-purpose attachment API.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Report with Embedded Data (PDF/A-3 with an embedded CSV) ─────────
//
// A PDF/A-3 report that carries its underlying data as an embedded associated
// file. The rendered table is the human-readable view; the same numbers are
// attached as `quarterly-revenue.csv` so downstream tools (or an auditor)
// can consume the exact source data without re-keying it. Demonstrates the generic attachment API.
//
// Authored through the options-object front door. Validated in CI (.NET side)
// by veraPDF as PDF/A-3b. Parity peer of the .NET AttachedDataExample.

import {
  Document,
  TextBlock,
  Table,
  StandardFonts,
  AttachmentRelationship,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const INK = 'slate-900';
const BODY = 'slate-600';
const MUTE = 'slate-500';

const ROWS: Array<[string, number, number]> = [
  ['Q1 2026', 412_000, 128],
  ['Q2 2026', 468_500, 141],
  ['Q3 2026', 501_200, 152],
  ['Q4 2026', 559_900, 167],
];

export function generate(): Document {
  // #region settings
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 48,
      conformance: 'pdf/a-3b',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: BODY },
    },
    metadata: {
      title: 'Quarterly revenue 2026',
      author: 'BonniePDF',
      subject: 'PDF/A-3 Report with Embedded Data',
    },
  });
  // #endregion settings

  doc.add(tb('Quarterly revenue - 2026', 18, INK, true, undefined, 4));
  doc.add(tb('The source data for this report is embedded as quarterly-revenue.csv.', 9, MUTE, false, undefined, 16));

  // #region table
  const table = new Table({ columns: [2, 2, 2], border: 0, cellPadding: 6 });
  // Real tabular data → a proper header row (emits TH cells for assistive tech).
  table.addHeader(
    tb('Quarter', 8, MUTE, true),
    tb('Revenue (EUR)', 8, MUTE, true, 'right'),
    tb('Customers', 8, MUTE, true, 'right')
  );
  for (const [quarter, revenue, customers] of ROWS) {
    table.addRow(
      tb(quarter, 10, INK),
      tb(revenue.toLocaleString('en-US'), 10, BODY, false, 'right'),
      tb(String(customers), 10, BODY, false, 'right')
    );
  }
  doc.add(table);
  // #endregion table

  // ── Embed the source data as an attachment ──
  // #region attach
  doc.attach({
    fileName: 'quarterly-revenue.csv',
    content: buildCsv(),
    relationship: AttachmentRelationship.Source,
    mediaType: 'text/csv',
    description: 'Source data for the quarterly revenue report',
  });
  // #endregion attach

  return doc;
}

// Local helpers and sample types used by this document.

function buildCsv(): Uint8Array {
  let csv = 'quarter,revenue_eur,customers\n';
  for (const [quarter, revenue, customers] of ROWS) {
    csv += `${quarter},${revenue},${customers}\n`;
  }
  return new TextEncoder().encode(csv);
}

function tb(
  text: string,
  size: number,
  color: ColorInput,
  bold = false,
  align?: TextAlignmentInput,
  bottom = 0
): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color: color,
    alignment: align,
    margin: bottom > 0 ? { bottom } : undefined,
  });
}
