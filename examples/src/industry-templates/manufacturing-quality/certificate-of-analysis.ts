/** A certificate of analysis for one batch of a food ingredient: a vertical title running up the edge of the page, the batch details, every test against its specification and method, a release statement, and a QR code to verify the certificate. */
import {
  Container,
  Grid,
  Document,
  Heading,
  HorizontalStack,
  QRCode,
  Rotate,
  StandardFonts,
  Table,
  TableCell,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
} from '@bonniepdf/core';

const INK = 'stone-900';
const BODY = 'stone-700';
const MUTE = 'stone-600';
const ACCENT = 'orange-800';

/** The tests: name, method, specification, and the result for this batch. Every result conforms. */
const TESTS: [string, string, string, string][] = [
  ['Appearance', 'Visual', 'White crystalline powder', 'Conforms'],
  ['Identification', 'IR spectrum', 'Matches reference', 'Conforms'],
  ['Assay, anhydrous basis', 'Titration', '99.5 to 100.5%', '99.8%'],
  ['Water', 'Karl Fischer', '0.5% max', '0.12%'],
  ['Sulfated ash', 'Gravimetric', '0.05% max', '0.02%'],
  ['Oxalate', 'Limit test', '100 mg/kg max', 'below 50 mg/kg'],
  ['Sulfate', 'Limit test', '150 mg/kg max', '40 mg/kg'],
  ['Lead', 'ICP-MS', '0.5 mg/kg max', 'below 0.1 mg/kg'],
  ['Arsenic', 'ICP-MS', '1 mg/kg max', 'below 0.1 mg/kg'],
  ['Particle size, through 30 mesh', 'Sieve', '90% min', '96%'],
  ['Total aerobic microbial count', 'ISO 4833-1', '1,000 cfu/g max', 'below 10 cfu/g'],
  ['Yeasts and moulds', 'ISO 21527-2', '100 cfu/g max', 'below 10 cfu/g'],
];

/** Declarations the customer's own food safety team asks for. */
const DECLARATIONS: [string, string][] = [
  ['Allergens', 'Contains none of the 14 allergens listed in Regulation (EU) 1169/2011'],
  ['Genetic modification', 'Not produced from genetically modified organisms'],
  ['Irradiation', 'Not irradiated'],
  ['Origin', 'Produced by fermentation in the EU'],
];

/** The batch at a glance. */
const BATCH: [string, string][] = [
  ['Product', 'Citric acid anhydrous, food grade (E330)'],
  ['Product code', 'CA-ANH-25'],
  ['Batch', '24-1187'],
  ['Quantity', '1,000 kg in 40 bags of 25 kg'],
  ['Manufactured', '14 October 2026'],
  ['Retest or expiry', '13 October 2029'],
  ['Customer', 'Sample Beverages Ltd, order PO-55-3021'],
  ['Storage', 'Dry, below 25 °C, away from strong bases'],
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margins: { left: 48, top: 42, right: 36, bottom: 42 },
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: BODY },
      // A band down the left edge carries the document's title, turned to read upwards.
      pageBackground: pageTemplate({ default: edgeBand() }),
      footerTemplate: pageTemplate({
        default: new TextBlock(
          'Sample Ingredients Ltd  ·  Unit 4, Sample Industrial Estate, Sample Town ST6 1AB  ·  Certificate CoA-24-1187',
          {
            fontSize: 7,
            color: MUTE,
          }
        ),
      }),
    },
    metadata: {
      title: 'Certificate of analysis: batch 24-1187',
      author: 'Sample Ingredients Ltd',
      subject: 'Certificate of analysis for citric acid anhydrous, batch 24-1187',
    },
  });

  // ── Title ──
  const top = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16, margin: { bottom: 14 } });
  top.add(
    new VerticalStack({
      spacing: 3,
      children: [
        tb('SAMPLE INGREDIENTS LTD  ·  QUALITY CONTROL', 7.5, ACCENT, { bold: true }),
        new Heading('Certificate of analysis', {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 22,
          color: INK,
          margin: 0,
        }),
        tb('Certificate CoA-24-1187, issued 5 November 2026', 9, MUTE),
      ],
    }),
    1
  );
  top.add(
    new Container({
      backgroundColor: 'emerald-50',
      border: { width: 0.75, color: 'emerald-300' },
      cornerRadius: 6,
      padding: [12, 8],
      child: new VerticalStack({
        spacing: 2,
        children: [
          tb('BATCH STATUS', 6.5, 'emerald-800', { bold: true }),
          tb('Released', 14, 'emerald-900', { bold: true }),
        ],
      }),
    })
  );
  doc.add(top);

  // ── Batch details ──
  const details = new Grid({
    columns: [1, 2.6],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    margin: { bottom: 16 },
  });
  for (const [label, value] of BATCH)
    details.addRow([
      new TableCell({ content: tb(label, 8.5, MUTE), backgroundColor: 'stone-50' }),
      new TableCell({ content: tb(value, 9, INK, { bold: label === 'Batch' || label === 'Product' }) }),
    ]);
  doc.add(section('Batch'));
  doc.add(details);

  // ── Results ──
  doc.add(section('Results'));
  const results = new Table({
    columns: [2.1, 1.2, 1.6, 1.3, 0.8],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-800',
    headerTextColor: '#ffffff',
    margin: { bottom: 16 },
  });
  results.addHeader(th('Test'), th('Method'), th('Specification'), th('Result'), th('Status'));
  for (const [test, method, specification, result] of TESTS)
    results.addRow(
      tb(test, 8.5, INK),
      tb(method, 8.5, MUTE),
      tb(specification, 8.5, BODY),
      tb(result, 8.5, INK, { bold: true }),
      pass()
    );
  doc.add(results);

  // ── Declarations ──
  doc.add(section('Declarations'));
  const declarations = new Grid({ columns: [1, 1], cellPadding: 0, margin: { bottom: 16 } });
  for (let i = 0; i < DECLARATIONS.length; i += 2)
    declarations.addRow(...DECLARATIONS.slice(i, i + 2).map(([label, text]) => declaration(label, text)));
  doc.add(declarations);

  // ── Release statement, signature and verification ──
  const release = new HorizontalStack({ widthDistribution: 'weighted', spacing: 24 });
  release.add(
    new VerticalStack({
      spacing: 6,
      children: [
        tb(
          'We certify that batch 24-1187 was manufactured under our food safety management system (FSSC 22000) and conforms to the specification above, to EU Regulation 231/2012 for E330, and to the Food Chemicals Codex monograph for citric acid.',
          8.5,
          BODY
        ),
        new Container({ height: 26, border: { bottom: 0.75, color: 'stone-400' } }),
        tb('Dr H. Lindqvist, quality assurance manager  ·  5 November 2026', 8, MUTE),
      ],
    }),
    1
  );
  release.add(
    new VerticalStack({
      spacing: 3,
      children: [
        new QRCode({
          data: 'https://ingredients.example/coa/24-1187',
          size: 64,
          quietZone: 1,
          foregroundColor: INK,
          altText: 'QR code: verify certificate CoA-24-1187 online',
        }),
        tb('Verify this certificate', 7, MUTE),
      ],
    })
  );
  doc.add(release);
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(text: string, size: number, color: ColorInput, opts: { bold?: boolean } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
  });
}

/** A section heading. */
function section(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    color: ACCENT,
    margin: { bottom: 6 },
  });
}

/** A header cell. */
function th(text: string): TextBlock {
  return tb(text, 7.5, '#ffffff', { bold: true });
}

/** One declaration: a label above its statement. */
function declaration(label: string, text: string): VerticalStack {
  return new VerticalStack({
    spacing: 2,
    margin: { right: 16, bottom: 8 },
    children: [tb(label.toUpperCase(), 6.5, MUTE, { bold: true }), tb(text, 8.5, INK)],
  });
}

/** A conforming result's status, as a small chip. */
function pass(): Container {
  return new Container({
    fitContent: true,
    backgroundColor: 'emerald-50',
    cornerRadius: 3,
    padding: [5, 1.5],
    child: tb('Pass', 7.5, 'emerald-800', { bold: true }),
  });
}

/** The band down the page's left edge, with the title and batch turned to read upwards. */
function edgeBand(): Container {
  return new Container({
    backgroundColor: ACCENT,
    width: 24,
    height: 841.89,
    padding: { top: 241 },
    child: new Rotate({
      angle: 270,
      mode: 'constrained',
      contentWidth: 360,
      child: new TextBlock('CERTIFICATE OF ANALYSIS  ·  BATCH 24-1187', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 8,
        letterSpacing: 3,
        color: '#ffffff',
        alignment: 'center',
      }),
    }),
  });
}
