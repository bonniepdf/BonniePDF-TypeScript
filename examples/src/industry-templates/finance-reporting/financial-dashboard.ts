/**
 * Financial Dashboard.
 * A print-ready landscape annual review with four KPIs, gradient revenue bars, a donut and a product revenue table.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
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
const BORDER = '#e2e8f0';
const HEADER_FILL = '#f8fafc';
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
  // A white page with a printable margin: no full-bleed fills for a printer to waste ink on or clip.
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 24,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: MUTED },
    },
    metadata: {
      title: 'Sample Company Ltd - FY ' + year + ' Financial Dashboard',
      author: 'Sample Company Ltd',
      subject: 'Annual performance review with revenue trends and product mix. Sample data.',
    },
  });

  const header = grid([2, 1], 0);
  header.addRow(
    stack([
      text('SAMPLE COMPANY LTD  /  FINANCE', 8, BLUE, true),
      text('Performance at a glance', 24, NAVY, true, 'left', 6),
      text('Annual review', 9, MUTED, false, 'left', 5),
    ]),
    stack([
      text('FY ' + year, 20, NAVY, true, 'right'),
      text('REVENUE  +18.3% YoY', 8, POSITIVE, true, 'right', 7),
      text('Board & investor overview', 8, MUTED, false, 'right', 5),
    ])
  );
  doc.add(new Container({ padding: { left: 4, right: 4, bottom: 8 }, child: header }));
  doc.add(new Container({ height: 2, backgroundColor: BLUE, margin: { left: 4, right: 4, bottom: 6 } }));

  const metrics = grid([1, 1, 1, 1], 4);
  metrics.addRow(
    kpi(totalLabel, 'TOTAL REVENUE', '+18.3% vs prior year', BLUE),
    kpi('£' + (grossProfit / 1000).toFixed(2) + 'M', 'GROSS PROFIT', '+£272K vs prior year', TEAL),
    kpi(((grossProfit / total) * 100).toFixed(1) + '%', 'GROSS MARGIN', '+2.1 percentage points', VIOLET),
    kpi('3,814', 'ACTIVE CUSTOMERS', '+24.1% vs prior year', AMBER)
  );

  const bars = new BarChart({
    theme: 'modern',
    height: 142,
    stretchToFit: true,
    showValueLabels: false,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 8,
    barStyle: { cornerRadius: 4, gradient: { startColor: '#60a5fa', endColor: BLUE, scope: 'bar' } },
    data: {
      series: [{ name: 'Revenue', color: BLUE, dataPoints: months.map((label, i) => ({ label, value: revenue[i] })) }],
      yAxis: { prefix: '£', maxValue: 300, stepCount: 6 },
    },
    altText:
      'Monthly revenue in thousands of pounds: 125, 146, 140, 175, 163, 190, 197, 182, 211, 226, 240, 233. Annual total £2,228,000.',
  });
  const donut = new PieChart({
    theme: 'modern',
    height: 132,
    stretchToFit: true,
    isDonut: true,
    showLegend: false,
    showTotal: false,
    colors: products.map(p => p.color),
    data: { series: [{ dataPoints: products.map(p => ({ label: p.name, value: p.revenue })) }] },
    altText:
      'Revenue mix: Enterprise £910,000; Professional £650,000; Starter £446,000; Services £222,000. Total £2,228,000.',
  });
  // A white circular foreground and centred labels demonstrate native vector layering.
  const donutLayers = new Layers({
    primaryLayer: donut,
    foreground: [
      new Container({
        height: 132,
        horizontalAlignment: 'center',
        verticalAlignment: 'middle',
        child: new Container({
          width: 64,
          height: 64,
          cornerRadius: 32,
          backgroundColor: WHITE,
          verticalAlignment: 'middle',
          child: stack([
            text(totalLabel, 12, NAVY, true, 'center'),
            text('TOTAL REVENUE', 5.5, MUTED, true, 'center', 4),
          ]),
        }),
      }),
    ],
  });
  const legend = grid([1, 1], 1);
  const legendItems = products.map(p => legendItem(p.name, Math.round((p.revenue / total) * 100) + '%', p.color));
  legend.addRow(legendItems[0], legendItems[1]);
  legend.addRow(legendItems[2], legendItems[3]);

  const charts = grid([1.9, 1], 4);
  charts.addRow(
    panel('Revenue momentum', 'Monthly revenue (£000)  |  H2 +' + secondHalfGrowth.toFixed(1) + '% vs H1', [bars]),
    panel('Revenue mix', 'A diversified product portfolio', [donutLayers, legend])
  );

  // A rule under each row only: no lines above the headings, at the edges or between columns.
  const table = new Table({
    columns: [2.4, 1.3, 1, 1],
    border: { bottom: 0.5, color: BORDER },
    cellPadding: 4,
    headerBackgroundColor: HEADER_FILL,
    headerTextColor: NAVY,
  });
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
  const bottom = panel('Revenue by product', '', [new Container({ margin: { top: 7 }, child: table })]);
  doc.add(stack([metrics, charts, new Container({ padding: 4, child: bottom })]));
  const footer = grid([2, 1], 0);
  footer.addRow(
    text('SAMPLE COMPANY LTD  /  FY ' + year + '  /  Sample data in GBP', 7, MUTED),
    text('CONFIDENTIAL  /  01', 7, MUTED, true, 'right')
  );
  doc.add(new Container({ padding: { left: 4, right: 4, top: 4 }, child: footer }));
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
  return new TextBlock(value, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
    alignment: align,
    margin: { top },
  });
}
function stack(children: IElement[]): VerticalStack {
  return new VerticalStack({ children });
}
function grid(columns: number[], padding: number): Grid {
  return new Grid({ columns, border: 0, cellPadding: padding });
}
// Cards and panels are outlined rather than filled, so they keep their shape on a white page.
function kpi(value: string, label: string, delta: string, accent: ColorInput): Container {
  return new Container({
    border: { width: 0.75, color: BORDER },
    cornerRadius: 6,
    padding: [14, 8],
    child: stack([
      new Container({ backgroundColor: accent, width: 24, height: 3, cornerRadius: 1.5 }),
      text(label, 7, MUTED, true, 'left', 6),
      text(value, 22, NAVY, true, 'left', 4),
      text(delta, 7, POSITIVE, true, 'left', 3),
    ]),
  });
}
function panel(title: string, subtitle: string, children: IElement[]): Container {
  return new Container({
    border: { width: 0.75, color: BORDER },
    cornerRadius: 6,
    padding: 12,
    child: stack([
      text(title, 12, NAVY, true),
      ...(subtitle ? [text(subtitle, 7.5, MUTED, false, 'left', 4)] : []),
      ...children,
    ]),
  });
}
function legendItem(name: string, share: string, color: ColorInput): Container {
  const row = grid([9, 100], 0);
  row.addRow(
    new Container({ width: 5, height: 5, margin: { top: 2 }, cornerRadius: 2.5, backgroundColor: color }),
    text(name + '  ' + share, 7, MUTED)
  );
  return new Container({ padding: [0, 3], child: row });
}
