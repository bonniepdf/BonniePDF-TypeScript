// ── Customer account statement (class API) ───────────────────────────────────
//
// A period statement: the opening balance, every invoice, payment and credit
// that moved it, the running balance after each, the closing balance, and an
// ageing analysis of what is overdue. The running balance is computed and the
// ageing is reconciled against it, because a statement that does not reconcile
// is worse than no statement.
//
// The **class / construct-then-mutate** companion to
// `customer-account-statement.ts`. Same statement, authored the long way: `new`
// each element and assign its properties one at a time, with the enum members
// rather than their string literals. It renders **byte-for-byte identically** to
// the options-object form (an equivalence test binds the two). Reach for the
// options form first; this variant exists to show what it desugars to.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PdfAConformance,
  TextAlignment,
  TextStyle,
  TextElementBase,
  Heading,
  Container,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Table,
  StandardFonts,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  RULE,
  band,
  cell,
  gbDate as gb,
  h2,
  lines,
  money,
  partyBlock,
  th,
  tile,
  totalLine,
} from './_trade-kit-classes';

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

const KIND_COLOUR: Record<EntryKind, Color> = {
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

  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.headerTemplate = (pageNumber: number): IElement | undefined =>
    pageNumber === 1
      ? undefined
      : band(`Statement ${ACCOUNT.number} — ${ACCOUNT.customer}`, `As at ${gb(ACCOUNT.statementDate)}`);
  settings.footerTemplate = (pageNumber: number): IElement =>
    band(
      `${ACCOUNT.supplier} · payment terms ${ACCOUNT.terms}`,
      `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
    );

  const metadata = new DocumentMetadata();
  metadata.title = `Account statement ${ACCOUNT.number} — ${gb(ACCOUNT.periodFrom)} to ${gb(ACCOUNT.periodTo)}`;
  metadata.author = ACCOUNT.supplier;
  metadata.subject =
    'Customer account statement: opening balance, ledger with running balance, closing balance, ageing analysis, and remittance advice (sample data).';
  metadata.keywords = 'account statement, ledger, running balance, ageing, accounts receivable, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  // ── Title and parties ──────────────────────────────────────────────────────

  const rule = new Container();
  rule.backgroundColor = ACCENT;
  rule.height = 4;
  rule.margin = new Thickness(0, 0, 0, 14);
  doc.add(rule);

  const titleRow = new HorizontalStack();
  titleRow.widthDistribution = WidthDistribution.Weighted;
  titleRow.margin = new Thickness(0, 0, 0, 16);

  const titleStack = new VerticalStack();
  titleStack.add(cell('STATEMENT OF ACCOUNT', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  const title = new Heading('Account statement');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 21;
  title.color = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 4);
  titleStack.add(title);
  titleStack.add(cell(`${gb(ACCOUNT.periodFrom)} to ${gb(ACCOUNT.periodTo)}`, { color: MUTED }));
  titleRow.add(titleStack, 3);

  const refStack = new VerticalStack();
  refStack.add(cell('Statement date', { bold: true, size: 7, color: MUTED, align: TextAlignment.Right, mb: 2 }));
  refStack.add(cell(gb(ACCOUNT.statementDate), { align: TextAlignment.Right, mb: 6 }));
  refStack.add(cell('Account number', { bold: true, size: 7, color: MUTED, align: TextAlignment.Right, mb: 2 }));
  refStack.add(cell(ACCOUNT.number, { align: TextAlignment.Right }));
  titleRow.add(refStack, 2);
  doc.add(titleRow);

  const parties = new HorizontalStack();
  parties.widthDistribution = WidthDistribution.Weighted;
  parties.spacing = 20;
  parties.margin = new Thickness(0, 0, 0, 16);
  parties.add(partyBlock('Statement for', ACCOUNT.address), 1);
  parties.add(partyBlock('From', ACCOUNT.supplierAddress), 1);

  const termsStack = new VerticalStack();
  termsStack.add(cell('TERMS', { bold: true, size: 7, color: MUTED, mb: 2 }));
  termsStack.add(cell(ACCOUNT.terms, { mb: 8 }));
  termsStack.add(cell('CREDIT LIMIT', { bold: true, size: 7, color: MUTED, mb: 2 }));
  termsStack.add(cell(money(ACCOUNT.creditLimit, '£', 'en-GB')));
  parties.add(termsStack, 1);
  doc.add(parties);

  // ── Balance summary ────────────────────────────────────────────────────────

  const summary = new HorizontalStack();
  summary.widthDistribution = WidthDistribution.Weighted;
  summary.spacing = 10;
  summary.margin = new Thickness(0, 0, 0, 6);
  summary.add(tile(money(ACCOUNT.openingBalance, '£', 'en-GB'), 'Opening balance', INK), 1);
  summary.add(tile(money(invoiced, '£', 'en-GB'), 'Invoiced and charged', INK), 1);
  summary.add(tile(money(paid, '£', 'en-GB'), 'Paid and credited', CREDIT), 1);
  summary.add(tile(money(closing, '£', 'en-GB'), 'Closing balance', ACCENT), 1);
  doc.add(summary);

  // ── The ledger ─────────────────────────────────────────────────────────────

  doc.add(h2('Account activity'));

  const ledger = new Table(1.1, 1.2, 1.5, 3.6, 1.2, 1.3);
  ledger.cellPadding = 6;
  ledger.border = new Border(0.5);
  ledger.borderColors = new BorderColors(RULE);
  ledger.headerBackgroundColor = ACCENT;
  ledger.headerTextColor = Color.white;
  ledger.addHeader(th('Date'), th('Type'), th('Reference'), th('Details'), th('Amount'), th('Balance'));

  ledger.addRow(
    cell(gb(ACCOUNT.periodFrom), { size: 8.5 }),
    cell('Balance', { size: 8.5, bold: true, color: MUTED }),
    cell('—', { size: 8.5, color: MUTED }),
    cell('Opening balance brought forward', { size: 8.5, color: MUTED }),
    cell('', { size: 8.5 }),
    cell(money(ACCOUNT.openingBalance, '£', 'en-GB'), { size: 8.5, bold: true, align: TextAlignment.Right })
  );

  for (const { entry, balance } of rows) {
    ledger.addRow(
      cell(entry.date, { size: 8.5 }),
      cell(entry.kind, { size: 8.5, color: KIND_COLOUR[entry.kind] }),
      cell(entry.reference, { size: 8.5 }),
      cell(entry.detail, { size: 8.5, color: MUTED }),
      cell(money(entry.amount, '£', 'en-GB'), {
        size: 8.5,
        align: TextAlignment.Right,
        color: entry.amount < 0 ? CREDIT : INK,
      }),
      cell(money(balance, '£', 'en-GB'), { size: 8.5, align: TextAlignment.Right })
    );
  }
  doc.add(ledger);

  // ── Closing balance ────────────────────────────────────────────────────────

  const closingRow = new HorizontalStack();
  closingRow.widthDistribution = WidthDistribution.Weighted;
  closingRow.margin = new Thickness(0, 10, 0, 4);
  closingRow.add(new Container(), 2);

  const closingBody = new VerticalStack();
  closingBody.add(totalLine('Opening balance', money(ACCOUNT.openingBalance, '£', 'en-GB')));
  closingBody.add(totalLine('Invoiced and charged', money(invoiced, '£', 'en-GB')));
  closingBody.add(totalLine('Paid and credited', money(-paid, '£', 'en-GB')));

  const closingRule = new Container();
  closingRule.backgroundColor = RULE;
  closingRule.height = 0.75;
  closingRule.margin = new Thickness(0, 5, 0, 5);
  closingBody.add(closingRule);

  closingBody.add(totalLine('Balance now due', money(closing, '£', 'en-GB'), { bold: true, size: 11, color: ACCENT }));

  const closingBox = new Container();
  closingBox.backgroundColor = ColorPalette.indigo[50];
  closingBox.cornerRadius = 6;
  closingBox.padding = new Thickness(12);
  closingBox.child = closingBody;
  closingRow.add(closingBox, 1.6);
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

  const ageingTable = new Table(...BUCKETS.map(() => 1));
  ageingTable.cellPadding = 8;
  ageingTable.border = new Border(0.5);
  ageingTable.borderColors = new BorderColors(RULE);
  ageingTable.headerBackgroundColor = ACCENT;
  ageingTable.headerTextColor = Color.white;
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

  const slip = new VerticalStack();
  slip.spacing = 6;
  slip.add(
    cell('Please detach and return with your payment, or quote the account number on your transfer.', {
      size: 9,
      color: MUTED,
    })
  );
  slip.add(remittanceRow('Account number', ACCOUNT.number));
  slip.add(remittanceRow('Statement date', gb(ACCOUNT.statementDate)));
  slip.add(remittanceRow('Balance now due', money(closing, '£', 'en-GB')));
  slip.add(remittanceRow('Amount enclosed', ''));
  slip.add(
    cell(
      'Payment by bank transfer to the account shown on your invoices. ' +
        'Queries: quote the account number and the reference of the item in question.',
      { size: 8.5, color: MUTED, mt: 4 }
    )
  );

  const slipBox = new Container();
  slipBox.border = new Border(0.75);
  slipBox.borderColors = new BorderColors(RULE);
  slipBox.cornerRadius = 6;
  slipBox.padding = new Thickness(14);
  slipBox.child = slip;
  doc.add(slipBox);

  return doc;
}

// ── Local helpers ────────────────────────────────────────────────────────────

function remittanceRow(label: string, value: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(cell(label, { size: 9, color: MUTED }), 2);

  const valueStack = new VerticalStack();
  valueStack.add(cell(value, { size: 9, bold: value !== '', align: TextAlignment.Right }));
  // An empty value is a box the payer writes in.
  if (value === '') {
    const writeOn = new Container();
    writeOn.backgroundColor = ColorPalette.slate[400];
    writeOn.height = 0.75;
    valueStack.add(writeOn);
  }
  row.add(valueStack, 1.5);
  return row;
}
