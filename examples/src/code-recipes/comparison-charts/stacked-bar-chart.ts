/**
 * Stacked Bar Chart.
 * Multi-series stacked bars showing quarterly revenue by acquisition channel, with category stack totals, segment gaps, and auto-contrast inside labels.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  StackedBarChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Stacked Bar Chart', {
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
      title: 'Stacked Bar Chart',
      author: 'BonniePDF',
      subject: 'Stacked bar chart example - quarterly revenue split by acquisition channel',
    },
  });

  doc.add(
    new TextBlock('Stacked Bar Chart: Revenue Mix by Channel', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Multi-series stacking with compact K totals, segment gaps, and auto-contrast inside labels', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const series = (name: string, values: number[]) => ({
    name,
    dataPoints: QUARTERS.map((label, i) => ({ label, value: values[i] })),
  });

  const data = new ChartData({
    title: 'Quarterly Revenue Mix',
    yAxis: { prefix: '£', valueFormat: 'K0' },
    series: [
      series('Direct', [180000, 215000, 248000, 292000]),
      series('Partner', [95000, 112000, 128000, 146000]),
      series('Self-serve', [64000, 78000, 94000, 118000]),
    ],
  });

  const chart = new StackedBarChart({
    theme: 'modern',
    mode: 'absolute',
    showStackTotals: true,
    stackTotalFormat: 'K0',
    valueLabelFormat: 'K0',
    valueLabelPrefix: '£',
    segmentGap: 1.5,
    data,
    altText:
      'Stacked bar chart showing quarterly revenue split across Direct, Partner, and Self-serve channels, rising from 339K in Q1 to 556K in Q4.',
    height: 380,
    stretchToFit: true,
    fontFamily: StandardFonts.Helvetica,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
