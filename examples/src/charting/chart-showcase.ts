import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  AccessibilityMode,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextElementBase,
  TextAlignment,
  HorizontalStack,
  Color,
  Thickness,
  StandardFonts,
  WidthDistribution,
  ChartData,
  ChartSeries,
  ChartDataPoint,
  AxisOptions,
  ChartElement,
  GroupedBarChartElement,
  BarChart,
  LineChart,
  AreaChart,
  LollipopChart,
  DotPlotChart,
  GroupedBarChart,
  PieChart,
} from '@bonniepdf/core';

// ── Color palette ────────────────────────────────────────────────────────────
const C_INDIGO = '#4f46e5';
const C_VIOLET = '#7c3aed';
const C_PURPLE = '#a855f7';
const C_FUCHSIA = '#d946ef';
const C_PINK = '#ec4899';
const C_ROSE = '#f43f5e';
const C_ORANGE = '#f97316';
const C_YELLOW = '#eab308';
const C_LIME = '#84cc16';
const C_GREEN = '#22c55e';
const C_TEAL = '#14b8a6';
const C_CYAN = '#06b6d4';
const ALL_COLORS = [
  C_INDIGO,
  C_VIOLET,
  C_PURPLE,
  C_FUCHSIA,
  C_PINK,
  C_ROSE,
  C_ORANGE,
  C_YELLOW,
  C_LIME,
  C_GREEN,
  C_TEAL,
  C_CYAN,
];

// ── Shared data ──────────────────────────────────────────────────────────────
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthlySales(): ChartDataPoint[] {
  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800];
  return MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
}

function quarterlyRevenue(): ChartDataPoint[] {
  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const values = [4500, 6200, 8500, 11500];
  return labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
}

function productSales(): ChartDataPoint[] {
  const labels = ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E', 'Prod F', 'Prod G', 'Prod H'];
  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 9500];
  return labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
}

function pieChartSales(): ChartDataPoint[] {
  const values = [7234, 4891, 8456, 3127, 9542, 6789, 5234, 8901, 2456, 7890, 6123, 9876];
  return MONTH_LABELS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const CHART_BG = '#fafafa';

function pageTitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontSize = 24;
  b.textColor = Color.slate800;
  b.alignment = TextAlignment.Center;
  b.margin = new Thickness(0, 0, 0, 10);
  return b;
}

function pageSubtitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontSize = 14;
  b.textColor = Color.slate600;
  b.alignment = TextAlignment.Center;
  b.margin = new Thickness(0, 0, 0, 20);
  return b;
}

function yAxis(prefix: string, max: number, steps: number, legend = ''): AxisOptions {
  const a = new AxisOptions();
  a.prefix = prefix;
  a.maxValue = max;
  a.stepCount = steps;
  if (legend) a.legend = legend;
  return a;
}

function series(points: ChartDataPoint[], color: string, name = ''): ChartSeries {
  const s = new ChartSeries();
  s.color = Color.fromHex(color);
  s.dataPoints = points;
  if (name) s.name = name;
  return s;
}

// ── Chart pages ──────────────────────────────────────────────────────────────

function addBarChart(doc: Document): void {
  doc.add(pageTitle('Bar Chart: Monthly Sales Report'));
  doc.add(pageSubtitle('Vertical bars with grid lines and value labels'));

  const data = new ChartData();
  data.title = 'Monthly Sales';
  data.series = [series(monthlySales(), C_INDIGO)];
  data.yAxis = yAxis('£', 15000, 5);

  const chart = new BarChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.barColor = Color.fromHex(C_INDIGO);
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.backgroundColor = Color.fromHex(CHART_BG);

  doc.add(
    new ChartElement(
      chart,
      data,
      'Bar chart of monthly sales from January to December, rising from 4,500 to 12,800 GBP.'
    )
  );
}

function addGroupedBarChart(doc: Document): void {
  doc.add(pageTitle('Grouped Bar Chart: Quarterly Revenue'));
  doc.add(pageSubtitle('Comparison of three product lines across all months'));

  const electronics = series(
    MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [4500, 5200, 4800, 6200, 7500, 8100, 7200, 6800, 8500, 9200, 10500, 11800][i];
      return p;
    }),
    C_INDIGO,
    'Electronics'
  );

  const clothing = series(
    MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [3200, 3800, 3500, 4200, 4800, 5200, 4600, 4400, 5100, 5800, 6400, 7200][i];
      return p;
    }),
    C_ROSE,
    'Clothing'
  );

  const home = series(
    MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [2800, 3400, 3100, 3800, 4400, 4800, 4200, 4000, 4700, 5400, 6000, 6800][i];
      return p;
    }),
    C_GREEN,
    'Home & Garden'
  );

  const data = new ChartData();
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 15000;
  data.yAxis.stepCount = 5;
  data.series = [electronics, clothing, home];

  const chart = new GroupedBarChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.showValueLabels = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.backgroundColor = Color.fromHex(CHART_BG);

  doc.add(
    new GroupedBarChartElement(
      chart,
      data,
      'Grouped bar chart comparing Electronics, Clothing, and Home and Garden sales across twelve months.'
    )
  );
}

function addLineChart(doc: Document): void {
  doc.add(pageTitle('Line Chart: Monthly Revenue Trends'));
  doc.add(pageSubtitle('Connected data points with markers and value labels'));

  const data = new ChartData();
  data.title = 'Monthly Revenue';
  data.series = [series(monthlySales(), C_VIOLET)];
  data.yAxis = yAxis('£', 15000, 5, 'Revenue');
  data.xAxis.legend = 'Month';

  const chart = new LineChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.lineColor = Color.fromHex(C_VIOLET);
  chart.lineWidth = 2.5;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.showDataPointMarkers = true;
  chart.backgroundColor = Color.fromHex(CHART_BG);

  doc.add(
    new ChartElement(chart, data, 'Line chart of monthly revenue from January to December, ending at 12,800 GBP.')
  );
}

function addAreaChart(doc: Document): void {
  doc.add(pageTitle('Area Chart: Monthly Sales Performance'));
  doc.add(pageSubtitle('Filled area under the line with configurable opacity'));

  const data = new ChartData();
  data.title = 'Monthly Sales';
  data.series = [series(monthlySales(), C_PURPLE)];
  data.yAxis = yAxis('£', 15000, 5, 'Sales');
  data.xAxis.legend = 'Month';

  const chart = new AreaChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.areaColor = Color.fromHex(C_PURPLE);
  chart.fillOpacity = 0.3;
  chart.lineWidth = 2.5;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex(CHART_BG);

  doc.add(
    new ChartElement(
      chart,
      data,
      'Area chart of monthly sales from January to December, with a filled trend rising to 12,800 GBP.'
    )
  );
}

function addLollipopChart(doc: Document): void {
  doc.add(pageTitle('Lollipop Chart: Quarterly Metrics'));
  doc.add(pageSubtitle('Stems with circular heads — clear and minimal bar alternative'));

  const data = new ChartData();
  data.title = 'Quarterly Revenue';
  data.series = [series(quarterlyRevenue(), C_PINK)];
  data.yAxis = yAxis('£', 15000, 5, 'Revenue');
  data.xAxis.legend = 'Quarter';

  const chart = new LollipopChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.lollipopColor = Color.fromHex(C_PINK);
  chart.stemWidth = 2.5;
  chart.headRadius = 10;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex(CHART_BG);

  doc.add(
    new ChartElement(
      chart,
      data,
      'Lollipop chart of quarterly revenue, increasing from 4,500 GBP in Q1 to 11,500 GBP in Q4.'
    )
  );
}

function addDotPlotChart(doc: Document): void {
  doc.add(pageTitle('Dot Plot Chart: Product Performance'));
  doc.add(pageSubtitle('Circular markers positioned along a value axis'));

  const data = new ChartData();
  data.title = 'Product Sales';
  data.series = [series(productSales(), C_TEAL)];
  data.yAxis = yAxis('£', 12000, 5, 'Sales');
  data.xAxis.legend = 'Product';

  const chart = new DotPlotChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.dotColor = Color.fromHex(C_TEAL);
  chart.dotRadius = 12;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.backgroundColor = Color.fromHex(CHART_BG);

  doc.add(
    new ChartElement(chart, data, 'Dot plot comparing eight product sales values, ranging from 4,500 to 9,500 GBP.')
  );
}

function addPieChart(doc: Document): void {
  const year = new Date().getFullYear();
  doc.add(pageTitle(`Pie Chart: Monthly Sales ${year}`));
  doc.add(pageSubtitle('Donut chart with legend and total value in the centre'));

  const data = new ChartData();
  data.title = `Monthly Sales ${year}`;
  data.series = [series(pieChartSales(), C_INDIGO)];

  const chart = new PieChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.isDonut = true;
  chart.totalLabel = 'Total';
  chart.showLegend = true;
  chart.colors = ALL_COLORS;
  chart.backgroundColor = Color.white;

  doc.add(
    new ChartElement(
      chart,
      data,
      `Donut chart showing ${year} monthly sales share with a legend and total value in the centre.`
    )
  );
}

function addMultiSeriesLineChart(doc: Document): void {
  const year = new Date().getFullYear();
  doc.add(pageTitle('Multi-Series Line Chart: Year-over-Year Comparison'));
  doc.add(pageSubtitle(`Comparing ${year - 1} and ${year} revenue with a shared axis`));

  const prevYear = series(
    MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [65000, 69000, 80000, 72000, 85000, 88000, 72000, 68000, 75000, 81000, 92000, 105000][i];
      return p;
    }),
    C_INDIGO,
    String(year - 1)
  );

  const thisYear = series(
    MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [75000, 78000, 85000, 78000, 92000, 95000, 87000, 78000, 82000, 91000, 97000, 118000][i];
      return p;
    }),
    C_VIOLET,
    String(year)
  );

  const data = new ChartData();
  data.title = 'Year-over-Year Revenue Comparison';
  data.series = [prevYear, thisYear];
  data.yAxis = yAxis('£', 150000, 5, 'Revenue');
  data.xAxis.legend = 'Month';

  const chart = new LineChart();
  chart.height = 400;
  chart.stretchToFit = true;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 9;
  chart.showValueLabels = true;
  chart.showDataPointMarkers = true;
  chart.backgroundColor = Color.fromHex(CHART_BG);

  doc.add(
    new ChartElement(chart, data, `Multi-series line chart comparing monthly revenue for ${year - 1} and ${year}.`)
  );
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;

    const left = new TextBlock('BonniePDF Charting Examples');
    left.fontName = StandardFonts.Helvetica;
    left.fontSize = 10;
    left.textColor = Color.slate500;
    stack.addChild(left);

    const right = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    right.fontName = StandardFonts.Helvetica;
    right.fontSize = 10;
    right.textColor = Color.slate500;
    right.alignment = TextAlignment.Right;
    stack.addChild(right, 1);

    return stack;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Charting Examples';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Charting Examples demonstrating all chart types';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  addBarChart(doc);

  doc.addPage();
  addGroupedBarChart(doc);

  doc.addPage();
  addLineChart(doc);

  doc.addPage();
  addAreaChart(doc);

  doc.addPage();
  addLollipopChart(doc);

  doc.addPage();
  addDotPlotChart(doc);

  doc.addPage();
  addPieChart(doc);

  doc.addPage();
  addMultiSeriesLineChart(doc);

  return doc;
}
