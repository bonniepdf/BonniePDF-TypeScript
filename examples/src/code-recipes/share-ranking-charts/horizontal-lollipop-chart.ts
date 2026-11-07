/**
 * Horizontal Lollipop Chart.
 * Horizontal stems with circular heads ranking year-to-date revenue for eight product lines: less ink than bars without losing clarity.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  LollipopChart,
  ChartOrientation,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const C_VIOLET = '#7c3aed';

/**
 * A horizontal lollipop chart ranking product revenue - lollipop style reduces
 * ink without losing clarity - authored through the options-object front door.
 */
export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Horizontal Lollipop Chart', {
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
      title: 'Horizontal Lollipop Chart',
      author: 'BonniePDF',
      subject: 'Product revenue ranking using a horizontal lollipop chart',
    },
  });

  doc.add(
    new TextBlock('Horizontal Lollipop Chart: Product Revenue Ranking', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Year-to-date revenue per product line - lollipop style reduces ink without losing clarity', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const products = [
    { label: 'Product H', value: 91000 },
    { label: 'Product F', value: 83000 },
    { label: 'Product D', value: 71000 },
    { label: 'Product B', value: 62000 },
    { label: 'Product E', value: 55000 },
    { label: 'Product G', value: 49000 },
    { label: 'Product A', value: 45000 },
    { label: 'Product C', value: 38500 },
  ];

  const data = new ChartData({
    title: 'Product Revenue',
    series: [
      {
        color: C_VIOLET,
        dataPoints: products.map(r => ({ label: r.label, value: r.value, labelFormat: 'N0' })),
      },
    ],
    yAxis: { prefix: '£', maxValue: 100000, stepCount: 5, showGridLines: true, legend: 'Revenue' },
    xAxis: { legend: 'Product' },
  });

  const chart = new LollipopChart({
    theme: 'modern',
    data,
    altText: 'Horizontal lollipop chart showing product revenue ranking for eight product lines.',
    orientation: ChartOrientation.Horizontal,
    height: 400,
    stretchToFit: true,
    showValueLabels: true,
    lollipopColor: C_VIOLET,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
