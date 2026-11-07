/**
 * UK Degree Transcript.
 * A UK degree transcript: institution header, student details, a 2:1 honours banner, a module register by FHEQ level, how the award was calculated against the honours bands, and a QR verification link.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── UK university degree transcript ──────────────────────────────────────────
//
// The education examples, in the UK academic idiom: an official degree
// transcript with a UK honours classification (First / 2:1 / 2:2 / Third), a
// module register grouped by FHEQ level (4/5/6) with credits and marks, a
// classification summary, and a QR verification link of the sort UK institutions
// now print (e.g. HEDD). Archival + accessible: PDF/A-2a + PDF/UA-1, en-GB.
//
// Fictional student, institution, and results. Authored through the
// options-object front door.

import {
  pageNumber,
  Document,
  TextBlock,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  TableCell,
  TableRow,
  Grid,
  QRCode,
  PreventPageBreak,
  ColorPalette,
  StandardFonts,
  Svg,
  type ColorInput,
  type TextAlignmentInput,
  pageTemplate,
} from '@bonniepdf/core';

const NAVY = ColorPalette.blue[900]; // academic navy
const INK = ColorPalette.slate[700];
// 600, not 500: reads against a blue-50 panel elsewhere in the document, and
// 500 falls to 4.38:1 there against the 4.5:1 WCAG AA threshold.
const MUTED = ColorPalette.slate[600];
const RULE = ColorPalette.slate[200];
// 700, not 500: bold 12pt text on white needs 4.5:1 and 500 falls to 2.13:1.
const GOLD = ColorPalette.amber[700];

/** The UK honours classifications by weighted average; the award is the one this transcript records. */
const AWARD = 'Upper Second-Class Honours (2:1)';
const BANDS: [string, string][] = [
  ['First-Class Honours (1st)', '70–100%'],
  [AWARD, '60–69%'],
  ['Lower Second-Class Honours (2:2)', '50–59%'],
  ['Third-Class Honours (3rd)', '40–49%'],
];

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

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const crestSvg = new TextDecoder().decode(assets.get('images/svg/university-crest.svg'));
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 50,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: INK },
      footerTemplate: pageTemplate({
        default: pageNumber('Sample University  -  Transcript 20458812  -  Page {page} of {total}', {
          fontName: StandardFonts.Helvetica,
          fontSize: 8,
          color: MUTED,
        }),
      }),
    },
    metadata: {
      title: 'Academic Transcript - Sample Student',
      author: 'Sample University',
      subject: 'Official degree transcript with UK honours classification (sample).',
    },
  });

  // ── Institution header ────────────────────────────────────────────────────
  const header = new Grid({ columns: [2.4, 1], cellPadding: 0, border: 0, margin: { bottom: 6 } });
  header.addRow(
    new HorizontalStack({
      widthDistribution: 'auto',
      spacing: 10,
      children: [
        new Svg({ svgData: crestSvg, width: 30, height: 35, altText: 'University of Sampleford heraldic crest' }),
        new VerticalStack({
          children: [
            new TextBlock('SAMPLE UNIVERSITY', {
              fontName: StandardFonts.HelveticaBold,
              fontSize: 16,
              color: NAVY,
            }),
            new TextBlock("Founded 1887 - Registrar's Office", { fontSize: 9, color: MUTED, margin: { top: 2 } }),
          ],
        }),
      ],
    }),
    new TextBlock('ACADEMIC TRANSCRIPT', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      color: GOLD,
      alignment: 'right',
    })
  );
  doc.add(header);

  doc.add(
    new Container({
      backgroundColor: NAVY,
      height: 1.5,
      margin: { bottom: 16 },
    })
  );

  // ── Student details ───────────────────────────────────────────────────────
  const details = new Grid({ columns: [1, 1], cellPadding: 0, border: 0, margin: { bottom: 18 } });
  details.addRow(
    new VerticalStack({
      children: [kv('Student', 'Sample Student'), kv('Student ID', '20458812'), kv('Date of birth', '14 March 2003')],
    }),
    new VerticalStack({
      children: [
        kv('Programme', 'BSc (Hons) Computer Science'),
        kv('Awarding body', 'Sample University'),
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
          new TextBlock('AWARD', { fontName: StandardFonts.HelveticaBold, fontSize: 8, color: MUTED }),
          // The award is the transcript's primary heading (H1). Tagging it as
          // the first heading satisfies PDF/UA rule 7.4.2-1 (H1 must precede
          // any H2); the section headings below are H2. Styling is unchanged.
          h1(AWARD),
          new TextBlock(`Weighted average ${weighted.toFixed(1)}%  -  ${total} credits  -  FHEQ Level 6`, {
            fontSize: 9,
            color: INK,
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
      // emerald[700], not [600]: regular-weight text on white needs 4.5:1 and
      // 600 falls to 3.65:1.
      td(`${m.mark}%`, 'right', m.mark >= 70 ? ColorPalette.emerald[700] : INK)
    );
  }
  doc.add(table);

  // ── How the award was calculated ──────────────────────────────────────────
  // Each level's average beside the honours bands, with this award highlighted, kept on one page.
  const levels = new Table({
    columns: [1.3, 1, 1, 1.2],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: NAVY,
    headerTextColor: '#ffffff',
  });
  levels.addHeader(th('Level', 'left'), th('Credits', 'right'), th('Average', 'right'), th('Weight', 'right'));
  for (const level of [4, 5, 6]) {
    const modules = MODULES.filter(m => m.level === level);
    const credits = modules.reduce((s, m) => s + m.credits, 0);
    const average = modules.reduce((s, m) => s + m.mark * m.credits, 0) / credits;
    levels.addRow(
      td(`Level ${level}`, 'left', INK),
      td(String(credits), 'right', INK),
      td(`${average.toFixed(1)}%`, 'right', INK),
      td(level === 4 ? 'None' : level === 5 ? '× 1' : '× 2', 'right', MUTED)
    );
  }
  const bands = new Table({
    columns: [2.6, 1],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: NAVY,
    headerTextColor: '#ffffff',
  });
  bands.addHeader(th('Classification', 'left'), th('Average', 'right'));
  for (const [name, range] of BANDS) {
    const awarded = name === AWARD;
    const font = awarded ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    bands.addRow(
      new TableRow({
        cells: [
          new TableCell({
            content: new TextBlock(name, { fontName: font, fontSize: 9.5, color: awarded ? NAVY : INK }),
          }),
          new TableCell({
            content: new TextBlock(range, {
              fontName: font,
              fontSize: 9.5,
              color: awarded ? NAVY : INK,
              alignment: 'right',
            }),
          }),
        ],
        backgroundColor: awarded ? ColorPalette.blue[50] : undefined,
      })
    );
  }
  const calculation = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20, margin: { bottom: 10 } });
  calculation.add(levels, 1);
  calculation.add(bands, 1.3);
  doc.add(
    new PreventPageBreak({
      child: new VerticalStack({
        children: [
          h2('How the award was calculated'),
          calculation,
          new TextBlock(
            `Level 4 does not count towards the classification. Level 6 counts twice as much as level 5, giving a ` +
              `weighted average of ${weighted.toFixed(1)}%.`,
            { fontSize: 9, color: MUTED, margin: { bottom: 22 } }
          ),
        ],
      }),
    })
  );

  // ── Verification ──────────────────────────────────────────────────────────
  // The heading, wording and QR code stay on one page.
  const verify = new HorizontalStack({ widthDistribution: 'weighted', breakAllowed: false });
  verify.add(
    new VerticalStack({
      children: [
        h2('Verification'),
        body(
          'This is an official record issued by Sample University. Scan ' +
            'the code or visit verify.sample-university.example and enter transcript reference ' +
            '20458812 to confirm authenticity. The grading scheme is defined in the ' +
            'University Academic Regulations.'
        ),
      ],
    }),
    3
  );
  verify.add(
    new Container({
      horizontalAlignment: 'end',
      child: new QRCode({
        data: 'https://verify.sample-university.example/t/20458812',
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

// Local helpers and sample types used by this document.

interface Module {
  level: number;
  code: string;
  title: string;
  credits: number;
  mark: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 16,
    color: NAVY,
    margin: { top: 2, bottom: 2 },
  });
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: NAVY,
    margin: { top: 4, bottom: 8 },
  });
}

function body(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: 9.5,
    color: INK,
    alignment: 'justify',
    margin: { right: 12 },
  });
}

function kv(label: string, value: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { bottom: 5 } });
  row.add(new TextBlock(label, { fontName: StandardFonts.HelveticaBold, fontSize: 9, color: MUTED }), 2);
  row.add(new TextBlock(value, { fontSize: 10, color: INK }), 3);
  return row;
}

function th(text: string, align: TextAlignmentInput): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 9,
    color: '#ffffff',
    alignment: align,
  });
}

function td(text: string, align: TextAlignmentInput, color: ColorInput): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.Helvetica, fontSize: 9.5, color: color, alignment: align });
}
