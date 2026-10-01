import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  ZoomLevel,
  TextBlock,
  TextStyle,
  Heading,
  Hyperlink,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `hyperlinks.ts`.
 *
 * Same hyperlink tour - basic, styled (colour/size/weight), and margined links -
 * authored the long way: `new Hyperlink(text, uri)` then assign properties,
 * using `ZoomLevel`, `TextStyle`, `Thickness`, `Color` and `ColorPalette`
 * directly. This is the escape hatch the options-object front door sits on.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `hyperlinks.ts` (an equivalence test binds the two). Reach for the options
 * form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Hyperlink Examples';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating hyperlink support in PDFs';

  const doc = new Document(settings, metadata);

  // ── Title ──
  // A real Heading (H1), not a big TextBlock: PDF/UA preflight requires the
  // outline to start at H1, and headings give AT users document structure.
  const title = new Heading('Hyperlink Support Demo');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 12);
  doc.add(title);

  // ── Basic links ──
  const basicLabel = new Heading('Basic Links');
  basicLabel.level = 2;
  basicLabel.fontName = StandardFonts.HelveticaBold;
  basicLabel.fontSize = 14;
  basicLabel.color = ColorPalette.slate[700];
  basicLabel.margin = new Thickness(0, 0, 0, 8);
  doc.add(basicLabel);

  for (const [text, uri, mb] of [
    ['Visit GitHub', 'https://github.com', 8],
    ['Visit Microsoft', 'https://microsoft.com', 8],
    ['Search on Google', 'https://google.com', 16],
  ] as [string, string, number][]) {
    // TS constructor: Hyperlink(text, uri) - note .NET swaps the order
    const link = new Hyperlink(text, uri);
    link.margin = new Thickness(0, 0, 0, mb);
    doc.add(link);
  }

  // ── Styled links ──
  const styledLabel = new Heading('Styled Links');
  styledLabel.level = 2;
  styledLabel.fontName = StandardFonts.HelveticaBold;
  styledLabel.fontSize = 14;
  styledLabel.color = ColorPalette.slate[700];
  styledLabel.margin = new Thickness(0, 0, 0, 8);
  doc.add(styledLabel);

  // Default blue
  const defaultLink = new Hyperlink('Default Blue Link', 'https://github.com');
  defaultLink.margin = new Thickness(0, 0, 0, 8);
  doc.add(defaultLink);

  // Green
  const greenLink = new Hyperlink('Green Link', 'https://microsoft.com');
  greenLink.color = ColorPalette.green[700];
  greenLink.margin = new Thickness(0, 0, 0, 8);
  doc.add(greenLink);

  // Large purple
  const purpleLink = new Hyperlink('Large Purple Link', 'https://google.com');
  purpleLink.fontSize = 16;
  purpleLink.color = ColorPalette.purple[600];
  purpleLink.margin = new Thickness(0, 0, 0, 8);
  doc.add(purpleLink);

  // Bold red
  const redLink = new Hyperlink('Bold Red Link', 'https://stackoverflow.com');
  redLink.fontName = StandardFonts.HelveticaBold;
  redLink.fontSize = 14;
  redLink.color = ColorPalette.red[700];
  redLink.margin = new Thickness(0, 0, 0, 16);
  doc.add(redLink);

  // ── Links with margins ──
  const marginLabel = new Heading('Links with Margins');
  marginLabel.level = 2;
  marginLabel.fontName = StandardFonts.HelveticaBold;
  marginLabel.fontSize = 14;
  marginLabel.color = ColorPalette.slate[700];
  doc.add(marginLabel);

  const before = new TextBlock('Text before link.');
  before.fontSize = 10;
  doc.add(before);

  const marginLink = new Hyperlink('Link with 20pt vertical margins', 'https://github.com');
  marginLink.margin = new Thickness(0, 20, 0, 20);
  doc.add(marginLink);

  const after = new TextBlock('Text after link.');
  after.fontSize = 10;
  doc.add(after);

  return doc;
}
