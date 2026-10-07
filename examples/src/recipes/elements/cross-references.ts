/**
 * Cross-References.
 * Section anchors, SectionLink internal jumps, and PageNumberOf “see page N” references, all resolved automatically by two-pass layout.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  Heading,
  TextBlock,
  Section,
  SectionLink,
  PageNumberOf,
  HorizontalStack,
  PageBreak,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * Cross-references: `Section` (named anchors), `SectionLink` (clickable
 * internal jumps), and `PageNumberOf` ("see page 42") - authored through the
 * options-object front door. The contents block sits on page 1, ahead of the
 * chapters it points at, so every reference is resolved by the two-pass layout
 * before the page is drawn.
 *
 * The reference elements keep their target positional (`new SectionLink(text,
 * id, { … })`, `new PageNumberOf(id, { … })`); styling goes in the options.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-700' },
      displayDocTitle: true,
    },
    metadata: {
      title: 'Cross-Reference Field Guide',
      author: 'BonniePDF',
      subject: 'Section anchors, internal links, and page references',
    },
  });

  const chapters: [id: string, title: string, body: string][] = [
    [
      'ch-anchors',
      'Anchors',
      'A Section marks an invisible, zero-height position in the flow. Point links and page references at it by id.',
    ],
    [
      'ch-links',
      'Internal links',
      'A SectionLink resolves its target page after layout and emits a clickable GoTo annotation - no manual page numbers.',
    ],
    [
      'ch-pagerefs',
      'Page references',
      'A PageNumberOf prints the page a named anchor landed on, so "see page 4" stays correct as content reflows.',
    ],
  ];

  // Anchor for the "back to contents" references further down.
  doc.add(new Section('contents'));

  doc.add(
    new Heading('Cross-Reference Field Guide', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 12 },
    })
  );

  doc.add(
    new TextBlock(
      'This guide is a live demonstration of BonniePDF cross-references. The contents ' +
        'below link to chapters that appear on later pages, and each shows the resolved ' +
        'page number - all wired up automatically.',
      { margin: { bottom: 16 } }
    )
  );

  doc.add(
    new Heading('Contents', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      color: 'slate-800',
      margin: { bottom: 8 },
    })
  );

  for (const [id, chapterTitle] of chapters) {
    // Clickable jump - a standalone Link block (mirrors the Hyperlinks recipe).
    doc.add(
      new SectionLink(`> ${chapterTitle}`, id, {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 13,
        color: 'blue-600',
        margin: { bottom: 2 },
      })
    );

    // "begins on page N" - a label + a live PageNumberOf on one row.
    const row = new HorizontalStack({ spacing: 4, margin: { left: 16, bottom: 10 } });

    const label = new TextBlock('begins on page', { fontSize: 11, color: 'slate-500' });
    row.add(label, label.getPreferredWidth());

    row.add(new PageNumberOf(id, { fontName: StandardFonts.HelveticaBold, fontSize: 11, color: 'slate-700' }));

    doc.add(row);
  }

  // One chapter per page so the page numbers are visibly distinct.
  for (const [id, chapterTitle, body] of chapters) {
    doc.add(new PageBreak());

    // The anchor sits exactly where the chapter starts.
    doc.add(new Section(id));

    doc.add(
      new Heading(chapterTitle, {
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 18,
        color: 'slate-800',
        margin: { bottom: 8 },
      })
    );

    doc.add(new TextBlock(body, { margin: { bottom: 16 } }));

    // Back-reference to the contents page, resolved the same way.
    doc.add(new SectionLink('< Back to Contents', 'contents', { fontSize: 12, color: 'blue-600' }));
  }

  return doc;
}
