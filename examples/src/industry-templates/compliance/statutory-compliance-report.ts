/**
 * Statutory Compliance Report.
 * A quarterly facilities compliance report: KPI tiles, a status donut and category chart, a key-findings summary, an inspection register, a priority action plan, and a sign-off block across two pages.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  BarChart,
  ChartData,
  ChartOrientation,
  Container,
  Document,
  EnsureSpace,
  Heading,
  HorizontalStack,
  PieChart,
  Spacer,
  StandardFonts,
  Table,
  TextBlock,
  TextElementBase,
  VerticalStack,
  pageTemplate,
} from '@bonniepdf/core';
import type { ColorInput, IElement } from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────
const TEAL = '#0e7c86';
const NAVY = '#0f2f3d';
const INK = '#33424d';
const MUTED = '#5b6b76';
const RULE = '#d5dde2';
const RED = '#b42318';
const AMBER = '#b45309';
const GREEN = '#1a7f37';

const HELV = StandardFonts.Helvetica;
const BOLD = StandardFonts.HelveticaBold;

// ── Sample data ──────────────────────────────────────────────────────────────
type Status = 'Compliant' | 'Due soon' | 'Overdue';
type Risk = 'High' | 'Medium' | 'Low';

const STATUS_COLOR: Record<Status, ColorInput> = { Compliant: GREEN, 'Due soon': AMBER, Overdue: RED };
const RISK_COLOR: Record<Risk, ColorInput> = { High: RED, Medium: AMBER, Low: GREEN };

const REGISTER: [asset: string, requirement: string, last: string, next: string, status: Status][] = [
  ['Fire alarm system', 'BS 5839-1, six-monthly service', '12 Aug 2026', '12 Feb 2027', 'Compliant'],
  ['Fire extinguishers (86)', 'BS 5306-3, annual service', '03 Mar 2026', '03 Mar 2027', 'Compliant'],
  ['Fire doors', 'Quarterly check, Fire Safety Order 2005', '28 Jun 2026', '28 Sep 2026', 'Overdue'],
  ['Emergency lighting', 'BS 5266-1, annual full-duration test', '18 Nov 2025', '18 Nov 2026', 'Due soon'],
  ['Legionella risk assessment', 'L8 ACoP, two-yearly review', '14 Jan 2025', '14 Jan 2027', 'Compliant'],
  ['Water temperature monitoring', 'HSG274, monthly', '30 Sep 2026', '31 Oct 2026', 'Due soon'],
  ['Calorifier clean and disinfection', 'HSG274, annual', '22 Oct 2025', '22 Oct 2026', 'Due soon'],
  ['Fixed electrical installation', 'BS 7671 EICR, five-yearly', '09 Jun 2023', '09 Jun 2028', 'Compliant'],
  ['Portable appliance testing', 'IET Code of Practice, annual', '15 Sep 2025', '15 Sep 2026', 'Overdue'],
  ['Gas appliances and pipework', 'Gas Safety Regulations 1998, annual', '05 Sep 2026', '05 Sep 2027', 'Compliant'],
  ['Passenger lifts (3)', 'LOLER 1998, six-monthly examination', '02 Jul 2026', '02 Jan 2027', 'Compliant'],
  ['Goods lift', 'LOLER 1998, six-monthly examination', '19 Mar 2026', '19 Sep 2026', 'Overdue'],
  ['F-gas leak checks', 'F-gas Regulations, annual', '10 Dec 2025', '10 Dec 2026', 'Compliant'],
  ['Asbestos management survey', 'CAR 2012, annual re-inspection', '25 Aug 2026', '25 Aug 2027', 'Compliant'],
];

const ACTIONS: [ref: string, action: string, risk: Risk, owner: string, target: string][] = [
  [
    'A-01',
    'Complete the quarterly fire door inspection and repair the two failed leaves on the Level 2 stairwell.',
    'High',
    'Site FM lead',
    '30 Oct 2026',
  ],
  [
    'A-02',
    'Complete overdue portable appliance testing for the 38 outstanding items.',
    'Medium',
    'Electrical contractor',
    '27 Oct 2026',
  ],
  [
    'A-03',
    'Book the LOLER thorough examination of the goods lift and keep it out of service until complete.',
    'High',
    'Lift contractor',
    '23 Oct 2026',
  ],
  ['A-04', 'Complete the overdue roof fall-arrest anchor test.', 'High', 'Roofing specialist', '06 Nov 2026'],
  [
    'A-05',
    'Upload the missing weekly sprinkler test records for the last three weeks.',
    'Low',
    'Site engineer',
    '23 Oct 2026',
  ],
  [
    'A-06',
    'Carry out the annual calorifier clean and disinfection (booked).',
    'Medium',
    'Water hygiene contractor',
    '22 Oct 2026',
  ],
  [
    'A-07',
    'Carry out the annual emergency lighting full-duration test (booked).',
    'Medium',
    'Electrical contractor',
    '18 Nov 2026',
  ],
];

const CATEGORY_COMPLIANCE: [string, number][] = [
  ['Fire safety', 96],
  ['Water hygiene', 88],
  ['Electrical', 93],
  ['Gas safety', 100],
  ['Lifts and lifting', 85],
  ['Emergency lighting', 92],
  ['F-gas and HVAC', 90],
  ['Asbestos', 100],
];

// ── Document ─────────────────────────────────────────────────────────────────
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      // Running header (skipped on the first page) and footer with page numbers.
      headerTemplate: pageTemplate({
        firstPage: new Spacer({ height: 0 }),
        default: bandRow(
          'Northgate Retail Park  |  Compliance and Statutory Inspection Report  |  CR-2026-Q3-011',
          'MERIDIAN FACILITIES SERVICES',
          TEAL,
          3,
          1.4
        ),
      }),
      footerTemplate: pageTemplate({
        default: bandRow(
          'Confidential - prepared for Northgate Retail Park Ltd. Fictional sample data.',
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`,
          MUTED,
          3,
          1
        ),
      }),
    },
    metadata: {
      title: 'Compliance and Statutory Inspection Report CR-2026-Q3-011',
      author: 'Meridian Facilities Services',
      subject: 'Quarterly statutory compliance and inspection report (fictional sample).',
    },
  });

  addSummaryPage(doc);
  doc.addPage();
  addRegisterAndActions(doc);
  return doc;
}

// ── Page 1: summary ──────────────────────────────────────────────────────────
function addSummaryPage(doc: Document): void {
  doc.add(new Container({ backgroundColor: TEAL, height: 6 }));
  doc.add(
    text('STATUTORY COMPLIANCE REPORT  |  QUARTER 3 2026', {
      font: BOLD,
      size: 9,
      color: TEAL,
      margin: { top: 14, bottom: 4 },
    })
  );
  doc.add(
    new Heading('Compliance and Statutory Inspection Report', {
      level: 1,
      fontName: BOLD,
      fontSize: 24,
      color: NAVY,
      margin: { bottom: 5 },
    })
  );
  doc.add(text('Northgate Retail Park, Fenwick Road, York', { size: 10, color: MUTED, margin: { bottom: 14 } }));

  const meta = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 16 } });
  meta.add(metaItem('Report ref', 'CR-2026-Q3-011'), 1);
  meta.add(metaItem('Reporting period', '1 Jul - 30 Sep 2026'), 1);
  meta.add(metaItem('Issued', '20 October 2026'), 1);
  meta.add(metaItem('Prepared by', 'Meridian Facilities Services'), 1.3);
  doc.add(meta);

  doc.add(h2('Executive summary', { bottom: 6 }));
  doc.add(
    text(
      'Of the 128 statutory assets and systems in scope, 117 (91.4%) are compliant, 6 fall due within the next 30 ' +
        'days and 5 are overdue. The overdue items are concentrated in fire door checks, portable appliance testing, ' +
        'goods lift examination, roof fall-arrest testing and sprinkler record-keeping. No incidents arose from any ' +
        'of them. The goods lift is to be removed from service until its LOLER examination is complete (action A-03). ' +
        'Seven actions remain open, each with an owner and a target date, and two are already booked.',
      { size: 9.5, alignment: 'justify', margin: { bottom: 12 } }
    )
  );

  // KPI tiles
  const kpis = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10, margin: { bottom: 16 } });
  kpis.add(tile('91.4%', 'Overall compliance', '#e8f4f5', TEAL), 1);
  kpis.add(tile('128', 'Assets and systems in scope', '#e8f4f5', NAVY), 1);
  kpis.add(tile('5', 'Overdue inspections', '#fdeceb', RED), 1);
  kpis.add(tile('7', 'Open actions', '#fdf3e3', AMBER), 1);
  doc.add(kpis);

  // Charts
  const charts = new HorizontalStack({ widthDistribution: 'weighted', spacing: 12 });
  charts.add(card('Inspection status (128 assets)', statusDonut()), 1);
  charts.add(card('Compliance by category (%)', categoryBars()), 1.2);
  doc.add(charts);

  // Key findings
  doc.add(
    new VerticalStack({
      margin: { top: 16 },
      spacing: 8,
      children: [
        h2('Key findings', { bottom: 2 }),
        callout(
          'Needs attention: five inspections are overdue, three of them high risk (fire doors, goods lift and roof ' +
            'fall-arrest anchors). All have a named owner and a date before 6 November.',
          '#fdeceb',
          RED
        ),
        callout(
          'Coming up: six items fall due within 30 days, led by water hygiene work (calorifier clean and monthly ' +
            'temperature checks) and the annual emergency lighting test.',
          '#fdf3e3',
          AMBER
        ),
        callout(
          'On track: gas safety and asbestos management are fully compliant, and fire alarm, passenger lift and ' +
            'F-gas inspections are all in date.',
          '#e9f6ed',
          GREEN
        ),
      ],
    })
  );
}

// ── Page 2: register, actions, sign-off ──────────────────────────────────────
function addRegisterAndActions(doc: Document): void {
  doc.add(h2('Inspection register', { top: 4, bottom: 4 }));
  doc.add(
    text(
      'Key statutory items, grouped by discipline. The full register of 128 assets is held in the CAFM system. ' +
        'Status is stated in words as well as colour.',
      { color: MUTED, size: 9.5, margin: { bottom: 8 } }
    )
  );

  const register = dataTable(
    [2.1, 2.6, 1, 1, 0.95],
    ['Asset or system', 'Requirement', 'Last done', 'Next due', 'Status']
  );
  for (const [asset, requirement, last, next, status] of REGISTER) {
    register.addRow(
      cell(asset),
      cell(requirement),
      cell(last),
      cell(next),
      cell(status, { font: BOLD, color: STATUS_COLOR[status] })
    );
  }
  doc.add(register);

  doc.add(h2('Priority action plan', { bottom: 4 }));
  doc.add(
    text(
      'Seven open actions. A-01 to A-05 close the overdue items; A-06 and A-07 are booked ahead of their due dates.',
      {
        color: MUTED,
        size: 9.5,
        margin: { bottom: 8 },
      }
    )
  );

  const actions = dataTable([0.55, 3.2, 0.8, 1.6, 1.1], ['Ref', 'Action required', 'Risk', 'Owner', 'Target date']);
  for (const [ref, action, risk, owner, target] of ACTIONS) {
    actions.addRow(
      cell(ref, { font: BOLD }),
      cell(action),
      cell(risk, { font: BOLD, color: RISK_COLOR[risk] }),
      cell(owner),
      cell(target)
    );
  }
  doc.add(actions);

  // Keep the sign-off block together: move to a new page if < 100pt remain.
  doc.add(
    new EnsureSpace({
      minHeight: 100,
      child: new VerticalStack({
        children: [
          h2('Review and sign-off', { bottom: 8 }),
          signRow([
            ['PREPARED BY', 'Compliance manager, Meridian'],
            ['REVIEWED BY', 'Account director, Meridian'],
            ['ACCEPTED BY CLIENT', 'Name: ____________________'],
          ]),
        ],
      }),
    })
  );
}

// ── Charts ───────────────────────────────────────────────────────────────────
function statusDonut(): VerticalStack {
  const chart = new PieChart({
    data: new ChartData({
      series: [
        {
          name: 'Status',
          dataPoints: [
            { label: 'Compliant', value: 117 },
            { label: 'Due within 30 days', value: 6 },
            { label: 'Overdue', value: 5 },
          ],
        },
      ],
    }),
    altText: 'Donut chart of inspection status for 128 assets: 117 compliant, 6 due within 30 days, 5 overdue.',
    isDonut: true,
    showLegend: false, // the legend below states counts in words, in matching colours
    showTotal: true,
    totalLabel: 'Assets',
    width: 195,
    height: 150,
    colors: [GREEN, AMBER, RED],
  });

  return new VerticalStack({
    children: [
      chart,
      text('Compliant: 117', { font: BOLD, size: 8.5, color: GREEN, margin: { top: 4 } }),
      text('Due within 30 days: 6', { font: BOLD, size: 8.5, color: AMBER, margin: { top: 2 } }),
      text('Overdue: 5', { font: BOLD, size: 8.5, color: RED, margin: { top: 2 } }),
    ],
  });
}

function categoryBars(): BarChart {
  return new BarChart({
    data: new ChartData({
      series: [
        {
          name: 'Compliance',
          color: TEAL,
          dataPoints: CATEGORY_COMPLIANCE.map(([label, value]) => ({ label, value })),
        },
      ],
      // In horizontal mode the value axis is still the Y axis.
      yAxis: { minValue: 0, maxValue: 100, stepCount: 4, suffix: '%' },
    }),
    altText:
      'Bar chart of percentage compliance by category: fire safety 96, water hygiene 88, electrical 93, gas safety ' +
      '100, lifts and lifting 85, emergency lighting 92, F-gas and HVAC 90, asbestos management 100.',
    orientation: ChartOrientation.Horizontal,
    barColor: TEAL,
    showValueLabels: true,
    width: 245,
    height: 180,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
interface TextOpts {
  font?: string;
  size?: number;
  color?: ColorInput;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  margin?: { top?: number; bottom?: number };
}

function text(value: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(value, {
    fontName: o.font ?? HELV,
    fontSize: o.size ?? 9.5,
    color: o.color ?? INK,
    alignment: o.alignment,
    margin: o.margin,
  });
}

function h2(value: string, margin: { top?: number; bottom?: number }): Heading {
  return new Heading(value, { level: 2, fontName: BOLD, fontSize: 14, color: TEAL, margin });
}

function metaItem(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [text(label.toUpperCase(), { font: BOLD, size: 7, color: MUTED, margin: { bottom: 2 } }), text(value)],
  });
}

function tile(value: string, label: string, fill: ColorInput, accent: ColorInput): Container {
  return new Container({
    backgroundColor: fill,
    cornerRadius: 8,
    padding: { top: 11, bottom: 11, left: 13, right: 13 },
    child: new VerticalStack({
      children: [
        text(value, { font: BOLD, size: 20, color: accent, margin: { bottom: 3 } }),
        text(label, { size: 8.5, color: '#45556c' }),
      ],
    }),
  });
}

function card(title: string, content: IElement): Container {
  return new Container({
    border: { width: 0.75, color: RULE },
    cornerRadius: 8,
    padding: 12,
    child: new VerticalStack({
      children: [text(title, { font: BOLD, size: 10.5, color: NAVY, margin: { bottom: 6 } }), content],
    }),
  });
}

/** A tinted box with a coloured left rule. */
function callout(body: string, fill: ColorInput, accent: ColorInput): Container {
  return new Container({
    backgroundColor: fill,
    padding: { top: 9, bottom: 9, left: 12, right: 12 },
    border: { left: 3, color: accent },
    child: text(body),
  });
}

function dataTable(columns: number[], headers: string[]): Table {
  const table = new Table({
    columns,
    cellPadding: 5,
    margin: { bottom: 10 },
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: NAVY,
    headerTextColor: '#ffffff',
    repeatHeadersOnNewPage: true,
  });
  table.addHeader(...headers.map(h => text(h, { font: BOLD, size: 8.5, color: '#ffffff' })));
  return table;
}

function cell(value: string, o: TextOpts = {}): TextBlock {
  return text(value, { size: 8.5, ...o });
}

function signRow(blocks: [title: string, nameLine: string][]): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16 });
  for (const [title, nameLine] of blocks) {
    row.add(
      new VerticalStack({
        children: [
          text(title, { font: BOLD, size: 8, color: MUTED }),
          text(nameLine, { margin: { top: 2 } }),
          new Container({ height: 30, border: { bottom: 0.75, color: '#8a99a3' } }),
          text('Signature and date', { size: 7.5, color: MUTED, margin: { top: 2 } }),
        ],
      }),
      1
    );
  }
  return row;
}

function bandRow(left: string, right: string, rightColor: ColorInput, lw: number, rw: number): IElement {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(text(left, { size: 7.5, color: MUTED }), lw);
  row.add(text(right, { font: BOLD, size: 7.5, color: rightColor, alignment: 'right' }), rw);
  return row;
}
