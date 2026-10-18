/**
 * India GST E-Invoice.
 * An India GST e-invoice: GSTIN for both parties, HSN/SAC codes, a CGST + SGST split, IRN and acknowledgement details, and a signed QR in INR.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  QRCode,
  ColorPalette,
  Thickness,
  TextBlock,
  TextAlignment,
  StandardFonts,
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

// ── India GST e-invoice (IRN + signed QR) ────────────────────────────────────
//
// India's GST e-invoicing system routes every B2B invoice through the Invoice
// Registration Portal (IRP), which returns an Invoice Reference Number (IRN) and
// a digitally-signed QR code that must be printed on the invoice. This examples
// renders that idiom: both parties' GSTIN, HSN/SAC codes per line, an
// intra-state CGST + SGST split (9% + 9%), the IRN and acknowledgement details,
// INR amounts, and the signed QR generated with BonniePDF's native vector QR.
// Fictional GSTIN / IRN values.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...). Includes its own formatting helpers below.

const ACCENT = ColorPalette.emerald[700];
const SAFFRON = ColorPalette.amber[500];
const INR = 'Rs ';

const ITEMS: GstLine[] = [
  { description: 'Enterprise SaaS subscription', hsn: '997331', qty: 12, unitPrice: 18000 },
  { description: 'Implementation & configuration', hsn: '998314', qty: 40, unitPrice: 2500 },
  { description: 'Priority support (annual)', hsn: '998313', qty: 1, unitPrice: 96000 },
];

const CGST = 0.09;
const SGST = 0.09;
const IRN = '8a7f1e2c9b4d6f03a1e5c7b90d2f4a6e8c1b3d5f70921a4c6e8b0d2f4a6c8e1b3';

export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 40,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-IN',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
    },
    metadata: {
      title: `GST e-Invoice INV-IN-${year}-0771`,
      author: 'Sample Company Private Limited',
      subject: 'India GST e-invoice with IRN, signed QR, HSN codes, and CGST/SGST breakdown.',
    },
  });

  doc.add(accentBar(SAFFRON, 4));
  doc.add(accentBar(ACCENT, 4));

  // ── Header: seller | e-invoice signed QR ──────────────────────────────────
  const header = new Grid({ columns: [1.5, 1], cellPadding: 0, border: 0, margin: { top: 14, bottom: 14 } });

  const seller = new VerticalStack({
    children: [
      cell('TAX INVOICE  ·  e-Invoice', { bold: true, size: 8, color: ACCENT, margin: new Thickness(0, 0, 0, 6) }),
      cell('Sample Company Private Limited', { bold: true, size: 15, color: INK, margin: new Thickness(0, 0, 0, 2) }),
      lines(['4th Floor, Prestige Tech Park', 'Outer Ring Road, Bengaluru 560103', 'Karnataka, India'], {
        color: MUTED,
      }),
      cell('GSTIN: 29ABCDE1234F1Z5', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }),
      cell('State: Karnataka (29)  ·  PAN: ABCDE1234F', { size: 8, color: MUTED }),
    ],
  });

  // Signed QR: on a real e-invoice this encodes the IRP-signed payload (JWT).
  const qrPayload = JSON.stringify({
    SellerGstin: '29ABCDE1234F1Z5',
    BuyerGstin: '29XYZAB6789K1Z2',
    DocNo: `INV-IN-${year}-0771`,
    DocDt: fmt.format(now),
    Irn: IRN,
  });
  const qrWrap = new HorizontalStack({ widthDistribution: 'weighted' });
  qrWrap.add(new Container(), 1);
  qrWrap.add(
    new QRCode({
      data: qrPayload,
      size: 108,
      quietZone: 2,
      errorCorrection: 'medium',
      foregroundColor: INK,
      backgroundColor: '#ffffff',
      altText: `IRP-signed QR code for GST e-invoice INV-IN-${year}-0771`,
    })
  );
  const qrStack = new VerticalStack({
    children: [
      qrWrap,
      cell('Signed QR (IRP)', { size: 8, color: MUTED, align: 'right', margin: new Thickness(0, 4, 0, 0) }),
    ],
  });

  header.addRow(seller, qrStack);
  doc.add(header);

  // ── IRN band ────────────────────────────────────────────────────────────
  doc.add(
    new Container({
      backgroundColor: ColorPalette.emerald[50],
      cornerRadius: 6,
      padding: [12, 9],
      margin: { bottom: 16 },
      child: new VerticalStack({
        children: [
          cell('IRN (Invoice Reference Number)', {
            bold: true,
            size: 8,
            color: ACCENT,
            margin: new Thickness(0, 0, 0, 2),
          }),
          cell(IRN, { size: 8, color: INK }),
          cell('Ack No. 112500771223344   ·   Ack Date ' + fmt.format(now), {
            size: 8,
            color: MUTED,
            margin: new Thickness(0, 3, 0, 0),
          }),
        ],
      }),
    })
  );

  // ── Buyer + invoice details ────────────────────────────────────────────
  const meta = new Grid({
    columns: [1, 1],
    cellPadding: 12,
    border: { width: 0.5, color: RULE },
    margin: { bottom: 16 },
  });
  const buyer = labelled(
    'BILL TO',
    lines(
      [
        'Sample Customer Private Limited',
        'No. 88, MG Road',
        'Bengaluru 560001',
        'Karnataka, India',
        'GSTIN: 29XYZAB6789K1Z2',
      ],
      { color: MUTED }
    ),
    ACCENT
  );
  const details = new VerticalStack({
    children: [
      totalLine('Invoice no.', `INV-IN-${year}-0771`),
      totalLine('Invoice date', fmt.format(now)),
      totalLine('Place of supply', 'Karnataka (29)'),
      totalLine('Reverse charge', 'No'),
    ],
  });
  meta.addRow(buyer, labelled('DETAILS', details, ACCENT));
  doc.add(meta);

  // ── Line items with HSN + taxable value ────────────────────────────────
  const table = new Table({
    columns: [2.6, 0.9, 0.5, 1, 1],
    cellPadding: 7,
    border: 0,
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
  });
  table.addHeader(
    cell('Description', { bold: true }),
    cell('HSN/SAC', { bold: true, align: 'center' }),
    cell('Qty', { bold: true, align: 'center' }),
    cell('Rate', { bold: true, align: 'right' }),
    cell('Taxable value', { bold: true, align: 'right' })
  );
  let taxable = 0;
  for (const it of ITEMS) {
    const value = it.qty * it.unitPrice;
    taxable += value;
    table.addRow(
      cell(it.description),
      cell(it.hsn, { align: 'center', color: MUTED }),
      cell(String(it.qty), { align: 'center' }),
      cell(money(it.unitPrice, INR, 'en-IN'), { align: 'right' }),
      cell(money(value, INR, 'en-IN'), { align: 'right' })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── GST breakdown (intra-state → CGST + SGST) ───────────────────────────
  const cgst = taxable * CGST;
  const sgst = taxable * SGST;
  const grand = taxable + cgst + sgst;
  const totals = new VerticalStack({
    children: [
      totalLine('Taxable value', money(taxable, INR, 'en-IN')),
      totalLine('CGST @ 9%', money(cgst, INR, 'en-IN')),
      totalLine('SGST @ 9%', money(sgst, INR, 'en-IN')),
      divider(INK, 0.6),
      totalLine('Total (INR)', money(grand, INR, 'en-IN'), { bold: true, size: 13, color: ACCENT }),
    ],
  });
  const totalsBox = new Container({
    child: totals,
    padding: [14, 12],
    backgroundColor: ColorPalette.emerald[50],
    cornerRadius: 8,
  });
  const totalsRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 6 } });
  totalsRow.add(new Container(), 1);
  totalsRow.add(totalsBox, 1);
  doc.add(totalsRow);

  doc.add(
    cell(
      'This is a computer-generated e-invoice registered on the GST Invoice Registration Portal. ' +
        'The signed QR above encodes the IRP-issued payload.',
      { size: 8, color: MUTED, margin: new Thickness(0, 20, 0, 0) }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

// Helvetica (standard-14) has no ₹ glyph; use the ASCII abbreviation.

interface GstLine {
  description: string;
  hsn: string;
  qty: number;
  unitPrice: number;
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
