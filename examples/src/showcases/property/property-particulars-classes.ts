/**
 * Property Particulars (Class API).
 * The same property particulars as Property particulars, built with the class API: construct each element and assign its properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PdfAConformance,
  TextStyle,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Table,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  pageTemplate,
  type IElement,
  TextBlock,
  TextAlignment,
  Heading,
  StandardFonts,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

// ── Property particulars / listing brochure (class API) ──────────────────────
//
// The sales document an estate agency produces for every instruction: the
// headline, the accommodation schedule in both metric and imperial, the energy
// rating drawn from layout primitives rather than dropped in as an image, and
// the legal footer that stops the particulars becoming part of a contract.
//
// The **class / construct-then-mutate** companion to `property-particulars.ts`.
// Same particulars, authored the long way: `new` each element and assign its
// properties one at a time, with the enum members rather than their string
// literals. It renders **byte-for-byte identically** to the options-object form
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

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

/**
 * The standard energy-rating bands, best first.
 *
 * Each band carries its own label colour as well as its fill. The recognisable
 * rating colours run from dark green to bright red, and white text does not
 * clear 4.5:1 on the lighter middle bands — so those take dark text instead.
 * `ink` is the colour to use when the band is named as text on a light panel,
 * where the fill itself would be unreadable.
 */
const EPC_BANDS: { letter: string; from: number; to: number; fill: Color; label: Color; ink: Color }[] = [
  {
    letter: 'A',
    from: 92,
    to: 100,
    fill: ColorPalette.emerald[800],
    label: Color.white,
    ink: ColorPalette.emerald[800],
  },
  {
    letter: 'B',
    from: 81,
    to: 91,
    fill: ColorPalette.emerald[700],
    label: Color.white,
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
  { letter: 'F', from: 21, to: 38, fill: ColorPalette.orange[700], label: Color.white, ink: ColorPalette.orange[700] },
  { letter: 'G', from: 1, to: 20, fill: ColorPalette.rose[700], label: Color.white, ink: ColorPalette.rose[700] },
];

export function generate(): Document {
  const current = bandFor(PROPERTY.epcCurrent);
  const potential = bandFor(PROPERTY.epcPotential);

  const settings = new DocumentSettings(PdfSize.a4, 46);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.footerTemplate = pageTemplate({
    default: band(
      `${PROPERTY.agency} · ${PROPERTY.reference}`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `${PROPERTY.headline} — ${PROPERTY.address}`;
  metadata.author = PROPERTY.agency;
  metadata.subject =
    'Property particulars: headline, key features, accommodation schedule with metric and imperial dimensions, energy rating, tenure, and the misrepresentation notice (sample data).';
  metadata.keywords =
    'property particulars, listing, estate agency, lettings, epc, accommodation schedule, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  doc.add(accentBar());
  doc.add(cell('PROPERTY PARTICULARS', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(PROPERTY.headline));
  doc.add(cell(PROPERTY.address, { size: 12, color: MUTED, mb: 4 }));
  doc.add(
    cell(
      `Guide price ${PROPERTY.guidePrice.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      })}`,
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

  const table = new Table(2.6, 1, 1.6, 1.6, 3.6);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(RULE);
  table.headerBackgroundColor = ACCENT;
  table.headerTextColor = Color.white;
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

// Local helpers and sample types used by this document.

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
 */
function epcChart(currentScore: number, potentialScore: number): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 3;
  stack.margin = new Thickness(0, 0, 0, 12);

  stack.add(cell('Energy efficiency rating — higher is better', { size: 8.5, bold: true, color: MUTED, mb: 4 }));

  for (const epcBand of EPC_BANDS) {
    const isCurrent = currentScore >= epcBand.from && currentScore <= epcBand.to;
    const isPotential = potentialScore >= epcBand.from && potentialScore <= epcBand.to;

    const row = new HorizontalStack();
    row.widthDistribution = WidthDistribution.Weighted;
    row.spacing = 6;

    // The coloured band. Width tracks the band's position on the scale, which is
    // why A is the widest bar and G the narrowest.
    const swatch = new Container();
    swatch.backgroundColor = epcBand.fill;
    swatch.cornerRadius = 3;
    swatch.padding = new Thickness(5, 8);
    swatch.child = cell(`${epcBand.letter}   ${epcBand.from}–${epcBand.to}`, {
      size: 8.5,
      bold: true,
      color: epcBand.label,
    });
    row.add(swatch, Math.max(1.2, (epcBand.to - epcBand.from) / 10));

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
    row.add(new Container(), Math.max(0.2, (100 - (epcBand.to - epcBand.from)) / 22));

    stack.add(row);
  }

  return stack;
}

// Local helpers keep this example ready to copy into a single file.

// ── Building blocks, the long way ────────────────────────────────────────────

interface CellOpts {
  size?: number;
  bold?: boolean;
  color?: Color;
  align?: TextAlignment;
  mt?: number;
  mb?: number;
}

function cell(text: string, o: CellOpts = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = o.size ?? 9;
  block.color = o.color ?? INK;
  block.alignment = o.align ?? TextAlignment.Left;
  block.margin = new Thickness(0, o.mt ?? 0, 0, o.mb ?? 0);
  return block;
}

function th(text: string, align: TextAlignment = TextAlignment.Left): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: Color.white, align });
}

function td(text: string, o: CellOpts = {}): TextBlock {
  return cell(text, { ...o, size: o.size ?? 8.5 });
}

function h1(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 1;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 21;
  heading.color = HEADING;
  heading.margin = new Thickness(0, 0, 0, 4);
  return heading;
}

function h2(text: string, color: Color = ACCENT): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.color = color;
  heading.margin = new Thickness(0, 16, 0, 8);
  return heading;
}

/** The full-width accent rule at the top of each document. */

function accentBar(color: Color = ACCENT, height = 4): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
}

/** A summary tile. */

function tile(value: string, label: string, accent: Color = ACCENT): Container {
  const body = new VerticalStack();
  body.add(cell(value, { bold: true, size: 14, color: accent, mb: 2 }));
  body.add(cell(label, { size: 8, color: MUTED }));
  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(11, 10);
  box.child = body;
  return box;
}

function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  stack.add(cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }));
  stack.add(cell(value, { size: 9.5 }));
  return stack;
}

function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = o.spacing ?? 14;
  row.margin = new Thickness(0, o.mt ?? 0, 0, o.mb ?? 14);
  for (const item of items) row.add(item, 1);
  return row;
}

function panel(title: string, children: IElement[], accent: Color = ACCENT): Container {
  const body = new VerticalStack();
  body.spacing = 4;
  body.add(cell(title, { bold: true, size: 9.5, color: accent, mb: 4 }));
  for (const child of children) body.add(child);
  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.margin = new Thickness(0, 4, 0, 12);
  box.child = body;
  return box;
}

function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: TextAlignment.Right }), 2);
  return row;
}
