/**
 * Lollipop Chart.
 * Stems with circular heads, a lighter alternative to bar charts, showing twelve months of revenue rising through 2026, with a legend and alt text.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  LollipopChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const C_PINK = '#ec4899';

/**
 * A quarterly-metrics lollipop chart - stems with circular heads, a clear and
 * minimal bar alternative - authored through the options-object front door.
 */
export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Lollipop Chart', {
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
      title: 'Lollipop Chart',
      author: 'BonniePDF',
      subject: 'Lollipop chart example - stems with circular heads, a clear minimal bar alternative',
    },
  });

  doc.add(
    new TextBlock('Lollipop Chart: Monthly Revenue', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Stems with circular heads - clear and minimal bar alternative', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const values = [1420, 1510, 1630, 1580, 1720, 1890, 1960, 1840, 2030, 2210, 2380, 2640];

  const data = new ChartData({
    title: 'Monthly Revenue',
    series: [{ color: C_PINK, dataPoints: labels.map((label, i) => ({ label, value: values[i], labelFormat: 'N0' })) }],
    yAxis: { prefix: '£', maxValue: 3000, stepCount: 6, legend: 'Revenue' },
    xAxis: { legend: 'Month' },
  });

  const chart = new LollipopChart({
    theme: 'modern',
    data,
    altText: 'Lollipop chart of monthly revenue in 2026, rising from 1,420 GBP in January to 2,640 GBP in December.',
    height: 380,
    stretchToFit: true,
    lollipopColor: C_PINK,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    showValueLabels: true,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
