import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  TextBlock,
  TextStyle,
  HorizontalStack,
  VerticalStack,
  Container,
  Spacer,
  Line,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
} from '@bonniepdf/core';

function sectionHeader(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 14;
  b.textColor = Color.indigo600;
  b.margin = new Thickness(0, 12, 0, 6);
  return b;
}

function card(title: string, description: string, accent: Color, bg: Color): Container {
  const stack = new VerticalStack();

  const t = new TextBlock(title);
  t.fontName = StandardFonts.HelveticaBold;
  t.fontSize = 14;
  t.textColor = accent;
  t.margin = new Thickness(0, 0, 0, 6);
  stack.addChild(t);

  const d = new TextBlock(description);
  d.fontName = StandardFonts.Helvetica;
  d.fontSize = 10;
  d.textColor = Color.slate600;
  stack.addChild(d);

  const c = new Container();
  c.backgroundColor = bg;
  c.border = new Border(1);
  c.borderColors = new BorderColors(accent);
  c.cornerRadius = 10;
  c.padding = new Thickness(14);
  c.child = stack;
  return c;
}

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Rounded Rectangles';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // ── Title ──
  const title = new TextBlock('Rounded Rectangles');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  // ── Section 1: Basic rounded containers ──
  doc.add(sectionHeader('Basic Rounded Containers'));

  const box1Text = new TextBlock('A container with 8pt corner radius and a light blue background.');
  box1Text.fontName = StandardFonts.Helvetica;
  box1Text.fontSize = 12;
  box1Text.textColor = Color.blue800;
  const box1 = new Container();
  box1.backgroundColor = Color.blue50;
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
  box2Text.textColor = Color.green800;
  const box2 = new Container();
  box2.backgroundColor = Color.green50;
  box2.cornerRadius = 16;
  box2.padding = new Thickness(20);
  box2.margin = new Thickness(0, 0, 0, 12);
  box2.child = box2Text;
  doc.add(box2);

  // ── Section 2: Rounded borders ──
  doc.add(sectionHeader('Rounded Borders'));

  const strokeText = new TextBlock('A rounded border with no background fill. The stroke follows the curved path.');
  strokeText.fontName = StandardFonts.Helvetica;
  strokeText.fontSize = 12;
  strokeText.textColor = Color.slate700;
  const strokeBox = new Container();
  strokeBox.border = new Border(2);
  strokeBox.borderColors = new BorderColors(Color.indigo500);
  strokeBox.cornerRadius = 10;
  strokeBox.padding = new Thickness(16);
  strokeBox.margin = new Thickness(0, 0, 0, 12);
  strokeBox.child = strokeText;
  doc.add(strokeBox);

  const alertText = new TextBlock(
    'Rounded border combined with a background fill — great for alert boxes and callouts.'
  );
  alertText.fontName = StandardFonts.Helvetica;
  alertText.fontSize = 12;
  alertText.textColor = Color.fromHex('#92400e');
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
  doc.add(sectionHeader('Card Layout'));

  const cardRow = new HorizontalStack();
  cardRow.widthDistribution = WidthDistribution.Weighted;
  cardRow.spacing = 12;
  cardRow.margin = new Thickness(0, 0, 0, 12);
  cardRow.addChild(
    card('Feature A', 'Rounded corners make UI elements feel modern and approachable.', Color.blue500, Color.blue50),
    1
  );
  cardRow.addChild(
    card(
      'Feature B',
      'Bezier curves approximate perfect quarter-circle arcs.',
      Color.purple500,
      Color.fromHex('#faf5ff')
    ),
    1
  );
  cardRow.addChild(
    card('Feature C', 'Works with backgrounds, borders, or both combined.', Color.teal500, Color.fromHex('#f0fdfa')),
    1
  );
  doc.add(cardRow);

  // ── Section 4: Radius comparison ──
  doc.add(sectionHeader('Radius Comparison'));

  for (const r of [0, 4, 8, 12, 20, 30]) {
    const label = r === 0 ? 'CornerRadius = 0 (sharp corners, default)' : `CornerRadius = ${r}`;
    const t = new TextBlock(label);
    t.fontName = StandardFonts.Helvetica;
    t.fontSize = 11;
    t.textColor = Color.slate700;
    const c = new Container();
    c.backgroundColor = Color.slate100;
    c.border = new Border(1);
    c.borderColors = new BorderColors(Color.slate400);
    c.cornerRadius = r;
    c.padding = new Thickness(12, 8, 12, 8);
    c.margin = new Thickness(0, 0, 0, 6);
    c.child = t;
    doc.add(c);
  }

  // ── Section 5: Practical banners ──
  doc.add(new Spacer(16));
  const divider = new Line();
  divider.color = Color.slate300;
  divider.thickness = 1;
  doc.add(divider);
  doc.add(sectionHeader('Practical Examples'));

  const banners: [string, string, string, string, boolean][] = [
    ['Success! Your document has been generated successfully.', '#dcfce7', '', '', false],
    ['Warning: Please review the document before sending.', '#fef9c3', '#ca8a04', '', false],
    ['Error: Unable to process the request. Please try again.', '#fee2e2', '#991b1b', '#991b1b', true],
    ['Info: Rounded corners are built from four Bezier arcs using k=0.5523.', '#dbeafe', '', '', false],
  ];

  const bannerAccents: string[] = ['', '#ca8a04', '#991b1b', ''];
  const bannerBorders = [Color.green600, Color.fromHex('#ca8a04'), Color.fromHex('#991b1b'), Color.blue600];
  const bannerTexts = [Color.green800, Color.fromHex('#854d0e'), Color.fromHex('#991b1b'), Color.blue800];
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
    t.textColor = bannerTexts[i];
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
