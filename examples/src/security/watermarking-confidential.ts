import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  WatermarkSettings,
  TextBlock,
  TextStyle,
  TextAlignment,
  Table,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.conformance = PdfAConformance.PdfA2b;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[600]);

  const watermark = new WatermarkSettings('CONFIDENTIAL');
  watermark.fontSize = 60;
  watermark.textColor = Color.red;
  watermark.opacity = 0.08;
  watermark.rotationDegrees = -55;
  settings.watermark = watermark;

  const metadata = new DocumentMetadata();
  metadata.title = 'Confidential Report';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  const now = new Date();
  const year = now.getFullYear();

  const title = new TextBlock(`Financial Performance Report Q4 ${year}`);
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 22;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  const table = new Table(200, 120, 120);
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(ColorPalette.slate[200]);
  table.cellPadding = 6;
  table.headerBackgroundColor = ColorPalette.slate[700];
  table.headerTextColor = Color.white;

  const hMetric = new TextBlock('Metric');
  hMetric.fontName = StandardFonts.HelveticaBold;
  hMetric.fontSize = 11;
  const hQ3 = new TextBlock(`Q3 ${year}`);
  hQ3.fontName = StandardFonts.HelveticaBold;
  hQ3.fontSize = 11;
  const hQ4 = new TextBlock(`Q4 ${year}`);
  hQ4.fontName = StandardFonts.HelveticaBold;
  hQ4.fontSize = 11;
  table.addHeader(hMetric, hQ3, hQ4);

  const rows = [
    ['Revenue', '$4.2M', '$5.1M'],
    ['Operating Costs', '$2.8M', '$2.9M'],
    ['Net Profit', '$1.4M', '$2.2M'],
    ['Headcount', '142', '158'],
    ['Customer Growth', '+12%', '+18%'],
  ];

  for (const [metric, q3, q4] of rows) {
    const mText = new TextBlock(metric);
    mText.fontName = StandardFonts.Helvetica;
    mText.fontSize = 11;
    const q3Text = new TextBlock(q3);
    q3Text.fontName = StandardFonts.Helvetica;
    q3Text.fontSize = 11;
    const q4Text = new TextBlock(q4);
    q4Text.fontName = StandardFonts.Helvetica;
    q4Text.fontSize = 11;
    table.addRow(mText, q3Text, q4Text);
  }

  doc.add(table);

  const disclaimer = new TextBlock(
    'This report contains proprietary financial data and is intended solely for ' +
      'authorised recipients. Unauthorised disclosure or distribution is prohibited.'
  );
  disclaimer.fontName = StandardFonts.TimesItalic;
  disclaimer.fontSize = 10;
  disclaimer.textColor = ColorPalette.slate[500];
  disclaimer.margin = new Thickness(0, 20, 0, 0);
  doc.add(disclaimer);

  return doc;
}
