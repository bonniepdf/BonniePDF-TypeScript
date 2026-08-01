import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PageOrientation,
  PdfAConformance,
  AccessibilityMode,
  TextStyle,
  TextBlock,
  TextAlignment,
  Heading,
  VerticalStack,
  Container,
  Image,
  ImageFitMode,
  Table,
  Grid,
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
  HorizontalAlignment,
} from '@bonniepdf/core';

const BG_IMAGE = 'images/danny-howe-bn-D2bCvpik-unsplash.jpg';

const INK = ColorPalette.slate[900];
const CREAM = ColorPalette.slate[100];
const MUTE = ColorPalette.slate[400];
const BODY = ColorPalette.slate[300];
const ACCENT = ColorPalette.violet[500];
const STUB = ColorPalette.slate[800];

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

function field(label: string, value: string, color: Color, labelColor: Color): VerticalStack {
  const v = new VerticalStack();
  v.addChild(tb(label, 7, labelColor, { bold: true, mb: 2 }));
  v.addChild(tb(value, 11, color, { bold: true }));
  return v;
}

/**
 * Event ticket / boarding-pass style card (gallery #8): PDF/A-2a + PDF/UA-1 with
 * a Code 128 ticket-id barcode and a QR entry pass (both with alt text), and a
 * perforation-style tear-off stub. Proves QR + barcode + visual polish on a
 * custom ticket page size. The event name is the document's H1.
 */
export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  // Landscape boarding-pass style ticket: 640 x 300 pt.
  const settings = new DocumentSettings(new PdfSize(640, 300, 'Event Ticket'), 0);
  settings.orientation = PageOrientation.Landscape;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(BODY);

  const metadata = new DocumentMetadata();
  metadata.title = 'Event Ticket - Sample Sound Festival';
  metadata.author = 'Sample Live';
  metadata.subject = 'Event ticket - accessible (PDF/UA) and archival (PDF/A-2a)';

  const bgData = assets?.get(BG_IMAGE);
  if (bgData) {
    settings.pageBackground = (): Container => {
      const bg = new Container();
      bg.height = 300;
      const img = new Image();
      img.imageData = bgData;
      img.width = 640;
      img.height = 300;
      img.fitMode = ImageFitMode.Cover;
      img.isDecorative = true;
      bg.child = img;
      return bg;
    };
  }

  const doc = new Document(settings, metadata);

  // ── Main body (dark) ────────────────────────────────────────────────────────
  const info = new VerticalStack();
  info.addChild(tb('SAMPLE LIVE presents', 8, ACCENT, { bold: true, mb: 6 }));

  const eventName = new Heading('Sample Sound Festival');
  eventName.fontName = StandardFonts.HelveticaBold;
  eventName.fontSize = 19;
  eventName.textColor = CREAM;
  eventName.margin = new Thickness(0, 0, 0, 3);
  info.addChild(eventName);

  info.addChild(tb('Main Stage, Victoria Park, London', 10, BODY, { mb: 12 }));

  const facts = new Grid(1, 1, 1);
  facts.border = Border.none;
  facts.cellPadding = 0;
  facts.addRow(
    field('DATE', '18 Jul 2026', CREAM, MUTE),
    field('GATES', '16:00', CREAM, MUTE),
    field('ADMITS', 'One', CREAM, MUTE)
  );
  info.addChild(facts);

  // Ticket-id barcode runs along the full width of the body.
  const ticketBarcode = new Barcode();
  ticketBarcode.value = 'ASF26-4471-XK';
  ticketBarcode.symbology = BarcodeSymbology.Code128;
  ticketBarcode.height = 36;
  ticketBarcode.moduleWidth = 1.2;
  // Dark bars on a light strip: scanners read the dark elements, so an inverted
  // (light-on-dark) barcode will not decode. The background also paints the
  // quiet zone the symbology requires.
  ticketBarcode.foregroundColor = INK;
  ticketBarcode.backgroundColor = CREAM;
  ticketBarcode.textLabelFontSize = 7;
  ticketBarcode.altText = 'Ticket barcode (Code 128): ASF26-4471-XK';
  const barcodeWrap = new Container();
  barcodeWrap.child = ticketBarcode;
  barcodeWrap.margin = new Thickness(0, 16, 0, 0);
  info.addChild(barcodeWrap);

  const body = new Container();
  body.backgroundColor = bgData ? INK.withAlpha(0.82) : INK;
  body.height = 300;
  body.padding = new Thickness(22, 18, 22, 16);
  body.child = info;

  // ── Tear-off stub (lighter) with the QR entry pass ──────────────────────────
  const stub = new VerticalStack();
  stub.addChild(tb('ADMIT ONE', 8, ACCENT, { bold: true, mb: 8, align: TextAlignment.Center }));

  const qr = new QRCode();
  qr.data = 'https://tix.aurora.example/t/ASF26-4471-XK';
  qr.size = 96;
  qr.quietZone = 1;
  qr.errorCorrection = QrEcc.Quartile;
  qr.foregroundColor = INK;
  qr.altText = 'Entry QR code for ticket ASF26-4471-XK - scan at the gate';
  const qrCard = new Container();
  qrCard.backgroundColor = Color.white;
  qrCard.cornerRadius = 6;
  qrCard.clipContent = true;
  qrCard.padding = new Thickness(6);
  qrCard.horizontalAlignment = HorizontalAlignment.Center;
  qrCard.child = qr;
  const qrWrap = new Container();
  qrWrap.horizontalAlignment = HorizontalAlignment.Center;
  qrWrap.margin = new Thickness(0, 0, 0, 10);
  qrWrap.child = qrCard;
  stub.addChild(qrWrap);

  stub.addChild(tb('SECTION', 7, MUTE, { bold: true, mb: 2, align: TextAlignment.Center }));
  stub.addChild(tb('GA - STANDING', 12, CREAM, { bold: true, mb: 8, align: TextAlignment.Center }));
  stub.addChild(tb('TICKET', 7, MUTE, { bold: true, mb: 2, align: TextAlignment.Center }));
  stub.addChild(tb('ASF26-4471-XK', 10, CREAM, { bold: true, align: TextAlignment.Center }));

  const stubBox = new Container();
  stubBox.backgroundColor = STUB;
  stubBox.height = 300;
  stubBox.padding = new Thickness(16, 18, 16, 18);
  stubBox.border = Border.leftOnly(1);
  stubBox.borderColors = BorderColors.leftOnly(ACCENT);
  stubBox.child = stub;

  // ── Compose body | stub ─────────────────────────────────────────────────────
  const ticket = new Grid(2.5, 1.1);
  ticket.border = Border.none;
  ticket.cellPadding = 0;
  ticket.addRow(body, stubBox);
  doc.add(ticket);

  return doc;
}
