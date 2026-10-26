/** Declarative first-page, odd/even headers and automatic page numbers. */
import { Document, Heading, TextBlock, PageBreak, pageTemplate } from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document({
    metadata: { title: 'Headers and footers' },
    settings: {
      language: 'en-GB',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      margin: 50,
      headerTemplate: pageTemplate({
        firstPage: label('NORTHFIELD · FIRST PAGE'),
        odd: label('NORTHFIELD · ODD PAGE'),
        even: label('NORTHFIELD · EVEN PAGE'),
      }),
      footerTemplate: pageTemplate({ default: label('Page {{CurrentPage}} of {{TotalPages}}') }),
    },
  });
  const sections = [
    [
      'First-page branding',
      'The firstPage element overrides the odd-page header on page one. Use it for a cover-specific brand or document title.',
    ],
    [
      'Even-page header',
      'The even element applies to page two. The footer uses the current-page and total-pages tokens, resolved after layout.',
    ],
    [
      'Odd-page header',
      'The odd element applies to page three. With no matching firstPage or parity element, default is used; without a default, the slot is empty.',
    ],
  ];
  sections.forEach(([title, body], i) => {
    if (i) doc.add(new PageBreak());
    doc.add(new Heading(title, { level: i ? 2 : 1, fontSize: 24, margin: { bottom: 16 } }));
    doc.add(new TextBlock(body, { fontSize: 12 }));
  });
  return doc;
}

function label(text: string): TextBlock {
  return new TextBlock(text, { fontSize: 9, alignment: 'center' });
}
