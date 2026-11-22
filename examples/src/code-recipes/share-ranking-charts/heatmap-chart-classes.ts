/**
 * Heatmap Chart (Class API).
 * The same monthly cohort retention heatmap chart as Heatmap Chart, built with the class API: construct each chart model and assign properties. The output is identical.
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
  HeatmapChart,
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
    const left = new TextBlock('BonniePDF - Heatmap Chart');
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
  metadata.title = 'Heatmap Chart';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Heatmap chart example - 2D cohort retention matrix with auto-contrast cell labels';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Heatmap Chart: Monthly Cohort Retention');
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.alignment = TextAlignment.Center;
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(
    '2D matrix colour ramp with missing cells, continuous legend, and WCAG auto-contrast values'
  );
  subtitle.fontSize = 14;
  subtitle.color = ColorPalette.slate[600];
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const chart = new HeatmapChart();
  chart.theme = 'modern';
  chart.title = 'Cohort Retention (%)';
  chart.xCategories = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'];
  chart.yCategories = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  chart.values = [
    [100, 84, 76, 71, 68, 65],
    [100, 86, 79, 74, 70, null],
    [100, 88, 82, 77, null, null],
    [100, 90, 84, null, null, null],
    [100, 91, null, null, null, null],
  ];
  chart.valueSuffix = '%';
  chart.altText =
    'Cohort retention heatmap from January to May across months M0 through M5, showing retention improving from 84% in January M1 to 91% in May M1.';
  chart.height = 380;
  chart.stretchToFit = true;
  chart.backgroundColor = Color.white;
  doc.add(chart);

  return doc;
}
