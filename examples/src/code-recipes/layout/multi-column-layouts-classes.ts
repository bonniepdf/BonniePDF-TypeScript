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
  // filler text and images match byte-for-byte.
  const source = Placeholders.withSeed(42);

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
    'Three equal columns, each a VerticalStack holding its own heading, image and justified paragraphs. ' +
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
      paragraph.alignment = TextAlignment.Justify;
      col.add(paragraph);
    }

    articleStack.add(col);
  }
  doc.add(articleStack);

  // ── Columns with a divider ────────────────────────────────────────────────

  doc.add(new PageBreak());

  const h2Divider = sectionHeading('Columns with a Divider', 's-divider', 0);
  doc.add(h2Divider);

  const dividerDesc = new TextBlock(
    'A vertical rule between two weighted text columns. The rule is a fixed-width Container added ' +
      'without a weight, so it keeps its own 2pt while the remaining width is split evenly between the ' +
      'text columns. The row carries an explicit height and the rule matches it, so the rule spans the ' +
      'whole block regardless of how the paragraphs inside fall.'
  );
  dividerDesc.margin = new Thickness(0, 0, 0, 10);
  doc.add(dividerDesc);

  const divided = new HorizontalStack();
  divided.spacing = 20;
  divided.widthDistribution = WidthDistribution.Weighted;
  divided.height = 223;
  divided.add(columnOf(dividerParagraphs.left), 1);

  const rule = new Container();
  rule.width = 2;
  rule.height = 223;
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

/** A column of justified paragraphs with a uniform gap between them. */
function columnOf(paragraphs: string[]): VerticalStack {
  const column = new VerticalStack();
  column.spacing = 12;
  for (const text of paragraphs) {
    const paragraph = new TextBlock(text);
    paragraph.alignment = TextAlignment.Justify;
    column.add(paragraph);
  }
  return column;
}
