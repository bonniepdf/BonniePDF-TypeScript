/**
 * Chart Examples (Class API).
 * Seventeen landscape pages covering all 14 chart families, from bar and line to stacked, combo, waterfall, scatter, bullet, and heatmap charts, each carrying alt text for screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  VerticalStack,
  ChartData,
  BarChart,
  LineChart,
  AreaChart,
  LollipopChart,
  DotPlotChart,
  GroupedBarChart,
  PieChart,
  StackedBarChart,
  StackedAreaChart,
  ComboChart,
  WaterfallChart,
  ScatterChart,
  BulletChart,
  HeatmapChart,
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
export function generate(
  _assets?: ReadonlyMap<string, Uint8Array>,
  context: { now?: Date; locale?: string; timeZone?: string } = {}
): Document {
  const now = context.now ?? new Date();
  const year = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: context.timeZone }).format(now)) - 1;
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    const textBlock1 = new TextBlock('BonniePDF Charting Examples');
    textBlock1.fontName = StandardFonts.Helvetica;
    textBlock1.fontSize = 10;
    textBlock1.color = 'slate-500';
    stack.add(textBlock1);
    const textBlock2 = pageNumber();
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
    'Rounded gradient bars, annotated target reference line and a modern chart theme'
  );
  const barChart3 = new BarChart();
  barChart3.theme = 'modern';
  barChart3.autoLayout = true;
  barChart3.barStyle = { cornerRadius: 6, gradient: { startColor: '#60a5fa', endColor: C_BLUE, scope: 'bar' } };
  barChart3.references = [
    {
      value: 9000,
      label: 'Target £9k',
      labelPosition: 'end',
      labelBackgroundColor: '#fef3c7',
      color: '#d97706',
      thickness: 1.5,
      dashPattern: [5, 3],
    },
  ];
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
  pageHeader(doc, 'Line Chart: Monthly Revenue Trends', 'Smooth monotone spline with haloed markers and value labels');
  const lineChart5 = new LineChart();
  lineChart5.theme = 'modern';
  lineChart5.curve = 'smooth';
  lineChart5.defaultMarkerHaloWidth = 1.5;
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
  pageHeader(doc, 'Area Chart: Monthly Sales Performance', 'Smooth curve with vertical area fade gradient');
  const areaChart6 = new AreaChart();
  areaChart6.theme = 'modern';
  areaChart6.curve = 'smooth';
  areaChart6.areaGradient = true;
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
    'Radial-elbow callout labels, gradient slices, centre total and rich legend formatting'
  );
  const pieChart9 = new PieChart();
  pieChart9.theme = 'modern';
  pieChart9.sliceGradient = true;
  pieChart9.sliceBorderWidth = 1.5;
  pieChart9.donutHoleRatio = 0.56;
  pieChart9.sliceLabelMode = 'callout';
  pieChart9.legendFormat = 'labelValuePercent';
  pieChart9.totalPosition = 'center';
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
    `Comparing ${year - 1} and ${year} revenue with smooth curves, per-series dash patterns and marker shapes`
  );
  const lineChart10 = new LineChart();
  lineChart10.theme = 'modern';
  lineChart10.autoLayout = true;
  lineChart10.curve = 'smooth';
  lineChart10.legendPosition = 'top';
  lineChart10.showValueLabels = false;
  lineChart10.data = new ChartData({
    title: 'Year-over-Year Revenue Comparison',
    series: [
      {
        name: String(year - 1),
        color: C_BLUE,
        style: { dashPattern: [6, 3], markerShape: 'diamond', markerFill: 'hollow', markerRadius: 4 },
        dataPoints: months([65000, 69000, 80000, 72000, 85000, 88000, 72000, 68000, 75000, 81000, 92000, 105000]),
      },
      {
        name: String(year),
        color: C_VIOLET,
        style: { lineWidth: 2.5, markerShape: 'circle', markerHaloWidth: 1.5, markerRadius: 4.5 },
        dataPoints: months([75000, 78000, 85000, 78000, 92000, 95000, 87000, 78000, 82000, 91000, 97000, 118000]),
      },
    ],
    yAxis: { prefix: '£', valueFormat: 'K0', maxValue: 150000, stepCount: 5, legend: 'Revenue' },
    xAxis: { legend: 'Month' },
  });
  lineChart10.altText = `Multi-series line chart comparing monthly revenue for ${year - 1} and ${year}.`;
  lineChart10.height = 400;
  lineChart10.stretchToFit = true;
  lineChart10.fontFamily = StandardFonts.Helvetica;
  lineChart10.labelFontSize = 9;
  lineChart10.backgroundColor = CHART_BG;
  doc.add(lineChart10);

  doc.addPage();
  pageHeader(
    doc,
    'Stacked Bar Chart: Revenue Mix by Channel',
    'Multi-series stacking with compact K totals, segment gaps and auto-contrast inside labels'
  );
  const stackedBar = new StackedBarChart();
  stackedBar.theme = 'modern';
  stackedBar.mode = 'absolute';
  stackedBar.showStackTotals = true;
  stackedBar.stackTotalFormat = 'K0';
  stackedBar.valueLabelFormat = 'K0';
  stackedBar.valueLabelPrefix = '£';
  stackedBar.segmentGap = 1.5;
  stackedBar.data = new ChartData({
    title: 'Quarterly Revenue Mix',
    yAxis: { prefix: '£', valueFormat: 'K0' },
    series: [
      {
        name: 'Direct',
        dataPoints: [
          { label: 'Q1', value: 180000 },
          { label: 'Q2', value: 215000 },
          { label: 'Q3', value: 248000 },
          { label: 'Q4', value: 292000 },
        ],
      },
      {
        name: 'Partner',
        dataPoints: [
          { label: 'Q1', value: 95000 },
          { label: 'Q2', value: 112000 },
          { label: 'Q3', value: 128000 },
          { label: 'Q4', value: 146000 },
        ],
      },
      {
        name: 'Self-serve',
        dataPoints: [
          { label: 'Q1', value: 64000 },
          { label: 'Q2', value: 78000 },
          { label: 'Q3', value: 94000 },
          { label: 'Q4', value: 118000 },
        ],
      },
    ],
  });
  stackedBar.altText =
    'Stacked bar chart showing quarterly revenue split across Direct, Partner, and Self-serve channels.';
  stackedBar.height = 400;
  stackedBar.stretchToFit = true;
  stackedBar.backgroundColor = CHART_BG;
  doc.add(stackedBar);

  doc.addPage();
  pageHeader(
    doc,
    'Stacked Area Chart: Platform Traffic Share',
    '100% normalized smooth stacked area bands with inline series labels'
  );
  const stackedArea = new StackedAreaChart();
  stackedArea.theme = 'modern';
  stackedArea.mode = 'percent';
  stackedArea.curve = 'smooth';
  stackedArea.legendPosition = 'inline';
  stackedArea.data = new ChartData({
    title: 'Traffic Share (%)',
    yAxis: { suffix: '%' },
    series: [
      {
        name: 'Web',
        dataPoints: [
          { label: 'Q1', value: 58 },
          { label: 'Q2', value: 54 },
          { label: 'Q3', value: 50 },
          { label: 'Q4', value: 47 },
        ],
      },
      {
        name: 'Mobile',
        dataPoints: [
          { label: 'Q1', value: 30 },
          { label: 'Q2', value: 33 },
          { label: 'Q3', value: 36 },
          { label: 'Q4', value: 38 },
        ],
      },
      {
        name: 'API',
        dataPoints: [
          { label: 'Q1', value: 12 },
          { label: 'Q2', value: 13 },
          { label: 'Q3', value: 14 },
          { label: 'Q4', value: 15 },
        ],
      },
    ],
  });
  stackedArea.altText =
    '100% stacked area chart showing platform traffic share shifting from Web toward Mobile and API.';
  stackedArea.height = 400;
  stackedArea.stretchToFit = true;
  stackedArea.backgroundColor = CHART_BG;
  doc.add(stackedArea);

  doc.addPage();
  pageHeader(
    doc,
    'Combo Chart: Revenue vs. Gross Margin',
    'Primary revenue bars paired with a smooth gross-margin percentage line on a secondary Y axis'
  );
  const combo = new ComboChart();
  combo.theme = 'modern';
  combo.showValueLabels = false;
  combo.legendPosition = 'top';
  combo.secondaryYAxis = { minValue: 50, maxValue: 90, suffix: '%', valueFormat: 'F0' };
  combo.data = new ChartData({
    title: 'Quarterly Revenue & Gross Margin',
    yAxis: { prefix: '£', valueFormat: 'K0' },
    series: [
      {
        name: 'Revenue',
        seriesType: 'bar',
        valueAxis: 'primary',
        dataPoints: [
          { label: 'Q1', value: 420000 },
          { label: 'Q2', value: 485000 },
          { label: 'Q3', value: 540000 },
          { label: 'Q4', value: 635000 },
        ],
      },
      {
        name: 'Gross Margin',
        seriesType: 'line',
        valueAxis: 'secondary',
        color: '#f59e0b',
        style: { curve: 'smooth', lineWidth: 2.5, markerFill: 'hollow', markerHaloWidth: 1.5 },
        dataPoints: [
          { label: 'Q1', value: 68 },
          { label: 'Q2', value: 71 },
          { label: 'Q3', value: 74 },
          { label: 'Q4', value: 79 },
        ],
      },
    ],
  });
  combo.altText = 'Combo chart comparing quarterly revenue bars against gross margin percentage on a secondary axis.';
  combo.height = 400;
  combo.stretchToFit = true;
  combo.backgroundColor = CHART_BG;
  doc.add(combo);

  doc.addPage();
  pageHeader(
    doc,
    'Waterfall Chart: ARR Movement Bridge',
    'Cumulative variance bridge with positive/negative deltas, auto-computed ending total and connectors'
  );
  const waterfall = new WaterfallChart();
  waterfall.theme = 'modern';
  waterfall.valueLabelPrefix = '£';
  waterfall.valueLabelFormat = 'K1';
  waterfall.data = new ChartData({
    title: 'Annual Recurring Revenue Bridge',
    yAxis: { prefix: '£', valueFormat: 'K1' },
    series: [
      {
        name: 'ARR',
        dataPoints: [
          { label: 'Start', value: 800000, kind: 'total' },
          { label: 'New', value: 260000, kind: 'delta' },
          { label: 'Expansion', value: 135000, kind: 'delta' },
          { label: 'Churn', value: -85000, kind: 'delta' },
          { label: 'Contraction', value: -40000, kind: 'delta' },
          { label: 'Ending', kind: 'total' },
        ],
      },
    ],
  });
  waterfall.altText =
    'Waterfall bridge from 800k starting ARR through new business, expansion, churn and contraction to 1.07M.';
  waterfall.height = 400;
  waterfall.stretchToFit = true;
  waterfall.backgroundColor = CHART_BG;
  doc.add(waterfall);

  doc.addPage();
  pageHeader(
    doc,
    'Scatter Chart: Latency vs. Throughput',
    'Continuous numeric X/Y coordinates with area-scaled bubbles and OLS linear trendline'
  );
  const scatter = new ScatterChart();
  scatter.theme = 'modern';
  scatter.showTrendline = 'linear';
  scatter.data = new ChartData({
    title: 'Cluster Scaling Profile',
    xAxis: { legend: 'Requests / sec', autoScale: true },
    yAxis: { legend: 'p95 Latency (ms)', autoScale: true },
    series: [
      {
        name: 'Region EU',
        dataPoints: [
          { label: 'n1', x: 120, value: 14, size: 12 },
          { label: 'n2', x: 240, value: 21, size: 22 },
          { label: 'n3', x: 360, value: 29, size: 34 },
          { label: 'n4', x: 480, value: 41, size: 48 },
        ],
      },
      {
        name: 'Region US',
        dataPoints: [
          { label: 'u1', x: 150, value: 18, size: 15 },
          { label: 'u2', x: 290, value: 27, size: 28 },
          { label: 'u3', x: 420, value: 37, size: 40 },
          { label: 'u4', x: 520, value: 49, size: 54 },
        ],
      },
    ],
  });
  scatter.altText = 'Scatter bubble chart of latency versus throughput for EU and US regions with linear trendlines.';
  scatter.height = 400;
  scatter.stretchToFit = true;
  scatter.backgroundColor = CHART_BG;
  doc.add(scatter);

  doc.addPage();
  pageHeader(
    doc,
    'Bullet Charts & Sparklines: Executive KPI Scorecard',
    'Compact KPI gauges paired with 12-month enriched trend sparklines highlighting min/max and target baselines'
  );
  const kpiStack = new VerticalStack();
  kpiStack.spacing = 18;

  const kpiRow1 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
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
  b1.width = 520;
  b1.height = 64;
  b1.stretchToFit = true;
  b1.backgroundColor = CHART_BG;
  b1.altText = 'Bullet chart showing revenue at 275k against a 250k target.';
  kpiRow1.add(b1, 3);
  const s1 = new LineChart();
  s1.theme = 'modern';
  s1.sparkline = true;
  s1.curve = 'smooth';
  s1.lineColor = C_BLUE;
  s1.sparklineFillOpacity = 0.18;
  s1.sparklineShowEndpoints = true;
  s1.sparklineHighlightMinMax = true;
  s1.sparklineReferenceValue = 250;
  s1.height = 64;
  s1.stretchToFit = true;
  s1.backgroundColor = CHART_BG;
  s1.altText = 'Twelve-month revenue sparkline rising from 195k to 275k.';
  s1.data = new ChartData({
    series: [{ color: C_BLUE, dataPoints: months([195, 204, 212, 208, 224, 236, 241, 248, 255, 262, 269, 275]) }],
  });
  kpiRow1.add(s1, 1);
  kpiStack.add(kpiRow1);

  const kpiRow2 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  const b2 = new BulletChart();
  b2.theme = 'modern';
  b2.label = 'Gross Margin';
  b2.value = 74;
  b2.target = 78;
  b2.ranges = [{ max: 50 }, { max: 75 }, { max: 100 }];
  b2.showScale = true;
  b2.showValueLabel = true;
  b2.valueSuffix = '%';
  b2.measureColor = C_TEAL;
  b2.width = 520;
  b2.height = 64;
  b2.stretchToFit = true;
  b2.backgroundColor = CHART_BG;
  b2.altText = 'Bullet chart showing gross margin at 74% against a 78% target.';
  kpiRow2.add(b2, 3);
  const s2 = new LineChart();
  s2.theme = 'modern';
  s2.sparkline = true;
  s2.curve = 'smooth';
  s2.lineColor = C_TEAL;
  s2.sparklineFillOpacity = 0.18;
  s2.sparklineShowEndpoints = true;
  s2.sparklineHighlightMinMax = true;
  s2.sparklineReferenceValue = 78;
  s2.height = 64;
  s2.stretchToFit = true;
  s2.backgroundColor = CHART_BG;
  s2.altText = 'Twelve-month gross margin sparkline trending from 68% to 74%.';
  s2.data = new ChartData({
    series: [{ color: C_TEAL, dataPoints: months([68, 69, 71, 70, 72, 73, 71, 72, 73, 75, 74, 74]) }],
  });
  kpiRow2.add(s2, 1);
  kpiStack.add(kpiRow2);

  const kpiRow3 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  const b3 = new BulletChart();
  b3.theme = 'modern';
  b3.label = 'Net Promoter';
  b3.value = 64;
  b3.target = 60;
  b3.ranges = [{ max: 30 }, { max: 55 }, { max: 80 }];
  b3.showScale = true;
  b3.showValueLabel = true;
  b3.measureColor = C_VIOLET;
  b3.width = 520;
  b3.height = 64;
  b3.stretchToFit = true;
  b3.backgroundColor = CHART_BG;
  b3.altText = 'Bullet chart showing Net Promoter Score at 64 against a target of 60.';
  kpiRow3.add(b3, 3);
  const s3 = new LineChart();
  s3.theme = 'modern';
  s3.sparkline = true;
  s3.curve = 'smooth';
  s3.lineColor = C_VIOLET;
  s3.sparklineFillOpacity = 0.18;
  s3.sparklineShowEndpoints = true;
  s3.sparklineHighlightMinMax = true;
  s3.sparklineReferenceValue = 60;
  s3.height = 64;
  s3.stretchToFit = true;
  s3.backgroundColor = CHART_BG;
  s3.altText = 'Twelve-month Net Promoter Score sparkline climbing from 51 to 64.';
  s3.data = new ChartData({
    series: [{ color: C_VIOLET, dataPoints: months([51, 53, 52, 55, 57, 58, 59, 61, 60, 62, 63, 64]) }],
  });
  kpiRow3.add(s3, 1);
  kpiStack.add(kpiRow3);
  doc.add(kpiStack);

  doc.addPage();
  pageHeader(
    doc,
    'Heatmap Chart: Monthly Cohort Retention',
    '2D matrix colour ramp with missing cells, continuous legend and WCAG auto-contrast values'
  );
  const heatmap = new HeatmapChart();
  heatmap.theme = 'modern';
  heatmap.title = 'Cohort Retention (%)';
  heatmap.xCategories = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'];
  heatmap.yCategories = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  heatmap.values = [
    [100, 84, 76, 71, 68, 65],
    [100, 86, 79, 74, 70, null],
    [100, 88, 82, 77, null, null],
    [100, 90, 84, null, null, null],
    [100, 91, null, null, null, null],
  ];
  heatmap.valueSuffix = '%';
  heatmap.altText = 'Cohort retention heatmap from January to May across months M0 through M5.';
  heatmap.height = 400;
  heatmap.stretchToFit = true;
  heatmap.backgroundColor = CHART_BG;
  doc.add(heatmap);

  doc.addPage();
  pageHeader(
    doc,
    'Dark Theme: Cloud Telemetry Throughput',
    'Built-in dark slate theme with rounded card corners, smooth spline and glowing area fade gradient'
  );
  const darkArea = new AreaChart();
  darkArea.data = new ChartData({
    title: 'Ingested Telemetry Volume',
    series: [
      {
        color: '#38bdf8',
        dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
      },
    ],
    yAxis: { prefix: '£', valueFormat: 'K0', maxValue: 15000, stepCount: 5, legend: 'Spend' },
    xAxis: { legend: 'Month' },
  });
  darkArea.theme = 'dark';
  darkArea.autoLayout = true;
  darkArea.curve = 'smooth';
  darkArea.areaGradient = true;
  darkArea.borderRadius = 10;
  darkArea.borderColor = '#334155';
  darkArea.borderWidth = 1;
  darkArea.subtitle = 'Monthly ingested events across production clusters';
  darkArea.altText = 'Dark-themed area chart showing telemetry spend rising from 4,500 to 12,800 GBP.';
  darkArea.height = 400;
  darkArea.stretchToFit = true;
  darkArea.areaColor = '#38bdf8';
  darkArea.fillOpacity = 0.32;
  darkArea.lineWidth = 2.5;
  darkArea.fontFamily = StandardFonts.Helvetica;
  darkArea.labelFontSize = 9;
  darkArea.showValueLabels = true;
  doc.add(darkArea);

  doc.addPage();
  pageHeader(
    doc,
    'Print Theme: Monochrome Hatch Patterns',
    'High-contrast grayscale palette with pure-vector diagonal, crosshatch and dot pattern fills for black-and-white printing'
  );
  const printGrouped = new GroupedBarChart();
  printGrouped.theme = 'print';
  printGrouped.autoLayout = true;
  printGrouped.legendPosition = 'top';
  printGrouped.showValueLabels = false;
  printGrouped.borderRadius = 8;
  printGrouped.borderColor = '#cbd5e1';
  printGrouped.borderWidth = 1;
  printGrouped.barStyle = { cornerRadius: 3 };
  printGrouped.data = new ChartData({
    title: 'Quarterly Output by Division',
    yAxis: { prefix: '£', valueFormat: 'K0', maxValue: 35000, stepCount: 7 },
    series: [
      {
        name: 'Division A (Diagonal)',
        dataPoints: ['Q1', 'Q2', 'Q3', 'Q4'].map((label, i) => ({ label, value: [14500, 21800, 22500, 31500][i] })),
      },
      {
        name: 'Division B (Crosshatch)',
        dataPoints: ['Q1', 'Q2', 'Q3', 'Q4'].map((label, i) => ({ label, value: [10500, 14200, 14100, 19400][i] })),
      },
      {
        name: 'Division C (Dots)',
        dataPoints: ['Q1', 'Q2', 'Q3', 'Q4'].map((label, i) => ({ label, value: [9300, 13000, 12900, 17400][i] })),
      },
    ],
  });
  printGrouped.altText =
    'Monochrome print-themed grouped bar chart with diagonal, crosshatch, and dot pattern fills across four quarters.';
  printGrouped.height = 400;
  printGrouped.stretchToFit = true;
  printGrouped.fontFamily = StandardFonts.Helvetica;
  printGrouped.backgroundColor = CHART_BG;
  doc.add(printGrouped);
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
