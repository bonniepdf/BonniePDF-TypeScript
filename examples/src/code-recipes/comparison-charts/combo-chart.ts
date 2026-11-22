/**
 * Combo Chart.
 * Primary revenue bars paired with a smooth gross-margin percentage line on a secondary right-hand Y axis.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  pageNumber,
  Document,
  TextBlock,
  HorizontalStack,
  ChartData,
  ComboChart,
  StandardFonts,
  pageTemplate,
} from '@bonniepdf/core';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function generate(): Document {
  function pageFooter() {
    const stack = new HorizontalStack({ widthDistribution: 'weighted' });
    stack.add(
      new TextBlock('BonniePDF - Combo Chart', {
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
      title: 'Combo Chart',
      author: 'BonniePDF',
      subject: 'Combo chart example - revenue bars on primary axis and gross margin line on secondary axis',
    },
  });

  doc.add(
    new TextBlock('Combo Chart: Revenue vs. Gross Margin', {
      fontSize: 24,
      color: 'slate-800',
      alignment: 'center',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock('Primary revenue bars paired with a smooth gross-margin percentage line on a secondary Y axis', {
      fontSize: 14,
      color: 'slate-600',
      alignment: 'center',
      margin: { bottom: 20 },
    })
  );

  const data = new ChartData({
    title: 'Quarterly Revenue & Gross Margin',
    yAxis: { prefix: '£', valueFormat: 'K0' },
    series: [
      {
        name: 'Revenue',
        seriesType: 'bar',
        valueAxis: 'primary',
        dataPoints: QUARTERS.map((label, i) => ({ label, value: [420000, 485000, 540000, 635000][i] })),
      },
      {
        name: 'Gross Margin',
        seriesType: 'line',
        valueAxis: 'secondary',
        color: '#f59e0b',
        style: { curve: 'smooth', lineWidth: 2.5, markerFill: 'hollow', markerHaloWidth: 1.5 },
        dataPoints: QUARTERS.map((label, i) => ({ label, value: [68, 71, 74, 79][i] })),
      },
    ],
  });

  const chart = new ComboChart({
    theme: 'modern',
    showValueLabels: false,
    legendPosition: 'top',
    secondaryYAxis: { minValue: 50, maxValue: 90, suffix: '%', valueFormat: 'F0' },
    data,
    altText:
      'Combo chart comparing quarterly revenue bars from 420K to 635K GBP against gross margin rising from 68% to 79% on a secondary axis.',
    height: 380,
    stretchToFit: true,
    fontFamily: StandardFonts.Helvetica,
    backgroundColor: '#ffffff',
  });
  doc.add(chart);

  return doc;
}
