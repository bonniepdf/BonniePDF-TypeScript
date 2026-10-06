import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  LineChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_VIOLET = '#7c3aed';

/**
 * A monthly-revenue line chart - connected points with markers and value labels -
 * authored through the options-object front door. The axis legends are set as
 * part of the `yAxis` / `xAxis` literals.
 */
export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Line Chart', {
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
      title: 'Line Chart',
      author: 'BonniePDF',
      subject: 'Line chart example - connected data points with markers and value labels',
    },
  });

  doc.add(
    new TextBlock('Line Chart: Monthly Revenue Trends', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Connected data points with markers and value labels', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const values = [4500, 6200, 5800, 7200, 8500, 9100, 8200, 7800, 9500, 10200, 11500, 12800];

  const data = new ChartData({
    title: 'Monthly Revenue',
    series: [{ color: C_VIOLET, dataPoints: MONTH_LABELS.map((label, i) => ({ label, value: values[i] })) }],
    yAxis: { prefix: '£', maxValue: 15000, stepCount: 5, legend: 'Revenue' },
    xAxis: { legend: 'Month' },
  });

  const chart = new LineChart({
    data,
    altText: 'Line chart of monthly revenue from January to December, ending at 12,800 GBP.',
    height: 380,
    stretchToFit: true,
    lineColor: C_VIOLET,
    lineWidth: 2.5,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    showValueLabels: true,
    showDataPointMarkers: true,
    backgroundColor: '#fafafa',
  });
  doc.add(chart);

  return doc;
}
