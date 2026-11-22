/**
 * Waterfall Chart.
 * Cumulative annual recurring revenue movement bridge with positive/negative deltas, auto-computed ending total, and dashed connectors.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  WaterfallChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Waterfall Chart', {
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
      title: 'Waterfall Chart',
      author: 'BonniePDF',
      subject: 'Waterfall chart example - cumulative ARR variance bridge with totals and connectors',
    },
  });

  doc.add(
    new TextBlock('Waterfall Chart: ARR Movement Bridge', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock(
      'Cumulative variance bridge with positive/negative deltas, auto-computed ending total, and connectors',
      {
        fontSize: 14,
        color: 'slate-600',
        alignment: 'center',
        margin: { bottom: 20 },
      }
    )
  );

  const data = new ChartData({
    title: 'Annual Recurring Revenue Bridge',
    yAxis: { prefix: '£', valueFormat: 'K1' },
    series: [
      {
        name: 'ARR',
        dataPoints: [
          { label: 'Start', value: 800000, kind: 'total' },
          { label: 'New', value: 260000, kind: 'delta' },
          { label: 'Expansion', value: 135000, kind: 'delta' },
          { label: 'Churn', value: -85000, kind: 'delta' },
          { label: 'Contraction', value: -40000, kind: 'delta' },
          { label: 'Ending', kind: 'total' },
        ],
      },
    ],
  });

  const chart = new WaterfallChart({
    theme: 'modern',
    valueLabelPrefix: '£',
    valueLabelFormat: 'K1',
    data,
    altText:
      'Waterfall bridge from 800k starting ARR through new business, expansion, churn, and contraction to 1.07M ending ARR.',
    height: 380,
    stretchToFit: true,
    fontFamily: StandardFonts.Helvetica,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
