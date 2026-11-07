/**
 * Multi-Series Line Chart.
 * Two overlapping line series comparing this year’s monthly revenue with last year’s on a shared axis, with a legend and alt text.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  LineChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A year-over-year multi-series line chart - two series on a shared axis -
 * authored through the options-object front door. Each year is a `series`
 * literal with its own `name` and `color`.
 */
export function generate(): Document {
  const year = new Date().getFullYear();

  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Multi-Series Line Chart', {
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
      title: 'Multi-Series Line Chart',
      author: 'BonniePDF',
      subject: `Year-over-year revenue comparison - ${year - 1} vs ${year} on a shared axis`,
    },
  });

  doc.add(
    new TextBlock('Multi-Series Line Chart: Year-over-Year Comparison', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock(`Comparing ${year - 1} and ${year} revenue with a shared axis`, {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const points = (values: number[]) => MONTH_LABELS.map((label, i) => ({ label, value: values[i], labelFormat: 'N0' }));

  const data = new ChartData({
    title: 'Year-over-Year Revenue Comparison',
    series: [
      {
        name: String(year - 1),
        color: '#94a3b8',
        dataPoints: points([65000, 69000, 80000, 72000, 85000, 88000, 72000, 68000, 75000, 81000, 92000, 105000]),
      },
      {
        name: String(year),
        color: '#4f46e5',
        dataPoints: points([75000, 78000, 85000, 78000, 92000, 95000, 87000, 78000, 82000, 91000, 97000, 118000]),
      },
    ],
    yAxis: { prefix: '£', maxValue: 150000, stepCount: 5, legend: 'Revenue' },
    xAxis: { legend: 'Month' },
  });

  const chart = new LineChart({
    theme: 'modern',
    // Twelve points per line: value labels would collide, so the axis carries the scale.
    showValueLabels: false,
    data,
    altText: `Multi-series line chart comparing monthly revenue for ${year - 1} and ${year}.`,
    height: 380,
    stretchToFit: true,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
