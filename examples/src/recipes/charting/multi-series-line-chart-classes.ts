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
  LineChart,
  PdfAConformance,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The **class / construct-then-mutate** companion to `multi-series-line-chart.ts`.
 *
 * Same year-over-year multi-series line chart, authored the long way: `new` each chart model and assign
 * properties. This is the escape hatch the options-object front door sits on
 * top of. Renders **byte-for-byte identically** to the options-style
 * `multi-series-line-chart.ts` (an equivalence test binds the two).
 */
export function generate(): Document {
  const year = new Date().getFullYear();

  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Multi-Series Line Chart');
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
  metadata.title = 'Multi-Series Line Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = `Year-over-year revenue comparison - ${year - 1} vs ${year} on a shared axis`;

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Multi-Series Line Chart: Year-over-Year Comparison');
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(`Comparing ${year - 1} and ${year} revenue with a shared axis`);
  subtitle.fontSize = 14;
  subtitle.textColor = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const data = new ChartData();
  data.title = 'Year-over-Year Revenue Comparison';
  const previousYear = new ChartSeries();
  previousYear.color = Color.fromHex('#4f46e5');
  previousYear.name = String(year - 1);
  previousYear.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = [65000, 69000, 80000, 72000, 85000, 88000, 72000, 68000, 75000, 81000, 92000, 105000][i];
    return p;
  });

  const currentYear = new ChartSeries();
  currentYear.color = Color.fromHex('#7c3aed');
  currentYear.name = String(year);
  currentYear.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = [75000, 78000, 85000, 78000, 92000, 95000, 87000, 78000, 82000, 91000, 97000, 118000][i];
    return p;
  });

  data.series = [previousYear, currentYear];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 150000;
  data.yAxis.stepCount = 5;
  data.yAxis.legend = 'Revenue';
  data.xAxis.legend = 'Month';

  const chart = new LineChart();
  chart.height = 380;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.showDataPointMarkers = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  chart.data = data;
  chart.altText = `Multi-series line chart comparing monthly revenue for ${year - 1} and ${year}.`;
  doc.add(chart);

  return doc;
}
