/**
 * US Sales-Tax Invoice.
 * A US commercial invoice: a destination-based state and county sales-tax breakdown, a purchase-order reference, USD amounts, and ACH/check remittance.
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

const INK = ColorPalette.slate[700];

// 600, not 500: reads against tinted panels in the invoices that use it, and 500
// falls to 4.35-4.38:1 there against the 4.5:1 WCAG AA threshold.
const MUTED = ColorPalette.slate[600];

const HEADER_BG = ColorPalette.slate[100];

const RULE = ColorPalette.slate[200];

// ── US sales-tax invoice ─────────────────────────────────────────────────────
//
// The United States has no national VAT/GST and no e-invoicing mandate; instead
// sales tax is levied per state (and often per county/city) on the taxable
// subtotal. This examples renders a clean commercial invoice in that idiom: a
// destination-based state + county sales-tax breakdown, a purchase-order
// reference, USD amounts, and a remittance line. Fictional data throughout.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...) (the document already flows vertically). Formatting helpers
// are included below the document-building function.

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

// Local helpers and sample types used by this document.

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

interface LineItem {
  description: string;
  detail?: string;
  qty: number;
  unitPrice: number;
  /** Region tax hint shown in a dedicated column (e.g. VAT rate, HSN code, tax code). */
  taxNote?: string;
}
