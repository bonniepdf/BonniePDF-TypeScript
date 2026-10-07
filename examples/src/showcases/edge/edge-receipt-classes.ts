/**
 * Point-of-Sale Receipt (Class API).
 * The same 80 mm thermal-printer receipt as Point-of-Sale Receipt, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
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
// KB and builds in microseconds.
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
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  HorizontalStack,
  Container,
  HorizontalAlignment,
  Barcode,
  BarcodeSymbology,
  QRCode,
  QrEcc,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  PdfAConformance,
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

/**
 * The **class / construct-then-mutate** companion to `edge-receipt.ts`.
 *
 * Same 80mm thermal-printer receipt (QR + Code 128), authored the long way:
 * `new` each element and assign properties, using the `TextAlignment`/
 * `HorizontalAlignment` enums, `TextStyle`, `Thickness`, `Color` and
 * `ColorPalette` directly. This is the escape hatch the options-object front
 * door sits on top of. Renders **byte-for-byte identically** to the options-style
 * `edge-receipt.ts`.
 */
export function generate(): Document {
  const stamp = '16 Jun 2026 10:30';

  const settings = new DocumentSettings(PAGE, 16);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Courier').withSize(9).withColor(INK);

  const metadata = new DocumentMetadata();
  metadata.title = `Receipt #${ORDER_NO} - Sample Coffee`;
  metadata.author = 'Sample Coffee';
  metadata.subject = 'Point-of-sale receipt generated client-side / at the edge with BonniePDF.';

  const doc = new Document(settings, metadata);

  // ── Store header ────────────────────────────────────────────────────────
  const name = new Heading('SAMPLE COFFEE');
  name.level = 1;
  name.fontName = StandardFonts.CourierBold;
  name.fontSize = 13;
  name.color = INK;
  name.alignment = TextAlignment.Center;
  name.margin = new Thickness(0, 0, 0, 3);
  doc.add(name);
  doc.add(center('123 Harbour Road, Bristol BS1 4RW'));
  doc.add(center('+44 117 555 0110'));

  doc.add(rule());

  // ── Order meta ──────────────────────────────────────────────────────────
  doc.add(kv('Order', `#${ORDER_NO}`));
  doc.add(kv('Date', stamp));
  doc.add(kv('Served', 'Register 3 - Alex'));

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
  const qr = new QRCode();
  qr.data = `https://receipts.example.com/r/${ORDER_NO}`;
  qr.size = 108;
  qr.quietZone = 1;
  qr.errorCorrection = QrEcc.Medium;
  qr.foregroundColor = INK;
  qr.altText = `QR code linking to the digital receipt for order ${ORDER_NO}.`;
  const qrWrap = new Container();
  qrWrap.child = qr;
  qrWrap.horizontalAlignment = HorizontalAlignment.Center;
  qrWrap.padding = new Thickness(0, 4, 0, 4);
  doc.add(qrWrap);
  doc.add(center('Scan for your digital receipt', 8, MUTE));

  // ── Order barcode (Code 128) ────────────────────────────────────────────
  const barcode = new Barcode();
  barcode.value = `NW${ORDER_NO}`;
  barcode.symbology = BarcodeSymbology.Code128;
  barcode.height = 38;
  barcode.altText = `Order barcode (Code 128): NW${ORDER_NO}`;
  const barWrap = new Container();
  barWrap.child = barcode;
  barWrap.horizontalAlignment = HorizontalAlignment.Center;
  barWrap.padding = new Thickness(0, 8, 0, 2);
  doc.add(barWrap);

  doc.add(rule());

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.add(center('Thank you! Returns within 30 days', 8, INK));
  doc.add(center('with your receipt.', 8, MUTE));
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
function center(text: string, size = 8, color: Color = MUTE, marginTop = 0): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Courier;
  b.fontSize = size;
  b.color = color;
  b.alignment = TextAlignment.Center;
  if (marginTop) b.margin = new Thickness(0, marginTop, 0, 0);
  return b;
}

/** A "label ............ value" row: label grows left, value hugs the right edge. */
function kv(label: string, value: string, opts: { bold?: boolean; size?: number } = {}): HorizontalStack {
  const size = opts.size ?? 9;
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 1.5, 0, 1.5);
  row.add(cell(label, size, opts.bold, TextAlignment.Left), 3);
  row.add(cell(value, size, opts.bold, TextAlignment.Right), 2);
  return row;
}

function cell(text: string, size: number, bold = false, align: TextAlignment = TextAlignment.Left): TextBlock {
  const b = new TextBlock(text);
  b.fontName = bold ? StandardFonts.CourierBold : StandardFonts.Courier;
  b.fontSize = size;
  b.color = INK;
  b.alignment = align;
  return b;
}

/** A dashed tear-line rule, the way a thermal printer separates sections. */
function rule(): TextBlock {
  const b = new TextBlock('- - - - - - - - - - - - - - - -');
  b.fontName = StandardFonts.Courier;
  b.fontSize = 9;
  b.color = MUTE;
  b.alignment = TextAlignment.Center;
  b.margin = new Thickness(0, 5, 0, 5);
  return b;
}
