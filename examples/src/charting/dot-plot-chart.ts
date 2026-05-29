import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  AccessibilityMode,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextElementBase,
  TextAlignment,
  HorizontalStack,
  Color,
  Thickness,
  StandardFonts,
  WidthDistribution,
  ChartData,
  ChartSeries,
  ChartDataPoint,
  ChartElement,
  DotPlotChart,
} from '@bonniepdf/core';

const C_TEAL = '#14b8a6';

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF — Dot Plot Chart');
    left.fontName = StandardFonts.Helvetica;
    left.fontSize = 10;
    left.textColor = Color.slate500;
    stack.addChild(left);
    const right = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    right.fontName = StandardFonts.Helvetica;
    right.fontSize = 10;
    right.textColor = Color.slate500;
    right.alignment = TextAlignment.Right;
    stack.addChild(right, 1);
    return stack;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Dot Plot Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Dot plot chart example — circular markers positioned along a value axis';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const title = new TextBlock('Dot Plot Chart: Product Performance');
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Circular markers positioned along a value axis');
  subtitle.fontSize = 14;
  subtitle.textColor = Color.slate600;
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const labels = ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E', 'Prod F', 'Prod G', 'Prod H'];
  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 9500];
  const s = new ChartSeries();
  s.color = Color.fromHex(C_TEAL);
  s.dataPoints = labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });

  const data = new ChartData();
  data.title = 'Product Sales';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 12000;
  data.yAxis.stepCount = 5;
  data.yAxis.legend = 'Sales';
  data.xAxis.legend = 'Product';

  const chart = new DotPlotChart();
  chart.height = 380;
  chart.stretchToFit = true;
  chart.dotColor = Color.fromHex(C_TEAL);
  chart.dotRadius = 12;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  doc.add(
    new ChartElement(chart, data, 'Dot plot comparing eight product sales values, ranging from 4,500 to 9,500 GBP.')
  );

  return doc;
}
