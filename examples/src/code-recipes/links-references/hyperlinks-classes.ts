/**
 * Hyperlinks (Class API).
 * The same resources page as Hyperlinks, built with the class API: construct each link and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  AccessibilityMode,
  Border,
  BorderColors,
  Color,
  ColorPalette,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalAlignment,
  HorizontalStack,
  Hyperlink,
  PdfAConformance,
  RichText,
  StandardFonts,
  TextBlock,
  TextStyle,
  Thickness,
  VerticalStack,
  WidthDistribution,
  ZoomLevel,
} from '@bonniepdf/core';

/** One colour for every link, so readers learn what is clickable. */
const LINK = ColorPalette.blue[700];

const RESOURCES = [
  [
    'Getting started guide',
    'https://www.bonniepdf.dev/docs',
    'Install the library and build a first document in a few minutes.',
  ],
  ['PDF Association', 'https://pdfa.org', 'The industry body behind the PDF/A and PDF/UA standards.'],
  ['veraPDF', 'https://verapdf.org', 'The open-source validator for PDF/A and PDF/UA conformance.'],
  [
    'W3C Web Accessibility Initiative',
    'https://www.w3.org/WAI/',
    'Guidance on writing link text that makes sense out of context.',
  ],
] as const;

/**
 * The **class / construct-then-mutate** companion to `hyperlinks.ts`.
 *
 * Same resources page, authored the long way: `new Hyperlink(text, uri)` then
 * assign properties, using `Thickness`, `Border`, `ColorPalette` and the enums
 * directly. It renders **byte-for-byte identically** to the options-style
 * `hyperlinks.ts` (an equivalence test binds the two).
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[600]);
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Hyperlink Examples';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating hyperlink support in PDFs';

  const doc = new Document(settings, metadata);

  const title = new Heading('Useful resources');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 26;
  title.color = ColorPalette.slate[900];
  title.margin = new Thickness(0, 0, 0, 6);
  doc.add(title);

  const intro = new TextBlock(
    'Every blue line on this page is a link. Each one names where it goes, so it makes sense read on its own.'
  );
  intro.margin = new Thickness(0, 0, 0, 24);
  doc.add(intro);

  // ── Web links, each with a one-line description ──
  doc.add(sectionHeading('Read more'));
  for (const [title, uri, description] of RESOURCES) {
    // TS constructor: Hyperlink(text, uri) - .NET takes (uri, text).
    const link = new Hyperlink(title, uri);
    link.fontName = StandardFonts.HelveticaBold;
    link.fontSize = 12;
    link.color = LINK;

    const summary = new TextBlock(description);
    summary.fontSize = 10;
    const address = new TextBlock(uri);
    address.fontSize = 9;
    address.color = ColorPalette.slate[500];

    const stack = new VerticalStack();
    stack.spacing = 3;
    stack.add(link);
    stack.add(summary);
    stack.add(address);

    const row = new Container();
    row.border = new Border(0, 0, 0, 1);
    row.borderColors = new BorderColors(ColorPalette.slate[200]);
    row.padding = new Thickness(0, 10, 0, 10);
    row.child = stack;
    doc.add(row);
  }

  // ── A link inside a sentence: a RichText span with a URI, styled as the link's look ──
  doc.add(sectionHeading('Links in a sentence', 28));
  const sentence = new RichText();
  sentence.defaultStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[600]);
  sentence.span('Orders are accepted on our ');
  sentence.link('terms of business', 'https://www.bonniepdf.dev/legal', new TextStyle().withColor(LINK).underline());
  sentence.span(
    ', which set out delivery times, returns and how we handle your data. The link sits in the sentence and wraps with it.'
  );
  doc.add(sentence);

  // ── A button-style link: a Hyperlink inside a filled, rounded container ──
  doc.add(sectionHeading('Start a trial', 28));
  const ctaNote = new TextBlock('A call to action reads as a button when the link sits in a filled shape.');
  ctaNote.margin = new Thickness(0, 0, 0, 10);
  doc.add(ctaNote);

  const cta = new Hyperlink('Download the trial', 'https://www.bonniepdf.dev/pricing');
  cta.fontName = StandardFonts.HelveticaBold;
  cta.fontSize = 12;
  cta.color = Color.white;

  const button = new Container();
  button.width = 200;
  button.backgroundColor = LINK;
  button.cornerRadius = 6;
  button.padding = new Thickness(18, 10, 18, 10);
  button.horizontalAlignment = HorizontalAlignment.Center;
  button.child = cta;
  doc.add(button);

  // ── Email and phone links ──
  doc.add(sectionHeading('Get in touch', 28));
  const contacts = new HorizontalStack();
  contacts.spacing = 16;
  contacts.widthDistribution = WidthDistribution.Equal;
  contacts.add(
    contactCard(
      'Email',
      'support@example.com',
      'mailto:support@example.com',
      'Opens your mail app with the address filled in.'
    )
  );
  contacts.add(
    contactCard(
      'Phone',
      '0117 496 0000',
      'tel:+441174960000',
      'Rings the number on a phone; desktop viewers ask first.'
    )
  );
  doc.add(contacts);

  return doc;
}

// Local helpers used by this document.

/** A level-2 heading with the shared style used across this example. */
function sectionHeading(text: string, marginTop = 0): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 15;
  heading.color = ColorPalette.slate[900];
  heading.margin = new Thickness(0, marginTop, 0, 4);
  return heading;
}

/** A tinted card holding one contact link. */
function contactCard(label: string, text: string, uri: string, note: string): Container {
  const eyebrow = new TextBlock(label.toUpperCase());
  eyebrow.fontName = StandardFonts.HelveticaBold;
  eyebrow.fontSize = 8;
  eyebrow.letterSpacing = 1.2;
  eyebrow.color = ColorPalette.slate[600];

  const link = new Hyperlink(text, uri);
  link.fontSize = 13;
  link.color = LINK;

  const detail = new TextBlock(note);
  detail.fontSize = 9;

  const stack = new VerticalStack();
  stack.spacing = 4;
  stack.add(eyebrow);
  stack.add(link);
  stack.add(detail);

  const card = new Container();
  card.backgroundColor = ColorPalette.slate[100];
  card.cornerRadius = 8;
  card.padding = new Thickness(14);
  card.child = stack;
  return card;
}
