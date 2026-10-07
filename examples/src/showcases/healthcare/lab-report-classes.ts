/**
 * Pathology Lab Report (Class API).
 * A fictional UK/EU pathology laboratory report: patient demographics, specimen timestamps, grouped result panels (FBC, U&E) with units, reference ranges and High/Low flags, a clinical interpretation, and an authorising clinician. It is generated entirely client-side, so patient data never leaves the browser.
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
// medical data and not medical advice.
//
// The **class / construct-then-mutate** companion to `lab-report.ts`. Same
// report, authored the long way: `new` each element and assign properties.
// It renders **byte-for-byte identically** to the options-style `lab-report.ts`
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextElementBase,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  PdfAConformance,
  pageTemplate,
} from '@bonniepdf/core';

const CLINICAL_BLUE = Color.fromHex('#2563eb');
const INK = ColorPalette.slate[700];
const MUTED = ColorPalette.slate[600];
const RULE = ColorPalette.slate[200];
const HEADER_BG = ColorPalette.slate[100];
const HIGH = ColorPalette.rose[600];
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
  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.pageColor = Color.white;
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(INK);

  function pageFooter(): TextBlock {
    const f = new TextBlock(
      `CONFIDENTIAL - Patient: SAMPLE, Harold (Patient ID SH-9434765919)  -  Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    );
    f.fontName = StandardFonts.Helvetica;
    f.fontSize = 8;
    f.color = MUTED;
    return f;
  }

  settings.footerTemplate = pageTemplate({ default: pageFooter() });

  const metadata = new DocumentMetadata();
  metadata.title = 'Laboratory Report - specimen L26-118842';
  metadata.author = 'Sample Hospital Pathology Services';
  metadata.subject = 'Pathology laboratory report with reference ranges and flags (sample).';

  const doc = new Document(settings, metadata);

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Grid(2.4, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  const org = new VerticalStack();
  const trust = new TextBlock('Sample Hospital Pathology Services');
  trust.fontName = StandardFonts.HelveticaBold;
  trust.fontSize = 14;
  trust.color = CLINICAL_BLUE;
  org.add(trust);
  const dept = new TextBlock('Department of Laboratory Medicine - Haematology & Clinical Chemistry');
  dept.fontSize = 9;
  dept.color = MUTED;
  dept.margin = new Thickness(0, 2, 0, 0);
  org.add(dept);
  const accred = new TextBlock('UKAS Medical Laboratory 8842 - accredited to ISO 15189');
  accred.fontSize = 8;
  accred.color = MUTED;
  accred.margin = new Thickness(0, 1, 0, 0);
  org.add(accred);
  const title = new Heading('LABORATORY REPORT');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 13;
  title.color = INK;
  title.alignment = TextAlignment.Right;
  header.addRow(org, title);
  doc.add(header);

  const blueRule = new Container();
  blueRule.backgroundColor = CLINICAL_BLUE;
  blueRule.height = 1.5;
  blueRule.margin = new Thickness(0, 6, 0, 16);
  doc.add(blueRule);

  // ── Patient + specimen block ──────────────────────────────────────────────
  const info = new Grid(1, 1);
  info.cellPadding = 12;
  info.border = new Border(0.5);
  info.borderColors = new BorderColors(RULE);
  info.margin = new Thickness(0, 0, 0, 18);
  const patient = new VerticalStack();
  patient.add(sectionLabel('PATIENT'));
  patient.add(kv('Name', 'SAMPLE, Harold'));
  patient.add(kv('Date of birth', '02 Nov 1951 (74y)'));
  patient.add(kv('Sex', 'Male'));
  patient.add(kv('Patient ID', 'SH-9434765919'));
  patient.add(kv('Hospital no.', 'SH-2208814'));
  const specimen = new VerticalStack();
  specimen.add(sectionLabel('SPECIMEN'));
  specimen.add(kv('Specimen ID', 'L26-118842'));
  specimen.add(kv('Collected', '06 Jul 2026 08:14'));
  specimen.add(kv('Received', '06 Jul 2026 09:02'));
  specimen.add(kv('Reported', '06 Jul 2026 11:37'));
  specimen.add(kv('Requested by', 'Dr A. Sample, Ward 12'));
  info.addRow(patient, specimen);
  doc.add(info);

  // ── Result panels ─────────────────────────────────────────────────────────
  for (const panel of PANELS) {
    doc.add(h2(panel.title));
    const table = new Table(2.6, 1, 1.2, 1.4, 0.7);
    table.cellPadding = 7;
    table.border = new Border(0.5);
    table.borderColors = new BorderColors(RULE);
    table.headerBackgroundColor = HEADER_BG;
    table.headerTextColor = INK;
    table.margin = new Thickness(0, 4, 0, 14);
    table.addHeader(
      th('Analyte', TextAlignment.Left),
      th('Result', TextAlignment.Right),
      th('Units', TextAlignment.Left),
      th('Reference range', TextAlignment.Left),
      th('Flag', TextAlignment.Center)
    );
    for (const a of panel.rows) {
      const abnormal = a.flag !== '';
      const resultColor = a.flag === 'H' ? HIGH : a.flag === 'L' ? LOW : INK;
      table.addRow(
        td(a.name, TextAlignment.Left, INK, false),
        td(a.result, TextAlignment.Right, resultColor, abnormal),
        td(a.units, TextAlignment.Left, MUTED, false),
        td(a.range, TextAlignment.Left, MUTED, false),
        td(a.flag, TextAlignment.Center, resultColor, true)
      );
    }
    doc.add(table);
  }

  // ── Interpretation ────────────────────────────────────────────────────────
  // The interpretation and the sign-off that authorises it stay on one page.
  const sign = new VerticalStack();
  sign.breakAllowed = false;
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
  const auth = new Container();
  auth.backgroundColor = ColorPalette.blue[50];
  auth.border = Border.leftOnly(3);
  auth.borderColors = BorderColors.leftOnly(CLINICAL_BLUE);
  auth.padding = new Thickness(14, 10, 14, 10);
  auth.margin = new Thickness(0, 8, 0, 0);
  const astack = new VerticalStack();
  astack.add(sectionLabel('AUTHORISED BY'));
  const authName = new TextBlock('Dr S. Patel, Consultant Haematologist (electronically authorised)');
  authName.fontName = StandardFonts.HelveticaBold;
  authName.fontSize = 10;
  authName.color = INK;
  authName.margin = new Thickness(0, 2, 0, 2);
  astack.add(authName);
  const authMeta = new TextBlock('Reported 06 Jul 2026 11:37  -  Analyser: Sysmex XN-1000 / Roche cobas c503');
  authMeta.fontSize = 8.5;
  authMeta.color = MUTED;
  astack.add(authMeta);
  auth.child = astack;
  sign.add(auth);
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
  const h = new Heading(text);
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 13;
  h.color = CLINICAL_BLUE;
  h.margin = new Thickness(0, 4, 0, 6);
  return h;
}

function body(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 9.5;
  b.color = INK;
  b.alignment = TextAlignment.Justify;
  b.margin = new Thickness(0, 0, 0, 10);
  return b;
}

function sectionLabel(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 8;
  b.color = CLINICAL_BLUE;
  b.margin = new Thickness(0, 0, 0, 6);
  return b;
}

function kv(label: string, value: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 0, 0, 4);
  const l = new TextBlock(label);
  l.fontName = StandardFonts.HelveticaBold;
  l.fontSize = 9;
  l.color = MUTED;
  row.add(l, 2);
  const v = new TextBlock(value);
  v.fontSize = 9.5;
  v.color = INK;
  row.add(v, 3);
  return row;
}

function th(text: string, align: TextAlignment): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 9;
  b.color = INK;
  b.alignment = align;
  return b;
}

function td(text: string, align: TextAlignment, color: Color, bold: boolean): TextBlock {
  const b = new TextBlock(text);
  b.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = 9.5;
  b.color = color;
  b.alignment = align;
  return b;
}
