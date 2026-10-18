/**
 * India GST E-Invoice (Class API).
 * The same India GST e-invoice as India GST E-Invoice, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
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
  WidthDistribution,
  TextStyle,
  PdfAConformance,
  TextBlock,
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

/**
 * The **class / construct-then-mutate** companion to `india-gst-invoice.ts`.
 *
 * Same India GST e-invoice (IRN + signed QR), authored the long way: `new` each
 * element and assign properties, added directly with `doc.add(...)` (no redundant
 * parent VerticalStack). Includes its own formatting helpers below. Renders
 * **byte-for-byte identically** to the options-style `india-gst-invoice.ts`.
 */
export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const settings = new DocumentSettings(PdfSize.a4, 40);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-IN';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(INK);

  const metadata = new DocumentMetadata();
  metadata.title = `GST e-Invoice INV-IN-${year}-0771`;
  metadata.author = 'Sample Company Private Limited';
  metadata.subject = 'India GST e-invoice with IRN, signed QR, HSN codes, and CGST/SGST breakdown.';

  const doc = new Document(settings, metadata);
  doc.add(accentBar(SAFFRON, 4));
  doc.add(accentBar(ACCENT, 4));

  // ── Header: seller | e-invoice signed QR ──────────────────────────────────
  const header = new Grid(1.5, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  header.margin = new Thickness(0, 14, 0, 14);

  const seller = new VerticalStack();
  seller.add(
    cell('TAX INVOICE  ·  e-Invoice', { bold: true, size: 8, color: ACCENT, margin: new Thickness(0, 0, 0, 6) })
  );
  seller.add(
    cell('Sample Company Private Limited', { bold: true, size: 15, color: INK, margin: new Thickness(0, 0, 0, 2) })
  );
  seller.add(
    lines(['4th Floor, Prestige Tech Park', 'Outer Ring Road, Bengaluru 560103', 'Karnataka, India'], { color: MUTED })
  );
  seller.add(cell('GSTIN: 29ABCDE1234F1Z5', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }));
  seller.add(cell('State: Karnataka (29)  ·  PAN: ABCDE1234F', { size: 8, color: MUTED }));

  // Signed QR: on a real e-invoice this encodes the IRP-signed payload (JWT).
  const qrPayload = JSON.stringify({
    SellerGstin: '29ABCDE1234F1Z5',
    BuyerGstin: '29XYZAB6789K1Z2',
    DocNo: `INV-IN-${year}-0771`,
    DocDt: fmt.format(now),
    Irn: IRN,
  });
  const qr = new QRCode();
  qr.data = qrPayload;
  qr.size = 108;
  qr.quietZone = 2;
  qr.errorCorrection = QrEcc.Medium;
  qr.foregroundColor = INK;
  qr.backgroundColor = Color.white;
  qr.altText = `IRP-signed QR code for GST e-invoice INV-IN-${year}-0771`;
  const qrStack = new VerticalStack();
  const qrWrap = new HorizontalStack();
  qrWrap.widthDistribution = WidthDistribution.Weighted;
  qrWrap.add(new Container(), 1);
  qrWrap.add(qr);
  qrStack.add(qrWrap);
  qrStack.add(
    cell('Signed QR (IRP)', { size: 8, color: MUTED, align: TextAlignment.Right, margin: new Thickness(0, 4, 0, 0) })
  );

  header.addRow(seller, qrStack);
  doc.add(header);

  // ── IRN band ────────────────────────────────────────────────────────────
  const irnBox = new Container();
  irnBox.backgroundColor = ColorPalette.emerald[50];
  irnBox.cornerRadius = 6;
  irnBox.padding = new Thickness(12, 9, 12, 9);
  irnBox.margin = new Thickness(0, 0, 0, 16);
  const irnStack = new VerticalStack();
  irnStack.add(
    cell('IRN (Invoice Reference Number)', { bold: true, size: 8, color: ACCENT, margin: new Thickness(0, 0, 0, 2) })
  );
  irnStack.add(cell(IRN, { size: 8, color: INK }));
  irnStack.add(
    cell('Ack No. 112500771223344   ·   Ack Date ' + fmt.format(now), {
      size: 8,
      color: MUTED,
      margin: new Thickness(0, 3, 0, 0),
    })
  );
  irnBox.child = irnStack;
  doc.add(irnBox);

  // ── Buyer + invoice details ────────────────────────────────────────────
  const meta = new Grid(1, 1);
  meta.cellPadding = 12;
  meta.border = new Border(0.5);
  meta.borderColors = new BorderColors(RULE);
  meta.margin = new Thickness(0, 0, 0, 16);
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
  const details = new VerticalStack();
  details.add(totalLine('Invoice no.', `INV-IN-${year}-0771`));
  details.add(totalLine('Invoice date', fmt.format(now)));
  details.add(totalLine('Place of supply', 'Karnataka (29)'));
  details.add(totalLine('Reverse charge', 'No'));
  meta.addRow(buyer, labelled('DETAILS', details, ACCENT));
  doc.add(meta);

  // ── Line items with HSN + taxable value ────────────────────────────────
  const table = new Table(2.6, 0.9, 0.5, 1, 1);
  table.cellPadding = 7;
  table.border = Border.none;
  table.headerBackgroundColor = HEADER_BG;
  table.headerTextColor = INK;
  table.addHeader(
    cell('Description', { bold: true }),
    cell('HSN/SAC', { bold: true, align: TextAlignment.Center }),
    cell('Qty', { bold: true, align: TextAlignment.Center }),
    cell('Rate', { bold: true, align: TextAlignment.Right }),
    cell('Taxable value', { bold: true, align: TextAlignment.Right })
  );
  let taxable = 0;
  for (const it of ITEMS) {
    const value = it.qty * it.unitPrice;
    taxable += value;
    table.addRow(
      cell(it.description),
      cell(it.hsn, { align: TextAlignment.Center, color: MUTED }),
      cell(String(it.qty), { align: TextAlignment.Center }),
      cell(money(it.unitPrice, INR, 'en-IN'), { align: TextAlignment.Right }),
      cell(money(value, INR, 'en-IN'), { align: TextAlignment.Right })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── GST breakdown (intra-state → CGST + SGST) ───────────────────────────
  const cgst = taxable * CGST;
  const sgst = taxable * SGST;
  const grand = taxable + cgst + sgst;
  const totals = new VerticalStack();
  totals.add(totalLine('Taxable value', money(taxable, INR, 'en-IN')));
  totals.add(totalLine('CGST @ 9%', money(cgst, INR, 'en-IN')));
  totals.add(totalLine('SGST @ 9%', money(sgst, INR, 'en-IN')));
  totals.add(divider(INK, 0.6));
  totals.add(totalLine('Total (INR)', money(grand, INR, 'en-IN'), { bold: true, size: 13, color: ACCENT }));
  const totalsBox = new Container();
  totalsBox.child = totals;
  totalsBox.padding = new Thickness(14, 12, 14, 12);
  totalsBox.backgroundColor = ColorPalette.emerald[50];
  totalsBox.cornerRadius = 8;
  const totalsRow = new HorizontalStack();
  totalsRow.widthDistribution = WidthDistribution.Weighted;
  totalsRow.margin = new Thickness(0, 6, 0, 0);
  totalsRow.add(new Container(), 1);
  totalsRow.add(totalsBox, 1);
  doc.add(totalsRow);

  const note = cell(
    'This is a computer-generated e-invoice registered on the GST Invoice Registration Portal. ' +
      'The signed QR above encodes the IRP-issued payload.',
    { size: 8, color: MUTED, margin: new Thickness(0, 20, 0, 0) }
  );
  doc.add(note);

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
