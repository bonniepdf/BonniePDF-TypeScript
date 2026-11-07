/**
 * Business Invoice.
 * A US business invoice with company branding, customer addresses, a line-items table, an early-payment discount, and bank and online payment details.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextBlock,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  Svg,
  StandardFonts,
  Placeholders,
  type ColorInput,
  type TextAlignmentInput,
  type ThicknessInput,
} from '@bonniepdf/core';

// ── Brand colors ──────────────────────────────────────────────────────────────
const ACCENT_GREEN = '#0B9444';
// A darker step of ACCENT_GREEN for small/regular text painted in the brand
// colour (headers, labels): ACCENT_GREEN itself only clears 4.5:1 at the 28pt
// bold size of the "Invoice" heading (3.94:1 elsewhere on white, 3.51:1 on
// ACCENT_GREEN_LIGHT) - fine as a large-text accent, not as body-sized text.
const ACCENT_GREEN_TEXT = '#097636';
const ACCENT_GREEN_LIGHT = '#E8F5EC';
const HEADER_GRAY = '#F5F5F5';
const BORDER_GRAY = '#D9D9D9';
const TEXT_DARK = '#333333';
const TEXT_MEDIUM = '#555555';
// #707070, not #888888: 3.54:1 on white, below the 4.5:1 WCAG AA threshold.
const TEXT_LIGHT = '#707070';

const LOGO_ASSET = 'images/svg/sample-company.svg';
const FALLBACK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect x="2" y="2" width="44" height="44" rx="10" fill="#334155"/>
  <path d="M31 15.5c0-2.5-2.8-4.5-7-4.5-4.4 0-7.5 2.2-7.5 5.5 0 3.1 2.4 4.7 6.8 5.7l2.2.5c2.5.6 3.8 1.5 3.8 3.1 0 1.9-1.9 3.2-4.8 3.2-3.1 0-5.2-1.4-5.6-3.5h-4.4c.4 4.5 4.2 7.5 10 7.5 5.6 0 9.2-2.9 9.2-7.1 0-3.5-2.4-5.4-7.2-6.5l-2.2-.5c-2.2-.5-3.4-1.3-3.4-2.7 0-1.6 1.5-2.7 3.9-2.7 2.4 0 4 1.1 4.3 2.5H31z" fill="#f8fafc"/>
  <circle cx="35.5" cy="34.5" r="2.5" fill="#94a3b8"/>
</svg>`;

const usd = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const now = new Date();
  const year = now.getFullYear();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${year}`;
  const dueDate = new Date(now.getTime() + 14 * 86400000);
  const dueDateStr = `${String(dueDate.getMonth() + 1).padStart(2, '0')}/${String(dueDate.getDate()).padStart(2, '0')}/${dueDate.getFullYear()}`;

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 36,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-US',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: TEXT_MEDIUM },
    },
    metadata: {
      title: `Invoice INV-${year}-001`,
      author: 'Sample Company Inc.',
      subject: 'Invoice for design and development services.',
    },
  });

  // The document already flows vertically, so elements are added directly with
  // doc.add(...) - no wrapping parent VerticalStack.

  // ── Green accent bar ──────────────────────────────────────────────────────
  doc.add(bar(ACCENT_GREEN, 8));

  // ── Header: Company | Invoice title ──────────────────────────────────────
  // A single row of two proportional columns → HorizontalStack (weighted). It is
  // a pure layout container, so its children tag themselves in reading order.
  const headerRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 0, margin: { top: 16, bottom: 16 } });

  // The address lines share one style, so they flow as a single paragraph.
  const brandRow = new HorizontalStack({
    widthDistribution: 'auto',
    spacing: 8,
    margin: { bottom: 4 },
    children: [
      new Svg({ svgData: logoMarkup(assets), width: 28, height: 28, isDecorative: true }),
      tb('SAMPLE COMPANY INC.', { bold: true, size: 20, color: TEXT_DARK, mt: 3 }),
    ],
  });
  const companyStack = new VerticalStack({
    children: [brandRow, tb('42 Design District\nBrooklyn, NY 11201\nPhone  (555) 123-4567\nEmail  hello@example.com')],
  });

  // H1 heading - visually identical to a styled TextBlock but carries the
  // semantic role for screen readers (PDF/UA-1 Matterhorn §14-1).
  const titleStack = new VerticalStack({
    children: [
      new Heading('Invoice', {
        level: 1,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 28,
        color: ACCENT_GREEN,
        alignment: 'right',
      }),
    ],
  });

  headerRow.add(companyStack, 1.2);
  headerRow.add(titleStack, 1);
  doc.add(headerRow);

  // ── Bill To / Ship To / Details ───────────────────────────────────────────
  // Each address is one TextBlock with hard line breaks, so it tags as a single
  // paragraph under PDF/UA instead of one per line.
  const address = 'Sample Customer Inc.\nSample Contact\n88 Innovation Way\nAustin, TX 78701';

  const billToStack = new VerticalStack({
    children: [tb('Bill to', { bold: true, color: TEXT_DARK, mb: 4 }), tb(address)],
  });
  const shipToStack = new VerticalStack({
    children: [tb('Ship to', { bold: true, color: TEXT_DARK, mb: 4 }), tb(address)],
  });
  const detailsStack = new VerticalStack({
    children: [
      tb('Details', { bold: true, color: TEXT_DARK, mb: 4 }),
      detailRow('Invoice #', `${year}-001`),
      detailRow('Invoice date', dateStr),
      detailRow('Terms', 'Net 14'),
      detailRow('Due date', dueDateStr),
    ],
  });

  const addressTable = new Grid({
    columns: [1, 1, 1.1],
    cellPadding: 10,
    border: { width: 0.5, color: BORDER_GRAY },
    margin: { bottom: 16 },
  });
  // The stacks drop straight into the grid cells; the cell supplies the padding.
  addressTable.addRow(billToStack, shipToStack, detailsStack);
  doc.add(addressTable);

  // ── Line items table ──────────────────────────────────────────────────────
  const lineItemsTable = new Table({
    columns: [2.2, 2.5, 0.8, 0.8, 1],
    cellPadding: 8,
    border: 0,
    headerBackgroundColor: HEADER_GRAY,
    headerTextColor: TEXT_DARK,
  });

  const headerCell = (text: string, align: TextAlignmentInput): TextBlock =>
    tb(text, { bold: true, color: TEXT_DARK, align });
  lineItemsTable.addHeader(
    headerCell('Product / Service', 'left'),
    headerCell('Description', 'left'),
    headerCell('Qty / Hrs', 'center'),
    headerCell('Rate', 'right'),
    headerCell('Amount', 'right')
  );

  const invoiceSource = Placeholders.withSeed(42);
  const items = invoiceSource.invoiceLines(5);

  let subtotal = 0;
  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;
    lineItemsTable.addRow(
      tb(item.service, { align: 'left' }),
      tb(item.description, { color: TEXT_LIGHT, align: 'left' }),
      tb(String(item.quantity), { align: 'center' }),
      tb(usd(item.unitPrice), { align: 'right' }),
      tb(usd(lineTotal), { color: TEXT_DARK, align: 'right' })
    );
  }
  doc.add(lineItemsTable);

  doc.add(bar(ACCENT_GREEN, 0.75, { bottom: 12 }));

  // ── Footer: message + totals ──────────────────────────────────────────────
  const tax = subtotal * 0.0825;
  const totalDue = subtotal + tax - 1400;

  // The three greeting lines share one style and flow as a single paragraph;
  // "Thanks!" stays separate for its top margin.
  const messageStack = new VerticalStack({
    children: [
      tb('Customer message', { bold: true, color: TEXT_DARK, mb: 4 }),
      tb('Hello!\nThank you for choosing Sample Company.\nPlease return this invoice with payment.'),
      tb('Thanks!', { mt: 4 }),
    ],
  });

  const totalsStack = new VerticalStack({
    children: [
      moneyRow('Subtotal', usd(subtotal)),
      moneyRow('Sales tax (8.25%)', usd(tax)),
      moneyRow('Discount (early payment)', '-$1,400.00', {
        labelColor: ACCENT_GREEN_TEXT,
        valueColor: ACCENT_GREEN_TEXT,
      }),
      bar(TEXT_DARK, 0.5, { top: 4, bottom: 4 }),
      moneyRow('Total', usd(totalDue), { labelColor: TEXT_DARK, valueColor: TEXT_DARK, bold: true, size: 14 }),
    ],
  });

  // messageStack keeps its Container: the right-padding is real styling. totalsStack
  // drops straight into the grid cell.
  const footerTable = new Grid({ columns: [1.3, 1], cellPadding: 0, border: 0 });
  footerTable.addRow(new Container({ child: messageStack, padding: { right: 40 } }), totalsStack);
  doc.add(footerTable);

  // ── Payment details ───────────────────────────────────────────────────────
  const paymentTable = new Grid({ columns: [1, 1, 1], cellPadding: 0, border: 0 });
  paymentTable.addRow(
    paymentColumn('Bank Transfer', 'Sample Bank\nRouting: 021000021\nAccount: ****7842'),
    paymentColumn('Other Methods', 'PayPal: payments@example.com\nWise: @sample-company'),
    paymentColumn('Reference', 'Please include invoice\nnumber with payment')
  );

  doc.add(
    new Container({
      backgroundColor: ACCENT_GREEN_LIGHT,
      padding: [16, 12],
      margin: { top: 20 },
      border: { left: 3, color: ACCENT_GREEN },
      child: paymentTable,
    })
  );

  // ── Footer bar ────────────────────────────────────────────────────────────
  doc.add(bar(ACCENT_GREEN, 0.5, { top: 20 }));
  doc.add(
    tb('Thank you for your business  |  hello@example.com  |  www.example.com', {
      size: 8,
      color: TEXT_LIGHT,
      align: 'center',
      mt: 8,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

// ── Local helpers ───────────────────────────────────────────────────────────
// Small options-object builders: a styled text block plus the repeated
// compositions (a label/value grid row and a payment-method column). Defaults
// match the document's defaultTextStyle (Helvetica 9, TEXT_MEDIUM) so plain body
// text needs no options.

interface TextOpts {
  size?: number;
  color?: ColorInput;
  bold?: boolean;
  align?: TextAlignmentInput;
  mt?: number;
  mb?: number;
}

function tb(content: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(content, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    color: o.color ?? TEXT_MEDIUM,
    alignment: o.align,
    margin: o.mt !== undefined || o.mb !== undefined ? { top: o.mt ?? 0, bottom: o.mb ?? 0 } : undefined,
  });
}

/** A full-width coloured strip (accent bars and dividers). */
function bar(color: ColorInput, thickness: number, margin?: ThicknessInput): Container {
  return new Container({ backgroundColor: color, height: thickness, margin });
}

/** A borderless two-column grid row (used for detail lines and totals). */
function kvRow(left: number, right: number, padding: number, label: TextBlock, value: TextBlock): Grid {
  const g = new Grid({ columns: [left, right], cellPadding: padding, border: 0 });
  g.addRow(label, value);
  return g;
}

/** A bold label + plain value line in the Details column. */
function detailRow(label: string, value: string): Grid {
  return kvRow(0.9, 1, 0, tb(label, { bold: true, color: TEXT_DARK }), tb(value));
}

/** A totals line: left label, right-aligned amount, with per-row colour/weight. */
function moneyRow(
  label: string,
  value: string,
  o: { labelColor?: ColorInput; valueColor?: ColorInput; bold?: boolean; size?: number } = {}
): Grid {
  const size = o.size ?? 9;
  return kvRow(
    1,
    1,
    6,
    tb(label, { size, bold: o.bold, color: o.labelColor ?? TEXT_MEDIUM }),
    tb(value, { size, bold: o.bold, color: o.valueColor ?? TEXT_DARK, align: 'right' })
  );
}

/** A payment-method column: green eyebrow over a multi-line body (one paragraph). */
function paymentColumn(title: string, body: string): VerticalStack {
  return new VerticalStack({
    children: [tb(title, { size: 8, bold: true, color: ACCENT_GREEN_TEXT, mb: 4 }), tb(body, { size: 8 })],
  });
}

function logoMarkup(assets?: ReadonlyMap<string, Uint8Array>): string {
  const bytes = assets?.get(LOGO_ASSET);
  return bytes ? new TextDecoder().decode(bytes) : FALLBACK_LOGO_SVG;
}
