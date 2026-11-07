/**
 * Bill of Costs.
 * A legal bill of costs: time by phase and fee-earner grade, disbursements with their VAT treatment, and a summary calculated from the time entries.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Table,
  VerticalStack,
  pageTemplate,
  Spacer,
  TextBlock,
  Heading,
  Container,
  EnsureSpace,
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

const ACCENT = ColorPalette.rose[800];

const RULE = ColorPalette.slate[200];

const NEGATIVE = ColorPalette.rose[800];

// ── Bill of costs ────────────────────────────────────────────────────────────
//
// What a legal-costs or practice-management platform produces at the end of a
// matter: every unit of chargeable time, who did it and at what grade, the
// disbursements paid out, and the summary that tells a paying party what is
// being claimed and why.
//
// It is the long-table document of the legal sector. Hundreds of time entries
// flow across pages with a repeating header, grouped by phase, each group
// carrying its own subtotal — and the phase subtotals must add to the grand
// total or the bill is not one anybody will pay. Everything below is computed
// from the entries rather than written beside them, for exactly that reason.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample matter, parties, fee earners,
// and figures throughout. Nothing here is legal advice, a costs template, or a
// statement of any court's requirements.

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

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      headerTemplate: pageTemplate({
        firstPage: new Spacer({ height: 0 }),
        default: band(`${MATTER.matter} · ${MATTER.reference}`, MATTER.caseNumber),
      }),
      footerTemplate: pageTemplate({
        default: band(
          `Bill of costs served ${gbDate(MATTER.served)} by ${MATTER.firm}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Bill of costs ${MATTER.reference} — ${MATTER.matter}`,
      author: MATTER.firm,
      subject:
        'Bill of costs: chargeable time by phase and fee-earner grade, disbursements, VAT, and a summary that reconciles to the phase subtotals (sample data).',
      keywords: 'bill of costs, legal costs, time recording, disbursements, phases, vat, pdf/ua, pdf/a',
    },
  });

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
  const rates = new Table({
    columns: [1, 4.6, 1.4, 1.4],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  rates.addHeader(th('Grade'), th('Description'), th('Hourly rate', 'right'), th('Hours claimed', 'right'));
  for (const grade of Object.keys(GRADES) as Grade[]) {
    const hours = ENTRIES.filter(e => e.grade === grade).reduce((sum, e) => sum + entryHours(e), 0);
    rates.addRow(
      td(grade, { bold: true }),
      td(GRADES[grade].label),
      td(money(GRADES[grade].rate), { align: 'right' }),
      td(hours.toFixed(1), { align: 'right', bold: true })
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

    const schedule = new Table({
      columns: [1.1, 1.5, 0.6, 5, 0.85, 1.15, 1.25],
      cellPadding: 5,
      border: { width: 0.5, color: RULE },
      headerBackgroundColor: ACCENT,
      headerTextColor: '#ffffff',
    });
    schedule.addHeader(
      th('Date'),
      th('Fee earner'),
      th('Gr.'),
      th('Work done'),
      th('Units', 'right'),
      th('Hours', 'right'),
      th('Value', 'right')
    );

    for (const entry of phase.rows) {
      schedule.addRow(
        td(entry.date),
        td(entry.feeEarner, { color: MUTED }),
        td(entry.grade),
        td(entry.description),
        td(String(entry.units), { align: 'right' }),
        td(entryHours(entry).toFixed(1), { align: 'right' }),
        td(money(entryValue(entry)), { align: 'right' })
      );
    }

    schedule.addRow(
      td(''),
      td(''),
      td(''),
      td(`Subtotal — ${phase.phase}`, { bold: true }),
      td(''),
      td(phase.hours.toFixed(1), { align: 'right', bold: true }),
      td(money(phase.value), { align: 'right', bold: true, color: ACCENT })
    );

    // A phase is short enough to keep whole: heading, rows and subtotal share a page.
    doc.add(new VerticalStack({ breakAllowed: false, children: [heading, schedule] }));
  }

  // ── Disbursements ──────────────────────────────────────────────────────────

  doc.add(h2('Disbursements'));

  const disbursements = new Table({
    columns: [1.2, 5.4, 1.2, 1.3],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  disbursements.addHeader(th('Date'), th('Description'), th('VAT'), th('Amount', 'right'));
  for (const item of DISBURSEMENTS) {
    disbursements.addRow(
      td(item.date),
      td(item.description),
      td(item.vatable ? 'Standard rate' : 'Outside the scope', { color: MUTED }),
      td(money(item.amount), { align: 'right', bold: true })
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

function h3(text: string): Heading {
  return new Heading(text, {
    level: 3,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 10.5,
    color: HEADING,
    margin: { top: 10, bottom: 5 },
  });
}

/**
 * Keeps a heading with the start of whatever it introduces: the heading moves to the next page
 * unless `minHeight` points of room remain below it.
 */
function keepWithNext(heading: Heading, minHeight = 120): EnsureSpace {
  return new EnsureSpace({ minHeight, child: heading });
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
      backgroundColor: ColorPalette.rose[50],
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
