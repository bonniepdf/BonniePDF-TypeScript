/** A restaurant gift voucher on a DL page: the value in large serif type, the recipient’s name, a serial barcode, and a perforated stub the restaurant keeps, with a QR code to check the balance. */
import {
  Barcode,
  BarcodeSymbology,
  CanvasElement,
  ColorPalette,
  Container,
  Document,
  Heading,
  HorizontalStack,
  Image,
  PdfSize,
  QRCode,
  StandardFonts,
  Svg,
  TextBlock,
  VerticalStack,
} from '@bonniepdf/core';

/** A DL page, 210 × 99 mm, in points. */
const DL = new PdfSize(595.3, 280.6, 'DL');
const SERIAL = 'LRD-100-4821-7730';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      pageSize: DL,
      preservePageDimensions: true,
      margin: 0,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8.5, color: 'stone-700' },
    },
    metadata: { title: 'The Larder gift voucher', author: 'The Larder', subject: `Gift voucher ${SERIAL}, £100` },
  });
  const bytes = assets.get('fonts/SourceSerif4-Regular.ttf');
  if (!bytes) throw new Error('Supply fonts/SourceSerif4-Regular.ttf.');
  const serif = doc.fonts.add(bytes).fontName;
  const voucherPhoto = assets.get('images/hospitality/voucher.jpg');
  if (!voucherPhoto) throw new Error('Supply images/hospitality/voucher.jpg.');
  const sprigBytes = assets.get('images/svg/the-larder.svg');
  if (!sprigBytes) throw new Error('Supply images/svg/the-larder.svg.');
  const sprigSvg = new TextDecoder().decode(sprigBytes);

  // ── The voucher: dark, with the value large ──
  const voucher = new Container({
    backgroundColor: 'stone-900',
    height: DL.height,
    padding: [28, 14],
    child: new VerticalStack({
      spacing: 2,
      children: [
        new HorizontalStack({
          widthDistribution: 'auto',
          spacing: 6,
          margin: { bottom: 2 },
          children: [
            new Svg({ svgData: sprigSvg, width: 22, height: 22, isDecorative: true }),
            new TextBlock('THE LARDER  ·  GIFT VOUCHER', {
              fontName: StandardFonts.HelveticaBold,
              fontSize: 8,
              letterSpacing: 2.5,
              color: 'amber-300',
              margin: { top: 6 },
            }),
          ],
        }),
        new Container({
          height: 56,
          cornerRadius: 4,
          clipContent: true,
          margin: { bottom: 2 },
          child: new Image({
            imageData: voucherPhoto,
            height: 56,
            fitMode: 'cover',
            altText: 'Candlelit dining room tables laid with white linen and glassware.',
          }),
        }),
        new Heading('A gift for dinner', { level: 1, fontName: serif, fontSize: 22, color: '#ffffff', margin: 0 }),
        new TextBlock('£100', { fontName: serif, fontSize: 36, color: 'amber-200' }),
        new TextBlock('to spend on food and drink, at lunch or dinner, any day we are open', {
          fontSize: 8.5,
          color: 'stone-300',
          margin: { bottom: 2 },
        }),
        new TextBlock('For Priya Shah, with love from Tom', {
          fontName: serif,
          fontSize: 12,
          color: '#ffffff',
          margin: { bottom: 4 },
        }),
        new HorizontalStack({
          widthDistribution: 'auto',
          spacing: 12,
          children: [
            new Container({
              backgroundColor: '#ffffff',
              cornerRadius: 3,
              padding: [6, 4],
              child: new Barcode({
                value: SERIAL,
                symbology: BarcodeSymbology.Code128,
                height: 22,
                moduleWidth: 0.8,
                foregroundColor: 'stone-900',
                backgroundColor: '#ffffff',
                textLabelFontSize: 6,
                altText: `Voucher serial number barcode: ${SERIAL}`,
              }),
            }),
            new TextBlock(`Valid until 5 November 2027\nSerial ${SERIAL}`, { fontSize: 7.5, color: 'stone-400' }),
          ],
        }),
      ],
    }),
  });

  // ── The stub the restaurant keeps ──
  const stub = new Container({
    height: DL.height,
    padding: [16, 26],
    child: new VerticalStack({
      spacing: 3,
      children: [
        new TextBlock('RESTAURANT COPY', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 7,
          letterSpacing: 1.2,
          color: 'amber-800',
          margin: { bottom: 8 },
        }),
        ...[
          ['Serial', SERIAL],
          ['Value', '£100.00'],
          ['Issued', '5 November 2026'],
          ['Expires', '5 November 2027'],
        ].map(
          ([label, value]) =>
            new VerticalStack({
              margin: { bottom: 4 },
              children: [
                new TextBlock(label, { fontSize: 6.5, color: 'stone-500' }),
                new TextBlock(value, { fontName: StandardFonts.HelveticaBold, fontSize: 8.5, color: 'stone-900' }),
              ],
            })
        ),
        new QRCode({
          data: `https://thelarder.example/v/${SERIAL}`,
          size: 54,
          quietZone: 1,
          foregroundColor: 'stone-900',
          altText: `QR code: check the balance of voucher ${SERIAL}`,
          margin: { top: 4 },
        }),
        new TextBlock('Scan to check the balance', { fontSize: 6.5, color: 'stone-500' }),
      ],
    }),
  });

  const sheet = new HorizontalStack({ widthDistribution: 'weighted' });
  sheet.add(new Container({ backgroundColor: 'amber-700', width: 8, height: DL.height }));
  sheet.add(voucher, 3.2);
  sheet.add(perforation());
  sheet.add(stub, 1);
  doc.add(sheet);
  return doc;
}

// Local helpers used by this document.

/** The tear line between the voucher and its stub: a column of small dots with a notch at each end. */
function perforation(): CanvasElement {
  return new CanvasElement(
    (canvas, size) => {
      const x = size.width / 2;
      canvas.fillCircle(x, 0, 6, ColorPalette.stone[300]);
      canvas.fillCircle(x, size.height, 6, ColorPalette.stone[300]);
      for (let y = 12; y < size.height - 10; y += 6) canvas.fillCircle(x, y, 1, ColorPalette.stone[300]);
    },
    { drawWidth: 14, drawHeight: DL.height, isDecorative: true }
  );
}
