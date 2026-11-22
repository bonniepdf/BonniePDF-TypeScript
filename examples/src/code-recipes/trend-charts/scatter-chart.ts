/**
 * Scatter Chart.
 * Continuous numeric X/Y scatter plot comparing cluster latency against throughput, with area-scaled bubbles and OLS linear trendlines.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  ScatterChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Scatter Chart', {
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
      title: 'Scatter Chart',
      author: 'BonniePDF',
      subject: 'Scatter chart example - continuous X/Y coordinates with bubble sizing and linear trendline',
    },
  });

  doc.add(
    new TextBlock('Scatter Chart: Latency vs. Throughput', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Continuous numeric X/Y coordinates with area-scaled bubbles and OLS linear trendline', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const data = new ChartData({
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

  const chart = new ScatterChart({
    theme: 'modern',
    showTrendline: 'linear',
    data,
    altText:
      'Scatter bubble chart of p95 latency versus throughput for EU and US regions, with bubble size proportional to active nodes and linear trendlines.',
    height: 380,
    stretchToFit: true,
    fontFamily: StandardFonts.Helvetica,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
