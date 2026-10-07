/**
 * VerticalStack Overflow.
 * A sheet of Code 128 asset labels in a VerticalStack. Barcodes do not split across pages, so the stack moves labels that would fall off the page onto the next one.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  Heading,
  TextBlock,
  TextElementBase,
  VerticalStack,
  Barcode,
  BarcodeSymbology,
  StandardFonts,
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
 * per storage location - authored through the options-object front door. Every
 * label is a Figure with alt-text; the running footer is marked as decorative.
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

export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
      footerTemplate: pageTemplate({
        default: new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`, {
          fontName: StandardFonts.Helvetica,
          fontSize: 9,
          color: 'slate-400',
          alignment: 'right',
        }),
      }),
    },
    metadata: {
      title: 'Warehouse Asset-Label Sheet',
      author: 'BonniePDF',
      subject:
        'Demonstrates VerticalStack paginating a column of barcodes in an accessible PDF/A-2a + PDF/UA-1 document.',
      keywords: 'pdf, accessibility, layout, vertical stack, barcode, logistics, warehouse, BonniePDF',
    },
  });

  doc.add(
    new Heading('Warehouse Asset-Label Sheet', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: 'slate-800',
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'One Code 128 label per storage location. Barcodes have no pagination of their own, so a VerticalStack lays the column out and carries each label that would fall off the page onto the next one - nothing is lost off the bottom edge.',
      { margin: { bottom: 16 } }
    )
  );

  doc.add(
    new VerticalStack({
      spacing: 18,
      children: LOCATIONS.map(
        location =>
          new Barcode({
            value: location,
            symbology: BarcodeSymbology.Code128,
            height: 46,
            textLabelFontSize: 10,
            altText: `Warehouse location barcode ${location}`,
          })
      ),
    })
  );

  return doc;
}
