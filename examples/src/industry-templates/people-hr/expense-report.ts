/**
 * Expense Report.
 * An employee expense claim: foreign-currency lines converted at a stated rate, policy checks that flag over-limit meals and missing receipts, totals by category, and approval slots for the employee, manager, and finance.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  Table,
  pageTemplate,
  TextBlock,
  Heading,
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

const ACCENT = ColorPalette.violet[700];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Employee expense report ──────────────────────────────────────────────────
//
// The form finance asks for after every trip, and the one that is most often
// sent back. Reports are returned for the same three reasons: a foreign amount
// with no stated rate, a receipt missing above the limit, and a total that does
// not match the lines.
//
// So none of those can happen here. Foreign-currency lines carry their original
// amount, the rate, and the converted pounds, converted in whole-number
// arithmetic so the result is the same every time. The policy is applied to
// the data rather than described next to it: a meal over its limit and an
// unreceipted line above £25 are flagged on the row itself and counted in the
// tiles. Totals by category are summed from the lines.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample people, projects and amounts
// throughout.

const CLAIM = {
  number: 'ER-2026-0417',
  employee: 'Alex Sample',
  employeeId: 'EMP-20418',
  department: 'Sales',
  costCentre: 'CC-4410',
  project: 'Customer visits — Lisbon',
  manager: 'Jordan Reviewer',
  from: new Date(Date.UTC(2026, 9, 10)),
  to: new Date(Date.UTC(2026, 9, 17)),
  submitted: new Date(Date.UTC(2026, 9, 19)),
  /** Pence per euro, in ten-thousandths: 0.8615. */
  eurRate: 8_615,
  mealLimit: 3_500,
  receiptLimit: 2_500,
};

const CATEGORIES = ['Travel', 'Accommodation', 'Meals', 'Client entertainment', 'Office'];

/** `minor` is pence or cents in the line's own currency. */
const LINES: ExpenseLine[] = [
  {
    day: 10,
    description: 'Train to Sample City Airport',
    category: 'Travel',
    currency: 'GBP',
    minor: 1_850,
    receipt: true,
  },
  { day: 10, description: 'Lunch at the airport', category: 'Meals', currency: 'GBP', minor: 1_495, receipt: true },
  {
    day: 10,
    description: 'Taxi, Lisbon airport to hotel',
    category: 'Travel',
    currency: 'EUR',
    minor: 2_400,
    receipt: true,
  },
  {
    day: 10,
    description: 'Dinner, Restaurante Exemplo',
    category: 'Meals',
    currency: 'EUR',
    minor: 5_280,
    receipt: true,
  },
  {
    day: 11,
    description: 'Hotel Wi-Fi supplement',
    category: 'Accommodation',
    currency: 'EUR',
    minor: 900,
    receipt: true,
  },
  { day: 11, description: 'Coffee and pastry', category: 'Meals', currency: 'EUR', minor: 640, receipt: false },
  { day: 12, description: 'Metro day pass', category: 'Travel', currency: 'EUR', minor: 650, receipt: true },
  { day: 12, description: 'Team lunch', category: 'Meals', currency: 'EUR', minor: 3_120, receipt: true },
  {
    day: 13,
    description: 'Client gift, Sample Lda',
    category: 'Client entertainment',
    currency: 'GBP',
    minor: 4_500,
    receipt: true,
  },
  {
    day: 14,
    description: 'Printing, proposal packs',
    category: 'Office',
    currency: 'GBP',
    minor: 2_310,
    receipt: true,
  },
  { day: 14, description: 'Dinner', category: 'Meals', currency: 'EUR', minor: 3_890, receipt: false },
  { day: 15, description: 'Taxi to client site', category: 'Travel', currency: 'EUR', minor: 1_850, receipt: true },
  { day: 16, description: 'Lunch', category: 'Meals', currency: 'EUR', minor: 2_180, receipt: true },
  { day: 17, description: 'Taxi to Lisbon airport', category: 'Travel', currency: 'EUR', minor: 2_650, receipt: true },
  {
    day: 17,
    description: 'Train home from the airport',
    category: 'Travel',
    currency: 'GBP',
    minor: 1_850,
    receipt: true,
  },
];

export function generate(): Document {
  const rows = LINES.map(line => {
    const pence = toPence(line);
    const flag = policyFlag(line, pence);
    return { line, pence, flag };
  });
  const total = rows.reduce((sum, r) => sum + r.pence, 0);
  const flagged = rows.filter(r => r.flag !== '');
  const flaggedTotal = flagged.reduce((sum, r) => sum + r.pence, 0);
  const receipts = rows.filter(r => r.line.receipt).length;
  const byCategory = CATEGORIES.map(category => ({
    category,
    count: rows.filter(r => r.line.category === category).length,
    pence: rows.filter(r => r.line.category === category).reduce((sum, r) => sum + r.pence, 0),
  }));
  if (byCategory.reduce((sum, c) => sum + c.pence, 0) !== total) throw new Error('Categories do not add up');

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          `Expense report ${CLAIM.number} · ${CLAIM.employee} · sample data`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Expense report ${CLAIM.number} — ${CLAIM.employee}`,
      author: CLAIM.employee,
      subject:
        'Employee expense report: foreign-currency conversion, policy flags, totals by category, and approval slots (sample data).',
      keywords: 'expense report, expenses, claim, receipts, policy, finance, hr, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('EXPENSE CLAIM', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Expense report ${CLAIM.number}`));
  doc.add(
    cell(`${CLAIM.project} · ${gbDate(CLAIM.from)} to ${gbDate(CLAIM.to)}`, {
      color: MUTED,
      mb: 14,
    })
  );

  doc.add(
    weightedRow(
      [
        field('Employee', `${CLAIM.employee} (${CLAIM.employeeId})`),
        field('Department', CLAIM.department),
        field('Cost centre', CLAIM.costCentre),
        field('Approving manager', CLAIM.manager),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow(
      [
        field('Submitted', gbDate(CLAIM.submitted)),
        field('Currency of claim', 'GBP'),
        field('Euro rate used', `1 EUR = £${(CLAIM.eurRate / 10_000).toFixed(4)}`),
        field('Lines', String(rows.length)),
      ],
      { mb: 4 }
    )
  );

  doc.add(
    weightedRow(
      [
        tile(money(total), 'Total claimed'),
        tile(money(total - flaggedTotal), 'Within policy', POSITIVE),
        tile(String(flagged.length), 'Lines to review', flagged.length > 0 ? NEGATIVE : POSITIVE),
        tile(`${receipts} of ${rows.length}`, 'Receipts attached'),
      ],
      { spacing: 10, mb: 4 }
    )
  );

  doc.add(h2('Expenses'));
  const table = new Table({
    columns: [1.25, 2.65, 1.45, 0.8, 1.2, 1.05, 1.55],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    th('Date'),
    th('Description'),
    th('Category'),
    th('Receipt'),
    th('Original', 'right'),
    th('GBP', 'right'),
    th('Policy')
  );
  for (const { line, pence, flag } of rows) {
    table.addRow(
      td(gbDate(new Date(Date.UTC(2026, 9, line.day))), { color: MUTED }),
      td(line.description),
      td(line.category, { color: MUTED }),
      td(line.receipt ? 'Yes' : 'No', { color: line.receipt ? POSITIVE : NEGATIVE, bold: !line.receipt }),
      td(line.currency === 'GBP' ? '—' : `${line.currency} ${amount(line.minor)}`, { align: 'right', color: MUTED }),
      td(money(pence), { align: 'right', bold: true }),
      td(flag === '' ? 'OK' : flag, { color: flag === '' ? MUTED : NEGATIVE, bold: flag !== '' })
    );
  }
  table.addRow(
    td(''),
    td('Total', { bold: true }),
    td(''),
    td(''),
    td(''),
    td(money(total), { align: 'right', bold: true }),
    td('')
  );
  doc.add(table);

  doc.add(h2('By category'));
  const summary = new Table({
    columns: [3, 1, 1.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  summary.addHeader(th('Category'), th('Lines', 'right'), th('Total', 'right'));
  for (const c of byCategory) {
    summary.addRow(td(c.category), td(String(c.count), { align: 'right' }), td(money(c.pence), { align: 'right' }));
  }
  summary.addRow(
    td('All categories', { bold: true }),
    td(String(rows.length), { align: 'right', bold: true }),
    td(money(total), { align: 'right', bold: true })
  );
  doc.add(summary);

  if (flagged.length > 0) {
    doc.add(
      panel(
        'Lines for your manager to review',
        [
          ...flagged.map(r =>
            cell(
              `${gbDate(new Date(Date.UTC(2026, 9, r.line.day)))} · ${r.line.description} (${money(r.pence)}) — ${r.flag}.`,
              {
                size: 9,
                mb: 3,
              }
            )
          ),
          cell(
            `Policy: meals up to ${money(CLAIM.mealLimit)} each, and a receipt for any line above ${money(CLAIM.receiptLimit)}. ` +
              'Lines outside policy can still be approved with a note.',
            { size: 9, color: MUTED, mb: 0 }
          ),
        ],
        { accent: NEGATIVE }
      )
    );
  }

  doc.add(h2('Approvals'));
  doc.add(
    cell(
      'I confirm these expenses were incurred wholly for business purposes, that the receipts attached are the originals ' +
        'or true copies, and that nothing here has been claimed before.',
      { size: 9, color: MUTED, mb: 8 }
    )
  );
  doc.add(
    weightedRow(
      [
        slot('Employee', CLAIM.employee),
        slot('Manager approval', CLAIM.manager),
        slot('Finance', 'Reference and date'),
      ],
      { spacing: 22, mb: 6 }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface ExpenseLine {
  day: number;
  description: string;
  category: string;
  currency: 'GBP' | 'EUR';
  /** Pence or cents, in the line's own currency. */
  minor: number;
  receipt: boolean;
}

/** The line in pence. Euros convert at the claim rate, rounding half up, in whole numbers. */
function toPence(line: ExpenseLine): number {
  return line.currency === 'GBP' ? line.minor : Math.floor((line.minor * CLAIM.eurRate + 5_000) / 10_000);
}

/** Empty when the line is within policy; otherwise the reason it needs a second look. */
function policyFlag(line: ExpenseLine, pence: number): string {
  if (line.category === 'Meals' && pence > CLAIM.mealLimit) return 'Over meal limit';
  if (!line.receipt && pence > CLAIM.receiptLimit) return 'Receipt needed';
  return '';
}

/** Minor units as a decimal amount: 1,234.56. */
function amount(minor: number): string {
  const whole = String(Math.floor(minor / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${whole}.${String(minor % 100).padStart(2, '0')}`;
}

/** Pence as pounds: £1,234.56. */
function money(pence: number): string {
  return `£${amount(pence)}`;
}

function slot(role: string, hint: string): VerticalStack {
  return new VerticalStack({
    children: [
      cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 20 }),
      new Container({ backgroundColor: RULE, height: 0.75, margin: { bottom: 5 } }),
      cell(hint, { size: 8, color: MUTED }),
    ],
  });
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

/** A styled text cell with document defaults. */
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

/** A bordered panel with a heading — notes and declarations. */
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

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}
