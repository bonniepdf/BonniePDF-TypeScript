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
  QRCode,
  QrEcc,
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
 * The **class / construct-then-mutate** companion to `qr-codes.ts`.
 *
 * Same native vector-QR tour - basic code, error-correction levels, custom
 * colours/backgrounds - authored the long way: `new QRCode()` then assign
 * properties, using the `QrEcc` enum, `Border`/`BorderColors`, `TextAlignment`,
 * `TextStyle`, `Thickness` and `ColorPalette` directly. This is the escape
 * hatch the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style `qr-codes.ts`
 * (an equivalence test binds the two). Reach for the options form first; this
 * variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'QR Codes';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Title ──
  const title = new TextBlock('QR Code Generator');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
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
  const basicHeader = new TextBlock('Basic QR Code');
  basicHeader.fontName = StandardFonts.HelveticaBold;
  basicHeader.fontSize = 16;
  basicHeader.textColor = ColorPalette.indigo[600];
  basicHeader.margin = new Thickness(0, 0, 0, 10);
  doc.add(basicHeader);

  const basicRow = new HorizontalStack();
  basicRow.spacing = 20;
  basicRow.widthDistribution = WidthDistribution.Weighted;

  const basicQr = new QRCode();
  basicQr.data = 'https://bonniepdf.com';
  basicQr.size = 130;
  basicQr.quietZone = 2;
  basicQr.altText = 'QR code linking to bonniepdf.com';

  const basicQrWrap = new Container();
  basicQrWrap.padding = new Thickness(10);
  basicQrWrap.child = basicQr;
  basicRow.add(basicQrWrap, 1);

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
    basicDetails.add(t);
  }
  basicRow.add(basicDetails, 2);
  doc.add(basicRow);

  const basicDivider = new Line();
  basicDivider.color = ColorPalette.slate[200];
  basicDivider.thickness = 1;
  basicDivider.margin = new Thickness(0, 20, 0, 20);
  doc.add(basicDivider);

  // ── Section 2: Error correction levels ──
  const eccHeader = new TextBlock('Error Correction Levels');
  eccHeader.fontName = StandardFonts.HelveticaBold;
  eccHeader.fontSize = 16;
  eccHeader.textColor = ColorPalette.indigo[600];
  eccHeader.margin = new Thickness(0, 0, 0, 10);
  doc.add(eccHeader);

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
  for (const [ecc, eccLabel, eccDetail] of [
    [QrEcc.Low, 'Low', '~7% restoration'],
    [QrEcc.Medium, 'Medium', '~15% restoration'],
    [QrEcc.Quartile, 'Quartile', '~25% restoration'],
    [QrEcc.High, 'High', '~30% restoration'],
  ] as [QrEcc, string, string][]) {
    const qr = new QRCode();
    qr.data = urlData;
    qr.size = 100;
    qr.errorCorrection = ecc;
    qr.quietZone = 1;
    qr.altText = `QR code linking to github.com/bonniepdf ( error correction)`;

    const qrWrap = new Container();
    qrWrap.backgroundColor = ColorPalette.slate[50];
    qrWrap.border = new Border(1);
    qrWrap.borderColors = new BorderColors(ColorPalette.slate[200]);
    qrWrap.padding = new Thickness(10);
    qrWrap.child = qr;

    const label = new TextBlock(eccLabel);
    label.fontName = StandardFonts.HelveticaBold;
    label.alignment = TextAlignment.Center;
    label.margin = new Thickness(0, 8, 0, 0);

    const detail = new TextBlock(eccDetail);
    detail.fontSize = 9;
    detail.textColor = ColorPalette.slate[500];
    detail.alignment = TextAlignment.Center;

    const url = new TextBlock(urlData);
    url.fontSize = 8;
    url.textColor = ColorPalette.slate[400];
    url.alignment = TextAlignment.Center;
    url.margin = new Thickness(0, 4, 0, 0);

    const col = new VerticalStack();
    col.add(qrWrap);
    col.add(label);
    col.add(detail);
    col.add(url);
    eccRow.add(col);
  }
  doc.add(eccRow);

  const eccDivider = new Line();
  eccDivider.color = ColorPalette.slate[200];
  eccDivider.thickness = 1;
  eccDivider.margin = new Thickness(0, 20, 0, 20);
  doc.add(eccDivider);

  // ── Section 3: Colors & backgrounds ──
  const colorsHeader = new TextBlock('Colors & Backgrounds');
  colorsHeader.fontName = StandardFonts.HelveticaBold;
  colorsHeader.fontSize = 16;
  colorsHeader.textColor = ColorPalette.indigo[600];
  colorsHeader.margin = new Thickness(0, 0, 0, 10);
  doc.add(colorsHeader);

  const colorRow = new HorizontalStack();
  colorRow.spacing = 20;
  colorRow.widthDistribution = WidthDistribution.Equal;

  // Custom foreground
  const fgCol = new VerticalStack();
  const fgTitle = new TextBlock('Custom Foreground');
  fgTitle.fontName = StandardFonts.HelveticaBold;
  fgTitle.margin = new Thickness(0, 0, 0, 8);
  fgCol.add(fgTitle);
  const fgQr = new QRCode();
  fgQr.data = 'tel:+1234567890';
  fgQr.size = 120;
  fgQr.foregroundColor = ColorPalette.blue[700];
  fgQr.quietZone = 2;
  fgQr.altText = 'QR code that dials the phone number +1 234 567 890';
  const fgWrap = new Container();
  fgWrap.border = new Border(1);
  fgWrap.borderColors = new BorderColors(ColorPalette.blue[200]);
  fgWrap.padding = new Thickness(10);
  fgWrap.child = fgQr;
  fgCol.add(fgWrap);
  const fgLabel = new TextBlock('tel:+1234567890');
  fgLabel.fontSize = 9;
  fgLabel.textColor = ColorPalette.slate[500];
  fgLabel.alignment = TextAlignment.Center;
  fgLabel.margin = new Thickness(0, 8, 0, 0);
  fgCol.add(fgLabel);
  colorRow.add(fgCol);

  // Custom background
  const bgCol = new VerticalStack();
  const bgTitle = new TextBlock('Custom Background');
  bgTitle.fontName = StandardFonts.HelveticaBold;
  bgTitle.margin = new Thickness(0, 0, 0, 8);
  bgCol.add(bgTitle);
  const bgQr = new QRCode();
  bgQr.data = 'mailto:hello@example.com';
  bgQr.size = 120;
  bgQr.foregroundColor = ColorPalette.rose[900];
  bgQr.backgroundColor = ColorPalette.rose[50];
  bgQr.quietZone = 2;
  bgQr.altText = 'QR code that composes an email to hello@example.com';
  const bgWrap = new Container();
  bgWrap.border = new Border(1);
  bgWrap.borderColors = new BorderColors(ColorPalette.rose[200]);
  bgWrap.padding = new Thickness(10);
  bgWrap.child = bgQr;
  bgCol.add(bgWrap);
  const bgLabel = new TextBlock('mailto:hello@example.com');
  bgLabel.fontSize = 9;
  bgLabel.textColor = ColorPalette.slate[500];
  bgLabel.alignment = TextAlignment.Center;
  bgLabel.margin = new Thickness(0, 8, 0, 0);
  bgCol.add(bgLabel);
  colorRow.add(bgCol);

  // Transparent background (container shows through)
  const transCol = new VerticalStack();
  const transTitle = new TextBlock('Transparent Background');
  transTitle.fontName = StandardFonts.HelveticaBold;
  transTitle.margin = new Thickness(0, 0, 0, 8);
  transCol.add(transTitle);
  const transQr = new QRCode();
  transQr.data = 'WIFI:S:MyNetwork;T:WPA;P:password;;';
  transQr.size = 120;
  transQr.foregroundColor = ColorPalette.amber[900];
  transQr.drawBackground = false;
  transQr.quietZone = 2;
  transQr.altText = 'QR code to join the MyNetwork Wi-Fi network';
  const transWrap = new Container();
  transWrap.backgroundColor = ColorPalette.amber[100];
  transWrap.border = new Border(1);
  transWrap.borderColors = new BorderColors(ColorPalette.amber[300]);
  transWrap.padding = new Thickness(10);
  transWrap.child = transQr;
  transCol.add(transWrap);
  const transLabel = new TextBlock('WIFI:S:MyNetwork;...');
  transLabel.fontSize = 9;
  transLabel.textColor = ColorPalette.slate[500];
  transLabel.alignment = TextAlignment.Center;
  transLabel.margin = new Thickness(0, 8, 0, 0);
  transCol.add(transLabel);
  colorRow.add(transCol);

  doc.add(colorRow);

  return doc;
}
