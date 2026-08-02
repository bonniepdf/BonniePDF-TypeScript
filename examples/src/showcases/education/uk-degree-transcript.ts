// ── UK university degree transcript ──────────────────────────────────────────
//
// The education showcase, in the UK academic idiom: an official degree
// transcript with a UK honours classification (First / 2:1 / 2:2 / Third), a
// module register grouped by FHEQ level (4/5/6) with credits and marks, a
// classification summary, and a QR verification link of the sort UK institutions
// now print (e.g. HEDD). Archival + accessible: PDF/A-2a + PDF/UA-1, en-GB.
//
// Fictional student, institution, and results. Authored through the
// options-object front door.

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
  QRCode,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const NAVY = ColorPalette.blue[900]; // academic navy
const INK = ColorPalette.slate[700];
const MUTED = ColorPalette.slate[500];
const RULE = ColorPalette.slate[200];
const GOLD = ColorPalette.amber[500];

interface Module {
  level: number;
  code: string;
  title: string;
  credits: number;
  mark: number;
}

const MODULES: Module[] = [
  { level: 4, code: 'CS4101', title: 'Programming Fundamentals', credits: 20, mark: 68 },
  { level: 4, code: 'CS4102', title: 'Discrete Mathematics', credits: 20, mark: 61 },
  { level: 4, code: 'CS4103', title: 'Computer Systems', credits: 20, mark: 57 },
  { level: 4, code: 'CS4104', title: 'Web Technologies', credits: 20, mark: 72 },
  { level: 4, code: 'CS4105', title: 'Databases', credits: 20, mark: 64 },
  { level: 4, code: 'CS4106', title: 'Professional Skills', credits: 20, mark: 66 },
  { level: 5, code: 'CS5201', title: 'Algorithms & Data Structures', credits: 20, mark: 63 },
  { level: 5, code: 'CS5202', title: 'Software Engineering', credits: 20, mark: 71 },
  { level: 5, code: 'CS5203', title: 'Operating Systems', credits: 20, mark: 59 },
  { level: 5, code: 'CS5204', title: 'Human-Computer Interaction', credits: 20, mark: 74 },
  { level: 5, code: 'CS5205', title: 'Networks & Security', credits: 20, mark: 62 },
  { level: 5, code: 'CS5206', title: 'Group Project', credits: 20, mark: 69 },
  { level: 6, code: 'CS6301', title: 'Machine Learning', credits: 20, mark: 66 },
  { level: 6, code: 'CS6302', title: 'Distributed Systems', credits: 20, mark: 61 },
  { level: 6, code: 'CS6303', title: 'Advanced Databases', credits: 20, mark: 58 },
  { level: 6, code: 'CS6304', title: 'Individual Dissertation', credits: 40, mark: 71 },
  { level: 6, code: 'CS6305', title: 'Ethics & Society in Computing', credits: 20, mark: 67 },
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 50,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: INK },
      footerTemplate: (pageNumber: number) =>
        new TextBlock(
          `University of Wessexbridge  ·  Transcript 20458812  ·  Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`,
          { fontName: StandardFonts.Helvetica, fontSize: 8, textColor: MUTED }
        ),
    },
    metadata: {
      title: 'Academic Transcript - Alexandra R. Bennett',
      author: 'University of Wessexbridge',
      subject: 'Official degree transcript with UK honours classification (fictional).',
    },
  });

  // ── Institution header ────────────────────────────────────────────────────
  const header = new Grid({ columns: [2.4, 1], cellPadding: 0, border: 0, margin: { bottom: 6 } });
  header.addRow(
    new VerticalStack({
      children: [
        new TextBlock('UNIVERSITY OF WESSEXBRIDGE', {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 16,
          textColor: NAVY,
        }),
        new TextBlock('Founded 1887  ·  Registrar’s Office', { fontSize: 9, textColor: MUTED, margin: { top: 2 } }),
      ],
    }),
    new TextBlock('ACADEMIC TRANSCRIPT', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      textColor: GOLD,
      alignment: 'right',
    })
  );
  doc.add(header);

  doc.add(
    new Container({
      backgroundColor: NAVY,
      padding: { top: 1.5 },
      margin: { bottom: 16 },
      child: thinSpacer(),
    })
  );

  // ── Student details ───────────────────────────────────────────────────────
  const details = new Grid({ columns: [1, 1], cellPadding: 0, border: 0, margin: { bottom: 18 } });
  details.addRow(
    new VerticalStack({
      children: [
        kv('Student', 'Alexandra R. Bennett'),
        kv('Student ID', '20458812'),
        kv('Date of birth', '14 March 2003'),
      ],
    }),
    new VerticalStack({
      children: [
        kv('Programme', 'BSc (Hons) Computer Science'),
        kv('Awarding body', 'University of Wessexbridge'),
        kv('Date conferred', '15 July 2026'),
      ],
    })
  );
  doc.add(details);

  // ── Award classification banner ───────────────────────────────────────────
  const total = MODULES.reduce((s, m) => s + m.credits, 0);
  const weighted =
    MODULES.filter(m => m.level >= 5).reduce((s, m) => s + m.mark * (m.level === 6 ? 2 : 1) * m.credits, 0) /
    MODULES.filter(m => m.level >= 5).reduce((s, m) => s + (m.level === 6 ? 2 : 1) * m.credits, 0);

  doc.add(
    new Container({
      backgroundColor: ColorPalette.blue[50],
      border: { left: 5, color: NAVY },
      padding: [16, 12],
      margin: { bottom: 20 },
      child: new VerticalStack({
        children: [
          new TextBlock('AWARD', { fontName: StandardFonts.HelveticaBold, fontSize: 8, textColor: MUTED }),
          // The award is the transcript's primary heading (H1). Tagging it as
          // the first heading satisfies PDF/UA rule 7.4.2-1 (H1 must precede
          // any H2); the section headings below are H2. Styling is unchanged.
          h1('Upper Second-Class Honours (2:1)'),
          new TextBlock(`Weighted average ${weighted.toFixed(1)}%  ·  ${total} credits  ·  FHEQ Level 6`, {
            fontSize: 9,
            textColor: INK,
          }),
        ],
      }),
    })
  );

  // ── Module register ───────────────────────────────────────────────────────
  doc.add(h2('Module results'));
  const table = new Table({
    columns: [0.7, 1, 3, 0.9, 0.9],
    cellPadding: 7,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: NAVY,
    headerTextColor: '#ffffff',
    margin: { top: 4, bottom: 18 },
  });
  table.addHeader(
    th('Level', 'left'),
    th('Code', 'left'),
    th('Module', 'left'),
    th('Credits', 'right'),
    th('Mark', 'right')
  );
  for (const m of MODULES) {
    table.addRow(
      td(String(m.level), 'left', MUTED),
      td(m.code, 'left', INK),
      td(m.title, 'left', INK),
      td(String(m.credits), 'right', INK),
      td(`${m.mark}%`, 'right', m.mark >= 70 ? ColorPalette.emerald[600] : INK)
    );
  }
  doc.add(table);

  // ── Verification ──────────────────────────────────────────────────────────
  const verify = new HorizontalStack({ widthDistribution: 'weighted' });
  verify.addChild(
    new VerticalStack({
      children: [
        h2('Verification'),
        body(
          'This is an official record issued by the University of Wessexbridge. Scan ' +
            'the code or visit verify.wessexbridge.ac.uk and enter transcript reference ' +
            '20458812 to confirm authenticity. The grading scheme is defined in the ' +
            'University Academic Regulations.'
        ),
      ],
    }),
    3
  );
  verify.addChild(
    new Container({
      horizontalAlignment: 'end',
      child: new QRCode({
        data: 'https://verify.wessexbridge.ac.uk/t/20458812',
        size: 92,
        quietZone: 1,
        errorCorrection: 'quartile',
        altText: 'QR code to verify transcript reference 20458812.',
      }),
    }),
    1
  );
  doc.add(verify);

  return doc;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 16,
    textColor: NAVY,
    margin: { top: 2, bottom: 2 },
  });
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    textColor: NAVY,
    margin: { top: 4, bottom: 8 },
  });
}

function body(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: 9.5,
    textColor: INK,
    alignment: 'justify',
    margin: { right: 12 },
  });
}

function kv(label: string, value: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 5 } });
  row.addChild(new TextBlock(label, { fontName: StandardFonts.HelveticaBold, fontSize: 9, textColor: MUTED }), 2);
  row.addChild(new TextBlock(value, { fontSize: 10, textColor: INK }), 3);
  return row;
}

function th(text: string, align: TextAlignmentInput): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 9,
    textColor: '#ffffff',
    alignment: align,
  });
}

function td(text: string, align: TextAlignmentInput, color: ColorInput): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.Helvetica, fontSize: 9.5, textColor: color, alignment: align });
}

function thinSpacer(): TextBlock {
  return new TextBlock(' ', { fontSize: 1 });
}
