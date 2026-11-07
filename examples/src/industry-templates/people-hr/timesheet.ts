/**
 * Timesheet.
 * A landscape weekly timesheet: hours by project and day, billable value, utilisation against target, expenses, and approval, with totals that reconcile.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Table,
  VerticalStack,
  pageTemplate,
  TextBlock,
  Heading,
  Container,
  HorizontalStack,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.purple[800];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Timesheet and billable-hours summary ─────────────────────────────────────
//
// The document professional-services software produces every week: what a
// consultant worked on, against which project and rate, what is billable and
// what is not, and the approval that turns it into an invoice line.
//
// It is the natural companion to the quotation at one end of the engagement and
// the invoice at the other, and it is where the arithmetic is most visible to
// the person signing it: daily totals across the bottom, per-project totals down
// the side, and both adding to the same figure. That cross-footing is the whole
// point — a timesheet whose row totals and column totals disagree is one nobody
// will approve.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample people, projects, clients, and
// rates throughout.

const SHEET = {
  reference: 'TS-2026-W37-0114',
  consultant: 'Sample Consultant — Senior Consultant',
  employeeId: 'EMP-0114',
  weekCommencing: new Date(Date.UTC(2026, 8, 7)),
  weekEnding: new Date(Date.UTC(2026, 8, 13)),
  submitted: new Date(Date.UTC(2026, 8, 14)),
  approver: 'Sample Manager — Engagement Manager',
  contractedHours: 37.5,
  utilisationTarget: 0.8,
};

const DAYS = ['Mon 07', 'Tue 08', 'Wed 09', 'Thu 10', 'Fri 11', 'Sat 12', 'Sun 13'] as const;

const ROWS: ProjectRow[] = [
  {
    code: 'PRJ-2210',
    client: 'Sample Client Ltd',
    task: 'Data migration — phase 1',
    billable: true,
    rate: 145,
    hours: [7.5, 6.0, 0, 4.0, 3.5, 0, 0],
  },
  {
    code: 'PRJ-2210',
    client: 'Sample Client Ltd',
    task: 'Migration workshop — onsite',
    billable: true,
    rate: 165,
    hours: [0, 0, 7.5, 0, 0, 0, 0],
  },
  {
    code: 'PRJ-2244',
    client: 'Sample Customer Ltd',
    task: 'Integration support — retainer',
    billable: true,
    rate: 145,
    hours: [0, 1.5, 0, 3.0, 2.0, 0, 0],
  },
  {
    code: 'PRJ-2251',
    client: 'Sample Buyer Ltd',
    task: 'Discovery — scoping call and notes',
    billable: true,
    rate: 145,
    hours: [0, 0, 0, 0, 1.5, 0, 0],
  },
  {
    code: 'INT-0001',
    client: 'Internal',
    task: 'Practice meeting and pipeline review',
    billable: false,
    rate: 0,
    hours: [0, 0, 0, 0.5, 0, 0, 0],
  },
  {
    code: 'INT-0004',
    client: 'Internal',
    task: 'Accredited training — certification renewal',
    billable: false,
    rate: 0,
    hours: [0, 0, 0, 0, 1.5, 0, 0],
  },
];

const EXPENSES: Expense[] = [
  {
    date: '09 Sep 2026',
    project: 'PRJ-2210',
    description: 'Rail fare — onsite workshop, return',
    amount: 84.6,
    rechargeable: true,
  },
  {
    date: '09 Sep 2026',
    project: 'PRJ-2210',
    description: 'Subsistence — onsite day',
    amount: 18.5,
    rechargeable: true,
  },
  {
    date: '11 Sep 2026',
    project: 'INT-0004',
    description: 'Certification examination fee',
    amount: 125.0,
    rechargeable: false,
  },
];

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

export function generate(): Document {
  // Everything is computed. The cross-footing below — row totals and column
  // totals adding to the same figure — is what an approver actually checks.
  const rowTotals = ROWS.map(row => sum(row.hours));
  const dayTotals = DAYS.map((_, dayIndex) => sum(ROWS.map(row => row.hours[dayIndex])));

  const totalFromRows = sum(rowTotals);
  const totalFromDays = sum(dayTotals);
  const crossFoots = Math.abs(totalFromRows - totalFromDays) < 0.005;

  const billableHours = sum(ROWS.filter(r => r.billable).map(r => sum(r.hours)));
  const nonBillableHours = totalFromRows - billableHours;
  const billableValue = ROWS.filter(r => r.billable).reduce((total, r) => total + sum(r.hours) * r.rate, 0);
  const utilisation = totalFromRows > 0 ? billableHours / totalFromRows : 0;

  const rechargeable = EXPENSES.filter(e => e.rechargeable).reduce((total, e) => total + e.amount, 0);
  const nonRechargeable = EXPENSES.filter(e => !e.rechargeable).reduce((total, e) => total + e.amount, 0);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 40,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          `${SHEET.reference} · ${SHEET.consultant} · week ending ${gbDate(SHEET.weekEnding)}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Timesheet ${SHEET.reference} — week ending ${gbDate(SHEET.weekEnding)}`,
      author: 'Sample Consultancy Ltd',
      subject:
        'Weekly timesheet: hours by project and day, billable value, utilisation, expenses, and the approval that releases it for invoicing (sample data).',
      keywords: 'timesheet, billable hours, utilisation, professional services, approval, pdf/ua, pdf/a',
    },
  });

  // Landscape, because seven day columns plus project, client, task, rate and
  // totals do not fit a portrait page at a readable size.

  doc.add(accentBar());
  doc.add(cell('TIMESHEET · WEEKLY', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Week ending ${gbDate(SHEET.weekEnding)}`));
  doc.add(cell(SHEET.consultant, { color: MUTED, mb: 12 }));

  doc.add(
    weightedRow(
      [
        field('Timesheet', SHEET.reference),
        field('Employee', SHEET.employeeId),
        field('Week commencing', gbDate(SHEET.weekCommencing)),
        field('Submitted', gbDate(SHEET.submitted)),
        field('Approver', SHEET.approver),
      ],
      { mb: 6 }
    )
  );

  doc.add(
    weightedRow(
      [
        tile(totalFromRows.toFixed(1), 'Hours recorded'),
        tile(billableHours.toFixed(1), 'Billable', POSITIVE),
        tile(nonBillableHours.toFixed(1), 'Non-billable', MUTED),
        tile(
          `${(utilisation * 100).toFixed(0)}%`,
          `Utilisation (target ${(SHEET.utilisationTarget * 100).toFixed(0)}%)`,
          utilisation >= SHEET.utilisationTarget ? POSITIVE : NEGATIVE
        ),
        tile(money(billableValue), 'Billable value', ACCENT),
      ],
      { spacing: 8, mb: 4 }
    )
  );

  // ── The grid ───────────────────────────────────────────────────────────────

  doc.add(h2('Hours by project and day'));

  const grid = new Table({
    columns: [1.1, 1.6, 3.2, 0.9, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.85, 1.05],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  grid.addHeader(
    th('Project'),
    th('Client'),
    th('Task'),
    th('Rate', 'right'),
    ...DAYS.map(day => th(day, 'right')),
    th('Hours', 'right'),
    th('Value', 'right')
  );

  for (const [index, row] of ROWS.entries()) {
    const hours = rowTotals[index];
    grid.addRow(
      td(row.code, { bold: true }),
      td(row.client, { color: MUTED }),
      td(row.task),
      td(row.billable ? money(row.rate) : '—', { align: 'right', color: row.billable ? INK : MUTED }),
      ...row.hours.map(value =>
        td(value === 0 ? '·' : value.toFixed(1), { align: 'right', color: value === 0 ? MUTED : INK })
      ),
      td(hours.toFixed(1), { align: 'right', bold: true }),
      td(row.billable ? money(hours * row.rate) : 'Non-billable', {
        align: 'right',
        bold: row.billable,
        color: row.billable ? INK : MUTED,
      })
    );
  }

  // The cross-footing row: day totals along the bottom, against the row total.
  grid.addRow(
    td('Daily total', { bold: true, color: ACCENT }),
    td(''),
    td(''),
    td(''),
    ...dayTotals.map(value => td(value.toFixed(1), { align: 'right', bold: true, color: ACCENT })),
    td(totalFromDays.toFixed(1), { align: 'right', bold: true, color: ACCENT }),
    td(money(billableValue), { align: 'right', bold: true, color: ACCENT })
  );
  doc.add(grid);

  if (crossFoots) {
    doc.add(
      cell(
        `Row totals and daily totals both come to ${totalFromRows.toFixed(1)} hours against ` +
          `${SHEET.contractedHours.toFixed(1)} contracted.`,
        { size: 8.5, color: MUTED, mt: 6, mb: 4 }
      )
    );
  } else {
    doc.add(
      cell(
        `Row totals come to ${totalFromRows.toFixed(1)} hours but daily totals come to ` +
          `${totalFromDays.toFixed(1)}. This timesheet does not cross-foot and must not be approved.`,
        { size: 9.5, bold: true, color: NEGATIVE, mt: 6, mb: 4 }
      )
    );
  }

  // ── Expenses ───────────────────────────────────────────────────────────────

  // Each section is kept whole, so a heading never sits apart from its table and a table is never left with its totals on another page.
  const expensesSection = new VerticalStack({ breakAllowed: false });
  expensesSection.add(h2('Expenses'));

  const expenses = new Table({
    columns: [1.2, 1.2, 5.4, 1.6, 1.2],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  expenses.addHeader(th('Date'), th('Project'), th('Description'), th('Recharge'), th('Amount', 'right'));
  for (const expense of EXPENSES) {
    expenses.addRow(
      td(expense.date),
      td(expense.project),
      td(expense.description),
      td(expense.rechargeable ? 'Rechargeable' : 'Absorbed', {
        color: expense.rechargeable ? POSITIVE : MUTED,
      }),
      td(money(expense.amount), { align: 'right', bold: true })
    );
  }
  expensesSection.add(expenses);

  expensesSection.add(
    totalsPanel([
      totalLine('Billable time', money(billableValue)),
      totalLine('Rechargeable expenses', money(rechargeable)),
      totalLine('Absorbed expenses', money(nonRechargeable), { color: MUTED }),
      divider(),
      totalLine('Invoiceable this week', money(billableValue + rechargeable), {
        bold: true,
        size: 11,
        color: ACCENT,
      }),
    ])
  );
  doc.add(expensesSection);

  // ── Approval ───────────────────────────────────────────────────────────────

  const approval = new VerticalStack({ breakAllowed: false });
  approval.add(h2('Declaration and approval'));
  approval.add(
    panel('Consultant declaration', [
      cell(
        'I confirm that the hours recorded above were worked on the projects shown, that the expenses claimed were ' +
          'incurred in performing them, and that receipts have been submitted for every rechargeable item.',
        { size: 9, mb: 0 }
      ),
    ])
  );
  approval.add(
    panel(
      'Approval releases this for invoicing',
      [
        cell(
          'Approving this timesheet releases the billable time and rechargeable expenses to the next invoice run ' +
            'for each project. Query any line before approving; a line queried after approval has to be credited.',
          { size: 9, mb: 0 }
        ),
      ],
      { accent: NEGATIVE }
    )
  );

  approval.add(
    weightedRow(
      [
        field('Submitted by', `${SHEET.consultant} — ${gbDate(SHEET.submitted)}`),
        field('Approved by', `${SHEET.approver} — date`),
        field('Released to billing', 'Reference'),
      ],
      { spacing: 22, mb: 0 }
    )
  );
  doc.add(approval);

  return doc;
}

// Local helpers and sample types used by this document.

interface ProjectRow {
  code: string;
  client: string;
  task: string;
  billable: boolean;
  /** Hourly rate; zero where the line is not billable. */
  rate: number;
  /** Hours per day, in the order of DAYS. */
  hours: number[];
}

interface Expense {
  date: string;
  project: string;
  description: string;
  amount: number;
  rechargeable: boolean;
}

// Local helpers keep this example ready to copy into a single file.

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: 'left' | 'right' | 'center' | 'justify';
  mt?: number;
  mb?: number;
}

/** A styled text cell with trade-document defaults. */
function cell(text: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(text, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    color: o.color ?? INK,
    alignment: o.align ?? 'left',
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 0 },
  });
}

/** Table header cell — white on the accent band. */
function th(text: string, align: TextOpts['align'] = 'left'): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: '#ffffff', align });
}

/** Table body cell. */
function td(text: string, o: TextOpts = {}): TextBlock {
  return cell(text, { size: o.size ?? 8.5, ...o });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 21,
    color: HEADING,
    margin: { bottom: 4 },
  });
}

function h2(text: string, color: ColorInput = ACCENT): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: color,
    margin: { top: 16, bottom: 8 },
  });
}

/** The full-width accent rule at the top of each document. */
function accentBar(color: ColorInput = ACCENT, height = 4): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 14 } });
}

/** One label/value pair for the reference grid. */
function field(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }), cell(value, { size: 9.5 })],
  });
}

/** A row of evenly weighted elements. */
function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: o.spacing ?? 14,
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 14 },
  });
  for (const item of items) row.add(item, 1);
  return row;
}

/** A "label ....... value" totals line, weighted so the value hugs the right. */
function totalLine(label: string, value: string, o: TextOpts = {}): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 3, bottom: 3 } });
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: 'right' }), 2);
  return row;
}

/** A right-hand totals panel, with the body already assembled. */
function totalsPanel(children: IElement[], weight = 1.6): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 10, bottom: 4 } });
  row.add(new Container({}), 2);
  row.add(
    new Container({
      backgroundColor: ColorPalette.purple[50],
      cornerRadius: 6,
      padding: 12,
      child: new VerticalStack({ children }),
    }),
    weight
  );
  return row;
}

/** A bordered panel with a heading — terms, notes, declarations. */
function panel(title: string, children: IElement[], o: { accent?: ColorInput } = {}): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 12,
    margin: { top: 4, bottom: 12 },
    child: new VerticalStack({
      spacing: 4,
      children: [cell(title, { bold: true, size: 9.5, color: o.accent ?? ACCENT, mb: 4 }), ...children],
    }),
  });
}

/** A summary tile. */
function tile(value: string, label: string, accent: ColorInput = ACCENT): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: [11, 10],
    child: new VerticalStack({
      children: [cell(value, { bold: true, size: 14, color: accent, mb: 2 }), cell(label, { size: 8, color: MUTED })],
    }),
  });
}

/** A thin divider, used above a grand total. */
function divider(): Container {
  return new Container({ backgroundColor: RULE, height: 0.75, margin: { top: 5, bottom: 5 } });
}

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

// ── Formatting ───────────────────────────────────────────────────────────────

/**
 * Sterling, with the sign outside the symbol.
 *
 * Prepending the currency symbol to a signed number prints a credit
 * as "£-420.00". On a statement or a credit note, where the sign is the most
 * important character in the cell, it belongs in front of the symbol.
 */
function money(value: number, symbol = '£', locale = 'en-GB'): string {
  const sign = value < 0 ? '-' : '';
  return sign + symbol + Math.abs(value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}
