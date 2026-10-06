import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  PieChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
];

/**
 * A donut chart of monthly sales - slice colours, legend, and centre total -
 * authored through the options-object front door. The slice palette is a plain
 * `colors` string array on the `PieChart`; a pie has no axes, so `ChartData`
 * just carries the single `series`.
 */
export function generate(): Document {
  const year = new Date().getFullYear();

  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Pie Chart', {
        fontName: StandardFonts.Helvetica,
        fontSize: 10,
        color: 'slate-500',
      })
    );
    stack.add(
      new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`, {
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
      title: 'Pie Chart',
      author: 'BonniePDF',
      subject: 'Pie / donut chart example - monthly sales breakdown with legend and centre total',
    },
  });

  doc.add(
    new TextBlock(`Pie Chart: Monthly Sales ${year}`, {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Donut chart with legend and total value in the centre', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const values = [7234, 4891, 8456, 3127, 9542, 6789, 5234, 8901, 2456, 7890, 6123, 9876];

  const data = new ChartData({
    title: `Monthly Sales ${year}`,
    series: [{ color: '#4f46e5', dataPoints: MONTH_LABELS.map((label, i) => ({ label, value: values[i] })) }],
  });

  const chart = new PieChart({
    data,
    altText: `Donut chart showing ${year} monthly sales share with a legend and total value in the centre.`,
    height: 380,
    stretchToFit: true,
    isDonut: true,
    totalLabel: 'Total',
    showLegend: true,
    colors: ALL_COLORS,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
