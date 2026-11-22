/**
 * Stacked Area Chart (Class API).
 * The same 100% stacked area chart as Stacked Area Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  StackedAreaChart,
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
    const left = new TextBlock('BonniePDF - Stacked Area Chart');
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
  metadata.title = 'Stacked Area Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Stacked area chart example - 100% normalized platform traffic share';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Stacked Area Chart: Platform Traffic Share');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('100% normalized smooth stacked area bands with inline series labels');
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  function buildSeries(name: string, values: number[]): ChartSeries {
    const s = new ChartSeries();
    s.name = name;
    s.dataPoints = QUARTERS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = values[i];
      return p;
    });
    return s;
  }

  const data = new ChartData();
  data.title = 'Traffic Share (%)';
  data.yAxis.suffix = '%';
  data.series = [
    buildSeries('Web', [58, 54, 50, 47]),
    buildSeries('Mobile', [30, 33, 36, 38]),
    buildSeries('API', [12, 13, 14, 15]),
  ];

  const chart = new StackedAreaChart();
  chart.theme = 'modern';
  chart.mode = 'percent';
  chart.curve = 'smooth';
  chart.legendPosition = 'inline';
  chart.data = data;
  chart.altText =
    '100% stacked area chart showing platform traffic share shifting from Web (58% to 47%) toward Mobile (30% to 38%) and API (12% to 15%).';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.backgroundColor = Color.white;
  doc.add(chart);

  return doc;
}
