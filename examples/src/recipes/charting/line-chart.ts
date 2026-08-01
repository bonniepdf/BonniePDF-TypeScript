import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  LineChart,
  ChartElement,
  StandardFonts,
} from '@bonniepdf/core';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const C_VIOLET = '#7c3aed';

/**
 * A monthly-revenue line chart - connected points with markers and value labels -
 * authored through the options-object front door. The axis legends are set as
 * part of the `yAxis` / `xAxis` literals.
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
          new TextBlock('BonniePDF - Line Chart', {
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
      title: 'Line Chart',
      author: 'BonniePDF',
      subject: 'Line chart example - connected data points with markers and value labels',
    },
  });

  doc.add(
    new TextBlock('Line Chart: Monthly Revenue Trends', {
      fontSize: 24,
      textColor: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Connected data points with markers and value labels', {
      fontSize: 14,
      textColor: 'slate-600',
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

  doc.add(
    new ChartElement(chart, data, 'Line chart of monthly revenue from January to December, ending at 12,800 GBP.')
  );

  return doc;
}
