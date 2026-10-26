/** Class API companion: the same conditional headers and page numbering. */
import { Document, Heading, TextBlock, PageBreak, pageTemplate } from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document();
  doc.metadata.title = 'Headers and footers';
  doc.settings.language = 'en-GB';
  doc.settings.conformance = 'pdf/a-2a';
  doc.settings.accessibility = 'pdf/ua-1';
  doc.settings.margin = 50;
  doc.settings.headerTemplate = pageTemplate({
    firstPage: label('NORTHFIELD · FIRST PAGE'),
    odd: label('NORTHFIELD · ODD PAGE'),
    even: label('NORTHFIELD · EVEN PAGE'),
  });
  doc.settings.footerTemplate = pageTemplate({ default: label('Page {{CurrentPage}} of {{TotalPages}}') });
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
    const heading = new Heading(title);
    heading.level = i ? 2 : 1;
    heading.fontSize = 24;
    heading.margin = { bottom: 16 };
    doc.add(heading);
    const text = new TextBlock(body);
    text.fontSize = 12;
    doc.add(text);
  });
  return doc;
}

function label(text: string): TextBlock {
  const block = new TextBlock(text);
  block.fontSize = 9;
  block.alignment = 'center';
  return block;
}
