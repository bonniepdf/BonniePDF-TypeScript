import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextElementBase,
  Heading,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  Placeholders,
  PdfAConformance,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.textColor = ColorPalette.slate[400];
    b.alignment = TextAlignment.Right;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'TextBlock Overflow - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates text flowing across page boundaries in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, text, overflow, pagination';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Long Text Document - PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'This document demonstrates automatic pagination for long text content. Twenty sections of body text flow naturally across multiple pages; a page-number footer appears on every page as an Artifact.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  const source = Placeholders.withSeed(501);
  for (let i = 1; i <= 20; i++) {
    const h2 = new Heading(`Section ${i}`);
    h2.tocIdentifier = `section-${i}`;
    h2.level = 2;
    h2.fontName = StandardFonts.HelveticaBold;
    h2.fontSize = 13;
    h2.textColor = ColorPalette.indigo[600];
    h2.margin = new Thickness(0, 14, 0, 6);
    doc.add(h2);

    const p1 = new TextBlock(source.paragraph());
    p1.margin = new Thickness(0, 0, 0, 8);
    doc.add(p1);

    const p2 = new TextBlock(source.paragraph());
    p2.margin = new Thickness(0, 0, 0, 8);
    doc.add(p2);
  }

  return doc;
}
