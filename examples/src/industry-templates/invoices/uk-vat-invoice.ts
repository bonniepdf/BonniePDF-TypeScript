/**
 * UK VAT Invoice.
 * An HMRC-style VAT invoice: supplier VAT number, tax point, standard, reduced, and zero-rated lines, and a per-rate VAT summary (net, VAT, gross) in GBP.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  Svg,
  ColorPalette,
  Thickness,
  StandardFonts,
  TextBlock,
  TextAlignment,
  Color,
  WidthDistribution,
  type IElement,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const LOGO_ASSET = 'images/svg/sample-company.svg';
const FALLBACK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect x="2" y="2" width="44" height="44" rx="10" fill="#334155"/>
  <path d="M31 15.5c0-2.5-2.8-4.5-7-4.5-4.4 0-7.5 2.2-7.5 5.5 0 3.1 2.4 4.7 6.8 5.7l2.2.5c2.5.6 3.8 1.5 3.8 3.1 0 1.9-1.9 3.2-4.8 3.2-3.1 0-5.2-1.4-5.6-3.5h-4.4c.4 4.5 4.2 7.5 10 7.5 5.6 0 9.2-2.9 9.2-7.1 0-3.5-2.4-5.4-7.2-6.5l-2.2-.5c-2.2-.5-3.4-1.3-3.4-2.7 0-1.6 1.5-2.7 3.9-2.7 2.4 0 4 1.1 4.3 2.5H31z" fill="#f8fafc"/>
  <circle cx="35.5" cy="34.5" r="2.5" fill="#94a3b8"/>
</svg>`;

function logoMarkup(assets?: ReadonlyMap<string, Uint8Array>): string {
  const bytes = assets?.get(LOGO_ASSET);
  return bytes ? new TextDecoder().decode(bytes) : FALLBACK_LOGO_SVG;
}

const INK = ColorPalette.slate[700];

// 600, not 500: reads against tinted panels in the invoices that use it, and 500
// falls to 4.35-4.38:1 there against the 4.5:1 WCAG AA threshold.
const MUTED = ColorPalette.slate[600];

const HEADER_BG = ColorPalette.slate[100];

const RULE = ColorPalette.slate[200];

// ── UK VAT invoice ───────────────────────────────────────────────────────────
//
// An HMRC-style VAT invoice. Post-Brexit the UK runs its own VAT regime, and a
// valid VAT invoice must show the supplier's VAT registration number, a tax
// point (supply date), and - crucially - a VAT breakdown by rate. This examples
// mixes standard-rated (20%), reduced-rated (5%), and zero-rated (0%) lines and
// summarises the net / VAT / gross per rate, the way UK accounting software does.
// GBP throughout; fictional company data.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...). Includes its own formatting helpers below.

const ACCENT = ColorPalette.rose[700]; // British racing-adjacent claret
const GBP = '£';

const ITEMS: UkLine[] = [
  { description: 'Consultancy services (May 2025)', qty: 12, unitPrice: 480, vatRate: 0.2, rateLabel: 'S' },
  { description: 'On-site installation', qty: 1, unitPrice: 1250, vatRate: 0.2, rateLabel: 'S' },
  { description: "Children's safety equipment", qty: 40, unitPrice: 18.5, vatRate: 0.05, rateLabel: 'R' },
  { description: 'Printed training manuals', qty: 200, unitPrice: 3.25, vatRate: 0, rateLabel: 'Z' },
];

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
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
      new HorizontalStack({
        widthDistribution: 'auto',
        spacing: 8,
        margin: { bottom: 4 },
        children: [
          new Svg({ svgData: logoMarkup(assets), width: 26, height: 26, isDecorative: true }),
          cell('Sample Company Ltd', { bold: true, size: 16, color: INK, margin: new Thickness(0, 4, 0, 0) }),
        ],
      }),
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

// Local helpers and sample types used by this document.

interface UkLine {
  description: string;
  qty: number;
  unitPrice: number;
  vatRate: number; // 0.20 | 0.05 | 0
  rateLabel: string;
}

function rateName(rate: number): string {
  if (rate === 0.2) return 'Standard (20%)';
  if (rate === 0.05) return 'Reduced (5%)';
  if (rate === 0) return 'Zero-rated (0%)';
  return `${(rate * 100).toFixed(0)}%`;
}

// Local helpers keep this example ready to copy into a single file.

interface CellOpts {
  size?: number;
  bold?: boolean;
  color?: Color;
  /** Text alignment. Accepts the `TextAlignment` enum or a token (`'left'`, `'right'`, …). */
  align?: TextAlignmentInput;
  margin?: Thickness;
}

/** A styled text cell with invoice-friendly defaults (9pt Helvetica, slate ink). */
function cell(text: string, o: CellOpts = {}): TextBlock {
  const b = new TextBlock(text);
  b.fontName = o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = o.size ?? 9;
  b.color = o.color ?? INK;
  if (o.align) b.alignment = o.align;
  if (o.margin) b.margin = o.margin;
  return b;
}

/** A right-aligned monetary cell using the region's symbol and locale. */
function money(value: number, symbol: string, locale = 'en-US'): string {
  return symbol + value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** A block of plain text lines, e.g. a postal address. A single TextBlock
 * using hard `\n` breaks, so the block tags as one paragraph under PDF/UA. */
function lines(items: string[], o: CellOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
}

/** A labelled block: a bold eyebrow label over a body stack, returned in a
 * Container so callers can add padding/background to the block. */
function labelled(label: string, body: IElement, accent: Color): Container {
  const stack = new VerticalStack();
  stack.add(cell(label, { bold: true, size: 8, color: accent, margin: new Thickness(0, 0, 0, 5) }));
  stack.add(body);
  const box = new Container();
  box.child = stack;
  return box;
}

/** A single "label ....... value" totals line, weighted so the value hugs the right edge. */
function totalLine(
  label: string,
  value: string,
  o: { bold?: boolean; size?: number; color?: Color } = {}
): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 3, 0, 3);
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: TextAlignment.Right }), 2);
  return row;
}

/** A thin horizontal divider used between totals and the grand total. */
function divider(color: Color = INK, thickness = 0.6): Container {
  const d = new Container();
  d.backgroundColor = color;
  d.height = thickness;
  d.margin = new Thickness(0, 5, 0, 5);
  return d;
}

/** A full-width coloured accent bar - the top rule that anchors each invoice. */
function accentBar(color: Color, height = 5): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  return bar;
}
