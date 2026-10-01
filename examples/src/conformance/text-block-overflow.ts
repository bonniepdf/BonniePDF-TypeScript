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
  ColorPalette,
  Thickness,
  StandardFonts,
  Placeholders,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * Automatic pagination for long-form text in an accessible, archival document
 * (PDF/A-2a + PDF/UA-1). Three self-documenting sections describe what the
 * reader is seeing; the body is long enough to flow across several pages.
 * Headings and paragraphs keep their semantic roles as the text flows, and
 * the running "Page N of M" footer is marked as decorative.
 */
const SECTIONS: [title: string, intro: string][] = [
  [
    'Continuous Text Flow',
    'The paragraphs in this section are ordinary TextBlock elements added one after another. When a page runs out of vertical space, BonniePDF breaks to a new page and continues the flow automatically - you never position text or insert page breaks by hand.',
  ],
  [
    'Structure Survives the Page Break',
    'Automatic pagination does not flatten the document. Each section heading stays semantically structured, so a screen reader can navigate heading-to-heading even though the text spans several pages.',
  ],
  [
    'The Footer is Decorative',
    'The "Page N of M" line at the foot of every page comes from a footer template. It is marked as decorative, so assistive technology skips it; the total page count is resolved after layout, once the number of pages is known.',
  ],
];

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
    b.color = ColorPalette.slate[400];
    b.alignment = TextAlignment.Right;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'TextBlock Overflow Demo';
  metadata.author = 'BonniePDF';
  metadata.subject =
    'Demonstrates long-form text flowing across page boundaries in an accessible PDF/A-2a + PDF/UA-1 document.';
  metadata.keywords = 'pdf, accessibility, text, overflow, pagination, BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Long-Form Text & Automatic Pagination');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'This document shows how BonniePDF flows long-form text across page boundaries while keeping it fully tagged. The three sections below describe what to look for; the body text is intentionally long enough to span several pages.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  const source = Placeholders.withSeed(502);

  SECTIONS.forEach(([title, sectionIntro], index) => {
    const h2 = new Heading(title);
    h2.tocIdentifier = `section-${index + 1}`;
    h2.level = 2;
    h2.fontName = StandardFonts.HelveticaBold;
    h2.fontSize = 14;
    h2.color = ColorPalette.indigo[600];
    h2.margin = new Thickness(0, 16, 0, 6);
    doc.add(h2);

    const lead = new TextBlock(sectionIntro);
    lead.margin = new Thickness(0, 0, 0, 8);
    doc.add(lead);

    // Filler paragraphs to give the document enough length to paginate.
    for (let p = 0; p < 3; p++) {
      const para = new TextBlock(source.paragraph());
      para.margin = new Thickness(0, 0, 0, 8);
      doc.add(para);
    }
  });

  return doc;
}
