/**
 * Horizontal Bar Chart.
 * Horizontal bars ranking full-year sales across six UK regions, with value labels. The orientation reads better when category names are long.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextBlock,
  HorizontalStack,
  TextElementBase,
  ChartData,
  BarChart,
  ChartOrientation,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const C_INDIGO = '#4f46e5';

/**
 * A regional-sales horizontal bar chart - horizontal orientation suits ranked
 * comparisons - authored through the options-object front door. `orientation`
 * has no token form, so it stays `ChartOrientation.Horizontal`; the value
 * format is a per-point `labelFormat`.
 */
export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Horizontal Bar Chart', {
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
      title: 'Horizontal Bar Chart',
      author: 'BonniePDF',
      subject: 'Regional sales ranking using a horizontal bar chart',
    },
  });

  doc.add(
    new TextBlock('Horizontal Bar Chart: Regional Sales Performance', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Full-year revenue by region - horizontal orientation suits ranked comparisons', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const regions = [
    { label: 'North East', value: 142000 },
    { label: 'North West', value: 187000 },
    { label: 'Midlands', value: 203000 },
    { label: 'East Anglia', value: 96000 },
    { label: 'South East', value: 261000 },
    { label: 'South West', value: 118000 },
  ];

  const data = new ChartData({
    title: 'Regional Sales',
    series: [
      {
        color: C_INDIGO,
        dataPoints: regions.map(r => ({ label: r.label, value: r.value, labelFormat: 'N0' })),
      },
    ],
    yAxis: { prefix: '£', maxValue: 300000, stepCount: 5, showGridLines: true, legend: 'Revenue' },
    xAxis: { legend: 'Region' },
  });

  const chart = new BarChart({
    data,
    altText: 'Horizontal bar chart showing regional sales performance across six UK regions.',
    orientation: ChartOrientation.Horizontal,
    height: 380,
    stretchToFit: true,
    barColor: C_INDIGO,
    barWidthRatio: 0.55,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 9,
    showValueLabels: true,
    backgroundColor: '#fafafa',
  });
  doc.add(chart);

  return doc;
}
