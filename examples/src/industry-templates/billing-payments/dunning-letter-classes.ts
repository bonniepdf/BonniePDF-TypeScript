/**
 * Dunning Letter (Class API).
 * The same dunning letter as Dunning letter, built with the class API: construct each element and assign its properties. The output is identical.
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

const ACCENT = ColorPalette.blue[800];

const RULE = ColorPalette.slate[200];

const NEGATIVE = ColorPalette.rose[700];

// ── Dunning letter — final reminder before escalation (class API) ────────────
//
// The collections letter: a letter in tone and structure, but carrying a
// schedule of overdue items and an arithmetic that has to be right. Days overdue
// are derived from the due dates against the letter date, and the escalation
// stage drives the tone, the deadline, and the consequences paragraph.
//
// The **class / construct-then-mutate** companion to `dunning-letter.ts`. Same
// letter, authored the long way: `new` each element and assign its properties
// one at a time, with the enum members rather than their string literals. It
// renders **byte-for-byte identically** to the options-object form (an
// equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

/** The escalation ladder. The stage drives tone, deadline, and consequences. */
const STAGES = {
  1: { name: 'First reminder', days: 14, tone: 'courteous' },
  2: { name: 'Second reminder', days: 10, tone: 'firm' },
  3: { name: 'Final notice before escalation', days: 7, tone: 'final' },
} as const;

const LETTER = {
  reference: 'COL-2026-002281',
  stage: 3 as Stage,
  letterDate: new Date(Date.UTC(2026, 8, 15)),
  account: 'ACC-004182',
  customer: 'Sample Customer Ltd',
  customerAddress: ['Sample Customer Ltd', 'Unit 7, Sample Business Park', 'Sample Town', 'SA1 4TP'],
  supplier: 'Sample Supplier Ltd',
  supplierAddress: ['Sample Supplier Ltd', '12 Sample Street', 'Sample City', 'SC2 9BD'],
  creditControl: 'P. Ahmadi — Credit Control',
  contact: 'credit.control@sample-supplier.example',
  phone: '01632 960 000',
  terms: '30 days net',
  /** Illustrative only; the real figures depend on the contract and jurisdiction. */
  interestRate: 0.08,
  compensationPerInvoice: 40,
};

const OVERDUE: OverdueItem[] = [
  {
    reference: 'INV-2026-3180',
    issued: new Date(Date.UTC(2026, 5, 15)),
    due: new Date(Date.UTC(2026, 6, 15)),
    amount: 1460.0,
  },
  {
    reference: 'INV-2026-3312',
    issued: new Date(Date.UTC(2026, 7, 3)),
    due: new Date(Date.UTC(2026, 8, 2)),
    amount: 1450.0,
  },
  {
    reference: 'INV-2026-3381',
    issued: new Date(Date.UTC(2026, 7, 14)),
    due: new Date(Date.UTC(2026, 8, 13)),
    amount: 1360.0,
  },
];

export function generate(): Document {
  const stage = STAGES[LETTER.stage];

  // Days overdue are derived, so the same letter sent a week later says
  // something different without anyone editing it.
  const rows = OVERDUE.map(item => ({ item, days: daysOverdue(item, LETTER.letterDate) }));
  const principal = OVERDUE.reduce((sum, item) => sum + item.amount, 0);

  // Illustrative statutory-style interest, accrued per item on a daily basis.
  const interest = rows.reduce((sum, { item, days }) => sum + (item.amount * LETTER.interestRate * days) / 365, 0);
  const compensation = OVERDUE.length * LETTER.compensationPerInvoice;
  const totalClaimed = principal + interest + compensation;

  // A final notice is a different document from a first reminder, and it should
  // not look like one. Everything the eye lands on first — the rule, the stage
  // line, the table head, the total, the headings — takes the same tone.
  const TONE = LETTER.stage === 3 ? NEGATIVE : ACCENT;

  const deadline = new Date(LETTER.letterDate.getTime() + stage.days * 86_400_000);
  const oldest = Math.max(...rows.map(r => r.days));

  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(INK);
  settings.footerTemplate = pageTemplate({
    default: band(
      `${LETTER.reference} · account ${LETTER.account} · ${stage.name}`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `${stage.name} — account ${LETTER.account}`;
  metadata.author = LETTER.supplier;
  metadata.subject =
    'Collections letter: overdue schedule with derived days overdue, illustrative interest and compensation, a payment deadline, and the consequences of non-payment (sample data).';
  metadata.keywords = 'dunning, collections, overdue, credit control, late payment, reminder, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  // ── Letterhead ─────────────────────────────────────────────────────────────

  doc.add(accentBar(TONE));
  doc.add(
    cell(stage.name.toUpperCase(), {
      bold: true,
      size: 8.5,
      color: TONE,
      mb: 12,
    })
  );

  const head = weightedRow(
    [
      lines(LETTER.customerAddress, { size: 10 }),
      lines([LETTER.supplier, ...LETTER.supplierAddress.slice(1), '', LETTER.phone, LETTER.contact], {
        size: 9,
        color: MUTED,
        align: TextAlignment.Right,
      }),
    ],
    { spacing: 20, mb: 18 }
  );
  doc.add(head);

  doc.add(cell(gbDate(LETTER.letterDate), { size: 10, color: MUTED, mb: 14 }));

  doc.add(h1(`Overdue account — ${money(principal)} outstanding`));
  doc.add(cell(`Our reference ${LETTER.reference} · your account ${LETTER.account}`, { color: MUTED, mb: 14 }));

  // ── The body ───────────────────────────────────────────────────────────────

  doc.add(cell('Dear Sir or Madam', { size: 10, mb: 10 }));

  doc.add(
    cell(
      `Our records show that ${money(principal)} remains outstanding on your account, across ` +
        `${OVERDUE.length} invoices. The oldest is now ${oldest} days past its due date. Our agreed payment ` +
        `terms are ${LETTER.terms}.`,
      { size: 10, mb: 10 }
    )
  );

  if (LETTER.stage === 3) {
    doc.add(
      cell(
        'We have written to you twice about this and have not received payment or a response. This letter is a ' +
          'final notice before the account is escalated.',
        { size: 10, mb: 10 }
      )
    );
  } else {
    doc.add(
      cell(
        'This may be an oversight. If payment has been sent in the last few days, please accept our thanks and ' +
          'disregard this letter.',
        { size: 10, mb: 10 }
      )
    );
  }

  // ── The schedule ───────────────────────────────────────────────────────────

  doc.add(h2('Invoices outstanding', TONE));

  const table = new Table(1.8, 1.4, 1.4, 1.3, 1.5);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = TONE;
  table.headerTextColor = Color.white;
  table.addHeader(
    th('Invoice'),
    th('Issued'),
    th('Due'),
    th('Days overdue', TextAlignment.Right),
    th('Amount', TextAlignment.Right)
  );
  for (const { item, days } of rows) {
    table.addRow(
      td(item.reference, { bold: true }),
      td(gbDate(item.issued), { color: MUTED }),
      td(gbDate(item.due), { color: MUTED }),
      td(String(days), { align: TextAlignment.Right, bold: true, color: days > 60 ? NEGATIVE : INK }),
      td(money(item.amount), { align: TextAlignment.Right, bold: true })
    );
  }
  doc.add(table);

  doc.add(
    totalsPanel([
      totalLine('Principal outstanding', money(principal)),
      totalLine(`Interest at ${(LETTER.interestRate * 100).toFixed(0)}% per annum`, money(interest)),
      totalLine(`Compensation, ${money(LETTER.compensationPerInvoice)} per invoice`, money(compensation)),
      divider(),
      totalLine('Total now claimed', money(totalClaimed), {
        bold: true,
        size: 12,
        color: TONE,
      }),
    ])
  );

  doc.add(
    cell(
      'Interest is calculated on each invoice from its due date to the date of this letter. Interest and ' +
        'compensation figures are illustrative of the basis on which they would be claimed; the amounts actually ' +
        'recoverable depend on the contract and the applicable law.',
      { size: 8.5, color: MUTED, mt: 6, mb: 10 }
    )
  );

  // ── What we are asking for ─────────────────────────────────────────────────

  // The debt is stated in full by this point. What follows is the response the
  // letter asks for, and it reads as one block or not at all — a page break
  // through the middle of it is how a payer misses the deadline.
  doc.addPage();
  doc.add(h2('What we are asking you to do', TONE));
  doc.add(
    panel(
      `Pay ${money(principal)} by ${gbDate(deadline)}`,
      [
        cell(
          `Payment by bank transfer to the account shown on your invoices, quoting ${LETTER.account}. If you pay ` +
            `the principal in full by ${gbDate(deadline)} we will not pursue the interest or compensation shown ` +
            'above.',
          { size: 9.5, mb: 3 }
        ),
        cell(
          'If any of these invoices is disputed, tell us which one and on what ground, and we will hold that item ' +
            'while we investigate. A dispute over one invoice does not hold the others.',
          { size: 9.5, mb: 3 }
        ),
        cell(
          'If you are unable to pay in full, contact us before the date above. We would rather agree a payment ' +
            'plan than escalate.',
          { size: 9.5, mb: 0 }
        ),
      ],
      TONE
    )
  );

  if (LETTER.stage === 3) {
    doc.add(h2('If we do not hear from you', TONE));
    doc.add(
      cell(
        `If payment is not received and you have not contacted us by ${gbDate(deadline)}, the account will be ` +
          'placed on stop, further orders will not be processed, and the debt will be referred for collection. ' +
          'Costs and interest may then be added.',
        { size: 10, mb: 10 }
      )
    );
    doc.add(
      cell('We would prefer to resolve this directly. A telephone call today is enough to stop the escalation.', {
        size: 10,
        mb: 12,
      })
    );
  }

  doc.add(cell('Yours faithfully', { size: 10, mb: 24 }));
  doc.add(cell(LETTER.creditControl, { size: 10, bold: true, mb: 2 }));
  doc.add(cell(LETTER.supplier, { size: 10, color: MUTED, mb: 2 }));
  doc.add(cell(`${LETTER.phone} · ${LETTER.contact}`, { size: 9, color: MUTED }));

  return doc;
}

// Local helpers and sample types used by this document.

type Stage = keyof typeof STAGES;

interface OverdueItem {
  reference: string;
  issued: Date;
  due: Date;
  amount: number;
}

function daysOverdue(item: OverdueItem, asAt: Date): number {
  return Math.max(0, Math.floor((asAt.getTime() - item.due.getTime()) / 86_400_000));
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
  box.backgroundColor = ColorPalette.blue[50];
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
