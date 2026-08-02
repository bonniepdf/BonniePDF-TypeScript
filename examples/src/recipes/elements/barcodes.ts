import {
  Document,
  TextBlock,
  VerticalStack,
  HorizontalStack,
  Container,
  Line,
  Barcode,
  BarcodeSymbology,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * Native, vector-based 1D barcodes - Code 128, EAN-13, UPC-A, ITF-14 - authored
 * through the options-object front door. Check digits and quiet zones are
 * computed automatically; the human-readable value is printed beneath each
 * symbol. PDF/A-2a + PDF/UA-1.
 *
 * `symbology` has no token form (it is a stable enum), so it stays
 * `BarcodeSymbology.*`; everything else on the `Barcode` and its wrapper is set
 * through the options object with colours as tokens/hex.
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
      title: 'Barcodes',
      author: 'BonniePDF',
    },
  });

  // ── Title ──
  doc.add(
    new TextBlock('1D Barcodes', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: 'slate-800',
      margin: { bottom: 16 },
    })
  );

  doc.add(
    new TextBlock(
      'BonniePDF renders 1D barcodes as native vector graphics - sharp at any zoom, tiny in the PDF, and ' +
        'with zero external dependencies. The four built-in symbologies cover retail and logistics across the ' +
        'UK, EU, and US. Check digits and quiet zones are computed automatically; the human-readable value is ' +
        'printed beneath each symbol.',
      { margin: { bottom: 20 } }
    )
  );

  const barcodeSections: [string, string, string, BarcodeSymbology, string, string[]][] = [
    [
      'Code 128',
      'Code 128 - the universal logistics barcode',
      '1Z9999W99999999999',
      BarcodeSymbology.Code128,
      'Encodes the full ASCII set (letters, digits, and symbols), so it carries alphanumeric references as ' +
        'well as numbers. It is the workhorse of shipping and courier labels - UPS, FedEx, and DHL tracking ' +
        'numbers, plus GS1-128 supply-chain labels - and of tickets, badges, and asset tags.',
      ['Symbology: Code 128 (ISO/IEC 15417)', 'Subsets A/B/C with automatic selection', 'Modulo-103 check character'],
    ],
    [
      'EAN-13',
      'EAN-13 - the EU / UK retail product barcode',
      '400638133393',
      BarcodeSymbology.Ean13,
      'The product barcode scanned at virtually every grocery and retail till outside North America. ' +
        'Twelve digits identify the product (a GS1 company prefix plus an item reference) and the ' +
        'thirteenth is a computed check digit. The leading digit is encoded implicitly through the bar ' +
        'parity of the left-hand half.',
      ['Symbology: EAN-13 (ISO/IEC 15420)', '12 digits in, check digit appended', 'GS1 General Specifications'],
    ],
    [
      'UPC-A',
      'UPC-A - the US / Canada retail product barcode',
      '03600029145',
      BarcodeSymbology.UpcA,
      'The retail product barcode of the United States and Canada. Eleven digits plus a check digit. ' +
        'Structurally it is an EAN-13 with an implicit leading zero, so European scanners read it natively ' +
        'and the two formats share an encoder.',
      ['Symbology: UPC-A (ISO/IEC 15420)', '11 digits in, check digit appended', 'Encoded as a leading-zero EAN-13'],
    ],
    [
      'ITF-14',
      'ITF-14 - the outer-case / shipping barcode',
      '1061414100041',
      BarcodeSymbology.Itf14,
      'Interleaved 2 of 5, fourteen digits. The GS1 standard for shipping cartons and outer cases (the box ' +
        'a retail unit ships in). It is printed directly on corrugated cardboard, so it is framed by heavy ' +
        '"bearer bars" that even out the print and stop a partial scan from being misread as a shorter code.',
      ['Symbology: ITF-14 (ISO/IEC 16390 + GS1)', '13 digits in, check digit appended', 'Bearer bars drawn by default'],
    ],
  ];

  for (let i = 0; i < barcodeSections.length; i++) {
    const [sectionTitle, cardTitle, value, symbology, description, specifics] = barcodeSections[i];

    doc.add(sectionHeader(sectionTitle));

    const row = new HorizontalStack({ spacing: 20, widthDistribution: 'weighted' });
    row.add(
      new Container({
        backgroundColor: '#ffffff',
        border: { width: 1, color: 'slate-200' },
        padding: 12,
        child: new Barcode({ value, symbology, height: 55, altText: `${cardTitle}: ${value}` }),
      }),
      1
    );
    row.add(
      new VerticalStack({
        children: [
          new TextBlock(cardTitle, {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 13,
            textColor: 'slate-800',
            margin: { bottom: 6 },
          }),
          new TextBlock(description, { fontSize: 10, textColor: 'slate-600', margin: { bottom: 6 } }),
          ...specifics.map(line => new TextBlock(line, { fontSize: 9, textColor: 'slate-500', margin: { bottom: 2 } })),
        ],
      }),
      1
    );
    doc.add(row);

    if (i < barcodeSections.length - 1) {
      doc.add(new Line({ color: 'slate-200', thickness: 1, margin: { top: 20, bottom: 20 } }));
    }
  }

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
