import { Document, DocumentSettings, DocumentMetadata, PdfSize, PdfVersion, PageOrientation, TextBlock, TextElementBase, TextAlignment, HorizontalStack, Color, Thickness, StandardFonts, WidthDistribution, ChartData, ChartSeries, ChartDataPoint, ChartElement, LineChart } from '@bonniepdf/core'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function makeSeries(values: number[], color: string, name: string): ChartSeries {
  const s = new ChartSeries();
  s.color      = Color.fromHex(color);
  s.name       = name;
  s.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint(); p.label = label; p.value = values[i]; return p;
  });
  return s;
}

export function generate(): Document {
  const year = new Date().getFullYear();

  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.version     = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF — Multi-Series Line Chart');
    left.fontName  = StandardFonts.Helvetica;
    left.fontSize  = 10;
    left.textColor = Color.slate500;
    stack.addChild(left);
    const right = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    right.fontName  = StandardFonts.Helvetica;
    right.fontSize  = 10;
    right.textColor = Color.slate500;
    right.alignment = TextAlignment.Right;
    stack.addChild(right, 1);
    return stack;
  };

  const metadata = new DocumentMetadata();
  metadata.title   = 'Multi-Series Line Chart';
  metadata.author  = 'BonniePDF';
  metadata.subject = `Year-over-year revenue comparison — ${year - 1} vs ${year} on a shared axis`;

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Multi-Series Line Chart: Year-over-Year Comparison');
  title.fontSize  = 24;
  title.textColor = Color.slate800;
  title.alignment = TextAlignment.Center;
  title.margin    = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock(`Comparing ${year - 1} and ${year} revenue with a shared axis`);
  subtitle.fontSize  = 14;
  subtitle.textColor = Color.slate600;
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin    = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const data = new ChartData();
  data.title  = 'Year-over-Year Revenue Comparison';
  data.series = [
    makeSeries([65000,69000,80000,72000,85000,88000,72000,68000,75000,81000,92000,105000], '#4f46e5', String(year - 1)),
    makeSeries([75000,78000,85000,78000,92000,95000,87000,78000,82000,91000,97000,118000], '#7c3aed', String(year)),
  ];
  data.yAxis.prefix    = '£';
  data.yAxis.maxValue  = 150000;
  data.yAxis.stepCount = 5;
  data.yAxis.legend    = 'Revenue';
  data.xAxis.legend    = 'Month';

  const chart = new LineChart();
  chart.height               = 380;
  chart.stretchToFit         = true;
  chart.fontFamily           = 'Arial, sans-serif';
  chart.labelFontSize        = 9;
  chart.showValueLabels      = true;
  chart.showDataPointMarkers = true;
  chart.backgroundColor      = Color.fromHex('#fafafa');

  doc.add(new ChartElement(chart, data));

  return doc;
}