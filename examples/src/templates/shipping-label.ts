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
  Barcode,
  BarcodeSymbology,
  QRCode,
  QrEcc,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[900];
const BODY = ColorPalette.slate[700];
const MUTE = ColorPalette.slate[500];
const LINE = ColorPalette.slate[300];

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

// A full-bleed black band with white text (carrier header / service class).
function band(text: string, size: number, bg: Color, fg: Color, align = TextAlignment.Left): Container {
  const c = new Container();
  c.backgroundColor = bg;
  c.padding = new Thickness(10, 5, 10, 5);
  c.child = tb(text, size, fg, { bold: true, align });
  return c;
}

function hrule(mt: number, mb: number): Container {
  const r = new Container();
  r.backgroundColor = LINE;
  const s = new TextBlock(' ');
  s.fontSize = 0.5;
  r.child = s;
  r.padding = new Thickness(0, 0.5, 0, 0.5);
  r.margin = new Thickness(0, mt, 0, mb);
  return r;
}

/**
 * Carrier-style 4x6in shipping label (gallery #6): PDF/A-2a + PDF/UA-1 with a
 * Code 128 tracking barcode, an ITF-14 carton code, and a QR parcel link - each
 * with alt text. Proves native vector barcodes and exact label sizing.
 * Fictional carrier and codes only.
 */
export function generate(): Document {
  // 4 x 6 inch label = 288 x 432 pt.
  const settings = new DocumentSettings(new PdfSize(288, 432, 'Shipping Label 4x6'), 12);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(8).withColor(BODY);

  const metadata = new DocumentMetadata();
  metadata.title = 'Shipping Label 1Z999AA10123456784';
  metadata.author = 'Acme Logistics';
  metadata.subject = 'Carrier-style shipping label - accessible (PDF/UA) and archival (PDF/A-2a)';

  const doc = new Document(settings, metadata);

  const heading = new Heading('Shipping label');
  heading.fontSize = 11;
  heading.margin = new Thickness(0, 0, 0, 6);
  doc.add(heading);

  // ── Carrier header + service class ──────────────────────────────────────────
  doc.add(band('ACME LOGISTICS', 12, INK, Color.white));
  const svc = new Container();
  svc.backgroundColor = ColorPalette.slate[800];
  svc.padding = new Thickness(10, 4, 10, 4);
  const svcRow = new Table(1, 1);
  svcRow.border = Border.none;
  svcRow.cellPadding = 0;
  const sc1 = new Container();
  sc1.child = tb('EXPRESS - NEXT DAY', 10, Color.white, { bold: true });
  const sc2 = new Container();
  sc2.child = tb('1.4 kg', 10, Color.white, { bold: true, align: TextAlignment.Right });
  svcRow.addRow(sc1, sc2);
  svc.child = svcRow;
  doc.add(svc);

  doc.add(hrule(5, 4));

  // ── From / To addresses ─────────────────────────────────────────────────────
  const from = new VerticalStack();
  from.addChild(tb('FROM', 7, MUTE, { bold: true, mb: 2 }));
  from.addChild(tb('Northwind Supplies', 8, INK, { bold: true }));
  from.addChild(tb('4 Tenter Ground', 8, BODY));
  from.addChild(tb('London E1 7NH, UK', 8, BODY));
  const fromWrap = new Container();
  fromWrap.child = from;
  fromWrap.margin = new Thickness(0, 0, 0, 4);
  doc.add(fromWrap);

  const to = new VerticalStack();
  to.addChild(tb('SHIP TO', 8, MUTE, { bold: true, mb: 3 }));
  to.addChild(tb('Jordan Avery', 13, INK, { bold: true }));
  to.addChild(tb('Aperture Labs Inc.', 10, INK));
  to.addChild(tb('19 Enfield Road', 10, INK));
  to.addChild(tb('London N1 5BA', 10, INK));
  to.addChild(tb('United Kingdom', 10, INK));
  const toWrap = new Container();
  toWrap.child = to;
  toWrap.border = new Border(1);
  toWrap.borderColors = new BorderColors(INK);
  toWrap.padding = new Thickness(9, 6, 9, 6);
  doc.add(toWrap);

  // ── Routing band (postcode zone) ────────────────────────────────────────────
  doc.add(band('N1  -  ZONE 24  -  LON', 13, INK, Color.white, TextAlignment.Center));

  doc.add(hrule(5, 4));

  // ── Tracking barcode (Code 128) ─────────────────────────────────────────────
  const tracking = new Barcode();
  tracking.value = '1Z999AA10123456784';
  tracking.symbology = BarcodeSymbology.Code128;
  tracking.height = 46;
  tracking.altText = 'Tracking barcode (Code 128): 1Z999AA10123456784';
  const trackWrap = new Container();
  trackWrap.child = tracking;
  trackWrap.padding = new Thickness(4, 4, 4, 2);
  doc.add(tb('TRACKING NO.', 7, MUTE, { bold: true, mb: 2 }));
  doc.add(trackWrap);

  doc.add(hrule(5, 4));

  // ── Carton code (ITF-14) + QR parcel link, side by side ─────────────────────
  const carton = new Barcode();
  carton.value = '1540141253721'; // 13 digits + auto check = ITF-14
  carton.symbology = BarcodeSymbology.Itf14;
  carton.height = 40;
  carton.altText = 'Carton code (ITF-14): 1540141253721';
  const cartonStack = new VerticalStack();
  cartonStack.addChild(tb('CARTON (ITF-14)', 7, MUTE, { bold: true, mb: 2 }));
  const cartonWrap = new Container();
  cartonWrap.child = carton;
  cartonStack.addChild(cartonWrap);

  const qr = new QRCode();
  qr.data = 'https://track.acme.example/p/1Z999AA10123456784';
  qr.size = 66;
  qr.quietZone = 1;
  qr.errorCorrection = QrEcc.Quartile;
  qr.altText = 'QR code linking to parcel tracking for 1Z999AA10123456784';
  const qrStack = new VerticalStack();
  qrStack.addChild(tb('SCAN', 7, MUTE, { bold: true, mb: 2, align: TextAlignment.Right }));
  const qrInner = new Container();
  qrInner.horizontalAlignment = undefined;
  qrInner.child = qr;
  qrStack.addChild(qrInner);

  const bottom = new Table(2, 1);
  bottom.border = Border.none;
  bottom.cellPadding = 0;
  const bc1 = new Container();
  bc1.child = cartonStack;
  const bc2 = new Container();
  bc2.child = qrStack;
  bottom.addRow(bc1, bc2);
  doc.add(bottom);

  return doc;
}
