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
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  ChartData,
  ChartSeries,
  ChartDataPoint,
  ChartElement,
  LollipopChart,
  ChartOrientation,
  PdfAConformance,
} from '@bonniepdf/core';

const C_VIOLET = '#7c3aed';

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Horizontal Lollipop Chart');
    left.fontName = StandardFonts.Helvetica;
    left.fontSize = 10;
    left.textColor = ColorPalette.slate[500];
    stack.addChild(left);
    const right = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    right.fontName = StandardFonts.Helvetica;
    right.fontSize = 10;
    right.textColor = ColorPalette.slate[500];
    right.alignment = TextAlignment.Right;
    stack.addChild(right, 1);
    return stack;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Horizontal Lollipop Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Product revenue ranking using a horizontal lollipop chart';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Horizontal Lollipop Chart: Product Revenue Ranking');
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(
    'Year-to-date revenue per product line - lollipop style reduces ink without losing clarity'
  );
  subtitle.fontSize = 14;
  subtitle.textColor = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const products = [
    { label: 'Product A', value: 45000 },
    { label: 'Product B', value: 62000 },
    { label: 'Product C', value: 38500 },
    { label: 'Product D', value: 71000 },
    { label: 'Product E', value: 55000 },
    { label: 'Product F', value: 83000 },
    { label: 'Product G', value: 49000 },
    { label: 'Product H', value: 91000 },
  ];

  const s = new ChartSeries();
  s.color = Color.fromHex(C_VIOLET);
  s.dataPoints = products.map(r => {
    const p = new ChartDataPoint();
    p.label = r.label;
    p.value = r.value;
    p.labelFormat = "'£'#,##0";
    return p;
  });

  const data = new ChartData();
  data.title = 'Product Revenue';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 100000;
  data.yAxis.stepCount = 5;
  data.yAxis.showGridLines = true;
  data.yAxis.legend = 'Revenue';
  data.xAxis.legend = 'Product';

  const chart = new LollipopChart();
  chart.orientation = ChartOrientation.Horizontal;
  chart.height = 400;
  chart.stretchToFit = true;
  chart.lollipopColor = Color.fromHex(C_VIOLET);
  chart.stemWidth = 2;
  chart.headRadius = 9;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  doc.add(
    new ChartElement(chart, data, 'Horizontal lollipop chart showing product revenue ranking for eight product lines.')
  );

  return doc;
}
