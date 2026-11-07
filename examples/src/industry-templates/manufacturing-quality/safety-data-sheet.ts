/** A safety data sheet for a flammable cleaning product: all 16 sections in the order the regulation sets, drawn hazard pictograms with the signal word, composition and exposure-limit tables, transport details, and the product and page number on every page. */
import {
  CanvasElement,
  Color,
  ColorPalette,
  Container,
  Document,
  Grid,
  Heading,
  pageNumber,
  HorizontalStack,
  StandardFonts,
  Table,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
  type ICanvas,
  type IElement,
} from '@bonniepdf/core';

const INK = 'stone-900';
const BODY = 'stone-700';
const MUTE = 'stone-600';
const ACCENT = 'orange-800';
const PRODUCT = 'Sample Surface Cleaner IPA 70';

/** A block of section content: a paragraph, label and value pairs, or a table with a header row. */
type Block = ['text', string] | ['pairs', [string, string][]] | ['table', number[], string[], string[][]];

/** The 16 sections, in the order Annex II of the REACH regulation sets. Section 2 adds the pictograms. */
const SECTIONS: [string, Block[]][] = [
  [
    'Identification of the substance or mixture and of the company',
    [
      [
        'pairs',
        [
          ['Product name', PRODUCT],
          ['Product code', 'SC-IPA70-5L'],
          ['Use', 'Professional cleaning and disinfection of hard surfaces. Not for use on skin.'],
          ['Supplier', 'Sample Industrial Supplies Ltd, Unit 9, Sample Park, Sample Town ST7 3CD'],
          ['Emergency telephone', '0344 892 0111 (24 hours, English)'],
        ],
      ],
    ],
  ],
  [
    'Hazards identification',
    [
      [
        'pairs',
        [
          ['Classification', 'Flam. Liq. 2, H225  ·  Eye Irrit. 2, H319  ·  STOT SE 3, H336'],
          [
            'Hazard statements',
            'H225 Highly flammable liquid and vapour. H319 Causes serious eye irritation. H336 May cause drowsiness or dizziness.',
          ],
          [
            'Precautionary statements',
            'P210 Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking. P233 Keep container tightly closed. P305+P351+P338 IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing. P403+P235 Store in a well-ventilated place. Keep cool.',
          ],
        ],
      ],
    ],
  ],
  [
    'Composition and information on ingredients',
    [
      [
        'table',
        [2, 1, 1, 0.7, 2],
        ['Substance', 'CAS number', 'EC number', 'Content', 'Classification'],
        [
          [
            'Propan-2-ol (isopropyl alcohol)',
            '67-63-0',
            '200-661-7',
            '70%',
            'Flam. Liq. 2, H225; Eye Irrit. 2, H319; STOT SE 3, H336',
          ],
          ['Water', '7732-18-5', '231-791-2', '30%', 'Not classified'],
        ],
      ],
    ],
  ],
  [
    'First aid measures',
    [
      [
        'pairs',
        [
          ['Inhalation', 'Move to fresh air and keep at rest. Get medical advice if dizziness or drowsiness persists.'],
          ['Skin contact', 'Wash with plenty of water. Remove contaminated clothing.'],
          [
            'Eye contact',
            'Rinse cautiously with water for at least 15 minutes, holding the eyelids open. Get medical advice if irritation persists.',
          ],
          ['Ingestion', 'Rinse the mouth. Do not induce vomiting. Get medical advice.'],
        ],
      ],
    ],
  ],
  [
    'Firefighting measures',
    [
      [
        'pairs',
        [
          [
            'Extinguishing media',
            'Alcohol-resistant foam, carbon dioxide, dry powder or water spray. Do not use a water jet.',
          ],
          [
            'Special hazards',
            'Vapour is heavier than air, spreads along floors and can travel to a source of ignition and flash back.',
          ],
          [
            'Advice for firefighters',
            'Wear self-contained breathing apparatus. Cool closed containers with water spray.',
          ],
        ],
      ],
    ],
  ],
  [
    'Accidental release measures',
    [
      [
        'text',
        'Remove all sources of ignition and ventilate the area. Contain the spill with sand or another non-combustible absorbent and collect it in a closed container for disposal. Do not let the product enter drains.',
      ],
    ],
  ],
  [
    'Handling and storage',
    [
      [
        'pairs',
        [
          [
            'Handling',
            'Use in a well-ventilated area. Keep away from ignition sources and take precautions against static discharge.',
          ],
          [
            'Storage',
            'Store in the original container, tightly closed, in a cool, well-ventilated flammables store below 30 °C.',
          ],
        ],
      ],
    ],
  ],
  [
    'Exposure controls and personal protection',
    [
      [
        'table',
        [2, 1.2, 1.2, 1.6],
        ['Substance', 'Long-term limit (8 h)', 'Short-term limit (15 min)', 'Source'],
        [['Propan-2-ol', '400 ppm, 999 mg/m³', '500 ppm, 1,250 mg/m³', 'UK workplace exposure limit (EH40)']],
      ],
      [
        'pairs',
        [
          ['Eye protection', 'Safety glasses with side shields (EN 166).'],
          [
            'Hand protection',
            'Nitrile gloves, at least 0.4 mm thick, breakthrough time over 480 minutes (EN ISO 374).',
          ],
          [
            'Respiratory protection',
            'Not normally needed with good ventilation. In confined spaces, a type A filter (EN 14387).',
          ],
        ],
      ],
    ],
  ],
  [
    'Physical and chemical properties',
    [
      [
        'table',
        [1.4, 2],
        ['Property', 'Value'],
        [
          ['Appearance', 'Clear, colourless liquid'],
          ['Odour', 'Alcohol'],
          ['Flash point', '21 °C (closed cup)'],
          ['Boiling point', 'About 82 °C'],
          ['Relative density', '0.87 at 20 °C'],
          ['Solubility in water', 'Completely miscible'],
          ['Explosive limits in air', '2.0 to 12.7% by volume'],
        ],
      ],
    ],
  ],
  [
    'Stability and reactivity',
    [
      [
        'text',
        'Stable under normal conditions. Avoid heat, sparks and open flames. Incompatible with strong oxidising agents, acids and alkali metals. Hazardous decomposition products in a fire: carbon monoxide and carbon dioxide.',
      ],
    ],
  ],
  [
    'Toxicological information',
    [
      [
        'text',
        'Propan-2-ol: oral LD50 (rat) 5,045 mg/kg; dermal LD50 (rabbit) 12,800 mg/kg. Causes serious eye irritation. Vapour in high concentration may cause drowsiness and dizziness.',
      ],
    ],
  ],
  [
    'Ecological information',
    [
      [
        'text',
        'Readily biodegradable. Low potential to bioaccumulate. Not classified as hazardous to the aquatic environment.',
      ],
    ],
  ],
  [
    'Disposal considerations',
    [
      [
        'text',
        'Dispose of the product and contaminated packaging as hazardous waste through a licensed contractor (European Waste Catalogue code 07 06 04*). Empty containers may hold flammable vapour.',
      ],
    ],
  ],
  [
    'Transport information',
    [
      [
        'pairs',
        [
          ['UN number', 'UN 1219'],
          ['Proper shipping name', 'ISOPROPANOL (ISOPROPYL ALCOHOL)'],
          ['Transport hazard class', '3 (flammable liquid)'],
          ['Packing group', 'II'],
          ['Environmental hazards', 'None'],
        ],
      ],
    ],
  ],
  [
    'Regulatory information',
    [
      [
        'text',
        'This safety data sheet is prepared under UK REACH and Regulation (EC) No 1907/2006, Annex II, as amended. Classification under Regulation (EC) No 1272/2008 (CLP) and its UK equivalent.',
      ],
    ],
  ],
  [
    'Other information',
    [
      [
        'text',
        'Revision 3 replaces revision 2 of 12 January 2025. Changes: section 8 exposure limits and section 14 transport details updated. The information above is based on our present knowledge and describes the product for safety purposes only.',
      ],
    ],
  ],
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 40,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 8.5, color: BODY },
      footerTemplate: pageTemplate({ default: footer() }),
    },
    metadata: {
      title: `Safety data sheet: ${PRODUCT}`,
      author: 'Sample Industrial Supplies Ltd',
      subject: 'Safety data sheet under UK REACH and Regulation (EC) No 1907/2006, Annex II',
    },
  });

  // ── Title block ──
  const top = new HorizontalStack({ widthDistribution: 'weighted', spacing: 16, margin: { bottom: 14 } });
  top.add(
    new VerticalStack({
      spacing: 3,
      children: [
        tb('SAFETY DATA SHEET', 8, ACCENT, { bold: true }),
        new Heading(PRODUCT, { level: 1, fontName: StandardFonts.HelveticaBold, fontSize: 20, color: INK, margin: 0 }),
        tb('According to UK REACH and Regulation (EC) No 1907/2006, Annex II', 8.5, MUTE),
      ],
    }),
    1
  );
  top.add(
    new VerticalStack({
      spacing: 2,
      children: [
        tb('Revision 3', 9, INK, { bold: true, align: 'right' }),
        tb('Issued 5 November 2026', 8, MUTE, { align: 'right' }),
        tb('Replaces 12 January 2025', 8, MUTE, { align: 'right' }),
      ],
    })
  );
  doc.add(top);

  // ── The 16 sections ──
  // Each heading is kept on the same page as the first block beneath it.
  SECTIONS.forEach(([title, blocks], i) => {
    doc.add(sectionHeading(i + 1, title));
    if (i === 1) doc.add(hazardBanner());
    for (const block of blocks) doc.add(render(block));
  });
  return doc;
}

// Local helpers used by this document.

/** Text in Helvetica or Helvetica Bold. */
function tb(
  text: string,
  size: number,
  color: ColorInput,
  opts: { bold?: boolean; align?: 'left' | 'right' } = {}
): TextBlock {
  return new TextBlock(text, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
    alignment: opts.align,
  });
}

/** The footer: the product and revision on the left, the page number on the right. */
function footer(): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(tb(`${PRODUCT}  ·  Safety data sheet, revision 3, 5 November 2026`, 7, MUTE), 3);
  row.add(pageNumber(undefined, { fontSize: 7, color: MUTE, alignment: 'right' }), 1);
  return row;
}

/** A numbered section heading on a tinted band. */
function sectionHeading(number: number, title: string): Container {
  return new Container({
    keepWithNext: true,
    backgroundColor: 'orange-50',
    border: { left: 3, color: ACCENT },
    padding: [8, 3.5],
    margin: { top: 7, bottom: 4 },
    child: new Heading(`Section ${number}: ${title}`, {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 9.5,
      color: 'orange-900',
      margin: 0,
    }),
  });
}

/** One block of section content. */
function render(block: Block): IElement {
  if (block[0] === 'text') return tb(block[1], 8.5, BODY);
  if (block[0] === 'pairs') {
    const grid = new Grid({ columns: [1, 3], cellPadding: 2, margin: { bottom: 2 } });
    for (const [label, value] of block[1]) grid.addRow(tb(label, 8.5, MUTE, { bold: true }), tb(value, 8.5, BODY));
    return grid;
  }
  const [, columns, header, rows] = block;
  const table = new Table({
    columns,
    cellPadding: 3,
    border: { bottom: 0.5, color: 'stone-200' },
    headerBackgroundColor: 'stone-100',
    headerTextColor: INK,
    margin: { bottom: 6 },
  });
  table.addHeader(...header.map(text => tb(text, 7.5, INK, { bold: true })));
  for (const row of rows) table.addRow(...row.map(text => tb(text, 8.5, BODY)));
  return table;
}

/** The label elements of section 2: two pictograms and the signal word. */
function hazardBanner(): HorizontalStack {
  const banner = new HorizontalStack({
    keepWithNext: true,
    widthDistribution: 'auto',
    spacing: 10,
    margin: { bottom: 6 },
  });
  banner.add(pictogram('flame', 'Hazard pictogram GHS02, a flame: flammable'));
  banner.add(pictogram('exclamation', 'Hazard pictogram GHS07, an exclamation mark: irritant and narcotic effects'));
  banner.add(
    new VerticalStack({
      spacing: 2,
      margin: { left: 6, top: 8 },
      children: [tb('SIGNAL WORD', 6.5, MUTE, { bold: true }), tb('Danger', 16, 'rose-700', { bold: true })],
    })
  );
  return banner;
}

/** A hazard pictogram: a red-bordered diamond with a black symbol. */
function pictogram(symbol: 'flame' | 'exclamation', altText: string): CanvasElement {
  return new CanvasElement((canvas, size) => drawPictogram(canvas, size.width, symbol), {
    drawWidth: 46,
    drawHeight: 46,
    altText,
  });
}

/** Draws a pictogram in a square of the given side. */
function drawPictogram(canvas: ICanvas, side: number, symbol: 'flame' | 'exclamation'): void {
  const c = side / 2;
  const diamond = (r: number, color: Color): void =>
    canvas.fillPath(
      [
        { x: c, y: c - r },
        { x: c + r, y: c },
        { x: c, y: c + r },
        { x: c - r, y: c },
      ],
      color
    );
  diamond(c, ColorPalette.red[600]);
  diamond(c - 4, Color.white);
  const black = Color.black;
  if (symbol === 'exclamation') {
    canvas.fillRect(c - 2, c - 11, 4, 14, black);
    canvas.fillCircle(c, c + 8, 2.4, black);
    return;
  }
  // A stylised flame over a base bar.
  canvas.fillPath(
    [
      { x: c - 7, y: c + 8 },
      { x: c - 9, y: c + 1 },
      { x: c - 5, y: c - 5 },
      { x: c - 3, y: c - 1 },
      { x: c - 1, y: c - 12 },
      { x: c + 4, y: c - 4 },
      { x: c + 6, y: c - 7 },
      { x: c + 9, y: c + 1 },
      { x: c + 7, y: c + 8 },
    ],
    black
  );
  canvas.fillRect(c - 9, c + 10, 18, 2.5, black);
}
