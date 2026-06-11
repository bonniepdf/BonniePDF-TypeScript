import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
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
  LollipopChart,
  PdfAConformance,
} from '@bonniepdf/core';

const C_PINK = '#ec4899';

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Lollipop Chart');
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
  metadata.title = 'Lollipop Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Lollipop chart example - stems with circular heads, a clear minimal bar alternative';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Lollipop Chart: Quarterly Metrics');
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Stems with circular heads - clear and minimal bar alternative');
  subtitle.fontSize = 14;
  subtitle.textColor = Color.slate600;
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const values = [4500, 6200, 8500, 11500];
  const s = new ChartSeries();
  s.color = Color.fromHex(C_PINK);
  s.dataPoints = labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });

  const data = new ChartData();
  data.title = 'Quarterly Revenue';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 15000;
  data.yAxis.stepCount = 5;
  data.yAxis.legend = 'Revenue';
  data.xAxis.legend = 'Quarter';

  const chart = new LollipopChart();
  chart.height = 380;
  chart.stretchToFit = true;
  chart.lollipopColor = Color.fromHex(C_PINK);
  chart.stemWidth = 2.5;
  chart.headRadius = 10;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  doc.add(
    new ChartElement(
      chart,
      data,
      'Lollipop chart of quarterly revenue, increasing from 4,500 GBP in Q1 to 11,500 GBP in Q4.'
    )
  );

  return doc;
}
