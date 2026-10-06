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
  pageTemplate,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_VIOLET = '#7c3aed';

/**
 * The **class / construct-then-mutate** companion to `line-chart.ts`.
 *
 * Same monthly-revenue line chart, authored the long way: `new` each chart
 * model and assign properties. This is the escape hatch the options-object
 * front door sits on top of. Renders **byte-for-byte identically** to the
 * options-style `line-chart.ts` (an equivalence test binds the two).
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
    const left = new TextBlock('BonniePDF - Line Chart');
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
  metadata.title = 'Line Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Line chart example - connected data points with markers and value labels';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Line Chart: Monthly Revenue Trends');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Connected data points with markers and value labels');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800];
  const s = new ChartSeries();
  s.color = Color.fromHex(C_VIOLET);
  s.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });

  const data = new ChartData();
  data.title = 'Monthly Revenue';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 15000;
  data.yAxis.stepCount = 5;
  data.yAxis.legend = 'Revenue';
  data.xAxis.legend = 'Month';

  const chart = new LineChart();
  chart.height = 380;
  chart.stretchToFit = true;
  chart.lineColor = Color.fromHex(C_VIOLET);
  chart.lineWidth = 2.5;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.showDataPointMarkers = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  chart.data = data;
  chart.altText = 'Line chart of monthly revenue from January to December, ending at 12,800 GBP.';
  doc.add(chart);

  return doc;
}
