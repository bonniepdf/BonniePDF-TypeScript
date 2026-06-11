import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  AccessibilityMode,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextElementBase,
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
  ChartElement,
  GroupedBarChartElement,
  BarChart,
  LineChart,
  AreaChart,
  LollipopChart,
  DotPlotChart,
  GroupedBarChart,
  PieChart,
  PdfAConformance,
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
const CHART_BG = '#fafafa';

// ── Entry point ──────────────────────────────────────────────────────────────

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  settings.footerTemplate = (pageNumber: number) => {
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Weighted;

    const left = new TextBlock('BonniePDF Charting Examples');
    left.fontName = StandardFonts.Helvetica;
    left.fontSize = 10;
    left.textColor = ColorPalette.slate[500];
    stack.addChild(left);

    const right = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    right.fontName = StandardFonts.Helvetica;
    right.fontSize = 10;
    right.textColor = ColorPalette.slate[500];
    right.alignment = TextAlignment.Right;
    stack.addChild(right, 1);

    return stack;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Charting Examples';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Charting Examples demonstrating all chart types';

  const doc = new Document(settings, metadata);

  {
    const title = new TextBlock('Bar Chart: Monthly Sales Report');
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock('Vertical bars with grid lines and value labels');
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const series = new ChartSeries();
    series.color = Color.fromHex(C_INDIGO);
    series.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800][i];
      return p;
    });

    const data = new ChartData();
    data.title = 'Monthly Sales';
    data.series = [series];
    data.yAxis.prefix = '£';
    data.yAxis.maxValue = 15000;
    data.yAxis.stepCount = 5;

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

  doc.addPage();

  {
    const title = new TextBlock('Grouped Bar Chart: Quarterly Revenue');
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock('Comparison of three product lines across all months');
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const electronics = new ChartSeries();
    electronics.color = Color.fromHex(C_INDIGO);
    electronics.name = 'Electronics';
    electronics.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [4500, 5200, 4800, 6200, 7500, 8100, 7200, 6800, 8500, 9200, 10500, 11800][i];
      return p;
    });

    const clothing = new ChartSeries();
    clothing.color = Color.fromHex(C_ROSE);
    clothing.name = 'Clothing';
    clothing.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [3200, 3800, 3500, 4200, 4800, 5200, 4600, 4400, 5100, 5800, 6400, 7200][i];
      return p;
    });

    const home = new ChartSeries();
    home.color = Color.fromHex(C_GREEN);
    home.name = 'Home & Garden';
    home.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [2800, 3400, 3100, 3800, 4400, 4800, 4200, 4000, 4700, 5400, 6000, 6800][i];
      return p;
    });

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

  doc.addPage();

  {
    const title = new TextBlock('Line Chart: Monthly Revenue Trends');
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock('Connected data points with markers and value labels');
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const series = new ChartSeries();
    series.color = Color.fromHex(C_VIOLET);
    series.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800][i];
      return p;
    });

    const data = new ChartData();
    data.title = 'Monthly Revenue';
    data.series = [series];
    data.yAxis.prefix = '£';
    data.yAxis.maxValue = 15000;
    data.yAxis.stepCount = 5;
    data.yAxis.legend = 'Revenue';
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

  doc.addPage();

  {
    const title = new TextBlock('Area Chart: Monthly Sales Performance');
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock('Filled area under the line with configurable opacity');
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const series = new ChartSeries();
    series.color = Color.fromHex(C_PURPLE);
    series.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800][i];
      return p;
    });

    const data = new ChartData();
    data.title = 'Monthly Sales';
    data.series = [series];
    data.yAxis.prefix = '£';
    data.yAxis.maxValue = 15000;
    data.yAxis.stepCount = 5;
    data.yAxis.legend = 'Sales';
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

  doc.addPage();

  {
    const title = new TextBlock('Lollipop Chart: Quarterly Metrics');
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock('Stems with circular heads - clear and minimal bar alternative');
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const series = new ChartSeries();
    series.color = Color.fromHex(C_PINK);
    series.dataPoints = ['Q1', 'Q2', 'Q3', 'Q4'].map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [4500, 6200, 8500, 11500][i];
      return p;
    });

    const data = new ChartData();
    data.title = 'Quarterly Revenue';
    data.series = [series];
    data.yAxis.prefix = '£';
    data.yAxis.maxValue = 15000;
    data.yAxis.stepCount = 5;
    data.yAxis.legend = 'Revenue';
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

  doc.addPage();

  {
    const title = new TextBlock('Dot Plot Chart: Product Performance');
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock('Circular markers positioned along a value axis');
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const series = new ChartSeries();
    series.color = Color.fromHex(C_TEAL);
    series.dataPoints = ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E', 'Prod F', 'Prod G', 'Prod H'].map(
      (label, i) => {
        const p = new ChartDataPoint();
        p.label = label;
        p.value = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 9500][i];
        return p;
      }
    );

    const data = new ChartData();
    data.title = 'Product Sales';
    data.series = [series];
    data.yAxis.prefix = '£';
    data.yAxis.maxValue = 12000;
    data.yAxis.stepCount = 5;
    data.yAxis.legend = 'Sales';
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

  doc.addPage();

  {
    const year = new Date().getFullYear();

    const title = new TextBlock(`Pie Chart: Monthly Sales ${year}`);
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock('Donut chart with legend and total value in the centre');
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const series = new ChartSeries();
    series.color = Color.fromHex(C_INDIGO);
    series.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [7234, 4891, 8456, 3127, 9542, 6789, 5234, 8901, 2456, 7890, 6123, 9876][i];
      return p;
    });

    const data = new ChartData();
    data.title = `Monthly Sales ${year}`;
    data.series = [series];

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

  doc.addPage();

  {
    const year = new Date().getFullYear();

    const title = new TextBlock('Multi-Series Line Chart: Year-over-Year Comparison');
    title.fontSize = 24;
    title.textColor = ColorPalette.slate[800];
    title.alignment = TextAlignment.Center;
    title.margin = new Thickness(0, 0, 0, 10);
    doc.add(title);

    const subtitle = new TextBlock(`Comparing ${year - 1} and ${year} revenue with a shared axis`);
    subtitle.fontSize = 14;
    subtitle.textColor = ColorPalette.slate[600];
    subtitle.alignment = TextAlignment.Center;
    subtitle.margin = new Thickness(0, 0, 0, 20);
    doc.add(subtitle);

    const prevYear = new ChartSeries();
    prevYear.color = Color.fromHex(C_INDIGO);
    prevYear.name = String(year - 1);
    prevYear.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [65000, 69000, 80000, 72000, 85000, 88000, 72000, 68000, 75000, 81000, 92000, 105000][i];
      return p;
    });

    const thisYear = new ChartSeries();
    thisYear.color = Color.fromHex(C_VIOLET);
    thisYear.name = String(year);
    thisYear.dataPoints = MONTH_LABELS.map((label, i) => {
      const p = new ChartDataPoint();
      p.label = label;
      p.value = [75000, 78000, 85000, 78000, 92000, 95000, 87000, 78000, 82000, 91000, 97000, 118000][i];
      return p;
    });

    const data = new ChartData();
    data.title = 'Year-over-Year Revenue Comparison';
    data.series = [prevYear, thisYear];
    data.yAxis.prefix = '£';
    data.yAxis.maxValue = 150000;
    data.yAxis.stepCount = 5;
    data.yAxis.legend = 'Revenue';
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

  return doc;
}
