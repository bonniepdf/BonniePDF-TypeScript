/**
 * Remittance Advice.
 * A remittance advice: which invoices a payment settles, which credits were applied, and a reconciliation to the amount paid, stating whether it reconciles.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Table,
  type ColorInput,
  pageTemplate,
  TextBlock,
  Heading,
  Container,
  VerticalStack,
  HorizontalStack,
  StandardFonts,
  ColorPalette,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.blue[800];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Remittance advice ────────────────────────────────────────────────────────
//
// What a payer sends when they pay: which invoices this transfer settles, which
// credit notes were applied against them, and what the net payment therefore
// is. Accounts-receivable teams live or die by these — an unallocated payment
// is a debt that stays open on somebody's ledger until a human works out what
// it was for.
//
// The whole document is one reconciliation: the allocated amounts must add to
// the payment made, and it says so on its face if they do not. That single
// property is what makes it worth generating rather than typing.
//
// Short by design. It is a one-page document that travels attached to a payment
// notification, and padding it out would be working against its job.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations, references, and
// amounts throughout.

const REMITTANCE = {
  reference: 'REM-2026-009142',
  paidOn: new Date(Date.UTC(2026, 8, 12)),
  method: 'Bank transfer (BACS)',
  bankReference: 'SAMPLEBUYER 004182',
  account: 'ACC-004182',
  payer: ['Sample Buyer Ltd', 'Accounts Payable', '5 Sample Avenue', 'Sample City', 'SC1 3RG'],
  payee: ['Sample Supplier Ltd', '12 Sample Street', 'Sample City', 'SC2 9BD'],
  contact: 'accounts.payable@sample-buyer.example',
};

const ITEMS: AllocatedItem[] = [
  {
    kind: 'Invoice',
    reference: 'INV-2026-3312',
    dated: '03 Aug 2026',
    due: '02 Sep 2026',
    amount: 1450.0,
    note: 'Paid in full',
  },
  {
    kind: 'Invoice',
    reference: 'INV-2026-3381',
    dated: '14 Aug 2026',
    due: '13 Sep 2026',
    amount: 1360.0,
    note: 'Paid in full',
  },
  {
    kind: 'Invoice',
    reference: 'INV-2026-3428',
    dated: '24 Aug 2026',
    due: '23 Sep 2026',
    amount: 2240.0,
    note: 'Paid in full',
  },
  {
    kind: 'Credit note',
    reference: 'CRN-2026-0126',
    dated: '26 Aug 2026',
    due: '—',
    amount: -280.0,
    note: 'Applied against INV-2026-3428',
  },
  {
    kind: 'Invoice',
    reference: 'INV-2026-3402',
    dated: '19 Aug 2026',
    due: '18 Sep 2026',
    amount: 2700.0,
    note: 'Part payment — £2,700.00 of £5,400.00',
  },
  {
    kind: 'Adjustment',
    reference: 'ADJ-2026-0041',
    dated: '21 Aug 2026',
    due: '20 Sep 2026',
    amount: -62.4,
    note: 'Late payment charge disputed — see note below',
  },
];

/** What actually left the bank. Compared against the allocations, not derived from them. */
const PAYMENT_MADE = 7407.6;

const KIND_COLOUR: Record<Allocation, ColorInput> = {
  Invoice: INK,
  'Credit note': POSITIVE,
  Adjustment: NEGATIVE,
};

export function generate(): Document {
  const allocated = ITEMS.reduce((sum, item) => sum + item.amount, 0);
  // The one property this document exists to assert.
  const reconciles = Math.abs(allocated - PAYMENT_MADE) < 0.005;
  const difference = allocated - PAYMENT_MADE;

  const settled = ITEMS.filter(i => i.amount > 0).length;
  const credits = ITEMS.filter(i => i.amount < 0).length;

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
          `Remittance advice ${REMITTANCE.reference} · bank reference ${REMITTANCE.bankReference}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Remittance advice ${REMITTANCE.reference}`,
      author: 'Sample Buyer Ltd',
      subject:
        'Remittance advice: the invoices a payment settles, the credits applied against them, and the reconciliation to the amount actually paid (sample data).',
      keywords: 'remittance advice, payment allocation, accounts payable, accounts receivable, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('REMITTANCE ADVICE', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Payment of ${money(PAYMENT_MADE)}`));
  doc.add(
    cell(`Sent ${gbDate(REMITTANCE.paidOn)} by ${REMITTANCE.method}. This is not an invoice.`, {
      color: MUTED,
      mb: 10,
    })
  );

  doc.add(
    weightedRow(
      [
        field('Remittance reference', REMITTANCE.reference),
        field('Payment date', gbDate(REMITTANCE.paidOn)),
        field('Bank reference', REMITTANCE.bankReference),
        field('Supplier account', REMITTANCE.account),
      ],
      { mb: 6 }
    )
  );

  doc.add(
    weightedRow([partyBlock('Paid by', REMITTANCE.payer), partyBlock('Paid to', REMITTANCE.payee)], {
      spacing: 20,
      mb: 4,
    })
  );

  doc.add(h2('What this payment settles'));
  doc.add(
    cell(
      `${settled} item(s) settled, ${credits} credit(s) applied. Please allocate against the references below ` +
        'rather than against the payment total.',
      { size: 9, color: MUTED, mb: 8 }
    )
  );

  const table = new Table({
    columns: [1.3, 1.7, 1.2, 1.2, 3.4, 1.4],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(th('Type'), th('Reference'), th('Dated'), th('Due'), th('Note'), th('Allocated', 'right'));
  for (const item of ITEMS) {
    table.addRow(
      td(item.kind, { color: KIND_COLOUR[item.kind] }),
      td(item.reference, { bold: true }),
      td(item.dated, { color: MUTED }),
      td(item.due, { color: MUTED }),
      td(item.note),
      td(money(item.amount), { align: 'right', bold: true, color: item.amount < 0 ? POSITIVE : INK })
    );
  }
  doc.add(table);

  doc.add(
    totalsPanel([
      totalLine('Total allocated', money(allocated)),
      totalLine('Payment sent', money(PAYMENT_MADE)),
      divider(),
      totalLine(reconciles ? 'Difference' : 'UNRECONCILED DIFFERENCE', money(difference), {
        bold: true,
        size: 11,
        color: reconciles ? POSITIVE : NEGATIVE,
      }),
    ])
  );

  if (reconciles) {
    doc.add(
      cell('The allocated amounts agree with the payment sent. Nothing on this advice is unallocated.', {
        size: 9,
        color: MUTED,
        mt: 4,
        mb: 0,
      })
    );
  } else {
    doc.add(
      cell(
        `The allocations total ${money(allocated)} but ${money(PAYMENT_MADE)} was sent. This advice does not ` +
          'reconcile and must not be issued until the difference is resolved.',
        { size: 9.5, bold: true, color: NEGATIVE, mt: 6, mb: 4 }
      )
    );
  }

  doc.add(h2('Notes on this payment'));
  // Side by side, not stacked: every line spent on the notes is a line this
  // document does not have. It travels attached to a payment notification and
  // is meant to be read in one screen, so it has to stay on one page.
  doc.add(
    weightedRow(
      [
        panel('Part payment — INV-2026-3402', [
          cell(
            'Half of this invoice is paid pending agreement of the milestone it covers. The balance will follow ' +
              'on the next payment run once the milestone is signed off.',
            { size: 9, mb: 0 }
          ),
        ]),
        panel(
          'Deduction — ADJ-2026-0041',
          [
            cell(
              'The late payment charge is not accepted and has been deducted. The original invoice was settled ' +
                'within terms; please raise a credit note or provide the calculation relied upon.',
              { size: 9, mb: 0 }
            ),
          ],
          { accent: NEGATIVE }
        ),
      ],
      { spacing: 12, mb: 0 }
    )
  );

  doc.add(
    cell(`Queries on this remittance: ${REMITTANCE.contact}, quoting ${REMITTANCE.reference}.`, {
      size: 8.5,
      color: MUTED,
      mt: 8,
      mb: 0,
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

type Allocation = 'Invoice' | 'Credit note' | 'Adjustment';

interface AllocatedItem {
  kind: Allocation;
  reference: string;
  dated: string;
  due: string;
  /** Positive settles a debt; negative is a credit applied against it. */
  amount: number;
  note: string;
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
      backgroundColor: ColorPalette.blue[50],
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
