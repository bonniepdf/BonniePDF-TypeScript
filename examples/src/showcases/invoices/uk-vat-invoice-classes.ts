// ── UK VAT invoice ───────────────────────────────────────────────────────────
//
// An HMRC-style VAT invoice. Post-Brexit the UK runs its own VAT regime, and a
// valid VAT invoice must show the supplier's VAT registration number, a tax
// point (supply date), and - crucially - a VAT breakdown by rate. This showcase
// mixes standard-rated (20%), reduced-rated (5%), and zero-rated (0%) lines and
// summarises the net / VAT / gross per rate, the way UK accounting software does.
// GBP throughout; fictional company data.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  TextStyle,
  PdfAConformance,
} from '@bonniepdf/core';
import { cell, money, lines, labelled, totalLine, divider, accentBar, INK, MUTED, HEADER_BG, RULE } from './_kit';

const ACCENT = ColorPalette.rose[700]; // British racing-adjacent claret
const GBP = '£';

interface UkLine {
  description: string;
  qty: number;
  unitPrice: number;
  vatRate: number; // 0.20 | 0.05 | 0
  rateLabel: string;
}

const ITEMS: UkLine[] = [
  { description: 'Consultancy services (May 2025)', qty: 12, unitPrice: 480, vatRate: 0.2, rateLabel: 'S' },
  { description: 'On-site installation', qty: 1, unitPrice: 1250, vatRate: 0.2, rateLabel: 'S' },
  { description: "Children's safety equipment", qty: 40, unitPrice: 18.5, vatRate: 0.05, rateLabel: 'R' },
  { description: 'Printed training manuals', qty: 200, unitPrice: 3.25, vatRate: 0, rateLabel: 'Z' },
];

/**
 * The **class / construct-then-mutate** companion to `uk-vat-invoice.ts`.
 *
 * Same UK VAT invoice, authored the long way: `new` each element and assign
 * properties, added directly with `doc.add(...)` (no redundant parent
 * VerticalStack). Shares the `_kit` building blocks. Renders **byte-for-byte
 * identically** to the options-style `uk-vat-invoice.ts`.
 */
export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const settings = new DocumentSettings(PdfSize.a4, 44);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(INK);

  const metadata = new DocumentMetadata();
  metadata.title = `VAT Invoice INV-UK-${year}-0311`;
  metadata.author = 'Sample Company Ltd';
  metadata.subject = 'UK VAT invoice with a per-rate VAT breakdown (standard, reduced, zero).';

  const doc = new Document(settings, metadata);
  doc.add(accentBar(ACCENT));

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Grid(1.3, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  header.margin = new Thickness(0, 16, 0, 18);
  const seller = new VerticalStack();
  seller.add(cell('Sample Company Ltd', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) }));
  seller.add(lines(['Unit 7, Kingswood Business Park', 'Bristol BS15 8NY', 'United Kingdom'], { color: MUTED }));
  seller.add(cell('VAT Reg. No. GB 218 4471 09', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }));
  seller.add(cell('Company No. 09182773 (England & Wales)', { size: 8, color: MUTED }));
  const title = new Heading('VAT INVOICE');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.color = ACCENT;
  title.alignment = TextAlignment.Right;
  const titleStack = new VerticalStack();
  titleStack.add(title);
  titleStack.add(
    cell(`INV-UK-${year}-0311`, { color: MUTED, align: TextAlignment.Right, margin: new Thickness(0, 2, 0, 0) })
  );
  header.addRow(seller, titleStack);
  doc.add(header);

  // ── Customer + tax point ──────────────────────────────────────────────────
  const meta = new Grid(1, 1);
  meta.cellPadding = 12;
  meta.border = new Border(0.5);
  meta.borderColors = new BorderColors(RULE);
  meta.margin = new Thickness(0, 0, 0, 18);
  const customer = labelled(
    'INVOICE TO',
    lines(['Sample Customer PLC', 'Finance Department', '4 Waterfront Square', 'Cardiff CF10 4PA'], {
      color: MUTED,
    }),
    ACCENT
  );
  const detailsStack = new VerticalStack();
  detailsStack.add(totalLine('Invoice date', fmt.format(now)));
  detailsStack.add(totalLine('Tax point', fmt.format(now)));
  detailsStack.add(totalLine('Customer VAT no.', 'GB 442 8810 21'));
  detailsStack.add(totalLine('Payment terms', '30 days'));
  meta.addRow(customer, labelled('DETAILS', detailsStack, ACCENT));
  doc.add(meta);

  // ── Line items (with VAT-rate column) ──────────────────────────────────────
  const table = new Table(3, 0.6, 1, 0.7, 1);
  table.cellPadding = 8;
  table.border = Border.none;
  table.headerBackgroundColor = HEADER_BG;
  table.headerTextColor = INK;
  table.addHeader(
    cell('Description', { bold: true }),
    cell('Qty', { bold: true, align: TextAlignment.Center }),
    cell('Unit price', { bold: true, align: TextAlignment.Right }),
    cell('VAT', { bold: true, align: TextAlignment.Center }),
    cell('Net amount', { bold: true, align: TextAlignment.Right })
  );

  // Accumulate net and VAT per rate for the summary block.
  const byRate = new Map<number, { label: string; net: number }>();
  let netTotal = 0;
  for (const it of ITEMS) {
    const net = it.qty * it.unitPrice;
    netTotal += net;
    const bucket = byRate.get(it.vatRate) ?? { label: rateName(it.vatRate), net: 0 };
    bucket.net += net;
    byRate.set(it.vatRate, bucket);
    table.addRow(
      cell(it.description),
      cell(String(it.qty), { align: TextAlignment.Center }),
      cell(money(it.unitPrice, GBP, 'en-GB'), { align: TextAlignment.Right }),
      cell(it.rateLabel, { align: TextAlignment.Center, color: MUTED }),
      cell(money(net, GBP, 'en-GB'), { align: TextAlignment.Right })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── VAT summary by rate (the defining feature of a UK VAT invoice) ─────────
  const summary = new Table(1.4, 1, 1, 1);
  summary.cellPadding = 7;
  summary.border = new Border(0.5);
  summary.borderColors = new BorderColors(RULE);
  summary.headerBackgroundColor = HEADER_BG;
  summary.headerTextColor = INK;
  summary.margin = new Thickness(0, 10, 0, 0);
  summary.addHeader(
    cell('VAT rate', { bold: true }),
    cell('Net', { bold: true, align: TextAlignment.Right }),
    cell('VAT', { bold: true, align: TextAlignment.Right }),
    cell('Gross', { bold: true, align: TextAlignment.Right })
  );
  let vatTotal = 0;
  const rates = [...byRate.entries()].sort((a, b) => b[0] - a[0]);
  for (const [rate, bucket] of rates) {
    const vat = bucket.net * rate;
    vatTotal += vat;
    summary.addRow(
      cell(bucket.label),
      cell(money(bucket.net, GBP, 'en-GB'), { align: TextAlignment.Right }),
      cell(money(vat, GBP, 'en-GB'), { align: TextAlignment.Right }),
      cell(money(bucket.net + vat, GBP, 'en-GB'), { align: TextAlignment.Right })
    );
  }
  doc.add(summary);

  // ── Grand total ────────────────────────────────────────────────────────────
  const totals = new VerticalStack();
  totals.add(totalLine('Total net', money(netTotal, GBP, 'en-GB')));
  totals.add(totalLine('Total VAT', money(vatTotal, GBP, 'en-GB')));
  totals.add(divider(INK, 0.6));
  totals.add(
    totalLine('Total due (GBP)', money(netTotal + vatTotal, GBP, 'en-GB'), { bold: true, size: 13, color: ACCENT })
  );
  const totalsBox = new Container();
  totalsBox.child = totals;
  totalsBox.padding = new Thickness(14, 12, 14, 12);
  totalsBox.backgroundColor = ColorPalette.rose[50];
  totalsBox.cornerRadius = 8;
  const totalsRow = new HorizontalStack();
  totalsRow.widthDistribution = WidthDistribution.Weighted;
  totalsRow.margin = new Thickness(0, 10, 0, 0);
  totalsRow.add(new Container(), 1);
  totalsRow.add(totalsBox, 1);
  doc.add(totalsRow);

  const key = cell('S = Standard 20%   ·   R = Reduced 5%   ·   Z = Zero-rated 0%', {
    size: 8,
    color: MUTED,
    margin: new Thickness(0, 20, 0, 0),
  });
  doc.add(key);

  return doc;
}

function rateName(rate: number): string {
  if (rate === 0.2) return 'Standard (20%)';
  if (rate === 0.05) return 'Reduced (5%)';
  if (rate === 0) return 'Zero-rated (0%)';
  return `${(rate * 100).toFixed(0)}%`;
}
