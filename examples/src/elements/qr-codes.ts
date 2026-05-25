import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  TextBlock,
  TextStyle,
  TextAlignment,
  HorizontalStack,
  VerticalStack,
  Container,
  Line,
  QRCode,
  QrEcc,
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
  b.fontSize = 16;
  b.textColor = Color.indigo600;
  b.margin = new Thickness(0, 0, 0, 10);
  return b;
}

function divider(): Line {
  const l = new Line();
  l.color = Color.slate200;
  l.thickness = 1;
  l.margin = new Thickness(0, 20, 0, 20);
  return l;
}

function qrCard(data: string, size: number, ecc: QrEcc, eccLabel: string, eccDetail: string): VerticalStack {
  const qr = new QRCode();
  qr.data = data;
  qr.size = size;
  qr.errorCorrection = ecc;
  qr.quietZone = 1;

  const qrWrap = new Container();
  qrWrap.backgroundColor = Color.slate50;
  qrWrap.border = new Border(1);
  qrWrap.borderColors = new BorderColors(Color.slate200);
  qrWrap.padding = new Thickness(10);
  qrWrap.child = qr;

  const label = new TextBlock(eccLabel);
  label.fontName = StandardFonts.HelveticaBold;
  label.alignment = TextAlignment.Center;
  label.margin = new Thickness(0, 8, 0, 0);

  const detail = new TextBlock(eccDetail);
  detail.fontSize = 9;
  detail.textColor = Color.slate500;
  detail.alignment = TextAlignment.Center;

  const url = new TextBlock(data);
  url.fontSize = 8;
  url.textColor = Color.slate400;
  url.alignment = TextAlignment.Center;
  url.margin = new Thickness(0, 4, 0, 0);

  const col = new VerticalStack();
  col.addChild(qrWrap);
  col.addChild(label);
  col.addChild(detail);
  col.addChild(url);
  return col;
}

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'QR Codes';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // ── Title ──
  const title = new TextBlock('QR Code Generator');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  const intro = new TextBlock(
    'BonniePDF provides a native, high-performance, vector-based QR Code element that implements ' +
      'a full ISO/IEC 18004 compliant encoder. Because it produces vector shapes rather than bitmaps, ' +
      'the generated codes are razor-sharp at any zoom level and keep the PDF file size extremely small.'
  );
  intro.margin = new Thickness(0, 0, 0, 20);
  doc.add(intro);

  // ── Section 1: Basic QR Code ──
  doc.add(sectionHeader('Basic QR Code'));

  const basicRow = new HorizontalStack();
  basicRow.spacing = 20;
  basicRow.widthDistribution = WidthDistribution.Weighted;

  const basicQr = new QRCode();
  basicQr.data = 'https://bonniepdf.com';
  basicQr.size = 130;
  basicQr.quietZone = 2;

  const basicQrWrap = new Container();
  basicQrWrap.padding = new Thickness(10);
  basicQrWrap.child = basicQr;
  basicRow.addChild(basicQrWrap, 1);

  const basicDetails = new VerticalStack();
  for (const [text, bold, mb] of [
    ['A simple QR Code', true, 8],
    ['Size: 130pt', false, 4],
    ['Quiet Zone: 2 modules', false, 4],
    ['Error Correction: Medium (default)', false, 4],
    ['Data: https://bonniepdf.com', false, 0],
  ] as [string, boolean, number][]) {
    const t = new TextBlock(text);
    t.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    if (mb) t.margin = new Thickness(0, 0, 0, mb);
    basicDetails.addChild(t);
  }
  basicRow.addChild(basicDetails, 2);
  doc.add(basicRow);

  doc.add(divider());

  // ── Section 2: Error correction levels ──
  doc.add(sectionHeader('Error Correction Levels'));

  const eccIntro = new TextBlock(
    'Higher error correction levels provide more redundancy at the cost of denser modules and ' +
      'reduced data capacity. They are useful if the code might be damaged or if you intend to overlay a logo.'
  );
  eccIntro.margin = new Thickness(0, 0, 0, 15);
  doc.add(eccIntro);

  const eccRow = new HorizontalStack();
  eccRow.spacing = 15;
  eccRow.widthDistribution = WidthDistribution.Equal;

  const urlData = 'https://github.com/bonniepdf';
  eccRow.addChild(qrCard(urlData, 100, QrEcc.Low, 'Low', '~7% restoration'));
  eccRow.addChild(qrCard(urlData, 100, QrEcc.Medium, 'Medium', '~15% restoration'));
  eccRow.addChild(qrCard(urlData, 100, QrEcc.Quartile, 'Quartile', '~25% restoration'));
  eccRow.addChild(qrCard(urlData, 100, QrEcc.High, 'High', '~30% restoration'));
  doc.add(eccRow);

  doc.add(divider());

  // ── Section 3: Colors & backgrounds ──
  doc.add(sectionHeader('Colors & Backgrounds'));

  const colorRow = new HorizontalStack();
  colorRow.spacing = 20;
  colorRow.widthDistribution = WidthDistribution.Equal;

  // Custom foreground
  const fgCol = new VerticalStack();
  const fgTitle = new TextBlock('Custom Foreground');
  fgTitle.fontName = StandardFonts.HelveticaBold;
  fgTitle.margin = new Thickness(0, 0, 0, 8);
  fgCol.addChild(fgTitle);
  const fgQr = new QRCode();
  fgQr.data = 'tel:+1234567890';
  fgQr.size = 120;
  fgQr.foregroundColor = Color.blue700;
  fgQr.quietZone = 2;
  const fgWrap = new Container();
  fgWrap.border = new Border(1);
  fgWrap.borderColors = new BorderColors(Color.blue200);
  fgWrap.padding = new Thickness(10);
  fgWrap.child = fgQr;
  fgCol.addChild(fgWrap);
  const fgLabel = new TextBlock('tel:+1234567890');
  fgLabel.fontSize = 9;
  fgLabel.textColor = Color.slate500;
  fgLabel.alignment = TextAlignment.Center;
  fgLabel.margin = new Thickness(0, 8, 0, 0);
  fgCol.addChild(fgLabel);
  colorRow.addChild(fgCol);

  // Custom background
  const bgCol = new VerticalStack();
  const bgTitle = new TextBlock('Custom Background');
  bgTitle.fontName = StandardFonts.HelveticaBold;
  bgTitle.margin = new Thickness(0, 0, 0, 8);
  bgCol.addChild(bgTitle);
  const bgQr = new QRCode();
  bgQr.data = 'mailto:hello@example.com';
  bgQr.size = 120;
  bgQr.foregroundColor = Color.rose900;
  bgQr.backgroundColor = Color.rose50;
  bgQr.quietZone = 2;
  const bgWrap = new Container();
  bgWrap.border = new Border(1);
  bgWrap.borderColors = new BorderColors(Color.rose200);
  bgWrap.padding = new Thickness(10);
  bgWrap.child = bgQr;
  bgCol.addChild(bgWrap);
  const bgLabel = new TextBlock('mailto:hello@example.com');
  bgLabel.fontSize = 9;
  bgLabel.textColor = Color.slate500;
  bgLabel.alignment = TextAlignment.Center;
  bgLabel.margin = new Thickness(0, 8, 0, 0);
  bgCol.addChild(bgLabel);
  colorRow.addChild(bgCol);

  // Transparent background (container shows through)
  const transCol = new VerticalStack();
  const transTitle = new TextBlock('Transparent Background');
  transTitle.fontName = StandardFonts.HelveticaBold;
  transTitle.margin = new Thickness(0, 0, 0, 8);
  transCol.addChild(transTitle);
  const transQr = new QRCode();
  transQr.data = 'WIFI:S:MyNetwork;T:WPA;P:password;;';
  transQr.size = 120;
  transQr.foregroundColor = Color.amber900;
  transQr.drawBackground = false;
  transQr.quietZone = 2;
  const transWrap = new Container();
  transWrap.backgroundColor = Color.amber100;
  transWrap.border = new Border(1);
  transWrap.borderColors = new BorderColors(Color.amber300);
  transWrap.padding = new Thickness(10);
  transWrap.child = transQr;
  transCol.addChild(transWrap);
  const transLabel = new TextBlock('WIFI:S:MyNetwork;...');
  transLabel.fontSize = 9;
  transLabel.textColor = Color.slate500;
  transLabel.alignment = TextAlignment.Center;
  transLabel.margin = new Thickness(0, 8, 0, 0);
  transCol.addChild(transLabel);
  colorRow.addChild(transCol);

  doc.add(colorRow);

  return doc;
}
