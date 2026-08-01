// ── India GST e-invoice (IRN + signed QR) ────────────────────────────────────
//
// India's GST e-invoicing system routes every B2B invoice through the Invoice
// Registration Portal (IRP), which returns an Invoice Reference Number (IRN) and
// a digitally-signed QR code that must be printed on the invoice. This showcase
// renders that idiom: both parties' GSTIN, HSN/SAC codes per line, an
// intra-state CGST + SGST split (9% + 9%), the IRN and acknowledgement details,
// INR amounts, and the signed QR generated with BonniePDF's native vector QR.
// Fictional GSTIN / IRN values.

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
} from '@bonniepdf/core';
import { cell, money, lines, labelled, totalLine, divider, accentBar, INK, MUTED, HEADER_BG, RULE } from './_kit';

const ACCENT = ColorPalette.emerald[700];
const SAFFRON = ColorPalette.amber[500];
const INR = 'Rs '; // Helvetica (standard-14) has no ₹ glyph; use the ASCII abbreviation.

interface GstLine {
  description: string;
  hsn: string;
  qty: number;
  unitPrice: number;
}

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
  const root = new VerticalStack();
  root.addChild(accentBar(SAFFRON, 4));
  root.addChild(accentBar(ACCENT, 4));

  // ── Header: seller | e-invoice signed QR ──────────────────────────────────
  const header = new Grid(1.5, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  header.margin = new Thickness(0, 14, 0, 14);

  const seller = new VerticalStack();
  seller.addChild(
    cell('TAX INVOICE  ·  e-Invoice', { bold: true, size: 8, color: ACCENT, margin: new Thickness(0, 0, 0, 6) })
  );
  seller.addChild(
    cell('Sample Company Private Limited', { bold: true, size: 15, color: INK, margin: new Thickness(0, 0, 0, 2) })
  );
  seller.addChild(
    lines(['4th Floor, Prestige Tech Park', 'Outer Ring Road, Bengaluru 560103', 'Karnataka, India'], { color: MUTED })
  );
  seller.addChild(cell('GSTIN: 29ABCDE1234F1Z5', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }));
  seller.addChild(cell('State: Karnataka (29)  ·  PAN: ABCDE1234F', { size: 8, color: MUTED }));

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
  qrWrap.addChild(new Container(), 1);
  qrWrap.addChild(qr);
  qrStack.addChild(qrWrap);
  qrStack.addChild(
    cell('Signed QR (IRP)', { size: 8, color: MUTED, align: TextAlignment.Right, margin: new Thickness(0, 4, 0, 0) })
  );

  header.addRow(seller, qrStack);
  root.addChild(header);

  // ── IRN band ────────────────────────────────────────────────────────────
  const irnBox = new Container();
  irnBox.backgroundColor = ColorPalette.emerald[50];
  irnBox.cornerRadius = 6;
  irnBox.padding = new Thickness(12, 9, 12, 9);
  irnBox.margin = new Thickness(0, 0, 0, 16);
  const irnStack = new VerticalStack();
  irnStack.addChild(
    cell('IRN (Invoice Reference Number)', { bold: true, size: 8, color: ACCENT, margin: new Thickness(0, 0, 0, 2) })
  );
  irnStack.addChild(cell(IRN, { size: 8, color: INK }));
  irnStack.addChild(
    cell('Ack No. 112500771223344   ·   Ack Date ' + fmt.format(now), {
      size: 8,
      color: MUTED,
      margin: new Thickness(0, 3, 0, 0),
    })
  );
  irnBox.child = irnStack;
  root.addChild(irnBox);

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
  details.addChild(totalLine('Invoice no.', `INV-IN-${year}-0771`));
  details.addChild(totalLine('Invoice date', fmt.format(now)));
  details.addChild(totalLine('Place of supply', 'Karnataka (29)'));
  details.addChild(totalLine('Reverse charge', 'No'));
  meta.addRow(buyer, labelled('DETAILS', details, ACCENT));
  root.addChild(meta);

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
  root.addChild(table);
  root.addChild(divider(RULE, 0.5));

  // ── GST breakdown (intra-state → CGST + SGST) ───────────────────────────
  const cgst = taxable * CGST;
  const sgst = taxable * SGST;
  const grand = taxable + cgst + sgst;
  const totals = new VerticalStack();
  totals.addChild(totalLine('Taxable value', money(taxable, INR, 'en-IN')));
  totals.addChild(totalLine('CGST @ 9%', money(cgst, INR, 'en-IN')));
  totals.addChild(totalLine('SGST @ 9%', money(sgst, INR, 'en-IN')));
  totals.addChild(divider(INK, 0.6));
  totals.addChild(totalLine('Total (INR)', money(grand, INR, 'en-IN'), { bold: true, size: 13, color: ACCENT }));
  const totalsBox = new Container();
  totalsBox.child = totals;
  totalsBox.padding = new Thickness(14, 12, 14, 12);
  totalsBox.backgroundColor = ColorPalette.emerald[50];
  totalsBox.cornerRadius = 8;
  const totalsRow = new HorizontalStack();
  totalsRow.widthDistribution = WidthDistribution.Weighted;
  totalsRow.margin = new Thickness(0, 6, 0, 0);
  totalsRow.addChild(new Container(), 1);
  totalsRow.addChild(totalsBox, 1);
  root.addChild(totalsRow);

  const note = cell(
    'This is a computer-generated e-invoice registered on the GST Invoice Registration Portal. ' +
      'The signed QR above encodes the IRP-issued payload.',
    { size: 8, color: MUTED, margin: new Thickness(0, 20, 0, 0) }
  );
  root.addChild(note);

  doc.add(root);
  return doc;
}
