/**
 * Heatmap Chart.
 * 2D categorical matrix heatmap showing monthly cohort retention with linear colour interpolation, missing cells, continuous colour legend, and WCAG auto-contrast cell values.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  HeatmapChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Heatmap Chart', {
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
      title: 'Heatmap Chart',
      author: 'BonniePDF',
      subject: 'Heatmap chart example - 2D cohort retention matrix with auto-contrast cell labels',
    },
  });

  doc.add(
    new TextBlock('Heatmap Chart: Monthly Cohort Retention', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('2D matrix colour ramp with missing cells, continuous legend, and WCAG auto-contrast values', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const chart = new HeatmapChart({
    theme: 'modern',
    title: 'Cohort Retention (%)',
    xCategories: ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'],
    yCategories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    values: [
      [100, 84, 76, 71, 68, 65],
      [100, 86, 79, 74, 70, null],
      [100, 88, 82, 77, null, null],
      [100, 90, 84, null, null, null],
      [100, 91, null, null, null, null],
    ],
    valueSuffix: '%',
    altText:
      'Cohort retention heatmap from January to May across months M0 through M5, showing retention improving from 84% in January M1 to 91% in May M1.',
    height: 380,
    stretchToFit: true,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
