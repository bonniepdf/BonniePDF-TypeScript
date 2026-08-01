import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  BarChart,
  ChartElement,
  StandardFonts,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_INDIGO = '#4f46e5';

/**
 * A monthly-sales bar chart - vertical bars, grid lines, value labels - authored
 * through the options-object front door.
 *
 * The whole chart is built as data: the `ChartData` takes a `series` array of
 * option literals (each with a `dataPoints` array of `{ label, value }`), the
 * value axis is a nested `yAxis` literal, and the `BarChart` styling is one
 * options object. Colours are hex/token strings.
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
          new TextBlock('BonniePDF - Bar Chart', {
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
      title: 'Bar Chart',
      author: 'BonniePDF',
      subject: 'Bar chart example - monthly sales with vertical bars, grid lines, and value labels',
    },
  });

  doc.add(
    new TextBlock('Bar Chart: Monthly Sales Report', {
      fontSize: 24,
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Vertical bars with grid lines and value labels', {
      fontSize: 14,
      textColor: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800];

  const data = new ChartData({
    title: 'Monthly Sales',
    series: [{ color: C_INDIGO, dataPoints: MONTH_LABELS.map((label, i) => ({ label, value: values[i] })) }],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5 },
  });

  const chart = new BarChart({
    height: 380,
    stretchToFit: true,
    barColor: C_INDIGO,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    backgroundColor: '#fafafa',
  });

  doc.add(
    new ChartElement(
      chart,
      data,
      'Bar chart of monthly sales from January to December, rising from 4,500 to 12,800 GBP.'
    )
  );

  return doc;
}
