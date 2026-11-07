/** A greenhouse gas emissions statement: headline figures, a donut of emissions by scope with the total in the centre, every source against last year, progress towards a 2030 target, the method behind the numbers, and the figures attached as a CSV file inside the PDF. */
import {
  AttachmentRelationship,
  BarChart,
  CanvasElement,
  ChartData,
  ColorPalette,
  Container,
  Document,
  Heading,
  HorizontalStack,
  PageBreak,
  PieChart,
  StandardFonts,
  Table,
  TableRow,
  TextBlock,
  TextElementBase,
  VerticalStack,
  pageTemplate,
  type ColorInput,
} from '@bonniepdf/core';

const INK = 'stone-900';
const BODY = 'stone-700';
const MUTE = 'stone-600';
const GREEN = 'green-800';

/** Emissions by source, in tonnes of CO2 equivalent: scope, source, this year and last year. */
const SOURCES: [1 | 2 | 3, string, number, number][] = [
  [1, 'Fleet diesel', 3640, 4150],
  [1, 'Natural gas for heating', 470, 520],
  [1, 'Refrigerant leaks', 100, 110],
  [2, 'Electricity (market-based)', 640, 1120],
  [3, 'Purchased goods and services', 6200, 6650],
  [3, 'Subcontracted transport', 3900, 4120],
  [3, 'Business travel', 410, 380],
  [3, 'Employee commuting', 1240, 1300],
  [3, 'Waste', 120, 150],
  [3, 'Use and disposal of sold products', 1700, 1880],
];

/** Total emissions by reporting year, in tonnes of CO2 equivalent. 2019 is the baseline. */
const HISTORY: [string, number][] = [
  ['2019', 26100],
  ['2021', 23900],
  ['2022', 22700],
  ['2023', 21800],
  ['2024', 21050],
  ['2025', 20380],
  ['2026', 18420],
];

/** The 2030 target: half the 2019 baseline. */
const TARGET = 13050;

/** The plan to 2030: initiative, the scope it cuts, the saving it brings by 2030 in tonnes, and its status. */
const PLAN: [string, number, number, string][] = [
  ['Electric vans for urban delivery (120 by 2028)', 1, 2400, 'In progress'],
  ['Heat pumps at the four largest depots', 1, 420, 'Planned'],
  ['Renewable power purchase agreement', 2, 640, 'Contracted'],
  ['Supplier emissions programme, top 50 suppliers', 3, 3100, 'In progress'],
  ['Move long-distance trunking to rail', 3, 900, 'Planned'],
];

/** One colour per scope, in slice order. */
const SCOPE_COLORS = ['#166534', '#65a30d', '#94a3b8'] as const;

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 42,
      conformance: 'pdf/a-3a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: BODY },
      footerTemplate: pageTemplate({ default: footer() }),
    },
    metadata: {
      title: 'Greenhouse gas emissions statement 2026',
      author: 'Sample Logistics Group plc',
      subject: 'Scope 1, 2 and 3 emissions for the year to 31 March 2026',
    },
  });

  const total = sum(SOURCES.map(row => row[2]));
  const lastYear = sum(SOURCES.map(row => row[3]));
  const byScope = [1, 2, 3].map(scope => sum(SOURCES.filter(row => row[0] === scope).map(row => row[2])));

  // ── Title ──
  doc.add(tb('SAMPLE LOGISTICS GROUP PLC  ·  SUSTAINABILITY', 7.5, GREEN, { bold: true }));
  doc.add(
    new Heading('Greenhouse gas emissions statement', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: INK,
      margin: { top: 3, bottom: 2 },
    })
  );
  doc.add(tb('Year to 31 March 2026, in tonnes of carbon dioxide equivalent (tCO₂e)', 9.5, MUTE, { bottom: 14 }));

  // ── Headline figures ──
  const progress = (HISTORY[0][1] - total) / (HISTORY[0][1] - TARGET);
  const headlines = new HorizontalStack({ widthDistribution: 'equal', spacing: 8, margin: { bottom: 16 } });
  headlines.add(kpi('Total emissions', thousands(total), `${percent(total / lastYear - 1)} on last year`));
  headlines.add(kpi('Intensity', '41.2', 'tCO₂e per £m revenue, −12%'));
  headlines.add(kpi('Renewable electricity', '86%', 'of electricity used, up from 61%'));
  headlines.add(kpi('2030 target', `${Math.round(progress * 100)}%`, 'of the way to halving 2019 emissions'));
  doc.add(headlines);

  // ── Emissions by scope: donut beside the table of sources ──
  const donut = new PieChart({
    data: new ChartData({
      series: [
        {
          dataPoints: ['Scope 1: direct', 'Scope 2: electricity', 'Scope 3: value chain'].map((label, i) => ({
            label,
            value: byScope[i],
            labelFormat: 'N0',
          })),
        },
      ],
    }),
    altText: `Donut chart of emissions by scope: scope 1 ${thousands(byScope[0])}, scope 2 ${thousands(byScope[1])}, scope 3 ${thousands(byScope[2])} tonnes. Total ${thousands(total)} tonnes.`,
    height: 220,
    stretchToFit: true,
    isDonut: true,
    totalLabel: 'Total tCO₂e',
    totalPosition: 'center',
    totalValueFormat: 'N0',
    showLegend: false,
    colors: [...SCOPE_COLORS],
    backgroundColor: '#ffffff',
  });

  const sources = new Table({
    columns: [2.6, 1, 1, 0.8],
    cellPadding: 3.5,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: GREEN,
    headerTextColor: '#ffffff',
    margin: { bottom: 10 },
  });
  sources.addHeader(th('Source'), th('2026', 'right'), th('2025', 'right'), th('Change', 'right'));
  for (const scope of [1, 2, 3]) {
    sources.addRow(
      new TableRow({
        backgroundColor: 'green-50',
        cells: TableRow.fromElements(
          tb(`Scope ${scope}`, 8.5, 'green-900', { bold: true }),
          tb(thousands(byScope[scope - 1]), 8.5, 'green-900', { bold: true, align: 'right' }),
          tb(thousands(sum(SOURCES.filter(row => row[0] === scope).map(row => row[3]))), 8.5, 'green-900', {
            align: 'right',
          }),
          tb('', 8.5, INK)
        ).cells,
      })
    );
    for (const [, source, now, before] of SOURCES.filter(row => row[0] === scope))
      sources.addRow(
        tb(source, 8.5, BODY),
        tb(thousands(now), 8.5, INK, { align: 'right' }),
        tb(thousands(before), 8.5, MUTE, { align: 'right' }),
        tb(percent(now / before - 1), 8.5, now > before ? 'rose-700' : GREEN, { align: 'right' })
      );
  }
  sources.addFooter(
    tb('Total', 8.5, INK, { bold: true }),
    tb(thousands(total), 8.5, INK, { bold: true, align: 'right' }),
    tb(thousands(lastYear), 8.5, INK, { bold: true, align: 'right' }),
    tb(percent(total / lastYear - 1), 8.5, GREEN, { bold: true, align: 'right' })
  );

  // The donut beside a plain-language reading of each scope, then every source in full.
  const reading = new VerticalStack({
    spacing: 8,
    children: [
      scopeNote(
        SCOPE_COLORS[0],
        'Scope 1: direct',
        'Fuel burnt in our own vehicles and buildings, and refrigerant that escapes.'
      ),
      scopeNote(
        SCOPE_COLORS[1],
        'Scope 2: electricity',
        'Electricity we buy. Renewable supply contracts cut it by 43% this year.'
      ),
      scopeNote(
        SCOPE_COLORS[2],
        'Scope 3: value chain',
        'Goods we buy, transport we subcontract, travel, commuting, waste and the products we sell.'
      ),
    ],
  });
  const scopes = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20, margin: { bottom: 14 } });
  scopes.add(donut, 1.4);
  scopes.add(reading, 1);
  doc.add(section('Emissions by scope'));
  doc.add(scopes);
  doc.add(section('Emissions by source'));
  doc.add(sources);

  // ── Page 2 ──
  doc.add(new PageBreak());

  // ── Progress towards the 2030 target ──
  doc.add(section('Progress towards the 2030 target'));
  const history = new BarChart({
    theme: 'modern',
    data: new ChartData({
      series: [
        {
          color: 'green-700',
          dataPoints: HISTORY.map(([year, value]) => ({ label: year, value: value / 1000, labelFormat: 'N1' })),
        },
      ],
      yAxis: { maxValue: 30, stepCount: 6 },
    }),
    altText: `Bar chart of total emissions in thousands of tonnes: ${HISTORY.map(([year, value]) => `${year} ${(value / 1000).toFixed(1)}`).join(', ')}. The 2030 target is ${(TARGET / 1000).toFixed(2)} thousand tonnes.`,
    height: 230,
    stretchToFit: true,
    fontFamily: StandardFonts.Helvetica,
    labelFontSize: 8,
    backgroundColor: '#ffffff',
  });
  const targetNote = new VerticalStack({
    spacing: 6,
    children: [
      tb('Thousand tCO₂e, all scopes', 8, MUTE),
      progressBar(progress),
      tb(
        `From the 2019 baseline of ${thousands(HISTORY[0][1])} tonnes to ${thousands(total)} this year: ${Math.round(progress * 100)}% of the reduction needed to reach ${thousands(TARGET)} tonnes by 2030.`,
        8.5,
        BODY
      ),
      tb(
        'The target is validated as consistent with limiting warming to 1.5 °C. Fleet electrification and supplier engagement deliver most of the remaining cut.',
        8.5,
        BODY
      ),
    ],
  });
  const target = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20, margin: { bottom: 16 } });
  target.add(history, 1.6);
  target.add(targetNote, 1);
  doc.add(target);

  // ── The plan to 2030 ──
  doc.add(section('How we will close the gap'));
  const plan = new Table({
    columns: [3, 0.7, 1.1, 1],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: GREEN,
    headerTextColor: '#ffffff',
    margin: { bottom: 6 },
  });
  plan.addHeader(th('Initiative'), th('Scope'), th('Saving by 2030', 'right'), th('Status'));
  for (const [initiative, scope, saving, status] of PLAN)
    plan.addRow(
      tb(initiative, 8.5, INK),
      tb(String(scope), 8.5, BODY),
      tb(`${thousands(saving)} t`, 8.5, INK, { align: 'right' }),
      tb(status, 8.5, status === 'Planned' ? MUTE : GREEN, { bold: status !== 'Planned' })
    );
  const planned = sum(PLAN.map(row => row[2]));
  plan.addFooter(
    tb('Total planned savings', 8.5, INK, { bold: true }),
    tb('', 8.5, INK),
    tb(`${thousands(planned)} t`, 8.5, INK, { bold: true, align: 'right' }),
    tb('', 8.5, INK)
  );
  doc.add(plan);
  doc.add(
    tb(
      `The gap to the 2030 target is ${thousands(total - TARGET)} tonnes. The plan saves ${thousands(planned)} tonnes, leaving headroom if growth adds emissions.`,
      8.5,
      BODY,
      { bottom: 16 }
    )
  );

  // ── Method, assurance and the attached data ──
  doc.add(section('How these figures were prepared'));
  doc.add(
    tb(
      'Calculated under the GHG Protocol Corporate Standard on an operational control basis, using the UK government conversion factors for 2026. Scope 2 is reported market-based; location-based scope 2 was 2,980 tonnes. Scope 3 covers the six categories material to the group. An independent assurer gave limited assurance over scopes 1 and 2 under ISAE 3410.',
      8.5,
      BODY,
      { bottom: 10 }
    )
  );
  const attached = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10 });
  attached.add(
    new Container({
      backgroundColor: 'green-100',
      cornerRadius: 4,
      padding: [6, 3],
      child: tb('ATTACHED', 7.5, 'green-900', { bold: true }),
    })
  );
  attached.add(
    tb(
      `emissions-2026.csv: ${SOURCES.length} sources with scope, this year and last year. Open it from your PDF viewer's attachments panel.`,
      8.5,
      INK
    ),
    1
  );
  doc.add(
    new Container({
      backgroundColor: 'stone-50',
      border: { width: 0.75, color: 'stone-200' },
      cornerRadius: 6,
      padding: [12, 8],
      child: attached,
    })
  );

  // The figures behind the report travel inside it, so an analyst can reuse them without re-keying.
  doc.attach({
    fileName: 'emissions-2026.csv',
    content: buildCsv(),
    relationship: AttachmentRelationship.Source,
    mediaType: 'text/csv',
    description: 'Greenhouse gas emissions by source, year to 31 March 2026 and prior year',
  });
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(
  text: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: 'left' | 'right'; bottom?: number } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
    alignment: opts.align,
    margin: opts.bottom ? { bottom: opts.bottom } : undefined,
  });
}

/** A section heading. */
function section(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    color: GREEN,
    margin: { bottom: 6 },
  });
}

/** A table header cell. */
function th(text: string, align?: 'right'): TextBlock {
  return tb(text, 7.5, '#ffffff', { bold: true, align });
}

/** A headline figure on a tinted tile. */
function kpi(label: string, value: string, note: string): Container {
  return new Container({
    backgroundColor: 'green-50',
    cornerRadius: 6,
    padding: 10,
    child: new VerticalStack({
      spacing: 2,
      children: [
        tb(label.toUpperCase(), 6.5, 'green-900', { bold: true }),
        tb(value, 18, INK, { bold: true }),
        tb(note, 7.5, MUTE),
      ],
    }),
  });
}

/** A scope's colour key, name and what it covers. */
function scopeNote(color: ColorInput, name: string, text: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 8 });
  row.add(new Container({ backgroundColor: color, cornerRadius: 2, width: 10, height: 10, margin: { top: 2 } }));
  row.add(new VerticalStack({ spacing: 2, children: [tb(name, 9, INK, { bold: true }), tb(text, 8.5, BODY)] }), 1);
  return row;
}

/** The share of the reduction achieved so far, as a bar with the baseline and target at its ends. */
function progressBar(share: number): CanvasElement {
  return new CanvasElement(
    (canvas, size) => {
      canvas.fillRoundedRect(0, 4, size.width, 10, 5, ColorPalette.stone[200]);
      canvas.fillRoundedRect(0, 4, size.width * share, 10, 5, ColorPalette.green[700]);
      canvas.drawText(0, 18, '2019 baseline', ColorPalette.stone[600], 7, StandardFonts.Helvetica, 0);
      const label = '2030 target';
      const width = canvas.measureText(label, 7, StandardFonts.Helvetica).width;
      canvas.drawText(size.width - width, 18, label, ColorPalette.stone[600], 7, StandardFonts.Helvetica, 0);
    },
    {
      drawWidth: 0,
      drawHeight: 28,
      altText: `Progress bar: ${Math.round(share * 100)}% of the way from the 2019 baseline to the 2030 target.`,
    }
  );
}

/** The footer: the report and its page number. */
function footer(): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(tb('Sample Logistics Group plc  ·  Greenhouse gas emissions statement 2026', 7, MUTE), 3);
  row.add(
    tb(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`, 7, MUTE, { align: 'right' }),
    1
  );
  return row;
}

/** Sums a list of tonnes. */
function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Tonnes with a thousands separator: 18420 becomes 18,420. */
function thousands(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** A change as a signed percentage to one decimal place: −0.096 becomes −9.6%. */
function percent(change: number): string {
  const rounded = Math.round(change * 1000) / 10;
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(1)}%`;
}

/** The figures as CSV: scope, source, this year and last year. */
function buildCsv(): Uint8Array {
  let csv = 'scope,source,tco2e_2026,tco2e_2025\n';
  for (const [scope, source, now, before] of SOURCES) csv += `${scope},"${source}",${now},${before}\n`;
  return new TextEncoder().encode(csv);
}
