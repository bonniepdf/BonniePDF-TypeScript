/**
 * SaaS Invoice (Class API).
 * The same accessible subscription invoice as SaaS Invoice, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfAConformance,
  AccessibilityMode,
  TextStyle,
  TextBlock,
  TextAlignment,
  Heading,
  HorizontalStack,
  VerticalStack,
  WidthDistribution,
  Container,
  Table,
  Grid,
  QRCode,
  QrEcc,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
} from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[900];
const BODY = ColorPalette.slate[700];
const MUTE = ColorPalette.slate[600];
const RULE = ColorPalette.slate[200];
const BRAND = ColorPalette.violet[600];
const PANEL = ColorPalette.slate[50];

/**
 * Accessible SaaS invoice (gallery #1): PDF/A-2a + PDF/UA-1 tagged output with a
 * line-items table, totals, and a QR "pay by bank" code (with alt text). Proves
 * the compliance + payments story for billing platforms.
 */
/**
 * The **class / construct-then-mutate** companion to `saas-invoice.ts`.
 *
 * Same accessible SaaS subscription invoice, authored the long way: `new` each
 * element and assign properties. Elements are added directly with `doc.add(...)`
 * (this examples never used a parent VerticalStack). This is the escape hatch
 * the options-object front door sits on top of. Renders **byte-for-byte
 * identically** to the options-style `saas-invoice.ts`.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 48);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(BODY);

  const metadata = new DocumentMetadata();
  metadata.title = 'Invoice INV-2026-0042';
  metadata.author = 'Sample Company Ltd';
  metadata.subject = 'Subscription invoice - accessible (PDF/UA) and archival (PDF/A-2a)';

  const doc = new Document(settings, metadata);

  // ── Header: brand + invoice meta ────────────────────────────────────────────
  const brand = new VerticalStack();
  brand.add(tb('SAMPLE COMPANY', 15, BRAND, { bold: true }));
  brand.add(tb('Infrastructure for builders', 9, MUTE, { mb: 0 }));

  const meta = new VerticalStack();
  meta.add(tb('Invoice  INV-2026-0042', 10, INK, { bold: true, align: TextAlignment.Right }));
  meta.add(tb('Issued  18 Jun 2026', 9, MUTE, { align: TextAlignment.Right }));
  meta.add(tb('Due  02 Jul 2026', 9, MUTE, { align: TextAlignment.Right }));

  const headerTable = new Grid(1, 1);
  headerTable.border = Border.none;
  headerTable.cellPadding = 0;
  headerTable.addRow(brand, meta);
  doc.add(headerTable);

  doc.add(rule(14));

  // ── Title with a payment-status pill ───────────────────────────────────────
  const title = new Heading('Invoice');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 26;
  title.color = INK;

  const pill = new Container();
  pill.backgroundColor = ColorPalette.amber[100];
  pill.cornerRadius = 10;
  pill.padding = new Thickness(8, 5, 8, 5);
  pill.margin = new Thickness(0, 6, 0, 0);
  pill.child = tb('PAYMENT DUE', 8, ColorPalette.amber[900], { bold: true, align: TextAlignment.Center });

  const titleRow = new HorizontalStack();
  titleRow.widthDistribution = WidthDistribution.Weighted;
  titleRow.margin = new Thickness(0, 0, 0, 4);
  titleRow.add(title, 4);
  titleRow.add(pill, 1);
  doc.add(titleRow);

  // ── Bill-to / from ─────────────────────────────────────────────────────────
  const billTo = new VerticalStack();
  billTo.add(tb('BILLED TO', 8, MUTE, { bold: true, mb: 4 }));
  billTo.add(tb('Sample Customer Ltd', 10, INK, { bold: true }));
  billTo.add(tb('Accounts Payable\n19 Enfield Road, London N1 5BA\nbilling@example.com', 9, BODY));

  const from = new VerticalStack();
  from.add(tb('FROM', 8, MUTE, { bold: true, mb: 4, align: TextAlignment.Right }));
  from.add(tb('Sample Company Ltd', 10, INK, { bold: true, align: TextAlignment.Right }));
  from.add(tb('4 Tenter Ground, London E1 7NH\nVAT GB 482 9173 55', 9, BODY, { align: TextAlignment.Right }));

  const addr = new Grid(1, 1);
  addr.border = Border.none;
  addr.cellPadding = 0;
  addr.margin = new Thickness(0, 8, 0, 16);
  addr.addRow(billTo, from);
  doc.add(addr);

  // ── Subscription summary strip ─────────────────────────────────────────────
  const summary = new Grid(1, 1.4, 1);
  summary.border = Border.none;
  summary.cellPadding = 0;
  summary.addRow(
    fact('PLAN', 'Pro, billed monthly'),
    fact('BILLING PERIOD', '18 Jun \u2013 17 Jul 2026'),
    fact('CUSTOMER ID', 'CUS-20418')
  );
  const strip = new Container();
  strip.backgroundColor = PANEL;
  strip.cornerRadius = 6;
  strip.padding = new Thickness(14, 10, 14, 10);
  strip.margin = new Thickness(0, 0, 0, 16);
  strip.child = summary;
  doc.add(strip);

  // ── Line items (tagged table) ──────────────────────────────────────────────
  const items = new Table(3, 0.8, 1, 1);
  items.cellPadding = 8;
  items.border = Border.none;
  items.headerBackgroundColor = PANEL;
  items.headerTextColor = INK;
  items.addHeader(
    cell('Description', 10, INK, TextAlignment.Left, true),
    cell('Qty', 10, INK, TextAlignment.Center, true),
    cell('Unit', 10, INK, TextAlignment.Right, true),
    cell('Amount', 10, INK, TextAlignment.Right, true)
  );

  const lines: [string, number, number][] = [
    ['Pro plan - 25 seats (monthly)', 25, 18.0],
    ['Proration - 5 seats added 4 Jun (14 of 30 days)', 5, 8.4],
    ['Additional storage - 2 TB', 2, 40.0],
    ['Premium support add-on', 1, 199.0],
    ['Egress overage - June', 1, 36.5],
  ];
  let subtotal = 0;
  const money = (n: number): string => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  for (const [desc, qty, unit] of lines) {
    const amount = qty * unit;
    subtotal += amount;
    items.addRow(
      cell(desc, 10, BODY, TextAlignment.Left),
      cell(String(qty), 10, BODY, TextAlignment.Center),
      cell(money(unit), 10, BODY, TextAlignment.Right),
      cell(money(amount), 10, INK, TextAlignment.Right)
    );
  }
  doc.add(items);
  doc.add(rule(0));

  // ── Totals ─────────────────────────────────────────────────────────────────
  const vat = subtotal * 0.2;
  const total = subtotal + vat;
  const totals = new Grid(2.4, 1);
  totals.border = Border.none;
  totals.cellPadding = 5;
  totals.margin = new Thickness(0, 4, 0, 0);
  const totalRow = (label: string, value: string, bold = false): void => {
    totals.addRow(
      cell(label, bold ? 15 : 10, bold ? INK : BODY, TextAlignment.Right, bold),
      cell(value, bold ? 15 : 10, bold ? INK : BODY, TextAlignment.Right, bold)
    );
  };
  totalRow('Subtotal', money(subtotal));
  totalRow('VAT (20%)', money(vat));
  totalRow('Total due', money(total), true);
  doc.add(totals);

  // ── Payment panel with QR ──────────────────────────────────────────────────
  const payHeading = new Heading('How to pay');
  payHeading.level = 2;
  payHeading.fontName = StandardFonts.HelveticaBold;
  payHeading.fontSize = 13;
  payHeading.color = INK;
  payHeading.margin = new Thickness(0, 14, 0, 2);
  doc.add(payHeading);

  const payInfo = new VerticalStack();
  payInfo.add(tb('Pay by bank transfer or scan to pay', 10, INK, { bold: true, mb: 6 }));
  payInfo.add(tb('Account name  Sample Company Ltd', 10, BODY, { mb: 2 }));
  payInfo.add(tb('Sort code  04-00-72    Account  19483055', 10, BODY, { mb: 2 }));
  payInfo.add(tb('Reference  INV-2026-0042', 10, BODY, { mb: 2 }));
  payInfo.add(tb('Amount  ' + money(total), 10, INK, { bold: true }));

  const qr = new QRCode();
  qr.data = 'https://pay.example.com/inv/INV-2026-0042';
  qr.size = 96;
  qr.quietZone = 1;
  qr.errorCorrection = QrEcc.Medium;
  qr.altText = 'QR code to pay invoice INV-2026-0042 online, total £' + total.toFixed(2);
  const qrWrap = new Container();
  qrWrap.child = qr;
  qrWrap.padding = new Thickness(6);

  const payTable = new Grid(2.2, 1);
  payTable.border = Border.none;
  payTable.cellPadding = 0;
  payTable.addRow(payInfo, qrWrap);

  const panel = new Container();
  panel.backgroundColor = PANEL;
  panel.cornerRadius = 8;
  panel.padding = new Thickness(16, 14, 16, 14);
  panel.margin = new Thickness(0, 8, 0, 0);
  panel.child = payTable;
  doc.add(panel);

  const thanks = new TextBlock('Thank you for your business. Payment is due within 14 days.');
  thanks.fontSize = 9;
  thanks.color = MUTE;
  thanks.margin = new Thickness(0, 10, 0, 0);
  doc.add(thanks);

  return doc;
}

// Local helpers and sample types used by this document.

function tb(
  content: string,
  size: number,
  color: Color,
  opts: { bold?: boolean; align?: TextAlignment; mb?: number } = {}
): TextBlock {
  const t = new TextBlock(content);
  t.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  t.fontSize = size;
  t.color = color;
  if (opts.align !== undefined) t.alignment = opts.align;
  if (opts.mb) t.margin = new Thickness(0, 0, 0, opts.mb);
  return t;
}

/** A small caps label over its value, for the subscription strip. */
function fact(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 3;
  stack.add(tb(label, 8, MUTE, { bold: true }));
  stack.add(tb(value, 10, INK, { bold: true }));
  return stack;
}

function cell(content: string, size: number, color: Color, align: TextAlignment, bold = false): TextBlock {
  return tb(content, size, color, { bold, align });
}

function rule(mtop: number): Container {
  const r = new Container();
  r.backgroundColor = RULE;
  r.height = 0.8;
  r.margin = new Thickness(0, mtop, 0, 8);
  return r;
}
