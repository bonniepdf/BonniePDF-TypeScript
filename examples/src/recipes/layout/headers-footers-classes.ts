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
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * Page header/footer templates in an accessible, archival document
 * (PDF/A-2a + PDF/UA-1). Header and footer content is marked decorative -
 * visible on every page, but skipped by screen readers - while the numbered
 * body sections use semantic `Heading` and `TextBlock` elements.
 */
const SECTIONS: [string, string][] = [
  [
    'Introduction',
    'This document demonstrates the header and footer template system in BonniePDF. Headers and footers are automatically rendered on each page after all content has been laid out. They are marked as decorative elements and are skipped by screen readers.',
  ],
  [
    'Header Templates',
    'The header template function receives the page number and returns an IElement that is rendered at the top of each page. This allows for dynamic content such as section titles, document names, or logos. The element is positioned in the header region defined by the document margin.',
  ],
  [
    'Footer Templates',
    'Similarly, the footer template function creates elements for the bottom of each page. Common uses include page numbers, copyright notices, and document revision dates. You may return null to suppress the footer on a specific page.',
  ],
  [
    'Dynamic Content',
    'Templates can contain any valid IElement, including HorizontalStack for multi-column layouts, TextBlocks for simple text, or even Images for logos and branding. The total page count is available through the TotalPagesToken sentinel.',
  ],
  [
    'Page Numbering',
    'The page number passed to templates is 1-based, making it easy to display "Page 1 of N" style pagination. The total page count is resolved after layout completes, ensuring accuracy even when content reflows during finalisation.',
  ],
  [
    'Rendering Order',
    'Templates are rendered after all page content is finalised, ensuring accurate page counts and proper positioning regardless of how content flows across pages. This means you can safely reference the total page count in both header and footer templates.',
  ],
  [
    'Conditional Templates',
    'You can conditionally render headers or footers by returning null from the template function. For example, you might omit the header on the first page to give more room for a title section, or hide the footer on a table of contents page.',
  ],
  [
    'Accessibility',
    'Header and footer templates are automatically marked as decorative elements. This means assistive technologies skip over them when reading the document, preventing repeated announcement of decorative running headers on every page turn.',
  ],
];

/**
 * The **class / construct-then-mutate** companion to `headers-footers.ts`.
 *
 * Same running-header/footer document, authored the long way: `new` each
 * element and assign properties, using `TextStyle`, `Thickness`, `ColorPalette`
 * and the `TextAlignment` enum directly. This is the escape hatch the
 * options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `headers-footers.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  settings.headerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`BonniePDF - Headers & Footers - Page ${pageNumber}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.color = ColorPalette.slate[500];
    b.alignment = TextAlignment.Center;
    return b;
  };

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.color = ColorPalette.slate[400];
    b.alignment = TextAlignment.Center;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Headers and Footers Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates page headers and footers in an accessible PDF/A-2a + PDF/UA-1 document.';
  metadata.keywords = 'pdf, accessibility, headers, footers, page numbers, BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Chapter 1: Headers & Footers');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 14);
  doc.add(h1);

  const intro = new TextBlock(
    'Headers and footers are rendered as decorative elements - they are visible on every page but are skipped by screen readers. The numbered sections below describe how the template system works.'
  );
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  SECTIONS.forEach(([title, body], index) => {
    const number = `1.${index + 1}`;
    const h2 = new Heading(`${number} ${title}`);
    h2.tocIdentifier = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    h2.level = 2;
    h2.fontName = StandardFonts.HelveticaBold;
    h2.fontSize = 14;
    h2.color = ColorPalette.indigo[600];
    h2.margin = new Thickness(0, 14, 0, 6);
    doc.add(h2);

    const p = new TextBlock(body);
    p.margin = new Thickness(0, 0, 0, 8);
    doc.add(p);

    // Second paragraph to push content onto additional pages
    const p2 = new TextBlock(
      `This section is part of the Headers & Footers demonstration. Each page carries the same ` +
        `running header and footer so you can observe them across multiple pages. The content here ` +
        `intentionally repeats to ensure the document spans several pages.`
    );
    p2.margin = new Thickness(0, 0, 0, 8);
    doc.add(p2);
  });

  return doc;
}
