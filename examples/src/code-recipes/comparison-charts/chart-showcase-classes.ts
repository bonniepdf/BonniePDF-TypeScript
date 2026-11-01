/**
 * Chart Examples (Class API).
 * Eight landscape pages covering every chart type, from bar and line to pie and lollipop charts, each chart carrying alt text for screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  BarChart,
  LineChart,
  AreaChart,
  LollipopChart,
  DotPlotChart,
  GroupedBarChart,
  PieChart,
  StandardFonts,
  pageTemplate,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PageOrientation,
  PdfAConformance,
  AccessibilityMode,
  TextStyle,
  ColorPalette,
} from '@bonniepdf/core';
// Coordinated accents for readable comparisons.
const C_BLUE = '#2563eb';
const C_VIOLET = '#7c3aed';
const C_TEAL = '#0d9488';
const ALL_COLORS = ['#2563eb', '#0d9488', '#7c3aed', '#d97706'];
// ── Shared data ──────────────────────────────────────────────────────────────
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_BG = '#ffffff';
/** Twelve monthly data points from a values array. */
const months = (values: number[]) => MONTH_LABELS.map((label, i) => ({ label, value: values[i], labelFormat: 'N0' }));
// ── Entry point ──────────────────────────────────────────────────────────────
export function generate(): Document {
  const year = new Date().getFullYear();
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    const textBlock1 = new TextBlock('BonniePDF Charting Examples');
    textBlock1.fontName = StandardFonts.Helvetica;
    textBlock1.fontSize = 10;
    textBlock1.color = 'slate-500';
    stack.add(textBlock1);
    const textBlock2 = new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`);
    textBlock2.fontName = StandardFonts.Helvetica;
    textBlock2.fontSize = 10;
    textBlock2.color = 'slate-500';
    textBlock2.alignment = 'right';
    stack.add(textBlock2, 1);
    return stack;
  }
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);
  settings.footerTemplate = pageTemplate({ default: pageFooter() });
  const metadata = new DocumentMetadata();
  metadata.title = 'Charting Examples';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Charting Examples demonstrating all chart types';
  const doc = new Document(settings, metadata);
  // ── Bar chart ──
  pageHeader(
    doc,
    'Bar Chart: Monthly Sales Report',
    'Rounded gradient bars, clear value labels and a modern chart theme'
  );
  const barChart3 = new BarChart();
  barChart3.theme = 'modern';
  barChart3.barStyle = { cornerRadius: 6, gradient: { startColor: '#60a5fa', endColor: C_BLUE, scope: 'bar' } };
  barChart3.data = new ChartData({
    title: 'Monthly Sales',
    series: [
      {
        color: C_BLUE,
        dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
      },
    ],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5 },
  });
  barChart3.altText = 'Bar chart of monthly sales from January to December, rising from 4,500 to 12,800 GBP.';
  barChart3.height = 400;
  barChart3.stretchToFit = true;
  barChart3.barColor = C_BLUE;
  barChart3.fontFamily = StandardFonts.Helvetica;
  barChart3.labelFontSize = 9;
  barChart3.backgroundColor = CHART_BG;
  doc.add(barChart3);
  doc.addPage();
  // ── Grouped bar chart ──
  pageHeader(doc, 'Grouped Bar Chart: Monthly Revenue', 'Comparison of three product lines across all months');
  const groupedBarChart4 = new GroupedBarChart();
  groupedBarChart4.theme = 'modern';
  groupedBarChart4.barStyle = { cornerRadius: 3 };
  groupedBarChart4.data = new ChartData({
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5 },
    series: [
      {
        name: 'Electronics',
        color: C_BLUE,
        dataPoints: months([4500, 5200, 4800, 6200, 7500, 8100, 7200, 6800, 8500, 9200, 10500, 11800]),
      },
      {
        name: 'Clothing',
        color: C_TEAL,
        dataPoints: months([3200, 3800, 3500, 4200, 4800, 5200, 4600, 4400, 5100, 5800, 6400, 7200]),
      },
      {
        name: 'Home & Garden',
        color: C_VIOLET,
        dataPoints: months([2800, 3400, 3100, 3800, 4400, 4800, 4200, 4000, 4700, 5400, 6000, 6800]),
      },
    ],
  });
  groupedBarChart4.altText =
    'Grouped bar chart comparing Electronics, Clothing, and Home and Garden sales across twelve months.';
  groupedBarChart4.height = 400;
  groupedBarChart4.stretchToFit = true;
  groupedBarChart4.showValueLabels = true;
  groupedBarChart4.fontFamily = StandardFonts.Helvetica;
  groupedBarChart4.backgroundColor = CHART_BG;
  doc.add(groupedBarChart4);
  doc.addPage();
  // ── Line chart ──
  pageHeader(doc, 'Line Chart: Monthly Revenue Trends', 'Connected data points with markers and value labels');
  const lineChart5 = new LineChart();
  lineChart5.theme = 'modern';
  lineChart5.data = new ChartData({
    title: 'Monthly Revenue',
    series: [
      {
        color: C_VIOLET,
        dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
      },
    ],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Revenue' },
    xAxis: { legend: 'Month' },
  });
  lineChart5.altText = 'Line chart of monthly revenue from January to December, ending at 12,800 GBP.';
  lineChart5.height = 400;
  lineChart5.stretchToFit = true;
  lineChart5.lineColor = C_VIOLET;
  lineChart5.fontFamily = StandardFonts.Helvetica;
  lineChart5.labelFontSize = 9;
  lineChart5.showValueLabels = true;
  lineChart5.backgroundColor = CHART_BG;
  doc.add(lineChart5);
  doc.addPage();
  // ── Area chart ──
  pageHeader(doc, 'Area Chart: Monthly Sales Performance', 'Filled area under the line with configurable opacity');
  const areaChart6 = new AreaChart();
  areaChart6.theme = 'modern';
  areaChart6.data = new ChartData({
    title: 'Monthly Sales',
    series: [
      {
        color: C_TEAL,
        dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
      },
    ],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Sales' },
    xAxis: { legend: 'Month' },
  });
  areaChart6.altText =
    'Area chart of monthly sales from January to December, with a filled trend rising to 12,800 GBP.';
  areaChart6.height = 400;
  areaChart6.stretchToFit = true;
  areaChart6.areaColor = C_TEAL;
  areaChart6.fillOpacity = 0.3;
  areaChart6.lineWidth = 2.5;
  areaChart6.fontFamily = StandardFonts.Helvetica;
  areaChart6.labelFontSize = 9;
  areaChart6.showValueLabels = true;
  areaChart6.backgroundColor = CHART_BG;
  doc.add(areaChart6);
  doc.addPage();
  // ── Lollipop chart ──
  pageHeader(doc, 'Lollipop Chart: Quarterly Metrics', 'Stems with circular heads - clear and minimal bar alternative');
  const lollipopChart7 = new LollipopChart();
  lollipopChart7.theme = 'modern';
  lollipopChart7.data = new ChartData({
    title: 'Quarterly Revenue',
    series: [
      {
        color: C_VIOLET,
        dataPoints: ['Q1', 'Q2', 'Q3', 'Q4'].map((label, i) => ({
          label,
          value: [4500, 6200, 8500, 11500][i],
          labelFormat: 'N0',
        })),
      },
    ],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Revenue' },
    xAxis: { legend: 'Quarter' },
  });
  lollipopChart7.altText = 'Lollipop chart of quarterly revenue, increasing from 4,500 GBP in Q1 to 11,500 GBP in Q4.';
  lollipopChart7.height = 400;
  lollipopChart7.stretchToFit = true;
  lollipopChart7.lollipopColor = C_VIOLET;
  lollipopChart7.fontFamily = StandardFonts.Helvetica;
  lollipopChart7.labelFontSize = 9;
  lollipopChart7.showValueLabels = true;
  lollipopChart7.backgroundColor = CHART_BG;
  doc.add(lollipopChart7);
  doc.addPage();
  // ── Dot plot chart ──
  pageHeader(doc, 'Dot Plot Chart: Product Performance', 'Circular markers positioned along a value axis');
  const dotPlotChart8 = new DotPlotChart();
  dotPlotChart8.theme = 'modern';
  dotPlotChart8.data = new ChartData({
    title: 'Product Sales',
    series: [
      {
        color: C_TEAL,
        dataPoints: ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E', 'Prod F', 'Prod G', 'Prod H'].map(
          (label, i) => ({ label, value: [4500, 6200, 5800, 7200, 8500, 9100, 8200, 9500][i], labelFormat: 'N0' })
        ),
      },
    ],
    yAxis: { prefix: '£', maxValue: 12000, stepCount: 5, legend: 'Sales' },
    xAxis: { legend: 'Product' },
  });
  dotPlotChart8.altText = 'Dot plot comparing eight product sales values, ranging from 4,500 to 9,500 GBP.';
  dotPlotChart8.height = 400;
  dotPlotChart8.stretchToFit = true;
  dotPlotChart8.dotColor = C_TEAL;
  dotPlotChart8.fontFamily = StandardFonts.Helvetica;
  dotPlotChart8.labelFontSize = 9;
  dotPlotChart8.showValueLabels = true;
  dotPlotChart8.backgroundColor = CHART_BG;
  doc.add(dotPlotChart8);
  doc.addPage();
  // ── Pie / donut chart ──
  pageHeader(
    doc,
    `Doughnut Chart: Revenue Mix ${year}`,
    'Four product lines, a coordinated palette and a clear revenue breakdown'
  );
  const pieChart9 = new PieChart();
  pieChart9.theme = 'modern';
  pieChart9.data = new ChartData({
    title: `Product Revenue ${year}`,
    series: [
      {
        color: C_BLUE,
        dataPoints: ['Enterprise', 'Professional', 'Starter', 'Services'].map((label, i) => ({
          label,
          value: [910000, 650000, 446000, 222000][i],
          labelFormat: 'N0',
        })),
      },
    ],
  });
  pieChart9.altText = `Doughnut chart showing ${year} product revenue: Enterprise £910,000, Professional £650,000, Starter £446,000 and Services £222,000.`;
  pieChart9.height = 400;
  pieChart9.stretchToFit = true;
  pieChart9.isDonut = true;
  pieChart9.totalLabel = 'Total revenue (GBP)';
  pieChart9.totalValueFormat = 'N0';
  pieChart9.showLegend = true;
  pieChart9.colors = ALL_COLORS;
  pieChart9.backgroundColor = '#ffffff';
  doc.add(pieChart9);
  doc.addPage();
  // ── Multi-series line chart ──
  pageHeader(
    doc,
    'Multi-Series Line Chart: Year-over-Year Comparison',
    `Comparing ${year - 1} and ${year} revenue with multiple series`
  );
  const lineChart10 = new LineChart();
  lineChart10.theme = 'modern';
  lineChart10.data = new ChartData({
    title: 'Year-over-Year Revenue Comparison',
    series: [
      {
        name: String(year - 1),
        color: C_BLUE,
        dataPoints: months([65000, 69000, 80000, 72000, 85000, 88000, 72000, 68000, 75000, 81000, 92000, 105000]),
      },
      {
        name: String(year),
        color: C_VIOLET,
        dataPoints: months([75000, 78000, 85000, 78000, 92000, 95000, 87000, 78000, 82000, 91000, 97000, 118000]),
      },
    ],
    yAxis: { prefix: '£', maxValue: 150000, stepCount: 5, legend: 'Revenue' },
    xAxis: { legend: 'Month' },
  });
  lineChart10.altText = `Multi-series line chart comparing monthly revenue for ${year - 1} and ${year}.`;
  lineChart10.height = 400;
  lineChart10.stretchToFit = true;
  lineChart10.fontFamily = StandardFonts.Helvetica;
  lineChart10.labelFontSize = 9;
  lineChart10.showValueLabels = true;
  lineChart10.backgroundColor = CHART_BG;
  doc.add(lineChart10);
  return doc;
}
// Local helpers and sample types used by this document.
/** Adds a left-aligned title and subtitle above a chart page. */
function pageHeader(doc: Document, title: string, subtitle: string): void {
  const textBlock11 = new TextBlock(title);
  textBlock11.fontName = StandardFonts.HelveticaBold;
  textBlock11.fontSize = 22;
  textBlock11.color = '#0f172a';
  textBlock11.alignment = 'left';
  textBlock11.margin = { bottom: 10 };
  doc.add(textBlock11);
  const textBlock12 = new TextBlock(subtitle);
  textBlock12.fontSize = 11;
  textBlock12.color = 'slate-600';
  textBlock12.alignment = 'left';
  textBlock12.margin = { bottom: 20 };
  doc.add(textBlock12);
}
