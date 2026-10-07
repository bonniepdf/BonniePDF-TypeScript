/**
 * Pie Chart (Class API).
 * The same chart as Pie Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  PieChart,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
];

/**
 * The **class / construct-then-mutate** companion to `pie-chart.ts`.
 *
 * Same monthly-sales donut chart, authored the long way: `new` each chart
 * model and assign properties. This is the escape hatch the options-object
 * front door sits on top of. Renders **byte-for-byte identically** to the
 * options-style `pie-chart.ts` (an equivalence test binds the two).
 */
export function generate(): Document {
  const year = new Date().getFullYear();

  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  function pageFooter() {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Pie Chart');
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
  metadata.title = 'Pie Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Pie / donut chart example - monthly sales breakdown with legend and centre total';

  const doc = new Document(settings, metadata);

  const title = new TextBlock(`Pie Chart: Monthly Sales ${year}`);
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Donut chart with legend and total value in the centre');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const values = [7234, 4891, 8456, 3127, 9542, 6789, 5234, 8901, 2456, 7890, 6123, 9876];
  const s = new ChartSeries();
  s.color = Color.fromHex('#4f46e5');
  s.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });

  const data = new ChartData();
  data.title = `Monthly Sales ${year}`;
  data.series = [s];

  const chart = new PieChart();
  chart.height = 380;
  chart.stretchToFit = true;
  chart.isDonut = true;
  chart.totalLabel = 'Total';
  chart.showLegend = true;
  chart.colors = ALL_COLORS;
  chart.backgroundColor = Color.white;

  chart.data = data;
  chart.altText = `Donut chart showing ${year} monthly sales share with a legend and total value in the centre.`;
  doc.add(chart);

  return doc;
}
