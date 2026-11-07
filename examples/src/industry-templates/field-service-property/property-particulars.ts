/**
 * Property Particulars.
 * Estate agency particulars: guide price, key features, a metric and imperial room schedule, tenure, and an energy-rating graphic drawn from layout primitives.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  Table,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  pageTemplate,
  TextBlock,
  Heading,
  Svg,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.cyan[700];

const RULE = ColorPalette.slate[200];

// ── Property particulars / listing brochure ──────────────────────────────────
//
// The sales document an estate agency or property portal produces for every
// instruction: the headline, the accommodation schedule with room dimensions in
// both metric and imperial, the energy rating, tenure and council tax, and the
// legal footer that stops the particulars becoming part of a contract.
//
// The energy-rating graphic is drawn from layout primitives rather than dropped
// in as an image — coloured bands, a pointer at the current rating and another
// at the potential. That makes it a live piece of the document: change the
// rating in the data and the graphic follows, no asset pipeline in between.
//
// The floor plans are drawn the same way: an SVG generated from the room data
// below, so a changed room size redraws the plan. Photography is what a real
// brochure leads with; it is deliberately absent here, because an example
// carrying placeholder images reads as unfinished.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample property, agency, and figures
// throughout. Nothing here is a valuation or property advice.

const PROPERTY = {
  headline: 'Three-bedroom semi-detached house',
  address: '27 Sample Gardens, Sample Town, ST5 3PN',
  guidePrice: 425000,
  tenure: 'Freehold',
  councilTax: 'Band D',
  epcCurrent: 68,
  epcPotential: 84,
  yearBuilt: 'c. 1935',
  totalArea: '118 m² / 1,270 ft²',
  agency: 'Sample Estate Agency',
  reference: 'SEA-2026-0442',
  viewing: 'Strictly by appointment through the agency',
};

const FEATURES = [
  'Three bedrooms, the principal bedroom with fitted wardrobes',
  'Two reception rooms, the rear opening onto the garden',
  'Extended kitchen and dining room fitted in 2024',
  'Family bathroom and a ground-floor cloakroom',
  'South-facing rear garden of approximately 14 metres',
  'Off-street parking for two vehicles',
  'Gas central heating, boiler installed 2023',
  'Within the catchment of Sample Primary School',
];

const ROOMS: Room[] = [
  {
    name: 'Entrance hall',
    floor: 'Ground',
    metric: '4.20 × 1.85 m',
    imperial: '13\'9" × 6\'1"',
    note: 'Original tiled floor, understairs storage',
  },
  {
    name: 'Front reception',
    floor: 'Ground',
    metric: '4.05 × 3.70 m',
    imperial: '13\'3" × 12\'2"',
    note: 'Bay window to the front, open fireplace',
  },
  {
    name: 'Rear reception',
    floor: 'Ground',
    metric: '4.10 × 3.55 m',
    imperial: '13\'5" × 11\'8"',
    note: 'French doors to the garden',
  },
  {
    name: 'Kitchen and dining room',
    floor: 'Ground',
    metric: '6.40 × 3.30 m',
    imperial: '21\'0" × 10\'10"',
    note: 'Fitted 2024, integrated appliances, roof lantern',
  },
  { name: 'Cloakroom', floor: 'Ground', metric: '1.80 × 0.95 m', imperial: '5\'11" × 3\'1"', note: 'WC and basin' },
  {
    name: 'Principal bedroom',
    floor: 'First',
    metric: '4.05 × 3.65 m',
    imperial: '13\'3" × 12\'0"',
    note: 'Fitted wardrobes to one wall',
  },
  {
    name: 'Bedroom two',
    floor: 'First',
    metric: '3.95 × 3.40 m',
    imperial: '13\'0" × 11\'2"',
    note: 'Overlooking the rear garden',
  },
  {
    name: 'Bedroom three',
    floor: 'First',
    metric: '2.85 × 2.30 m',
    imperial: '9\'4" × 7\'7"',
    note: 'Currently arranged as a study',
  },
  {
    name: 'Family bathroom',
    floor: 'First',
    metric: '2.60 × 2.10 m',
    imperial: '8\'6" × 6\'11"',
    note: 'Bath with shower over, heated towel rail',
  },
  {
    name: 'Garden',
    floor: 'External',
    metric: '14.0 × 8.5 m',
    imperial: '45\'11" × 27\'11"',
    note: 'South facing, lawn with paved terrace',
  },
];

/** [label, x, y, width, depth] in metres, front of the house at the top. Not to scale in the legal sense. */
type PlanRoom = [label: string, x: number, y: number, width: number, depth: number];

const GROUND_FLOOR: PlanRoom[] = [
  ['Front reception', 0, 0, 4.05, 3.7],
  ['Hall', 4.05, 0, 2.35, 4.2],
  ['Rear reception', 0, 3.7, 4.1, 3.55],
  ['WC', 4.1, 4.2, 2.3, 1.2],
  ['Store', 4.1, 5.4, 2.3, 1.85],
  ['Kitchen and dining', 0, 7.25, 6.4, 3.3],
];

const FIRST_FLOOR: PlanRoom[] = [
  ['Principal bedroom', 0, 0, 4.05, 3.65],
  ['Landing', 4.05, 0, 2.35, 2.4],
  ['Bathroom', 4.05, 2.4, 2.35, 2.1],
  ['Bedroom two', 0, 3.65, 4.05, 3.6],
  ['Bedroom three', 4.05, 4.5, 2.35, 2.75],
];

/**
 * The standard energy-rating bands, best first.
 *
 * Each band carries its own label colour as well as its fill. The recognisable
 * rating colours run from dark green to bright red, and white text does not
 * clear 4.5:1 on the lighter middle bands — so those take dark text instead.
 * `ink` is the colour to use when the band is named as text on a light panel,
 * where the fill itself would be unreadable.
 */
const EPC_BANDS: { letter: string; from: number; to: number; fill: ColorInput; label: ColorInput; ink: ColorInput }[] =
  [
    {
      letter: 'A',
      from: 92,
      to: 100,
      fill: ColorPalette.emerald[800],
      label: '#ffffff',
      ink: ColorPalette.emerald[800],
    },
    {
      letter: 'B',
      from: 81,
      to: 91,
      fill: ColorPalette.emerald[700],
      label: '#ffffff',
      ink: ColorPalette.emerald[700],
    },
    {
      letter: 'C',
      from: 69,
      to: 80,
      fill: ColorPalette.lime[300],
      label: ColorPalette.slate[900],
      ink: ColorPalette.lime[800],
    },
    {
      letter: 'D',
      from: 55,
      to: 68,
      fill: ColorPalette.amber[300],
      label: ColorPalette.slate[900],
      ink: ColorPalette.amber[800],
    },
    {
      letter: 'E',
      from: 39,
      to: 54,
      fill: ColorPalette.amber[400],
      label: ColorPalette.slate[900],
      ink: ColorPalette.amber[800],
    },
    { letter: 'F', from: 21, to: 38, fill: ColorPalette.orange[700], label: '#ffffff', ink: ColorPalette.orange[700] },
    { letter: 'G', from: 1, to: 20, fill: ColorPalette.rose[700], label: '#ffffff', ink: ColorPalette.rose[700] },
  ];

export function generate(): Document {
  const current = bandFor(PROPERTY.epcCurrent);
  const potential = bandFor(PROPERTY.epcPotential);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      footerTemplate: pageTemplate({
        default: band(
          `${PROPERTY.agency} · ${PROPERTY.reference}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `${PROPERTY.headline} — ${PROPERTY.address}`,
      author: PROPERTY.agency,
      subject:
        'Property particulars: headline, key features, accommodation schedule with metric and imperial dimensions, energy rating, tenure, and the misrepresentation notice (sample data).',
      keywords: 'property particulars, listing, estate agency, lettings, epc, accommodation schedule, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('PROPERTY PARTICULARS', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(PROPERTY.headline));
  doc.add(cell(PROPERTY.address, { size: 12, color: MUTED, mb: 4 }));
  doc.add(
    cell(
      `Guide price ${PROPERTY.guidePrice.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })}`,
      {
        size: 18,
        bold: true,
        color: ACCENT,
        mb: 14,
      }
    )
  );

  doc.add(
    weightedRow(
      [
        tile(PROPERTY.tenure, 'Tenure'),
        tile(PROPERTY.councilTax, 'Council tax'),
        tile(`${current.letter} (${PROPERTY.epcCurrent})`, 'Energy rating', current.ink),
        tile(PROPERTY.totalArea, 'Approx. floor area'),
      ],
      { spacing: 10, mb: 4 }
    )
  );

  doc.add(h2('Key features'));
  for (const feature of FEATURES) {
    doc.add(cell(`· ${feature}`, { size: 9.5, mb: 3 }));
  }

  doc.add(h2('The property'));
  doc.add(
    cell(
      'A well-proportioned semi-detached house on a established residential road, extended to the rear to create ' +
        'an open kitchen and dining room with a roof lantern. The two reception rooms retain their original ' +
        'proportions, with a bay window to the front and doors from the rear room onto the garden.',
      { size: 9.5, mb: 6 }
    )
  );
  doc.add(
    cell(
      'Upstairs there are three bedrooms and a family bathroom. The south-facing garden extends to approximately ' +
        'fourteen metres, with a paved terrace adjoining the house and lawn beyond. Off-street parking is to the ' +
        'front for two vehicles.',
      { size: 9.5, mb: 4 }
    )
  );

  doc.add(h2('Accommodation'));
  doc.add(
    cell('All dimensions are approximate maximums, taken at the widest point, and are given as a guide only.', {
      size: 9,
      color: MUTED,
      mb: 8,
    })
  );

  const table = new Table({
    columns: [2.6, 1, 1.6, 1.6, 3.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(th('Room'), th('Floor'), th('Metric'), th('Imperial'), th('Notes'));
  for (const room of ROOMS) {
    table.addRow(
      td(room.name, { bold: true }),
      td(room.floor, { color: MUTED }),
      td(room.metric),
      td(room.imperial, { color: MUTED }),
      td(room.note)
    );
  }
  doc.add(table);

  // ── Floor plans, drawn as SVG from the room data ───────────────────────────

  doc.add(h2('Floor plans'));
  doc.add(
    weightedRow(
      [
        new VerticalStack({
          spacing: 4,
          children: [
            cell('Ground floor', { bold: true, size: 9.5, color: HEADING }),
            new Svg({
              svgData: floorPlan(GROUND_FLOOR),
              width: 200,
              altText:
                'Ground floor plan: front reception and hall at the front, rear reception, WC and store behind, and the kitchen and dining room across the back.',
            }),
          ],
        }),
        new VerticalStack({
          spacing: 4,
          children: [
            cell('First floor', { bold: true, size: 9.5, color: HEADING }),
            new Svg({
              svgData: floorPlan(FIRST_FLOOR),
              width: 200,
              altText:
                'First floor plan: principal bedroom and landing at the front, bathroom off the landing, and bedrooms two and three at the back.',
            }),
          ],
        }),
      ],
      { spacing: 24, mb: 4 }
    )
  );
  doc.add(cell('Floor plans are for illustration only and are not to scale.', { size: 8.5, color: MUTED, mb: 4 }));

  // ── Energy rating ──────────────────────────────────────────────────────────

  doc.add(h2('Energy performance'));
  doc.add(
    cell(
      `Current rating ${current.letter} (${PROPERTY.epcCurrent}). Potential after the recommended improvements: ` +
        `${potential.letter} (${PROPERTY.epcPotential}).`,
      { size: 9.5, mb: 10 }
    )
  );
  doc.add(epcChart(PROPERTY.epcCurrent, PROPERTY.epcPotential));

  // ── Practicalities ─────────────────────────────────────────────────────────

  doc.add(h2('Further information'));
  doc.add(
    weightedRow(
      [
        field('Tenure', PROPERTY.tenure),
        field('Council tax band', PROPERTY.councilTax),
        field('Approximate age', PROPERTY.yearBuilt),
        field('Reference', PROPERTY.reference),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow([
      field('Services', 'Mains gas, electricity, water and drainage'),
      field('Heating', 'Gas central heating, boiler installed 2023'),
      field('Parking', 'Off-street for two vehicles'),
      field('Viewing', PROPERTY.viewing),
    ])
  );

  doc.add(
    panel('Important notice', [
      cell(
        'These particulars are prepared as a general guide and are not an offer or a contract, nor any part of ' +
          'one. Descriptions, dimensions, references to condition, and any necessary permissions for use and ' +
          'occupation are given in good faith and are believed to be correct, but any intending purchaser should ' +
          'not rely on them as statements of fact and must satisfy themselves by inspection or otherwise.',
        { size: 8.5, color: MUTED, mb: 3 }
      ),
      cell(
        'No person in the employment of the agency has authority to make or give any representation or warranty in ' +
          'relation to this property. Services, appliances, and fittings have not been tested.',
        { size: 8.5, color: MUTED, mb: 0 }
      ),
    ])
  );

  return doc;
}

// Local helpers and sample types used by this document.

/** A coordinate in the plan's SVG units, rounded to a tenth so both languages write the same digits. */
function n(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/**
 * An SVG floor plan: one outlined rectangle per room, labelled with its name and size,
 * inside a heavier outer wall. 24 SVG units to the metre.
 */
function floorPlan(rooms: PlanRoom[]): string {
  const scale = 24;
  const pad = 4;
  const width = Math.max(...rooms.map(([, x, , w]) => x + w));
  const depth = Math.max(...rooms.map(([, , y, , d]) => y + d));
  const parts = rooms.map(([label, x, y, w, d]) => {
    const cx = pad + (x + w / 2) * scale;
    const cy = pad + (y + d / 2) * scale;
    const size = w >= 3 ? `${w.toFixed(2)} × ${d.toFixed(2)} m` : '';
    return (
      `<rect x="${n(pad + x * scale)}" y="${n(pad + y * scale)}" width="${n(w * scale)}" height="${n(d * scale)}" fill="#ffffff" stroke="#64748b" stroke-width="1"/>` +
      `<text x="${n(cx)}" y="${n(size ? cy - 1 : cy + 2.5)}" font-family="Helvetica" font-size="${w >= 3 ? 7.5 : 6.5}" font-weight="bold" fill="#1e293b" text-anchor="middle">${label}</text>` +
      (size
        ? `<text x="${n(cx)}" y="${n(cy + 8)}" font-family="Helvetica" font-size="6.5" fill="#475569" text-anchor="middle">${size}</text>`
        : '')
    );
  });
  const outerW = width * scale;
  const outerD = depth * scale;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(outerW + 2 * pad)} ${n(outerD + 2 * pad)}">` +
    `<rect x="${pad}" y="${pad}" width="${n(outerW)}" height="${n(outerD)}" fill="#f8fafc"/>` +
    parts.join('') +
    `<rect x="${pad}" y="${pad}" width="${n(outerW)}" height="${n(outerD)}" fill="none" stroke="#1e293b" stroke-width="3"/>` +
    `</svg>`
  );
}

interface Room {
  name: string;
  floor: string;
  metric: string;
  imperial: string;
  note: string;
}

function bandFor(score: number): (typeof EPC_BANDS)[number] {
  return EPC_BANDS.find(b => score >= b.from && score <= b.to) ?? EPC_BANDS[EPC_BANDS.length - 1];
}

// ── The energy-rating graphic ────────────────────────────────────────────────

/**
 * The banded rating chart, drawn from layout primitives.
 *
 * Each band is a container whose width is proportional to its score range, so
 * the arrangement is derived from the band table rather than hand-positioned.
 * Changing a rating in the data moves the markers; there is no image to
 * regenerate.
 */
function epcChart(currentScore: number, potentialScore: number): VerticalStack {
  const stack = new VerticalStack({ spacing: 3, margin: { bottom: 12 } });

  stack.add(cell('Energy efficiency rating — higher is better', { size: 8.5, bold: true, color: MUTED, mb: 4 }));

  for (const band of EPC_BANDS) {
    const isCurrent = currentScore >= band.from && currentScore <= band.to;
    const isPotential = potentialScore >= band.from && potentialScore <= band.to;

    const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 6 });

    // The coloured band. Width tracks the band's position on the scale, which is
    // why A is the widest bar and G the narrowest.
    row.add(
      new Container({
        backgroundColor: band.fill,
        cornerRadius: 3,
        padding: [5, 8],
        child: cell(`${band.letter}   ${band.from}–${band.to}`, { size: 8.5, bold: true, color: band.label }),
      }),
      Math.max(1.2, (band.to - band.from) / 10)
    );

    const markers: string[] = [];
    if (isCurrent) markers.push(`Current ${currentScore}`);
    if (isPotential) markers.push(`Potential ${potentialScore}`);
    row.add(
      cell(markers.join('   ·   '), {
        size: 8.5,
        bold: markers.length > 0,
        color: markers.length > 0 ? INK : MUTED,
      }),
      3
    );

    // Pad the right so short bands do not stretch to the full width.
    row.add(new Container({}), Math.max(0.2, (100 - (band.to - band.from)) / 22));

    stack.add(row);
  }

  return stack;
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

/** A summary tile. */
function tile(value: string, label: string, accent: ColorInput = ACCENT): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: [11, 10],
    child: new VerticalStack({
      children: [cell(value, { bold: true, size: 14, color: accent, mb: 2 }), cell(label, { size: 8, color: MUTED })],
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
