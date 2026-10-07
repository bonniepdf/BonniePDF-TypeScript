/**
 * Pathology Lab Report.
 * A fictional pathology report: patient details, specimen times, FBC and U&E panels with reference ranges and High/Low flags, generated client-side so data never leaves the browser.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── UK / EU laboratory (pathology) report ────────────────────────────────────
//
// Portfolio #3, in a fictional UK / EU clinical laboratory idiom. A pathology laboratory report: patient
// demographics, specimen chain-of-custody timestamps, grouped result panels
// (Full Blood Count, Urea & Electrolytes) with units, reference ranges, and
// High/Low flags, an interpretive comment, and an authorising clinician. This is
// a privacy-sensitive, client-side-generated document (Rule of engagement #7:
// healthcare/privacy examples default to TypeScript).
//
// Archival + accessible: PDF/A-2a + PDF/UA-1, en-GB. Entirely fictional; not
// medical data and not medical advice. Authored through the options-object
// front door.

import {
  Document,
  TextBlock,
  TextElementBase,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
  pageTemplate,
} from '@bonniepdf/core';

const CLINICAL_BLUE = '#2563eb';
const INK = ColorPalette.slate[700];
// 600, not 500: reads against a tinted panel elsewhere in the document, and 500
// falls to 4.38:1 there against the 4.5:1 WCAG AA threshold.
const MUTED = ColorPalette.slate[600];
const RULE = ColorPalette.slate[200];
const HEADER_BG = ColorPalette.slate[100];
const HIGH = ColorPalette.rose[600];
// 700, not 600: this flag's text on white needs 4.5:1 and 600 falls to 3.20:1.
const LOW = ColorPalette.amber[700];

const PANELS: Panel[] = [
  {
    title: 'Full Blood Count (FBC)',
    rows: [
      { name: 'Haemoglobin', result: '118', units: 'g/L', range: '120 - 150', flag: 'L' },
      { name: 'White cell count', result: '11.8', units: 'x10^9/L', range: '4.0 - 11.0', flag: 'H' },
      { name: 'Platelets', result: '265', units: 'x10^9/L', range: '150 - 400', flag: '' },
      { name: 'Haematocrit', result: '0.37', units: 'L/L', range: '0.36 - 0.46', flag: '' },
      { name: 'Mean cell volume (MCV)', result: '88', units: 'fL', range: '80 - 100', flag: '' },
      { name: 'Neutrophils', result: '8.9', units: 'x10^9/L', range: '2.0 - 7.5', flag: 'H' },
      { name: 'Lymphocytes', result: '2.1', units: 'x10^9/L', range: '1.0 - 4.0', flag: '' },
    ],
  },
  {
    title: 'Urea & Electrolytes (U&E)',
    rows: [
      { name: 'Sodium', result: '139', units: 'mmol/L', range: '133 - 146', flag: '' },
      { name: 'Potassium', result: '5.3', units: 'mmol/L', range: '3.5 - 5.3', flag: '' },
      { name: 'Urea', result: '7.8', units: 'mmol/L', range: '2.5 - 7.8', flag: '' },
      { name: 'Creatinine', result: '96', units: 'µmol/L', range: '49 - 90', flag: 'H' },
      { name: 'eGFR', result: '62', units: 'mL/min/1.73m²', range: '> 90', flag: 'L' },
    ],
  },
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 50,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: INK },
      footerTemplate: pageTemplate({
        default: new TextBlock(
          `CONFIDENTIAL - Patient: SAMPLE, Harold (Patient ID SH-9434765919)  ·  Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`,
          { fontName: StandardFonts.Helvetica, fontSize: 8, color: MUTED }
        ),
      }),
    },
    metadata: {
      title: 'Laboratory Report - specimen L26-118842',
      author: 'Sample Hospital Pathology Services',
      subject: 'Pathology laboratory report with reference ranges and flags (sample).',
    },
  });

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Grid({ columns: [2.4, 1], cellPadding: 0, border: 0 });
  header.addRow(
    new VerticalStack({
      children: [
        new TextBlock('Sample Hospital Pathology Services', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 14,
          color: CLINICAL_BLUE,
        }),
        new TextBlock('Department of Laboratory Medicine - Haematology & Clinical Chemistry', {
          fontSize: 9,
          color: MUTED,
          margin: { top: 2 },
        }),
        new TextBlock('UKAS Medical Laboratory 8842 - accredited to ISO 15189', {
          fontSize: 8,
          color: MUTED,
          margin: { top: 1 },
        }),
      ],
    }),
    new Heading('LABORATORY REPORT', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      color: INK,
      alignment: 'right',
    })
  );
  doc.add(header);

  doc.add(
    new Container({
      backgroundColor: CLINICAL_BLUE,
      height: 1.5,
      margin: { top: 6, bottom: 16 },
    })
  );

  // ── Patient + specimen block ──────────────────────────────────────────────
  const info = new Grid({
    columns: [1, 1],
    cellPadding: 12,
    border: { width: 0.5, color: RULE },
    margin: { bottom: 18 },
  });
  info.addRow(
    new VerticalStack({
      children: [
        sectionLabel('PATIENT'),
        kv('Name', 'SAMPLE, Harold'),
        kv('Date of birth', '02 Nov 1951 (74y)'),
        kv('Sex', 'Male'),
        kv('Patient ID', 'SH-9434765919'),
        kv('Hospital no.', 'SH-2208814'),
      ],
    }),
    new VerticalStack({
      children: [
        sectionLabel('SPECIMEN'),
        kv('Specimen ID', 'L26-118842'),
        kv('Collected', '06 Jul 2026 08:14'),
        kv('Received', '06 Jul 2026 09:02'),
        kv('Reported', '06 Jul 2026 11:37'),
        kv('Requested by', 'Dr A. Sample, Ward 12'),
      ],
    })
  );
  doc.add(info);

  // ── Result panels ─────────────────────────────────────────────────────────
  for (const panel of PANELS) {
    doc.add(h2(panel.title));
    const table = new Table({
      columns: [2.6, 1, 1.2, 1.4, 0.7],
      cellPadding: 7,
      border: { width: 0.5, color: RULE },
      headerBackgroundColor: HEADER_BG,
      headerTextColor: INK,
      margin: { top: 4, bottom: 14 },
    });
    table.addHeader(
      th('Analyte', 'left'),
      th('Result', 'right'),
      th('Units', 'left'),
      th('Reference range', 'left'),
      th('Flag', 'center')
    );
    for (const a of panel.rows) {
      const abnormal = a.flag !== '';
      const resultColor = a.flag === 'H' ? HIGH : a.flag === 'L' ? LOW : INK;
      table.addRow(
        td(a.name, 'left', INK, false),
        td(a.result, 'right', resultColor, abnormal),
        td(a.units, 'left', MUTED, false),
        td(a.range, 'left', MUTED, false),
        td(a.flag, 'center', resultColor, true)
      );
    }
    doc.add(table);
  }

  // ── Interpretation ────────────────────────────────────────────────────────
  // The interpretation and the sign-off that authorises it stay on one page.
  const sign = new VerticalStack({ breakAllowed: false });
  sign.add(h2('Clinical interpretation'));
  sign.add(
    body(
      'Mild normocytic anaemia with a neutrophil leucocytosis, consistent with an ' +
        'acute inflammatory or infective process. Renal function shows a mildly raised ' +
        'creatinine with eGFR 62 mL/min/1.73m² (CKD stage G2). Suggest clinical ' +
        'correlation and a repeat FBC in 7-10 days. Flags: H = above reference range, ' +
        'L = below reference range.'
    )
  );

  // ── Authorisation ─────────────────────────────────────────────────────────
  sign.add(
    new Container({
      backgroundColor: ColorPalette.blue[50],
      border: { left: 3, color: CLINICAL_BLUE },
      padding: [14, 10],
      margin: { top: 8 },
      child: new VerticalStack({
        children: [
          sectionLabel('AUTHORISED BY'),
          new TextBlock('Dr S. Patel, Consultant Haematologist (electronically authorised)', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 10,
            color: INK,
            margin: { top: 2, bottom: 2 },
          }),
          new TextBlock('Reported 06 Jul 2026 11:37  ·  Analyser: Sysmex XN-1000 / Roche cobas c503', {
            fontSize: 8.5,
            color: MUTED,
          }),
        ],
      }),
    })
  );
  doc.add(sign);

  return doc;
}

// Local helpers and sample types used by this document.

type Flag = 'H' | 'L' | '';

interface Analyte {
  name: string;
  result: string;
  units: string;
  range: string;
  flag: Flag;
}

interface Panel {
  title: string;
  rows: Analyte[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: CLINICAL_BLUE,
    margin: { top: 4, bottom: 6 },
  });
}

function body(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: 9.5,
    color: INK,
    alignment: 'justify',
    margin: { bottom: 10 },
  });
}

function sectionLabel(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 8,
    color: CLINICAL_BLUE,
    margin: { bottom: 6 },
  });
}

function kv(label: string, value: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 4 } });
  row.add(new TextBlock(label, { fontName: StandardFonts.HelveticaBold, fontSize: 9, color: MUTED }), 2);
  row.add(new TextBlock(value, { fontSize: 9.5, color: INK }), 3);
  return row;
}

function th(text: string, align: TextAlignmentInput): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.HelveticaBold, fontSize: 9, color: INK, alignment: align });
}

function td(text: string, align: TextAlignmentInput, color: ColorInput, bold: boolean): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 9.5,
    color: color,
    alignment: align,
  });
}
