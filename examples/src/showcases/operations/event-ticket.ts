// Event Ticket
//
// Event ticket / boarding-pass style card (gallery #8): PDF/A-2a + PDF/UA-1
// with a Code 128 ticket-id barcode and a QR entry pass (both with alt
// text), and a perforation-style tear-off stub. Proves QR + barcode + visual
// polish on a custom ticket page size. The event name is the document's H1.
// Authored through the options-object front door.

import {
  Document,
  TextBlock,
  Heading,
  VerticalStack,
  Container,
  Image,
  Grid,
  Barcode,
  BarcodeSymbology,
  QRCode,
  PdfSize,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
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

function field(label: string, value: string, color: ColorInput, labelColor: ColorInput): VerticalStack {
  return new VerticalStack({
    children: [tb(label, 7, labelColor, { bold: true, mb: 2 }), tb(value, 11, color, { bold: true })],
  });
}

/**
 * Event ticket / boarding-pass style card (gallery #8): PDF/A-2a + PDF/UA-1 with
 * a Code 128 ticket-id barcode and a QR entry pass (both with alt text), and a
 * perforation-style tear-off stub. Proves QR + barcode + visual polish on a
 * custom ticket page size. The event name is the document's H1.
 */
export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const bgData = assets.get(BG_IMAGE);
  if (!bgData) throw new Error(`Missing required asset: ${BG_IMAGE}`);

  const doc = new Document({
    settings: {
      // Landscape boarding-pass style ticket: 640 x 300 pt.
      pageSize: new PdfSize(640, 300, 'Event Ticket'),
      orientation: 'landscape',
      margin: 0,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: BODY },
      pageBackground: () =>
        new Container({
          height: 300,
          child: new Image({
            imageData: bgData,
            width: 640,
            height: 300,
            fitMode: 'cover',
            isDecorative: true,
          }),
        }),
    },
    metadata: {
      title: 'Event Ticket - Sample Sound Festival',
      author: 'Sample Live',
      subject: 'Event ticket - accessible (PDF/UA) and archival (PDF/A-2a)',
    },
  });

  // ── Main body (dark) ────────────────────────────────────────────────────────
  const facts = new Grid({ columns: [1, 1, 1], border: 0, cellPadding: 0 });
  facts.addRow(
    field('DATE', '18 Jul 2026', CREAM, MUTE),
    field('GATES', '16:00', CREAM, MUTE),
    field('ADMITS', 'One', CREAM, MUTE)
  );

  const info = new VerticalStack({
    children: [
      tb('SAMPLE LIVE presents', 8, ACCENT, { bold: true, mb: 6 }),
      new Heading('Sample Sound Festival', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 19,
        textColor: CREAM,
        margin: { bottom: 3 },
      }),
      tb('Main Stage, Victoria Park, London', 10, BODY, { mb: 12 }),
      facts,
      // Ticket-id barcode runs along the full width of the body.
      new Container({
        margin: { top: 16 },
        child: new Barcode({
          value: 'ASF26-4471-XK',
          symbology: BarcodeSymbology.Code128,
          height: 36,
          moduleWidth: 1.2,
          // Dark bars on a light strip: scanners read the dark elements, so an
          // inverted (light-on-dark) barcode will not decode. The background
          // also paints the quiet zone the symbology requires.
          foregroundColor: INK,
          backgroundColor: CREAM,
          textLabelFontSize: 7,
          altText: 'Ticket barcode (Code 128): ASF26-4471-XK',
        }),
      }),
    ],
  });

  const body = new Container({
    backgroundColor: INK.withAlpha(0.82),
    height: 300,
    padding: [22, 18, 22, 16],
    child: info,
  });

  // ── Tear-off stub (lighter) with the QR entry pass ──────────────────────────
  const qrCard = new Container({
    backgroundColor: '#ffffff',
    cornerRadius: 6,
    clipContent: true,
    padding: 6,
    horizontalAlignment: 'center',
    child: new QRCode({
      data: 'https://tix.aurora.example/t/ASF26-4471-XK',
      size: 96,
      quietZone: 1,
      errorCorrection: 'quartile',
      foregroundColor: INK,
      altText: 'Entry QR code for ticket ASF26-4471-XK - scan at the gate',
    }),
  });

  const stub = new VerticalStack({
    children: [
      tb('ADMIT ONE', 8, ACCENT, { bold: true, mb: 8, align: 'center' }),
      new Container({ horizontalAlignment: 'center', margin: { bottom: 10 }, child: qrCard }),
      tb('SECTION', 7, MUTE, { bold: true, mb: 2, align: 'center' }),
      tb('GA - STANDING', 12, CREAM, { bold: true, mb: 8, align: 'center' }),
      tb('TICKET', 7, MUTE, { bold: true, mb: 2, align: 'center' }),
      tb('ASF26-4471-XK', 10, CREAM, { bold: true, align: 'center' }),
    ],
  });

  const stubBox = new Container({
    backgroundColor: STUB,
    height: 300,
    padding: [16, 18],
    border: { left: 1, color: ACCENT },
    child: stub,
  });

  // ── Compose body | stub ─────────────────────────────────────────────────────
  const ticket = new Grid({ columns: [2.5, 1.1], border: 0, cellPadding: 0 });
  ticket.addRow(body, stubBox);
  doc.add(ticket);

  return doc;
}
