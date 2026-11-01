/**
 * Financial Dashboard (Class API).
 * A landscape annual review with four KPIs, gradient revenue bars, a layered donut and a product revenue table.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PageOrientation,
  PdfAConformance,
  AccessibilityMode,
  TextStyle,
  BorderColors,
  Color,
  TextBlock,
  VerticalStack,
  Container,
  Table,
  Grid,
  Layers,
  StandardFonts,
  BarChart,
  PieChart,
  type ColorInput,
  type TextAlignmentInput,
  type IElement,
} from '@bonniepdf/core';
const NAVY = '#0f172a';
const BLUE = '#2563eb';
const TEAL = '#0d9488';
const VIOLET = '#7c3aed';
const AMBER = '#d97706';
const MUTED = '#475569';
const LIGHT = '#cbd5e1';
const BORDER = '#e2e8f0';
const PAPER = '#f1f5f9';
const WHITE = '#ffffff';
const POSITIVE = '#047857';
export function generate(): Document {
  const year = new Date().getFullYear() - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenue = [125, 146, 140, 175, 163, 190, 197, 182, 211, 226, 240, 233];
  const products = [
    { name: 'Enterprise', revenue: 910, margin: 71, color: BLUE },
    { name: 'Professional', revenue: 650, margin: 64, color: TEAL },
    { name: 'Starter', revenue: 446, margin: 58, color: VIOLET },
    { name: 'Services', revenue: 222, margin: 82, color: AMBER },
  ] as const;
  const total = revenue.reduce((sum, value) => sum + value, 0);
  const grossProfit = products.reduce((sum, p) => sum + (p.revenue * p.margin) / 100, 0);
  const totalLabel = '£' + (total / 1000).toFixed(2) + 'M';
  const secondHalfGrowth =
    (revenue.slice(6).reduce((a, b) => a + b, 0) / revenue.slice(0, 6).reduce((a, b) => a + b, 0) - 1) * 100;
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 0);
  settings.pageColor = PAPER;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(Color.fromHex(MUTED));
  const metadata = new DocumentMetadata();
  metadata.title = 'Northstar - FY ' + year + ' Financial Dashboard';
  metadata.author = 'Northstar';
  metadata.subject = 'Annual performance review with revenue trends and product mix. Illustrative data.';
  const doc = new Document(settings, metadata);
  const header = grid([2, 1], 0);
  header.addRow(
    stack([
      text('NORTHSTAR  /  FINANCE', 9, '#67e8f9', true),
      text('Performance at a glance', 25, WHITE, true, 'left', 7),
      text('Annual revenue review  |  An expanding business, a stronger revenue mix', 9, LIGHT, false, 'left', 6),
    ]),
    stack([
      text('FY ' + year, 20, WHITE, true, 'right'),
      text('REVENUE  +18.3% YoY', 9, '#67e8f9', true, 'right', 8),
      text('Board & investor overview', 8, LIGHT, false, 'right', 6),
    ])
  );
  const container1 = new Container();
  container1.backgroundColor = NAVY;
  container1.padding = [28, 13];
  container1.child = header;
  doc.add(container1);
  const container2 = new Container();
  container2.height = 3;
  container2.backgroundColor = BLUE;
  doc.add(container2);
  const metrics = grid([1, 1, 1, 1], 4);
  metrics.addRow(
    kpi(totalLabel, 'TOTAL REVENUE', '+18.3% vs prior year', BLUE),
    kpi('£' + (grossProfit / 1000).toFixed(2) + 'M', 'GROSS PROFIT', '+£272K vs prior year', TEAL),
    kpi(((grossProfit / total) * 100).toFixed(1) + '%', 'GROSS MARGIN', '+2.1 percentage points', VIOLET),
    kpi('3,814', 'ACTIVE CUSTOMERS', '+24.1% vs prior year', BLUE)
  );
  const barChart3 = new BarChart();
  barChart3.theme = 'modern';
  barChart3.height = 164;
  barChart3.stretchToFit = true;
  barChart3.showValueLabels = false;
  barChart3.fontFamily = StandardFonts.Helvetica;
  barChart3.labelFontSize = 8;
  barChart3.barStyle = { cornerRadius: 4, gradient: { startColor: '#60a5fa', endColor: BLUE, scope: 'bar' } };
  barChart3.data = {
    series: [{ name: 'Revenue', color: BLUE, dataPoints: months.map((label, i) => ({ label, value: revenue[i] })) }],
    yAxis: { prefix: '£', maxValue: 300, stepCount: 6 },
  };
  barChart3.altText =
    'Monthly revenue in thousands of pounds: 125, 146, 140, 175, 163, 190, 197, 182, 211, 226, 240, 233. Annual total £2,228,000.';
  const bars = barChart3;
  const pieChart4 = new PieChart();
  pieChart4.theme = 'modern';
  pieChart4.height = 132;
  pieChart4.stretchToFit = true;
  pieChart4.isDonut = true;
  pieChart4.showLegend = false;
  pieChart4.showTotal = false;
  pieChart4.colors = products.map(p => p.color);
  pieChart4.data = { series: [{ dataPoints: products.map(p => ({ label: p.name, value: p.revenue })) }] };
  pieChart4.altText =
    'Revenue mix: Enterprise £910,000; Professional £650,000; Starter £446,000; Services £222,000. Total £2,228,000.';
  const donut = pieChart4;
  const container5 = new Container();
  container5.width = 64;
  container5.height = 64;
  container5.cornerRadius = 32;
  container5.backgroundColor = WHITE;
  container5.verticalAlignment = 'middle';
  container5.child = stack([
    text(totalLabel, 12, NAVY, true, 'center'),
    text('TOTAL REVENUE', 5.5, MUTED, true, 'center', 4),
  ]);
  const container6 = new Container();
  container6.height = 132;
  container6.horizontalAlignment = 'center';
  container6.verticalAlignment = 'middle';
  container6.child = container5;
  const layers7 = new Layers();
  layers7.primaryLayer = donut;
  layers7.addForeground(container6);
  // A white circular foreground and centred labels demonstrate native vector layering.
  const donutLayers = layers7;
  const legend = grid([1, 1], 1);
  const legendItems = products.map(p => legendItem(p.name, Math.round((p.revenue / total) * 100) + '%', p.color));
  legend.addRow(legendItems[0], legendItems[1]);
  legend.addRow(legendItems[2], legendItems[3]);
  const charts = grid([1.9, 1], 4);
  charts.addRow(
    panel('Revenue momentum', 'Monthly revenue (£000)  |  H2 +' + secondHalfGrowth.toFixed(1) + '% vs H1', [bars]),
    panel('Revenue mix', 'A diversified product portfolio', [donutLayers, legend])
  );
  const table8 = new Table(...[2.4, 1.3, 1, 1]);
  table8.border = 0.5;
  table8.borderColors = new BorderColors(Color.fromHex(BORDER));
  table8.cellPadding = 5;
  table8.headerBackgroundColor = '#eff6ff';
  table8.headerTextColor = NAVY;
  const table = table8;
  table.addHeader(
    text('PRODUCT', 7, MUTED, true),
    text('REVENUE', 7, MUTED, true, 'right'),
    text('SHARE', 7, MUTED, true, 'right'),
    text('MARGIN', 7, MUTED, true, 'right')
  );
  for (const p of products)
    table.addRow(
      text(p.name, 8, NAVY, true),
      text('£' + (p.revenue * 1000).toLocaleString('en-GB'), 8, NAVY, true, 'right'),
      text(Math.round((p.revenue / total) * 100) + '%', 8, MUTED, false, 'right'),
      text(p.margin + '%', 8, POSITIVE, true, 'right')
    );
  const container9 = new Container();
  container9.margin = { top: 7 };
  container9.child = table;
  const bottom = panel('Revenue by product', '', [container9]);
  const container10 = new Container();
  container10.padding = [4, 4];
  container10.child = bottom;
  const body = stack([metrics, charts, container10]);
  const container11 = new Container();
  container11.padding = [24, 8, 24, 0];
  container11.child = body;
  doc.add(container11);
  const footer = grid([2, 1], 0);
  footer.addRow(
    text('NORTHSTAR  /  FY ' + year + '  /  Illustrative data in GBP', 7, MUTED),
    text('CONFIDENTIAL  /  01', 7, MUTED, true, 'right')
  );
  const container12 = new Container();
  container12.padding = [28, 9];
  container12.child = footer;
  doc.add(container12);
  return doc;
}
function text(
  value: string,
  size: number,
  color: ColorInput,
  bold = false,
  align: TextAlignmentInput = 'left',
  top = 0
): TextBlock {
  const textBlock13 = new TextBlock(value);
  textBlock13.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  textBlock13.fontSize = size;
  textBlock13.color = color;
  textBlock13.alignment = align;
  textBlock13.margin = { top };
  return textBlock13;
}
function stack(children: IElement[]): VerticalStack {
  const verticalStack14 = new VerticalStack();
  for (const child of children) {
    verticalStack14.add(child);
  }
  return verticalStack14;
}
function grid(columns: number[], padding: number): Grid {
  const grid15 = new Grid(...columns);
  grid15.border = 0;
  grid15.cellPadding = padding;
  return grid15;
}
function kpi(value: string, label: string, delta: string, accent: ColorInput): Container {
  const container16 = new Container();
  container16.backgroundColor = accent;
  container16.height = 3;
  const container17 = new Container();
  container17.padding = [14, 8];
  container17.child = stack([
    text(label, 7, MUTED, true),
    text(value, 22, NAVY, true, 'left', 4),
    text(delta, 7, POSITIVE, true, 'left', 3),
  ]);
  const container18 = new Container();
  container18.backgroundColor = WHITE;
  container18.cornerRadius = 7;
  container18.child = stack([container16, container17]);
  return container18;
}
function panel(title: string, subtitle: string, children: IElement[]): Container {
  const container19 = new Container();
  container19.backgroundColor = WHITE;
  container19.cornerRadius = 7;
  container19.padding = 12;
  container19.child = stack([
    text(title, 12, NAVY, true),
    ...(subtitle ? [text(subtitle, 7.5, MUTED, false, 'left', 4)] : []),
    ...children,
  ]);
  return container19;
}
function legendItem(name: string, share: string, color: ColorInput): Container {
  const row = grid([9, 100], 0);
  const container20 = new Container();
  container20.width = 5;
  container20.height = 5;
  container20.margin = { top: 2 };
  container20.cornerRadius = 2.5;
  container20.backgroundColor = color;
  row.addRow(container20, text(name + '  ' + share, 7, MUTED));
  const container21 = new Container();
  container21.padding = [0, 3];
  container21.child = row;
  return container21;
}
