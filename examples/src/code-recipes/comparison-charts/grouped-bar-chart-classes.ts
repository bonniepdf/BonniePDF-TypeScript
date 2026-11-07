/**
 * Grouped Bar Chart (Class API).
 * The same three-series grouped bar chart as Grouped Bar Chart, built with the class API: construct each chart model and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
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
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

/**
 * The **class / construct-then-mutate** companion to `grouped-bar-chart.ts`.
 *
 * Same three-series grouped bar chart, authored the long way: `new` each chart
 * model and assign properties. This is the escape hatch the options-object
 * front door sits on top of. Renders **byte-for-byte identically** to the
 * options-style `grouped-bar-chart.ts` (an equivalence test binds the two).
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  function pageFooter() {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Grouped Bar Chart');
    left.fontName = StandardFonts.Helvetica;
    left.fontSize = 10;
    left.color = ColorPalette.slate[500];
    stack.add(left);
    const right = new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`);
    right.fontName = StandardFonts.Helvetica;
    right.fontSize = 10;
    right.color = ColorPalette.slate[500];
    right.alignment = TextAlignment.Right;
    stack.add(right, 1);
    return stack;
  }

  settings.footerTemplate = pageTemplate({ default: pageFooter() });

  const metadata = new DocumentMetadata();
  metadata.title = 'Grouped Bar Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Grouped bar chart example - three product lines compared quarter by quarter';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Grouped Bar Chart: Quarterly Revenue by Product Line');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Three product lines compared quarter by quarter, 2026');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const data = new ChartData();
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 35000;
  data.yAxis.stepCount = 7;
  const electronics = new ChartSeries();
  electronics.color = Color.fromHex('#4f46e5');
  electronics.name = 'Electronics';
  electronics.dataPoints = QUARTERS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = [14500, 21800, 22500, 31500][i];
    p.labelFormat = 'N0';
    return p;
  });

  const clothing = new ChartSeries();
  clothing.color = Color.fromHex('#f43f5e');
  clothing.name = 'Clothing';
  clothing.dataPoints = QUARTERS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = [10500, 14200, 14100, 19400][i];
    p.labelFormat = 'N0';
    return p;
  });

  const homeAndGarden = new ChartSeries();
  homeAndGarden.color = Color.fromHex('#22c55e');
  homeAndGarden.name = 'Home & Garden';
  homeAndGarden.dataPoints = QUARTERS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = [9300, 13000, 12900, 17400][i];
    p.labelFormat = 'N0';
    return p;
  });

  data.series = [electronics, clothing, homeAndGarden];

  const chart = new GroupedBarChart();
  chart.theme = 'modern';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.showValueLabels = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.backgroundColor = Color.white;

  chart.data = data;
  chart.altText =
    'Grouped bar chart comparing Electronics, Clothing, and Home and Garden revenue in each quarter of 2026; Electronics leads every quarter, reaching 31,500 GBP in Q4.';
  doc.add(chart);

  return doc;
}
