import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextElementBase,
  VerticalStack,
  Barcode,
  BarcodeSymbology,
  Heading,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

/**
 * VerticalStack is the primitive that lays a column of elements down the page
 * AND paginates it. That second job matters for elements that have no
 * pagination of their own: a Barcode (like an Image, QRCode, or Line) renders
 * wherever the cursor happens to be, with no awareness of the page edge. Drop
 * a long list of bare barcodes straight onto the document and the ones past the
 * first page's bottom margin are simply drawn off the paper and lost. Put the
 * same list inside a VerticalStack and each barcode that would fall off the
 * page is carried to the next one instead.
 *
 * The example is a warehouse asset-label sheet - one scannable Code 128 label
 * per storage location. Every label is a Figure with alt-text; the running
 * footer is marked as decorative.
 */
const LOCATIONS: string[] = [
  'WH1-A01-R02-B03',
  'WH1-A01-R02-B04',
  'WH1-A01-R03-B01',
  'WH1-A02-R01-B02',
  'WH1-A02-R04-B05',
  'WH1-A03-R02-B01',
  'WH1-A03-R02-B06',
  'WH1-A04-R01-B03',
  'WH1-A04-R03-B04',
  'WH2-B01-R01-B01',
  'WH2-B01-R02-B02',
  'WH2-B02-R03-B03',
  'WH2-B02-R03-B07',
  'WH2-B03-R01-B04',
  'WH2-B03-R04-B05',
  'WH2-B04-R02-B01',
  'WH2-B04-R02-B08',
  'WH2-B05-R01-B02',
  'WH2-B05-R03-B06',
  'WH2-B06-R04-B03',
];

/**
 * The **class / construct-then-mutate** companion to `vertical-stack-overflow.ts`.
 *
 * Same warehouse asset-label sheet - a VerticalStack paginating a column of
 * Code 128 barcodes - authored the long way: `new` each element and assign
 * properties, using `TextStyle`, `Thickness`, `ColorPalette` and the
 * `TextAlignment` enum directly. This is the escape hatch the options-object
 * front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `vertical-stack-overflow.ts` (an equivalence test binds the two). Reach for
 * the options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  function pageFooter(): TextBlock {
    const b = new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.color = ColorPalette.slate[400];
    b.alignment = TextAlignment.Right;
    return b;
  }

  settings.footerTemplate = pageTemplate({ default: pageFooter() });

  const metadata = new DocumentMetadata();
  metadata.title = 'Warehouse Asset-Label Sheet';
  metadata.author = 'BonniePDF';
  metadata.subject =
    'Demonstrates VerticalStack paginating a column of barcodes in an accessible PDF/A-2a + PDF/UA-1 document.';
  metadata.keywords = 'pdf, accessibility, layout, vertical stack, barcode, logistics, warehouse, BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Warehouse Asset-Label Sheet');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const intro = new TextBlock(
    'One Code 128 label per storage location. Barcodes have no pagination of their own, so a VerticalStack lays the column out and carries each label that would fall off the page onto the next one - nothing is lost off the bottom edge.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  const sheet = new VerticalStack();
  sheet.spacing = 18;
  for (const location of LOCATIONS) {
    const label = new Barcode();
    label.value = location;
    label.symbology = BarcodeSymbology.Code128;
    label.height = 46;
    label.textLabelFontSize = 10;
    label.altText = `Warehouse location barcode ${location}`;
    sheet.add(label);
  }
  doc.add(sheet);

  return doc;
}
