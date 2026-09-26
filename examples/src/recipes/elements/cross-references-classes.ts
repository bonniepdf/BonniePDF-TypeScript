import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  TextStyle,
  Heading,
  Section,
  SectionLink,
  PageNumberOf,
  HorizontalStack,
  PageBreak,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

/**
 * Cross-references: `Section` (named anchors), `SectionLink` (clickable
 * internal jumps), and `PageNumberOf` ("see page 42"). The contents block sits
 * on page 1, ahead of the chapters it points at, so every reference is resolved
 * by the two-pass layout before the page is drawn.
 */
/**
 * The **class / construct-then-mutate** companion to `cross-references.ts`.
 *
 * Same cross-reference field guide - `Section` anchors, `SectionLink` jumps,
 * `PageNumberOf` page references - authored the long way: `new` each element and
 * assign properties, using `TextStyle`, `Thickness` and `ColorPalette`
 * directly. This is the escape hatch the options-object front door sits on.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `cross-references.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Cross-Reference Field Guide';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Section anchors, internal links, and page references';

  const doc = new Document(settings, metadata);

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

  const title = new Heading('Cross-Reference Field Guide');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 12);
  doc.add(title);

  const intro = new TextBlock(
    'This guide is a live demonstration of BonniePDF cross-references. The contents ' +
      'below link to chapters that appear on later pages, and each shows the resolved ' +
      'page number - all wired up automatically.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  const contentsLabel = new Heading('Contents');
  contentsLabel.level = 2;
  contentsLabel.fontName = StandardFonts.HelveticaBold;
  contentsLabel.fontSize = 15;
  contentsLabel.textColor = ColorPalette.slate[800];
  contentsLabel.margin = new Thickness(0, 0, 0, 8);
  doc.add(contentsLabel);

  for (const [id, chapterTitle] of chapters) {
    // Clickable jump - a standalone Link block (mirrors the Hyperlinks recipe).
    const jump = new SectionLink(`> ${chapterTitle}`, id);
    jump.fontName = StandardFonts.HelveticaBold;
    jump.fontSize = 13;
    jump.textColor = ColorPalette.blue[600];
    jump.margin = new Thickness(0, 0, 0, 2);
    doc.add(jump);

    // "begins on page N" - a label + a live PageNumberOf on one row.
    const row = new HorizontalStack();
    row.spacing = 4;
    row.margin = new Thickness(16, 0, 0, 10);

    const label = new TextBlock('begins on page');
    label.fontSize = 11;
    label.textColor = ColorPalette.slate[500];
    row.add(label, label.getPreferredWidth());

    const pageRef = new PageNumberOf(id);
    pageRef.fontName = StandardFonts.HelveticaBold;
    pageRef.fontSize = 11;
    pageRef.textColor = ColorPalette.slate[700];
    row.add(pageRef);

    doc.add(row);
  }

  // One chapter per page so the page numbers are visibly distinct.
  for (const [id, chapterTitle, body] of chapters) {
    doc.add(new PageBreak());

    // The anchor sits exactly where the chapter starts.
    doc.add(new Section(id));

    const heading = new Heading(chapterTitle);
    heading.level = 2;
    heading.fontName = StandardFonts.HelveticaBold;
    heading.fontSize = 18;
    heading.textColor = ColorPalette.slate[800];
    heading.margin = new Thickness(0, 0, 0, 8);
    doc.add(heading);

    const paragraph = new TextBlock(body);
    paragraph.margin = new Thickness(0, 0, 0, 16);
    doc.add(paragraph);

    // Back-reference to the contents page, resolved the same way.
    const back = new SectionLink('< Back to Contents', 'contents');
    back.fontSize = 12;
    back.textColor = ColorPalette.blue[600];
    doc.add(back);
  }

  return doc;
}
