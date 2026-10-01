// ── US sales-tax invoice ─────────────────────────────────────────────────────
//
// The United States has no national VAT/GST and no e-invoicing mandate; instead
// sales tax is levied per state (and often per county/city) on the taxable
// subtotal. This showcase renders a clean commercial invoice in that idiom: a
// destination-based state + county sales-tax breakdown, a purchase-order
// reference, USD amounts, and a remittance line. Fictional data throughout.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...) (the document already flows vertically). Shares the _kit
// building blocks with the sibling regional invoices.

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
import {
  cell,
  money,
  lines,
  labelled,
  totalLine,
  divider,
  accentBar,
  INK,
  MUTED,
  HEADER_BG,
  RULE,
  type LineItem,
} from './_kit';

const ACCENT = ColorPalette.blue[700]; // corporate US blue
const USD = '$';

const ITEMS: LineItem[] = [
  { description: 'Managed cloud hosting', detail: 'Production tier, monthly', qty: 1, unitPrice: 2400 },
  { description: 'Platform engineering', detail: 'Senior rate', qty: 48, unitPrice: 185 },
  { description: 'Onboarding & training', detail: 'Two half-day sessions', qty: 2, unitPrice: 950 },
  { description: 'Priority support', detail: 'Annual retainer (prorated)', qty: 1, unitPrice: 1800 },
];

const STATE_TAX_RATE = 0.0625; // CA statewide
const COUNTY_TAX_RATE = 0.0225; // district add-on

export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const due = new Date(now.getTime() + 30 * 86400000);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-US',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
    },
    metadata: {
      title: `Invoice INV-US-${year}-0148`,
      author: 'Sample Company Inc.',
      subject: 'US commercial invoice with destination-based state and county sales tax.',
    },
  });

  doc.add(accentBar(ACCENT));

  // ── Header: seller | INVOICE ────────────────────────────────────────────
  const header = new Grid({ columns: [1.3, 1], cellPadding: 0, border: 0, margin: { top: 16, bottom: 18 } });
  const seller = new VerticalStack({
    children: [
      cell('Sample Company Inc.', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) }),
      lines(['500 Market Street, Suite 1200', 'San Francisco, CA 94105', 'EIN 47-0912288'], { color: MUTED }),
    ],
  });
  const titleStack = new VerticalStack({
    children: [
      new Heading('INVOICE', {
        level: 1,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 26,
        color: ACCENT,
        alignment: 'right',
      }),
      cell(`INV-US-${year}-0148`, { color: MUTED, align: 'right', margin: new Thickness(0, 2, 0, 0) }),
    ],
  });
  header.addRow(seller, titleStack);
  doc.add(header);

  // ── Bill-to + details ────────────────────────────────────────────────────
  const meta = new Grid({
    columns: [1, 1],
    cellPadding: 12,
    border: { width: 0.5, color: RULE },
    margin: { bottom: 18 },
  });
  const billTo = labelled(
    'BILL TO',
    lines(['Sample Customer LLC', 'Accounts Payable', '18 Pioneer Square', 'Seattle, WA 98104'], { color: MUTED }),
    ACCENT
  );
  const detailsStack = new VerticalStack({
    children: [
      totalLine('Invoice date', fmt.format(now)),
      totalLine('Due date (Net 30)', fmt.format(due)),
      totalLine('Purchase order', 'PO-88213'),
      totalLine('Ship to', 'Seattle, WA'),
    ],
  });
  meta.addRow(billTo, labelled('DETAILS', detailsStack, ACCENT));
  doc.add(meta);

  // ── Line items ────────────────────────────────────────────────────────────
  const table = new Table({
    columns: [3, 0.7, 1, 1],
    cellPadding: 8,
    border: 0,
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
  });
  table.addHeader(
    cell('Description', { bold: true }),
    cell('Qty', { bold: true, align: 'center' }),
    cell('Unit price', { bold: true, align: 'right' }),
    cell('Amount', { bold: true, align: 'right' })
  );
  let subtotal = 0;
  for (const it of ITEMS) {
    const amount = it.qty * it.unitPrice;
    subtotal += amount;
    const desc = new VerticalStack({
      children: it.detail ? [cell(it.description), cell(it.detail, { size: 8, color: MUTED })] : [cell(it.description)],
    });
    table.addRow(
      desc,
      cell(String(it.qty), { align: 'center' }),
      cell(money(it.unitPrice, USD), { align: 'right' }),
      cell(money(amount, USD), { align: 'right' })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── Totals: sales tax is state + county on the taxable subtotal ─────────
  const stateTax = subtotal * STATE_TAX_RATE;
  const countyTax = subtotal * COUNTY_TAX_RATE;
  const total = subtotal + stateTax + countyTax;

  const totals = new VerticalStack({
    children: [
      totalLine('Subtotal', money(subtotal, USD)),
      totalLine('CA state sales tax (6.25%)', money(stateTax, USD)),
      totalLine('King County district tax (2.25%)', money(countyTax, USD)),
      divider(INK, 0.6),
      totalLine('Total due (USD)', money(total, USD), { bold: true, size: 13, color: ACCENT }),
    ],
  });

  const totalsBox = new Container({
    child: totals,
    padding: [14, 12],
    backgroundColor: ColorPalette.blue[50],
    cornerRadius: 8,
  });
  const totalsRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 6 } });
  totalsRow.add(new Container(), 1);
  totalsRow.add(totalsBox, 1);
  doc.add(totalsRow);

  // ── Remittance note ─────────────────────────────────────────────────────
  const note = labelled(
    'REMITTANCE',
    lines(
      [
        'Please reference invoice INV-US-0148 and PO-88213 with payment.',
        'ACH: Routing 121000248  ·  Account ****4471  ·  Sample Company Inc.',
        'Checks payable to Sample Company Inc., 500 Market Street, San Francisco, CA 94105.',
      ],
      { size: 8, color: MUTED }
    ),
    ACCENT
  );
  note.padding = new Thickness(0, 22, 0, 0);
  doc.add(note);

  return doc;
}
