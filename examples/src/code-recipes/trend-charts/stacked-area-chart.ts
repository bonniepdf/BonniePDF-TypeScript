/**
 * Stacked Area Chart.
 * 100% normalized smooth stacked area chart showing platform traffic share across Web, Mobile, and API with inline series labels.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  StackedAreaChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Stacked Area Chart', {
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
      title: 'Stacked Area Chart',
      author: 'BonniePDF',
      subject: 'Stacked area chart example - 100% normalized platform traffic share',
    },
  });

  doc.add(
    new TextBlock('Stacked Area Chart: Platform Traffic Share', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('100% normalized smooth stacked area bands with inline series labels', {
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
    title: 'Traffic Share (%)',
    yAxis: { suffix: '%' },
    series: [series('Web', [58, 54, 50, 47]), series('Mobile', [30, 33, 36, 38]), series('API', [12, 13, 14, 15])],
  });

  const chart = new StackedAreaChart({
    theme: 'modern',
    mode: 'percent',
    curve: 'smooth',
    legendPosition: 'inline',
    data,
    altText:
      '100% stacked area chart showing platform traffic share shifting from Web (58% to 47%) toward Mobile (30% to 38%) and API (12% to 15%).',
    height: 380,
    stretchToFit: true,
    fontFamily: StandardFonts.Helvetica,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
