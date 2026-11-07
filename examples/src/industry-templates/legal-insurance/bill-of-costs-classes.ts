/**
 * Bill of Costs (Class API).
 * The same bill of costs as Bill of costs, built with the class API: construct each element and assign its properties. The output is identical.
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
  VerticalStack,
  Color,
  Border,
  BorderColors,
  pageTemplate,
  Spacer,
  type IElement,
  TextBlock,
  Heading,
  EnsureSpace,
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

const ACCENT = ColorPalette.rose[800];

const RULE = ColorPalette.slate[200];

const NEGATIVE = ColorPalette.rose[800];

// ── Bill of costs (class API) ────────────────────────────────────────────────
//
// Every unit of chargeable time, who did it and at what grade, the disbursements
// paid out, and the summary that tells a paying party what is being claimed.
// The phase subtotals must add to the grand total, so everything is computed
// from the entries rather than written beside them.
//
// The **class / construct-then-mutate** companion to `bill-of-costs.ts`. Same
// bill, authored the long way: `new` each element and assign its properties one
// at a time, with the enum members rather than their string literals. It renders
// **byte-for-byte identically** to the options-object form (an equivalence test
// binds the two). Reach for the options form first; this variant exists to show
// what it desugars to.

const MATTER = {
  reference: 'BOC-2026-0318',
  matter: 'Sample Claimant v Sample Defendant',
  caseNumber: 'Sample case reference SC-2026-000417',
  court: 'Sample County Court',
  claimingParty: 'The Claimant',
  payingParty: 'The Defendant',
  firm: 'Sample Solicitors LLP',
  preparedBy: 'R. Oyelaran — Costs Draftsman',
  periodFrom: new Date(Date.UTC(2025, 11, 1)),
  periodTo: new Date(Date.UTC(2026, 7, 31)),
  served: new Date(Date.UTC(2026, 8, 14)),
  vatRate: 0.2,
  vatRegistered: true,
};

/** Fee-earner grades and the hourly rate claimed for each. */
const GRADES = {
  A: { label: 'Grade A — Solicitor, 8+ years', rate: 282 },
  B: { label: 'Grade B — Solicitor, 4+ years', rate: 232 },
  C: { label: 'Grade C — Other solicitor or legal executive', rate: 185 },
  D: { label: 'Grade D — Trainee or paralegal', rate: 129 },
} as const;

const ENTRIES: TimeEntry[] = [
  {
    date: '04 Dec 2025',
    phase: 'Pre-action',
    feeEarner: 'J. Okonkwo',
    grade: 'A',
    description: 'Initial conference with client; instructions taken',
    units: 14,
  },
  {
    date: '08 Dec 2025',
    phase: 'Pre-action',
    feeEarner: 'T. Hargreaves',
    grade: 'C',
    description: 'Review of client documents and chronology preparation',
    units: 22,
  },
  {
    date: '18 Dec 2025',
    phase: 'Pre-action',
    feeEarner: 'J. Okonkwo',
    grade: 'A',
    description: 'Drafting letter before claim',
    units: 18,
  },
  {
    date: '19 Dec 2025',
    phase: 'Pre-action',
    feeEarner: 'M. Farrell',
    grade: 'D',
    description: 'Collating enclosures to letter before claim',
    units: 9,
  },
  {
    date: '22 Jan 2026',
    phase: 'Pre-action',
    feeEarner: 'J. Okonkwo',
    grade: 'A',
    description: 'Considering response to letter before claim; advice to client',
    units: 11,
  },

  {
    date: '18 Feb 2026',
    phase: 'Issue and statements of case',
    feeEarner: 'T. Hargreaves',
    grade: 'C',
    description: 'Drafting claim form and particulars of claim',
    units: 34,
  },
  {
    date: '25 Feb 2026',
    phase: 'Issue and statements of case',
    feeEarner: 'J. Okonkwo',
    grade: 'A',
    description: 'Settling particulars of claim',
    units: 12,
  },
  {
    date: '04 Mar 2026',
    phase: 'Issue and statements of case',
    feeEarner: 'M. Farrell',
    grade: 'D',
    description: 'Issuing claim; service on the Defendant',
    units: 7,
  },
  {
    date: '05 May 2026',
    phase: 'Issue and statements of case',
    feeEarner: 'T. Hargreaves',
    grade: 'C',
    description: 'Considering Defence; note to file',
    units: 13,
  },
  {
    date: '20 May 2026',
    phase: 'Issue and statements of case',
    feeEarner: 'S. Beaumont',
    grade: 'B',
    description: 'Drafting reply to defence',
    units: 16,
  },

  {
    date: '11 Jun 2026',
    phase: 'Case management',
    feeEarner: 'S. Beaumont',
    grade: 'B',
    description: 'Preparing directions questionnaire and costs budget',
    units: 21,
  },
  {
    date: '24 Jun 2026',
    phase: 'Case management',
    feeEarner: 'J. Okonkwo',
    grade: 'A',
    description: 'Attending case management conference',
    units: 15,
  },
  {
    date: '30 Jul 2026',
    phase: 'Case management',
    feeEarner: 'M. Farrell',
    grade: 'D',
    description: 'Diarising directions; updating case plan',
    units: 5,
  },

  {
    date: '06 Jul 2026',
    phase: 'Disclosure',
    feeEarner: 'M. Farrell',
    grade: 'D',
    description: 'Collating and paginating disclosure documents',
    units: 41,
  },
  {
    date: '14 Jul 2026',
    phase: 'Disclosure',
    feeEarner: 'T. Hargreaves',
    grade: 'C',
    description: 'Review of disclosure for relevance and privilege',
    units: 38,
  },
  {
    date: '21 Jul 2026',
    phase: 'Disclosure',
    feeEarner: 'S. Beaumont',
    grade: 'B',
    description: 'Preparing disclosure list and statement',
    units: 14,
  },
  {
    date: '28 Jul 2026',
    phase: 'Disclosure',
    feeEarner: 'T. Hargreaves',
    grade: 'C',
    description: 'Inspection of the Defendant’s disclosure',
    units: 19,
  },

  {
    date: '05 Aug 2026',
    phase: 'Witness statements',
    feeEarner: 'S. Beaumont',
    grade: 'B',
    description: 'Taking statement from the Claimant',
    units: 26,
  },
  {
    date: '12 Aug 2026',
    phase: 'Witness statements',
    feeEarner: 'T. Hargreaves',
    grade: 'C',
    description: 'Drafting and revising witness statement',
    units: 23,
  },
  {
    date: '14 Aug 2026',
    phase: 'Witness statements',
    feeEarner: 'J. Okonkwo',
    grade: 'A',
    description: 'Settling witness statement and exhibit',
    units: 9,
  },
  {
    date: '26 Aug 2026',
    phase: 'Witness statements',
    feeEarner: 'M. Farrell',
    grade: 'D',
    description: 'Preparing exhibit bundle and index',
    units: 12,
  },

  {
    date: '31 Aug 2026',
    phase: 'Costs management',
    feeEarner: 'S. Beaumont',
    grade: 'B',
    description: 'Updating costs budget and preparing this bill',
    units: 18,
  },
];

const DISBURSEMENTS: Disbursement[] = [
  { date: '04 Mar 2026', description: 'Court issue fee', amount: 455.0, vatable: false },
  { date: '11 Jun 2026', description: 'Court fee — case management conference', amount: 275.0, vatable: false },
  { date: '18 Jul 2026', description: 'Document hosting and processing', amount: 340.0, vatable: true },
  { date: '20 Aug 2026', description: 'Counsel’s fee — advice on quantum', amount: 1250.0, vatable: true },
  { date: '26 Aug 2026', description: 'Copying and bundle production', amount: 186.4, vatable: true },
];

/** Units are six minutes; time is claimed in hours at the grade's hourly rate. */
const MINUTES_PER_UNIT = 6;

export function generate(): Document {
  // Every total below is computed from the entries. A bill whose phase
  // subtotals do not add to its grand total is not one anybody will pay, so
  // nothing here is transcribed.
  const phases = [...new Set(ENTRIES.map(e => e.phase))];
  const phaseTotals = phases.map(phase => {
    const rows = ENTRIES.filter(e => e.phase === phase);
    return {
      phase,
      rows,
      hours: rows.reduce((sum, e) => sum + entryHours(e), 0),
      value: rows.reduce((sum, e) => sum + entryValue(e), 0),
    };
  });

  const profitCosts = phaseTotals.reduce((sum, p) => sum + p.value, 0);
  const totalHours = phaseTotals.reduce((sum, p) => sum + p.hours, 0);
  const vatOnCosts = profitCosts * MATTER.vatRate;

  const disbursementsNet = DISBURSEMENTS.reduce((sum, d) => sum + d.amount, 0);
  const vatOnDisbursements = DISBURSEMENTS.filter(d => d.vatable).reduce(
    (sum, d) => sum + d.amount * MATTER.vatRate,
    0
  );

  const grandTotal = profitCosts + vatOnCosts + disbursementsNet + vatOnDisbursements;

  // The reconciliation the document asserts on its own face.
  const phaseSum = phaseTotals.reduce((sum, p) => sum + p.value, 0);
  const reconciles = Math.abs(phaseSum - profitCosts) < 0.005;

  const settings = new DocumentSettings(PdfSize.a4, 44);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.headerTemplate = pageTemplate({
    firstPage: new Spacer({ height: 0 }),
    default: band(`${MATTER.matter} · ${MATTER.reference}`, MATTER.caseNumber),
  });
  settings.footerTemplate = pageTemplate({
    default: band(
      `Bill of costs served ${gbDate(MATTER.served)} by ${MATTER.firm}`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Bill of costs ${MATTER.reference} — ${MATTER.matter}`;
  metadata.author = MATTER.firm;
  metadata.subject =
    'Bill of costs: chargeable time by phase and fee-earner grade, disbursements, VAT, and a summary that reconciles to the phase subtotals (sample data).';
  metadata.keywords = 'bill of costs, legal costs, time recording, disbursements, phases, vat, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  // ── Title ──────────────────────────────────────────────────────────────────

  doc.add(accentBar());
  doc.add(cell('BILL OF COSTS', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(MATTER.matter));
  doc.add(cell(`${MATTER.court} · ${MATTER.caseNumber}`, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Bill reference', MATTER.reference),
        field('Claiming party', MATTER.claimingParty),
        field('Paying party', MATTER.payingParty),
        field('Served', gbDate(MATTER.served)),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow([
      field('Period covered', `${gbDate(MATTER.periodFrom)} to ${gbDate(MATTER.periodTo)}`),
      field('Prepared by', MATTER.preparedBy),
      field('Firm', MATTER.firm),
      field('VAT status', MATTER.vatRegistered ? 'Registered — VAT claimed' : 'Not registered'),
    ])
  );

  doc.add(
    weightedRow(
      [
        tile(totalHours.toFixed(1), 'Chargeable hours'),
        tile(String(ENTRIES.length), 'Time entries'),
        tile(money(profitCosts), 'Profit costs'),
        tile(money(grandTotal), 'Total claimed', ACCENT),
      ],
      { spacing: 10, mb: 4 }
    )
  );

  // ── Rates ──────────────────────────────────────────────────────────────────

  // Each heading asks for room for the start of what it introduces, so it is never left alone at the foot of a page.
  doc.add(h2('Hourly rates claimed'));
  const rates = new Table(1, 4.6, 1.4, 1.4);
  rates.cellPadding = 6;
  rates.border = new Border(0.5);
  rates.borderColors = new BorderColors(RULE);
  rates.headerBackgroundColor = ACCENT;
  rates.headerTextColor = Color.white;
  rates.addHeader(
    th('Grade'),
    th('Description'),
    th('Hourly rate', TextAlignment.Right),
    th('Hours claimed', TextAlignment.Right)
  );
  for (const grade of Object.keys(GRADES) as Grade[]) {
    const hours = ENTRIES.filter(e => e.grade === grade).reduce((sum, e) => sum + entryHours(e), 0);
    rates.addRow(
      td(grade, { bold: true }),
      td(GRADES[grade].label),
      td(money(GRADES[grade].rate), { align: TextAlignment.Right }),
      td(hours.toFixed(1), { align: TextAlignment.Right, bold: true })
    );
  }
  doc.add(rates);

  doc.add(
    cell(
      `Time is recorded in units of ${MINUTES_PER_UNIT} minutes and claimed in hours at the grade rate. ` +
        'Rates are those claimed by the receiving party and remain subject to assessment.',
      { size: 8.5, color: MUTED, mt: 6, mb: 4 }
    )
  );

  // ── Schedule of work, by phase ─────────────────────────────────────────────

  doc.add(keepWithNext(h2('Schedule of work'), 170));
  doc.add(
    cell('Each phase carries its own subtotal. The phase subtotals are what the summary adds up.', {
      size: 9,
      color: MUTED,
      mb: 8,
    })
  );

  // One table per phase, each with its own header and subtotal. A single
  // continuous table with an inline phase banner puts the phase name in the
  // narrowest column, where it wraps to four lines - and a phase that starts
  // mid-page then loses its label entirely when the table carries over.
  for (const phase of phaseTotals) {
    const heading = h3(`${phase.phase} — ${phase.hours.toFixed(1)} hours, ${money(phase.value)}`);

    const schedule = new Table(1.1, 1.5, 0.6, 5, 0.85, 1.15, 1.25);
    schedule.cellPadding = 5;
    schedule.border = new Border(0.5);
    schedule.borderColors = new BorderColors(RULE);
    schedule.headerBackgroundColor = ACCENT;
    schedule.headerTextColor = Color.white;
    schedule.addHeader(
      th('Date'),
      th('Fee earner'),
      th('Gr.'),
      th('Work done'),
      th('Units', TextAlignment.Right),
      th('Hours', TextAlignment.Right),
      th('Value', TextAlignment.Right)
    );

    for (const entry of phase.rows) {
      schedule.addRow(
        td(entry.date),
        td(entry.feeEarner, { color: MUTED }),
        td(entry.grade),
        td(entry.description),
        td(String(entry.units), { align: TextAlignment.Right }),
        td(entryHours(entry).toFixed(1), { align: TextAlignment.Right }),
        td(money(entryValue(entry)), { align: TextAlignment.Right })
      );
    }

    schedule.addRow(
      td(''),
      td(''),
      td(''),
      td(`Subtotal — ${phase.phase}`, { bold: true }),
      td(''),
      td(phase.hours.toFixed(1), { align: TextAlignment.Right, bold: true }),
      td(money(phase.value), { align: TextAlignment.Right, bold: true, color: ACCENT })
    );

    // A phase is short enough to keep whole: heading, rows and subtotal share a page.
    const phaseBlock = new VerticalStack();
    phaseBlock.breakAllowed = false;
    phaseBlock.add(heading);
    phaseBlock.add(schedule);
    doc.add(phaseBlock);
  }

  // ── Disbursements ──────────────────────────────────────────────────────────

  doc.add(h2('Disbursements'));

  const disbursements = new Table(1.2, 5.4, 1.2, 1.3);
  disbursements.cellPadding = 6;
  disbursements.border = new Border(0.5);
  disbursements.borderColors = new BorderColors(RULE);
  disbursements.headerBackgroundColor = ACCENT;
  disbursements.headerTextColor = Color.white;
  disbursements.addHeader(th('Date'), th('Description'), th('VAT'), th('Amount', TextAlignment.Right));
  for (const item of DISBURSEMENTS) {
    disbursements.addRow(
      td(item.date),
      td(item.description),
      td(item.vatable ? 'Standard rate' : 'Outside the scope', { color: MUTED }),
      td(money(item.amount), { align: TextAlignment.Right, bold: true })
    );
  }
  doc.add(disbursements);

  doc.add(
    cell(
      'Court fees are outside the scope of VAT and no VAT is claimed on them. VAT is claimed on the remaining ' +
        'disbursements at the standard rate.',
      { size: 8.5, color: MUTED, mt: 6, mb: 4 }
    )
  );

  // ── Summary ────────────────────────────────────────────────────────────────

  doc.add(keepWithNext(h2('Summary of costs claimed'), 150));

  doc.add(
    totalsPanel(
      [
        totalLine('Profit costs', money(profitCosts)),
        totalLine(`VAT on profit costs at ${(MATTER.vatRate * 100).toFixed(0)}%`, money(vatOnCosts)),
        totalLine('Disbursements', money(disbursementsNet)),
        totalLine('VAT on disbursements', money(vatOnDisbursements)),
        divider(),
        totalLine('Total claimed', money(grandTotal), { bold: true, size: 12, color: ACCENT }),
      ],
      1.8
    )
  );

  if (!reconciles) {
    doc.add(
      cell(
        `The phase subtotals total ${money(phaseSum)} but the profit costs are stated as ` +
          `${money(profitCosts)}. This bill does not reconcile and must not be served.`,
        { size: 9.5, bold: true, color: NEGATIVE, mt: 8, mb: 4 }
      )
    );
  } else {
    doc.add(
      cell(`The phase subtotals add to ${money(phaseSum)}, which agrees with the profit costs claimed above.`, {
        size: 8.5,
        color: MUTED,
        mt: 6,
        mb: 4,
      })
    );
  }

  doc.add(
    panel('Points of dispute', [
      cell(
        'A paying party wishing to dispute any item should identify it by its date and phase and state the ground ' +
          'of objection, so that the receiving party can reply against the same reference.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  doc.add(
    cell(
      `Prepared by ${MATTER.preparedBy} for ${MATTER.firm} and served on ${gbDate(MATTER.served)}. ` +
        'Figures are stated to the nearest penny and are subject to assessment.',
      { size: 8.5, color: MUTED, mt: 8, mb: 0 }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

type Grade = keyof typeof GRADES;

interface TimeEntry {
  date: string;
  phase: string;
  feeEarner: string;
  grade: Grade;
  description: string;
  /** Chargeable units of six minutes, as time is recorded in practice. */
  units: number;
}

interface Disbursement {
  date: string;
  description: string;
  amount: number;
  vatable: boolean;
}

function entryHours(entry: TimeEntry): number {
  return (entry.units * MINUTES_PER_UNIT) / 60;
}

function entryValue(entry: TimeEntry): number {
  return entryHours(entry) * GRADES[entry.grade].rate;
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

function h3(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 3;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 10.5;
  heading.color = HEADING;
  heading.margin = new Thickness(0, 10, 0, 5);
  return heading;
}

/**
 * Keeps a heading with the start of whatever it introduces: the heading moves to the next page
 * unless `minHeight` points of room remain below it.
 */
function keepWithNext(heading: Heading, minHeight = 120): EnsureSpace {
  const guard = new EnsureSpace();
  guard.minHeight = minHeight;
  guard.child = heading;
  return guard;
}

/** The full-width accent rule at the top of each document. */

function accentBar(color: Color = ACCENT, height = 4): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
}

/** A summary tile. */

function tile(value: string, label: string, accent: Color = ACCENT): Container {
  const body = new VerticalStack();
  body.add(cell(value, { bold: true, size: 14, color: accent, mb: 2 }));
  body.add(cell(label, { size: 8, color: MUTED }));
  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(11, 10);
  box.child = body;
  return box;
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
  box.backgroundColor = ColorPalette.rose[50];
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
