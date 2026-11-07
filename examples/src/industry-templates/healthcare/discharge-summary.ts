/**
 * Hospital Discharge Summary.
 * A hospital discharge summary: diagnoses, key investigations with reference ranges, a medication reconciliation flagging every change, and actions for the GP.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Table,
  type ColorInput,
  pageTemplate,
  Spacer,
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

const ACCENT = ColorPalette.teal[700];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Hospital discharge summary ───────────────────────────────────────────────
//
// The document healthcare software is actually built around, and the one the
// existing healthcare exampless were missing: the summary that goes to the
// patient's GP when they leave hospital. Every section of it is read by someone
// in a hurry, so the ordering is fixed by convention rather than by design
// preference — diagnosis, then what was done, then medication changes, then what
// the GP must do next.
//
// It is also where the accessibility argument is easiest to make concretely.
// A medication table read out of order by a screen reader is a clinical risk,
// not a usability complaint: the dose has to stay with the drug it belongs to,
// and a change of dose has to be announced as a change. That is what the tagged
// structure here is for.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Every patient, clinician, identifier,
// and clinical value is a sample. Nothing here is clinical guidance.

const EPISODE = {
  reference: 'DS-2026-44127',
  patient: 'Sample Patient',
  patientId: 'ID 000 000 0000 (sample)',
  dateOfBirth: '14 Mar 1958',
  address: 'Sample Address, Sample Town, ST2 6PL',
  admitted: new Date(Date.UTC(2026, 8, 3)),
  discharged: new Date(Date.UTC(2026, 8, 9)),
  ward: 'Sample Ward 6 — Cardiology',
  consultant: 'Dr S. Sample — Consultant Cardiologist',
  preparedBy: 'Dr A. Sample — Registrar',
  gpPractice: 'Sample Medical Practice, Sample Town',
  method: 'Emergency admission via the emergency department',
  destination: 'Discharged home, independent',
};

const DIAGNOSES = {
  primary: 'Non-ST-elevation myocardial infarction',
  secondary: ['Type 2 diabetes mellitus, diet controlled', 'Essential hypertension', 'Stage 2 chronic kidney disease'],
};

const MEDICATIONS: Medication[] = [
  {
    drug: 'Aspirin',
    dose: '75 mg',
    route: 'Oral',
    frequency: 'Once daily',
    change: 'New',
    note: 'Started on admission; continue indefinitely',
  },
  {
    drug: 'Ticagrelor',
    dose: '90 mg',
    route: 'Oral',
    frequency: 'Twice daily',
    change: 'New',
    note: 'Continue for 12 months, then review',
  },
  {
    drug: 'Atorvastatin',
    dose: '80 mg',
    route: 'Oral',
    frequency: 'Once daily at night',
    change: 'Dose changed',
    note: 'Increased from 20 mg; repeat lipids at 3 months',
  },
  {
    drug: 'Bisoprolol',
    dose: '2.5 mg',
    route: 'Oral',
    frequency: 'Once daily',
    change: 'New',
    note: 'Titrate to heart rate and blood pressure in primary care',
  },
  {
    drug: 'Ramipril',
    dose: '2.5 mg',
    route: 'Oral',
    frequency: 'Once daily',
    change: 'New',
    note: 'Check renal function and potassium in 1–2 weeks',
  },
  {
    drug: 'Metformin',
    dose: '1 g',
    route: 'Oral',
    frequency: 'Twice daily',
    change: 'Unchanged',
    note: 'Continue at the pre-admission dose',
  },
  {
    drug: 'Ibuprofen',
    dose: '400 mg',
    route: 'Oral',
    frequency: 'As required',
    change: 'Stopped',
    note: 'Stopped — avoid NSAIDs with the new antiplatelet regimen',
  },
];

const CHANGE_COLOUR: Record<MedChange, ColorInput> = {
  Unchanged: MUTED,
  New: POSITIVE,
  'Dose changed': ACCENT,
  Stopped: NEGATIVE,
};

const INVESTIGATIONS = [
  { test: 'High-sensitivity troponin T', result: '148 ng/L, peak 412 ng/L', reference: '< 14 ng/L', flag: 'Raised' },
  { test: 'ECG on admission', result: 'Sinus rhythm, lateral T-wave inversion', reference: '—', flag: 'Abnormal' },
  {
    test: 'Echocardiogram',
    result: 'LV ejection fraction 48%, mild hypokinesia',
    reference: '> 55%',
    flag: 'Abnormal',
  },
  { test: 'eGFR', result: '68 mL/min/1.73m²', reference: '> 90', flag: 'Low' },
  { test: 'HbA1c', result: '52 mmol/mol', reference: '< 48', flag: 'Raised' },
  { test: 'Haemoglobin', result: '134 g/L', reference: '130–180', flag: 'Normal' },
];

const GP_ACTIONS = [
  'Check urea, electrolytes and creatinine 1–2 weeks after discharge, following the ramipril start.',
  'Titrate bisoprolol and ramipril to target as tolerated, reviewing blood pressure and heart rate at each step.',
  'Repeat the lipid profile at three months and review the atorvastatin dose against target.',
  'Review diabetes control in light of the raised HbA1c, and refer to the practice diabetes clinic.',
  'Ensure the patient is added to the cardiac rehabilitation pathway if they have not been contacted within two weeks.',
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      headerTemplate: pageTemplate({
        firstPage: new Spacer({ height: 0 }),
        default: band(`Discharge summary ${EPISODE.reference}`, `${EPISODE.patient} · ${EPISODE.patientId}`),
      }),
      footerTemplate: pageTemplate({
        default: band(
          'Confidential patient information',
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Discharge summary ${EPISODE.reference} — ${EPISODE.patient}`,
      author: 'Sample Hospital Trust',
      subject:
        'Hospital discharge summary: diagnoses, admission narrative, investigations, medication changes on discharge, and actions for the general practitioner (sample data).',
      keywords: 'discharge summary, hospital, medication reconciliation, primary care, handover, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(
    cell('DISCHARGE SUMMARY · FOR THE ATTENTION OF THE GENERAL PRACTITIONER', {
      bold: true,
      size: 8.5,
      color: ACCENT,
      mb: 4,
    })
  );
  doc.add(h1('Inpatient discharge summary'));
  doc.add(cell(`${EPISODE.ward} · ${EPISODE.consultant}`, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Patient', EPISODE.patient),
        field('Identifier', EPISODE.patientId),
        field('Date of birth', EPISODE.dateOfBirth),
        field('Summary reference', EPISODE.reference),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow(
      [
        field('Admitted', gbDate(EPISODE.admitted)),
        field('Discharged', gbDate(EPISODE.discharged)),
        field('Admission method', EPISODE.method),
        field('Discharge destination', EPISODE.destination),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow([
      field('Registered practice', EPISODE.gpPractice),
      field('Responsible consultant', EPISODE.consultant),
      field('Summary prepared by', EPISODE.preparedBy),
      field('Patient address', EPISODE.address),
    ])
  );

  // ── Diagnoses ──────────────────────────────────────────────────────────────

  doc.add(h2('Diagnoses'));
  doc.add(panel('Primary diagnosis this admission', [cell(DIAGNOSES.primary, { size: 11, bold: true, mb: 0 })]));
  doc.add(cell('Other active problems', { bold: true, size: 9.5, mb: 4 }));
  for (const diagnosis of DIAGNOSES.secondary) {
    doc.add(cell(`· ${diagnosis}`, { size: 9.5, mb: 2 }));
  }

  // ── Narrative ──────────────────────────────────────────────────────────────

  doc.add(h2('Summary of admission'));
  doc.add(
    cell(
      'The patient presented to the emergency department with two hours of central chest discomfort radiating to ' +
        'the left arm, with associated sweating. Troponin was raised on serial sampling and the ECG showed lateral ' +
        'T-wave inversion, in keeping with a non-ST-elevation myocardial infarction.',
      { size: 9.5, mb: 6 }
    )
  );
  doc.add(
    cell(
      'Dual antiplatelet therapy and treatment-dose anticoagulation were started on admission. Coronary angiography ' +
        'on day two demonstrated significant disease in the circumflex territory, treated with a single drug-eluting ' +
        'stent. Recovery was uncomplicated. The patient mobilised independently, remained in sinus rhythm on ' +
        'telemetry, and was reviewed by the cardiac rehabilitation team before discharge.',
      { size: 9.5, mb: 6 }
    )
  );
  doc.add(
    cell(
      'Secondary prevention was started before discharge and is set out below. The patient and their family have ' +
        'been counselled on the diagnosis, on the importance of not missing antiplatelet doses, and on when to seek ' +
        'urgent help.',
      { size: 9.5, mb: 4 }
    )
  );

  // ── Investigations ─────────────────────────────────────────────────────────

  doc.add(h2('Key investigations'));

  const investigations = new Table({
    columns: [2.4, 3.4, 1.7, 1.1],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  investigations.addHeader(th('Investigation'), th('Result'), th('Reference range'), th('Flag'));
  for (const row of INVESTIGATIONS) {
    investigations.addRow(
      td(row.test),
      td(row.result),
      td(row.reference, { color: MUTED }),
      td(row.flag, { bold: row.flag !== 'Normal', color: row.flag === 'Normal' ? POSITIVE : NEGATIVE })
    );
  }
  doc.add(investigations);

  // ── Medication ─────────────────────────────────────────────────────────────

  doc.add(h2('Medication on discharge'));
  doc.add(
    cell(
      'This list replaces the pre-admission list in full. Every change from the pre-admission regimen is marked, ' +
        'with the reason and the follow-up it requires.',
      { size: 9, color: MUTED, mb: 8 }
    )
  );

  const meds = new Table({
    columns: [1.7, 0.9, 0.8, 1.6, 1.2, 3.5],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  meds.addHeader(th('Medicine'), th('Dose'), th('Route'), th('Frequency'), th('Change'), th('Note'));
  for (const med of MEDICATIONS) {
    meds.addRow(
      td(med.drug, { bold: true }),
      td(med.dose),
      td(med.route, { color: MUTED }),
      td(med.frequency),
      td(med.change, { bold: med.change !== 'Unchanged', color: CHANGE_COLOUR[med.change] }),
      td(med.note, { color: MUTED })
    );
  }
  doc.add(meds);

  doc.add(
    panel(
      'Allergies and cautions',
      [
        cell('No known drug allergies recorded.', { size: 9, mb: 3 }),
        cell(
          'Avoid non-steroidal anti-inflammatory drugs while on dual antiplatelet therapy. The patient has been told ' +
            'this and the ibuprofen previously taken as required has been stopped.',
          { size: 9, mb: 0 }
        ),
      ],
      { accent: NEGATIVE }
    )
  );

  // ── Actions for the GP ─────────────────────────────────────────────────────

  doc.add(h2('Actions for the general practitioner'));
  for (const [index, action] of GP_ACTIONS.entries()) {
    doc.add(cell(`${index + 1}. ${action}`, { size: 9.5, mb: 4 }));
  }

  doc.add(h2('Follow-up arranged'));
  doc.add(
    cell(
      'Cardiology outpatient review in six weeks — appointment to be sent to the patient by post. Cardiac ' +
        'rehabilitation will contact the patient directly within two weeks. No further hospital investigations are ' +
        'outstanding.',
      { size: 9.5, mb: 6 }
    )
  );

  doc.add(
    panel('Advice given to the patient', [
      cell(
        'Seek urgent medical help by calling the emergency services if chest pain returns at rest, lasts more than ' +
          'fifteen minutes, or is accompanied by breathlessness, sweating, or faintness. Do not stop the ' +
          'antiplatelet medicines without discussing it with a clinician, including before any dental or surgical ' +
          'procedure.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  doc.add(
    cell(
      `Prepared by ${EPISODE.preparedBy} on ${gbDate(EPISODE.discharged)} on behalf of ${EPISODE.consultant}. ` +
        `Queries about this summary: quote ${EPISODE.reference}.`,
      { size: 8.5, color: MUTED, mt: 10, mb: 0 }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

type MedChange = 'Unchanged' | 'New' | 'Dose changed' | 'Stopped';

interface Medication {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  change: MedChange;
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
