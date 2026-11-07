/**
 * Archival & Accessible PDF.
 * A council tax letter that has to reach every resident and be kept for years: tagged for screen readers (PDF/UA-1), archived as PDF/A-2a, with the settings that make it so explained on the page.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  StandardFonts,
  Svg,
  Table,
  TextBlock,
  UnorderedList,
  VerticalStack,
  pageTemplate,
} from '@bonniepdf/core';

/** The council's colour: a deep teal, used for the masthead and the table header. */
const COUNCIL = 'teal-800';

/** The charge, by row: what it is for and the amount for the year. */
const CHARGES: [string, string][] = [
  ['Sample Borough Council', '£1,642.18'],
  ['Adult social care', '£214.06'],
  ['County fire authority', '£98.40'],
  ['Police and crime commissioner', '£276.12'],
];

/**
 * A letter that benefits from both standards, authored through the
 * options-object front door: PDF/UA-1 so every resident can read it with a
 * screen reader, PDF/A-2a so the council can archive it unchanged.
 */
export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10.5, color: 'slate-700' },
      footerTemplate: pageTemplate({
        default: new HorizontalStack({
          widthDistribution: 'equal',
          children: [
            new TextBlock('Sample Borough Council  ·  Revenues and Benefits', { fontSize: 8, color: 'slate-500' }),
            new Container({
              horizontalAlignment: 'end',
              child: new Container({
                border: { width: 0.75, color: 'teal-700' },
                cornerRadius: 4,
                padding: [6, 2],
                child: new TextBlock('PDF/A-2a  ·  PDF/UA-1', {
                  fontName: StandardFonts.HelveticaBold,
                  fontSize: 7,
                  color: 'teal-800',
                }),
              }),
            }),
          ],
        }),
      }),
    },
    metadata: {
      title: 'Your council tax for 2027 to 2028',
      author: 'Sample Borough Council',
      subject: 'Council tax notice, archival (PDF/A-2a) and accessible (PDF/UA-1).',
      keywords: 'pdf/a-2a, pdf/ua-1, accessibility, archival, council tax, BonniePDF',
    },
  });

  // ── Masthead and address ──
  const mastheadRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10 });
  mastheadRow.add(
    new Svg({
      svgData: svgAsset(assets, 'images/svg/borough-crest.svg'),
      width: 24,
      height: 24,
      altText: 'Sample Borough Council crest',
    })
  );
  mastheadRow.add(
    new TextBlock('Sample Borough Council', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 17,
      color: '#ffffff',
    }),
    1
  );
  doc.add(
    new Container({
      backgroundColor: COUNCIL,
      padding: [16, 12],
      margin: { bottom: 20 },
      child: mastheadRow,
    })
  );
  doc.add(
    new HorizontalStack({
      widthDistribution: 'equal',
      margin: { bottom: 20 },
      children: [
        new TextBlock('Sample Resident\n12 Mill Lane\nSample Town\nST4 2QR'),
        new TextBlock('5 November 2026\nAccount 7700 4821 93\nBand D', { alignment: 'right', color: 'slate-600' }),
      ],
    })
  );

  doc.add(
    new Heading('Your council tax for 2027 to 2028', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      color: 'slate-900',
      margin: { bottom: 8 },
    })
  );
  doc.add(
    new TextBlock(
      'This letter sets out your council tax for the year from 1 April 2027. The total is £2,230.76, which we will collect from your bank account in ten monthly instalments: £223.13 on 1 April, then £223.07.',
      { margin: { bottom: 12 } }
    )
  );

  // ── The charge: a real data table, with a header row screen readers announce ──
  const table = new Table({
    columns: [3, 1],
    cellPadding: 6,
    border: { width: 0.5, color: 'slate-200' },
    headerBackgroundColor: COUNCIL,
    headerTextColor: '#ffffff',
    margin: { bottom: 14 },
  });
  table.addHeader(
    new TextBlock('Part of the charge', { fontName: StandardFonts.HelveticaBold }),
    new TextBlock('Amount for the year', { fontName: StandardFonts.HelveticaBold, alignment: 'right' })
  );
  for (const [part, amount] of CHARGES)
    table.addRow(new TextBlock(part), new TextBlock(amount, { alignment: 'right' }));
  table.addFooter(
    new TextBlock('Total', { fontName: StandardFonts.HelveticaBold }),
    new TextBlock('£2,230.76', { fontName: StandardFonts.HelveticaBold, alignment: 'right' })
  );
  doc.add(table);

  doc.add(
    new Heading('What to do next', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 14,
      color: 'slate-900',
      margin: { bottom: 5 },
    })
  );
  doc.add(
    new UnorderedList({
      items: [
        'Nothing, if the details above are right: your first instalment is taken on 1 April.',
        'Tell us within 21 days if you live alone, so we can apply the single person discount.',
        'Call 0117 496 0123 or visit sample.example/counciltax if you need help paying.',
      ],
      fontSize: 10.5,
      color: 'slate-700',
      bulletColor: 'teal-700',
      itemSpacing: 5,
      margin: { bottom: 20 },
    })
  );

  // ── How this letter was made: the settings, for the developer reading the example ──
  doc.add(
    new Container({
      backgroundColor: 'slate-50',
      border: { width: 0.75, color: 'slate-200' },
      cornerRadius: 6,
      padding: [14, 12],
      child: new VerticalStack({
        spacing: 4,
        children: [
          new TextBlock('How this letter was made', { fontName: StandardFonts.HelveticaBold, color: 'slate-900' }),
          new TextBlock(
            'It is set to the PDF/A-2a archival level, so it can be kept unchanged for years, and to PDF/UA-1, so its headings, list and table are tagged for screen readers; its language is British English. BonniePDF writes the metadata, colour profile, embedded fonts and tags. The author supplies the title, language, reading order and table headers, and validates the result.',
            { fontSize: 9, color: 'slate-600' }
          ),
        ],
      }),
    })
  );

  return doc;
}

function asset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(path);
  if (!bytes) throw new Error(`Missing required asset: ${path}`);
  return bytes;
}

function svgAsset(assets: ReadonlyMap<string, Uint8Array>, path: string): string {
  return new TextDecoder().decode(asset(assets, path));
}
