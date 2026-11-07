/**
 * SaaS Invoice.
 * An accessible subscription invoice for a Pro plan: billing period and status, per-seat and storage line items, a proration line, VAT, a prominent total and a QR payment code, in a clean UK layout.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextBlock,
  Heading,
  HorizontalStack,
  VerticalStack,
  Container,
  Table,
  Grid,
  QRCode,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
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
 * line-items table, totals, and a QR "pay by bank" code (with alt text) -
 * authored through the options-object front door. Elements are added directly
 * with doc.add(...); the document already flows vertically.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 48,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: BODY },
    },
    metadata: {
      title: 'Invoice INV-2026-0042',
      author: 'Sample Company Ltd',
      subject: 'Subscription invoice - accessible (PDF/UA) and archival (PDF/A-2a)',
    },
  });

  // ── Header: brand + invoice meta ────────────────────────────────────────────
  const brand = new VerticalStack({
    children: [tb('SAMPLE COMPANY', 15, BRAND, { bold: true }), tb('Infrastructure for builders', 9, MUTE, { mb: 0 })],
  });

  const meta = new VerticalStack({
    children: [
      tb('Invoice  INV-2026-0042', 10, INK, { bold: true, align: 'right' }),
      tb('Issued  18 Jun 2026', 9, MUTE, { align: 'right' }),
      tb('Due  02 Jul 2026', 9, MUTE, { align: 'right' }),
    ],
  });

  const headerTable = new Grid({ columns: [1, 1], border: 0, cellPadding: 0 });
  headerTable.addRow(brand, meta);
  doc.add(headerTable);

  doc.add(rule(14));

  // ── Title with a payment-status pill ───────────────────────────────────────
  const titleRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 4 } });
  titleRow.add(new Heading('Invoice', { fontName: StandardFonts.HelveticaBold, fontSize: 26, color: INK }), 4);
  titleRow.add(
    new Container({
      backgroundColor: ColorPalette.amber[100],
      cornerRadius: 10,
      padding: [8, 5],
      margin: { top: 6 },
      child: tb('PAYMENT DUE', 8, ColorPalette.amber[900], { bold: true, align: 'center' }),
    }),
    1
  );
  doc.add(titleRow);

  // ── Bill-to / from ─────────────────────────────────────────────────────────
  const billTo = new VerticalStack({
    children: [
      tb('BILLED TO', 8, MUTE, { bold: true, mb: 4 }),
      tb('Sample Customer Ltd', 10, INK, { bold: true }),
      tb('Accounts Payable\n19 Enfield Road, London N1 5BA\nbilling@example.com', 9, BODY),
    ],
  });

  const from = new VerticalStack({
    children: [
      tb('FROM', 8, MUTE, { bold: true, mb: 4, align: 'right' }),
      tb('Sample Company Ltd', 10, INK, { bold: true, align: 'right' }),
      tb('4 Tenter Ground, London E1 7NH\nVAT GB 482 9173 55', 9, BODY, { align: 'right' }),
    ],
  });

  const addr = new Grid({ columns: [1, 1], border: 0, cellPadding: 0, margin: { top: 8, bottom: 16 } });
  addr.addRow(billTo, from);
  doc.add(addr);

  // ── Subscription summary strip ─────────────────────────────────────────────
  const summary = new Grid({ columns: [1, 1.4, 1], border: 0, cellPadding: 0 });
  summary.addRow(
    fact('PLAN', 'Pro, billed monthly'),
    fact('BILLING PERIOD', '18 Jun \u2013 17 Jul 2026'),
    fact('CUSTOMER ID', 'CUS-20418')
  );
  doc.add(
    new Container({
      backgroundColor: PANEL,
      cornerRadius: 6,
      padding: [14, 10],
      margin: { bottom: 16 },
      child: summary,
    })
  );

  // ── Line items (tagged table) ──────────────────────────────────────────────
  const items = new Table({
    columns: [3, 0.8, 1, 1],
    cellPadding: 8,
    border: 0,
    headerBackgroundColor: PANEL,
    headerTextColor: INK,
  });
  items.addHeader(
    cell('Description', 10, INK, 'left', true),
    cell('Qty', 10, INK, 'center', true),
    cell('Unit', 10, INK, 'right', true),
    cell('Amount', 10, INK, 'right', true)
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
      cell(desc, 10, BODY, 'left'),
      cell(String(qty), 10, BODY, 'center'),
      cell(money(unit), 10, BODY, 'right'),
      cell(money(amount), 10, INK, 'right')
    );
  }
  doc.add(items);
  doc.add(rule(0));

  // ── Totals ─────────────────────────────────────────────────────────────────
  const vat = subtotal * 0.2;
  const total = subtotal + vat;
  const totals = new Grid({ columns: [2.4, 1], border: 0, cellPadding: 5, margin: { top: 4 } });
  const totalRow = (label: string, value: string, bold = false): void => {
    totals.addRow(
      cell(label, bold ? 15 : 10, bold ? INK : BODY, 'right', bold),
      cell(value, bold ? 15 : 10, bold ? INK : BODY, 'right', bold)
    );
  };
  totalRow('Subtotal', money(subtotal));
  totalRow('VAT (20%)', money(vat));
  totalRow('Total due', money(total), true);
  doc.add(totals);

  // ── Payment panel with QR ──────────────────────────────────────────────────
  doc.add(
    new Heading('How to pay', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      color: INK,
      margin: { top: 14, bottom: 2 },
    })
  );

  const payInfo = new VerticalStack({
    children: [
      tb('Pay by bank transfer or scan to pay', 10, INK, { bold: true, mb: 6 }),
      tb('Account name  Sample Company Ltd', 10, BODY, { mb: 2 }),
      tb('Sort code  04-00-72    Account  19483055', 10, BODY, { mb: 2 }),
      tb('Reference  INV-2026-0042', 10, BODY, { mb: 2 }),
      tb('Amount  ' + money(total), 10, INK, { bold: true }),
    ],
  });

  const qrWrap = new Container({
    padding: 6,
    child: new QRCode({
      data: 'https://pay.example.com/inv/INV-2026-0042',
      size: 96,
      quietZone: 1,
      errorCorrection: 'medium',
      altText: 'QR code to pay invoice INV-2026-0042 online, total £' + total.toFixed(2),
    }),
  });

  const payTable = new Grid({ columns: [2.2, 1], border: 0, cellPadding: 0 });
  payTable.addRow(payInfo, qrWrap);

  doc.add(
    new Container({ backgroundColor: PANEL, cornerRadius: 8, padding: [16, 14], margin: { top: 8 }, child: payTable })
  );

  doc.add(
    new TextBlock('Thank you for your business. Payment is due within 14 days.', {
      fontSize: 9,
      color: MUTE,
      margin: { top: 10 },
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

function tb(
  content: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: TextAlignmentInput; mb?: number } = {}
): TextBlock {
  return new TextBlock(content, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color: color,
    alignment: opts.align,
    margin: opts.mb ? { bottom: opts.mb } : undefined,
  });
}

/** A small caps label over its value, for the subscription strip. */
function fact(label: string, value: string): VerticalStack {
  return new VerticalStack({
    spacing: 3,
    children: [tb(label, 8, MUTE, { bold: true }), tb(value, 10, INK, { bold: true })],
  });
}

function cell(content: string, size: number, color: ColorInput, align: TextAlignmentInput, bold = false): TextBlock {
  return tb(content, size, color, { bold, align });
}

function rule(mtop: number): Container {
  return new Container({
    backgroundColor: RULE,
    height: 0.8,
    margin: { top: mtop, bottom: 8 },
  });
}
