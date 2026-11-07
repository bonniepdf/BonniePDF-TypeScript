/**
 * Embedded-Font Metrics (Class API).
 * The same framed alignment samples as Embedded-Font Metrics, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  AccessibilityMode,
  Border,
  BorderColors,
  ColorPalette,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalStack,
  PdfAConformance,
  PdfSize,
  TextAlignment,
  TextBlock,
  TextStyle,
  Thickness,
  VerticalStack,
  WidthDistribution,
} from '@bonniepdf/core';

// Liberation Sans — Regular for body text, Bold for headings.
const SANS = '/fonts/liberation/LiberationSans-Regular.ttf';
const SANS_BOLD = '/fonts/liberation/LiberationSans-Bold.ttf';

const SAMPLE_TEXT =
  'The quick brown fox jumps over the lazy dog. Every line here is measured from the advance ' +
  'widths stored in the embedded font, the same font that draws it, so the edge this alignment ' +
  'promises lands on the rule beside it in any viewer.';

const BOOK_PARAS = [
  'In the beginning, there was only the vast emptiness of space, stretching infinitely in all directions. ' +
    'Then, from the primordial void, matter began to coalesce under the inexorable pull of gravity, forming ' +
    'the first stars that would illuminate the cosmos.',
  'These ancient stars burned with a fierce intensity, forging heavier elements in their cores through ' +
    'nuclear fusion. Carbon, oxygen, iron, and gold were all born in the hearts of dying stars, scattered ' +
    'across the universe in spectacular supernova explosions.',
  'From this cosmic debris, new generations of stars formed, surrounded by disks of dust and gas that ' +
    'would eventually coalesce into planets. On at least one of these worlds, conditions were just right ' +
    'for something remarkable to happen: the emergence of life.',
];

/**
 * The **class / construct-then-mutate** companion to `embedded-font-metrics.ts`.
 *
 * Same framed samples, authored the long way: `new` each element and assign
 * its properties. It renders **byte-for-byte identically** to the options-style
 * `embedded-font-metrics.ts` (an equivalence test binds the two).
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily(SANS).withSize(11).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Embedded-Font Metrics';
  metadata.author = 'BonniePDF';
  metadata.subject = 'How an embedded TrueType font makes alignment edges exact, using its own hmtx advance widths.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, fonts, embedding, metrics, hmtx, alignment, truetype, liberation';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Embedded-Font Metrics');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = SANS_BOLD;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 16);
  doc.add(h1);

  const intro = new TextBlock(
    'An embedded font carries its own advance widths, and the same font program draws the text, so the widths ' +
      'measured during layout are the widths every reader sees. Each frame below marks the measure with a rule on ' +
      'each side; the edges each alignment promises land on them.'
  );
  intro.lineHeight = 1.45;
  intro.margin = new Thickness(0, 0, 0, 18);
  doc.add(intro);

  doc.add(
    row(
      framedSample('Left', 'left edge on the rule', TextAlignment.Left),
      framedSample('Centre', 'centred between the rules', TextAlignment.Center),
      18
    )
  );
  doc.add(
    row(
      framedSample('Right', 'right edge on the rule', TextAlignment.Right),
      framedSample('Justified', 'both edges on the rules', TextAlignment.Justify),
      24
    )
  );

  // ── Book-style justified paragraphs, framed the same way ──────────────────
  const book = new Heading('Book-style justified paragraphs');
  book.tocIdentifier = 'book';
  book.level = 2;
  book.fontName = SANS_BOLD;
  book.fontSize = 13;
  book.color = ColorPalette.slate[900];
  book.margin = new Thickness(0, 0, 0, 8);
  doc.add(book);

  const paragraphs = new VerticalStack();
  paragraphs.spacing = 8;
  for (const text of BOOK_PARAS) {
    const p = new TextBlock(text);
    p.fontName = SANS;
    p.alignment = TextAlignment.Justify;
    p.lineHeight = 1.4;
    paragraphs.add(p);
  }
  doc.add(frame(paragraphs));

  return doc;
}

// Local helpers and sample types used by this document.

/** Two framed samples side by side. */
function row(left: VerticalStack, right: VerticalStack, marginBottom: number): HorizontalStack {
  const stack = new HorizontalStack();
  stack.spacing = 24;
  stack.widthDistribution = WidthDistribution.Equal;
  stack.margin = new Thickness(0, 0, 0, marginBottom);
  stack.add(left);
  stack.add(right);
  return stack;
}

/** A frame whose left and right rules mark the measure, with no padding between rule and text. */
function frame(child: TextBlock | VerticalStack): Container {
  const container = new Container();
  container.border = new Border(0.75, 0, 0.75, 0);
  container.borderColors = new BorderColors(ColorPalette.teal[500]);
  container.backgroundColor = ColorPalette.slate[50];
  container.padding = new Thickness(0, 8, 0, 8);
  container.child = child;
  return container;
}

/** One alignment: a heading, a caption saying what to look for, and the framed sample. */
function framedSample(title: string, caption: string, alignment: TextAlignment): VerticalStack {
  const heading = new Heading(title);
  heading.level = 2;
  heading.fontName = SANS_BOLD;
  heading.fontSize = 12;
  heading.color = ColorPalette.slate[900];

  const note = new TextBlock(caption);
  note.fontSize = 9;
  note.color = ColorPalette.teal[700];

  const sample = new TextBlock(SAMPLE_TEXT);
  sample.alignment = alignment;
  sample.fontSize = 10.5;
  sample.lineHeight = 1.4;

  const stack = new VerticalStack();
  stack.spacing = 4;
  stack.add(heading);
  stack.add(note);
  stack.add(frame(sample));
  return stack;
}
