import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  AccessibilityMode,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Container,
  Table,
  Spacer,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  ChartData,
  ChartSeries,
  ChartDataPoint,
  ChartElement,
  BarChart,
} from '@bonniepdf/core';

import { DateHelper } from './date-helpers.ts';

// ── Brand colours - drawn from the BonniePDF logo palette ────────────────────
const Espresso = Color.fromHex('#442714');
const Terra = Color.fromHex('#956b51');
const Brown = Color.fromHex('#805e48');
const Sand = Color.fromHex('#d2c8b7');
const Cream = Color.fromHex('#f4f1ef');
const HeaderMute = Color.fromHex('#b99a88');
const RowAlt = Color.fromHex('#e8e0d8');
const DeltaPos = Color.fromHex('#2d7a3a');
const DeltaNeg = Color.fromHex('#b94040');

// ── Helpers ───────────────────────────────────────────────────────────────────
function tb(text: string, font: string, size: number, color: Color, margin?: Thickness): TextBlock {
  const b = new TextBlock(text);
  b.fontName = font;
  b.fontSize = size;
  b.textColor = color;
  if (margin) b.margin = margin;
  return b;
}

function ta(b: TextBlock, a: TextAlignment): TextBlock {
  b.alignment = a;
  return b;
}
function alignLeft(b: TextBlock): TextBlock {
  return ta(b, TextAlignment.Left);
}
function alignRight(b: TextBlock): TextBlock {
  return ta(b, TextAlignment.Right);
}

/** Thin horizontal rule used as a section divider. */
function rule(color: Color): Container {
  const spacer = new TextBlock(' ');
  spacer.fontSize = 1;
  const c = new Container();
  c.backgroundColor = color;
  c.padding = new Thickness(0, 0.75, 0, 0);
  c.child = spacer;
  return c;
}

/** One KPI card for the metrics strip. */
function kpiCell(value: string, label: string, delta: string, positive: boolean, addLeftBorder: boolean): Container {
  const stack = new VerticalStack();
  stack.addChild(tb(value, StandardFonts.HelveticaBold, 18, Espresso));
  stack.addChild(tb(label.toUpperCase(), StandardFonts.Helvetica, 7, Brown, new Thickness(0, 4, 0, 0)));
  stack.addChild(tb(delta, StandardFonts.HelveticaBold, 7, positive ? DeltaPos : DeltaNeg, new Thickness(0, 4, 0, 0)));

  const c = new Container();
  c.child = stack;
  c.backgroundColor = Cream;
  c.padding = new Thickness(20, 16, 20, 16);
  if (addLeftBorder) {
    c.border = Border.leftOnly(0.75);
    c.borderColors = BorderColors.leftOnly(Sand);
  }
  return c;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function generate(): Document {
  // Landscape, zero margin - layout elements carry their own padding
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 0);
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  const { quarter, year } = DateHelper.previousQuarter();
  const title = DateHelper.reportTitle(quarter, year);
  const generated = DateHelper.generatedStamp();

  const metadata = new DocumentMetadata();
  metadata.title = title;
  metadata.author = 'Acme Corporation';
  metadata.subject = `${DateHelper.quarterLabel(quarter, year)} financial dashboard - KPIs, monthly revenue chart, and product breakdown`;

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(Color.slate600);

  // ════════════════════════════════════════════════════════════════════════════
  // 1.  Header bar
  // ════════════════════════════════════════════════════════════════════════════

  const companyStack = new VerticalStack();
  companyStack.addChild(tb('ACME CORPORATION', StandardFonts.HelveticaBold, 14, Cream));
  companyStack.addChild(
    tb('Confidential - Internal Use Only', StandardFonts.Helvetica, 8, HeaderMute, new Thickness(0, 5, 0, 0))
  );

  const reportTitle = tb(title, StandardFonts.HelveticaBold, 13, Cream);
  reportTitle.alignment = TextAlignment.Right;

  const reportDate = tb(generated, StandardFonts.Helvetica, 8, HeaderMute);
  reportDate.alignment = TextAlignment.Right;
  reportDate.margin = new Thickness(0, 5, 0, 0);

  const reportStack = new VerticalStack();
  reportStack.addChild(reportTitle);
  reportStack.addChild(reportDate);

  const headerLayout = new Table(1, 1);
  headerLayout.border = Border.none;
  headerLayout.cellPadding = 0;

  const leftHeaderCell = new Container();
  leftHeaderCell.child = companyStack;
  const rightHeaderCell = new Container();
  rightHeaderCell.child = reportStack;
  headerLayout.addRow(leftHeaderCell, rightHeaderCell);

  const header = new Container();
  header.backgroundColor = Espresso;
  header.padding = new Thickness(24, 20, 24, 20);
  header.child = headerLayout;

  doc.add(header);

  // ════════════════════════════════════════════════════════════════════════════
  // 2.  KPI strip - four equal-width metric cards
  // ════════════════════════════════════════════════════════════════════════════

  const kpiTable = new Table(1, 1, 1, 1);
  kpiTable.border = Border.none;
  kpiTable.cellPadding = 0;
  kpiTable.addRow(
    kpiCell('£2.41M', 'Total Revenue', '↑ 18.3% YoY', true, false),
    kpiCell('£640K', 'Gross Profit', '↑ 11.7% YoY', true, true),
    kpiCell('3,814', 'New Customers', '↑ 24.1% YoY', true, true),
    kpiCell('94.2%', 'Satisfaction', '↓ 0.8%', false, true)
  );

  doc.add(kpiTable);
  doc.add(rule(Sand));

  // ════════════════════════════════════════════════════════════════════════════
  // 3.  Monthly revenue bar chart - ChartElement must be a direct doc.add() call;
  //     nesting it inside a Container or Table prevents width resolution.
  // ════════════════════════════════════════════════════════════════════════════

  const chartTitleCell = new Container();
  chartTitleCell.backgroundColor = Cream;
  chartTitleCell.padding = new Thickness(24, 14, 24, 6);
  chartTitleCell.child = tb('MONTHLY REVENUE  (£000s)', StandardFonts.HelveticaBold, 7, Terra);
  doc.add(chartTitleCell);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenue = [125, 146, 140, 175, 163, 190, 197, 182, 211, 226, 240, 233];

  const series = new ChartSeries();
  series.color = Terra;
  series.dataPoints = MONTHS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = revenue[i];
    return p;
  });

  const chartData = new ChartData();
  chartData.series = [series];
  chartData.yAxis.prefix = '£';
  chartData.yAxis.maxValue = 250;
  chartData.yAxis.stepCount = 5;

  const barChart = new BarChart();
  barChart.height = 200;
  barChart.stretchToFit = true;
  barChart.barColor = Terra;
  barChart.fontFamily = StandardFonts.Helvetica;
  barChart.labelFontSize = 8;
  barChart.backgroundColor = Cream;

  // Direct doc.add - the only way ChartElement resolves its available width
  doc.add(
    new ChartElement(
      barChart,
      chartData,
      'Bar chart of monthly revenue in thousands, ranging from 125 in January to 233 in December.'
    )
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 4.  Top products table
  // ════════════════════════════════════════════════════════════════════════════

  doc.add(rule(Sand));

  const tableTitleCell = new Container();
  tableTitleCell.backgroundColor = Cream;
  tableTitleCell.padding = new Thickness(24, 14, 24, 6);
  tableTitleCell.child = tb('TOP PRODUCTS', StandardFonts.HelveticaBold, 7, Terra);
  doc.add(tableTitleCell);

  const productTable = new Table(2.2, 1, 1.4, 0.8);
  productTable.border = new Border(0.5);
  productTable.borderColors = new BorderColors(Sand);
  productTable.cellPadding = 8;
  productTable.headerBackgroundColor = RowAlt;
  productTable.headerTextColor = Espresso;

  productTable.addHeader(
    alignLeft(tb('Product', StandardFonts.HelveticaBold, 8, Espresso)),
    alignRight(tb('Units', StandardFonts.HelveticaBold, 8, Espresso)),
    alignRight(tb('Revenue', StandardFonts.HelveticaBold, 8, Espresso)),
    alignRight(tb('Margin', StandardFonts.HelveticaBold, 8, Espresso))
  );

  const products = [
    { name: 'Enterprise Plan', units: '142', revenue: '£890,400', margin: '71%' },
    { name: 'Pro Plan', units: '1,204', revenue: '£722,400', margin: '64%' },
    { name: 'Starter Plan', units: '2,468', revenue: '£493,600', margin: '58%' },
    { name: 'Add-ons', units: '-', revenue: '£304,000', margin: '82%' },
  ];

  for (const p of products) {
    productTable.addRow(
      alignLeft(tb(p.name, StandardFonts.Helvetica, 8, Espresso)),
      alignRight(tb(p.units, StandardFonts.Helvetica, 8, Brown)),
      alignRight(tb(p.revenue, StandardFonts.HelveticaBold, 8, Espresso)),
      alignRight(tb(p.margin, StandardFonts.Helvetica, 8, Brown))
    );
  }

  const tableCell = new Container();
  tableCell.backgroundColor = Cream;
  tableCell.padding = new Thickness(24, 0, 24, 20);
  tableCell.child = productTable;
  doc.add(tableCell);

  // Cream background flood-fill to the page bottom.
  // Container is non-stateful so it renders once without overflow detection;
  // any excess beyond the MediaBox is clipped by the PDF viewer.
  const pageFill = new Container();
  pageFill.backgroundColor = Cream;
  pageFill.child = new Spacer(500);
  doc.add(pageFill);

  return doc;
}
