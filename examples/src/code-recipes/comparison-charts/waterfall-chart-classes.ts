/**
 * Waterfall Chart (Class API).
 * The same ARR movement bridge waterfall chart as Waterfall Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  type ChartDataPointKind,
  WaterfallChart,
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
    const left = new TextBlock('BonniePDF - Waterfall Chart');
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
  metadata.title = 'Waterfall Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Waterfall chart example - cumulative ARR variance bridge with totals and connectors';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Waterfall Chart: ARR Movement Bridge');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(
    'Cumulative variance bridge with positive/negative deltas, auto-computed ending total, and connectors'
  );
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  function pt(label: string, kind: ChartDataPointKind, value?: number): ChartDataPoint {
    const p = new ChartDataPoint();
    p.label = label;
    p.kind = kind;
    if (value !== undefined) p.value = value;
    return p;
  }

  const s = new ChartSeries();
  s.name = 'ARR';
  s.dataPoints = [
    pt('Start', 'total', 800000),
    pt('New', 'delta', 260000),
    pt('Expansion', 'delta', 135000),
    pt('Churn', 'delta', -85000),
    pt('Contraction', 'delta', -40000),
    pt('Ending', 'total'),
  ];

  const data = new ChartData();
  data.title = 'Annual Recurring Revenue Bridge';
  data.yAxis.prefix = '£';
  data.yAxis.valueFormat = 'K1';
  data.series = [s];

  const chart = new WaterfallChart();
  chart.theme = 'modern';
  chart.valueLabelPrefix = '£';
  chart.valueLabelFormat = 'K1';
  chart.data = data;
  chart.altText =
    'Waterfall bridge from 800k starting ARR through new business, expansion, churn, and contraction to 1.07M ending ARR.';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.backgroundColor = Color.white;
  doc.add(chart);

  return doc;
}
