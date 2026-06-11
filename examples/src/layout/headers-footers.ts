import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  ZoomLevel,
  TextBlock,
  TextStyle,
  TextAlignment,
  Color,
  Thickness,
  StandardFonts,
  Placeholders,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

const source = Placeholders.withSeed(200);

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate600);
  settings.defaultZoom = ZoomLevel.FitPage;

  settings.headerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`BonniePDF Documentation - Page ${pageNumber}`);
    b.fontName = StandardFonts.HelveticaBold;
    b.fontSize = 10;
    b.textColor = Color.slate600;
    b.alignment = TextAlignment.Center;
    return b;
  };

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} - Confidential`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 10;
    b.textColor = Color.slate500;
    b.alignment = TextAlignment.Center;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Headers and Footers Demo';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // Chapter heading
  const heading = new TextBlock('Chapter 1: Introduction');
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 20;
  heading.textColor = Color.slate800;
  heading.margin = new Thickness(0, 0, 0, 15);
  doc.add(heading);

  // 8 sections, each with 3 repeated paragraphs
  for (let section = 1; section <= 8; section++) {
    const secTitle = new TextBlock(`1.${section} Section Title`);
    secTitle.fontName = StandardFonts.HelveticaBold;
    secTitle.fontSize = 14;
    secTitle.textColor = Color.slate700;
    secTitle.margin = new Thickness(0, 15, 0, 10);
    doc.add(secTitle);

    for (let p = 0; p < 3; p++) {
      const b = new TextBlock(source.paragraph());
      b.margin = new Thickness(0, 0, 0, 12);
      doc.add(b);
    }
  }

  return doc;
}
