import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  DotPlotChart,
  StandardFonts,
} from '@bonniepdf/core';

const C_TEAL = '#14b8a6';

/**
 * A product-performance dot plot chart - circular markers positioned along a
 * value axis - authored through the options-object front door.
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
          new TextBlock('BonniePDF - Dot Plot Chart', {
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
      title: 'Dot Plot Chart',
      author: 'BonniePDF',
      subject: 'Dot plot chart example - circular markers positioned along a value axis',
    },
  });

  doc.add(
    new TextBlock('Dot Plot Chart: Product Performance', {
      fontSize: 24,
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Circular markers positioned along a value axis', {
      fontSize: 14,
      textColor: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const labels = ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E', 'Prod F', 'Prod G', 'Prod H'];
  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 9500];

  const data = new ChartData({
    title: 'Product Sales',
    series: [{ color: C_TEAL, dataPoints: labels.map((label, i) => ({ label, value: values[i] })) }],
    yAxis: { prefix: '£', maxValue: 12000, stepCount: 5, legend: 'Sales' },
    xAxis: { legend: 'Product' },
  });

  const chart = new DotPlotChart({
    data,
    altText: 'Dot plot comparing eight product sales values, ranging from 4,500 to 9,500 GBP.',
    height: 380,
    stretchToFit: true,
    dotColor: C_TEAL,
    dotRadius: 12,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    showValueLabels: true,
    backgroundColor: '#fafafa',
  });
  doc.add(chart);

  return doc;
}
