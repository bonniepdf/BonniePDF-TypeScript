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
  AreaChart,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_PURPLE = '#a855f7';

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF — Area Chart');
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
  metadata.title = 'Area Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Area chart example — filled area under the line with configurable opacity';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const title = new TextBlock('Area Chart: Monthly Sales Performance');
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Filled area under the line with configurable opacity');
  subtitle.fontSize = 14;
  subtitle.textColor = Color.slate600;
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800];
  const s = new ChartSeries();
  s.color = Color.fromHex(C_PURPLE);
  s.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });

  const data = new ChartData();
  data.title = 'Monthly Sales';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 15000;
  data.yAxis.stepCount = 5;
  data.yAxis.legend = 'Sales';
  data.xAxis.legend = 'Month';

  const chart = new AreaChart();
  chart.height = 380;
  chart.stretchToFit = true;
  chart.areaColor = Color.fromHex(C_PURPLE);
  chart.fillOpacity = 0.3;
  chart.lineWidth = 2.5;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  doc.add(
    new ChartElement(
      chart,
      data,
      'Area chart of monthly sales from January to December, with a filled trend rising to 12,800 GBP.'
    )
  );

  return doc;
}
