/** Keep headings and signature blocks together without losing oversized content. */
import {
  Document,
  Heading,
  TextBlock,
  Spacer,
  VerticalStack,
  PageBreak,
  EnsureSpace,
  PreventPageBreak,
  ShowEntire,
  pageTemplate,
} from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document({
    metadata: { title: 'Control page breaks' },
    settings: {
      pageSize: 'a5',
      margin: 36,
      language: 'en-GB',
      footerTemplate: pageTemplate({
        default: new TextBlock('Page {{CurrentPage}} of {{TotalPages}}', { fontSize: 9 }),
      }),
    },
  });
  doc.add(new Heading('Control page breaks', { level: 1, fontSize: 23 }));
  doc.add(
    new TextBlock('Keep a heading with its first paragraph, and move a signature block onto the next page as a unit.')
  );
  doc.add(new Spacer(340));
  doc.add(new EnsureSpace({ minHeight: 140, child: new Heading('Approval', { level: 2, fontSize: 16 }) }));
  doc.add(
    new TextBlock(
      'EnsureSpace reserves enough room to start this section. It does not keep the whole section together.'
    )
  );
  doc.add(new PreventPageBreak({ child: signature('PreventPageBreak keeps this block together.') }));
  doc.add(new PageBreak());
  doc.add(new Heading('An indivisible panel', { level: 2, fontSize: 16 }));
  doc.add(new ShowEntire({ child: signature('ShowEntire never splits its child.') }));
  doc.add(
    new TextBlock(
      'Use ShowEntire only for bounded content: a child taller than a page is cut off. PreventPageBreak lets oversized content continue across pages.'
    )
  );
  doc.add(
    new PreventPageBreak({
      child: new VerticalStack({
        children: Array.from(
          { length: 28 },
          (_, i) =>
            new TextBlock(`Checklist ${i + 1}: retain this line even when the group exceeds a page.`, {
              margin: { bottom: 8 },
            })
        ),
      }),
    })
  );
  return doc;
}

function signature(label: string): VerticalStack {
  return new VerticalStack({
    spacing: 10,
    margin: { top: 12, bottom: 12 },
    children: [
      new TextBlock(label),
      new TextBlock('Approved by: ____________________'),
      new TextBlock('Date: ____________________'),
    ],
  });
}
