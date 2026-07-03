import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  ZoomLevel,
  PageModeEnum,
  TextBlock,
  Heading,
  QRCode,
  Line,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Spacer,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

/**
 * The core Document API - three pages of text, spacers, and a custom
 * square page - authored as an accessible, archival PDF by default:
 * `conformance = PdfA2a` + `accessibility = PdfUa1`. Headings use the
 * semantic `Heading` element so they surface as `/H1`../`H2` in the
 * structure tree; body copy picks up implicit `/P` tagging from
 * `TextBlock`; the QR code becomes a `/Figure` with alt-text.
 */
export function generate(): Document {
  const HEADING = StandardFonts.HelveticaBold;

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.pageMode = PageModeEnum.UseNone;
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Simple Document Example';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating the Document API - TypeScript / Browser';
  metadata.keywords = 'pdf, document, example, accessibility, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Page 1 ──
  const h1 = new Heading('Hello, Document API!');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = HEADING;
  h1.fontSize = 24;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  doc.add(new TextBlock('This PDF was generated entirely in the browser using the TypeScript port of BonniePDF.'));
  doc.add(new Spacer(16));

  const keyFeatures = new Heading('Key Features');
  keyFeatures.tocIdentifier = 'features';
  keyFeatures.level = 2;
  keyFeatures.fontName = HEADING;
  keyFeatures.fontSize = 14;
  keyFeatures.textColor = ColorPalette.slate[700];
  keyFeatures.margin = new Thickness(0, 0, 0, 6);
  doc.add(keyFeatures);

  const features = new VerticalStack();
  features.spacing = 2;
  for (const line of [
    '- Simple, intuitive API',
    '- Built-in metadata support',
    '- Configurable zoom levels',
    '- Viewer preferences',
    '- Automatic page management',
  ]) {
    const b = new TextBlock(line);
    b.fontSize = 11;
    features.addChild(b);
  }
  doc.add(features);

  // ── Divider, then the accessibility note ──
  doc.add(new Spacer(16));
  const divider = new Line();
  divider.thickness = 1;
  divider.color = ColorPalette.slate[300];
  doc.add(divider);
  doc.add(new Spacer(16));

  doc.add(
    new TextBlock(
      'Existing elements (Heading, TextBlock, Image, QRCode) tag themselves automatically - no semantic verbs required.'
    )
  );
  doc.add(new Spacer(16));

  const scan = new Heading('Scan to verify');
  scan.tocIdentifier = 'verify';
  scan.level = 2;
  scan.fontName = HEADING;
  scan.fontSize = 14;
  scan.textColor = ColorPalette.slate[700];
  scan.margin = new Thickness(0, 0, 0, 6);
  doc.add(scan);

  const qr = new QRCode();
  qr.data = 'https://bonniepdf.dev';
  qr.size = 100;
  qr.altText = 'QR code linking to https://bonniepdf.dev';
  doc.add(qr);

  // ── Page 2 ──
  doc.addPage();
  const page2 = new Heading('Page 2');
  page2.tocIdentifier = 'page2';
  page2.level = 1;
  page2.fontName = HEADING;
  page2.fontSize = 20;
  page2.textColor = ColorPalette.slate[800];
  page2.margin = new Thickness(0, 0, 0, 12);
  doc.add(page2);
  doc.add(new TextBlock('This demonstrates multipage support with automatic page management.'));

  // ── Page 3 - custom square ──
  const squareSize = new PdfSize(300, 300, 'Square Card');
  doc.addPage(squareSize);

  const p3title = new Heading(`Page 3: ${squareSize.name}`);
  p3title.tocIdentifier = 'square';
  p3title.level = 1;
  p3title.fontName = HEADING;
  p3title.fontSize = 16;
  p3title.textColor = ColorPalette.slate[800];
  p3title.alignment = TextAlignment.Center;
  p3title.margin = new Thickness(0, 50, 0, 0);
  doc.add(p3title);

  const p3sub = new TextBlock(`${squareSize.width}pt × ${squareSize.height}pt`);
  p3sub.alignment = TextAlignment.Center;
  doc.add(p3sub);

  return doc;
}
