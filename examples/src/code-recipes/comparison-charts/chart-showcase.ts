/**
 * Chart Examples.
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
    'Rounded gradient bars, annotated target reference line and a modern chart theme'
  );
  doc.add(
    new BarChart({
      theme: 'modern',
      autoLayout: true,
      barStyle: { cornerRadius: 6, gradient: { startColor: '#60a5fa', endColor: C_BLUE, scope: 'bar' } },
      references: [
        {
          value: 9000,
          label: 'Target £9k',
          labelPosition: 'end',
          labelBackgroundColor: '#fef3c7',
          color: '#d97706',
          thickness: 1.5,
          dashPattern: [5, 3],
        },
      ],
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
  pageHeader(doc, 'Line Chart: Monthly Revenue Trends', 'Smooth monotone spline with haloed markers and value labels');
  doc.add(
    new LineChart({
      theme: 'modern',
      curve: 'smooth',
      defaultMarkerHaloWidth: 1.5,
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
  pageHeader(doc, 'Area Chart: Monthly Sales Performance', 'Smooth curve with vertical area fade gradient');
  doc.add(
    new AreaChart({
      theme: 'modern',
      curve: 'smooth',
      areaGradient: true,
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
    'Radial-elbow callout labels, gradient slices, centre total and rich legend formatting'
  );
  doc.add(
    new PieChart({
      theme: 'modern',
      sliceGradient: true,
      sliceBorderWidth: 1.5,
      donutHoleRatio: 0.56,
      sliceLabelMode: 'callout',
      legendFormat: 'labelValuePercent',
      totalPosition: 'center',
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
    `Comparing ${year - 1} and ${year} revenue with smooth curves, per-series dash patterns and marker shapes`
  );
  doc.add(
    new LineChart({
      theme: 'modern',
      autoLayout: true,
      curve: 'smooth',
      legendPosition: 'top',
      showValueLabels: false,
      data: new ChartData({
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
      }),
      altText: `Multi-series line chart comparing monthly revenue for ${year - 1} and ${year}.`,
      height: 400,
      stretchToFit: true,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Stacked bar chart ──
  pageHeader(
    doc,
    'Stacked Bar Chart: Revenue Mix by Channel',
    'Multi-series stacking with compact K totals, segment gaps and auto-contrast inside labels'
  );
  doc.add(
    new StackedBarChart({
      theme: 'modern',
      mode: 'absolute',
      showStackTotals: true,
      stackTotalFormat: 'K0',
      valueLabelFormat: 'K0',
      valueLabelPrefix: '£',
      segmentGap: 1.5,
      data: new ChartData({
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
      }),
      altText: 'Stacked bar chart showing quarterly revenue split across Direct, Partner, and Self-serve channels.',
      height: 400,
      stretchToFit: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Stacked area chart ──
  pageHeader(
    doc,
    'Stacked Area Chart: Platform Traffic Share',
    '100% normalized smooth stacked area bands with inline series labels'
  );
  doc.add(
    new StackedAreaChart({
      theme: 'modern',
      mode: 'percent',
      curve: 'smooth',
      legendPosition: 'inline',
      data: new ChartData({
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
      }),
      altText: '100% stacked area chart showing platform traffic share shifting from Web toward Mobile and API.',
      height: 400,
      stretchToFit: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Combo chart ──
  pageHeader(
    doc,
    'Combo Chart: Revenue vs. Gross Margin',
    'Primary revenue bars paired with a smooth gross-margin percentage line on a secondary Y axis'
  );
  doc.add(
    new ComboChart({
      theme: 'modern',
      showValueLabels: false,
      legendPosition: 'top',
      secondaryYAxis: { minValue: 50, maxValue: 90, suffix: '%', valueFormat: 'F0' },
      data: new ChartData({
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
      }),
      altText: 'Combo chart comparing quarterly revenue bars against gross margin percentage on a secondary axis.',
      height: 400,
      stretchToFit: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Waterfall chart ──
  pageHeader(
    doc,
    'Waterfall Chart: ARR Movement Bridge',
    'Cumulative variance bridge with positive/negative deltas, auto-computed ending total and connectors'
  );
  doc.add(
    new WaterfallChart({
      theme: 'modern',
      valueLabelPrefix: '£',
      valueLabelFormat: 'K1',
      data: new ChartData({
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
      }),
      altText:
        'Waterfall bridge from 800k starting ARR through new business, expansion, churn and contraction to 1.07M.',
      height: 400,
      stretchToFit: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Scatter / bubble chart ──
  pageHeader(
    doc,
    'Scatter Chart: Latency vs. Throughput',
    'Continuous numeric X/Y coordinates with area-scaled bubbles and OLS linear trendline'
  );
  doc.add(
    new ScatterChart({
      theme: 'modern',
      showTrendline: 'linear',
      data: new ChartData({
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
      }),
      altText: 'Scatter bubble chart of latency versus throughput for EU and US regions with linear trendlines.',
      height: 400,
      stretchToFit: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Bullet charts & Sparklines ──
  pageHeader(
    doc,
    'Bullet Charts & Sparklines: Executive KPI Scorecard',
    'Compact KPI gauges paired with 12-month enriched trend sparklines highlighting min/max and target baselines'
  );
  const kpiStack = new VerticalStack({ spacing: 18 });
  const kpiRow1 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  kpiRow1.add(
    new BulletChart({
      theme: 'modern',
      label: 'Revenue (£k)',
      value: 275,
      target: 250,
      ranges: [{ max: 150 }, { max: 225 }, { max: 300 }],
      showScale: true,
      showValueLabel: true,
      valuePrefix: '£',
      valueSuffix: 'k',
      width: 520,
      height: 64,
      stretchToFit: true,
      backgroundColor: CHART_BG,
      altText: 'Bullet chart showing revenue at 275k against a 250k target.',
    }),
    3
  );
  kpiRow1.add(
    new LineChart({
      theme: 'modern',
      sparkline: true,
      curve: 'smooth',
      lineColor: C_BLUE,
      sparklineFillOpacity: 0.18,
      sparklineShowEndpoints: true,
      sparklineHighlightMinMax: true,
      sparklineReferenceValue: 250,
      height: 64,
      stretchToFit: true,
      backgroundColor: CHART_BG,
      altText: 'Twelve-month revenue sparkline rising from 195k to 275k.',
      data: new ChartData({
        series: [{ color: C_BLUE, dataPoints: months([195, 204, 212, 208, 224, 236, 241, 248, 255, 262, 269, 275]) }],
      }),
    }),
    1
  );
  kpiStack.add(kpiRow1);

  const kpiRow2 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  kpiRow2.add(
    new BulletChart({
      theme: 'modern',
      label: 'Gross Margin',
      value: 74,
      target: 78,
      ranges: [{ max: 50 }, { max: 75 }, { max: 100 }],
      showScale: true,
      showValueLabel: true,
      valueSuffix: '%',
      measureColor: C_TEAL,
      width: 520,
      height: 64,
      stretchToFit: true,
      backgroundColor: CHART_BG,
      altText: 'Bullet chart showing gross margin at 74% against a 78% target.',
    }),
    3
  );
  kpiRow2.add(
    new LineChart({
      theme: 'modern',
      sparkline: true,
      curve: 'smooth',
      lineColor: C_TEAL,
      sparklineFillOpacity: 0.18,
      sparklineShowEndpoints: true,
      sparklineHighlightMinMax: true,
      sparklineReferenceValue: 78,
      height: 64,
      stretchToFit: true,
      backgroundColor: CHART_BG,
      altText: 'Twelve-month gross margin sparkline trending from 68% to 74%.',
      data: new ChartData({
        series: [{ color: C_TEAL, dataPoints: months([68, 69, 71, 70, 72, 73, 71, 72, 73, 75, 74, 74]) }],
      }),
    }),
    1
  );
  kpiStack.add(kpiRow2);

  const kpiRow3 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  kpiRow3.add(
    new BulletChart({
      theme: 'modern',
      label: 'Net Promoter',
      value: 64,
      target: 60,
      ranges: [{ max: 30 }, { max: 55 }, { max: 80 }],
      showScale: true,
      showValueLabel: true,
      measureColor: C_VIOLET,
      width: 520,
      height: 64,
      stretchToFit: true,
      backgroundColor: CHART_BG,
      altText: 'Bullet chart showing Net Promoter Score at 64 against a target of 60.',
    }),
    3
  );
  kpiRow3.add(
    new LineChart({
      theme: 'modern',
      sparkline: true,
      curve: 'smooth',
      lineColor: C_VIOLET,
      sparklineFillOpacity: 0.18,
      sparklineShowEndpoints: true,
      sparklineHighlightMinMax: true,
      sparklineReferenceValue: 60,
      height: 64,
      stretchToFit: true,
      backgroundColor: CHART_BG,
      altText: 'Twelve-month Net Promoter Score sparkline climbing from 51 to 64.',
      data: new ChartData({
        series: [{ color: C_VIOLET, dataPoints: months([51, 53, 52, 55, 57, 58, 59, 61, 60, 62, 63, 64]) }],
      }),
    }),
    1
  );
  kpiStack.add(kpiRow3);
  doc.add(kpiStack);

  doc.addPage();

  // ── Heatmap chart ──
  pageHeader(
    doc,
    'Heatmap Chart: Monthly Cohort Retention',
    '2D matrix colour ramp with missing cells, continuous legend and WCAG auto-contrast values'
  );
  doc.add(
    new HeatmapChart({
      theme: 'modern',
      title: 'Cohort Retention (%)',
      xCategories: ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'],
      yCategories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      values: [
        [100, 84, 76, 71, 68, 65],
        [100, 86, 79, 74, 70, null],
        [100, 88, 82, 77, null, null],
        [100, 90, 84, null, null, null],
        [100, 91, null, null, null, null],
      ],
      valueSuffix: '%',
      altText: 'Cohort retention heatmap from January to May across months M0 through M5.',
      height: 400,
      stretchToFit: true,
      backgroundColor: CHART_BG,
    })
  );

  doc.addPage();

  // ── Dark theme ──
  pageHeader(
    doc,
    'Dark Theme: Cloud Telemetry Throughput',
    'Built-in dark slate theme with rounded card corners, smooth spline and glowing area fade gradient'
  );
  doc.add(
    new AreaChart({
      theme: 'dark',
      autoLayout: true,
      curve: 'smooth',
      areaGradient: true,
      borderRadius: 10,
      borderColor: '#334155',
      borderWidth: 1,
      subtitle: 'Monthly ingested events across production clusters',
      data: new ChartData({
        title: 'Ingested Telemetry Volume',
        series: [
          {
            color: '#38bdf8',
            dataPoints: months([4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800]),
          },
        ],
        yAxis: { prefix: '£', valueFormat: 'K0', maxValue: 15000, stepCount: 5, legend: 'Spend' },
        xAxis: { legend: 'Month' },
      }),
      altText: 'Dark-themed area chart showing telemetry spend rising from 4,500 to 12,800 GBP.',
      height: 400,
      stretchToFit: true,
      areaColor: '#38bdf8',
      fillOpacity: 0.32,
      lineWidth: 2.5,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 9,
      showValueLabels: true,
    })
  );

  doc.addPage();

  // ── Print & monochrome pattern theme ──
  pageHeader(
    doc,
    'Print Theme: Monochrome Hatch Patterns',
    'High-contrast grayscale palette with pure-vector diagonal, crosshatch and dot pattern fills for black-and-white printing'
  );
  doc.add(
    new GroupedBarChart({
      theme: 'print',
      autoLayout: true,
      legendPosition: 'top',
      showValueLabels: false,
      borderRadius: 8,
      borderColor: '#cbd5e1',
      borderWidth: 1,
      barStyle: { cornerRadius: 3 },
      data: new ChartData({
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
      }),
      altText:
        'Monochrome print-themed grouped bar chart with diagonal, crosshatch, and dot pattern fills across four quarters.',
      height: 400,
      stretchToFit: true,
      fontFamily: StandardFonts.Helvetica,
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
