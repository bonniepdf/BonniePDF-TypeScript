/**
 * Discharge Summary (Class API).
 * The same discharge summary as Discharge summary, built with the class API: construct each element and assign its properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PdfAConformance,
  TextStyle,
  TextElementBase,
  Table,
  Color,
  Border,
  BorderColors,
  pageTemplate,
  Spacer,
  type IElement,
  TextBlock,
  TextAlignment,
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

// ── Hospital discharge summary (class API) ───────────────────────────────────
//
// The summary that goes to the patient's GP when they leave hospital: diagnosis,
// then what was done, then medication changes, then what the GP must do next.
//
// The **class / construct-then-mutate** companion to `discharge-summary.ts`.
// Same summary, authored the long way: `new` each element and assign its
// properties one at a time, with the enum members rather than their string
// literals. It renders **byte-for-byte identically** to the options-object form
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

const EPISODE = {
  reference: 'DS-2026-44127',
  patient: 'Sample Patient',
  patientId: 'NHS 000 000 0000 (sample)',
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

const CHANGE_COLOUR: Record<MedChange, Color> = {
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
  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.headerTemplate = pageTemplate({
    firstPage: new Spacer({ height: 0 }),
    default: band(`Discharge summary ${EPISODE.reference}`, `${EPISODE.patient} · ${EPISODE.patientId}`),
  });
  settings.footerTemplate = pageTemplate({
    default: band(
      'Confidential patient information',
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `Discharge summary ${EPISODE.reference} — ${EPISODE.patient}`;
  metadata.author = 'Sample Hospital Trust';
  metadata.subject =
    'Hospital discharge summary: diagnoses, admission narrative, investigations, medication changes on discharge, and actions for the general practitioner (sample data).';
  metadata.keywords = 'discharge summary, hospital, medication reconciliation, primary care, handover, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

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

  const investigations = new Table(2.4, 3.4, 1.7, 1.1);
  investigations.cellPadding = 6;
  investigations.border = new Border(0.5);
  investigations.borderColors = new BorderColors(RULE);
  investigations.headerBackgroundColor = ACCENT;
  investigations.headerTextColor = Color.white;
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

  const meds = new Table(1.7, 0.9, 0.8, 1.6, 1.2, 3.5);
  meds.cellPadding = 6;
  meds.border = new Border(0.5);
  meds.borderColors = new BorderColors(RULE);
  meds.headerBackgroundColor = ACCENT;
  meds.headerTextColor = Color.white;
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
      NEGATIVE
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

/** The full-width accent rule at the top of each document. */

function accentBar(color: Color = ACCENT, height = 4): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
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

function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: TextAlignment.Right }), 2);
  return row;
}
