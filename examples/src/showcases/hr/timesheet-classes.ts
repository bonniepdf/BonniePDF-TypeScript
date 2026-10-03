// ── Timesheet and billable-hours summary (class API) ─────────────────────────
//
// What a consultant worked on, against which project and rate, what is billable
// and what is not, and the approval that turns it into an invoice line. Daily
// totals across the bottom, per-project totals down the side, both adding to the
// same figure.
//
// The **class / construct-then-mutate** companion to `timesheet.ts`. Same
// timesheet, authored the long way: `new` each element and assign its properties
// one at a time, with the enum members rather than their string literals. It
// renders **byte-for-byte identically** to the options-object form (an
// equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PdfAConformance,
  PageOrientation,
  TextAlignment,
  TextStyle,
  TextElementBase,
  Table,
  Color,
  Border,
  BorderColors,
  VerticalStack,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  POSITIVE,
  NEGATIVE,
  accentBar,
  band,
  cell,
  divider,
  field,
  gbDate,
  h1,
  h2,
  money,
  panel,
  td,
  th,
  tile,
  totalLine,
  totalsPanel,
  weightedRow,
} from '../invoices/_trade-kit-classes';

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

interface Expense {
  date: string;
  project: string;
  description: string;
  amount: number;
  rechargeable: boolean;
}

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

  // Landscape, because seven day columns plus project, client, task, rate and
  // totals do not fit a portrait page at a readable size.
  const settings = new DocumentSettings(PdfSize.a4, 40);
  settings.orientation = PageOrientation.Landscape;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(INK);
  settings.footerTemplate = (pageNumber: number): IElement =>
    band(
      `${SHEET.reference} · ${SHEET.consultant} · week ending ${gbDate(SHEET.weekEnding)}`,
      `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
    );

  const metadata = new DocumentMetadata();
  metadata.title = `Timesheet ${SHEET.reference} — week ending ${gbDate(SHEET.weekEnding)}`;
  metadata.author = 'Sample Consultancy Ltd';
  metadata.subject =
    'Weekly timesheet: hours by project and day, billable value, utilisation, expenses, and the approval that releases it for invoicing (sample data).';
  metadata.keywords = 'timesheet, billable hours, utilisation, professional services, approval, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

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

  const grid = new Table(1.1, 1.6, 3.2, 0.9, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.85, 1.05);
  grid.cellPadding = 5;
  grid.border = new Border(0.5);
  grid.borderColors = new BorderColors(RULE);
  grid.headerBackgroundColor = ACCENT;
  grid.headerTextColor = Color.white;
  grid.addHeader(
    th('Project'),
    th('Client'),
    th('Task'),
    th('Rate', TextAlignment.Right),
    ...DAYS.map(day => th(day, TextAlignment.Right)),
    th('Hours', TextAlignment.Right),
    th('Value', TextAlignment.Right)
  );

  for (const [index, row] of ROWS.entries()) {
    const hours = rowTotals[index];
    grid.addRow(
      td(row.code, { bold: true }),
      td(row.client, { color: MUTED }),
      td(row.task),
      td(row.billable ? money(row.rate) : '—', { align: TextAlignment.Right, color: row.billable ? INK : MUTED }),
      ...row.hours.map(value =>
        td(value === 0 ? '·' : value.toFixed(1), { align: TextAlignment.Right, color: value === 0 ? MUTED : INK })
      ),
      td(hours.toFixed(1), { align: TextAlignment.Right, bold: true }),
      td(row.billable ? money(hours * row.rate) : 'Non-billable', {
        align: TextAlignment.Right,
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
    ...dayTotals.map(value => td(value.toFixed(1), { align: TextAlignment.Right, bold: true, color: ACCENT })),
    td(totalFromDays.toFixed(1), { align: TextAlignment.Right, bold: true, color: ACCENT }),
    td(money(billableValue), { align: TextAlignment.Right, bold: true, color: ACCENT })
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
  const expensesSection = new VerticalStack();
  expensesSection.breakAllowed = false;
  expensesSection.add(h2('Expenses'));

  const expenses = new Table(1.2, 1.2, 5.4, 1.6, 1.2);
  expenses.cellPadding = 5;
  expenses.border = new Border(0.5);
  expenses.borderColors = new BorderColors(RULE);
  expenses.headerBackgroundColor = ACCENT;
  expenses.headerTextColor = Color.white;
  expenses.addHeader(th('Date'), th('Project'), th('Description'), th('Recharge'), th('Amount', TextAlignment.Right));
  for (const expense of EXPENSES) {
    expenses.addRow(
      td(expense.date),
      td(expense.project),
      td(expense.description),
      td(expense.rechargeable ? 'Rechargeable' : 'Absorbed', {
        color: expense.rechargeable ? POSITIVE : MUTED,
      }),
      td(money(expense.amount), { align: TextAlignment.Right, bold: true })
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

  const approval = new VerticalStack();
  approval.breakAllowed = false;
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
      NEGATIVE
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
