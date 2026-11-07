/**
 * Pie Chart (Class API).
 * The same revenue-by-channel donut as Pie Chart, built with the class API: construct each object and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  AccessibilityMode,
  ChartData,
  ChartDataPoint,
  ChartSeries,
  Color,
  ColorPalette,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalStack,
  PageOrientation,
  PdfAConformance,
  PdfSize,
  PieChart,
  StandardFonts,
  Table,
  TableRow,
  TextAlignment,
  TextBlock,
  TextStyle,
  Thickness,
  VerticalStack,
  WidthDistribution,
  pageTemplate,
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
 * The **class / construct-then-mutate** companion to `pie-chart.ts`.
 *
 * Same donut, legend, total and summary table, authored the long way: `new`
 * each object, then assign its properties. It renders **byte-for-byte
 * identically** to the options-style `pie-chart.ts` (an equivalence test binds
 * the two).
 */
export function generate(): Document {
  const total = CHANNELS.reduce((sum, [, revenue]) => sum + revenue, 0);
  const share = (revenue: number) => `${Math.round((revenue / total) * 100)}%`;

  const footer = new TextBlock('Northwind Homewares  ·  Revenue review, year to March 2026');
  footer.fontSize = 9;
  footer.color = ColorPalette.slate[500];

  const settings = new DocumentSettings();
  settings.pageSize = PdfSize.a4;
  settings.orientation = PageOrientation.Landscape;
  settings.margin = 44;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[600]);
  settings.footerTemplate = pageTemplate({ default: footer });

  const metadata = new DocumentMetadata();
  metadata.title = 'Revenue by Channel';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Pie / donut chart example - revenue share by sales channel with legend and total';

  const doc = new Document(settings, metadata);

  const title = new Heading('Revenue by channel');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.color = ColorPalette.slate[900];
  title.margin = new Thickness(0, 0, 0, 4);
  doc.add(title);

  const subtitle = new TextBlock('Year to March 2026. The online shop now brings in over two fifths of revenue.');
  subtitle.fontSize = 12;
  subtitle.margin = new Thickness(0, 0, 0, 14);
  doc.add(subtitle);

  const series = new ChartSeries();
  series.name = 'Revenue';
  // The share goes in the label, so the legend reads "Online shop (40%) - 412,600".
  series.dataPoints = CHANNELS.map(([channel, revenue]) => {
    const point = new ChartDataPoint();
    point.label = `${channel} (${share(revenue)})`;
    point.value = revenue;
    point.labelFormat = 'N0';
    return point;
  });
  const data = new ChartData();
  data.series = [series];

  const chart = new PieChart();
  chart.data = data;
  chart.altText = `Donut chart of revenue by channel, year to March 2026: ${CHANNELS.map(
    ([channel, revenue]) => `${channel} ${share(revenue)}`
  ).join(', ')}. Total £${total.toLocaleString('en-GB')}.`;
  chart.height = 360;
  chart.stretchToFit = true;
  chart.isDonut = true;
  chart.totalLabel = 'Total (£)';
  chart.totalValueFormat = 'N0';
  chart.showLegend = true;
  chart.colors = COLORS;
  chart.backgroundColor = Color.white;

  // The same figures as a table, with the year-on-year change the chart cannot show.
  const table = new Table(3, 2, 1.4, 1.4);
  table.headerBackgroundColor = ColorPalette.slate[800];
  table.headerTextColor = Color.white;
  table.cellPadding = 6;
  table.addHeader(
    cell('Channel', true),
    cell('Revenue', true, true),
    cell('Share', true, true),
    cell('vs LY', true, true)
  );
  for (const [channel, revenue, change] of CHANNELS) {
    table.addRow(
      TableRow.fromElements(
        cell(channel),
        cell(`£${revenue.toLocaleString('en-GB')}`, false, true),
        cell(share(revenue), false, true),
        cell(
          `${change > 0 ? '+' : ''}${change}%`,
          false,
          true,
          change < 0 ? ColorPalette.red[700] : ColorPalette.emerald[700]
        )
      )
    );
  }
  table.addRow(
    TableRow.fromElements(
      cell('Total', true),
      cell(`£${total.toLocaleString('en-GB')}`, true, true),
      cell('100%', true, true),
      cell('')
    )
  );

  const summaryHeading = new Heading('Summary');
  summaryHeading.level = 2;
  summaryHeading.fontName = StandardFonts.HelveticaBold;
  summaryHeading.fontSize = 14;
  summaryHeading.color = ColorPalette.slate[900];

  const note = new TextBlock(
    'Marketplaces grew fastest from a small base. Events fell as two trade fairs moved to the following year.'
  );
  note.fontSize = 10;

  const summary = new VerticalStack();
  summary.spacing = 10;
  summary.add(summaryHeading);
  summary.add(table);
  summary.add(note);

  const row = new HorizontalStack();
  row.spacing = 28;
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(chart, 3);
  row.add(summary, 2);
  doc.add(row);

  return doc;
}

// Local helpers used by this document.

/** A 10pt table cell, optionally bold, right-aligned or coloured. */
function cell(text: string, bold = false, right = false, color: Color = ColorPalette.slate[700]): TextBlock {
  const block = new TextBlock(text);
  block.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = 10;
  block.alignment = right ? TextAlignment.Right : TextAlignment.Left;
  block.color = color;
  return block;
}
