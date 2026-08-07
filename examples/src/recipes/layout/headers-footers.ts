import { Document, Heading, TextBlock, TextElementBase, StandardFonts } from '@bonniepdf/core';

/**
 * Page header/footer templates in an accessible, archival document
 * (PDF/A-2a + PDF/UA-1), authored through the options-object front door.
 *
 * Header and footer content is marked decorative - visible on every page, but
 * skipped by screen readers - while the numbered body sections use semantic
 * `Heading` and `TextBlock` elements. The
 * running header/footer are `headerTemplate` / `footerTemplate` functions on
 * `settings` (`pageNumber => element`), given inline; `TotalPagesToken` resolves
 * to the final page count after layout.
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

export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
      headerTemplate: (pageNumber: number) =>
        new TextBlock(`BonniePDF - Headers & Footers - Page ${pageNumber}`, {
          fontName: StandardFonts.Helvetica,
          fontSize: 9,
          textColor: 'slate-500',
          alignment: 'center',
        }),
      footerTemplate: (pageNumber: number) =>
        new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`, {
          fontName: StandardFonts.Helvetica,
          fontSize: 9,
          textColor: 'slate-400',
          alignment: 'center',
        }),
    },
    metadata: {
      title: 'Headers and Footers Demo',
      author: 'BonniePDF',
      subject: 'Demonstrates page headers and footers in an accessible PDF/A-2a + PDF/UA-1 document.',
      keywords: 'pdf, accessibility, headers, footers, page numbers, BonniePDF',
    },
  });

  doc.add(
    new Heading('Chapter 1: Headers & Footers', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      textColor: 'slate-800',
      margin: { bottom: 14 },
    })
  );

  doc.add(
    new TextBlock(
      'Headers and footers are rendered as decorative elements - they are visible on every page but are skipped by screen readers. The numbered sections below describe how the template system works.',
      { margin: { bottom: 12 } }
    )
  );

  SECTIONS.forEach(([title, body], index) => {
    const number = `1.${index + 1}`;
    doc.add(
      new Heading(`${number} ${title}`, {
        tocIdentifier: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 14,
        textColor: 'indigo-600',
        margin: { top: 14, bottom: 6 },
      })
    );

    doc.add(new TextBlock(body, { margin: { bottom: 8 } }));

    // Second paragraph to push content onto additional pages
    doc.add(
      new TextBlock(
        `This section is part of the Headers & Footers demonstration. Each page carries the same ` +
          `running header and footer so you can observe them across multiple pages. The content here ` +
          `intentionally repeats to ensure the document spans several pages.`,
        { margin: { bottom: 8 } }
      )
    );
  });

  return doc;
}
