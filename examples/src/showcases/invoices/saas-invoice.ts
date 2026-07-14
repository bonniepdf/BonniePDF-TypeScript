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
  VerticalStack,
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
const BODY = ColorPalette.slate[600];
const MUTE = ColorPalette.slate[500];
const RULE = ColorPalette.slate[200];
const BRAND = ColorPalette.indigo[600];
const PANEL = ColorPalette.slate[50];

function tb(
  content: string,
  size: number,
  color: Color,
  opts: { bold?: boolean; align?: TextAlignment; mb?: number } = {}
): TextBlock {
  const t = new TextBlock(content);
  t.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  t.fontSize = size;
  t.textColor = color;
  if (opts.align !== undefined) t.alignment = opts.align;
  if (opts.mb) t.margin = new Thickness(0, 0, 0, opts.mb);
  return t;
}

function cell(content: string, size: number, color: Color, align: TextAlignment, bold = false): TextBlock {
  return tb(content, size, color, { bold, align });
}

/**
 * Accessible SaaS invoice (gallery #1): PDF/A-2a + PDF/UA-1 tagged output with a
 * line-items table, totals, and a QR "pay by bank" code (with alt text). Proves
 * the compliance + payments story for billing platforms.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 48);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(BODY);

  const metadata = new DocumentMetadata();
  metadata.title = 'Invoice INV-2026-0042';
  metadata.author = 'Northwind Cloud Ltd';
  metadata.subject = 'Subscription invoice - accessible (PDF/UA) and archival (PDF/A-2a)';

  const doc = new Document(settings, metadata);

  // ── Header: brand + invoice meta ────────────────────────────────────────────
  const brand = new VerticalStack();
  brand.addChild(tb('NORTHWIND CLOUD', 15, BRAND, { bold: true }));
  brand.addChild(tb('Infrastructure for builders', 9, MUTE, { mb: 0 }));

  const meta = new VerticalStack();
  meta.addChild(tb('Invoice  INV-2026-0042', 10, INK, { bold: true, align: TextAlignment.Right }));
  meta.addChild(tb('Issued  18 Jun 2026', 9, MUTE, { align: TextAlignment.Right }));
  meta.addChild(tb('Due  02 Jul 2026', 9, MUTE, { align: TextAlignment.Right }));

  const headerTable = new Grid(1, 1);
  headerTable.border = Border.none;
  headerTable.cellPadding = 0;
  headerTable.addRow(brand, meta);
  doc.add(headerTable);

  doc.add(rule(14));

  doc.add(new Heading('Invoice'));

  // ── Bill-to / from ─────────────────────────────────────────────────────────
  const billTo = new VerticalStack();
  billTo.addChild(tb('BILLED TO', 8, MUTE, { bold: true, mb: 4 }));
  billTo.addChild(tb('Aperture Labs Inc.', 10, INK, { bold: true }));
  billTo.addChild(tb('Accounts Payable', 9, BODY));
  billTo.addChild(tb('19 Enfield Road, London N1 5BA', 9, BODY));
  billTo.addChild(tb('billing@aperture.example', 9, BODY));

  const from = new VerticalStack();
  from.addChild(tb('FROM', 8, MUTE, { bold: true, mb: 4, align: TextAlignment.Right }));
  from.addChild(tb('Northwind Cloud Ltd', 10, INK, { bold: true, align: TextAlignment.Right }));
  from.addChild(tb('4 Tenter Ground, London E1 7NH', 9, BODY, { align: TextAlignment.Right }));
  from.addChild(tb('VAT GB 482 9173 55', 9, BODY, { align: TextAlignment.Right }));

  const addr = new Grid(1, 1);
  addr.border = Border.none;
  addr.cellPadding = 0;
  addr.margin = new Thickness(0, 8, 0, 16);
  addr.addRow(billTo, from);
  doc.add(addr);

  // ── Line items (tagged table) ──────────────────────────────────────────────
  const items = new Table(3, 0.8, 1, 1);
  items.cellPadding = 8;
  items.border = Border.none;
  items.headerBackgroundColor = PANEL;
  items.headerTextColor = INK;
  items.addHeader(
    cell('Description', 9, INK, TextAlignment.Left, true),
    cell('Qty', 9, INK, TextAlignment.Center, true),
    cell('Unit', 9, INK, TextAlignment.Right, true),
    cell('Amount', 9, INK, TextAlignment.Right, true)
  );

  const lines: [string, number, number][] = [
    ['Pro plan - 25 seats (monthly)', 25, 18.0],
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
      cell(desc, 9, BODY, TextAlignment.Left),
      cell(String(qty), 9, BODY, TextAlignment.Center),
      cell(money(unit), 9, BODY, TextAlignment.Right),
      cell(money(amount), 9, INK, TextAlignment.Right)
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
      cell(label, bold ? 11 : 9, bold ? INK : BODY, TextAlignment.Right, bold),
      cell(value, bold ? 11 : 9, bold ? INK : BODY, TextAlignment.Right, bold)
    );
  };
  totalRow('Subtotal', money(subtotal));
  totalRow('VAT (20%)', money(vat));
  totalRow('Total due', money(total), true);
  doc.add(totals);

  // ── Payment panel with QR ──────────────────────────────────────────────────
  const payHeading = new Heading('How to pay');
  payHeading.level = 2;
  doc.add(payHeading);

  const payInfo = new VerticalStack();
  payInfo.addChild(tb('Pay by bank transfer or scan to pay', 10, INK, { bold: true, mb: 6 }));
  payInfo.addChild(tb('Account name  Northwind Cloud Ltd', 9, BODY, { mb: 2 }));
  payInfo.addChild(tb('Sort code  04-00-72    Account  19483055', 9, BODY, { mb: 2 }));
  payInfo.addChild(tb('Reference  INV-2026-0042', 9, BODY, { mb: 2 }));
  payInfo.addChild(tb('Amount  ' + money(total), 9, INK, { bold: true }));

  const qr = new QRCode();
  qr.data = 'https://pay.northwind.example/inv/INV-2026-0042';
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

  doc.add(tb('Thank you for your business. Payment is due within 14 days.', 8.5, MUTE, { mb: 0 }));

  return doc;
}

function rule(mtop: number): Container {
  const r = new Container();
  r.backgroundColor = RULE;
  r.child = new TextBlock(' ');
  (r.child as TextBlock).fontSize = 0.5;
  r.padding = new Thickness(0, 0.4, 0, 0.4);
  r.margin = new Thickness(0, mtop, 0, 8);
  return r;
}
