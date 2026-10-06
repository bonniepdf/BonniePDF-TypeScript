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
  ChartOrientation,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const C_INDIGO = '#4f46e5';

/**
 * The **class / construct-then-mutate** companion to `horizontal-bar-chart.ts`.
 *
 * Same regional-sales horizontal bar chart, authored the long way: `new` each chart model and assign
 * properties. This is the escape hatch the options-object front door sits on
 * top of. Renders **byte-for-byte identically** to the options-style
 * `horizontal-bar-chart.ts` (an equivalence test binds the two).
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
    const left = new TextBlock('BonniePDF - Horizontal Bar Chart');
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
  metadata.title = 'Horizontal Bar Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Regional sales ranking using a horizontal bar chart';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Horizontal Bar Chart: Regional Sales Performance');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Full-year revenue by region - horizontal orientation suits ranked comparisons');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const regions = [
    { label: 'North East', value: 142000 },
    { label: 'North West', value: 187000 },
    { label: 'Midlands', value: 203000 },
    { label: 'East Anglia', value: 96000 },
    { label: 'South East', value: 261000 },
    { label: 'South West', value: 118000 },
  ];

  const s = new ChartSeries();
  s.color = Color.fromHex(C_INDIGO);
  s.dataPoints = regions.map(r => {
    const p = new ChartDataPoint();
    p.label = r.label;
    p.value = r.value;
    p.labelFormat = 'N0';
    return p;
  });

  const data = new ChartData();
  data.title = 'Regional Sales';
  data.series = [s];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 300000;
  data.yAxis.stepCount = 5;
  data.yAxis.showGridLines = true;
  data.yAxis.legend = 'Revenue';
  data.xAxis.legend = 'Region';

  const chart = new BarChart();
  chart.orientation = ChartOrientation.Horizontal;
  chart.height = 380;
  chart.stretchToFit = true;
  chart.barColor = Color.fromHex(C_INDIGO);
  chart.barWidthRatio = 0.55;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex('#fafafa');

  chart.data = data;
  chart.altText = 'Horizontal bar chart showing regional sales performance across six UK regions.';
  doc.add(chart);

  return doc;
}
