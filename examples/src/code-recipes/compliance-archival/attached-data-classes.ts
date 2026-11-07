/**
 * Report with Embedded Data (Class API).
 * The same PDF/A-3 report with embedded CSV as Report with Embedded Data, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Report with Embedded Data (PDF/A-3 with an embedded CSV) ─────────
//
// A PDF/A-3 report that carries its underlying data as an embedded associated
// file. The rendered table is the human-readable view; the same numbers are
// attached as `quarterly-revenue.csv` so downstream tools (or an auditor)
// can consume the exact source data without re-keying it. Demonstrates the generic attachment API.
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
  BarChart,
  ChartData,
  ChartDataPoint,
  ChartSeries,
  Container,
  HorizontalStack,
  WidthDistribution,
  BorderColors,
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

  // The same figures as a chart, read from the same rows as the table and the attachment.
  const series = new ChartSeries();
  series.color = ColorPalette.indigo[600];
  series.dataPoints = ROWS.map(([quarter, revenue]) => {
    const point = new ChartDataPoint();
    point.label = quarter;
    point.value = revenue / 1000;
    point.labelFormat = 'N0';
    return point;
  });
  const data = new ChartData();
  data.title = 'Revenue by quarter (EUR thousand)';
  data.series = [series];
  data.yAxis.maxValue = 600;
  data.yAxis.stepCount = 6;
  const chart = new BarChart();
  chart.theme = 'modern';
  chart.data = data;
  chart.altText = 'Bar chart of revenue by quarter in 2026, rising from 412 to 560 thousand euros.';
  chart.height = 240;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.backgroundColor = Color.white;
  chart.margin = new Thickness(0, 18, 0, 18);
  doc.add(chart);

  // A note that names the attachment, so a reader knows the data is there to open.
  const badge = new Container();
  badge.backgroundColor = ColorPalette.indigo[100];
  badge.cornerRadius = 4;
  badge.padding = new Thickness(6, 3, 6, 3);
  badge.child = tb('ATTACHED', 7.5, ColorPalette.indigo[800], true, TextAlignment.Center);
  const noteText = new TextBlock(
    `quarterly-revenue.csv: ${ROWS.length} rows, 3 columns. Open it from your PDF viewer's attachments panel to reuse the exact figures.`
  );
  noteText.fontSize = 9;
  noteText.color = INK;
  const note = new HorizontalStack();
  note.widthDistribution = WidthDistribution.Weighted;
  note.spacing = 12;
  note.add(badge, 1);
  note.add(noteText, 6);
  const panel = new Container();
  panel.backgroundColor = ColorPalette.slate[50];
  panel.border = new Border(0.75);
  panel.borderColors = new BorderColors(ColorPalette.slate[200]);
  panel.cornerRadius = 6;
  panel.padding = new Thickness(14, 10, 14, 10);
  panel.child = note;
  doc.add(panel);

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

// Local helpers and sample types used by this document.

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
  t.color = color;
  if (align !== undefined) t.alignment = align;
  if (bottom > 0) t.margin = new Thickness(0, 0, 0, bottom);
  return t;
}
