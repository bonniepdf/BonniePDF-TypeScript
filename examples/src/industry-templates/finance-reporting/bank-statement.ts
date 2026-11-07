/**
 * Bank Statement.
 * A current-account statement: opening and closing balances, money in and out, spending by category, and a transaction list with a running balance that repeats its header across pages.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  formatNumber,
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  Table,
  BarChart,
  ChartData,
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

const ACCENT = ColorPalette.teal[700];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Current-account statement ────────────────────────────────────────────────
//
// What a bank sends every month, and the document most people have actually
// read closely: a balance at each end, every movement in between, and a
// running balance that has to add up row by row.
//
// The detail that makes it a statement rather than a table: nothing in the
// money columns is typed in. Every amount is held in pence, the running balance
// is calculated from the rows in order, and the opening balance plus money in
// less money out is checked against the closing balance before the page is
// drawn. A transaction list of 34 rows runs across pages with its header
// repeated, and the spending chart is summed from the same rows.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations and numbers
// throughout.

const ACCOUNT = {
  holder: ['Ms A. Sample', '14 Example Gardens', 'Sample Town', 'ST4 7XY'],
  bank: ['Sample Bank plc', 'Customer Services', 'PO Box 1000', 'Sample City', 'SC1 1AA'],
  number: '00482193',
  sortCode: '99-00-42',
  iban: 'GB00 SMPL 9900 4200 4821 93',
  statementNumber: '2026/09',
  from: new Date(Date.UTC(2026, 8, 1)),
  to: new Date(Date.UTC(2026, 8, 30)),
  openingBalance: 241_867,
};

/** Amounts are pence: positive money in, negative money out. */
const TRANSACTIONS: Transaction[] = [
  { day: 1, description: 'Salary — Sample Employer Ltd', category: 'Income', amount: 312_450 },
  { day: 1, description: 'Standing order — Rent, Sample Lettings', category: 'Housing', amount: -125_000 },
  { day: 2, description: 'Card — Sample Supermarket', category: 'Groceries', amount: -6_482 },
  { day: 3, description: 'Direct debit — Sample Energy', category: 'Utilities', amount: -8_900 },
  { day: 3, description: 'Direct debit — Sample Broadband', category: 'Utilities', amount: -3_499 },
  { day: 4, description: 'Card — Sample Coffee Co', category: 'Eating out', amount: -385 },
  { day: 5, description: 'Card — Sample Pharmacy', category: 'Health', amount: -1_275 },
  { day: 5, description: 'Transfer in — J Sample', category: 'Transfers', amount: 5_000 },
  { day: 6, description: 'Card — Sample Fuel', category: 'Transport', amount: -5_410 },
  { day: 7, description: 'Card — Sample Supermarket', category: 'Groceries', amount: -4_127 },
  { day: 8, description: 'Direct debit — Sample Insurance', category: 'Insurance', amount: -2_650 },
  { day: 8, description: 'Card — Sample Bookshop', category: 'Shopping', amount: -2_199 },
  { day: 9, description: 'Card — Sample Train Co', category: 'Transport', amount: -3_850 },
  { day: 10, description: 'Card — Sample Restaurant', category: 'Eating out', amount: -4_620 },
  { day: 11, description: 'Cash withdrawal — Sample ATM', category: 'Cash', amount: -4_000 },
  { day: 12, description: 'Card — Sample Supermarket', category: 'Groceries', amount: -5_873 },
  { day: 12, description: 'Card — Sample Streaming', category: 'Entertainment', amount: -1_099 },
  { day: 13, description: 'Refund — Sample Retailer', category: 'Shopping', amount: 3_499 },
  { day: 14, description: 'Card — Sample Hardware', category: 'Home', amount: -7_845 },
  { day: 15, description: 'Card — Sample Coffee Co', category: 'Eating out', amount: -410 },
  { day: 15, description: 'Direct debit — Sample Gym', category: 'Health', amount: -3_500 },
  { day: 16, description: 'Card — Sample Supermarket', category: 'Groceries', amount: -3_918 },
  { day: 17, description: 'Card — Sample Taxi', category: 'Transport', amount: -1_860 },
  { day: 18, description: 'Card — Sample Cinema', category: 'Entertainment', amount: -2_400 },
  { day: 19, description: 'Card — Sample Restaurant', category: 'Eating out', amount: -5_180 },
  { day: 20, description: 'Faster payment — Sample Plumbing', category: 'Home', amount: -18_500 },
  { day: 21, description: 'Card — Sample Supermarket', category: 'Groceries', amount: -6_204 },
  { day: 22, description: 'Transfer out — Savings pot', category: 'Transfers', amount: -20_000 },
  { day: 23, description: 'Card — Sample Fuel', category: 'Transport', amount: -4_985 },
  { day: 24, description: 'Card — Sample Garden Centre', category: 'Home', amount: -3_295 },
  { day: 25, description: 'Direct debit — Sample Council Tax', category: 'Housing', amount: -16_400 },
  { day: 26, description: 'Card — Sample Supermarket', category: 'Groceries', amount: -4_456 },
  { day: 27, description: 'Card — Sample Coffee Co', category: 'Eating out', amount: -395 },
  { day: 28, description: 'Card — Sample Online Store', category: 'Shopping', amount: -5_999 },
  { day: 29, description: 'Interest paid', category: 'Interest', amount: 214 },
  { day: 30, description: 'Card — Sample Supermarket', category: 'Groceries', amount: -3_842 },
];

export function generate(): Document {
  const moneyIn = TRANSACTIONS.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const moneyOut = TRANSACTIONS.filter(t => t.amount < 0).reduce((sum, t) => sum - t.amount, 0);
  const closing = ACCOUNT.openingBalance + moneyIn - moneyOut;

  // The running balance is the sum of the rows, so check it against the totals
  // before drawing anything: a statement that does not add up is worse than none.
  let running = ACCOUNT.openingBalance;
  const balances = TRANSACTIONS.map(t => (running += t.amount));
  if (running !== closing) throw new Error('Statement does not reconcile');

  const spending = spendingByCategory();

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
          `Statement ${ACCOUNT.statementNumber} · account ending ${ACCOUNT.number.slice(-4)} · sample data, not a real account`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Current account statement ${ACCOUNT.statementNumber}`,
      author: 'Sample Bank plc',
      subject:
        'Current account statement: opening and closing balances, money in and out, spending by category, and a transaction list with a running balance (sample data).',
      keywords: 'bank statement, current account, transactions, running balance, finance, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('CURRENT ACCOUNT STATEMENT', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1('Your statement'));
  doc.add(
    cell(`${gbDate(ACCOUNT.from)} to ${gbDate(ACCOUNT.to)} · statement ${ACCOUNT.statementNumber}`, {
      color: MUTED,
      mb: 14,
    })
  );

  doc.add(
    weightedRow([partyBlock('Account holder', ACCOUNT.holder), partyBlock('Your bank', ACCOUNT.bank)], {
      spacing: 20,
      mb: 4,
    })
  );
  doc.add(
    weightedRow(
      [
        field('Account number', ACCOUNT.number),
        field('Sort code', ACCOUNT.sortCode),
        field('IBAN', ACCOUNT.iban),
        field('Account type', 'Everyday current account'),
      ],
      { mb: 6 }
    )
  );

  doc.add(
    weightedRow(
      [
        tile(money(ACCOUNT.openingBalance), 'Opening balance'),
        tile(money(moneyIn), 'Money in', POSITIVE),
        tile(money(moneyOut), 'Money out', NEGATIVE),
        tile(money(closing), 'Closing balance'),
      ],
      { spacing: 10, mb: 4 }
    )
  );

  doc.add(h2('Where your everyday money went'));
  doc.add(
    new BarChart({
      data: new ChartData({
        series: [
          { color: ACCENT, dataPoints: spending.map(s => ({ label: s.category, value: Math.round(s.pence / 100) })) },
        ],
        yAxis: { maxValue: 400, stepCount: 4, prefix: '£' },
      }),
      altText:
        `Everyday spending by category, in pounds. ${spending[0].category} is the largest at ${money(spending[0].pence)}; ` +
        `${spending[spending.length - 1].category} is the smallest at ${money(spending[spending.length - 1].pence)}.`,
      height: 130,
      stretchToFit: true,
      barColor: ACCENT,
      fontFamily: StandardFonts.Helvetica,
      labelFontSize: 7,
      backgroundColor: '#ffffff',
    })
  );
  doc.add(
    cell('Money out only, rounded to the nearest pound. Rent, council tax and transfers are left out.', {
      size: 8,
      color: MUTED,
      mt: 4,
      mb: 4,
    })
  );

  doc.add(h2('Your transactions'));

  const table = new Table({
    columns: [1.25, 3.3, 1.3, 1.05, 1.05, 1.15],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    th('Date'),
    th('Description'),
    th('Category'),
    th('Money out', 'right'),
    th('Money in', 'right'),
    th('Balance', 'right')
  );
  table.addRow(
    td(gbDate(ACCOUNT.from), { color: MUTED }),
    td('Opening balance', { bold: true }),
    td(''),
    td(''),
    td(''),
    td(money(ACCOUNT.openingBalance), { align: 'right', bold: true })
  );
  TRANSACTIONS.forEach((t, i) => {
    table.addRow(
      td(gbDate(new Date(Date.UTC(2026, 8, t.day))), { color: MUTED }),
      td(t.description),
      td(t.category, { color: MUTED }),
      td(t.amount < 0 ? money(-t.amount) : '', { align: 'right' }),
      td(t.amount > 0 ? money(t.amount) : '', { align: 'right', color: POSITIVE }),
      td(money(balances[i]), { align: 'right', bold: true })
    );
  });
  table.addRow(
    td(gbDate(ACCOUNT.to), { color: MUTED }),
    td('Closing balance', { bold: true }),
    td(''),
    td(money(moneyOut), { align: 'right', bold: true }),
    td(money(moneyIn), { align: 'right', bold: true, color: POSITIVE }),
    td(money(closing), { align: 'right', bold: true })
  );
  doc.add(table);

  doc.add(
    panel('Interest and charges this month', [
      cell(`Interest paid: ${money(214)} (0.10% AER on the average daily balance).`, { size: 9, mb: 3 }),
      cell('Charges: none. You did not use an overdraft this month.', { size: 9, mb: 0 }),
    ])
  );
  doc.add(
    panel('Check your statement', [
      cell(
        'If you see a payment you do not recognise, contact us straight away on the number on the back of your card. ' +
          'You are protected against unauthorised payments, and the sooner you tell us the sooner we can act.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface Transaction {
  day: number;
  description: string;
  category: string;
  /** Pence. Positive is money in; negative is money out. */
  amount: number;
}

interface CategorySpend {
  category: string;
  pence: number;
}

/** Fixed commitments and moves between your own accounts are not everyday spending. */
const NOT_EVERYDAY = new Set(['Housing', 'Transfers']);

/** Everyday money out summed by category, largest first (ties broken by name). */
function spendingByCategory(): CategorySpend[] {
  const totals = new Map<string, number>();
  for (const t of TRANSACTIONS) {
    if (t.amount >= 0 || NOT_EVERYDAY.has(t.category)) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) - t.amount);
  }
  return [...totals]
    .map(([category, pence]) => ({ category, pence }))
    .sort((a, b) => b.pence - a.pence || (a.category < b.category ? -1 : a.category > b.category ? 1 : 0))
    .slice(0, 7);
}

/** Pence as pounds: £1,234.56, with a leading minus when negative. */
function money(pence: number): string {
  return formatNumber(pence / 100, 'N2', '£');
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

/** A styled text cell with statement defaults. */
function cell(text: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(text, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    color: o.color ?? INK,
    alignment: o.align ?? 'left',
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 0 },
  });
}

/** A block of plain lines (an address), tagged as one paragraph. */
function lines(items: string[], o: TextOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
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

/** A labelled address block. */
function partyBlock(label: string, address: string[]): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 7, color: MUTED, mb: 3 }), lines(address, { size: 9 })],
  });
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
