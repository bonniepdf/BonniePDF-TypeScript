import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  TextStyle,
  HorizontalStack,
  Container,
  Color,
  Thickness,
  StandardFonts,
  WidthDistribution,
  HorizontalAlignment,
  Placeholders,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const metadata = new DocumentMetadata();
  metadata.title = 'Horizontal Stack Example';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Title ──
  const title = new TextBlock('Horizontal Stack Examples');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 12);
  doc.add(title);

  // ── Equal width distribution ──
  const equalLabel = new TextBlock('Equal Width Distribution');
  equalLabel.fontName = StandardFonts.HelveticaBold;
  equalLabel.fontSize = 14;
  equalLabel.textColor = Color.slate700;
  equalLabel.margin = new Thickness(0, 0, 0, 8);
  doc.add(equalLabel);

  const equalStack = new HorizontalStack();
  equalStack.spacing = 10;
  equalStack.widthDistribution = WidthDistribution.Equal;
  for (const label of ['Item 1', 'Item 2', 'Item 3']) {
    const t = new TextBlock(label);
    t.textColor = Color.white;
    equalStack.addChild(t);
  }
  const equalWrap = new Container();
  equalWrap.child = equalStack;
  equalWrap.padding = new Thickness(10);
  equalWrap.backgroundColor = Color.slate200;
  doc.add(equalWrap);

  // ── Weighted distribution ──
  const weightedLabel = new TextBlock('Weighted Width Distribution (1:2:3 ratio)');
  weightedLabel.fontName = StandardFonts.HelveticaBold;
  weightedLabel.fontSize = 14;
  weightedLabel.textColor = Color.slate700;
  weightedLabel.margin = new Thickness(0, 16, 0, 8);
  doc.add(weightedLabel);

  const weightedStack = new HorizontalStack();
  weightedStack.spacing = 10;
  weightedStack.widthDistribution = WidthDistribution.Weighted;
  for (const [label, weight] of [
    ['25%', 1],
    ['50%', 2],
    ['75%', 3],
  ] as [string, number][]) {
    const t = new TextBlock(label);
    t.textColor = Color.white;
    weightedStack.addChild(t, weight);
  }
  const weightedWrap = new Container();
  weightedWrap.child = weightedStack;
  weightedWrap.padding = new Thickness(10);
  weightedWrap.backgroundColor = Color.slate200;
  doc.add(weightedWrap);

  // ── Centre vertical alignment ──
  const centerLabel = new TextBlock('Center Vertical Alignment');
  centerLabel.fontName = StandardFonts.HelveticaBold;
  centerLabel.fontSize = 14;
  centerLabel.textColor = Color.slate700;
  centerLabel.margin = new Thickness(0, 16, 0, 8);
  doc.add(centerLabel);

  const centerStack = new HorizontalStack();
  centerStack.spacing = 10;
  centerStack.alignment = HorizontalAlignment.Center;
  centerStack.widthDistribution = WidthDistribution.Equal;
  centerStack.height = 160;
  for (const [text, size] of [
    ['Small', 10],
    ['Medium\n(2 lines)', 12],
    ['Large\n(3 lines)\nof text', 14],
  ] as [string, number][]) {
    const t = new TextBlock(text);
    t.fontSize = size;
    centerStack.addChild(t);
  }
  doc.add(centerStack);

  // ── Coloured containers ──
  const colorLabel = new TextBlock('Colored Containers');
  colorLabel.fontName = StandardFonts.HelveticaBold;
  colorLabel.fontSize = 14;
  colorLabel.textColor = Color.slate700;
  colorLabel.margin = new Thickness(0, 16, 0, 8);
  doc.add(colorLabel);

  const colorStack = new HorizontalStack();
  colorStack.spacing = 5;
  colorStack.widthDistribution = WidthDistribution.Equal;
  for (const [label, bg] of [
    ['Red', Color.red],
    ['Green', Color.green600],
    ['Blue', Color.blue],
  ] as [string, Color][]) {
    const t = new TextBlock(label);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 14;
    t.textColor = Color.white;
    const c = new Container();
    c.child = t;
    c.padding = new Thickness(15);
    c.backgroundColor = bg;
    colorStack.addChild(c);
  }
  doc.add(colorStack);

  // ── Practical examples ──
  const practicalTitle = new TextBlock('Practical Examples');
  practicalTitle.fontName = StandardFonts.HelveticaBold;
  practicalTitle.fontSize = 24;
  practicalTitle.textColor = Color.slate800;
  practicalTitle.margin = new Thickness(0, 24, 0, 12);
  doc.add(practicalTitle);

  // Key-value pairs
  const kvLabel = new TextBlock('Key-Value Pairs');
  kvLabel.fontName = StandardFonts.HelveticaBold;
  kvLabel.fontSize = 14;
  kvLabel.textColor = Color.slate700;
  kvLabel.margin = new Thickness(0, 0, 0, 8);
  doc.add(kvLabel);

  const kvSource = Placeholders.withSeed(300);
  for (const [key, value, topMargin] of [
    ['Name:', kvSource.name(), false],
    ['Email:', kvSource.email(), true],
  ] as [string, string, boolean][]) {
    const kv = new HorizontalStack();
    kv.spacing = 10;
    kv.widthDistribution = WidthDistribution.Weighted;
    if (topMargin) kv.margin = new Thickness(0, 8, 0, 0);
    const k = new TextBlock(key);
    k.fontName = StandardFonts.HelveticaBold;
    const v = new TextBlock(value);
    v.textColor = Color.slate800;
    kv.addChild(k, 1);
    kv.addChild(v, 3);
    doc.add(kv);
  }

  // Progress bar
  const progressLabel = new TextBlock('Progress Bar Style');
  progressLabel.fontName = StandardFonts.HelveticaBold;
  progressLabel.fontSize = 14;
  progressLabel.textColor = Color.slate700;
  progressLabel.margin = new Thickness(0, 16, 0, 8);
  doc.add(progressLabel);

  const progressBar = new HorizontalStack();
  progressBar.spacing = 0;
  progressBar.widthDistribution = WidthDistribution.Weighted;

  const filledText = new TextBlock('75%');
  filledText.fontName = StandardFonts.HelveticaBold;
  filledText.textColor = Color.white;
  const filled = new Container();
  filled.child = filledText;
  filled.padding = new Thickness(10, 5, 10, 5);
  filled.backgroundColor = Color.green600;
  filled.height = 24;
  progressBar.addChild(filled, 75);

  const empty = new Container();
  empty.padding = new Thickness(10, 5, 10, 5);
  empty.backgroundColor = Color.slate300;
  empty.height = 24;
  progressBar.addChild(empty, 25);
  doc.add(progressBar);

  // Badge style
  const badgeLabel = new TextBlock('Badge Style Layout');
  badgeLabel.fontName = StandardFonts.HelveticaBold;
  badgeLabel.fontSize = 14;
  badgeLabel.textColor = Color.slate700;
  badgeLabel.margin = new Thickness(0, 16, 0, 8);
  doc.add(badgeLabel);

  const badgeStack = new HorizontalStack();
  badgeStack.spacing = 10;
  badgeStack.alignment = HorizontalAlignment.Center;

  const statusText = new TextBlock('Status:');
  badgeStack.addChild(statusText);

  for (const [label, bg] of [
    ['Active', Color.green600],
    ['Verified', Color.blue],
  ] as [string, Color][]) {
    const t = new TextBlock(label);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 11;
    t.textColor = Color.white;
    const c = new Container();
    c.child = t;
    c.padding = new Thickness(8, 4, 8, 4);
    c.backgroundColor = bg;
    badgeStack.addChild(c);
  }
  doc.add(badgeStack);

  return doc;
}
