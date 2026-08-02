// ── US sales-tax invoice ─────────────────────────────────────────────────────
//
// The United States has no national VAT/GST and no e-invoicing mandate; instead
// sales tax is levied per state (and often per county/city) on the taxable
// subtotal. This showcase renders a clean commercial invoice in that idiom: a
// destination-based state + county sales-tax breakdown, a purchase-order
// reference, USD amounts, and a remittance line. Fictional data throughout.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  TextStyle,
  PdfAConformance,
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

/**
 * The **class / construct-then-mutate** companion to `us-sales-invoice.ts`.
 *
 * Same US sales-tax invoice, authored the long way: `new` each element and
 * assign properties, added directly with `doc.add(...)` (no redundant parent
 * VerticalStack). Shares the `_kit` building blocks. This is the escape hatch
 * the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `us-sales-invoice.ts` (an equivalence test binds the two).
 */
export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const due = new Date(now.getTime() + 30 * 86400000);

  const settings = new DocumentSettings(PdfSize.a4, 44);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-US';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(INK);

  const metadata = new DocumentMetadata();
  metadata.title = `Invoice INV-US-${year}-0148`;
  metadata.author = 'Sample Company Inc.';
  metadata.subject = 'US commercial invoice with destination-based state and county sales tax.';

  const doc = new Document(settings, metadata);

  doc.add(accentBar(ACCENT));

  // ── Header: seller | INVOICE ────────────────────────────────────────────
  const header = new Grid(1.3, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  header.margin = new Thickness(0, 16, 0, 18);
  const seller = new VerticalStack();
  seller.addChild(cell('Sample Company Inc.', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) }));
  seller.addChild(
    lines(['500 Market Street, Suite 1200', 'San Francisco, CA 94105', 'EIN 47-0912288'], { color: MUTED })
  );
  const title = new Heading('INVOICE');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 26;
  title.textColor = ACCENT;
  title.alignment = TextAlignment.Right;
  const titleStack = new VerticalStack();
  titleStack.addChild(title);
  titleStack.addChild(
    cell(`INV-US-${year}-0148`, { color: MUTED, align: TextAlignment.Right, margin: new Thickness(0, 2, 0, 0) })
  );
  header.addRow(seller, titleStack);
  doc.add(header);

  // ── Bill-to + details ────────────────────────────────────────────────────
  const meta = new Grid(1, 1);
  meta.cellPadding = 12;
  meta.border = new Border(0.5);
  meta.borderColors = new BorderColors(RULE);
  meta.margin = new Thickness(0, 0, 0, 18);
  const billTo = labelled(
    'BILL TO',
    lines(['Sample Customer LLC', 'Accounts Payable', '18 Pioneer Square', 'Seattle, WA 98104'], { color: MUTED }),
    ACCENT
  );
  const detailsStack = new VerticalStack();
  detailsStack.addChild(totalLine('Invoice date', fmt.format(now)));
  detailsStack.addChild(totalLine('Due date (Net 30)', fmt.format(due)));
  detailsStack.addChild(totalLine('Purchase order', 'PO-88213'));
  detailsStack.addChild(totalLine('Ship to', 'Seattle, WA'));
  meta.addRow(billTo, labelled('DETAILS', detailsStack, ACCENT));
  doc.add(meta);

  // ── Line items ────────────────────────────────────────────────────────────
  const table = new Table(3, 0.7, 1, 1);
  table.cellPadding = 8;
  table.border = Border.none;
  table.headerBackgroundColor = HEADER_BG;
  table.headerTextColor = INK;
  table.addHeader(
    cell('Description', { bold: true }),
    cell('Qty', { bold: true, align: TextAlignment.Center }),
    cell('Unit price', { bold: true, align: TextAlignment.Right }),
    cell('Amount', { bold: true, align: TextAlignment.Right })
  );
  let subtotal = 0;
  for (const it of ITEMS) {
    const amount = it.qty * it.unitPrice;
    subtotal += amount;
    const desc = new VerticalStack();
    desc.addChild(cell(it.description));
    if (it.detail) desc.addChild(cell(it.detail, { size: 8, color: MUTED }));
    table.addRow(
      desc,
      cell(String(it.qty), { align: TextAlignment.Center }),
      cell(money(it.unitPrice, USD), { align: TextAlignment.Right }),
      cell(money(amount, USD), { align: TextAlignment.Right })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── Totals: sales tax is state + county on the taxable subtotal ─────────
  const stateTax = subtotal * STATE_TAX_RATE;
  const countyTax = subtotal * COUNTY_TAX_RATE;
  const total = subtotal + stateTax + countyTax;

  const totals = new VerticalStack();
  totals.addChild(totalLine('Subtotal', money(subtotal, USD)));
  totals.addChild(totalLine('CA state sales tax (6.25%)', money(stateTax, USD)));
  totals.addChild(totalLine('King County district tax (2.25%)', money(countyTax, USD)));
  totals.addChild(divider(INK, 0.6));
  totals.addChild(totalLine('Total due (USD)', money(total, USD), { bold: true, size: 13, color: ACCENT }));

  const totalsBox = new Container();
  totalsBox.child = totals;
  totalsBox.padding = new Thickness(14, 12, 14, 12);
  totalsBox.backgroundColor = ColorPalette.blue[50];
  totalsBox.cornerRadius = 8;
  const totalsRow = new HorizontalStack();
  totalsRow.widthDistribution = WidthDistribution.Weighted;
  totalsRow.margin = new Thickness(0, 6, 0, 0);
  totalsRow.addChild(new Container(), 1);
  totalsRow.addChild(totalsBox, 1);
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
