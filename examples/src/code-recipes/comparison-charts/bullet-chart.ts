/**
 * Bullet Chart.
 * Executive KPI scorecard with three horizontal bullet gauges showing qualitative background bands, primary measure bars, and target markers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  VerticalStack,
  BulletChart,
  LineChart,
  ChartData,
  StandardFonts,
  pageTemplate,
  type ColorInput,
} from '@bonniepdf/core';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function kpiSparkline(color: ColorInput, target: number, values: number[], altText: string): LineChart {
  return new LineChart({
    theme: 'modern',
    sparkline: true,
    curve: 'smooth',
    lineColor: color,
    sparklineFillOpacity: 0.18,
    sparklineShowEndpoints: true,
    sparklineHighlightMinMax: true,
    sparklineReferenceValue: target,
    borderRadius: 6,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    height: 68,
    stretchToFit: true,
    backgroundColor: '#ffffff',
    altText,
    data: new ChartData({
      series: [{ color, dataPoints: MONTHS.map((label, i) => ({ label, value: values[i] })) }],
    }),
  });
}

export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Bullet Chart', {
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
      title: 'Bullet Chart',
      author: 'BonniePDF',
      subject: 'Bullet chart example - executive KPI gauges with qualitative bands and targets',
    },
  });

  doc.add(
    new TextBlock('Bullet Chart: Executive KPI Scorecard', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Compact KPI gauges with qualitative background ranges, primary measure bars, and target markers', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 24 },
    })
  );

  const stack = new VerticalStack({ spacing: 20 });

  const row1 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  row1.add(
    new BulletChart({
      theme: 'modern',
      label: 'Revenue (£k)',
      value: 275,
      target: 250,
      ranges: [{ max: 150 }, { max: 225 }, { max: 300 }],
      showScale: true,
      showValueLabel: true,
      valuePrefix: '£',
      valueSuffix: 'k',
      borderRadius: 6,
      borderColor: '#e2e8f0',
      borderWidth: 1,
      width: 520,
      height: 68,
      stretchToFit: true,
      backgroundColor: '#ffffff',
      altText: 'Bullet chart showing revenue at 275k against a 250k target.',
    }),
    3
  );
  row1.add(
    kpiSparkline(
      '#2563eb',
      250,
      [195, 204, 212, 208, 224, 236, 241, 248, 255, 262, 269, 275],
      'Twelve-month revenue sparkline rising from 195k to 275k against a 250k target.'
    ),
    1
  );
  stack.add(row1);

  const row2 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  row2.add(
    new BulletChart({
      theme: 'modern',
      label: 'Gross Margin',
      value: 74,
      target: 78,
      ranges: [{ max: 50 }, { max: 75 }, { max: 100 }],
      showScale: true,
      showValueLabel: true,
      valueSuffix: '%',
      measureColor: '#0d9488',
      borderRadius: 6,
      borderColor: '#e2e8f0',
      borderWidth: 1,
      width: 520,
      height: 68,
      stretchToFit: true,
      backgroundColor: '#ffffff',
      altText: 'Bullet chart showing gross margin at 74% against a 78% target.',
    }),
    3
  );
  row2.add(
    kpiSparkline(
      '#0d9488',
      78,
      [68, 69, 71, 70, 72, 73, 71, 72, 73, 75, 74, 74],
      'Twelve-month gross margin sparkline trending from 68% to 74% against a 78% target.'
    ),
    1
  );
  stack.add(row2);

  const row3 = new HorizontalStack({ spacing: 16, widthDistribution: 'weighted' });
  row3.add(
    new BulletChart({
      theme: 'modern',
      label: 'Net Promoter',
      value: 64,
      target: 60,
      ranges: [{ max: 30 }, { max: 55 }, { max: 80 }],
      showScale: true,
      showValueLabel: true,
      measureColor: '#7c3aed',
      borderRadius: 6,
      borderColor: '#e2e8f0',
      borderWidth: 1,
      width: 520,
      height: 68,
      stretchToFit: true,
      backgroundColor: '#ffffff',
      altText: 'Bullet chart showing Net Promoter Score at 64 against a target of 60.',
    }),
    3
  );
  row3.add(
    kpiSparkline(
      '#7c3aed',
      60,
      [51, 53, 52, 55, 57, 58, 59, 61, 60, 62, 63, 64],
      'Twelve-month Net Promoter Score sparkline climbing from 51 to 64 against a 60 target.'
    ),
    1
  );
  stack.add(row3);

  doc.add(stack);

  return doc;
}
