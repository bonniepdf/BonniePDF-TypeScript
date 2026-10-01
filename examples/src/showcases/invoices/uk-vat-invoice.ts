// ── UK VAT invoice ───────────────────────────────────────────────────────────
//
// An HMRC-style VAT invoice. Post-Brexit the UK runs its own VAT regime, and a
// valid VAT invoice must show the supplier's VAT registration number, a tax
// point (supply date), and - crucially - a VAT breakdown by rate. This showcase
// mixes standard-rated (20%), reduced-rated (5%), and zero-rated (0%) lines and
// summarises the net / VAT / gross per rate, the way UK accounting software does.
// GBP throughout; fictional company data.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...). Shares the _kit building blocks with the sibling invoices.

import {
  Document,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  ColorPalette,
  Thickness,
  StandardFonts,
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

export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
    },
    metadata: {
      title: `VAT Invoice INV-UK-${year}-0311`,
      author: 'Sample Company Ltd',
      subject: 'UK VAT invoice with a per-rate VAT breakdown (standard, reduced, zero).',
    },
  });

  doc.add(accentBar(ACCENT));

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Grid({ columns: [1.3, 1], cellPadding: 0, border: 0, margin: { top: 16, bottom: 18 } });
  const seller = new VerticalStack({
    children: [
      cell('Sample Company Ltd', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) }),
      lines(['Unit 7, Kingswood Business Park', 'Bristol BS15 8NY', 'United Kingdom'], { color: MUTED }),
      cell('VAT Reg. No. GB 218 4471 09', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }),
      cell('Company No. 09182773 (England & Wales)', { size: 8, color: MUTED }),
    ],
  });
  const titleStack = new VerticalStack({
    children: [
      new Heading('VAT INVOICE', {
        level: 1,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 24,
        color: ACCENT,
        alignment: 'right',
      }),
      cell(`INV-UK-${year}-0311`, { color: MUTED, align: 'right', margin: new Thickness(0, 2, 0, 0) }),
    ],
  });
  header.addRow(seller, titleStack);
  doc.add(header);

  // ── Customer + tax point ──────────────────────────────────────────────────
  const meta = new Grid({
    columns: [1, 1],
    cellPadding: 12,
    border: { width: 0.5, color: RULE },
    margin: { bottom: 18 },
  });
  const customer = labelled(
    'INVOICE TO',
    lines(['Sample Customer PLC', 'Finance Department', '4 Waterfront Square', 'Cardiff CF10 4PA'], { color: MUTED }),
    ACCENT
  );
  const detailsStack = new VerticalStack({
    children: [
      totalLine('Invoice date', fmt.format(now)),
      totalLine('Tax point', fmt.format(now)),
      totalLine('Customer VAT no.', 'GB 442 8810 21'),
      totalLine('Payment terms', '30 days'),
    ],
  });
  meta.addRow(customer, labelled('DETAILS', detailsStack, ACCENT));
  doc.add(meta);

  // ── Line items (with VAT-rate column) ──────────────────────────────────────
  const table = new Table({
    columns: [3, 0.6, 1, 0.7, 1],
    cellPadding: 8,
    border: 0,
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
  });
  table.addHeader(
    cell('Description', { bold: true }),
    cell('Qty', { bold: true, align: 'center' }),
    cell('Unit price', { bold: true, align: 'right' }),
    cell('VAT', { bold: true, align: 'center' }),
    cell('Net amount', { bold: true, align: 'right' })
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
      cell(String(it.qty), { align: 'center' }),
      cell(money(it.unitPrice, GBP, 'en-GB'), { align: 'right' }),
      cell(it.rateLabel, { align: 'center', color: MUTED }),
      cell(money(net, GBP, 'en-GB'), { align: 'right' })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── VAT summary by rate (the defining feature of a UK VAT invoice) ─────────
  const summary = new Table({
    columns: [1.4, 1, 1, 1],
    cellPadding: 7,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
    margin: { top: 10 },
  });
  summary.addHeader(
    cell('VAT rate', { bold: true }),
    cell('Net', { bold: true, align: 'right' }),
    cell('VAT', { bold: true, align: 'right' }),
    cell('Gross', { bold: true, align: 'right' })
  );
  let vatTotal = 0;
  const rates = [...byRate.entries()].sort((a, b) => b[0] - a[0]);
  for (const [rate, bucket] of rates) {
    const vat = bucket.net * rate;
    vatTotal += vat;
    summary.addRow(
      cell(bucket.label),
      cell(money(bucket.net, GBP, 'en-GB'), { align: 'right' }),
      cell(money(vat, GBP, 'en-GB'), { align: 'right' }),
      cell(money(bucket.net + vat, GBP, 'en-GB'), { align: 'right' })
    );
  }
  doc.add(summary);

  // ── Grand total ────────────────────────────────────────────────────────────
  const totals = new VerticalStack({
    children: [
      totalLine('Total net', money(netTotal, GBP, 'en-GB')),
      totalLine('Total VAT', money(vatTotal, GBP, 'en-GB')),
      divider(INK, 0.6),
      totalLine('Total due (GBP)', money(netTotal + vatTotal, GBP, 'en-GB'), { bold: true, size: 13, color: ACCENT }),
    ],
  });
  const totalsBox = new Container({
    child: totals,
    padding: [14, 12],
    backgroundColor: ColorPalette.rose[50],
    cornerRadius: 8,
  });
  const totalsRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 10 } });
  totalsRow.add(new Container(), 1);
  totalsRow.add(totalsBox, 1);
  doc.add(totalsRow);

  doc.add(
    cell('S = Standard 20%   ·   R = Reduced 5%   ·   Z = Zero-rated 0%', {
      size: 8,
      color: MUTED,
      margin: new Thickness(0, 20, 0, 0),
    })
  );

  return doc;
}

function rateName(rate: number): string {
  if (rate === 0.2) return 'Standard (20%)';
  if (rate === 0.05) return 'Reduced (5%)';
  if (rate === 0) return 'Zero-rated (0%)';
  return `${(rate * 100).toFixed(0)}%`;
}
