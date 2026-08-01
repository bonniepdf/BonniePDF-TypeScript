import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  AreaChart,
  ChartElement,
  StandardFonts,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_PURPLE = '#a855f7';

/**
 * A monthly-sales area chart - a filled area under the line with configurable
 * opacity - authored through the options-object front door.
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
        stack.addChild(
          new TextBlock('BonniePDF - Area Chart', {
            fontName: StandardFonts.Helvetica,
            fontSize: 10,
            textColor: 'slate-500',
          })
        );
        stack.addChild(
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
      title: 'Area Chart',
      author: 'BonniePDF',
      subject: 'Area chart example - filled area under the line with configurable opacity',
    },
  });

  doc.add(
    new TextBlock('Area Chart: Monthly Sales Performance', {
      fontSize: 24,
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Filled area under the line with configurable opacity', {
      fontSize: 14,
      textColor: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800];

  const data = new ChartData({
    title: 'Monthly Sales',
    series: [{ color: C_PURPLE, dataPoints: MONTH_LABELS.map((label, i) => ({ label, value: values[i] })) }],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Sales' },
    xAxis: { legend: 'Month' },
  });

  const chart = new AreaChart({
    height: 380,
    stretchToFit: true,
    areaColor: C_PURPLE,
    fillOpacity: 0.3,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    showValueLabels: true,
    backgroundColor: '#fafafa',
  });

  doc.add(
    new ChartElement(
      chart,
      data,
      'Area chart of monthly sales from January to December, with a filled trend rising to 12,800 GBP.'
    )
  );

  return doc;
}
