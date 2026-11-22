/**
 * Stacked Bar Chart (Class API).
 * The same quarterly revenue mix stacked bar chart as Stacked Bar Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  StackedBarChart,
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
    const left = new TextBlock('BonniePDF - Stacked Bar Chart');
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
  metadata.title = 'Stacked Bar Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Stacked bar chart example - quarterly revenue split by acquisition channel';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Stacked Bar Chart: Revenue Mix by Channel');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(
    'Multi-series stacking with compact K totals, segment gaps, and auto-contrast inside labels'
  );
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
  data.title = 'Quarterly Revenue Mix';
  data.yAxis.prefix = '£';
  data.yAxis.valueFormat = 'K0';
  data.series = [
    buildSeries('Direct', [180000, 215000, 248000, 292000]),
    buildSeries('Partner', [95000, 112000, 128000, 146000]),
    buildSeries('Self-serve', [64000, 78000, 94000, 118000]),
  ];

  const chart = new StackedBarChart();
  chart.theme = 'modern';
  chart.mode = 'absolute';
  chart.showStackTotals = true;
  chart.stackTotalFormat = 'K0';
  chart.valueLabelFormat = 'K0';
  chart.valueLabelPrefix = '£';
  chart.segmentGap = 1.5;
  chart.data = data;
  chart.altText =
    'Stacked bar chart showing quarterly revenue split across Direct, Partner, and Self-serve channels, rising from 339K in Q1 to 556K in Q4.';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.backgroundColor = Color.white;
  doc.add(chart);

  return doc;
}
