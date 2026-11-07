/**
 * Multi-Column Layouts (Class API).
 * The same multi-column tour as Multi-Column Layouts, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  HorizontalStack,
  VerticalStack,
  Container,
  Line,
  Image,
  PageBreak,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  TextAlignment,
  ImageFitMode,
  PdfAConformance,
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
 * The **class / construct-then-mutate** companion to `multi-column-layouts.ts`.
 *
 * Same multi-column tour - a three-column article, divided columns, and
 * balanced versus ragged heights - authored the long way: `new` each element
 * and assign properties, using the `WidthDistribution` / `TextAlignment` /
 * `ImageFitMode` enums, `Thickness`, `Color` and `ColorPalette` directly.
 * This is the escape hatch the options-object front door sits on.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `multi-column-layouts.ts` (an equivalence test binds the two). Reach for
 * the options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  // Same seeded source and same call order as the options variant, so the
  // placeholder images match byte-for-byte.
  const source = Placeholders.withSeed(42);

  const articleColumns = ARTICLE.map(([heading, paragraphs]) => ({
    heading,
    paragraphs,
    imageData: source.image({ width: 153, height: 64 }),
  }));
  const dividerParagraphs = { left: EDITOR, right: WHATS_ON };
  const balanceParagraphs = MARKET_HALL;

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Multi-Column Layouts Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates newspaper-style multi-column layouts in an accessible PDF/A-2a + PDF/UA-1 document.';
  metadata.keywords = 'pdf, accessibility, layout, columns, multi-column, newspaper, BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Multi-Column Layouts');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const intro = new TextBlock(
    'A multi-column layout sets text in vertical columns read left to right, the way newspapers and ' +
      'magazines have been printed for centuries. On a wide page it keeps line lengths comfortable and ' +
      'lets related material sit side by side. In BonniePDF the pattern is direct composition: a ' +
      'HorizontalStack divides the page width into columns, each column is a VerticalStack that flows ' +
      'from top to bottom, and the stack\u2019s spacing sets the gutter between columns. Content belongs to ' +
      'the column you place it in, so what each column contains is always explicit in the code.'
  );
  intro.margin = new Thickness(0, 0, 0, 10);
  doc.add(intro);

  // A masthead-style rule under the introduction. A horizontal Line fills the
  // width it is given; thickness is its height.
  const mastheadRule = new Line();
  mastheadRule.thickness = 1;
  mastheadRule.color = ColorPalette.slate[300];
  mastheadRule.margin = new Thickness(0, 0, 0, 16);
  doc.add(mastheadRule);

  // ── A three-column article ────────────────────────────────────────────────

  const h2Article = sectionHeading('A Three-Column Article', 's-article', 0);
  doc.add(h2Article);

  const articleDesc = new TextBlock(
    'Three equal columns, each a VerticalStack holding its own heading, image and paragraphs. ' +
      'The number of stack children is the number of columns; the stack\u2019s spacing (18pt here) is the gutter.'
  );
  articleDesc.margin = new Thickness(0, 0, 0, 10);
  doc.add(articleDesc);

  const articleStack = new HorizontalStack();
  articleStack.spacing = 18;
  articleStack.widthDistribution = WidthDistribution.Equal;
  for (const column of articleColumns) {
    const col = new VerticalStack();
    col.spacing = 12;

    const colHeading = new TextBlock(column.heading);
    colHeading.fontName = StandardFonts.HelveticaBold;
    colHeading.fontSize = 12;
    colHeading.color = ColorPalette.slate[800];
    col.add(colHeading);

    const image = new Image();
    image.imageData = column.imageData;
    image.altText = 'Abstract placeholder illustration.';
    image.width = 153;
    image.height = 64;
    image.fitMode = ImageFitMode.Cover;
    col.add(image);

    for (const text of column.paragraphs) {
      const paragraph = new TextBlock(text);
      paragraph.alignment = TextAlignment.Left;
      col.add(paragraph);
    }

    articleStack.add(col);
  }
  doc.add(articleStack);

  // ── Columns with a divider ────────────────────────────────────────────────

  const h2Divider = sectionHeading('Columns with a Divider', 's-divider', 0);
  doc.add(h2Divider);

  const dividerDesc = new TextBlock(
    'A vertical rule between two weighted text columns: an unweighted 2pt Container keeps its width while the columns share the rest, and the row and the rule share one explicit height.'
  );
  dividerDesc.margin = new Thickness(0, 0, 0, 10);
  doc.add(dividerDesc);

  const divided = new HorizontalStack();
  divided.spacing = 20;
  divided.widthDistribution = WidthDistribution.Weighted;
  divided.height = 144;
  divided.add(columnOf(dividerParagraphs.left), 1);

  const rule = new Container();
  rule.width = 2;
  rule.height = 144;
  rule.backgroundColor = ColorPalette.slate[400];
  divided.add(rule);

  divided.add(columnOf(dividerParagraphs.right), 1);
  doc.add(divided);

  // ── Balancing column heights ──────────────────────────────────────────────

  doc.add(new PageBreak());

  const h2Balance = sectionHeading('Balancing Column Heights', 's-balance', 0);
  doc.add(h2Balance);

  const balanceDesc = new TextBlock(
    'Each column holds exactly what you place in it, so the split you choose decides the heights. ' +
      'Below, the same six paragraphs are arranged two ways: pushed into the first column, which leaves ' +
      'the second standing empty, and divided evenly, which levels the two.'
  );
  balanceDesc.margin = new Thickness(0, 0, 0, 10);
  doc.add(balanceDesc);

  const lumpedCaption = subCaption('Same material, all in the first column', 12);
  doc.add(lumpedCaption);

  const lumped = new HorizontalStack();
  lumped.spacing = 20;
  lumped.widthDistribution = WidthDistribution.Equal;
  lumped.add(columnOf(balanceParagraphs.slice(0, 4)));
  lumped.add(columnOf(balanceParagraphs.slice(4)));
  doc.add(lumped);

  const balancedCaption = subCaption('Same material, split evenly', 20);
  doc.add(balancedCaption);

  const balanced = new HorizontalStack();
  balanced.spacing = 20;
  balanced.widthDistribution = WidthDistribution.Equal;
  balanced.add(columnOf(balanceParagraphs.slice(0, 3)));
  balanced.add(columnOf(balanceParagraphs.slice(3)));
  doc.add(balanced);

  return doc;
}

// Local helpers and sample types used by this document.

/** The section heading used throughout - a level-2 Heading in the house style. */
function sectionHeading(text: string, tocIdentifier: string, topMargin: number): Heading {
  const heading = new Heading(text);
  heading.tocIdentifier = tocIdentifier;
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 14;
  heading.color = ColorPalette.indigo[600];
  heading.margin = new Thickness(0, topMargin, 0, 8);
  return heading;
}

/** The small bold label used above the balancing demonstrations. */
function subCaption(text: string, topMargin: number): TextBlock {
  const caption = new TextBlock(text);
  caption.fontName = StandardFonts.HelveticaBold;
  caption.fontSize = 11;
  caption.color = ColorPalette.slate[600];
  caption.margin = new Thickness(0, topMargin, 0, 6);
  return caption;
}

/** A column of paragraphs with a uniform gap between them. */
function columnOf(paragraphs: string[]): VerticalStack {
  const column = new VerticalStack();
  column.spacing = 12;
  for (const text of paragraphs) {
    const paragraph = new TextBlock(text);
    paragraph.alignment = TextAlignment.Left;
    column.add(paragraph);
  }
  return column;
}
