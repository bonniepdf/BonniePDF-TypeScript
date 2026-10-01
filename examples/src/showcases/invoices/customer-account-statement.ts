// ── Customer account statement ───────────────────────────────────────────────
//
// The second-most-generated document in business software after the invoice,
// and the one most often missing from a PDF library's examples: a period
// statement showing the opening balance, every invoice, payment and credit that
// moved it, the running balance after each, the closing balance, and an ageing
// analysis of what is overdue.
//
// Two things make it a real test rather than a table demo. The running balance
// has to be arithmetically correct and tie back to the closing figure — a
// statement that does not reconcile is worse than no statement. And the ledger
// is long, so it flows across pages with a repeating header, with the ageing
// summary and remittance advice kept whole at the end.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations, references, and
// amounts throughout.

import {
  Document,
  TextBlock,
  TextElementBase,
  Heading,
  Container,
  VerticalStack,
  HorizontalStack,
  Table,
  StandardFonts,
  ColorPalette,
  type ColorInput,
} from '@bonniepdf/core';

import { INK, MUTED, RULE } from './_kit';

const ACCENT = ColorPalette.indigo[700];
const OVERDUE = ColorPalette.rose[700];
const CREDIT = ColorPalette.emerald[700];

// ── The account ──────────────────────────────────────────────────────────────

const ACCOUNT = {
  number: 'ACC-004182',
  customer: 'Sample Customer Ltd',
  address: ['Sample Customer Ltd', 'Unit 7, Sample Business Park', 'Sample Town', 'SA1 4TP', 'United Kingdom'],
  supplier: 'Sample Supplier Ltd',
  supplierAddress: ['Sample Supplier Ltd', '12 Sample Street', 'Sample City', 'SC2 9BD', 'United Kingdom'],
  periodFrom: new Date(Date.UTC(2026, 7, 1)),
  periodTo: new Date(Date.UTC(2026, 7, 31)),
  statementDate: new Date(Date.UTC(2026, 8, 1)),
  terms: '30 days net',
  creditLimit: 25000,
  openingBalance: 6280.5,
};

type EntryKind = 'Invoice' | 'Payment' | 'Credit note' | 'Adjustment';

interface Entry {
  date: string;
  kind: EntryKind;
  reference: string;
  detail: string;
  /** Positive increases what the customer owes; negative reduces it. */
  amount: number;
  /** Ageing bucket for the outstanding-items analysis; absent once settled. */
  due?: string;
}

const ENTRIES: Entry[] = [
  {
    date: '03 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3312',
    detail: 'Monthly subscription — August',
    amount: 1450.0,
    due: '02 Sep 2026',
  },
  {
    date: '05 Aug 2026',
    kind: 'Payment',
    reference: 'BACS-88214',
    detail: 'Payment received, thank you \u2014 settles INV-2026-3245',
    amount: -4820.5,
  },
  {
    date: '07 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3340',
    detail: 'Professional services — July',
    amount: 3280.0,
    due: '06 Sep 2026',
  },
  {
    date: '11 Aug 2026',
    kind: 'Credit note',
    reference: 'CRN-2026-0118',
    detail: 'Credit — duplicated licence line on INV-2026-3340',
    amount: -420.0,
  },
  {
    date: '12 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3366',
    detail: 'Additional user seats (14)',
    amount: 1876.0,
    due: '11 Sep 2026',
  },
  {
    date: '14 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3381',
    detail: 'Onsite support visit — 2 days',
    amount: 1360.0,
    due: '13 Sep 2026',
  },
  {
    date: '18 Aug 2026',
    kind: 'Payment',
    reference: 'BACS-88903',
    detail: 'Payment received, thank you',
    amount: -3280.0,
  },
  {
    date: '19 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3402',
    detail: 'Data migration — phase 1',
    amount: 5400.0,
    due: '18 Sep 2026',
  },
  {
    date: '21 Aug 2026',
    kind: 'Adjustment',
    reference: 'ADJ-2026-0041',
    detail: 'Late payment charge — INV-2026-3180',
    amount: 62.4,
    due: '20 Sep 2026',
  },
  {
    date: '24 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3428',
    detail: 'Training workshop — 8 attendees',
    amount: 2240.0,
    due: '23 Sep 2026',
  },
  {
    date: '26 Aug 2026',
    kind: 'Credit note',
    reference: 'CRN-2026-0126',
    detail: 'Credit — training workshop, one attendee withdrew',
    amount: -280.0,
  },
  {
    date: '27 Aug 2026',
    kind: 'Payment',
    reference: 'BACS-89417',
    detail: 'Payment received, thank you',
    amount: -1456.0,
  },
  {
    date: '28 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3455',
    detail: 'Monthly subscription — September',
    amount: 1450.0,
    due: '27 Sep 2026',
  },
  {
    date: '31 Aug 2026',
    kind: 'Invoice',
    reference: 'INV-2026-3470',
    detail: 'Integration support — retainer',
    amount: 980.0,
    due: '30 Sep 2026',
  },
];

/**
 * The items still outstanding at the statement date, with the date each fell
 * due.
 *
 * The ageing analysis is computed from these, not written down beside them. Two
 * of the sample rows are deliberately netted (an invoice less its credit note),
 * because that is how an open item actually ages — the credit does not sit in
 * its own bucket.
 *
 * `reconcile()` asserts that these sum to the ledger's closing balance. A
 * statement whose ageing does not tie to its own closing figure is worse than
 * no statement, and it is the single defect this document must not have.
 */
interface OpenItem {
  reference: string;
  due: Date;
  amount: number;
}

const OPEN_ITEMS: OpenItem[] = [
  { reference: 'INV-2026-3180', due: new Date(Date.UTC(2026, 6, 15)), amount: 1460.0 },
  { reference: 'INV-2026-3312', due: new Date(Date.UTC(2026, 8, 2)), amount: 1450.0 },
  { reference: 'INV-2026-3381', due: new Date(Date.UTC(2026, 8, 13)), amount: 1360.0 },
  { reference: 'INV-2026-3402', due: new Date(Date.UTC(2026, 8, 18)), amount: 5400.0 },
  { reference: 'ADJ-2026-0041', due: new Date(Date.UTC(2026, 8, 20)), amount: 62.4 },
  { reference: 'INV-2026-3428', due: new Date(Date.UTC(2026, 8, 23)), amount: 1960.0 },
  { reference: 'INV-2026-3455', due: new Date(Date.UTC(2026, 8, 27)), amount: 1450.0 },
  { reference: 'INV-2026-3470', due: new Date(Date.UTC(2026, 8, 30)), amount: 980.0 },
];

const BUCKETS = ['Current', '1\u201330 days', '31\u201360 days', '61\u201390 days', 'Over 90 days'] as const;

/** Which ageing bucket an item falls into at the statement date. */
function bucketFor(item: OpenItem, asAt: Date): (typeof BUCKETS)[number] {
  const daysOverdue = Math.floor((asAt.getTime() - item.due.getTime()) / 86_400_000);
  if (daysOverdue <= 0) return 'Current';
  if (daysOverdue <= 30) return '1\u201330 days';
  if (daysOverdue <= 60) return '31\u201360 days';
  if (daysOverdue <= 90) return '61\u201390 days';
  return 'Over 90 days';
}

const KIND_COLOUR: Record<EntryKind, ColorInput> = {
  Invoice: INK,
  Payment: CREDIT,
  'Credit note': CREDIT,
  Adjustment: OVERDUE,
};

// ── Document ─────────────────────────────────────────────────────────────────

export function generate(): Document {
  // The running balance is computed, never transcribed. A statement whose
  // closing figure does not follow from its own rows is the one defect this
  // document cannot have.
  let running = ACCOUNT.openingBalance;
  const rows = ENTRIES.map(entry => {
    running += entry.amount;
    return { entry, balance: running };
  });
  const closing = running;

  const invoiced = ENTRIES.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  const paid = -ENTRIES.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0);
  // Ageing is derived from the open items, then reconciled against the ledger's
  // own closing balance. If a future edit to either list breaks the tie, the
  // document says so on its face rather than printing a plausible lie.
  const ageing = new Map<string, number>(BUCKETS.map(b => [b, 0]));
  for (const item of OPEN_ITEMS) {
    const bucket = bucketFor(item, ACCOUNT.statementDate);
    ageing.set(bucket, (ageing.get(bucket) ?? 0) + item.amount);
  }
  const ageingTotal = OPEN_ITEMS.reduce((sum, item) => sum + item.amount, 0);
  const reconciles = Math.abs(ageingTotal - closing) < 0.005;
  const overdue = ageingTotal - (ageing.get('Current') ?? 0);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      headerTemplate: (pageNumber: number) =>
        pageNumber === 1
          ? undefined
          : band(`Statement ${ACCOUNT.number} — ${ACCOUNT.customer}`, `As at ${gb(ACCOUNT.statementDate)}`),
      footerTemplate: (pageNumber: number) =>
        band(
          `${ACCOUNT.supplier} · payment terms ${ACCOUNT.terms}`,
          `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
        ),
    },
    metadata: {
      title: `Account statement ${ACCOUNT.number} — ${gb(ACCOUNT.periodFrom)} to ${gb(ACCOUNT.periodTo)}`,
      author: ACCOUNT.supplier,
      subject:
        'Customer account statement: opening balance, ledger with running balance, closing balance, ageing analysis, and remittance advice (sample data).',
      keywords: 'account statement, ledger, running balance, ageing, accounts receivable, pdf/ua, pdf/a',
    },
  });

  // ── Title and parties ──────────────────────────────────────────────────────

  doc.add(new Container({ backgroundColor: ACCENT, height: 4, margin: { bottom: 14 } }));

  const titleRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 16 } });
  titleRow.add(
    new VerticalStack({
      children: [
        cell('STATEMENT OF ACCOUNT', { bold: true, size: 8.5, color: ACCENT, mb: 4 }),
        new Heading('Account statement', {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 21,
          color: ColorPalette.slate[800],
          margin: { bottom: 4 },
        }),
        cell(`${gb(ACCOUNT.periodFrom)} to ${gb(ACCOUNT.periodTo)}`, { color: MUTED }),
      ],
    }),
    3
  );
  titleRow.add(
    new VerticalStack({
      children: [
        cell('Statement date', { bold: true, size: 7, color: MUTED, align: 'right', mb: 2 }),
        cell(gb(ACCOUNT.statementDate), { align: 'right', mb: 6 }),
        cell('Account number', { bold: true, size: 7, color: MUTED, align: 'right', mb: 2 }),
        cell(ACCOUNT.number, { align: 'right' }),
      ],
    }),
    2
  );
  doc.add(titleRow);

  const parties = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20, margin: { bottom: 16 } });
  parties.add(partyBlock('Statement for', ACCOUNT.address), 1);
  parties.add(partyBlock('From', ACCOUNT.supplierAddress), 1);
  parties.add(
    new VerticalStack({
      children: [
        cell('TERMS', { bold: true, size: 7, color: MUTED, mb: 2 }),
        cell(ACCOUNT.terms, { mb: 8 }),
        cell('CREDIT LIMIT', { bold: true, size: 7, color: MUTED, mb: 2 }),
        cell(money(ACCOUNT.creditLimit, '£', 'en-GB')),
      ],
    }),
    1
  );
  doc.add(parties);

  // ── Balance summary ────────────────────────────────────────────────────────

  const summary = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10, margin: { bottom: 6 } });
  summary.add(tile(money(ACCOUNT.openingBalance, '£', 'en-GB'), 'Opening balance', INK), 1);
  summary.add(tile(money(invoiced, '£', 'en-GB'), 'Invoiced and charged', INK), 1);
  summary.add(tile(money(paid, '£', 'en-GB'), 'Paid and credited', CREDIT), 1);
  summary.add(tile(money(closing, '£', 'en-GB'), 'Closing balance', ACCENT), 1);
  doc.add(summary);

  // ── The ledger ─────────────────────────────────────────────────────────────

  doc.add(h2('Account activity'));

  const ledger = new Table({
    columns: [1.1, 1.2, 1.5, 3.6, 1.2, 1.3],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  ledger.addHeader(th('Date'), th('Type'), th('Reference'), th('Details'), th('Amount'), th('Balance'));

  ledger.addRow(
    cell(gb(ACCOUNT.periodFrom), { size: 8.5 }),
    cell('Balance', { size: 8.5, bold: true, color: MUTED }),
    cell('—', { size: 8.5, color: MUTED }),
    cell('Opening balance brought forward', { size: 8.5, color: MUTED }),
    cell('', { size: 8.5 }),
    cell(money(ACCOUNT.openingBalance, '£', 'en-GB'), { size: 8.5, bold: true, align: 'right' })
  );

  for (const { entry, balance } of rows) {
    ledger.addRow(
      cell(entry.date, { size: 8.5 }),
      cell(entry.kind, { size: 8.5, color: KIND_COLOUR[entry.kind] }),
      cell(entry.reference, { size: 8.5 }),
      cell(entry.detail, { size: 8.5, color: MUTED }),
      cell(money(entry.amount, '£', 'en-GB'), {
        size: 8.5,
        align: 'right',
        color: entry.amount < 0 ? CREDIT : INK,
      }),
      cell(money(balance, '£', 'en-GB'), { size: 8.5, align: 'right' })
    );
  }
  doc.add(ledger);

  // ── Closing balance ────────────────────────────────────────────────────────

  const closingRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 10, bottom: 4 } });
  closingRow.add(new Container({}), 2);
  closingRow.add(
    new Container({
      backgroundColor: ColorPalette.indigo[50],
      cornerRadius: 6,
      padding: 12,
      child: new VerticalStack({
        children: [
          totalLine('Opening balance', money(ACCOUNT.openingBalance, '£', 'en-GB')),
          totalLine('Invoiced and charged', money(invoiced, '£', 'en-GB')),
          totalLine('Paid and credited', money(-paid, '£', 'en-GB')),
          new Container({ backgroundColor: RULE, height: 0.75, margin: { top: 5, bottom: 5 } }),
          totalLine('Balance now due', money(closing, '£', 'en-GB'), { bold: true, size: 11, color: ACCENT }),
        ],
      }),
    }),
    1.6
  );
  doc.add(closingRow);

  // ── Ageing analysis ────────────────────────────────────────────────────────

  doc.add(h2('Ageing of outstanding items'));
  doc.add(
    cell('How the balance now due is distributed by age. Anything beyond the Current column is past its due date.', {
      color: MUTED,
      size: 9,
      mb: 8,
    })
  );

  const ageingTable = new Table({
    columns: BUCKETS.map(() => 1),
    cellPadding: 8,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  ageingTable.addHeader(...BUCKETS.map(bucket => th(bucket)));
  ageingTable.addRow(
    ...BUCKETS.map(bucket => {
      const amount = ageing.get(bucket) ?? 0;
      return cell(money(amount, '£', 'en-GB'), {
        bold: true,
        // Only the Current column is not yet late.
        color: bucket === 'Current' || amount === 0 ? INK : OVERDUE,
      });
    })
  );
  doc.add(ageingTable);

  doc.add(
    cell(
      `Total outstanding ${money(ageingTotal, '£', 'en-GB')}, of which ` +
        `${money(overdue, '£', 'en-GB')} is overdue.` +
        (reconciles ? ' This agrees with the closing balance above.' : ''),
      { size: 8.5, color: MUTED, mt: 6, mb: 4 }
    )
  );

  if (!reconciles) {
    doc.add(
      cell(
        `The ageing analysis totals ${money(ageingTotal, '£', 'en-GB')} but the ledger closes at ` +
          `${money(closing, '£', 'en-GB')}. This statement does not reconcile and must not be issued.`,
        { size: 9, bold: true, color: OVERDUE, mb: 4 }
      )
    );
  }

  // ── Remittance advice ──────────────────────────────────────────────────────

  doc.add(h2('Remittance advice'));
  doc.add(
    new Container({
      border: { width: 0.75, color: RULE },
      cornerRadius: 6,
      padding: 14,
      child: new VerticalStack({
        spacing: 6,
        children: [
          cell('Please detach and return with your payment, or quote the account number on your transfer.', {
            size: 9,
            color: MUTED,
          }),
          remittanceRow('Account number', ACCOUNT.number),
          remittanceRow('Statement date', gb(ACCOUNT.statementDate)),
          remittanceRow('Balance now due', money(closing, '£', 'en-GB')),
          remittanceRow('Amount enclosed', ''),
          cell(
            'Payment by bank transfer to the account shown on your invoices. ' +
              'Queries: quote the account number and the reference of the item in question.',
            { size: 8.5, color: MUTED, mt: 4 }
          ),
        ],
      }),
    })
  );

  return doc;
}

// ── Local helpers ────────────────────────────────────────────────────────────

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: 'left' | 'right' | 'center' | 'justify';
  mt?: number;
  mb?: number;
}

/**
 * A styled text cell.
 *
 * Local rather than imported from `_kit`: that kit's `cell` takes `Thickness`
 * and `Color` instances, which predates the forgiving-input surface. This one
 * takes tokens and plain numbers, matching how the rest of the catalogue is now
 * written.
 */
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

/** A "label ....... value" totals line, weighted so the value hugs the right. */
function totalLine(label: string, value: string, o: TextOpts = {}): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 3, bottom: 3 } });
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: 'right' }), 2);
  return row;
}

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

/**
 * Sterling, with the sign outside the symbol.
 *
 * Not the kit's `money`: that prepends the symbol to the raw number, so a credit
 * prints as "£-420.00". On a statement, where every other row is a debit, the
 * sign is the most important character in the cell and belongs in front.
 */
function money(value: number, symbol = '£', locale = 'en-GB'): string {
  const sign = value < 0 ? '-' : '';
  return sign + symbol + Math.abs(value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function gb(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: ACCENT,
    margin: { top: 16, bottom: 8 },
  });
}

function th(text: string): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: '#ffffff' });
}

function partyBlock(label: string, address: string[]): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 7, color: MUTED, mb: 3 }), lines(address, { size: 9 })],
  });
}

function tile(value: string, label: string, accent: ColorInput): Container {
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

function remittanceRow(label: string, value: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(label, { size: 9, color: MUTED }), 2);
  row.add(
    new VerticalStack({
      children: [
        cell(value, { size: 9, bold: value !== '', align: 'right' }),
        // An empty value is a box the payer writes in.
        ...(value === '' ? [new Container({ backgroundColor: ColorPalette.slate[400], height: 0.75 })] : []),
      ],
    }),
    1.5
  );
  return row;
}
