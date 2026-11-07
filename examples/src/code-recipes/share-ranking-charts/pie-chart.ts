/**
 * Pie Chart.
 * A donut chart of revenue by sales channel, with each channel's share in the legend, the formatted total beneath it, a summary table alongside, and alt text for screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  ChartData,
  Document,
  Heading,
  HorizontalStack,
  PieChart,
  StandardFonts,
  Table,
  TableRow,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
} from '@bonniepdf/core';

/** [channel, revenue in £, change on last year in %] - five shares, not twelve months. */
const CHANNELS: [string, number, number][] = [
  ['Online shop', 412_600, 18],
  ['Retail stores', 298_400, -4],
  ['Wholesale', 176_900, 6],
  ['Marketplaces', 94_300, 31],
  ['Events', 38_700, -12],
];

/** One colour per channel, in slice order. */
const COLORS = ['#4f46e5', '#0d9488', '#f59e0b', '#e11d48', '#94a3b8'];

/**
 * A donut chart of revenue share by channel - slice colours, legend and a
 * formatted total - authored through the options-object front door. A pie suits
 * a handful of parts of one whole; for values over time, use a bar or line chart.
 * The slice palette is a plain `colors` array on the `PieChart`; a pie has no
 * axes, so `ChartData` carries a single `series`.
 */
export function generate(): Document {
  const total = CHANNELS.reduce((sum, [, revenue]) => sum + revenue, 0);
  const share = (revenue: number) => `${Math.round((revenue / total) * 100)}%`;

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 44,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-600' },
      footerTemplate: pageTemplate({
        default: new TextBlock('Northwind Homewares  ·  Revenue review, year to March 2026', {
          fontSize: 9,
          color: 'slate-500',
        }),
      }),
    },
    metadata: {
      title: 'Revenue by Channel',
      author: 'BonniePDF',
      subject: 'Pie / donut chart example - revenue share by sales channel with legend and total',
    },
  });

  doc.add(
    new Heading('Revenue by channel', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-900',
      margin: { bottom: 4 },
    })
  );
  doc.add(
    new TextBlock('Year to March 2026. The online shop now brings in over two fifths of revenue.', {
      fontSize: 12,
      margin: { bottom: 14 },
    })
  );

  const chart = new PieChart({
    data: new ChartData({
      series: [
        {
          name: 'Revenue',
          // The share goes in the label, so the legend reads "Online shop (40%) - 412,600".
          dataPoints: CHANNELS.map(([channel, revenue]) => ({
            label: `${channel} (${share(revenue)})`,
            value: revenue,
            labelFormat: 'N0',
          })),
        },
      ],
    }),
    altText: `Donut chart of revenue by channel, year to March 2026: ${CHANNELS.map(
      ([channel, revenue]) => `${channel} ${share(revenue)}`
    ).join(', ')}. Total £${total.toLocaleString('en-GB')}.`,
    height: 360,
    stretchToFit: true,
    isDonut: true,
    totalLabel: 'Total (£)',
    totalValueFormat: 'N0',
    showLegend: true,
    colors: COLORS,
    backgroundColor: '#ffffff',
  });

  // The same figures as a table, with the year-on-year change the chart cannot show.
  const table = new Table({
    columns: [3, 2, 1.4, 1.4],
    headerBackgroundColor: 'slate-800',
    headerTextColor: '#ffffff',
    cellPadding: 6,
  });
  table.addHeader(
    cell('Channel', { bold: true }),
    cell('Revenue', { bold: true, right: true }),
    cell('Share', { bold: true, right: true }),
    cell('vs LY', { bold: true, right: true })
  );
  for (const [channel, revenue, change] of CHANNELS) {
    table.addRow(
      TableRow.fromElements(
        cell(channel),
        cell(`£${revenue.toLocaleString('en-GB')}`, { right: true }),
        cell(share(revenue), { right: true }),
        cell(`${change > 0 ? '+' : ''}${change}%`, { right: true, color: change < 0 ? 'red-700' : 'emerald-700' })
      )
    );
  }
  table.addRow(
    TableRow.fromElements(
      cell('Total', { bold: true }),
      cell(`£${total.toLocaleString('en-GB')}`, { bold: true, right: true }),
      cell('100%', { bold: true, right: true }),
      cell('')
    )
  );

  const row = new HorizontalStack({ spacing: 28, widthDistribution: 'weighted' });
  row.add(chart, 3);
  row.add(
    new VerticalStack({
      spacing: 10,
      children: [
        new Heading('Summary', { level: 2, fontName: StandardFonts.HelveticaBold, fontSize: 14, color: 'slate-900' }),
        table,
        new TextBlock(
          'Marketplaces grew fastest from a small base. Events fell as two trade fairs moved to the following year.',
          { fontSize: 10 }
        ),
      ],
    }),
    2
  );
  doc.add(row);

  return doc;
}

// Local helpers used by this document.

/** A 10pt table cell, optionally bold, right-aligned or coloured. */
function cell(text: string, style: { bold?: boolean; right?: boolean; color?: ColorInput } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 10,
    alignment: style.right ? 'right' : 'left',
    color: style.color ?? 'slate-700',
  });
}
