import {
  Document,
  Heading,
  TextBlock,
  HorizontalStack,
  VerticalStack,
  Container,
  Line,
  Image,
  PageBreak,
  StandardFonts,
  Placeholders,
} from '@bonniepdf/core';

/**
 * Multi-column (newspaper-style) layouts - a three-column article with images,
 * two text columns separated by a vertical rule, and balanced versus ragged
 * column heights - authored through the options-object front door.
 *
 * There is no dedicated multi-column element: a HorizontalStack divides the
 * page width into columns, each column is a VerticalStack that flows top to
 * bottom, and spacing sets the gutter. Content belongs to the column it is
 * placed in, so what each column holds is explicit in the code - including how
 * material is split when you want columns of even height.
 *
 * Placeholder paragraphs and images come from a local seeded source so this
 * file and its class-API companion produce identical documents.
 */
export function generate(): Document {
  const source = Placeholders.withSeed(42);

  // Deterministic filler, generated once in document order so the class-API
  // companion (which reads the same calls in the same order) stays identical.
  const articleColumns = ['Front Page', 'The Brief', 'Dispatches'].map(heading => ({
    heading,
    paragraphs: [source.paragraph(), source.paragraph()],
    imageData: source.image({ width: 153, height: 64 }),
  }));
  const dividerParagraphs = {
    left: [source.paragraph(), source.paragraph()],
    right: [source.paragraph(), source.paragraph()],
  };
  const balanceParagraphs = [
    source.paragraph(),
    source.paragraph(),
    source.paragraph(),
    source.paragraph(),
    source.paragraph(),
    source.paragraph(),
  ];

  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
    },
    metadata: {
      title: 'Multi-Column Layouts Demo',
      author: 'BonniePDF',
      subject: 'Demonstrates newspaper-style multi-column layouts in an accessible PDF/A-2a + PDF/UA-1 document.',
      keywords: 'pdf, accessibility, layout, columns, multi-column, newspaper, BonniePDF',
    },
  });

  doc.add(
    new Heading('Multi-Column Layouts', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: 'slate-800',
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'A multi-column layout sets text in vertical columns read left to right, the way newspapers and ' +
        'magazines have been printed for centuries. On a wide page it keeps line lengths comfortable and ' +
        'lets related material sit side by side. In BonniePDF the pattern is direct composition: a ' +
        'HorizontalStack divides the page width into columns, each column is a VerticalStack that flows ' +
        'from top to bottom, and the stack\u2019s spacing sets the gutter between columns. Content belongs to ' +
        'the column you place it in, so what each column contains is always explicit in the code.',
      { margin: { bottom: 10 } }
    )
  );

  // A masthead-style rule under the introduction. A horizontal Line fills the
  // width it is given; thickness is its height.
  doc.add(new Line({ thickness: 1, color: 'slate-300', margin: { bottom: 16 } }));

  // ── A three-column article ────────────────────────────────────────────────

  doc.add(sectionHeading('A Three-Column Article', 's-article', 0));
  doc.add(
    new TextBlock(
      'Three equal columns, each a VerticalStack holding its own heading, image and justified paragraphs. ' +
        'The number of stack children is the number of columns; the stack\u2019s spacing (18pt here) is the gutter.',
      { margin: { bottom: 10 } }
    )
  );

  doc.add(
    new HorizontalStack({
      spacing: 18,
      widthDistribution: 'equal',
      children: articleColumns.map(
        column =>
          new VerticalStack({
            spacing: 12,
            children: [
              new TextBlock(column.heading, {
                fontName: StandardFonts.HelveticaBold,
                fontSize: 12,
                color: 'slate-800',
              }),
              new Image({
                imageData: column.imageData,
                altText: 'Abstract placeholder illustration.',
                width: 153,
                height: 64,
                fitMode: 'cover',
              }),
              ...column.paragraphs.map(text => new TextBlock(text, { alignment: 'justify' })),
            ],
          })
      ),
    })
  );

  // ── Columns with a divider ────────────────────────────────────────────────

  doc.add(new PageBreak());

  doc.add(sectionHeading('Columns with a Divider', 's-divider', 0));
  doc.add(
    new TextBlock(
      'A vertical rule between two weighted text columns. The rule is a fixed-width Container added ' +
        'without a weight, so it keeps its own 2pt while the remaining width is split evenly between the ' +
        'text columns. The row carries an explicit height and the rule matches it, so the rule spans the ' +
        'whole block regardless of how the paragraphs inside fall.',
      { margin: { bottom: 10 } }
    )
  );

  // Per-child weights have no options-literal form, so build imperatively:
  // the two text columns carry weight 1 each; the rule is added without a
  // weight, which under weighted distribution means "keep your own width".
  // 223pt is the measured height of the taller column: the row and the rule
  // share it, so the rule ends where the columns do.
  const divided = new HorizontalStack({ spacing: 20, widthDistribution: 'weighted', height: 223 });
  divided.add(columnOf(dividerParagraphs.left), 1);
  divided.add(dividerRule(223));
  divided.add(columnOf(dividerParagraphs.right), 1);
  doc.add(divided);

  // ── Balancing column heights ──────────────────────────────────────────────

  doc.add(new PageBreak());

  doc.add(sectionHeading('Balancing Column Heights', 's-balance', 0));
  doc.add(
    new TextBlock(
      'Each column holds exactly what you place in it, so the split you choose decides the heights. ' +
        'Below, the same six paragraphs are arranged two ways: pushed into the first column, which leaves ' +
        'the second standing empty, and divided evenly, which levels the two.',
      { margin: { bottom: 10 } }
    )
  );

  doc.add(subCaption('Same material, all in the first column'));
  doc.add(
    new HorizontalStack({
      spacing: 20,
      widthDistribution: 'equal',
      children: [columnOf(balanceParagraphs.slice(0, 4)), columnOf(balanceParagraphs.slice(4))],
    })
  );

  doc.add(subCaption('Same material, split evenly', 20));
  doc.add(
    new HorizontalStack({
      spacing: 20,
      widthDistribution: 'equal',
      children: [columnOf(balanceParagraphs.slice(0, 3)), columnOf(balanceParagraphs.slice(3))],
    })
  );

  return doc;
}

/** The section heading used throughout - a level-2 Heading in the house style. */
function sectionHeading(text: string, tocIdentifier: string, topMargin: number): Heading {
  return new Heading(text, {
    tocIdentifier,
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    color: 'indigo-600',
    margin: { top: topMargin, bottom: 8 },
  });
}

/** The small bold label used above the balancing demonstrations. */
function subCaption(text: string, topMargin = 12): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    color: 'slate-600',
    margin: { top: topMargin, bottom: 6 },
  });
}

/** A column of justified paragraphs with a uniform gap between them. */
function columnOf(paragraphs: string[]): VerticalStack {
  return new VerticalStack({
    spacing: 12,
    children: paragraphs.map(text => new TextBlock(text, { alignment: 'justify' })),
  });
}

/**
 * The vertical rule between the divided columns: a 2pt-wide filled Container
 * sized to the row height. Under weighted distribution an unweighted child
 * keeps its preferred width, which is exactly what a fixed-width rule needs.
 */
function dividerRule(height: number): Container {
  return new Container({ width: 2, height, backgroundColor: 'slate-400' });
}
