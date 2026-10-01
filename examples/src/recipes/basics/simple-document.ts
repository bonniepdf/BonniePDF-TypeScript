import { Document, Heading, TextBlock, UnorderedList, QRCode, Line, PdfSize, StandardFonts } from '@bonniepdf/core';

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
      subject: 'Demonstrating the Document API - TypeScript / Browser',
      keywords: 'pdf, document, example, accessibility, BonniePDF',
    },
  });

  // ── Page 1 ──
  doc.add(
    new Heading('Hello, Document API!', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 12 },
    })
  );

  doc.add(
    new TextBlock('This PDF was generated entirely in the browser using @bonniepdf/core.', {
      margin: { bottom: 16 },
    })
  );

  doc.add(
    new Heading('Key Features', {
      tocIdentifier: 'features',
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 14,
      color: 'slate-700',
      margin: { bottom: 6 },
    })
  );

  doc.add(
    new UnorderedList({
      fontSize: 11,
      itemSpacing: 6,
      items: [
        'Simple, intuitive API',
        'Built-in metadata support',
        'Configurable zoom levels',
        'Viewer preferences',
        'Automatic page management',
      ],
    })
  );

  // ── Divider, then the accessibility note ──
  doc.add(new Line({ thickness: 1, color: 'slate-300', margin: { top: 16, bottom: 16 } }));

  doc.add(
    new TextBlock(
      'Existing elements (Heading, TextBlock, UnorderedList, Image, QRCode) tag themselves automatically - no semantic verbs required.',
      { margin: { bottom: 16 } }
    )
  );

  doc.add(
    new Heading('Scan to verify', {
      tocIdentifier: 'verify',
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 14,
      color: 'slate-700',
      margin: { bottom: 6 },
    })
  );

  doc.add(
    new QRCode({ data: 'https://bonniepdf.dev', size: 100, altText: 'QR code linking to https://bonniepdf.dev' })
  );

  // ── Page 2 ──
  doc.addPage();
  doc.add(
    new Heading('Page 2', {
      tocIdentifier: 'page2',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      color: 'slate-800',
      margin: { bottom: 12 },
    })
  );
  doc.add(new TextBlock('This demonstrates multipage support with automatic page management.'));

  // ── Page 3 - custom square ──
  const squareSize = new PdfSize(300, 300, 'Square Card');
  doc.addPage(squareSize);

  doc.add(
    new Heading(`Page 3: ${squareSize.name}`, {
      tocIdentifier: 'square',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 16,
      color: 'slate-800',
      alignment: 'center',
      margin: { top: 50 },
    })
  );

  doc.add(new TextBlock(`${squareSize.width}pt × ${squareSize.height}pt`, { alignment: 'center' }));

  return doc;
}
