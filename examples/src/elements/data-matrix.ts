import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  HorizontalStack,
  VerticalStack,
  Container,
  Line,
  DataMatrix,
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

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Data Matrix';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Title ──
  const title = new TextBlock('Data Matrix Generator');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  const intro = new TextBlock(
    'BonniePDF includes a native, vector-based Data Matrix (ECC200) element implementing a full ISO/IEC ' +
      '16022 encoder: automatic encodation across ASCII, C40, Text, X12, EDIFACT and Base-256 schemes, ' +
      'interleaved Reed-Solomon error correction, and both square and rectangular symbols. Because it draws ' +
      'vector shapes rather than a bitmap, every symbol is razor-sharp at any zoom and barely adds to the file size.'
  );
  intro.margin = new Thickness(0, 0, 0, 20);
  doc.add(intro);

  // ── Section 1: Basic symbol ──
  const basicHeader = new TextBlock('Basic Data Matrix');
  basicHeader.fontName = StandardFonts.HelveticaBold;
  basicHeader.fontSize = 16;
  basicHeader.textColor = ColorPalette.indigo[600];
  basicHeader.margin = new Thickness(0, 0, 0, 10);
  doc.add(basicHeader);

  const basicRow = new HorizontalStack();
  basicRow.spacing = 20;
  basicRow.widthDistribution = WidthDistribution.Weighted;

  const basicDm = new DataMatrix();
  basicDm.data = 'https://www.bonniepdf.dev';
  basicDm.size = 120;
  basicDm.quietZone = 2;
  basicDm.altText = 'Data Matrix linking to https://www.bonniepdf.dev';

  const basicWrap = new Container();
  basicWrap.padding = new Thickness(10);
  basicWrap.child = basicDm;
  basicRow.addChild(basicWrap, 1);

  const basicDetails = new VerticalStack();
  for (const [text, bold, mb] of [
    ['A simple square symbol', true, 8],
    ['Size: 120pt', false, 4],
    ['Quiet Zone: 2 modules', false, 4],
    ['Encodation: chosen automatically', false, 4],
    ['Data: https://www.bonniepdf.dev', false, 0],
  ] as [string, boolean, number][]) {
    const t = new TextBlock(text);
    t.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    if (mb) t.margin = new Thickness(0, 0, 0, mb);
    basicDetails.addChild(t);
  }
  basicRow.addChild(basicDetails, 2);
  doc.add(basicRow);

  const basicDivider = new Line();
  basicDivider.color = ColorPalette.slate[200];
  basicDivider.thickness = 1;
  basicDivider.margin = new Thickness(0, 20, 0, 20);
  doc.add(basicDivider);

  // ── Section 2: Encodation schemes ──
  const encHeader = new TextBlock('Automatic Encodation');
  encHeader.fontName = StandardFonts.HelveticaBold;
  encHeader.fontSize = 16;
  encHeader.textColor = ColorPalette.indigo[600];
  encHeader.margin = new Thickness(0, 0, 0, 10);
  doc.add(encHeader);

  const encIntro = new TextBlock(
    'The encoder analyses the message and selects the most compact scheme automatically - numeric, ' +
      'alphanumeric, structured, or raw bytes for Unicode - so dense data still fits a small symbol.'
  );
  encIntro.margin = new Thickness(0, 0, 0, 15);
  doc.add(encIntro);

  const encRow = new HorizontalStack();
  encRow.spacing = 15;
  encRow.widthDistribution = WidthDistribution.Equal;

  for (const [data, label, detail] of [
    ['0123456789012345', 'Numeric', 'Digit pairs'],
    ['SHIP-LABEL-A7', 'Alphanumeric', 'Text scheme'],
    ['ABCDEF1234', 'Structured', 'X12 / EDIFACT'],
    ['café · 日本語', 'Unicode', 'Base-256 (UTF-8)'],
  ] as [string, string, string][]) {
    const dm = new DataMatrix();
    dm.data = data;
    dm.size = 95;
    dm.quietZone = 2;
    dm.altText = `Data Matrix encoding ${data}`;

    const dmWrap = new Container();
    dmWrap.backgroundColor = ColorPalette.slate[50];
    dmWrap.border = new Border(1);
    dmWrap.borderColors = new BorderColors(ColorPalette.slate[200]);
    dmWrap.padding = new Thickness(10);
    dmWrap.child = dm;

    const labelBlock = new TextBlock(label);
    labelBlock.fontName = StandardFonts.HelveticaBold;
    labelBlock.alignment = TextAlignment.Center;
    labelBlock.margin = new Thickness(0, 8, 0, 0);

    const detailBlock = new TextBlock(detail);
    detailBlock.fontSize = 9;
    detailBlock.textColor = ColorPalette.slate[500];
    detailBlock.alignment = TextAlignment.Center;

    const dataBlock = new TextBlock(data);
    dataBlock.fontSize = 8;
    dataBlock.textColor = ColorPalette.slate[400];
    dataBlock.alignment = TextAlignment.Center;
    dataBlock.margin = new Thickness(0, 4, 0, 0);

    const col = new VerticalStack();
    col.addChild(dmWrap);
    col.addChild(labelBlock);
    col.addChild(detailBlock);
    col.addChild(dataBlock);
    encRow.addChild(col);
  }
  doc.add(encRow);

  const encDivider = new Line();
  encDivider.color = ColorPalette.slate[200];
  encDivider.thickness = 1;
  encDivider.margin = new Thickness(0, 20, 0, 20);
  doc.add(encDivider);

  // ── Section 3: Rectangular symbols ──
  const rectHeader = new TextBlock('Rectangular Symbols');
  rectHeader.fontName = StandardFonts.HelveticaBold;
  rectHeader.fontSize = 16;
  rectHeader.textColor = ColorPalette.indigo[600];
  rectHeader.margin = new Thickness(0, 0, 0, 10);
  doc.add(rectHeader);

  const rectIntro = new TextBlock(
    'Unlike QR codes, Data Matrix supports rectangular symbols - handy for marking long, narrow parts ' +
      'and labels. Set `rectangular = true` and a short message will use the most compact rectangular size.'
  );
  rectIntro.margin = new Thickness(0, 0, 0, 15);
  doc.add(rectIntro);

  const rectRow = new HorizontalStack();
  rectRow.spacing = 20;
  rectRow.widthDistribution = WidthDistribution.Equal;

  for (const [data, label] of [
    ['12345', '18 × 8'],
    ['PART-99A', '32 × 8'],
    ['LOT 2026-06', '26 × 12'],
  ] as [string, string][]) {
    const dm = new DataMatrix();
    dm.data = data;
    dm.rectangular = true;
    dm.size = 140;
    dm.quietZone = 2;
    dm.altText = `Rectangular Data Matrix encoding ${data}`;

    const wrap = new Container();
    wrap.border = new Border(1);
    wrap.borderColors = new BorderColors(ColorPalette.slate[200]);
    wrap.padding = new Thickness(10);
    wrap.child = dm;

    const labelBlock = new TextBlock(label);
    labelBlock.fontName = StandardFonts.HelveticaBold;
    labelBlock.alignment = TextAlignment.Center;
    labelBlock.margin = new Thickness(0, 8, 0, 0);

    const dataBlock = new TextBlock(data);
    dataBlock.fontSize = 9;
    dataBlock.textColor = ColorPalette.slate[500];
    dataBlock.alignment = TextAlignment.Center;

    const col = new VerticalStack();
    col.addChild(wrap);
    col.addChild(labelBlock);
    col.addChild(dataBlock);
    rectRow.addChild(col);
  }
  doc.add(rectRow);

  const rectDivider = new Line();
  rectDivider.color = ColorPalette.slate[200];
  rectDivider.thickness = 1;
  rectDivider.margin = new Thickness(0, 20, 0, 20);
  doc.add(rectDivider);

  // ── Section 4: Colours ──
  const colorsHeader = new TextBlock('Colours & Backgrounds');
  colorsHeader.fontName = StandardFonts.HelveticaBold;
  colorsHeader.fontSize = 16;
  colorsHeader.textColor = ColorPalette.indigo[600];
  colorsHeader.margin = new Thickness(0, 0, 0, 10);
  doc.add(colorsHeader);

  const colorRow = new HorizontalStack();
  colorRow.spacing = 20;
  colorRow.widthDistribution = WidthDistribution.Equal;

  const palette: [string, string, Color, Color | undefined, Color][] = [
    ['Custom Foreground', 'ID-7782', ColorPalette.blue[700], undefined, ColorPalette.blue[200]],
    ['Custom Background', 'BATCH-44', ColorPalette.rose[900], ColorPalette.rose[50], ColorPalette.rose[200]],
    ['High Contrast', 'A-1029', ColorPalette.slate[900], ColorPalette.amber[100], ColorPalette.amber[300]],
  ];

  for (const [titleText, data, fg, bg, borderColor] of palette) {
    const dm = new DataMatrix();
    dm.data = data;
    dm.size = 120;
    dm.quietZone = 2;
    dm.foregroundColor = fg;
    if (bg) dm.backgroundColor = bg;
    dm.altText = `Data Matrix encoding ${data}`;

    const wrap = new Container();
    if (bg) wrap.backgroundColor = bg;
    wrap.border = new Border(1);
    wrap.borderColors = new BorderColors(borderColor);
    wrap.padding = new Thickness(10);
    wrap.child = dm;

    const titleBlock = new TextBlock(titleText);
    titleBlock.fontName = StandardFonts.HelveticaBold;
    titleBlock.alignment = TextAlignment.Center;
    titleBlock.margin = new Thickness(0, 8, 0, 0);

    const dataBlock = new TextBlock(data);
    dataBlock.fontSize = 9;
    dataBlock.textColor = ColorPalette.slate[500];
    dataBlock.alignment = TextAlignment.Center;

    const col = new VerticalStack();
    col.addChild(wrap);
    col.addChild(titleBlock);
    col.addChild(dataBlock);
    colorRow.addChild(col);
  }
  doc.add(colorRow);

  return doc;
}
