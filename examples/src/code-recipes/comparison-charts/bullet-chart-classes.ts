/**
 * Bullet Chart (Class API).
 * The same executive KPI bullet chart scorecard as Bullet Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  VerticalStack,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  BulletChart,
  LineChart,
  ChartData,
  ChartSeries,
  ChartDataPoint,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function kpiSparkline(color: string, target: number, values: number[], altText: string): LineChart {
  const s = new ChartSeries();
  s.color = Color.fromHex(color);
  s.dataPoints = MONTHS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
  const data = new ChartData();
  data.series = [s];

  const chart = new LineChart();
  chart.theme = 'modern';
  chart.sparkline = true;
  chart.curve = 'smooth';
  chart.lineColor = Color.fromHex(color);
  chart.sparklineFillOpacity = 0.18;
  chart.sparklineShowEndpoints = true;
  chart.sparklineHighlightMinMax = true;
  chart.sparklineReferenceValue = target;
  chart.borderRadius = 6;
  chart.borderColor = '#e2e8f0';
  chart.borderWidth = 1;
  chart.height = 68;
  chart.stretchToFit = true;
  chart.backgroundColor = Color.white;
  chart.altText = altText;
  chart.data = data;
  return chart;
}

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  function pageFooter() {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF - Bullet Chart');
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
  metadata.title = 'Bullet Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Bullet chart example - executive KPI gauges with qualitative bands and targets';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Bullet Chart: Executive KPI Scorecard');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(
    'Compact KPI gauges with qualitative background ranges, primary measure bars, and target markers'
  );
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 24);
  doc.add(subtitle);

  const stack = new VerticalStack();
  stack.spacing = 20;

  const row1 = new HorizontalStack();
  row1.spacing = 16;
  row1.widthDistribution = WidthDistribution.Weighted;
  const b1 = new BulletChart();
  b1.theme = 'modern';
  b1.label = 'Revenue (£k)';
  b1.value = 275;
  b1.target = 250;
  b1.ranges = [{ max: 150 }, { max: 225 }, { max: 300 }];
  b1.showScale = true;
  b1.showValueLabel = true;
  b1.valuePrefix = '£';
  b1.valueSuffix = 'k';
  b1.borderRadius = 6;
  b1.borderColor = '#e2e8f0';
  b1.borderWidth = 1;
  b1.width = 520;
  b1.height = 68;
  b1.stretchToFit = true;
  b1.backgroundColor = Color.white;
  b1.altText = 'Bullet chart showing revenue at 275k against a 250k target.';
  row1.add(b1, 3);
  row1.add(
    kpiSparkline(
      '#2563eb',
      250,
      [195, 204, 212, 208, 224, 236, 241, 248, 255, 262, 269, 275],
      'Twelve-month revenue sparkline rising from 195k to 275k against a 250k target.'
    ),
    1
  );
  stack.add(row1);

  const row2 = new HorizontalStack();
  row2.spacing = 16;
  row2.widthDistribution = WidthDistribution.Weighted;
  const b2 = new BulletChart();
  b2.theme = 'modern';
  b2.label = 'Gross Margin';
  b2.value = 74;
  b2.target = 78;
  b2.ranges = [{ max: 50 }, { max: 75 }, { max: 100 }];
  b2.showScale = true;
  b2.showValueLabel = true;
  b2.valueSuffix = '%';
  b2.measureColor = Color.fromHex('#0d9488');
  b2.borderRadius = 6;
  b2.borderColor = '#e2e8f0';
  b2.borderWidth = 1;
  b2.width = 520;
  b2.height = 68;
  b2.stretchToFit = true;
  b2.backgroundColor = Color.white;
  b2.altText = 'Bullet chart showing gross margin at 74% against a 78% target.';
  row2.add(b2, 3);
  row2.add(
    kpiSparkline(
      '#0d9488',
      78,
      [68, 69, 71, 70, 72, 73, 71, 72, 73, 75, 74, 74],
      'Twelve-month gross margin sparkline trending from 68% to 74% against a 78% target.'
    ),
    1
  );
  stack.add(row2);

  const row3 = new HorizontalStack();
  row3.spacing = 16;
  row3.widthDistribution = WidthDistribution.Weighted;
  const b3 = new BulletChart();
  b3.theme = 'modern';
  b3.label = 'Net Promoter';
  b3.value = 64;
  b3.target = 60;
  b3.ranges = [{ max: 30 }, { max: 55 }, { max: 80 }];
  b3.showScale = true;
  b3.showValueLabel = true;
  b3.measureColor = Color.fromHex('#7c3aed');
  b3.borderRadius = 6;
  b3.borderColor = '#e2e8f0';
  b3.borderWidth = 1;
  b3.width = 520;
  b3.height = 68;
  b3.stretchToFit = true;
  b3.backgroundColor = Color.white;
  b3.altText = 'Bullet chart showing Net Promoter Score at 64 against a target of 60.';
  row3.add(b3, 3);
  row3.add(
    kpiSparkline(
      '#7c3aed',
      60,
      [51, 53, 52, 55, 57, 58, 59, 61, 60, 62, 63, 64],
      'Twelve-month Net Promoter Score sparkline climbing from 51 to 64 against a 60 target.'
    ),
    1
  );
  stack.add(row3);

  doc.add(stack);

  return doc;
}
