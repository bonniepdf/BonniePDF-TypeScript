/**
 * Business Invoice (Class API).
 * The same branded invoice as Business Invoice, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Container,
  Table,
  Grid,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  Placeholders,
  PdfAConformance,
} from '@bonniepdf/core';

// ── Brand colors ──────────────────────────────────────────────────────────────
const ACCENT_GREEN = Color.fromHex('#0B9444');
const ACCENT_GREEN_TEXT = Color.fromHex('#097636');
const ACCENT_GREEN_LIGHT = Color.fromHex('#E8F5EC');
const HEADER_GRAY = Color.fromHex('#F5F5F5');
const BORDER_GRAY = Color.fromHex('#D9D9D9');
const TEXT_DARK = Color.fromHex('#333333');
const TEXT_MEDIUM = Color.fromHex('#555555');
const TEXT_LIGHT = Color.fromHex('#707070');

const usd = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The **class / construct-then-mutate** companion to `business-invoice.ts`.
 *
 * Same branded invoice, authored the long way: `new` each element and assign
 * properties. Elements are added directly with `doc.add(...)` - the document
 * already flows vertically, so no wrapping parent `VerticalStack` is used. This
 * is the escape hatch the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `business-invoice.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${year}`;
  const dueDate = new Date(now.getTime() + 14 * 86400000);
  const dueDateStr = `${String(dueDate.getMonth() + 1).padStart(2, '0')}/${String(dueDate.getDate()).padStart(2, '0')}/${dueDate.getFullYear()}`;

  const settings = new DocumentSettings(PdfSize.a4, 36);
  settings.pageColor = Color.white;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-US';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(TEXT_MEDIUM);

  const metadata = new DocumentMetadata();
  metadata.title = `Invoice INV-${year}-001`;
  metadata.author = 'Sample Company Inc.';
  metadata.subject = 'Invoice for design and development services.';

  const doc = new Document(settings, metadata);

  // ── Green accent bar ──────────────────────────────────────────────────────
  doc.add(bar(ACCENT_GREEN, 8));

  // ── Header: Company | Invoice title ──────────────────────────────────────
  // A single row of two proportional columns → HorizontalStack (weighted). It is
  // a pure layout container, so its children tag themselves in reading order (no
  // table structure), which is exactly right for a header band.
  const headerRow = new HorizontalStack();
  headerRow.widthDistribution = WidthDistribution.Weighted;
  headerRow.spacing = 0;
  headerRow.margin = new Thickness(0, 16, 0, 16);

  // The address lines share one style, so they flow as a single paragraph.
  const companyStack = new VerticalStack();
  companyStack.add(tb('SAMPLE COMPANY INC.', { bold: true, size: 20, color: TEXT_DARK, mb: 4 }));
  companyStack.add(tb('42 Design District\nBrooklyn, NY 11201\nPhone  (555) 123-4567\nEmail  hello@example.com'));

  // H1 heading - visually identical to a styled TextBlock but carries
  // the semantic role for screen readers (PDF/UA-1 Matterhorn §14-1).
  const invoiceTitle = new Heading('Invoice');
  invoiceTitle.level = 1;
  invoiceTitle.fontName = StandardFonts.HelveticaBold;
  invoiceTitle.fontSize = 28;
  invoiceTitle.color = ACCENT_GREEN;
  invoiceTitle.alignment = TextAlignment.Right;
  const titleStack = new VerticalStack();
  titleStack.add(invoiceTitle);

  // A VerticalStack is itself an element, so it goes straight into the row — no
  // wrapping Container needed (an unstyled Container is a pure passthrough).
  headerRow.add(companyStack, 1.2);
  headerRow.add(titleStack, 1);
  doc.add(headerRow);

  // ── Bill To / Ship To / Details ───────────────────────────────────────────
  const addressTable = new Grid(1, 1, 1.1);
  addressTable.cellPadding = 10;
  addressTable.border = new Border(0.5);
  addressTable.borderColors = new BorderColors(BORDER_GRAY);
  addressTable.margin = new Thickness(0, 0, 0, 16);

  // Each address is one TextBlock with hard line breaks, so it tags as a single
  // paragraph under PDF/UA instead of one per line.
  const address = 'Sample Customer Inc.\nSample Contact\n88 Innovation Way\nAustin, TX 78701';

  const billToStack = new VerticalStack();
  billToStack.add(tb('Bill to', { bold: true, color: TEXT_DARK, mb: 4 }));
  billToStack.add(tb(address));

  const shipToStack = new VerticalStack();
  shipToStack.add(tb('Ship to', { bold: true, color: TEXT_DARK, mb: 4 }));
  shipToStack.add(tb(address));

  const detailsStack = new VerticalStack();
  detailsStack.add(tb('Details', { bold: true, color: TEXT_DARK, mb: 4 }));
  detailsStack.add(detailRow('Invoice #', `${year}-001`));
  detailsStack.add(detailRow('Invoice date', dateStr));
  detailsStack.add(detailRow('Terms', 'Net 14'));
  detailsStack.add(detailRow('Due date', dueDateStr));

  // The stacks drop straight into the grid cells; the cell supplies the padding,
  // so extra Container wrappers would add a redundant node for no effect.
  addressTable.addRow(billToStack, shipToStack, detailsStack);
  doc.add(addressTable);

  // ── Line items table ──────────────────────────────────────────────────────
  const lineItemsTable = new Table(2.2, 2.5, 0.8, 0.8, 1);
  lineItemsTable.cellPadding = 8;
  lineItemsTable.border = Border.none;
  lineItemsTable.headerBackgroundColor = HEADER_GRAY;
  lineItemsTable.headerTextColor = TEXT_DARK;
  lineItemsTable.margin = new Thickness(0, 0, 0, 0);

  const headerCell = (text: string, align: TextAlignment): TextBlock =>
    tb(text, { bold: true, color: TEXT_DARK, align });
  lineItemsTable.addHeader(
    headerCell('Product / Service', TextAlignment.Left),
    headerCell('Description', TextAlignment.Left),
    headerCell('Qty / Hrs', TextAlignment.Center),
    headerCell('Rate', TextAlignment.Right),
    headerCell('Amount', TextAlignment.Right)
  );

  const invoiceSource = Placeholders.withSeed(42);
  const items = invoiceSource.invoiceLines(5);

  let subtotal = 0;
  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;
    lineItemsTable.addRow(
      tb(item.service, { align: TextAlignment.Left }),
      tb(item.description, { color: TEXT_LIGHT, align: TextAlignment.Left }),
      tb(String(item.quantity), { align: TextAlignment.Center }),
      tb(usd(item.unitPrice), { align: TextAlignment.Right }),
      tb(usd(lineTotal), { color: TEXT_DARK, align: TextAlignment.Right })
    );
  }
  doc.add(lineItemsTable);

  doc.add(bar(ACCENT_GREEN, 0.75, new Thickness(0, 0, 0, 12)));

  // ── Footer: message + totals ──────────────────────────────────────────────
  const tax = subtotal * 0.0825;
  const totalDue = subtotal + tax - 1400;

  const footerTable = new Grid(1.3, 1);
  footerTable.cellPadding = 0;
  footerTable.border = Border.none;

  // The three greeting lines share one style and flow as a single paragraph;
  // "Thanks!" stays separate for its top margin.
  const messageStack = new VerticalStack();
  messageStack.add(tb('Customer message', { bold: true, color: TEXT_DARK, mb: 4 }));
  messageStack.add(tb('Hello!\nThank you for choosing Sample Company.\nPlease return this invoice with payment.'));
  messageStack.add(tb('Thanks!', { mt: 4 }));

  const totalsStack = new VerticalStack();
  totalsStack.add(moneyRow('Subtotal', usd(subtotal)));
  totalsStack.add(moneyRow('Sales tax (8.25%)', usd(tax)));
  totalsStack.add(
    moneyRow('Discount (early payment)', '-$1,400.00', {
      labelColor: ACCENT_GREEN_TEXT,
      valueColor: ACCENT_GREEN_TEXT,
    })
  );
  totalsStack.add(bar(TEXT_DARK, 0.5, new Thickness(0, 4, 0, 4)));
  totalsStack.add(
    moneyRow('Total', usd(totalDue), { labelColor: TEXT_DARK, valueColor: TEXT_DARK, bold: true, size: 14 })
  );

  // messageStack keeps its Container: the right-padding is real styling. totalsStack
  // drops straight into the grid cell — no wrapper needed.
  const msgContainer = new Container();
  msgContainer.child = messageStack;
  msgContainer.padding = new Thickness(0, 0, 40, 0);
  footerTable.addRow(msgContainer, totalsStack);
  doc.add(footerTable);

  // ── Payment details ───────────────────────────────────────────────────────
  const paymentTable = new Grid(1, 1, 1);
  paymentTable.cellPadding = 0;
  paymentTable.border = Border.none;
  paymentTable.addRow(
    paymentColumn('Bank Transfer', 'Sample Bank\nRouting: 021000021\nAccount: ****7842'),
    paymentColumn('Other Methods', 'PayPal: payments@example.com\nWise: @sample-company'),
    paymentColumn('Reference', 'Please include invoice\nnumber with payment')
  );

  const paymentSection = new Container();
  paymentSection.backgroundColor = ACCENT_GREEN_LIGHT;
  paymentSection.padding = new Thickness(16, 12, 16, 12);
  paymentSection.margin = new Thickness(0, 20, 0, 0);
  paymentSection.border = Border.leftOnly(3);
  paymentSection.borderColors = BorderColors.leftOnly(ACCENT_GREEN);
  paymentSection.child = paymentTable;
  doc.add(paymentSection);

  // ── Footer bar ────────────────────────────────────────────────────────────
  doc.add(bar(ACCENT_GREEN, 0.5, new Thickness(0, 20, 0, 0)));
  doc.add(
    tb('Thank you for your business  |  hello@example.com  |  www.example.com', {
      size: 8,
      color: TEXT_LIGHT,
      align: TextAlignment.Center,
      mt: 8,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

// ── Local helpers ───────────────────────────────────────────────────────────
// Small builders in the style of the sibling invoice exampless: a styled text
// block plus the two repeated compositions (a label/value grid row and a
// payment-method column). Defaults match the document's defaultTextStyle
// (Helvetica 9, TEXT_MEDIUM) so plain body text needs no options.

interface TextOpts {
  size?: number;
  color?: Color;
  bold?: boolean;
  align?: TextAlignment;
  mt?: number;
  mb?: number;
}

function tb(content: string, o: TextOpts = {}): TextBlock {
  const t = new TextBlock(content);
  t.fontName = o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  t.fontSize = o.size ?? 9;
  t.color = o.color ?? TEXT_MEDIUM;
  if (o.align !== undefined) t.alignment = o.align;
  if (o.mt !== undefined || o.mb !== undefined) t.margin = new Thickness(0, o.mt ?? 0, 0, o.mb ?? 0);
  return t;
}

/** A full-width coloured strip (accent bars and dividers). */
function bar(color: Color, thickness: number, margin?: Thickness): Container {
  const c = new Container();
  c.backgroundColor = color;
  c.height = thickness;
  if (margin) c.margin = margin;
  return c;
}

/** A borderless two-column grid row (used for detail lines and totals). */
function kvRow(left: number, right: number, padding: number, label: TextBlock, value: TextBlock): Grid {
  const g = new Grid(left, right);
  g.cellPadding = padding;
  g.border = Border.none;
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
  o: { labelColor?: Color; valueColor?: Color; bold?: boolean; size?: number } = {}
): Grid {
  const size = o.size ?? 9;
  return kvRow(
    1,
    1,
    6,
    tb(label, { size, bold: o.bold, color: o.labelColor ?? TEXT_MEDIUM }),
    tb(value, { size, bold: o.bold, color: o.valueColor ?? TEXT_DARK, align: TextAlignment.Right })
  );
}

/** A payment-method column: green eyebrow over a multi-line body (one paragraph). */
function paymentColumn(title: string, body: string): VerticalStack {
  const s = new VerticalStack();
  s.add(tb(title, { size: 8, bold: true, color: ACCENT_GREEN_TEXT, mb: 4 }));
  s.add(tb(body, { size: 8 }));
  return s;
}
