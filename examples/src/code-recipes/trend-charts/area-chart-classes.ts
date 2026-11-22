/**
 * Area Chart (Class API).
 * The same chart as Area Chart, built with the class API: construct each chart model and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  AccessibilityMode,
  PageOrientation,
  TextBlock,
  TextStyle,
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
  AreaChart,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_PURPLE = '#a855f7';

/**
 * The **class / construct-then-mutate** companion to `area-chart.ts`.
 *
 * Same monthly-sales area chart (filled area under the line), authored the long way: `new` each chart model and assign
 * properties. This is the escape hatch the options-object front door sits on
 * top of. Renders **byte-for-byte identically** to the options-style
 * `area-chart.ts` (an equivalence test binds the two).
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
    const left = new TextBlock('BonniePDF - Area Chart');
    left.fontName = StandardFonts.Helvetica;
    left.fontSize = 10;
    left.color = ColorPalette.slate[500];
    stack.add(left);
    const right = pageNumber();
    right.fontName = StandardFonts.Helvetica;
    right.fontSize = 10;
    right.color = ColorPalette.slate[500];
    right.alignment = TextAlignment.Right;
    stack.add(right, 1);
    return stack;
  }

  settings.footerTemplate = pageTemplate({ default: pageFooter() });

  const metadata = new DocumentMetadata();
  metadata.title = 'Area Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Area chart example - filled area under the line with configurable opacity';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Area Chart: Monthly Sales Performance');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Filled area under the line with configurable opacity');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
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
    p.labelFormat = 'N0';
    return p;
  });

  const data = new ChartData();
  data.title = 'Monthly Sales';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 15000;
  data.yAxis.stepCount = 5;
  data.yAxis.legend = 'Sales';
  data.yAxis.verticalLegend = true;
  data.xAxis.legend = 'Month';

  const chart = new AreaChart();
  chart.data = data;
  chart.theme = 'modern';
  chart.autoLayout = true;
  chart.curve = 'smooth';
  chart.areaGradient = true;
  chart.subtitle = 'Smooth spline with vertical fade gradient and break-even reference line';
  chart.borderRadius = 8;
  chart.borderColor = '#e2e8f0';
  chart.borderWidth = 1;
  chart.references = [
    {
      value: 7500,
      label: 'Break-even £7.5k',
      labelPosition: 'start',
      labelBackgroundColor: '#fae8ff',
      color: '#9333ea',
      thickness: 1.5,
      dashPattern: [5, 3],
    },
  ];
  chart.height = 380;
  chart.stretchToFit = true;
  chart.areaColor = Color.fromHex(C_PURPLE);
  chart.fillOpacity = 0.3;
  chart.lineWidth = 2.5;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.white;
  chart.altText = 'Area chart of monthly sales from January to December, with a filled trend rising to 12,800 GBP.';
  doc.add(chart);

  return doc;
}
