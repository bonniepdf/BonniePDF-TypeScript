import { Document, DocumentSettings, DocumentMetadata, PdfSize, PdfVersion, PageOrientation, TextBlock, TextElementBase, TextAlignment, HorizontalStack, Color, Thickness, StandardFonts, WidthDistribution, ChartData, ChartSeries, ChartDataPoint, ChartElement, PieChart } from '@bonniepdf/core'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_COLORS = ['#4f46e5','#7c3aed','#a855f7','#d946ef','#ec4899','#f43f5e','#f97316','#eab308','#84cc16','#22c55e','#14b8a6','#06b6d4'];

export function generate(): Document {
  const year = new Date().getFullYear();

  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.version     = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;
    const left = new TextBlock('BonniePDF — Pie Chart');
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
  metadata.title   = 'Pie Chart';
  metadata.author  = 'BonniePDF';
  metadata.subject = 'Pie / donut chart example — monthly sales breakdown with legend and centre total';

  const doc = new Document(settings, metadata);

  const title = new TextBlock(`Pie Chart: Monthly Sales ${year}`);
  title.fontSize  = 24;
  title.textColor = Color.slate800;
  title.alignment = TextAlignment.Center;
  title.margin    = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const subtitle = new TextBlock('Donut chart with legend and total value in the centre');
  subtitle.fontSize  = 14;
  subtitle.textColor = Color.slate600;
  subtitle.alignment = TextAlignment.Center;
  subtitle.margin    = new Thickness(0, 0, 0, 20);
  doc.add(subtitle);

  const values = [7234, 4891, 8456, 3127, 9542, 6789, 5234, 8901, 2456, 7890, 6123, 9876];
  const s = new ChartSeries();
  s.color      = Color.fromHex('#4f46e5');
  s.dataPoints = MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint(); p.label = label; p.value = values[i]; return p;
  });

  const data = new ChartData();
  data.title  = `Monthly Sales ${year}`;
  data.series = [s];

  const chart = new PieChart();
  chart.height          = 380;
  chart.stretchToFit    = true;
  chart.isDonut         = true;
  chart.totalLabel      = 'Total';
  chart.showLegend      = true;
  chart.colors          = ALL_COLORS;
  chart.backgroundColor = Color.white;

  doc.add(new ChartElement(chart, data));

  return doc;
}