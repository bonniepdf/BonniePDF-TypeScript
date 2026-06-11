import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  HorizontalStack,
  Container,
  Line,
  Barcode,
  BarcodeSymbology,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
} from '@bonniepdf/core';

function sectionHeader(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 16;
  b.textColor = Color.indigo600;
  b.margin = new Thickness(0, 0, 0, 10);
  return b;
}

function divider(): Line {
  const l = new Line();
  l.color = Color.slate200;
  l.thickness = 1;
  l.margin = new Thickness(0, 20, 0, 20);
  return l;
}

/**
 * One row per symbology: the rendered barcode on the left, a title +
 * "what it's used for" description on the right.
 */
function barcodeCard(
  title: string,
  value: string,
  symbology: BarcodeSymbology,
  description: string,
  specifics: string[]
): HorizontalStack {
  const barcode = new Barcode();
  barcode.value = value;
  barcode.symbology = symbology;
  barcode.height = 55;
  barcode.altText = `${title}: ${value}`;

  const barcodeWrap = new Container();
  barcodeWrap.backgroundColor = Color.white;
  barcodeWrap.border = new Border(1);
  barcodeWrap.borderColors = new BorderColors(Color.slate200);
  barcodeWrap.padding = new Thickness(12);
  barcodeWrap.child = barcode;

  const row = new HorizontalStack();
  row.spacing = 20;
  row.widthDistribution = WidthDistribution.Weighted;
  row.addChild(barcodeWrap, 1);

  const details = new VerticalStack();

  const heading = new TextBlock(title);
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.textColor = Color.slate800;
  heading.margin = new Thickness(0, 0, 0, 6);
  details.addChild(heading);

  const desc = new TextBlock(description);
  desc.fontSize = 10;
  desc.textColor = Color.slate600;
  desc.margin = new Thickness(0, 0, 0, 6);
  details.addChild(desc);

  for (const line of specifics) {
    const s = new TextBlock(line);
    s.fontSize = 9;
    s.textColor = Color.slate500;
    s.margin = new Thickness(0, 0, 0, 2);
    details.addChild(s);
  }

  row.addChild(details, 1);
  return row;
}

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Barcodes';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // ── Title ──
  const title = new TextBlock('1D Barcodes');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 16);
  doc.add(title);

  const intro = new TextBlock(
    'BonniePDF renders 1D barcodes as native vector graphics - sharp at any zoom, tiny in the PDF, and ' +
      'with zero external dependencies. The four built-in symbologies cover retail and logistics across the ' +
      'UK, EU, and US. Check digits and quiet zones are computed automatically; the human-readable value is ' +
      'printed beneath each symbol.'
  );
  intro.margin = new Thickness(0, 0, 0, 20);
  doc.add(intro);

  // ── Code 128 ──
  doc.add(sectionHeader('Code 128'));
  doc.add(
    barcodeCard(
      'Code 128 - the universal logistics barcode',
      '1Z9999W99999999999',
      BarcodeSymbology.Code128,
      'Encodes the full ASCII set (letters, digits, and symbols), so it carries alphanumeric references as ' +
        'well as numbers. It is the workhorse of shipping and courier labels - UPS, FedEx, and DHL tracking ' +
        'numbers, plus GS1-128 supply-chain labels - and of tickets, badges, and asset tags.',
      ['Symbology: Code 128 (ISO/IEC 15417)', 'Subsets A/B/C with automatic selection', 'Modulo-103 check character']
    )
  );

  doc.add(divider());

  // ── EAN-13 ──
  doc.add(sectionHeader('EAN-13'));
  doc.add(
    barcodeCard(
      'EAN-13 - the EU / UK retail product barcode',
      '400638133393',
      BarcodeSymbology.Ean13,
      'The product barcode scanned at virtually every grocery and retail till outside North America. ' +
        'Twelve digits identify the product (a GS1 company prefix plus an item reference) and the ' +
        'thirteenth is a computed check digit. The leading digit is encoded implicitly through the bar ' +
        'parity of the left-hand half.',
      ['Symbology: EAN-13 (ISO/IEC 15420)', '12 digits in, check digit appended', 'GS1 General Specifications']
    )
  );

  doc.add(divider());

  // ── UPC-A ──
  doc.add(sectionHeader('UPC-A'));
  doc.add(
    barcodeCard(
      'UPC-A - the US / Canada retail product barcode',
      '03600029145',
      BarcodeSymbology.UpcA,
      'The retail product barcode of the United States and Canada. Eleven digits plus a check digit. ' +
        'Structurally it is an EAN-13 with an implicit leading zero, so European scanners read it natively ' +
        'and the two formats share an encoder.',
      ['Symbology: UPC-A (ISO/IEC 15420)', '11 digits in, check digit appended', 'Encoded as a leading-zero EAN-13']
    )
  );

  doc.add(divider());

  // ── ITF-14 ──
  doc.add(sectionHeader('ITF-14'));
  doc.add(
    barcodeCard(
      'ITF-14 - the outer-case / shipping barcode',
      '1061414100041',
      BarcodeSymbology.Itf14,
      'Interleaved 2 of 5, fourteen digits. The GS1 standard for shipping cartons and outer cases (the box ' +
        'a retail unit ships in). It is printed directly on corrugated cardboard, so it is framed by heavy ' +
        '"bearer bars" that even out the print and stop a partial scan from being misread as a shorter code.',
      ['Symbology: ITF-14 (ISO/IEC 16390 + GS1)', '13 digits in, check digit appended', 'Bearer bars drawn by default']
    )
  );

  return doc;
}
