import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  LollipopChart,
  StandardFonts,
} from '@bonniepdf/core';

const C_PINK = '#ec4899';

/**
 * A quarterly-metrics lollipop chart - stems with circular heads, a clear and
 * minimal bar alternative - authored through the options-object front door.
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
          new TextBlock('BonniePDF - Lollipop Chart', {
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
      title: 'Lollipop Chart',
      author: 'BonniePDF',
      subject: 'Lollipop chart example - stems with circular heads, a clear minimal bar alternative',
    },
  });

  doc.add(
    new TextBlock('Lollipop Chart: Quarterly Metrics', {
      fontSize: 24,
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Stems with circular heads - clear and minimal bar alternative', {
      fontSize: 14,
      textColor: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const values = [4500, 6200, 8500, 11500];

  const data = new ChartData({
    title: 'Quarterly Revenue',
    series: [{ color: C_PINK, dataPoints: labels.map((label, i) => ({ label, value: values[i] })) }],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Revenue' },
    xAxis: { legend: 'Quarter' },
  });

  const chart = new LollipopChart({
    data,
    altText: 'Lollipop chart of quarterly revenue, increasing from 4,500 GBP in Q1 to 11,500 GBP in Q4.',
    height: 380,
    stretchToFit: true,
    lollipopColor: C_PINK,
    stemWidth: 2.5,
    headRadius: 10,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    showValueLabels: true,
    backgroundColor: '#fafafa',
  });
  doc.add(chart);

  return doc;
}
