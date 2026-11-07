/**
 * Grouped Bar Chart.
 * Side-by-side bars comparing Electronics, Clothing, and Home and Garden revenue in each quarter, with a colour legend and alt text.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  GroupedBarChart,
  StandardFonts,
  type ColorInput,
  pageTemplate,
} from '@bonniepdf/core';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

/**
 * A grouped bar chart comparing three product lines across four quarters,
 * authored through the options-object front door. Each series is a `ChartData`
 * `series` literal (`name` + `color` + a `dataPoints` array of `{ label, value }`).
 */
export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Grouped Bar Chart', {
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
      title: 'Grouped Bar Chart',
      author: 'BonniePDF',
      subject: 'Grouped bar chart example - three product lines compared quarter by quarter',
    },
  });

  doc.add(
    new TextBlock('Grouped Bar Chart: Quarterly Revenue by Product Line', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Three product lines compared quarter by quarter, 2026', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const series = (name: string, color: ColorInput, values: number[]) => ({
    name,
    color,
    dataPoints: QUARTERS.map((label, i) => ({ label, value: values[i], labelFormat: 'N0' })),
  });

  const data = new ChartData({
    yAxis: { prefix: '£', maxValue: 35000, stepCount: 7 },
    series: [
      series('Electronics', '#4f46e5', [14500, 21800, 22500, 31500]),
      series('Clothing', '#f43f5e', [10500, 14200, 14100, 19400]),
      series('Home & Garden', '#22c55e', [9300, 13000, 12900, 17400]),
    ],
  });

  const chart = new GroupedBarChart({
    theme: 'modern',
    data,
    altText:
      'Grouped bar chart comparing Electronics, Clothing, and Home and Garden revenue in each quarter of 2026; Electronics leads every quarter, reaching 31,500 GBP in Q4.',
    height: 380,
    stretchToFit: true,
    showValueLabels: true,
    fontFamily: StandardFonts.Helvetica,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
