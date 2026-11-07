/**
 * Bar Chart (Class API).
 * The same monthly-sales bar chart as Bar Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  BarChart,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_INDIGO = '#4f46e5';

/**
 * The **class / construct-then-mutate** companion to `bar-chart.ts`.
 *
 * Same monthly-sales bar chart, authored the long way: `new` each chart model
 * (`ChartDataPoint`, `ChartSeries`, `ChartData`, `BarChart`) and assign
 * properties, using `PageOrientation`, `TextAlignment`, `TextStyle`,
 * `Thickness`, `Color` and `ColorPalette` directly. This is the escape hatch
 * the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style `bar-chart.ts`
 * (an equivalence test binds the two). Reach for the options form first; this
 * variant exists to show what it desugars to.
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
    const left = new TextBlock('BonniePDF - Bar Chart');
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
  metadata.title = 'Bar Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Bar chart example - monthly sales with vertical bars, grid lines, and value labels';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Bar Chart: Monthly Sales Report');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Vertical bars with grid lines and value labels');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800];
  const points = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    p.labelFormat = 'N0';
    return p;
  });

  const s = new ChartSeries();
  s.color = Color.fromHex(C_INDIGO);
  s.dataPoints = points;

  const data = new ChartData();
  data.title = 'Monthly Sales';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 15000;
  data.yAxis.stepCount = 5;

  const chart = new BarChart();
  chart.theme = 'modern';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.barColor = Color.fromHex(C_INDIGO);
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.backgroundColor = Color.white;

  chart.data = data;
  chart.altText = 'Bar chart of monthly sales from January to December, rising from 4,500 to 12,800 GBP.';
  doc.add(chart);

  return doc;
}
