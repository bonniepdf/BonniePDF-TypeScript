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
  GroupedBarChart,
  ChartOrientation,
  PdfAConformance,
} from '@bonniepdf/core';

const C_INDIGO = '#4f46e5';
const C_ROSE = '#e11d48';
const C_GREEN = '#16a34a';

/**
 * The **class / construct-then-mutate** companion to `horizontal-grouped-bar-chart.ts`.
 *
 * Same three-series horizontal grouped bar chart, authored the long way: `new` each chart model and assign
 * properties. This is the escape hatch the options-object front door sits on
 * top of. Renders **byte-for-byte identically** to the options-style
 * `horizontal-grouped-bar-chart.ts` (an equivalence test binds the two).
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Horizontal Grouped Bar Chart');
    left.fontName = StandardFonts.Helvetica;
    left.fontSize = 10;
    left.color = ColorPalette.slate[500];
    stack.add(left);
    const right = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    right.fontName = StandardFonts.Helvetica;
    right.fontSize = 10;
    right.color = ColorPalette.slate[500];
    right.alignment = TextAlignment.Right;
    stack.add(right, 1);
    return stack;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Horizontal Grouped Bar Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Quarterly regional sales using a horizontal grouped bar chart';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Horizontal Grouped Bar Chart: Quarterly Sales by Region');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Three product lines compared across four quarters - horizontal grouped layout');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const electronics = new ChartSeries();
  electronics.name = 'Electronics';
  electronics.color = Color.fromHex(C_INDIGO);
  electronics.dataPoints = quarters.map((q, i) => {
    const p = new ChartDataPoint();
    p.label = q;
    p.value = [42000, 58000, 71000, 95000][i];
    return p;
  });

  const clothing = new ChartSeries();
  clothing.name = 'Clothing';
  clothing.color = Color.fromHex(C_ROSE);
  clothing.dataPoints = quarters.map((q, i) => {
    const p = new ChartDataPoint();
    p.label = q;
    p.value = [31000, 44000, 52000, 68000][i];
    return p;
  });

  const home = new ChartSeries();
  home.name = 'Home & Garden';
  home.color = Color.fromHex(C_GREEN);
  home.dataPoints = quarters.map((q, i) => {
    const p = new ChartDataPoint();
    p.label = q;
    p.value = [24000, 37000, 41000, 53000][i];
    return p;
  });

  const data = new ChartData();
  data.series = [electronics, clothing, home];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 110000;
  data.yAxis.stepCount = 5;
  data.yAxis.showGridLines = true;
  data.yAxis.legend = 'Revenue';
  data.xAxis.legend = 'Quarter';

  const chart = new GroupedBarChart();
  chart.orientation = ChartOrientation.Horizontal;
  chart.height = 380;
  chart.stretchToFit = true;
  chart.barWidthRatio = 0.7;
  chart.groupGapRatio = 0.25;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.showValueLabels = false;
  chart.showLegend = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  chart.data = data;
  chart.altText = 'Horizontal grouped bar chart comparing quarterly sales across three product lines.';
  doc.add(chart);

  return doc;
}
