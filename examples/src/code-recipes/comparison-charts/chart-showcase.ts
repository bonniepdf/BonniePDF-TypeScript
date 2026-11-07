/**
 * Chart Examples.
 * Eight landscape pages covering every chart type, from bar and line to pie and lollipop charts, each chart carrying alt text for screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
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
    stack.add(
      new TextBlock('BonniePDF Charting Examples', {
        fontName: StandardFonts.Helvetica,
        fontSize: 10,
        color: 'slate-500',
      })
    );
    stack.add(
      pageNumber(undefined, {
        fontName: StandardFonts.Helvetica,
        fontSize: 10,
        color: 'slate-500',
        alignment: 'right',
      }),
      1
    );
    return stack;
  }

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
      footerTemplate: pageTemplate({ default: pageFooter() }),
    },
    metadata: {
      title: 'Charting Examples',
      author: 'BonniePDF',
      subject: 'Charting Examples demonstrating all chart types',
    },
  });

  // ── Bar chart ──
  pageHeader(
    doc,
    'Bar Chart: Monthly Sales Report',
    'Rounded gradient bars, clear value labels and a modern chart theme'
  );
  doc.add(
    new BarChart({
      theme: 'modern',
      barStyle: { cornerRadius: 6, gradient: { startColor: '#60a5fa', endColor: C_BLUE, scope: 'bar' } },
      data: new ChartData({
        title: 'Monthly Sales',
        series: [
          {
            color: C_BLUE,
            dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
          },
        ],
        yAxis: { prefix: '£', maxValue: 15000, stepCount: 5 },
      }),
      altText: 'Bar chart of monthly sales from January to December, rising from 4,500 to 12,800 GBP.',
      height: 400,
      stretchToFit: true,
      barColor: C_BLUE,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Grouped bar chart ──
  pageHeader(doc, 'Grouped Bar Chart: Monthly Revenue', 'Comparison of three product lines across all months');
  doc.add(
    new GroupedBarChart({
      theme: 'modern',
      barStyle: { cornerRadius: 3 },
      data: new ChartData({
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
      }),
      altText: 'Grouped bar chart comparing Electronics, Clothing, and Home and Garden sales across twelve months.',
      height: 400,
      stretchToFit: true,
      showValueLabels: true,
      fontFamily: StandardFonts.Helvetica,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Line chart ──
  pageHeader(doc, 'Line Chart: Monthly Revenue Trends', 'Connected data points with markers and value labels');
  doc.add(
    new LineChart({
      theme: 'modern',
      data: new ChartData({
        title: 'Monthly Revenue',
        series: [
          {
            color: C_VIOLET,
            dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
          },
        ],
        yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Revenue' },
        xAxis: { legend: 'Month' },
      }),
      altText: 'Line chart of monthly revenue from January to December, ending at 12,800 GBP.',
      height: 400,
      stretchToFit: true,
      lineColor: C_VIOLET,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      showValueLabels: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Area chart ──
  pageHeader(doc, 'Area Chart: Monthly Sales Performance', 'Filled area under the line with configurable opacity');
  doc.add(
    new AreaChart({
      theme: 'modern',
      data: new ChartData({
        title: 'Monthly Sales',
        series: [
          {
            color: C_TEAL,
            dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
          },
        ],
        yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Sales' },
        xAxis: { legend: 'Month' },
      }),
      altText: 'Area chart of monthly sales from January to December, with a filled trend rising to 12,800 GBP.',
      height: 400,
      stretchToFit: true,
      areaColor: C_TEAL,
      fillOpacity: 0.3,
      lineWidth: 2.5,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      showValueLabels: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Lollipop chart ──
  pageHeader(doc, 'Lollipop Chart: Quarterly Metrics', 'Stems with circular heads - clear and minimal bar alternative');
  doc.add(
    new LollipopChart({
      theme: 'modern',
      data: new ChartData({
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
      }),
      altText: 'Lollipop chart of quarterly revenue, increasing from 4,500 GBP in Q1 to 11,500 GBP in Q4.',
      height: 400,
      stretchToFit: true,
      lollipopColor: C_VIOLET,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      showValueLabels: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Dot plot chart ──
  pageHeader(doc, 'Dot Plot Chart: Product Performance', 'Circular markers positioned along a value axis');
  doc.add(
    new DotPlotChart({
      theme: 'modern',
      data: new ChartData({
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
      }),
      altText: 'Dot plot comparing eight product sales values, ranging from 4,500 to 9,500 GBP.',
      height: 400,
      stretchToFit: true,
      dotColor: C_TEAL,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      showValueLabels: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Pie / donut chart ──
  pageHeader(
    doc,
    `Doughnut Chart: Revenue Mix ${year}`,
    'Four product lines, a coordinated palette and a clear revenue breakdown'
  );
  doc.add(
    new PieChart({
      theme: 'modern',
      data: new ChartData({
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
      }),
      altText: `Doughnut chart showing ${year} product revenue: Enterprise £910,000, Professional £650,000, Starter £446,000 and Services £222,000.`,
      height: 400,
      stretchToFit: true,
      isDonut: true,
      totalLabel: 'Total revenue (GBP)',
      totalValueFormat: 'N0',
      showLegend: true,
      colors: ALL_COLORS,
      backgroundColor: '#ffffff',
    })
  );

  doc.addPage();

  // ── Multi-series line chart ──
  pageHeader(
    doc,
    'Multi-Series Line Chart: Year-over-Year Comparison',
    `Comparing ${year - 1} and ${year} revenue with multiple series`
  );
  doc.add(
    new LineChart({
      theme: 'modern',
      data: new ChartData({
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
      }),
      altText: `Multi-series line chart comparing monthly revenue for ${year - 1} and ${year}.`,
      height: 400,
      stretchToFit: true,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      showValueLabels: true,
      backgroundColor: CHART_BG,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

/** Adds a left-aligned title and subtitle above a chart page. */
function pageHeader(doc: Document, title: string, subtitle: string): void {
  doc.add(
    new TextBlock(title, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: '#0f172a',
      alignment: 'left',
      margin: { bottom: 10 },
    })
  );
  doc.add(new TextBlock(subtitle, { fontSize: 11, color: 'slate-600', alignment: 'left', margin: { bottom: 20 } }));
}
