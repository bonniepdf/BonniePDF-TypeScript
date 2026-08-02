// ── India GST e-invoice (IRN + signed QR) ────────────────────────────────────
//
// India's GST e-invoicing system routes every B2B invoice through the Invoice
// Registration Portal (IRP), which returns an Invoice Reference Number (IRN) and
// a digitally-signed QR code that must be printed on the invoice. This showcase
// renders that idiom: both parties' GSTIN, HSN/SAC codes per line, an
// intra-state CGST + SGST split (9% + 9%), the IRN and acknowledgement details,
// INR amounts, and the signed QR generated with BonniePDF's native vector QR.
// Fictional GSTIN / IRN values.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...). Shares the _kit building blocks with the sibling invoices.

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
