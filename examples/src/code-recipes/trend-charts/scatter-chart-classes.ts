/**
 * Scatter Chart (Class API).
 * The same latency-vs-throughput scatter bubble chart as Scatter Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  ScatterChart,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  function pageFooter() {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Scatter Chart');
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
  metadata.title = 'Scatter Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Scatter chart example - continuous X/Y coordinates with bubble sizing and linear trendline';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Scatter Chart: Latency vs. Throughput');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(
    'Continuous numeric X/Y coordinates with area-scaled bubbles and OLS linear trendline'
  );
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  function pt(label: string, x: number, value: number, size: number): ChartDataPoint {
    const p = new ChartDataPoint();
    p.label = label;
    p.x = x;
    p.value = value;
    p.size = size;
    return p;
  }

  const eu = new ChartSeries();
  eu.name = 'Region EU';
  eu.dataPoints = [pt('n1', 120, 14, 12), pt('n2', 240, 21, 22), pt('n3', 360, 29, 34), pt('n4', 480, 41, 48)];

  const us = new ChartSeries();
  us.name = 'Region US';
  us.dataPoints = [pt('u1', 150, 18, 15), pt('u2', 290, 27, 28), pt('u3', 420, 37, 40), pt('u4', 520, 49, 54)];

  const data = new ChartData();
  data.title = 'Cluster Scaling Profile';
  data.xAxis.legend = 'Requests / sec';
  data.xAxis.autoScale = true;
  data.yAxis.legend = 'p95 Latency (ms)';
  data.yAxis.autoScale = true;
  data.series = [eu, us];

  const chart = new ScatterChart();
  chart.theme = 'modern';
  chart.showTrendline = 'linear';
  chart.data = data;
  chart.altText =
    'Scatter bubble chart of p95 latency versus throughput for EU and US regions, with bubble size proportional to active nodes and linear trendlines.';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.backgroundColor = Color.white;
  doc.add(chart);

  return doc;
}
