import {
  Document,
  TextBlock,
  HorizontalStack,
  VerticalStack,
  Container,
  Line,
  QRCode,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * Native, vector-based QR codes (ISO/IEC 18004) - a basic code, the four
 * error-correction levels, and custom foreground/background colours - authored
 * through the options-object front door.
 *
 * Each `QRCode` is configured in one expression: `data`, `size`, `quietZone`,
 * `errorCorrection` as a token (`'low' | 'medium' | 'quartile' | 'high'`), and
 * `foregroundColor`/`backgroundColor` as palette tokens.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 50,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
    },
    metadata: {
      title: 'QR Codes',
      author: 'BonniePDF',
    },
  });

  // ── Title ──
  doc.add(
    new TextBlock('QR Code Generator', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: 'slate-800',
      margin: { bottom: 20 },
    })
  );

  doc.add(
    new TextBlock(
      'BonniePDF provides a native, high-performance, vector-based QR Code element that implements ' +
        'a full ISO/IEC 18004 compliant encoder. Because it produces vector shapes rather than bitmaps, ' +
        'the generated codes are razor-sharp at any zoom level and keep the PDF file size extremely small.',
      { margin: { bottom: 20 } }
    )
  );

  // ── Section 1: Basic QR Code ──
  doc.add(sectionHeader('Basic QR Code'));

  const basicRow = new HorizontalStack({ spacing: 20, widthDistribution: 'weighted' });
  basicRow.addChild(
    new Container({
      padding: 10,
      child: new QRCode({
        data: 'https://bonniepdf.com',
        size: 130,
        quietZone: 2,
        altText: 'QR code linking to bonniepdf.com',
      }),
    }),
    1
  );
  basicRow.addChild(
    new VerticalStack({
      children: (
        [
          ['A simple QR Code', true, 8],
          ['Size: 130pt', false, 4],
          ['Quiet Zone: 2 modules', false, 4],
          ['Error Correction: Medium (default)', false, 4],
          ['Data: https://bonniepdf.com', false, 0],
        ] as [string, boolean, number][]
      ).map(
        ([text, bold, mb]) =>
          new TextBlock(text, {
            fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
            margin: mb ? { bottom: mb } : undefined,
          })
      ),
    }),
    2
  );
  doc.add(basicRow);

  doc.add(divider());

  // ── Section 2: Error correction levels ──
  doc.add(sectionHeader('Error Correction Levels'));

  doc.add(
    new TextBlock(
      'Higher error correction levels provide more redundancy at the cost of denser modules and ' +
        'reduced data capacity. They are useful if the code might be damaged or if you intend to overlay a logo.',
      { margin: { bottom: 15 } }
    )
  );

  const urlData = 'https://github.com/bonniepdf';
  doc.add(
    new HorizontalStack({
      spacing: 15,
      widthDistribution: 'equal',
      children: (
        [
          ['low', 'Low', '~7% restoration'],
          ['medium', 'Medium', '~15% restoration'],
          ['quartile', 'Quartile', '~25% restoration'],
          ['high', 'High', '~30% restoration'],
        ] as const
      ).map(
        ([ecc, eccLabel, eccDetail]) =>
          new VerticalStack({
            children: [
              new Container({
                backgroundColor: 'slate-50',
                border: { width: 1, color: 'slate-200' },
                padding: 10,
                child: new QRCode({
                  data: urlData,
                  size: 100,
                  errorCorrection: ecc,
                  quietZone: 1,
                  altText: `QR code linking to github.com/bonniepdf ( error correction)`,
                }),
              }),
              new TextBlock(eccLabel, {
                fontName: StandardFonts.HelveticaBold,
                alignment: 'center',
                margin: { top: 8 },
              }),
              new TextBlock(eccDetail, { fontSize: 9, textColor: 'slate-500', alignment: 'center' }),
              new TextBlock(urlData, { fontSize: 8, textColor: 'slate-400', alignment: 'center', margin: { top: 4 } }),
            ],
          })
      ),
    })
  );

  doc.add(divider());

  // ── Section 3: Colors & backgrounds ──
  doc.add(sectionHeader('Colors & Backgrounds'));

  doc.add(
    new HorizontalStack({
      spacing: 20,
      widthDistribution: 'equal',
      children: [
        colorColumn(
          'Custom Foreground',
          new Container({
            border: { width: 1, color: 'blue-200' },
            padding: 10,
            child: new QRCode({
              data: 'tel:+1234567890',
              size: 120,
              foregroundColor: 'blue-700',
              quietZone: 2,
              altText: 'QR code that dials the phone number +1 234 567 890',
            }),
          }),
          'tel:+1234567890'
        ),
        colorColumn(
          'Custom Background',
          new Container({
            border: { width: 1, color: 'rose-200' },
            padding: 10,
            child: new QRCode({
              data: 'mailto:hello@example.com',
              size: 120,
              foregroundColor: 'rose-900',
              backgroundColor: 'rose-50',
              quietZone: 2,
              altText: 'QR code that composes an email to hello@example.com',
            }),
          }),
          'mailto:hello@example.com'
        ),
        colorColumn(
          'Transparent Background',
          new Container({
            backgroundColor: 'amber-100',
            border: { width: 1, color: 'amber-300' },
            padding: 10,
            child: new QRCode({
              data: 'WIFI:S:MyNetwork;T:WPA;P:password;;',
              size: 120,
              foregroundColor: 'amber-900',
              drawBackground: false,
              quietZone: 2,
              altText: 'QR code to join the MyNetwork Wi-Fi network',
            }),
          }),
          'WIFI:S:MyNetwork;...'
        ),
      ],
    })
  );

  return doc;
}

/** A bold indigo section header (a styled TextBlock, matching the original). */
function sectionHeader(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 16,
    textColor: 'indigo-600',
    margin: { bottom: 10 },
  });
}

/** A full-width hairline divider with 20pt vertical breathing room. */
function divider(): Line {
  return new Line({ color: 'slate-200', thickness: 1, margin: { top: 20, bottom: 20 } });
}

/** A titled QR column: bold caption, the (already-wrapped) code, then a small data label. */
function colorColumn(title: string, wrap: Container, labelText: string): VerticalStack {
  return new VerticalStack({
    children: [
      new TextBlock(title, { fontName: StandardFonts.HelveticaBold, margin: { bottom: 8 } }),
      wrap,
      new TextBlock(labelText, { fontSize: 9, textColor: 'slate-500', alignment: 'center', margin: { top: 8 } }),
    ],
  });
}
