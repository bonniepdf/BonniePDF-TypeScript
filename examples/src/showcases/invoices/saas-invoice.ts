import {
  Document,
  TextBlock,
  Heading,
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
const BODY = ColorPalette.slate[600];
const MUTE = ColorPalette.slate[500];
const RULE = ColorPalette.slate[200];
const BRAND = ColorPalette.indigo[600];
const PANEL = ColorPalette.slate[50];

function tb(
  content: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: TextAlignmentInput; mb?: number } = {}
): TextBlock {
  return new TextBlock(content, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    textColor: color,
    alignment: opts.align,
    margin: opts.mb ? { bottom: opts.mb } : undefined,
  });
}

function cell(content: string, size: number, color: ColorInput, align: TextAlignmentInput, bold = false): TextBlock {
  return tb(content, size, color, { bold, align });
}

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

  doc.add(new Heading('Invoice'));

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

  // ── Line items (tagged table) ──────────────────────────────────────────────
  const items = new Table({
    columns: [3, 0.8, 1, 1],
    cellPadding: 8,
    border: 0,
    headerBackgroundColor: PANEL,
    headerTextColor: INK,
  });
  items.addHeader(
    cell('Description', 9, INK, 'left', true),
    cell('Qty', 9, INK, 'center', true),
    cell('Unit', 9, INK, 'right', true),
    cell('Amount', 9, INK, 'right', true)
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
      cell(desc, 9, BODY, 'left'),
      cell(String(qty), 9, BODY, 'center'),
      cell(money(unit), 9, BODY, 'right'),
      cell(money(amount), 9, INK, 'right')
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
      cell(label, bold ? 11 : 9, bold ? INK : BODY, 'right', bold),
      cell(value, bold ? 11 : 9, bold ? INK : BODY, 'right', bold)
    );
  };
  totalRow('Subtotal', money(subtotal));
  totalRow('VAT (20%)', money(vat));
  totalRow('Total due', money(total), true);
  doc.add(totals);

  // ── Payment panel with QR ──────────────────────────────────────────────────
  doc.add(new Heading('How to pay', { level: 2 }));

  const payInfo = new VerticalStack({
    children: [
      tb('Pay by bank transfer or scan to pay', 10, INK, { bold: true, mb: 6 }),
      tb('Account name  Sample Company Ltd', 9, BODY, { mb: 2 }),
      tb('Sort code  04-00-72    Account  19483055', 9, BODY, { mb: 2 }),
      tb('Reference  INV-2026-0042', 9, BODY, { mb: 2 }),
      tb('Amount  ' + money(total), 9, INK, { bold: true }),
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

  doc.add(tb('Thank you for your business. Payment is due within 14 days.', 8.5, MUTE, { mb: 0 }));

  return doc;
}

function rule(mtop: number): Container {
  return new Container({
    backgroundColor: RULE,
    height: 0.8,
    margin: { top: mtop, bottom: 8 },
  });
}
