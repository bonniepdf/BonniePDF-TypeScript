// Shipping Label
//
// Carrier-style 4x6in shipping label (gallery #6): PDF/A-2a + PDF/UA-1 with a
// Code 128 tracking barcode, an ITF-14 carton code, and a QR parcel link -
// each with alt text. Proves native vector barcodes and exact label sizing.
// Fictional carrier and codes only. Authored through the options-object
// front door.

import {
  Document,
  TextBlock,
  Heading,
  VerticalStack,
  Container,
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

const INK = ColorPalette.slate[900];
const BODY = ColorPalette.slate[700];
const MUTE = ColorPalette.slate[500];
const LINE = ColorPalette.slate[300];

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

// A full-bleed black band with white text (carrier header / service class).
function band(
  text: string,
  size: number,
  bg: ColorInput,
  fg: ColorInput,
  align: TextAlignmentInput = 'left'
): Container {
  return new Container({ backgroundColor: bg, padding: [10, 5], child: tb(text, size, fg, { bold: true, align }) });
}

function hrule(mt: number, mb: number): Container {
  return new Container({
    backgroundColor: LINE,
    padding: { top: 0.5, bottom: 0.5 },
    margin: { top: mt, bottom: mb },
    child: new TextBlock(' ', { fontSize: 0.5 }),
  });
}

/**
 * Carrier-style 4x6in shipping label (gallery #6): PDF/A-2a + PDF/UA-1 with a
 * Code 128 tracking barcode, an ITF-14 carton code, and a QR parcel link - each
 * with alt text. Proves native vector barcodes and exact label sizing.
 * Fictional carrier and codes only.
 */
export function generate(): Document {
  // 4 x 6 inch label = 288 x 432 pt.
  const doc = new Document({
    settings: {
      pageSize: new PdfSize(288, 432, 'Shipping Label 4x6'),
      margin: 12,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8, color: BODY },
    },
    metadata: {
      title: 'Shipping Label 1Z999AA10123456784',
      author: 'Sample Logistics',
      subject: 'Carrier-style shipping label - accessible (PDF/UA) and archival (PDF/A-2a)',
    },
  });

  doc.add(new Heading('Shipping label', { fontSize: 11, margin: { bottom: 6 } }));

  // ── Carrier header + service class ──────────────────────────────────────────
  doc.add(band('SAMPLE LOGISTICS', 12, INK, '#ffffff'));
  const svcRow = new Grid({ columns: [1, 1], border: 0, cellPadding: 0 });
  svcRow.addRow(
    tb('EXPRESS - NEXT DAY', 10, '#ffffff', { bold: true }),
    tb('1.4 kg', 10, '#ffffff', { bold: true, align: 'right' })
  );
  doc.add(new Container({ backgroundColor: ColorPalette.slate[800], padding: [10, 4], child: svcRow }));

  doc.add(hrule(5, 4));

  // ── From / To addresses ─────────────────────────────────────────────────────
  doc.add(
    new Container({
      margin: { bottom: 4 },
      child: new VerticalStack({
        children: [
          tb('FROM', 7, MUTE, { bold: true, mb: 2 }),
          tb('Sample Supplies', 8, INK, { bold: true }),
          tb('4 Tenter Ground\nLondon E1 7NH, UK', 8, BODY),
        ],
      }),
    })
  );

  doc.add(
    new Container({
      border: { width: 1, color: INK },
      padding: [9, 6],
      child: new VerticalStack({
        children: [
          tb('SHIP TO', 8, MUTE, { bold: true, mb: 3 }),
          tb('Jordan Avery', 13, INK, { bold: true }),
          tb('Sample Customer Ltd\n19 Enfield Road\nLondon N1 5BA\nUnited Kingdom', 10, INK),
        ],
      }),
    })
  );

  // ── Routing band (postcode zone) ────────────────────────────────────────────
  doc.add(band('N1  -  ZONE 24  -  LON', 13, INK, '#ffffff', 'center'));

  doc.add(hrule(5, 4));

  // ── Tracking barcode (Code 128) ─────────────────────────────────────────────
  doc.add(tb('TRACKING NO.', 7, MUTE, { bold: true, mb: 2 }));
  doc.add(
    new Container({
      padding: { left: 4, top: 4, right: 4, bottom: 2 },
      child: new Barcode({
        value: '1Z999AA10123456784',
        symbology: BarcodeSymbology.Code128,
        height: 46,
        altText: 'Tracking barcode (Code 128): 1Z999AA10123456784',
      }),
    })
  );

  doc.add(hrule(5, 4));

  // ── Carton code (ITF-14) + QR parcel link, side by side ─────────────────────
  const cartonStack = new VerticalStack({
    children: [
      tb('CARTON (ITF-14)', 7, MUTE, { bold: true, mb: 2 }),
      new Barcode({
        value: '1540141253721', // 13 digits + auto check = ITF-14
        symbology: BarcodeSymbology.Itf14,
        height: 40,
        altText: 'Carton code (ITF-14): 1540141253721',
      }),
    ],
  });

  const qrStack = new VerticalStack({
    children: [
      tb('SCAN', 7, MUTE, { bold: true, mb: 2, align: 'right' }),
      new Container({
        horizontalAlignment: 'end',
        child: new QRCode({
          data: 'https://track.example.com/p/1Z999AA10123456784',
          size: 66,
          quietZone: 1,
          errorCorrection: 'quartile',
          altText: 'QR code linking to parcel tracking for 1Z999AA10123456784',
        }),
      }),
    ],
  });

  const bottom = new Grid({ columns: [2, 1], border: 0, cellPadding: 0 });
  bottom.addRow(cartonStack, qrStack);
  doc.add(bottom);

  return doc;
}
