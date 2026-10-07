/**
 * Remittance Advice (Class API).
 * The same remittance advice as Remittance advice, built with the class API: construct each element and assign its properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
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
  Table,
  Color,
  Border,
  BorderColors,
  pageTemplate,
  type IElement,
  TextBlock,
  Heading,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Container,
  ColorPalette,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Remittance advice (class API) ────────────────────────────────────────────
//
// What a payer sends when they pay: which invoices this transfer settles, which
// credit notes were applied against them, and what the net payment therefore
// is. The whole document is one reconciliation — the allocated amounts must add
// to the payment made, and it says so on its face if they do not.
//
// The **class / construct-then-mutate** companion to `remittance-advice.ts`.
// Same advice, authored the long way: `new` each element and assign its
// properties one at a time, with the enum members rather than their string
// literals. It renders **byte-for-byte identically** to the options-object form
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

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

const KIND_COLOUR: Record<Allocation, Color> = {
  Invoice: INK,
  'Credit note': POSITIVE,
  Adjustment: NEGATIVE,
};

// ── The document ─────────────────────────────────────────────────────────────

export function generate(): Document {
  const allocated = ITEMS.reduce((sum, item) => sum + item.amount, 0);
  // The one property this document exists to assert.
  const reconciles = Math.abs(allocated - PAYMENT_MADE) < 0.005;
  const difference = allocated - PAYMENT_MADE;

  const settled = ITEMS.filter(i => i.amount > 0).length;
  const credits = ITEMS.filter(i => i.amount < 0).length;

  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.footerTemplate = pageTemplate({
    default: band(
      `Remittance advice ${REMITTANCE.reference} · bank reference ${REMITTANCE.bankReference}`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Remittance advice ${REMITTANCE.reference}`;
  metadata.author = 'Sample Buyer Ltd';
  metadata.subject =
    'Remittance advice: the invoices a payment settles, the credits applied against them, and the reconciliation to the amount actually paid (sample data).';
  metadata.keywords = 'remittance advice, payment allocation, accounts payable, accounts receivable, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

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

  const table = new Table(1.3, 1.7, 1.2, 1.2, 3.4, 1.4);
  table.cellPadding = 5;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = ACCENT;
  table.headerTextColor = Color.white;
  table.addHeader(
    th('Type'),
    th('Reference'),
    th('Dated'),
    th('Due'),
    th('Note'),
    th('Allocated', TextAlignment.Right)
  );
  for (const item of ITEMS) {
    table.addRow(
      td(item.kind, { color: KIND_COLOUR[item.kind] }),
      td(item.reference, { bold: true }),
      td(item.dated, { color: MUTED }),
      td(item.due, { color: MUTED }),
      td(item.note),
      td(money(item.amount), {
        align: TextAlignment.Right,
        bold: true,
        color: item.amount < 0 ? POSITIVE : INK,
      })
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
  const partPayment = cell(
    'Half of this invoice is paid pending agreement of the milestone it covers. The balance will follow ' +
      'on the next payment run once the milestone is signed off.',
    { size: 9, mb: 0 }
  );
  const deduction = cell(
    'The late payment charge is not accepted and has been deducted. The original invoice was settled ' +
      'within terms; please raise a credit note or provide the calculation relied upon.',
    { size: 9, mb: 0 }
  );
  doc.add(
    weightedRow(
      [panel('Part payment — INV-2026-3402', [partPayment]), panel('Deduction — ADJ-2026-0041', [deduction], NEGATIVE)],
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

// ── Building blocks, the long way ────────────────────────────────────────────

interface CellOpts {
  size?: number;
  bold?: boolean;
  color?: Color;
  align?: TextAlignment;
  mt?: number;
  mb?: number;
}

function cell(text: string, o: CellOpts = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = o.size ?? 9;
  block.color = o.color ?? INK;
  block.alignment = o.align ?? TextAlignment.Left;
  block.margin = new Thickness(0, o.mt ?? 0, 0, o.mb ?? 0);
  return block;
}

function lines(items: string[], o: CellOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
}

function th(text: string, align: TextAlignment = TextAlignment.Left): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: Color.white, align });
}

function td(text: string, o: CellOpts = {}): TextBlock {
  return cell(text, { ...o, size: o.size ?? 8.5 });
}

function h1(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 1;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 21;
  heading.color = HEADING;
  heading.margin = new Thickness(0, 0, 0, 4);
  return heading;
}

function h2(text: string, color: Color = ACCENT): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.color = color;
  heading.margin = new Thickness(0, 16, 0, 8);
  return heading;
}

/** The full-width accent rule at the top of each document. */

function accentBar(color: Color = ACCENT, height = 4): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
}

function partyBlock(label: string, address: string[]): VerticalStack {
  const stack = new VerticalStack();
  stack.add(cell(label.toUpperCase(), { bold: true, size: 7, color: MUTED, mb: 3 }));
  stack.add(lines(address, { size: 9 }));
  return stack;
}

function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  stack.add(cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }));
  stack.add(cell(value, { size: 9.5 }));
  return stack;
}

function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = o.spacing ?? 14;
  row.margin = new Thickness(0, o.mt ?? 0, 0, o.mb ?? 14);
  for (const item of items) row.add(item, 1);
  return row;
}

function totalLine(label: string, value: string, o: CellOpts = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 3, 0, 3);
  row.add(cell(label, { size: o.size ?? 9, bold: o.bold, color: o.color ?? MUTED }), 3);
  row.add(cell(value, { size: o.size ?? 9, bold: o.bold, color: o.color ?? INK, align: TextAlignment.Right }), 2);
  return row;
}

function totalsPanel(children: IElement[], weight = 1.6): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 10, 0, 4);
  row.add(new Container(), 2);
  const body = new VerticalStack();
  for (const child of children) body.add(child);
  const box = new Container();
  box.backgroundColor = ColorPalette.indigo[50];
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.child = body;
  row.add(box, weight);
  return row;
}

function panel(title: string, children: IElement[], accent: Color = ACCENT): Container {
  const body = new VerticalStack();
  body.spacing = 4;
  body.add(cell(title, { bold: true, size: 9.5, color: accent, mb: 4 }));
  for (const child of children) body.add(child);
  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.margin = new Thickness(0, 4, 0, 12);
  box.child = body;
  return box;
}

function divider(): Container {
  const rule = new Container();
  rule.backgroundColor = RULE;
  rule.height = 0.75;
  rule.margin = new Thickness(0, 5, 0, 5);
  return rule;
}

function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: TextAlignment.Right }), 2);
  return row;
}
