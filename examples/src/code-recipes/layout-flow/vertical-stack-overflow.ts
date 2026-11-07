/**
 * VerticalStack Overflow.
 * A three-across sheet of Code 128 asset labels, one row per VerticalStack child. Barcodes do not split across pages, so the stack moves a row that would fall off the page onto the next one.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  Heading,
  TextBlock,
  TextElementBase,
  VerticalStack,
  HorizontalStack,
  Container,
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
  'WH3-C01-R01-B01',
  'WH3-C01-R01-B02',
  'WH3-C01-R02-B01',
  'WH3-C02-R01-B03',
  'WH3-C02-R03-B02',
  'WH3-C03-R01-B01',
  'WH3-C03-R02-B04',
  'WH3-C04-R01-B02',
  'WH3-C04-R04-B01',
  'WH3-C05-R02-B03',
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
      'One Code 128 label per storage location, three across. Barcodes have no pagination of their own, so a VerticalStack lays the rows out and carries each row that would fall off the page onto the next one - nothing is lost off the bottom edge.',
      { margin: { bottom: 16 } }
    )
  );

  // Three labels per row: each row is one child of the VerticalStack, so a row moves to the next page whole.
  const rows: HorizontalStack[] = [];
  for (let i = 0; i < LOCATIONS.length; i += 3)
    rows.push(
      new HorizontalStack({ spacing: 10, widthDistribution: 'equal', children: LOCATIONS.slice(i, i + 3).map(label) })
    );
  doc.add(new VerticalStack({ spacing: 10, children: rows }));

  return doc;
}

// Local helpers used by this document.

/** One cut-out label: the warehouse and aisle above the location's barcode, inside a thin cut line. */
function label(location: string): Container {
  const [warehouse, aisle] = location.split('-');
  return new Container({
    border: { width: 0.5, color: 'slate-300' },
    cornerRadius: 4,
    padding: [10, 8],
    child: new VerticalStack({
      spacing: 6,
      children: [
        new TextBlock(`WAREHOUSE ${warehouse.slice(2)}  ·  AISLE ${aisle}`, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 7,
          letterSpacing: 0.8,
          color: 'slate-600',
        }),
        new Barcode({
          value: location,
          symbology: BarcodeSymbology.Code128,
          moduleWidth: 0.75,
          height: 40,
          textLabelFontSize: 8,
          altText: `Warehouse location barcode ${location}`,
        }),
      ],
    }),
  });
}
