// Financial Dashboard
//
// Single-page A4 quarterly report with a full-bleed header, four KPI metrics,
// a 12-month bar chart, and a top-products table - all styled with a warm
// earth-tone palette. Authored through the options-object front door.

import {
  Document,
  TextBlock,
  VerticalStack,
  Container,
  Table,
  Grid,
  StandardFonts,
  BarChart,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

// ── Brand colours - drawn from the BonniePDF logo palette ────────────────────
const ESPRESSO = '#442714';
const TERRA = '#956b51';
const BROWN = '#805e48';
const SAND = '#d2c8b7';
const CREAM = '#f4f1ef';
const HEADER_MUTE = '#b99a88';
const ROW_ALT = '#e8e0d8';
const DELTA_POS = '#2d7a3a';
const DELTA_NEG = '#b94040';

function tb(
  text: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: TextAlignmentInput; top?: number } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    textColor: color,
    alignment: opts.align,
    margin: opts.top ? { top: opts.top } : undefined,
  });
}

function kpiCard(value: string, label: string, delta: string, deltaColor: ColorInput, withRule: boolean): Container {
  return new Container({
    padding: [20, 16],
    border: withRule ? { left: 0.75, color: SAND } : undefined,
    child: new VerticalStack({
      children: [
        tb(value, 18, ESPRESSO, { bold: true }),
        tb(label, 7, BROWN, { top: 4 }),
        tb(delta, 7, deltaColor, { bold: true, top: 4 }),
      ],
    }),
  });
}

function rule(): Container {
  return new Container({ backgroundColor: SAND, padding: { top: 0.75 }, child: new TextBlock(' ', { fontSize: 1 }) });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function generate(): Document {
  const today = new Date();
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
  const quarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const year = currentQuarter === 1 ? today.getFullYear() - 1 : today.getFullYear();
  const quarterLabel = `Q${quarter} ${year}`;
  const title = `${quarterLabel} Financial Report`;
  const generated = `Generated ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(today)}`;

  // Landscape, zero margin - layout elements carry their own padding
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 0,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: 'slate-600' },
      pageColor: CREAM,
    },
    metadata: {
      title,
      author: 'Sample Company',
      subject: `${quarterLabel} financial dashboard - KPIs, monthly revenue chart, and product breakdown`,
    },
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1.  Header bar
  // ════════════════════════════════════════════════════════════════════════════

  const headerLayout = new Grid({ columns: [1, 1], border: 0, cellPadding: 0 });
  headerLayout.addRow(
    new VerticalStack({
      children: [
        tb('Sample Company', 14, CREAM, { bold: true }),
        tb('Confidential - Internal Use Only', 8, HEADER_MUTE, { top: 5 }),
      ],
    }),
    new VerticalStack({
      children: [
        tb(title, 13, CREAM, { bold: true, align: 'right' }),
        tb(generated, 8, HEADER_MUTE, { align: 'right', top: 5 }),
      ],
    })
  );

  doc.add(new Container({ backgroundColor: ESPRESSO, padding: [24, 20], child: headerLayout }));

  // ════════════════════════════════════════════════════════════════════════════
  // 2.  KPI strip - four equal-width metric cards
  // ════════════════════════════════════════════════════════════════════════════

  const kpiTable = new Grid({ columns: [1, 1, 1, 1], border: 0, cellPadding: 0 });
  kpiTable.addRow(
    kpiCard('£2.41M', 'TOTAL REVENUE', '↑ 18.3% YoY', DELTA_POS, false),
    kpiCard('£640K', 'GROSS PROFIT', '↑ 11.7% YoY', DELTA_POS, true),
    kpiCard('3,814', 'NEW CUSTOMERS', '↑ 24.1% YoY', DELTA_POS, true),
    kpiCard('94.2%', 'SATISFACTION', '↓ 0.8%', DELTA_NEG, true)
  );
  doc.add(kpiTable);
  doc.add(rule());

  // ════════════════════════════════════════════════════════════════════════════
  // 3.  Monthly revenue bar chart
  // ════════════════════════════════════════════════════════════════════════════

  doc.add(new Container({ padding: [24, 14, 24, 6], child: tb('MONTHLY REVENUE  (£000s)', 7, TERRA, { bold: true }) }));

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenue = [125, 146, 140, 175, 163, 190, 197, 182, 211, 226, 240, 233];

  doc.add(
    new BarChart({
      data: {
        series: [{ color: TERRA, dataPoints: MONTHS.map((label, i) => ({ label, value: revenue[i] })) }],
        yAxis: { prefix: '£', maxValue: 250, stepCount: 5 },
      },
      altText: 'Bar chart of monthly revenue in thousands, ranging from 125 in January to 233 in December.',
      height: 200,
      stretchToFit: true,
      barColor: TERRA,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 8,
    })
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 4.  Top products table
  // ════════════════════════════════════════════════════════════════════════════

  doc.add(rule());
  doc.add(new Container({ padding: [24, 14, 24, 6], child: tb('TOP PRODUCTS', 7, TERRA, { bold: true }) }));

  const productTable = new Table({
    columns: [2.2, 1, 1.4, 0.8],
    border: { width: 0.5, color: SAND },
    cellPadding: 8,
    headerBackgroundColor: ROW_ALT,
    headerTextColor: ESPRESSO,
  });
  productTable.addHeader(
    tb('Product', 8, ESPRESSO, { bold: true }),
    tb('Units', 8, ESPRESSO, { bold: true, align: 'right' }),
    tb('Revenue', 8, ESPRESSO, { bold: true, align: 'right' }),
    tb('Margin', 8, ESPRESSO, { bold: true, align: 'right' })
  );

  const products = [
    { name: 'Enterprise Plan', units: '142', revenue: '£890,400', margin: '71%' },
    { name: 'Pro Plan', units: '1,204', revenue: '£722,400', margin: '64%' },
    { name: 'Starter Plan', units: '2,468', revenue: '£493,600', margin: '58%' },
    { name: 'Add-ons', units: '-', revenue: '£304,000', margin: '82%' },
  ];

  for (const p of products) {
    productTable.addRow(
      tb(p.name, 8, ESPRESSO, { align: 'left' }),
      tb(p.units, 8, BROWN, { align: 'right' }),
      tb(p.revenue, 8, ESPRESSO, { bold: true, align: 'right' }),
      tb(p.margin, 8, BROWN, { align: 'right' })
    );
  }

  doc.add(new Container({ padding: [24, 0, 24, 20], child: productTable }));

  return doc;
}
