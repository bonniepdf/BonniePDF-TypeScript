import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  LollipopChart,
  ChartOrientation,
  StandardFonts,
} from '@bonniepdf/core';

const C_VIOLET = '#7c3aed';

/**
 * A horizontal lollipop chart ranking product revenue - lollipop style reduces
 * ink without losing clarity - authored through the options-object front door.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
      footerTemplate: (pageNumber: number) => {
        const stack = new HorizontalStack({ widthDistribution: 'weighted' });
        stack.add(
          new TextBlock('BonniePDF - Horizontal Lollipop Chart', {
            fontName: StandardFonts.Helvetica,
            fontSize: 10,
            textColor: 'slate-500',
          })
        );
        stack.add(
          new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`, {
            fontName: StandardFonts.Helvetica,
            fontSize: 10,
            textColor: 'slate-500',
            alignment: 'right',
          }),
          1
        );
        return stack;
      },
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
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Year-to-date revenue per product line - lollipop style reduces ink without losing clarity', {
      fontSize: 14,
      textColor: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const products = [
    { label: 'Product A', value: 45000 },
    { label: 'Product B', value: 62000 },
    { label: 'Product C', value: 38500 },
    { label: 'Product D', value: 71000 },
    { label: 'Product E', value: 55000 },
    { label: 'Product F', value: 83000 },
    { label: 'Product G', value: 49000 },
    { label: 'Product H', value: 91000 },
  ];

  const data = new ChartData({
    title: 'Product Revenue',
    series: [
      {
        color: C_VIOLET,
        dataPoints: products.map(r => ({ label: r.label, value: r.value, labelFormat: "'£'#,##0" })),
      },
    ],
    yAxis: { prefix: '£', maxValue: 100000, stepCount: 5, showGridLines: true, legend: 'Revenue' },
    xAxis: { legend: 'Product' },
  });

  const chart = new LollipopChart({
    data,
    altText: 'Horizontal lollipop chart showing product revenue ranking for eight product lines.',
    orientation: ChartOrientation.Horizontal,
    height: 400,
    stretchToFit: true,
    lollipopColor: C_VIOLET,
    stemWidth: 2,
    headRadius: 9,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    showValueLabels: true,
    backgroundColor: '#fafafa',
  });
  doc.add(chart);

  return doc;
}
