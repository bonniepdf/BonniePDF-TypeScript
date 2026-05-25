import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  ZoomLevel,
  TextBlock,
  TextStyle,
  TextAlignment,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

const sectionTexts: Record<number, string> = {
  1: 'This document demonstrates the header and footer template system in BonniePDF. Headers and footers are automatically rendered on each page after all content has been laid out.',
  2: 'The header template function receives the page number and returns an IElement that is rendered at the top of each page. This allows for dynamic content like section titles or logos.',
  3: 'Similarly, the footer template function creates elements for the bottom of each page. Common uses include page numbers, copyright notices, and document dates.',
  4: 'Templates can contain any valid IElement, including HorizontalStack for multi-column layouts, TextBlocks for simple text, or even Images for logos and branding.',
  5: 'The page number passed to templates is 1-based, making it easy to display "Page 1 of N" style pagination. The total page count is available after rendering completes.',
  6: 'Templates are rendered after all page content is finalized, ensuring accurate page counts and proper positioning regardless of how content flows across pages.',
  7: 'You can conditionally render headers or footers by returning null from the template function. For example, you might omit the header on the first page.',
  8: 'This flexible system supports professional document layouts while maintaining the simplicity that makes BonniePDF easy to use.',
};

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

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
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate600);

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

    const para = sectionTexts[section] ?? 'Additional content section.';
    for (let p = 0; p < 3; p++) {
      const b = new TextBlock(para + ' ' + para);
      b.margin = new Thickness(0, 0, 0, 12);
      doc.add(b);
    }
  }

  return doc;
}
