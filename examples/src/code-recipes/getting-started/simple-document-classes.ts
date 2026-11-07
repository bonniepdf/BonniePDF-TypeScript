/**
 * Simple Document (Class API).
 * The same document as Simple Document, built with the class API: construct each object with `new`, then set properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
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
  Table,
  TableRow,
  Color,
  TextStyle,
  TextAlignment,
  UnorderedList,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
  Border,
  BorderColors,
  Container,
  HorizontalStack,
  VerticalAlignment,
  VerticalStack,
  WidthDistribution,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `simple-document.ts`.
 *
 * Same three-page accessible, archival document (`PdfA2a` + `PdfUa1`), authored
 * the long way: `new` the object, then set each property. This is the escape
 * hatch the options-object front door sits on top of - the underlying classes,
 * enum values (`PdfAConformance.PdfA2a`), and value objects (`Thickness`,
 * `ColorPalette`) are all public and stable.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `simple-document.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
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
  metadata.subject = 'Demonstrating the Document API';
  metadata.keywords = 'pdf, document, example, accessibility, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Page 1: a title block with an accent rule, then the feature panel ──
  const eyebrow = new TextBlock('GETTING STARTED');
  eyebrow.fontName = HEADING;
  eyebrow.fontSize = 9;
  eyebrow.letterSpacing = 1.5;
  eyebrow.color = ColorPalette.indigo[600];

  const h1 = new Heading('Hello, Document API!');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = HEADING;
  h1.fontSize = 28;
  h1.color = ColorPalette.slate[900];

  const titleStack = new VerticalStack();
  titleStack.spacing = 6;
  titleStack.add(eyebrow);
  titleStack.add(h1);
  titleStack.add(
    new TextBlock(
      'Headings, text, a list, a table and a QR code across three pages, written with the high-level Document API.'
    )
  );

  const titleBlock = new Container();
  titleBlock.border = new Border(4, 0, 0, 0);
  titleBlock.borderColors = new BorderColors(ColorPalette.indigo[500]);
  titleBlock.padding = new Thickness(16, 2, 0, 2);
  titleBlock.margin = new Thickness(0, 0, 0, 24);
  titleBlock.child = titleStack;
  doc.add(titleBlock);

  const keyFeatures = new Heading('Key features');
  keyFeatures.tocIdentifier = 'features';
  keyFeatures.level = 2;
  keyFeatures.fontName = HEADING;
  keyFeatures.fontSize = 14;
  keyFeatures.color = ColorPalette.indigo[900];

  const features = new UnorderedList();
  features.fontSize = 11;
  features.itemSpacing = 3;
  features.bulletColor = ColorPalette.indigo[500];
  for (const item of [
    'Simple, intuitive API',
    'Built-in metadata support',
    'Configurable zoom levels',
    'Viewer preferences',
    'Automatic page management',
  ]) {
    features.addItem(item);
  }

  const featureStack = new VerticalStack();
  featureStack.spacing = 8;
  featureStack.add(keyFeatures);
  featureStack.add(features);

  const featurePanel = new Container();
  featurePanel.backgroundColor = ColorPalette.indigo[50];
  featurePanel.cornerRadius = 8;
  featurePanel.padding = new Thickness(16);
  featurePanel.margin = new Thickness(0, 0, 0, 20);
  featurePanel.child = featureStack;
  doc.add(featurePanel);

  const accessibilityNote = new TextBlock(
    'Existing elements (Heading, TextBlock, UnorderedList, Image, QRCode) tag themselves automatically - no semantic verbs required.'
  );
  accessibilityNote.margin = new Thickness(0, 0, 0, 20);
  doc.add(accessibilityNote);

  // ── The QR code beside its explanation: a weighted row, 1 part code to 4 parts text ──
  const qr = new QRCode();
  qr.data = 'https://bonniepdf.dev';
  qr.size = 90;
  qr.altText = 'QR code linking to https://bonniepdf.dev';

  const scan = new Heading('Scan to verify');
  scan.tocIdentifier = 'verify';
  scan.level = 2;
  scan.fontName = HEADING;
  scan.fontSize = 14;
  scan.color = ColorPalette.slate[900];

  const scanText = new TextBlock(
    'Point a phone camera at the code to open bonniepdf.dev. The code carries alt text, so a screen reader says where it leads.'
  );
  scanText.fontSize = 11;

  const scanStack = new VerticalStack();
  scanStack.spacing = 6;
  scanStack.add(scan);
  scanStack.add(scanText);

  const scanRow = new HorizontalStack();
  scanRow.spacing = 18;
  scanRow.widthDistribution = WidthDistribution.Weighted;
  scanRow.add(qr, 1);
  scanRow.add(scanStack, 4);
  doc.add(scanRow);

  // ── Page 2 ──
  doc.addPage();
  const page2 = new Heading('Page 2: Summary table');
  page2.tocIdentifier = 'page2';
  page2.level = 1;
  page2.fontName = HEADING;
  page2.fontSize = 20;
  page2.color = ColorPalette.slate[900];
  page2.margin = new Thickness(0, 0, 0, 12);
  doc.add(page2);
  const intro = new TextBlock('This demonstrates multipage support with automatic page management.');
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  const header = (text: string): TextBlock => {
    const cell = new TextBlock(text);
    cell.fontName = HEADING;
    cell.fontSize = 10;
    return cell;
  };
  const body = (text: string, color?: Color): TextBlock => {
    const cell = new TextBlock(text);
    cell.fontSize = 10;
    if (color) cell.color = color;
    return cell;
  };

  const table = new Table(160, 160, 175);
  table.headerBackgroundColor = ColorPalette.indigo[700];
  table.headerTextColor = Color.white;
  table.addHeader(header('Component'), header('Runtime'), header('Status'));
  for (const [component, runtime] of [
    ['Core Engine', '.NET / TypeScript'],
    ['Typography Engine', 'Embedded Fonts'],
    ['Vector Graphics', 'SVG / QR / Barcode'],
    ['Charts', 'Bar / Line / Pie'],
    ['Compliance', 'PDF/A / PDF/UA'],
  ]) {
    table.addRow(TableRow.fromElements(body(component), body(runtime), body('Available', ColorPalette.emerald[700])));
  }
  doc.add(table);

  const flowNote = new TextBlock(
    'Content flows onto new pages by itself as the document grows. Start a page yourself only when you want a break on purpose, as before this page and before the square card that follows.'
  );
  flowNote.fontSize = 11;
  const flowPanel = new Container();
  flowPanel.backgroundColor = ColorPalette.slate[100];
  flowPanel.cornerRadius = 8;
  flowPanel.padding = new Thickness(14);
  flowPanel.margin = new Thickness(0, 20, 0, 0);
  flowPanel.child = flowNote;
  doc.add(flowPanel);

  // ── Page 3 - custom square: a card that fills the page body ──
  const squareSize = new PdfSize(300, 300, 'Square Card');
  doc.addPage(squareSize);

  const p3title = new Heading(`Page 3: ${squareSize.name}`);
  p3title.tocIdentifier = 'square';
  p3title.level = 1;
  p3title.fontName = HEADING;
  p3title.fontSize = 18;
  p3title.color = Color.white;
  p3title.alignment = TextAlignment.Center;

  const p3sub = new TextBlock(`${squareSize.width}pt × ${squareSize.height}pt`);
  p3sub.alignment = TextAlignment.Center;
  p3sub.color = ColorPalette.indigo[100];

  const cardStack = new VerticalStack();
  cardStack.spacing = 6;
  cardStack.add(p3title);
  cardStack.add(p3sub);

  const card = new Container();
  card.fillHeight = true;
  card.backgroundColor = ColorPalette.indigo[600];
  card.cornerRadius = 12;
  card.padding = new Thickness(20);
  card.verticalAlignment = VerticalAlignment.Center;
  card.child = cardStack;
  doc.add(card);

  return doc;
}
