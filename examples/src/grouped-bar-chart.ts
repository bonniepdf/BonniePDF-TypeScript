import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  PageOrientation,
  TextBlock,
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
  GroupedBarChartElement,
  GroupedBarChart,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function makeSeries(values: number[], color: string, name: string): ChartSeries {
  const s = new ChartSeries();
  s.color = Color.fromHex(color);
  s.name = name;
  s.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
  return s;
}

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF — Grouped Bar Chart');
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
  metadata.title = 'Grouped Bar Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Grouped bar chart example — three product lines compared across 12 months';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Grouped Bar Chart: Quarterly Revenue by Product Line');
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Comparison of three product lines across all months');
  subtitle.fontSize = 14;
  subtitle.textColor = Color.slate600;
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const data = new ChartData();
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 15000;
  data.yAxis.stepCount = 5;
  data.series = [
    makeSeries([4500, 5200, 4800, 6200, 7500, 8100, 7200, 6800, 8500, 9200, 10500, 11800], '#4f46e5', 'Electronics'),
    makeSeries([3200, 3800, 3500, 4200, 4800, 5200, 4600, 4400, 5100, 5800, 6400, 7200], '#f43f5e', 'Clothing'),
    makeSeries([2800, 3400, 3100, 3800, 4400, 4800, 4200, 4000, 4700, 5400, 6000, 6800], '#22c55e', 'Home & Garden'),
  ];

  const chart = new GroupedBarChart();
  chart.height = 380;
  chart.stretchToFit = true;
  chart.showValueLabels = true;
  chart.fontFamily = 'Arial, sans-serif';
  chart.backgroundColor = Color.fromHex('#fafafa');

  doc.add(new GroupedBarChartElement(chart, data));

  return doc;
}
