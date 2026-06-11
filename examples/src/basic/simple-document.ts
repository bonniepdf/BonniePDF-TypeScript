import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  ZoomLevel,
  PageModeEnum,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Spacer,
  Color,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const HEADING = StandardFonts.HelveticaBold;

  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.pageMode = PageModeEnum.UseNone;
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Simple Document Example';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating the Document API - TypeScript / Browser';
  metadata.keywords = 'pdf, document, example, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Page 1 ──
  const h1 = new TextBlock('Hello, Document API!');
  h1.fontName = HEADING;
  h1.fontSize = 24;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  doc.add(new TextBlock('This PDF was generated entirely in the browser using the TypeScript port of BonniePDF.'));
  doc.add(new Spacer(16));

  const keyFeatures = new TextBlock('Key Features:');
  keyFeatures.fontName = HEADING;
  keyFeatures.fontSize = 14;
  keyFeatures.textColor = Color.slate700;
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

  // ── Page 2 ──
  doc.addPage();
  const page2 = new TextBlock('Page 2');
  page2.fontName = HEADING;
  page2.fontSize = 20;
  page2.textColor = Color.slate800;
  page2.margin = new Thickness(0, 0, 0, 12);
  doc.add(page2);
  doc.add(new TextBlock('This demonstrates multipage support with automatic page management.'));

  // ── Page 3 - custom square ──
  const squareSize = new PdfSize(300, 300, 'Square Card');
  doc.addPage(squareSize);

  const p3title = new TextBlock(`Page 3: ${squareSize.name}`);
  p3title.fontName = HEADING;
  p3title.fontSize = 16;
  p3title.textColor = Color.slate800;
  p3title.alignment = TextAlignment.Center;
  p3title.margin = new Thickness(0, 50, 0, 0);
  doc.add(p3title);

  const p3sub = new TextBlock(`${squareSize.width}pt × ${squareSize.height}pt`);
  p3sub.alignment = TextAlignment.Center;
  doc.add(p3sub);

  return doc;
}
