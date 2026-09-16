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
// Photography is what a real brochure leads with. It is deliberately absent
// here: an example carrying placeholder images reads as unfinished, and the
// layout leaves the plate positions and their captions for real photographs to
// drop into.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample property, agency, and figures
// throughout. Nothing here is a valuation or property advice.

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
} from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  accentBar,
  band,
  cell,
  field,
  h1,
  h2,
  panel,
  td,
  th,
  tile,
  weightedRow,
} from '../invoices/_trade-kit';

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

interface Room {
  name: string;
  floor: string;
  metric: string;
  imperial: string;
  note: string;
}

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

function bandFor(score: number): (typeof EPC_BANDS)[number] {
  return EPC_BANDS.find(b => score >= b.from && score <= b.to) ?? EPC_BANDS[EPC_BANDS.length - 1];
}

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
      footerTemplate: (pageNumber: number) =>
        band(`${PROPERTY.agency} · ${PROPERTY.reference}`, `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`),
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
