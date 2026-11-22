import { describe, it, expect } from 'vitest';
import {
  Document,
  StackedBarChart,
  StackedAreaChart,
  ComboChart,
  WaterfallChart,
  ScatterChart,
  BulletChart,
  HeatmapChart,
  AreaChart,
  LineChart,
  PieChart,
  BarChart,
  AccessibilityMode,
  PdfAConformance,
} from '../../src/index';
import { fromDefinition, toDefinition, validateDefinition } from '../../src/definition';
import type { LayoutNode } from '../../src/index';
import { pdfToText } from '../helpers/test-base';

function walk(node: LayoutNode): LayoutNode[] {
  const out: LayoutNode[] = [node];
  for (const child of node.children ?? []) out.push(...walk(child));
  return out;
}

function buildAllNewCharts() {
  const stackedBar = new StackedBarChart({
    theme: 'modern',
    title: 'Revenue Mix',
    subtitle: 'Quarterly breakdown by segment',
    caption: 'Source: Finance',
    mode: 'absolute',
    showStackTotals: true,
    yAxis: { prefix: '$', valueFormat: 'K1' },
    data: {
      series: [
        {
          name: 'Direct',
          dataPoints: [
            { label: 'Q1', value: 42000 },
            { label: 'Q2', value: 51000 },
          ],
        },
        {
          name: 'Partner',
          dataPoints: [
            { label: 'Q1', value: 18000 },
            { label: 'Q2', value: 24000 },
          ],
        },
      ],
    },
    altText: 'Stacked bar chart of quarterly revenue mix',
  });

  const stackedArea = new StackedAreaChart({
    theme: 'modern',
    title: 'Traffic Share',
    mode: 'percent',
    curve: 'smooth',
    legendPosition: 'inline',
    data: {
      series: [
        {
          name: 'Web',
          dataPoints: [
            { label: 'Jan', value: 60 },
            { label: 'Feb', value: 65 },
            { label: 'Mar', value: 70 },
          ],
        },
        {
          name: 'Mobile',
          dataPoints: [
            { label: 'Jan', value: 40 },
            { label: 'Feb', value: 35 },
            { label: 'Mar', value: 30 },
          ],
        },
      ],
    },
    altText: '100% stacked area chart of traffic share',
  });

  const combo = new ComboChart({
    theme: 'modern',
    title: 'Revenue vs Margin',
    yAxis: { prefix: '$', valueFormat: 'K0' },
    secondaryYAxis: { suffix: '%', valueFormat: 'F0' },
    data: {
      series: [
        {
          name: 'Revenue',
          seriesType: 'bar',
          valueAxis: 'primary',
          dataPoints: [
            { label: 'Q1', value: 120000 },
            { label: 'Q2', value: 145000 },
          ],
        },
        {
          name: 'Margin',
          seriesType: 'line',
          valueAxis: 'secondary',
          dataPoints: [
            { label: 'Q1', value: 22 },
            { label: 'Q2', value: 27 },
          ],
        },
      ],
    },
    altText: 'Combo chart comparing revenue bars and margin line',
  });

  const waterfall = new WaterfallChart({
    theme: 'modern',
    title: 'ARR Bridge',
    yAxis: { prefix: '$', valueFormat: 'K0' },
    data: {
      series: [
        {
          name: 'ARR',
          dataPoints: [
            { label: 'Start', value: 500000, kind: 'total' },
            { label: 'New', value: 140000, kind: 'delta' },
            { label: 'Churn', value: -45000, kind: 'delta' },
            { label: 'End', kind: 'total' },
          ],
        },
      ],
    },
    altText: 'Waterfall chart showing ARR bridge',
  });

  const scatter = new ScatterChart({
    theme: 'modern',
    title: 'Latency vs Throughput',
    showTrendline: 'linear',
    xAxis: { legend: 'Req/s', autoScale: true },
    yAxis: { legend: 'ms', autoScale: true },
    data: {
      series: [
        {
          name: 'Cluster A',
          dataPoints: [
            { label: 'p1', x: 100, value: 12, size: 10 },
            { label: 'p2', x: 250, value: 18, size: 25 },
            { label: 'p3', x: 400, value: 29, size: 40 },
          ],
        },
      ],
    },
    altText: 'Scatter plot with bubble sizing and linear trendline',
  });

  const bullet = new BulletChart({
    theme: 'modern',
    label: 'NPS',
    value: 64,
    target: 70,
    ranges: [{ max: 40 }, { max: 70 }, { max: 100 }],
    showScale: true,
    showValueLabel: true,
    altText: 'Bullet chart showing NPS against target',
  });

  const heatmap = new HeatmapChart({
    theme: 'modern',
    title: 'Cohort Retention',
    xCategories: ['M0', 'M1', 'M2'],
    yCategories: ['Jan', 'Feb'],
    values: [
      [100, 82, 71],
      [100, 79, null],
    ],
    valueSuffix: '%',
    altText: 'Cohort retention heatmap',
  });

  return { stackedBar, stackedArea, combo, waterfall, scatter, bullet, heatmap };
}

describe('Chart enhancements host integration', () => {
  it('renders all 7 new chart families into PDF and SVG pages', async () => {
    const charts = buildAllNewCharts();
    const doc = new Document();
    for (const chart of Object.values(charts)) {
      doc.addPage().add(chart);
    }
    const bytes = await doc.generateBytesAsync();
    expect(bytes.length).toBeGreaterThan(2000);
    const svgs = await doc.generateSvgPagesAsync();
    expect(svgs.length).toBeGreaterThanOrEqual(7);
    for (const svg of svgs) {
      expect(svg).toContain('<svg');
    }
  });

  it('tags all 7 new chart families as Figure in PDF/UA and records imageLike in LayoutSnapshot', async () => {
    const charts = buildAllNewCharts();
    const doc = new Document({
      settings: { accessibility: AccessibilityMode.PdfUa1, language: 'en-GB' },
      metadata: { title: 'Charts Accessibility Test' },
    });
    const page = doc.pages[0];
    for (const chart of Object.values(charts)) {
      chart.height = 180;
      page.add(chart);
    }
    const pdf = await doc.generateBytesAsync();
    const text = pdfToText(pdf);
    expect(text).toContain('/Figure');

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(snapshot).toBeDefined();
    const chartNodes = walk(snapshot!.root).filter(e =>
      [
        'StackedBarChart',
        'StackedAreaChart',
        'ComboChart',
        'WaterfallChart',
        'ScatterChart',
        'BulletChart',
        'HeatmapChart',
      ].includes(e.type)
    );
    expect(chartNodes.length).toBe(7);
    for (const node of chartNodes) {
      expect(node.a11y?.imageLike).toBe(true);
      expect(node.a11y?.role).toBe('Figure');
    }
  });

  it('cascades document default font when inheritDocumentFont is enabled', async () => {
    const doc = new Document({
      settings: { defaultTextStyle: { fontFamily: 'Courier' } },
    });
    const bar = new BarChart({
      theme: 'modern',
      inheritDocumentFont: true,
      title: 'Inherited Font',
      data: { series: [{ name: 'A', dataPoints: [{ label: 'X', value: 10 }] }] },
    });
    doc.pages[0].add(bar);
    const svgs = await doc.generateSvgPagesAsync();
    expect(svgs[0]).toContain('Courier');
  });

  it('renders AreaChart areaGradient under PDF/A-1b and dark/print themes cleanly', async () => {
    const doc = new Document({
      settings: { conformance: PdfAConformance.PdfA1b },
      metadata: { title: 'PDF/A-1b Charts' },
    });
    doc.pages[0].add(
      new AreaChart({
        theme: 'print',
        title: 'Print Theme Area',
        curve: 'smooth',
        areaGradient: true,
        data: {
          series: [
            {
              name: 'Load',
              dataPoints: [
                { label: 'A', value: 10 },
                { label: 'B', value: 25 },
                { label: 'C', value: 18 },
              ],
            },
          ],
        },
      })
    );
    doc.pages[0].add(
      new LineChart({
        theme: 'dark',
        title: 'Dark Theme Line',
        curve: 'smooth',
        yAxis: { autoScale: true, valueFormat: 'K1' },
        data: {
          series: [
            {
              name: 'Metric',
              dataPoints: [
                { label: 'A', value: 12500 },
                { label: 'B', value: 28400 },
              ],
            },
          ],
        },
      })
    );
    doc.pages[0].add(
      new PieChart({
        theme: 'modern',
        title: 'Donut Callouts',
        isDonut: true,
        donutHoleRatio: 0.55,
        sliceBorderWidth: 1.5,
        sliceLabelMode: 'callout',
        legendFormat: 'labelPercent',
        data: {
          series: [
            {
              name: 'Share',
              dataPoints: [
                { label: 'Alpha', value: 60 },
                { label: 'Beta', value: 40 },
              ],
            },
          ],
        },
      })
    );
    const bytes = await doc.generateBytesAsync();
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it('validates, loads, renders, and round-trips all 7 new charts via Document Definition', async () => {
    const doc = new Document();
    const charts = buildAllNewCharts();
    for (const chart of Object.values(charts)) {
      doc.pages[0].add(chart);
    }
    const { definition } = await toDefinition(doc);
    const validation = validateDefinition(definition);
    expect(validation.valid).toBe(true);

    const reloaded = await fromDefinition(definition);
    const pdf = await reloaded.generateBytesAsync();
    expect(pdf.length).toBeGreaterThan(2000);
  });
});
