import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
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
} from '@bonniepdf/core';

export function generate(): Document {
  const HEADING = StandardFonts.HelveticaBold;
  const BODY = StandardFonts.Helvetica;

  const settings = new DocumentSettings();
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.pageMode = PageModeEnum.UseNone;
  settings.displayDocTitle = true;
  settings.version = PdfVersion.Pdf14;

  const metadata = new DocumentMetadata();
  metadata.title = 'Simple Document Example';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrating the Document API - TypeScript / Browser';
  metadata.keywords = 'pdf, document, example, BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const heading = (text: string, size: number, color: Color, mb = 0): TextBlock => {
    const b = new TextBlock(text);
    b.fontName = HEADING;
    b.fontSize = size;
    b.textColor = color;
    if (mb) b.margin = new Thickness(0, 0, 0, mb);
    return b;
  };
  const body = (text: string, mb = 0): TextBlock => {
    const b = new TextBlock(text);
    if (mb) b.margin = new Thickness(0, 0, 0, mb);
    return b;
  };

  // ── Page 1 ──
  doc.add(heading('Hello, Document API!', 24, Color.slate800, 12));
  doc.add(body('This PDF was generated entirely in the browser using the TypeScript port of BonniePDF.'));
  doc.add(new Spacer(16));
  doc.add(heading('Key Features:', 14, Color.slate700, 6));

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
  doc.add(heading('Page 2', 20, Color.slate800, 12));
  doc.add(body('This demonstrates multipage support with automatic page management.'));

  // ── Page 3 - custom square ──
  const squareSize = new PdfSize(300, 300, 'Square Card');
  doc.addPage(squareSize);

  const p3title = heading(`Page 3: ${squareSize.name}`, 16, Color.slate800);
  p3title.alignment = TextAlignment.Center;
  p3title.margin = new Thickness(0, 50, 0, 0);
  doc.add(p3title);

  const p3sub = body(`${squareSize.width}pt × ${squareSize.height}pt`);
  p3sub.alignment = TextAlignment.Center;
  doc.add(p3sub);

  return doc;
}
