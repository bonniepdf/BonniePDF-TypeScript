// ── Report with Embedded Data (PDF/A-3 with an embedded CSV) ─────────
//
// A PDF/A-3 report that carries its underlying data as an embedded associated
// file. The rendered table is the human-readable view; the same numbers are
// attached as `quarterly-revenue.csv` so downstream tools (or an auditor)
// can consume the exact source data without re-keying it. Demonstrates the generic this feature attachment API.
//
// Validated in CI (.NET side) by veraPDF as PDF/A-3b. Parity peer of the .NET
// AttachedDataExample.

import {
  Document,
  DocumentSettings,
  PdfSize,
  PdfAConformance,
  TextBlock,
  TextAlignment,
  TextStyle,
  Table,
  Border,
  Thickness,
  Color,
  ColorPalette,
  StandardFonts,
  AttachmentRelationship,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[900];
const BODY = ColorPalette.slate[600];
const MUTE = ColorPalette.slate[500];

const ROWS: Array<[string, number, number]> = [
  ['Q1 2026', 412_000, 128],
  ['Q2 2026', 468_500, 141],
  ['Q3 2026', 501_200, 152],
  ['Q4 2026', 559_900, 167],
];

/**
 * The **class / construct-then-mutate** companion to `attached-data.ts`.
 *
 * Same PDF/A-3 report with an embedded CSV, authored the long
 * way: `new` each element and assign properties, using `Border.none`, the
 * `TextAlignment` enum, `TextStyle` and `ColorPalette` directly. The attachment
 * itself uses the same `doc.attach()` call in both variants. This is the escape
 * hatch the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `attached-data.ts` (an equivalence test binds the two). Reach for the options
 * form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.pageSize = PdfSize.a4;
  settings.margin = 48;
  settings.conformance = PdfAConformance.PdfA3b;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(BODY);

  const doc = new Document(settings);
  doc.metadata.title = 'Quarterly revenue 2026';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'PDF/A-3 Report with Embedded Data';

  doc.add(tb('Quarterly revenue - 2026', 18, INK, true, undefined, 4));
  doc.add(tb('The source data for this report is embedded as quarterly-revenue.csv.', 9, MUTE, false, undefined, 16));

  const table = new Table(2, 2, 2);
  table.border = Border.none;
  table.cellPadding = 6;
  // Real tabular data → a proper header row (emits TH cells for assistive tech).
  table.addHeader(
    tb('Quarter', 8, MUTE, true),
    tb('Revenue (EUR)', 8, MUTE, true, TextAlignment.Right),
    tb('Customers', 8, MUTE, true, TextAlignment.Right)
  );
  for (const [quarter, revenue, customers] of ROWS) {
    table.addRow(
      tb(quarter, 10, INK),
      tb(revenue.toLocaleString('en-US'), 10, BODY, false, TextAlignment.Right),
      tb(String(customers), 10, BODY, false, TextAlignment.Right)
    );
  }
  doc.add(table);

  // ── Embed the source data as an attachment ──
  doc.attach({
    fileName: 'quarterly-revenue.csv',
    content: buildCsv(),
    relationship: AttachmentRelationship.Source,
    mediaType: 'text/csv',
    description: 'Source data for the quarterly revenue report',
  });

  return doc;
}

function buildCsv(): Uint8Array {
  let csv = 'quarter,revenue_eur,customers\n';
  for (const [quarter, revenue, customers] of ROWS) {
    csv += `${quarter},${revenue},${customers}\n`;
  }
  return new TextEncoder().encode(csv);
}

function tb(text: string, size: number, color: Color, bold = false, align?: TextAlignment, bottom = 0): TextBlock {
  const t = new TextBlock(text);
  t.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  t.fontSize = size;
  t.textColor = color;
  if (align !== undefined) t.alignment = align;
  if (bottom > 0) t.margin = new Thickness(0, 0, 0, bottom);
  return t;
}
