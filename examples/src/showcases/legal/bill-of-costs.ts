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

import { Document, TextElementBase, Table } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  NEGATIVE,
  accentBar,
  band,
  cell,
  divider,
  field,
  gbDate,
  h1,
  h2,
  h3,
  money,
  panel,
  td,
  th,
  tile,
  totalLine,
  totalsPanel,
  weightedRow,
} from '../invoices/_trade-kit';

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

interface Disbursement {
  date: string;
  description: string;
  amount: number;
  vatable: boolean;
}

const DISBURSEMENTS: Disbursement[] = [
  { date: '04 Mar 2026', description: 'Court issue fee', amount: 455.0, vatable: false },
  { date: '11 Jun 2026', description: 'Court fee — case management conference', amount: 275.0, vatable: false },
  { date: '18 Jul 2026', description: 'Document hosting and processing', amount: 340.0, vatable: true },
  { date: '20 Aug 2026', description: 'Counsel’s fee — advice on quantum', amount: 1250.0, vatable: true },
  { date: '26 Aug 2026', description: 'Copying and bundle production', amount: 186.4, vatable: true },
];

/** Units are six minutes; time is claimed in hours at the grade's hourly rate. */
const MINUTES_PER_UNIT = 6;

function entryHours(entry: TimeEntry): number {
  return (entry.units * MINUTES_PER_UNIT) / 60;
}

function entryValue(entry: TimeEntry): number {
  return entryHours(entry) * GRADES[entry.grade].rate;
}

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
      headerTemplate: (pageNumber: number) =>
        pageNumber === 1 ? undefined : band(`${MATTER.matter} · ${MATTER.reference}`, MATTER.caseNumber),
      footerTemplate: (pageNumber: number) =>
        band(
          `Bill of costs served ${gbDate(MATTER.served)} by ${MATTER.firm}`,
          `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
        ),
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

  doc.add(h2('Schedule of work'));
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
    doc.add(h3(`${phase.phase} — ${phase.hours.toFixed(1)} hours, ${money(phase.value)}`));

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

    doc.add(schedule);
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

  doc.add(h2('Summary of costs claimed'));

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
