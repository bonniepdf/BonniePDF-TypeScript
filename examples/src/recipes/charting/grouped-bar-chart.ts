import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  GroupedBarChart,
  GroupedBarChartElement,
  StandardFonts,
  type ColorInput,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A grouped bar chart comparing three product lines across twelve months,
 * authored through the options-object front door. Each series is a `ChartData`
 * `series` literal (`name` + `color` + a `dataPoints` array of `{ label, value }`).
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
          new TextBlock('BonniePDF - Grouped Bar Chart', {
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
      title: 'Grouped Bar Chart',
      author: 'BonniePDF',
      subject: 'Grouped bar chart example - three product lines compared across 12 months',
    },
  });

  doc.add(
    new TextBlock('Grouped Bar Chart: Quarterly Revenue by Product Line', {
      fontSize: 24,
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Comparison of three product lines across all months', {
      fontSize: 14,
      textColor: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const series = (name: string, color: ColorInput, values: number[]) => ({
    name,
    color,
    dataPoints: MONTH_LABELS.map((label, i) => ({ label, value: values[i] })),
  });

  const data = new ChartData({
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5 },
    series: [
      series('Electronics', '#4f46e5', [4500, 5200, 4800, 6200, 7500, 8100, 7200, 6800, 8500, 9200, 10500, 11800]),
      series('Clothing', '#f43f5e', [3200, 3800, 3500, 4200, 4800, 5200, 4600, 4400, 5100, 5800, 6400, 7200]),
      series('Home & Garden', '#22c55e', [2800, 3400, 3100, 3800, 4400, 4800, 4200, 4000, 4700, 5400, 6000, 6800]),
    ],
  });

  const chart = new GroupedBarChart({
    height: 380,
    stretchToFit: true,
    showValueLabels: true,
    fontFamily: StandardFonts.Helvetica,
    backgroundColor: '#fafafa',
  });

  doc.add(
    new GroupedBarChartElement(
      chart,
      data,
      'Grouped bar chart comparing Electronics, Clothing, and Home and Garden sales across twelve months.'
    )
  );

  return doc;
}
