import { Document, DocumentSettings, DocumentMetadata, PdfSize, PdfVersion, ZoomLevel, PageModeEnum, TextBlock, TextAlignment, VerticalStack, Spacer, Color, Thickness, StandardFonts } from '@bonniepdf/core'

export function generate(): Document {
  const HEADING = StandardFonts.HelveticaBold;
  const BODY    = StandardFonts.Helvetica;

  const settings = new DocumentSettings();
  settings.defaultZoom     = ZoomLevel.FitPage;
  settings.pageMode        = PageModeEnum.UseNone;
  settings.displayDocTitle = true;
  settings.version         = PdfVersion.Pdf14;

  const metadata = new DocumentMetadata();
  metadata.title    = 'Simple Document Example';
  metadata.author   = 'BonniePDF';
  metadata.subject  = 'Demonstrating the Document API — TypeScript / Browser';
  metadata.keywords = 'pdf, document, example, BonniePDF';

  const doc = new Document(settings, metadata);

  const tb = (text: string, font: string, size: number, color: Color, mb = 0): TextBlock => {
    const b = new TextBlock(text);
    b.fontName  = font;
    b.fontSize  = size;
    b.textColor = color;
    if (mb) b.margin = new Thickness(0, 0, 0, mb);
    return b;
  };

  // ── Page 1 ──
  doc.add(tb('Hello, Document API!', HEADING, 24, Color.slate800, 12));
  doc.add(tb(
    'This PDF was generated entirely in the browser using the TypeScript port of BonniePDF.',
    BODY, 12, Color.slate600,
  ));
  doc.add(new Spacer(16));
  doc.add(tb('Key Features:', HEADING, 14, Color.slate700, 6));

  const features = new VerticalStack();
  features.spacing = 2;
  for (const line of [
    '- Simple, intuitive API',
    '- Built-in metadata support',
    '- Configurable zoom levels',
    '- Viewer preferences',
    '- Automatic page management',
  ]) {
    features.addChild(tb(line, BODY, 11, Color.slate600));
  }
  doc.add(features);

  // ── Page 2 ──
  doc.addPage();
  doc.add(tb('Page 2', HEADING, 20, Color.slate800, 12));
  doc.add(tb(
    'This demonstrates multipage support with automatic page management.',
    BODY, 12, Color.slate600,
  ));

  // ── Page 3 — custom square ──
  const squareSize = new PdfSize(300, 300, 'Square Card');
  doc.addPage(squareSize);

  const p3title = tb(`Page 3: ${squareSize.name}`, HEADING, 16, Color.slate800);
  p3title.alignment = TextAlignment.Center;
  p3title.margin    = new Thickness(0, 50, 0, 0);
  doc.add(p3title);

  const p3sub = tb(`${squareSize.width}pt × ${squareSize.height}pt`, BODY, 12, Color.slate600);
  p3sub.alignment = TextAlignment.Center;
  doc.add(p3sub);

  return doc;
}