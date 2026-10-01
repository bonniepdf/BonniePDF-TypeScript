// ── Browser / Cloudflare Worker receipt ──────────────────────────────────────
//
// The showcase for BonniePDF's defining platform story: generating a real PDF
// **in the browser or at the edge**, with zero runtime dependencies, no native
// binaries, and no WASM. A point-of-sale receipt is the perfect fit - small,
// synchronous to build, and exactly the kind of document a SaaS checkout or a
// Cloudflare Worker hands back on the response.
//
// The whole document is a narrow 80 mm thermal-printer page rendered in Courier
// (a standard-14 font, so nothing to download), a QR code and a Code 128 order
// barcode drawn as native vector shapes, and an itemised total. It weighs a few
// KB and builds in microseconds. Authored through the options-object front door.
//
// Deploying it to a Cloudflare Worker is this small:
//
//   import { generate } from '@bonniepdf/examples/edge-receipt';
//   export default {
//     async fetch(): Promise<Response> {
//       const bytes = await generate().generateBytesAsync();
//       return new Response(bytes, { headers: { 'content-type': 'application/pdf' } });
//     },
//   };
//
// `generateBytesAsync()` is the universal path - it runs unchanged in the
// browser, in a Worker, in Node, Bun, and Deno. No Cloud service is required;
// the library does all the work locally.

import {
  Document,
  TextBlock,
  Heading,
  HorizontalStack,
  Container,
  Barcode,
  BarcodeSymbology,
  QRCode,
  PdfSize,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[800];
const MUTE = ColorPalette.slate[500];

// 80 mm thermal receipt width = 226.77pt; a comfortable single-page height.
const PAGE = new PdfSize(226.77, 720, 'Receipt 80mm');

interface Item {
  qty: number;
  name: string;
  price: number; // line total in GBP, VAT-inclusive
}

const ITEMS: Item[] = [
  { qty: 2, name: 'Flat White', price: 5.6 },
  { qty: 1, name: 'Almond Croissant', price: 3.2 },
  { qty: 1, name: 'Sourdough Loaf', price: 4.5 },
  { qty: 1, name: 'Oat Milk (retail)', price: 1.95 },
];

const ORDER_NO = '4021';

export function generate(): Document {
  const now = new Date();
  const stamp = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: 16,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Courier', fontSize: 9, color: INK },
    },
    metadata: {
      title: `Receipt #${ORDER_NO} - Sample Coffee`,
      author: 'Sample Coffee',
      subject: 'Point-of-sale receipt generated client-side / at the edge with BonniePDF.',
    },
  });

  // ── Store header ────────────────────────────────────────────────────────
  doc.add(
    new Heading('SAMPLE COFFEE', {
      level: 1,
      fontName: StandardFonts.CourierBold,
      fontSize: 13,
      color: INK,
      alignment: 'center',
      margin: { bottom: 3 },
    })
  );
  doc.add(center('123 Harbour Road, Bristol BS1 4RW'));
  doc.add(center('+44 117 555 0110'));

  doc.add(rule());

  // ── Order meta ──────────────────────────────────────────────────────────
  doc.add(kv('Order', `#${ORDER_NO}`));
  doc.add(kv('Date', stamp));
  doc.add(kv('Served', 'Register 3 · Alex'));

  doc.add(rule());

  // ── Items ───────────────────────────────────────────────────────────────
  let total = 0;
  for (const it of ITEMS) {
    total += it.price;
    doc.add(kv(`${it.qty} x ${it.name}`, gbp(it.price)));
  }

  doc.add(rule());

  // ── Totals (prices are VAT-inclusive; show the VAT portion) ─────────────
  const vat = total - total / 1.2;
  doc.add(kv('Subtotal', gbp(total - vat)));
  doc.add(kv('VAT (20%)', gbp(vat)));
  doc.add(kv('TOTAL', gbp(total), { bold: true, size: 12 }));

  doc.add(rule());

  doc.add(kv('Card ···· 4242', gbp(total)));
  doc.add(kv('Approved', 'AUTH 06Q41X'));

  doc.add(rule());

  // ── Digital-receipt QR (native vector, no image assets) ─────────────────
  doc.add(
    new Container({
      horizontalAlignment: 'center',
      padding: { top: 4, bottom: 4 },
      child: new QRCode({
        data: `https://receipts.example.com/r/${ORDER_NO}`,
        size: 108,
        quietZone: 1,
        errorCorrection: 'medium',
        foregroundColor: INK,
        altText: `QR code linking to the digital receipt for order ${ORDER_NO}.`,
      }),
    })
  );
  doc.add(center('Scan for your digital receipt', 8, MUTE));

  // ── Order barcode (Code 128) ────────────────────────────────────────────
  doc.add(
    new Container({
      horizontalAlignment: 'center',
      padding: { top: 8, bottom: 2 },
      child: new Barcode({
        value: `NW${ORDER_NO}`,
        symbology: BarcodeSymbology.Code128,
        height: 38,
        altText: `Order barcode (Code 128): NW${ORDER_NO}`,
      }),
    })
  );

  doc.add(rule());

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.add(center('Thank you! Returns within 30 days', 8, INK));
  doc.add(center('with your receipt.', 8, MUTE));
  doc.add(center('Generated at the edge with BonniePDF', 7, MUTE, 8));

  return doc;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function gbp(n: number): string {
  return '£' + n.toFixed(2);
}

/** A centred single line of receipt text. */
function center(text: string, size = 8, color: ColorInput = MUTE, marginTop = 0): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Courier,
    fontSize: size,
    color: color,
    alignment: 'center',
    margin: marginTop ? { top: marginTop } : undefined,
  });
}

/** A "label ............ value" row: label grows left, value hugs the right edge. */
function kv(label: string, value: string, opts: { bold?: boolean; size?: number } = {}): HorizontalStack {
  const size = opts.size ?? 9;
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 1.5, bottom: 1.5 } });
  row.add(cell(label, size, opts.bold, 'left'), 3);
  row.add(cell(value, size, opts.bold, 'right'), 2);
  return row;
}

function cell(text: string, size: number, bold = false, align: TextAlignmentInput = 'left'): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.CourierBold : StandardFonts.Courier,
    fontSize: size,
    color: INK,
    alignment: align,
  });
}

/** A dashed tear-line rule, the way a thermal printer separates sections. */
function rule(): TextBlock {
  return new TextBlock('- - - - - - - - - - - - - - - -', {
    fontName: StandardFonts.Courier,
    fontSize: 9,
    color: MUTE,
    alignment: 'center',
    margin: { top: 5, bottom: 5 },
  });
}
