import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  ZoomLevel,
  TextBlock,
  TextStyle,
  Hyperlink,
  Color,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate700);
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Hyperlink Examples';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating hyperlink support in PDFs';

  const doc = new Document(settings, metadata);

  // ── Title ──
  const title = new TextBlock('Hyperlink Support Demo');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 12);
  doc.add(title);

  // ── Basic links ──
  const basicLabel = new TextBlock('Basic Links:');
  basicLabel.fontName = StandardFonts.HelveticaBold;
  basicLabel.fontSize = 14;
  basicLabel.textColor = Color.slate700;
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
  const styledLabel = new TextBlock('Styled Links:');
  styledLabel.fontName = StandardFonts.HelveticaBold;
  styledLabel.fontSize = 14;
  styledLabel.textColor = Color.slate700;
  styledLabel.margin = new Thickness(0, 0, 0, 8);
  doc.add(styledLabel);

  // Default blue
  const defaultLink = new Hyperlink('Default Blue Link', 'https://github.com');
  defaultLink.margin = new Thickness(0, 0, 0, 8);
  doc.add(defaultLink);

  // Green
  const greenLink = new Hyperlink('Green Link', 'https://microsoft.com');
  greenLink.textColor = Color.green500;
  greenLink.margin = new Thickness(0, 0, 0, 8);
  doc.add(greenLink);

  // Large purple
  const purpleLink = new Hyperlink('Large Purple Link', 'https://google.com');
  purpleLink.fontSize = 16;
  purpleLink.textColor = Color.purple500;
  purpleLink.margin = new Thickness(0, 0, 0, 8);
  doc.add(purpleLink);

  // Bold red
  const redLink = new Hyperlink('Bold Red Link', 'https://stackoverflow.com');
  redLink.fontName = StandardFonts.HelveticaBold;
  redLink.fontSize = 14;
  redLink.textColor = Color.red;
  redLink.margin = new Thickness(0, 0, 0, 16);
  doc.add(redLink);

  // ── Links with margins ──
  const marginLabel = new TextBlock('Links with Margins:');
  marginLabel.fontName = StandardFonts.HelveticaBold;
  marginLabel.fontSize = 14;
  marginLabel.textColor = Color.slate700;
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
