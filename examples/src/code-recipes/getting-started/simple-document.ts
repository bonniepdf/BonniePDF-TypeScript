/**
 * Simple Document.
 * A three-page tour of the core Document API: a title block, a feature panel, a QR code with alt text, a summary table and a custom square page. A good first example.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  TextBlock,
  UnorderedList,
  QRCode,
  Table,
  TableRow,
  PdfSize,
  StandardFonts,
  VerticalStack,
} from '@bonniepdf/core';

/**
 * The core Document API - three pages of text, structured spacing, and a custom
 * square page - authored as an accessible, archival PDF by default:
 * `conformance = 'pdf/a-2a'` + `accessibility = 'pdf/ua-1'`. Headings use the
 * semantic `Heading` element, so they nest correctly for a screen reader;
 * `TextBlock` copy is tagged as paragraphs without you asking; the feature
 * list is structured as a real list; and the QR code carries alt text.
 *
 * Everything is configured in one expression per object: settings and metadata
 * as nested literals on `Document`, elements via their options constructors,
 * colours as palette tokens (`'slate-600'`), and spacing as `{ bottom: 12 }`.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
      defaultZoom: 'fit-page',
      pageMode: 'use-none',
      displayDocTitle: true,
    },
    metadata: {
      title: 'Simple Document Example',
      author: 'BonniePDF',
      subject: 'Demonstrating the Document API',
      keywords: 'pdf, document, example, accessibility, BonniePDF',
    },
  });

  // ── Page 1: a title block with an accent rule, then the feature panel ──
  doc.add(
    new Container({
      border: { left: 4, color: 'indigo-500' },
      padding: { left: 16, top: 2, bottom: 2 },
      margin: { bottom: 24 },
      child: new VerticalStack({
        spacing: 6,
        children: [
          new TextBlock('GETTING STARTED', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 9,
            letterSpacing: 1.5,
            color: 'indigo-600',
          }),
          new Heading('Hello, Document API!', {
            tocIdentifier: 'intro',
            level: 1,
            fontName: StandardFonts.HelveticaBold,
            fontSize: 28,
            color: 'slate-900',
          }),
          new TextBlock(
            'Headings, text, a list, a table and a QR code across three pages, written with the high-level Document API.'
          ),
        ],
      }),
    })
  );

  doc.add(
    new Container({
      backgroundColor: 'indigo-50',
      cornerRadius: 8,
      padding: 16,
      margin: { bottom: 20 },
      child: new VerticalStack({
        spacing: 8,
        children: [
          new Heading('Key features', {
            tocIdentifier: 'features',
            level: 2,
            fontName: StandardFonts.HelveticaBold,
            fontSize: 14,
            color: 'indigo-900',
          }),
          new UnorderedList({
            fontSize: 11,
            itemSpacing: 3,
            bulletColor: 'indigo-500',
            items: [
              'Simple, intuitive API',
              'Built-in metadata support',
              'Configurable zoom levels',
              'Viewer preferences',
              'Automatic page management',
            ],
          }),
        ],
      }),
    })
  );

  doc.add(
    new TextBlock(
      'Existing elements (Heading, TextBlock, UnorderedList, Image, QRCode) tag themselves automatically - no semantic verbs required.',
      { margin: { bottom: 20 } }
    )
  );

  // ── The QR code beside its explanation: a weighted row, 1 part code to 4 parts text ──
  const scanRow = new HorizontalStack({ spacing: 18, widthDistribution: 'weighted' });
  scanRow.add(
    new QRCode({ data: 'https://bonniepdf.dev', size: 90, altText: 'QR code linking to https://bonniepdf.dev' }),
    1
  );
  scanRow.add(
    new VerticalStack({
      spacing: 6,
      children: [
        new Heading('Scan to verify', {
          tocIdentifier: 'verify',
          level: 2,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 14,
          color: 'slate-900',
        }),
        new TextBlock(
          'Point a phone camera at the code to open bonniepdf.dev. The code carries alt text, so a screen reader says where it leads.',
          { fontSize: 11 }
        ),
      ],
    }),
    4
  );
  doc.add(scanRow);

  // ── Page 2 ──
  doc.addPage();
  doc.add(
    new Heading('Page 2: Summary table', {
      tocIdentifier: 'page2',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      color: 'slate-900',
      margin: { bottom: 12 },
    })
  );
  doc.add(
    new TextBlock('This demonstrates multipage support with automatic page management.', {
      margin: { bottom: 16 },
    })
  );

  const table = new Table({
    columns: [160, 160, 175],
    headerBackgroundColor: 'indigo-700',
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    new TextBlock('Component', { fontName: StandardFonts.HelveticaBold, fontSize: 10 }),
    new TextBlock('Runtime', { fontName: StandardFonts.HelveticaBold, fontSize: 10 }),
    new TextBlock('Status', { fontName: StandardFonts.HelveticaBold, fontSize: 10 })
  );
  for (const [component, runtime] of [
    ['Core Engine', '.NET / TypeScript'],
    ['Typography Engine', 'Embedded Fonts'],
    ['Vector Graphics', 'SVG / QR / Barcode'],
    ['Charts', 'Bar / Line / Pie'],
    ['Compliance', 'PDF/A / PDF/UA'],
  ]) {
    table.addRow(
      TableRow.fromElements(
        new TextBlock(component, { fontSize: 10 }),
        new TextBlock(runtime, { fontSize: 10 }),
        new TextBlock('Available', { fontSize: 10, color: 'emerald-700' })
      )
    );
  }
  doc.add(table);

  doc.add(
    new Container({
      backgroundColor: 'slate-100',
      cornerRadius: 8,
      padding: 14,
      margin: { top: 20 },
      child: new TextBlock(
        'Content flows onto new pages by itself as the document grows. Start a page yourself only when you want a break on purpose, as before this page and before the square card that follows.',
        { fontSize: 11 }
      ),
    })
  );

  // ── Page 3 - custom square: a card that fills the page body ──
  const squareSize = new PdfSize(300, 300, 'Square Card');
  doc.addPage(squareSize);

  doc.add(
    new Container({
      fillHeight: true,
      backgroundColor: 'indigo-600',
      cornerRadius: 12,
      padding: 20,
      verticalAlignment: 'middle',
      child: new VerticalStack({
        spacing: 6,
        children: [
          new Heading(`Page 3: ${squareSize.name}`, {
            tocIdentifier: 'square',
            level: 1,
            fontName: StandardFonts.HelveticaBold,
            fontSize: 18,
            color: '#ffffff',
            alignment: 'center',
          }),
          new TextBlock(`${squareSize.width}pt × ${squareSize.height}pt`, { alignment: 'center', color: 'indigo-100' }),
        ],
      }),
    })
  );

  return doc;
}
