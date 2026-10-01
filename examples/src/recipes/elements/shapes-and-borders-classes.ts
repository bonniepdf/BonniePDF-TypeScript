import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  TextBlock,
  TextStyle,
  HorizontalStack,
  VerticalStack,
  Container,
  Line,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `shapes-and-borders.ts`.
 *
 * Same rounded-rectangle tour - corner radius, rounded borders, cards, radius
 * comparison, banner callouts - authored the long way: `new` each element and
 * assign properties, using `Border`/`BorderColors`, `Thickness`, `Color` and
 * `ColorPalette` directly. This is the escape hatch the options-object front
 * door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `shapes-and-borders.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Rounded Rectangles';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Title ──
  const title = new TextBlock('Rounded Rectangles');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  // ── Section 1: Basic rounded containers ──
  const basicHeader = new TextBlock('Basic Rounded Containers');
  basicHeader.fontName = StandardFonts.HelveticaBold;
  basicHeader.fontSize = 14;
  basicHeader.color = ColorPalette.indigo[600];
  basicHeader.margin = new Thickness(0, 12, 0, 6);
  doc.add(basicHeader);

  const box1Text = new TextBlock('A container with 8pt corner radius and a light blue background.');
  box1Text.fontName = StandardFonts.Helvetica;
  box1Text.fontSize = 12;
  box1Text.color = ColorPalette.blue[800];
  const box1 = new Container();
  box1.backgroundColor = ColorPalette.blue[50];
  box1.cornerRadius = 8;
  box1.padding = new Thickness(16);
  box1.margin = new Thickness(0, 0, 0, 12);
  box1.child = box1Text;
  doc.add(box1);

  const box2Text = new TextBlock(
    'A container with a larger 16pt corner radius. The arcs become more pronounced as the radius increases.'
  );
  box2Text.fontName = StandardFonts.Helvetica;
  box2Text.fontSize = 12;
  box2Text.color = ColorPalette.green[800];
  const box2 = new Container();
  box2.backgroundColor = ColorPalette.green[50];
  box2.cornerRadius = 16;
  box2.padding = new Thickness(20);
  box2.margin = new Thickness(0, 0, 0, 12);
  box2.child = box2Text;
  doc.add(box2);

  // ── Section 2: Rounded borders ──
  const bordersHeader = new TextBlock('Rounded Borders');
  bordersHeader.fontName = StandardFonts.HelveticaBold;
  bordersHeader.fontSize = 14;
  bordersHeader.color = ColorPalette.indigo[600];
  bordersHeader.margin = new Thickness(0, 12, 0, 6);
  doc.add(bordersHeader);

  const strokeText = new TextBlock('A rounded border with no background fill. The stroke follows the curved path.');
  strokeText.fontName = StandardFonts.Helvetica;
  strokeText.fontSize = 12;
  strokeText.color = ColorPalette.slate[700];
  const strokeBox = new Container();
  strokeBox.border = new Border(2);
  strokeBox.borderColors = new BorderColors(ColorPalette.indigo[500]);
  strokeBox.cornerRadius = 10;
  strokeBox.padding = new Thickness(16);
  strokeBox.margin = new Thickness(0, 0, 0, 12);
  strokeBox.child = strokeText;
  doc.add(strokeBox);

  const alertText = new TextBlock(
    'Rounded border combined with a background fill - great for alert boxes and callouts.'
  );
  alertText.fontName = StandardFonts.Helvetica;
  alertText.fontSize = 12;
  alertText.color = Color.fromHex('#92400e');
  const alertBox = new Container();
  alertBox.backgroundColor = Color.fromHex('#fef3c7');
  alertBox.border = new Border(2);
  alertBox.borderColors = new BorderColors(Color.fromHex('#f59e0b'));
  alertBox.cornerRadius = 10;
  alertBox.padding = new Thickness(16);
  alertBox.margin = new Thickness(0, 0, 0, 12);
  alertBox.child = alertText;
  doc.add(alertBox);

  // ── Section 3: Card layout ──
  const cardHeader = new TextBlock('Card Layout');
  cardHeader.fontName = StandardFonts.HelveticaBold;
  cardHeader.fontSize = 14;
  cardHeader.color = ColorPalette.indigo[600];
  cardHeader.margin = new Thickness(0, 12, 0, 6);
  doc.add(cardHeader);

  const cardRow = new HorizontalStack();
  cardRow.widthDistribution = WidthDistribution.Weighted;
  cardRow.spacing = 12;
  cardRow.margin = new Thickness(0, 0, 0, 12);
  for (const [cardTitle, description, accent, bg] of [
    [
      'Feature A',
      'Rounded corners make UI elements feel modern and approachable.',
      ColorPalette.blue[600],
      ColorPalette.blue[50],
    ],
    [
      'Feature B',
      'Bezier curves approximate perfect quarter-circle arcs.',
      ColorPalette.purple[600],
      Color.fromHex('#faf5ff'),
    ],
    [
      'Feature C',
      'Works with backgrounds, borders, or both combined.',
      ColorPalette.teal[700],
      Color.fromHex('#f0fdfa'),
    ],
  ] as [string, string, Color, Color][]) {
    const stack = new VerticalStack();

    const t = new TextBlock(cardTitle);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 14;
    t.color = accent;
    t.margin = new Thickness(0, 0, 0, 6);
    stack.add(t);

    const d = new TextBlock(description);
    d.fontName = StandardFonts.Helvetica;
    d.fontSize = 10;
    d.color = ColorPalette.slate[600];
    stack.add(d);

    const c = new Container();
    c.backgroundColor = bg;
    c.border = new Border(1);
    c.borderColors = new BorderColors(accent);
    c.cornerRadius = 10;
    c.padding = new Thickness(14);
    c.child = stack;
    cardRow.add(c, 1);
  }
  doc.add(cardRow);

  // ── Section 4: Radius comparison ──
  const radiusHeader = new TextBlock('Radius Comparison');
  radiusHeader.fontName = StandardFonts.HelveticaBold;
  radiusHeader.fontSize = 14;
  radiusHeader.color = ColorPalette.indigo[600];
  radiusHeader.margin = new Thickness(0, 12, 0, 6);
  doc.add(radiusHeader);

  for (const r of [0, 4, 8, 12, 20, 30]) {
    const label = r === 0 ? 'CornerRadius = 0 (sharp corners, default)' : `CornerRadius = ${r}`;
    const t = new TextBlock(label);
    t.fontName = StandardFonts.Helvetica;
    t.fontSize = 11;
    t.color = ColorPalette.slate[700];
    const c = new Container();
    c.backgroundColor = ColorPalette.slate[100];
    c.border = new Border(1);
    c.borderColors = new BorderColors(ColorPalette.slate[400]);
    c.cornerRadius = r;
    c.padding = new Thickness(12, 8, 12, 8);
    c.margin = new Thickness(0, 0, 0, 6);
    c.child = t;
    doc.add(c);
  }

  // ── Section 5: Practical banners ──
  const divider = new Line();
  divider.color = ColorPalette.slate[300];
  divider.thickness = 1;
  divider.margin = new Thickness(0, 16, 0, 0);
  doc.add(divider);
  const practicalHeader = new TextBlock('Practical Examples');
  practicalHeader.fontName = StandardFonts.HelveticaBold;
  practicalHeader.fontSize = 14;
  practicalHeader.color = ColorPalette.indigo[600];
  practicalHeader.margin = new Thickness(0, 12, 0, 6);
  doc.add(practicalHeader);

  const bannerBorders = [
    ColorPalette.green[600],
    Color.fromHex('#ca8a04'),
    Color.fromHex('#991b1b'),
    ColorPalette.blue[600],
  ];
  const bannerTexts = [
    ColorPalette.green[800],
    Color.fromHex('#854d0e'),
    Color.fromHex('#991b1b'),
    ColorPalette.blue[800],
  ];
  const bannerBgs = ['#dcfce7', '#fef9c3', '#fee2e2', '#dbeafe'];
  const bannerMessages = [
    'Success! Your document has been generated successfully.',
    'Warning: Please review the document before sending.',
    'Error: Unable to process the request. Please try again.',
    'Info: Rounded corners are built from four Bezier arcs using k=0.5523.',
  ];
  const bannerBold = [true, true, true, false];

  for (let i = 0; i < 4; i++) {
    const t = new TextBlock(bannerMessages[i]);
    t.fontName = bannerBold[i] ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    t.fontSize = 12;
    t.color = bannerTexts[i];
    const c = new Container();
    c.backgroundColor = Color.fromHex(bannerBgs[i]);
    c.border = new Border(1);
    c.borderColors = new BorderColors(bannerBorders[i]);
    c.cornerRadius = 8;
    c.padding = new Thickness(16, 12, 16, 12);
    c.margin = new Thickness(0, 0, 0, 8);
    c.child = t;
    doc.add(c);
  }

  return doc;
}
