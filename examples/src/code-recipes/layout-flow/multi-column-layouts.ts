/**
 * Multi-Column Layouts.
 * Newspaper-style columns built from stacks: a three-story community newsletter with images, two text columns sharing a divider, and balanced versus ragged column heights.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
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

/** A community newsletter's three front-page stories: headline and paragraphs. */
const ARTICLE: [string, string[]][] = [
  [
    'Community garden opens',
    [
      'The community garden on Mill Lane opened its gates on Saturday after two years of planning. Forty raised beds, a greenhouse and a tool store now stand on what was an empty car park behind the station.',
      'Every bed has been taken for the first season, and a waiting list is open at the library desk. Volunteers meet on Wednesday evenings and Sunday mornings; no experience is needed and tools are provided.',
    ],
  ],
  [
    'Library open later',
    [
      'The central library will stay open until 8pm on Tuesdays and Thursdays from next month. The change follows a survey in which most respondents asked for evening access to study space.',
      'The reading room has new tables with power at every seat, and study rooms can now be booked online up to a week ahead. Membership remains free for everyone who lives, works or studies in the town.',
    ],
  ],
  [
    'High Street works',
    [
      'Work to resurface the High Street begins on 12 January and is expected to last six weeks. The road will close between 8pm and 6am, and the number 4 bus will divert along Station Road at night.',
      'Shops stay open throughout, and pavements will remain clear during trading hours. Updates will be posted on the noticeboard outside the town hall every Friday until the work is complete.',
    ],
  ],
];

/** The editor's note and the listings, set either side of the divider. */
const EDITOR = [
  'This is the last issue of the year, and the busiest. Thank you to everyone who sent in news, photographs and corrections; the newsletter is only as good as the town that writes it.',
  'Next year we move to a monthly issue, delivered to every household on the first Saturday of the month. If you would like to help with deliveries in your street, leave your name at the library desk.',
];
const WHATS_ON = [
  "The winter market returns to the square on the second weekend of December, with forty stalls, a choir on Saturday evening and the lighting of the tree at five o'clock on Sunday.",
  'The repair café meets in the church hall on the first Sunday of each month. Bring a broken lamp, a torn coat or a bicycle that will not change gear, and leave with it working again.',
];

/** Six paragraphs of one feature, used to compare column splits. */
const MARKET_HALL = [
  "The market hall on Church Street was built in 1868 to give the weekly cattle market a roof. Its iron columns were cast in the town's own foundry, and the clock above the entrance was paid for by public subscription.",
  'For a century the hall was the busiest building in the town. Farmers sold livestock on Tuesdays, and on Saturdays the floor filled with stalls selling cheese, cloth, ironmongery and seasonal produce.',
  'The cattle market moved to the edge of town in 1972, and the hall stood half used for many years. A leaking roof and a failed heating system closed it to the public in 2015.',
  'Restoration began in 2023 with a grant from the heritage fund and the work of a local building trust. The roof was relaid with the original slate, and the columns were stripped and repainted in their first colour.',
  'The hall reopened in the spring with twenty permanent stalls, a café and a space for exhibitions. The clock, silent for nine years, strikes the hour again.',
  'Guided tours run on the first Saturday of each month and take about an hour. They are free, but places are limited, so book at the library desk or at the café in the hall.',
];

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
 * The text is a community newsletter. Placeholder images come from a local
 * seeded source so this file and its class-API companion produce identical documents.
 */
export function generate(): Document {
  const source = Placeholders.withSeed(42);

  // Placeholder images, generated in document order so the class-API companion
  // (which reads the same calls in the same order) stays identical.
  const articleColumns = ARTICLE.map(([heading, paragraphs]) => ({
    heading,
    paragraphs,
    imageData: source.image({ width: 153, height: 64 }),
  }));
  const dividerParagraphs = { left: EDITOR, right: WHATS_ON };
  const balanceParagraphs = MARKET_HALL;

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
      'Three equal columns, each a VerticalStack holding its own heading, image and paragraphs. ' +
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
              ...column.paragraphs.map(text => new TextBlock(text, { alignment: 'left' })),
            ],
          })
      ),
    })
  );

  // ── Columns with a divider ────────────────────────────────────────────────

  doc.add(sectionHeading('Columns with a Divider', 's-divider', 0));
  doc.add(
    new TextBlock(
      'A vertical rule between two weighted text columns: an unweighted 2pt Container keeps its width while the columns share the rest, and the row and the rule share one explicit height.',
      { margin: { bottom: 10 } }
    )
  );

  // Per-child weights have no options-literal form, so build imperatively:
  // the two text columns carry weight 1 each; the rule is added without a
  // weight, which under weighted distribution means "keep your own width".
  // 144pt is the measured height of the taller column: the row and the rule
  // share it, so the rule ends where the columns do.
  const divided = new HorizontalStack({ spacing: 20, widthDistribution: 'weighted', height: 144 });
  divided.add(columnOf(dividerParagraphs.left), 1);
  divided.add(dividerRule(144));
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

// Local helpers and sample types used by this document.

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

/** A column of paragraphs with a uniform gap between them. */
function columnOf(paragraphs: string[]): VerticalStack {
  return new VerticalStack({
    spacing: 12,
    children: paragraphs.map(text => new TextBlock(text, { alignment: 'left' })),
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
