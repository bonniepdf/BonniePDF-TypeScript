// Shared "inside the report" capabilities spread for the annual-report covers.
//
// Each cover example is a single full-bleed page of artwork. On its own that
// sells the *look*; it does not prove what BonniePDF can lay out inside a real
// annual report. This module appends a second page that does exactly that - a
// KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a
// financial-summary table - so every cover showcase reads as a two-page report:
// a striking cover, then a page that demonstrates tables and charts together.
//
// The covers use a zero-margin document (the artwork bleeds to the paper edge),
// so this page supplies its own inset via a padded container.

import {
  Document,
  Heading,
  TextBlock,
  TextAlignment,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Border,
  BorderColors,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  ChartData,
  ChartBase,
  ChartSeries,
  ChartDataPoint,
  BarChart,
  PieChart,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

export interface ReportBrand {
  company: string;
  year: number;
  /** Deepest brand colour - headings, primary bars, KPI accents. */
  primary: Color;
  /** Secondary accent - eyebrow text, rules. */
  accent: Color;
  /** Light tint for card backgrounds. */
  tint: Color;
  /** Ordered segment colours for the donut (hex strings). */
  segmentColors: string[];
}

const INK = ColorPalette.slate[700];
const MUTED = ColorPalette.slate[500];
const RULE = ColorPalette.slate[200];

function tb(text: string, size: number, color: Color, bold = false, align?: TextAlignment): TextBlock {
  const b = new TextBlock(text);
  b.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = size;
  b.textColor = color;
  if (align) b.alignment = align;
  return b;
}

function kpiCard(value: string, label: string, accent: Color, tint: Color): Container {
  const stack = new VerticalStack();
  const v = tb(value, 22, accent, true);
  v.margin = new Thickness(0, 0, 0, 3);
  stack.add(v);
  stack.add(tb(label, 9, MUTED));
  const card = new Container();
  card.backgroundColor = tint;
  card.cornerRadius = 8;
  card.padding = new Thickness(16, 14, 16, 14);
  card.child = stack;
  return card;
}

/** A titled card wrapping an arbitrary body element (used for the two charts). */
function chartCard(title: string, body: IElement, accent: Color): Container {
  const stack = new VerticalStack();
  const heading = tb(title, 11, accent, true);
  heading.margin = new Thickness(0, 0, 0, 8);
  stack.add(heading);
  stack.add(body);
  const card = new Container();
  card.border = new Border(0.75);
  card.borderColors = new BorderColors(RULE);
  card.cornerRadius = 8;
  card.padding = new Thickness(14, 14, 14, 14);
  card.child = stack;
  return card;
}

function quarterlyBarChart(primary: Color): ChartBase {
  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const values = [182, 205, 241, 288];
  const series = new ChartSeries();
  series.color = primary;
  series.dataPoints = labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
  const data = new ChartData();
  data.title = 'Quarterly revenue';
  data.series = [series];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 320;
  data.yAxis.stepCount = 4;

  const chart = new BarChart({
    data,
    altText: 'Column chart of quarterly revenue in £m rising from 182 in Q1 to 288 in Q4.',
  });
  chart.height = 190;
  chart.stretchToFit = true;
  chart.barColor = primary;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 8;
  chart.backgroundColor = Color.white;
  return chart;
}

function segmentDonut(colors: string[]): ChartBase {
  const labels = ['Platform', 'Services', 'Hardware', 'Licensing'];
  const values = [512, 274, 118, 84];
  const series = new ChartSeries();
  series.dataPoints = labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
  const data = new ChartData();
  data.title = 'Revenue by segment';
  data.series = [series];

  const chart = new PieChart({
    data,
    altText: 'Donut chart of revenue by segment: Platform, Services, Hardware, and Licensing.',
  });
  chart.height = 190;
  chart.stretchToFit = true;
  chart.isDonut = true;
  chart.totalLabel = 'Total';
  chart.showLegend = true;
  chart.colors = colors;
  chart.backgroundColor = Color.white;
  return chart;
}

function financialTable(primary: Color): Table {
  const table = new Table(2.2, 1, 1, 0.9);
  table.cellPadding = 8;
  table.border = Border.none;
  table.headerBackgroundColor = primary;
  table.headerTextColor = Color.white;
  table.addHeader(
    tb('£ millions', 9, Color.white, true),
    tb(`FY${String(2025).slice(2)}`, 9, Color.white, true, TextAlignment.Right),
    tb('FY24', 9, Color.white, true, TextAlignment.Right),
    tb('Change', 9, Color.white, true, TextAlignment.Right)
  );
  const rows: [string, string, string, string][] = [
    ['Revenue', '988', '837', '+18%'],
    ['Gross profit', '641', '523', '+23%'],
    ['Operating income', '212', '164', '+29%'],
    ['Net income', '167', '129', '+29%'],
    ['Earnings per share', '£1.34', '£1.04', '+29%'],
  ];
  for (const [name, cur, prev, chg] of rows) {
    table.addRow(
      tb(name, 9, INK),
      tb(cur, 9, INK, false, TextAlignment.Right),
      tb(prev, 9, MUTED, false, TextAlignment.Right),
      tb(chg, 9, ColorPalette.emerald[600], true, TextAlignment.Right)
    );
  }
  return table;
}

/** Append the capabilities spread as a new page on `doc`. */
export function addCapabilitiesPage(doc: Document, brand: ReportBrand): void {
  doc.addPage();

  const content = new VerticalStack();

  const eyebrow = tb('INSIDE THE REPORT', 9, brand.accent, true);
  eyebrow.margin = new Thickness(0, 0, 0, 4);
  content.add(eyebrow);

  // A real H2 under the cover's H1: the section title carries structure, not
  // just 22pt of bold type.
  const heading = new Heading('Performance at a glance');
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 22;
  heading.textColor = brand.primary;
  heading.margin = new Thickness(0, 0, 0, 6);
  content.add(heading);

  const intro = tb(
    `${brand.company}'s ${brand.year} results, laid out the way an annual report ` +
      'presents them: headline metrics, trend and mix charts, and an audited summary table.',
    10,
    MUTED
  );
  intro.margin = new Thickness(0, 0, 0, 18);
  content.add(intro);

  // KPI band
  const kpis = new HorizontalStack();
  kpis.widthDistribution = WidthDistribution.Weighted;
  kpis.spacing = 12;
  kpis.margin = new Thickness(0, 0, 0, 18);
  kpis.add(kpiCard('£988M', 'Total revenue', brand.primary, brand.tint), 1);
  kpis.add(kpiCard('+18%', 'Year-over-year growth', brand.accent, brand.tint), 1);
  kpis.add(kpiCard('21.4%', 'Operating margin', brand.primary, brand.tint), 1);
  content.add(kpis);

  // Charts row: column chart | donut
  const charts = new HorizontalStack();
  charts.widthDistribution = WidthDistribution.Weighted;
  charts.spacing = 14;
  charts.margin = new Thickness(0, 0, 0, 18);
  charts.add(chartCard('Quarterly revenue (£m)', quarterlyBarChart(brand.primary), brand.accent), 1);
  charts.add(chartCard('Revenue by segment', segmentDonut(brand.segmentColors), brand.accent), 1);
  content.add(charts);

  // Financial summary table
  const tableHeading = new Heading('Five-year financial summary');
  tableHeading.level = 3;
  tableHeading.fontName = StandardFonts.HelveticaBold;
  tableHeading.fontSize = 11;
  tableHeading.textColor = brand.accent;
  tableHeading.margin = new Thickness(0, 0, 0, 8);
  content.add(tableHeading);
  content.add(financialTable(brand.primary));

  // The cover documents use a zero margin, so inset the page ourselves.
  const inset = new Container();
  inset.padding = new Thickness(56, 48, 56, 48);
  inset.child = content;
  doc.add(inset);
}
