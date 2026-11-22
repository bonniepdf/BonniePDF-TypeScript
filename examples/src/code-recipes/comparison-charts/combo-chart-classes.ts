/**
 * Combo Chart (Class API).
 * The same dual-axis revenue and gross-margin combo chart as Combo Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  AxisOptions,
  ChartData,
  ChartSeries,
  ChartSeriesStyle,
  ChartDataPoint,
  ComboChart,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  function pageFooter() {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Combo Chart');
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
  metadata.title = 'Combo Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Combo chart example - revenue bars on primary axis and gross margin line on secondary axis';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Combo Chart: Revenue vs. Gross Margin');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(
    'Primary revenue bars paired with a smooth gross-margin percentage line on a secondary Y axis'
  );
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const revSeries = new ChartSeries();
  revSeries.name = 'Revenue';
  revSeries.seriesType = 'bar';
  revSeries.valueAxis = 'primary';
  revSeries.dataPoints = QUARTERS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = [420000, 485000, 540000, 635000][i];
    return p;
  });

  const marginStyle = new ChartSeriesStyle();
  marginStyle.curve = 'smooth';
  marginStyle.lineWidth = 2.5;
  marginStyle.markerFill = 'hollow';
  marginStyle.markerHaloWidth = 1.5;

  const marginSeries = new ChartSeries();
  marginSeries.name = 'Gross Margin';
  marginSeries.seriesType = 'line';
  marginSeries.valueAxis = 'secondary';
  marginSeries.color = Color.fromHex('#f59e0b');
  marginSeries.style = marginStyle;
  marginSeries.dataPoints = QUARTERS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = [68, 71, 74, 79][i];
    return p;
  });

  const data = new ChartData();
  data.title = 'Quarterly Revenue & Gross Margin';
  data.yAxis.prefix = '£';
  data.yAxis.valueFormat = 'K0';
  data.series = [revSeries, marginSeries];

  const secAxis = new AxisOptions();
  secAxis.minValue = 50;
  secAxis.maxValue = 90;
  secAxis.suffix = '%';
  secAxis.valueFormat = 'F0';

  const chart = new ComboChart();
  chart.theme = 'modern';
  chart.showValueLabels = false;
  chart.legendPosition = 'top';
  chart.secondaryYAxis = secAxis;
  chart.data = data;
  chart.altText =
    'Combo chart comparing quarterly revenue bars from 420K to 635K GBP against gross margin rising from 68% to 79% on a secondary axis.';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.backgroundColor = Color.white;
  doc.add(chart);

  return doc;
}
