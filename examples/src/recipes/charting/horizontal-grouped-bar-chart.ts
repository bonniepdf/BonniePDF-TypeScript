/**
 * Horizontal Grouped Bar Chart.
 * Grouped horizontal bars comparing three product lines across four quarters of sales, with grid lines and a colour legend.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  GroupedBarChart,
  ChartOrientation,
  StandardFonts,
  type ColorInput,
  pageTemplate,
} from '@bonniepdf/core';

const C_INDIGO = '#4f46e5';
const C_ROSE = '#e11d48';
const C_GREEN = '#16a34a';

/**
 * A horizontal grouped bar chart - three product lines across four quarters -
 * authored through the options-object front door.
 */
export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Horizontal Grouped Bar Chart', {
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
      title: 'Horizontal Grouped Bar Chart',
      author: 'BonniePDF',
      subject: 'Quarterly regional sales using a horizontal grouped bar chart',
    },
  });

  doc.add(
    new TextBlock('Horizontal Grouped Bar Chart: Quarterly Sales by Region', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Three product lines compared across four quarters - horizontal grouped layout', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const series = (name: string, color: ColorInput, values: number[]) => ({
    name,
    color,
    dataPoints: quarters.map((label, i) => ({ label, value: values[i] })),
  });

  const data = new ChartData({
    series: [
      series('Electronics', C_INDIGO, [42000, 58000, 71000, 95000]),
      series('Clothing', C_ROSE, [31000, 44000, 52000, 68000]),
      series('Home & Garden', C_GREEN, [24000, 37000, 41000, 53000]),
    ],
    yAxis: { prefix: '£', maxValue: 110000, stepCount: 5, showGridLines: true, legend: 'Revenue' },
    xAxis: { legend: 'Quarter' },
  });

  const chart = new GroupedBarChart({
    data,
    altText: 'Horizontal grouped bar chart comparing quarterly sales across three product lines.',
    orientation: ChartOrientation.Horizontal,
    height: 380,
    stretchToFit: true,
    barWidthRatio: 0.7,
    groupGapRatio: 0.25,
    fontFamily: StandardFonts.Helvetica,
    showValueLabels: false,
    showLegend: true,
    backgroundColor: '#fafafa',
  });
  doc.add(chart);

  return doc;
}
