/**
 * Point-of-Sale Receipt.
 * A point-of-sale receipt on an 80 mm thermal page, in Courier with a vector QR link and a Code 128 barcode. Generated locally with explicit fonts when archival or accessible output is requested.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Browser / Cloudflare Worker receipt ──────────────────────────────────────
//
// The examples for BonniePDF's defining platform story: generating a real PDF
// **in the browser or at the edge**, with zero runtime dependencies, no native
// binaries, and no WASM. A point-of-sale receipt is the perfect fit - small,
// synchronous to build, and exactly the kind of document a SaaS checkout or a
// Cloudflare Worker hands back on the response.
//
// The whole document is a narrow 80 mm thermal-printer page rendered in Courier
// (embedded when PDF/A or PDF/UA is requested), a QR code and a Code 128 order
// barcode drawn as native vector shapes, and an itemised total. Provide the required font assets in the host before generation. Authored through the options-object front door.
//
// The async host pattern (configure your platform, licence and fonts at startup):
//
//   // Install @bonniepdf/core and declare your applicable licence tier.
//   import { generate } from './edge-receipt'; // copy this builder into your app
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
  Line,
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
  Svg,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[800];
const MUTE = ColorPalette.slate[500];

// 80 mm thermal receipt width = 226.77pt; a comfortable single-page height.
const PAGE = new PdfSize(226.77, 720, 'Receipt 80mm');

const ITEMS: Item[] = [
  { qty: 2, name: 'Flat White', price: 5.6 },
  { qty: 1, name: 'Almond Croissant', price: 3.2 },
  { qty: 1, name: 'Sourdough Loaf', price: 4.5 },
  { qty: 1, name: 'Oat Milk (retail)', price: 1.95 },
];

const ORDER_NO = '4021';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const stamp = '16 Jun 2026 10:30';
  const logoBytes = assets.get('images/svg/sample-coffee.svg');
  if (!logoBytes) throw new Error('Supply images/svg/sample-coffee.svg.');
  const logoSvg = new TextDecoder().decode(logoBytes);

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
    new Container({
      horizontalAlignment: 'center',
      margin: { bottom: 4 },
      child: new Svg({ svgData: logoSvg, width: 24, height: 24, isDecorative: true }),
    })
  );
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
  doc.add(kv('Order', `#${ORDER_NO}`, { weights: [1, 2] }));
  doc.add(kv('Date', stamp, { weights: [1, 2] }));
  doc.add(kv('Served', 'Register 3 - Alex', { weights: [1, 2] }));

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

  doc.add(kv('Card **** 4242', gbp(total)));
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
  doc.add(center('with your receipt.', 8, INK));
  doc.add(center('Generated with BonniePDF', 7, MUTE, 8));

  return doc;
}

// Local helpers and sample types used by this document.

interface Item {
  qty: number;
  name: string;
  price: number; // line total in GBP, VAT-inclusive
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
function kv(
  label: string,
  value: string,
  opts: { bold?: boolean; size?: number; weights?: [number, number] } = {}
): HorizontalStack {
  const size = opts.size ?? 9;
  const [leftWeight, rightWeight] = opts.weights ?? [3, 2];
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 1.5, bottom: 1.5 } });
  row.add(cell(label, size, opts.bold, 'left'), leftWeight);
  row.add(cell(value, size, opts.bold, 'right'), rightWeight);
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
function rule(): Line {
  return new Line({
    thickness: 0.8,
    color: MUTE,
    dashPattern: [3, 4],
    margin: { top: 10, bottom: 10 },
  });
}
