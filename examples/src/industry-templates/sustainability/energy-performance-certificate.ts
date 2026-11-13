/** An energy performance certificate for a house: the A to G rating scale drawn with the current and potential ratings marked, each part of the building rated, the recommended improvements with their cost and saving, and the assessor’s details. */
import {
  CanvasElement,
  Color,
  ColorPalette,
  Container,
  Document,
  Grid,
  Heading,
  HorizontalStack,
  StandardFonts,
  Table,
  TableCell,
  TableRow,
  TextAlignment,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
  type ICanvas,
} from '@bonniepdf/core';

const INK = 'stone-900';
const BODY = 'stone-700';
const MUTE = 'stone-600';
const GREEN = 'green-800';

/** The rating bands, best first: letter, lowest score in the band, label, and the band's colour. */
const BANDS: [string, number, string, Color][] = [
  ['A', 92, '92+', ColorPalette.green[700]],
  ['B', 81, '81 to 91', ColorPalette.green[500]],
  ['C', 69, '69 to 80', ColorPalette.lime[500]],
  ['D', 55, '55 to 68', ColorPalette.yellow[400]],
  ['E', 39, '39 to 54', ColorPalette.amber[500]],
  ['F', 21, '21 to 38', ColorPalette.orange[600]],
  ['G', 1, '1 to 20', ColorPalette.red[600]],
];

const CURRENT = 64;
const POTENTIAL = 83;

/** Each part of the building: feature, what it is, and how it rates. */
const FEATURES: [string, string, string][] = [
  ['Walls', 'Cavity wall, filled cavity', 'Good'],
  ['Roof', 'Pitched, 270 mm loft insulation', 'Very good'],
  ['Windows', 'Fully double glazed', 'Good'],
  ['Main heating', 'Gas boiler and radiators', 'Good'],
  ['Heating controls', 'Programmer, room thermostat and radiator valves', 'Good'],
  ['Hot water', 'From the main heating system', 'Good'],
  ['Lighting', 'Low-energy lighting in all fixed outlets', 'Very good'],
  ['Floor', 'Suspended timber, no insulation', 'Poor'],
];

/** Recommended improvements, in order: measure, typical cost, typical yearly saving, and the rating after it. */
const STEPS: [string, string, string, number][] = [
  ['Floor insulation (suspended floor)', '£800 to £1,200', '£75', 67],
  ['Solar water heating', '£4,000 to £6,000', '£45', 69],
  ['Solar panels, 3.5 kWp', '£5,000 to £8,000', '£540', 83],
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 40,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: BODY },
      footerTemplate: pageTemplate({
        default: new TextBlock(
          'Sample certificate for illustration  ·  Certificate number 0000-0000-0000-0000-0000  ·  Valid until 4 November 2036',
          { fontSize: 7, color: MUTE }
        ),
      }),
    },
    metadata: {
      title: 'Energy performance certificate: 14 Orchard Row',
      author: 'Sample Energy Assessors Ltd',
      subject: 'Energy performance certificate for a semi-detached house',
    },
  });

  // ── Title and the property ──
  const top = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16, margin: { bottom: 14 } });
  top.add(
    new VerticalStack({
      spacing: 3,
      children: [
        tb('ENERGY PERFORMANCE CERTIFICATE', 7.5, GREEN, { bold: true }),
        new Heading('14 Orchard Row, Sample Town ST4 2QR', {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 18,
          color: INK,
          margin: 0,
        }),
        tb('Semi-detached house  ·  Total floor area 96 m²  ·  Assessed 5 November 2026', 9, MUTE),
      ],
    }),
    1
  );
  top.add(
    new Container({
      backgroundColor: ratingColor(CURRENT),
      cornerRadius: 6,
      padding: [14, 8],
      child: new VerticalStack({
        spacing: 1,
        children: [
          tb('RATING', 6.5, INK, { bold: true }),
          tb(`${letter(CURRENT)} ${CURRENT}`, 20, INK, { bold: true }),
        ],
      }),
    })
  );
  doc.add(top);

  // ── The rating scale ──
  doc.add(section('Energy rating'));
  const scale = new HorizontalStack({ widthDistribution: 'weighted', spacing: 18, margin: { bottom: 14 } });
  scale.add(
    new CanvasElement(drawScale, {
      drawWidth: 0,
      drawHeight: 248,
      altText: `Energy rating scale from A, most efficient, to G. This property is rated ${letter(CURRENT)} with a score of ${CURRENT}, and could reach ${letter(POTENTIAL)} with a score of ${POTENTIAL}.`,
    }),
    1.5
  );
  scale.add(
    new VerticalStack({
      spacing: 6,
      children: [
        tb(
          `This property's current rating is ${letter(CURRENT)}. It has the potential to be ${letter(POTENTIAL)}.`,
          10,
          INK,
          {
            bold: true,
          }
        ),
        tb(
          'The rating is based on the running costs of heating, hot water and lighting under standard occupancy. The average rating for a house in England and Wales is D (60).',
          8.5,
          BODY
        ),
        figures(),
      ],
    }),
    1
  );
  doc.add(scale);

  // ── How each part of the building rates ──
  doc.add(section('Breakdown of the energy performance'));
  const breakdown = new Table({
    columns: [1.1, 3, 1],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-100',
    headerTextColor: INK,
    margin: { bottom: 14 },
  });
  breakdown.addHeader(th('Feature'), th('Description'), th('Rating'));
  for (const [feature, description, rating] of FEATURES)
    breakdown.addRow([
      new TableCell({ content: tb(feature, 8.5, INK, { bold: true }) }),
      new TableCell({ content: tb(description, 8.5, BODY) }),
      new TableCell({ content: tb(rating, 8.5, rating === 'Poor' ? 'rose-700' : GREEN, { bold: true }) }),
    ]);
  doc.add(breakdown);

  // ── Recommended improvements ──
  doc.add(section('How to improve this property'));
  const steps = new Table({
    columns: [0.4, 2.6, 1.4, 1.1, 1.1],
    cellPadding: 4,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: GREEN,
    headerTextColor: '#ffffff',
    margin: { bottom: 14 },
  });
  steps.addHeader(
    th('Step', '#ffffff'),
    th('Improvement', '#ffffff'),
    th('Typical cost', '#ffffff'),
    th('Yearly saving', '#ffffff'),
    th('Rating after', '#ffffff')
  );
  STEPS.forEach(([measure, cost, saving, after], i) =>
    steps.addRow(
      new TableRow({
        cells: [
          new TableCell({ content: tb(String(i + 1), 8.5, INK, { bold: true }) }),
          new TableCell({ content: tb(measure, 8.5, INK) }),
          new TableCell({ content: tb(cost, 8.5, BODY) }),
          new TableCell({ content: tb(saving, 8.5, BODY) }),
          new TableCell({ content: ratingChip(after) }),
        ],
      })
    )
  );
  doc.add(steps);

  // ── The assessment ──
  const assessor = new Grid({ columns: [1, 1, 1], cellPadding: 0 });
  assessor.addRow(
    detail('Assessor', 'R. Hughes, Sample Energy Assessors Ltd'),
    detail('Accreditation', 'SAMPLE-123456'),
    detail('Contact', 'assessor@energy.example')
  );
  doc.add(
    tb(
      'This certificate shows how energy efficient the property is and how it could be improved. Costs and savings are typical figures from the assessment and will vary with how the home is used. You can use the certificate when you sell or let the property.',
      8.5,
      BODY,
      { bottom: 12 }
    )
  );
  doc.add(new Container({ border: { top: 0.5, color: 'stone-300' }, padding: { top: 8 }, child: assessor }));
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(text: string, size: number, color: ColorInput, opts: { bold?: boolean; bottom?: number } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
    margin: opts.bottom ? { bottom: opts.bottom } : undefined,
  });
}

/** A section heading. */
function section(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    color: GREEN,
    margin: { bottom: 6 },
  });
}

/** A table header cell. */
function th(text: string, color: ColorInput = INK): TextBlock {
  return tb(text, 7.5, color, { bold: true });
}

/** The band letter for a score. */
function letter(score: number): string {
  return BANDS.find(([, low]) => score >= low)![0];
}

/** The band colour for a score. */
function ratingColor(score: number): Color {
  return BANDS.find(([, low]) => score >= low)![3];
}

/** A rating as a small chip in its band's colour. */
function ratingChip(score: number): Container {
  return new Container({
    fitContent: true,
    backgroundColor: ratingColor(score),
    cornerRadius: 3,
    padding: [5, 1.5],
    child: tb(`${letter(score)} ${score}`, 8, INK, { bold: true }),
  });
}

/** The estimated yearly energy use, emissions and costs. */
function figures(): Grid {
  const grid = new Grid({ columns: [1.4, 1], cellPadding: 3, border: { bottom: 0.5, color: 'stone-200' } });
  for (const [label, value] of [
    ['Energy use', '12,400 kWh a year'],
    ['Carbon dioxide', '2.3 tonnes a year'],
    ['Heating cost', '£890 a year'],
    ['Hot water cost', '£165 a year'],
    ['Lighting cost', '£72 a year'],
  ])
    grid.addRow(tb(label, 8.5, MUTE), tb(value, 8.5, INK, { bold: true }));
  return grid;
}

/** A labelled detail of the assessment. */
function detail(label: string, value: string): VerticalStack {
  return new VerticalStack({
    spacing: 2,
    children: [tb(label.toUpperCase(), 6.5, MUTE, { bold: true }), tb(value, 8.5, INK)],
  });
}

/** The A to G ladder, with arrows marking the current and potential ratings in their own columns. */
function drawScale(canvas: ICanvas, size: { width: number; height: number }): void {
  const rowHeight = 28;
  const gap = 5;
  const column = 54;
  const ladder = size.width - column * 2 - 8;
  const label = 'stone-600';
  canvas.drawText(ladder + 8, 0, 'Current', label, 7.5, StandardFonts.HelveticaBold, TextAlignment.Left);
  canvas.drawText(ladder + 8 + column, 0, 'Potential', label, 7.5, StandardFonts.HelveticaBold, TextAlignment.Left);
  BANDS.forEach(([band, , range, color], i) => {
    const top = 14 + i * (rowHeight + gap);
    const width = ladder * (0.42 + i * 0.09);
    canvas.fillRect(0, top, width, rowHeight, color);
    const ink = i >= 1 && i <= 5 ? 'stone-900' : '#ffffff';
    canvas.drawText(6, top + 9, range, ink, 7.5, StandardFonts.Helvetica, TextAlignment.Left);
    const w = canvas.measureText(band, 14, StandardFonts.HelveticaBold).width;
    canvas.drawText(width - w - 8, top + 6, band, ink, 14, StandardFonts.HelveticaBold, TextAlignment.Left);
  });
  arrow(canvas, ladder + 8, CURRENT, rowHeight, gap, column - 6);
  arrow(canvas, ladder + 8 + column, POTENTIAL, rowHeight, gap, column - 6);
}

/** An arrow pointing left at a score's band, carrying the score. */
function arrow(canvas: ICanvas, x: number, score: number, rowHeight: number, gap: number, width: number): void {
  const index = BANDS.findIndex(([, low]) => score >= low);
  const top = 14 + index * (rowHeight + gap);
  canvas.fillPath(
    [
      { x, y: top + rowHeight / 2 },
      { x: x + 10, y: top },
      { x: x + width, y: top },
      { x: x + width, y: top + rowHeight },
      { x: x + 10, y: top + rowHeight },
    ],
    BANDS[index][3]
  );
  const text = `${score} ${BANDS[index][0]}`;
  const w = canvas.measureText(text, 9, StandardFonts.HelveticaBold).width;
  canvas.drawText(
    x + 10 + (width - 10 - w) / 2,
    top + 9,
    text,
    'stone-900',
    9,
    StandardFonts.HelveticaBold,
    TextAlignment.Left
  );
}
