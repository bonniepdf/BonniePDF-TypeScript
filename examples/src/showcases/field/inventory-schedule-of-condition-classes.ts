/**
 * Inventory and Schedule of Condition (Class API).
 * The same inventory and schedule of condition as Inventory and schedule of condition, built with the class API: construct each element and assign its properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PdfAConformance,
  TextAlignment,
  TextBlock,
  TextStyle,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Table,
  StandardFonts,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  pageTemplate,
  Spacer,
  type IElement,
  Heading,
} from '@bonniepdf/core';

// ── Palette ──────────────────────────────────────────────────────────────────

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.indigo[700];

const RULE = ColorPalette.slate[200];

const PANEL = ColorPalette.slate[50];

const STATUS = {
  critical: ColorPalette.rose[700],
  high: ColorPalette.amber[700],
  medium: ColorPalette.blue[700],
  low: ColorPalette.slate[600],
  done: ColorPalette.emerald[700],
} as const;

// ── Formatting ───────────────────────────────────────────────────────────────

const GB_DATE = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Inventory and schedule of condition (class API) ──────────────────────────
//
// The check-in document a lettings or property-management platform issues at
// the start of a tenancy: every room, every item in it, its condition and
// cleanliness on the day, meter readings, keys handed over, and the signatures
// of both parties. At check-out the same document is the reference against
// which deposit deductions are argued.
//
// The **class / construct-then-mutate** companion to
// `inventory-schedule-of-condition.ts`. Same schedule, authored the long way:
// `new` each element and assign its properties one at a time, with the enum
// members rather than their string literals. It renders **byte-for-byte
// identically** to the options-object form (an equivalence test binds the two).
// Reach for the options form first; this variant exists to show what it
// desugars to.

// ── The inspection ───────────────────────────────────────────────────────────

const REPORT = {
  reference: 'INV-2026-1174',
  property: '14 Sample Road, Sample Town, ST4 7QN',
  propertyType: 'Two-bedroom first-floor flat, unfurnished with white goods',
  landlordAgent: 'Sample Lettings Ltd',
  clerk: 'Sample Clerk — Inventory Clerk (IC-0092)',
  tenant: 'Sample Tenant',
  inspected: new Date(Date.UTC(2026, 8, 4, 10, 30)),
  tenancyStart: new Date(Date.UTC(2026, 8, 5)),
  type: 'Check-in',
  weather: 'Dry, 16°C — all rooms inspected in daylight',
};

const ROOMS: Room[] = [
  {
    name: 'Entrance hall',
    items: [
      {
        item: 'Front door, frame and furniture',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Two keys supplied; lock operates freely',
        evidence: 'P-001',
      },
      {
        item: 'Walls and ceiling — magnolia emulsion',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Light scuff to the wall beside the meter cupboard, 40mm',
        evidence: 'P-002',
      },
      {
        item: 'Flooring — engineered oak',
        condition: 'Fair',
        cleanliness: 'Professional',
        notes: 'Two shallow scratches near the threshold, pre-existing',
        evidence: 'P-003',
      },
      {
        item: 'Smoke alarm — ceiling mounted',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Tested in the presence of the tenant; audible',
        evidence: 'P-004',
      },
    ],
  },
  {
    name: 'Living room',
    items: [
      {
        item: 'Walls and ceiling',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'No marks noted',
        evidence: 'P-005',
      },
      {
        item: 'Window, frame and handles',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Opens and locks; trickle vents clear',
        evidence: 'P-006',
      },
      {
        item: 'Carpet — mid grey',
        condition: 'Fair',
        cleanliness: 'Professional',
        notes: 'Slight flattening in the traffic route, no staining',
        evidence: 'P-007',
      },
      {
        item: 'Radiator and thermostatic valve',
        condition: 'Good',
        cleanliness: 'Domestic',
        notes: 'Light dust to the rear fins',
        evidence: 'P-008',
      },
      {
        item: 'Curtain pole and fittings',
        condition: 'Worn',
        cleanliness: 'Domestic',
        notes: 'Finial loose at the left-hand end',
        evidence: 'P-009',
      },
    ],
  },
  {
    name: 'Kitchen',
    items: [
      {
        item: 'Units, doors and handles',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'All doors aligned and closing',
        evidence: 'P-010',
      },
      {
        item: 'Worktop — laminate',
        condition: 'Fair',
        cleanliness: 'Professional',
        notes: 'Two heat marks adjacent to the hob, pre-existing',
        evidence: 'P-011',
      },
      {
        item: 'Oven and hob',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Cleaned to professional standard; all rings tested',
        evidence: 'P-012',
      },
      {
        item: 'Fridge freezer',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Running, seals intact, shelves complete',
        evidence: 'P-013',
      },
      {
        item: 'Sink, taps and waste',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'No drips; waste runs freely',
        evidence: 'P-014',
      },
      {
        item: 'Flooring — vinyl',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Sealed at the perimeter',
        evidence: 'P-015',
      },
    ],
  },
  {
    name: 'Bathroom',
    items: [
      {
        item: 'Bath, shower and screen',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Screen seal intact; shower tested',
        evidence: 'P-016',
      },
      {
        item: 'Basin, taps and waste',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'No drips noted',
        evidence: 'P-017',
      },
      {
        item: 'WC and cistern',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Flushes and refills correctly',
        evidence: 'P-018',
      },
      {
        item: 'Tiling and grout',
        condition: 'Fair',
        cleanliness: 'Professional',
        notes: 'Minor grout discolouration behind the bath taps',
        evidence: 'P-019',
      },
      {
        item: 'Extractor fan',
        condition: 'Good',
        cleanliness: 'Domestic',
        notes: 'Operates on the light switch; grille lightly dusty',
        evidence: 'P-020',
      },
    ],
  },
  {
    name: 'Bedroom 1',
    items: [
      {
        item: 'Walls and ceiling',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Two filled and painted picture-hook holes to the chimney breast',
        evidence: 'P-021',
      },
      { item: 'Carpet', condition: 'Good', cleanliness: 'Professional', notes: 'No marks noted', evidence: 'P-022' },
      {
        item: 'Built-in wardrobe',
        condition: 'Fair',
        cleanliness: 'Professional',
        notes: 'Right-hand door catches slightly on closing',
        evidence: 'P-023',
      },
      {
        item: 'Window and blind',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'Blind raises and lowers evenly',
        evidence: 'P-024',
      },
    ],
  },
  {
    name: 'Bedroom 2',
    items: [
      {
        item: 'Walls and ceiling',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'No marks noted',
        evidence: 'P-025',
      },
      {
        item: 'Carpet',
        condition: 'Damaged',
        cleanliness: 'Professional',
        notes: 'Burn mark approx. 25mm diameter near the radiator — recorded at check-in, not the tenant’s liability',
        evidence: 'P-026, P-027',
      },
      {
        item: 'Radiator and valve',
        condition: 'Good',
        cleanliness: 'Professional',
        notes: 'No leaks noted',
        evidence: 'P-028',
      },
    ],
  },
];

const METERS = [
  { utility: 'Electricity', serial: 'E-88214-A', reading: '41,208 kWh', located: 'Hall meter cupboard' },
  { utility: 'Gas', serial: 'G-55190-C', reading: '9,431 m³', located: 'Hall meter cupboard' },
  { utility: 'Water', serial: 'W-31875-B', reading: '0,772 m³', located: 'External stopcock chamber' },
];

const KEYS = [
  { set: 'Front door — communal', quantity: 2, issuedTo: 'Tenant' },
  { set: 'Flat door', quantity: 2, issuedTo: 'Tenant' },
  { set: 'Window lock', quantity: 1, issuedTo: 'Tenant' },
  { set: 'Bin store fob', quantity: 1, issuedTo: 'Tenant' },
];

const CONDITION_COLOUR: Record<Condition, Color> = {
  Good: STATUS.done,
  Fair: STATUS.medium,
  Worn: STATUS.high,
  Damaged: STATUS.critical,
};

// ── Document ─────────────────────────────────────────────────────────────────

export function generate(): Document {
  const allItems = ROOMS.flatMap(room => room.items);
  const byCondition = new Map<Condition, number>();
  for (const item of allItems) byCondition.set(item.condition, (byCondition.get(item.condition) ?? 0) + 1);

  const settings = new DocumentSettings(PdfSize.a4, 44);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9.5).withColor(INK);
  settings.headerTemplate = pageTemplate({
    firstPage: new Spacer({ height: 0 }),
    default: runningBand(`${REPORT.type} — ${REPORT.reference}`, REPORT.property),
  });
  settings.footerTemplate = pageTemplate({
    default: runningBand(
      'Retain for the tenancy — the check-out is compared against this',
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `${REPORT.type} inventory and schedule of condition — ${REPORT.property}`;
  metadata.author = REPORT.landlordAgent;
  metadata.subject =
    'Tenancy check-in inventory and schedule of condition: room-by-room register, meter readings, keys issued, and both parties’ declarations (sample data).';
  metadata.keywords = 'inventory, schedule of condition, check-in, lettings, tenancy, deposit, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

  // ── Title block ────────────────────────────────────────────────────────────

  doc.add(accentBar());
  doc.add(eyebrow(`${REPORT.type.toUpperCase()} · INVENTORY AND SCHEDULE OF CONDITION`));
  doc.add(h1(REPORT.property));
  doc.add(body(REPORT.propertyType, { color: MUTED, mb: 14 }));

  doc.add(
    fieldRow(
      [
        field('Reference', REPORT.reference),
        field('Inspection type', REPORT.type),
        field('Inspected', `${shortDate(REPORT.inspected)} ${clock(REPORT.inspected)}`),
        field('Tenancy starts', shortDate(REPORT.tenancyStart)),
      ],
      { mb: 6 }
    )
  );

  doc.add(
    fieldRow([
      field('Managing agent', REPORT.landlordAgent),
      field('Prepared by', REPORT.clerk),
      field('Tenant', REPORT.tenant),
      field('Conditions', REPORT.weather),
    ])
  );

  // ── Condition summary ──────────────────────────────────────────────────────

  const tiles = new HorizontalStack();
  tiles.widthDistribution = WidthDistribution.Weighted;
  tiles.spacing = 10;
  tiles.margin = new Thickness(0, 0, 0, 6);
  tiles.add(tile(String(allItems.length), 'Items recorded', ACCENT), 1);
  for (const condition of ['Good', 'Fair', 'Worn', 'Damaged'] as Condition[]) {
    tiles.add(tile(String(byCondition.get(condition) ?? 0), condition, CONDITION_COLOUR[condition]), 1);
  }
  doc.add(tiles);

  doc.add(
    panel('How to read this document', [
      body(
        'Condition describes wear; cleanliness describes how the item was left. Both are recorded as found on the ' +
          'inspection date and are the reference for the check-out comparison.',
        { mb: 3, size: 9 }
      ),
      body(
        'Anything recorded here as Worn or Damaged existed before the tenancy began and is not the tenant’s ' +
          'liability. Fair wear and tear over the term is expected and is not a deduction.',
        { mb: 0, size: 9 }
      ),
    ])
  );

  // ── Room-by-room register ──────────────────────────────────────────────────

  if (ROOMS.length === 0) {
    doc.add(h2('Room-by-room schedule'));
  } else {
    let firstRoom = true;
    for (const room of ROOMS) {
      const roomStack = new VerticalStack();
      roomStack.breakAllowed = false;
      if (firstRoom) {
        roomStack.add(h2('Room-by-room schedule'));
        firstRoom = false;
      }
      roomStack.add(h3(room.name));

      const table = new Table(3.1, 1.1, 1.3, 4.2, 0.95);
      table.cellPadding = 5;
      table.border = new Border(0.5);
      table.borderColors = new BorderColors(RULE);
      table.headerBackgroundColor = ACCENT;
      table.headerTextColor = Color.white;
      table.addHeader(th('Item'), th('Condition'), th('Cleanliness'), th('Notes as found'), th('Plate'));
      for (const item of room.items) {
        table.addRow(
          td(item.item),
          statusCell(item.condition, CONDITION_COLOUR[item.condition]),
          td(item.cleanliness, { color: MUTED }),
          td(item.notes),
          td(item.evidence, { color: MUTED })
        );
      }
      roomStack.add(table);
      doc.add(roomStack);
    }
  }

  // ── Meters and keys ────────────────────────────────────────────────────────

  const metersStack = new VerticalStack();
  metersStack.breakAllowed = false;
  metersStack.add(h2('Meter readings'));

  const meters = new Table(1.4, 1.6, 1.6, 2.4);
  meters.cellPadding = 6;
  meters.border = new Border(0.5);
  meters.borderColors = new BorderColors(RULE);
  meters.headerBackgroundColor = ACCENT;
  meters.headerTextColor = Color.white;
  meters.addHeader(th('Utility'), th('Serial number'), th('Reading at check-in'), th('Location'));
  for (const meter of METERS) {
    meters.addRow(
      td(meter.utility),
      td(meter.serial),
      td(meter.reading, { bold: true }),
      td(meter.located, { color: MUTED })
    );
  }
  metersStack.add(meters);
  doc.add(metersStack);

  const keysStack = new VerticalStack();
  keysStack.breakAllowed = false;
  keysStack.add(h2('Keys issued'));

  const keys = new Table(3, 1, 1.6);
  keys.cellPadding = 6;
  keys.border = new Border(0.5);
  keys.borderColors = new BorderColors(RULE);
  keys.headerBackgroundColor = ACCENT;
  keys.headerTextColor = Color.white;
  keys.addHeader(th('Key or fob'), th('Quantity'), th('Issued to'));
  for (const key of KEYS) {
    keys.addRow(td(key.set), td(String(key.quantity)), td(key.issuedTo, { color: MUTED }));
  }
  keysStack.add(keys);
  doc.add(keysStack);

  // ── Declarations ───────────────────────────────────────────────────────────

  doc.add(h2('Declarations'));
  doc.add(
    body(
      'The clerk confirms that this schedule records the condition of the property as found on the inspection ' +
        'date. The tenant confirms that they have received a copy, have had the opportunity to inspect the ' +
        'property, and either agree with its contents or have notified the agent of any disagreement in writing.',
      { color: MUTED, size: 9 }
    )
  );

  doc.add(
    panel(
      'Period for comment',
      [
        body(
          'Any disagreement with this schedule must be notified to the managing agent in writing within seven days ' +
            'of the tenancy start date. After that period the schedule is taken as agreed for the purpose of the ' +
            'check-out comparison.',
          { mb: 0, size: 9 }
        ),
      ],
      { accent: STATUS.high }
    )
  );

  doc.add(
    signatureRow([
      signatureSlot('Inventory clerk', REPORT.clerk, { dated: shortDate(REPORT.inspected) }),
      signatureSlot('Tenant', REPORT.tenant),
      signatureSlot('Managing agent', `${REPORT.landlordAgent} — authorised signatory`),
    ])
  );

  doc.add(
    body(
      `${REPORT.reference} · photographic plates P-001 to P-028 are issued as a separate annexe under the same ` +
        'references and form part of this schedule.',
      { color: MUTED, size: 8, mt: 10, mb: 0 }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

type Condition = 'Good' | 'Fair' | 'Worn' | 'Damaged';

type Cleanliness = 'Professional' | 'Domestic' | 'Poor';

interface Item {
  item: string;
  condition: Condition;
  cleanliness: Cleanliness;
  notes: string;
  evidence: string;
}

interface Room {
  name: string;
  items: Item[];
}

// ── Local helpers ────────────────────────────────────────────────────────────

function clock(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d);
}

function runningBand(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;

  const l = new TextBlock(left);
  l.fontName = StandardFonts.Helvetica;
  l.fontSize = 7.5;
  l.color = MUTED;
  row.add(l, 2.5);

  const r = new TextBlock(right);
  r.fontName = StandardFonts.Helvetica;
  r.fontSize = 7.5;
  r.color = MUTED;
  r.alignment = TextAlignment.Right;
  row.add(r, 2);

  return row;
}

function tile(value: string, label: string, accent: Color): Container {
  const stack = new VerticalStack();

  const headline = new TextBlock(value);
  headline.fontName = StandardFonts.HelveticaBold;
  headline.fontSize = 16;
  headline.color = accent;
  headline.margin = new Thickness(0, 0, 0, 2);
  stack.add(headline);

  const caption = new TextBlock(label);
  caption.fontName = StandardFonts.Helvetica;
  caption.fontSize = 8;
  caption.color = MUTED;
  stack.add(caption);

  const box = new Container();
  box.backgroundColor = ColorPalette.slate[50];
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(11, 10);
  box.child = stack;
  return box;
}

// Local helpers keep this example ready to copy into a single file.

// ── Text ─────────────────────────────────────────────────────────────────────

function eyebrow(text: string, color: Color = ACCENT): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.HelveticaBold;
  block.fontSize = 8.5;
  block.color = color;
  block.margin = new Thickness(0, 0, 0, 4);
  return block;
}

function h1(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 1;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 21;
  heading.color = HEADING;
  heading.margin = new Thickness(0, 0, 0, 6);
  return heading;
}

function h2(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.color = ACCENT;
  heading.margin = new Thickness(0, 14, 0, 8);
  return heading;
}

function h3(text: string): Heading {
  const heading = new Heading(text);
  heading.level = 3;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 10.5;
  heading.color = HEADING;
  heading.margin = new Thickness(0, 8, 0, 5);
  return heading;
}

function body(text: string, opts: { color?: Color; mb?: number; mt?: number; size?: number } = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.Helvetica;
  block.fontSize = opts.size ?? 9.5;
  block.color = opts.color ?? INK;
  block.margin = new Thickness(0, opts.mt ?? 0, 0, opts.mb ?? 8);
  return block;
}

/** Table header cell — white on the accent header band. */
function th(text: string): TextBlock {
  const block = new TextBlock(text);
  block.fontName = StandardFonts.HelveticaBold;
  block.fontSize = 8.5;
  block.color = Color.white;
  return block;
}

/** Table body cell. */
function td(text: string, opts: { color?: Color; bold?: boolean; size?: number } = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = opts.size ?? 8.5;
  block.color = opts.color ?? INK;
  return block;
}

function accentBar(color: Color = ACCENT, height = 3): Container {
  const bar = new Container();
  bar.backgroundColor = color;
  bar.height = height;
  bar.margin = new Thickness(0, 0, 0, 14);
  return bar;
}

/** One label/value pair in the metadata grid. */
function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();

  const key = new TextBlock(label.toUpperCase());
  key.fontName = StandardFonts.HelveticaBold;
  key.fontSize = 6.5;
  key.color = MUTED;
  key.margin = new Thickness(0, 0, 0, 2);
  stack.add(key);

  const val = new TextBlock(value);
  val.fontName = StandardFonts.Helvetica;
  val.fontSize = 9.5;
  val.color = INK;
  stack.add(val);

  return stack;
}

function fieldRow(fields: IElement[], opts: { mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 14;
  row.margin = new Thickness(0, 2, 0, opts.mb ?? 14);
  for (const f of fields) row.add(f, 1);
  return row;
}

function panel(title: string, children: IElement[], opts: { accent?: Color } = {}): Container {
  const stack = new VerticalStack();
  stack.spacing = 4;

  const caption = new TextBlock(title);
  caption.fontName = StandardFonts.HelveticaBold;
  caption.fontSize = 9.5;
  caption.color = opts.accent ?? ACCENT;
  caption.margin = new Thickness(0, 0, 0, 4);
  stack.add(caption);
  for (const child of children) stack.add(child);

  const box = new Container();
  box.backgroundColor = PANEL;
  box.border = new Border(0.75);
  box.borderColors = new BorderColors(RULE);
  box.cornerRadius = 6;
  box.padding = new Thickness(12);
  box.margin = new Thickness(0, 0, 0, 12);
  box.child = stack;
  return box;
}

/** A coloured status/severity pill for a table cell. */
function statusCell(text: string, color: Color): Container {
  const label = new TextBlock(text);
  label.fontName = StandardFonts.HelveticaBold;
  label.fontSize = 8;
  label.color = color;

  const box = new Container();
  box.child = label;
  return box;
}

// ── Signature blocks ─────────────────────────────────────────────────────────

function signatureSlot(role: string, name: string, opts: { dated?: string } = {}): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 0;

  const caption = new TextBlock(role.toUpperCase());
  caption.fontName = StandardFonts.HelveticaBold;
  caption.fontSize = 6.5;
  caption.color = MUTED;
  caption.margin = new Thickness(0, 0, 0, 18);
  stack.add(caption);

  // The rule people actually sign on.
  const rule = new Container();
  rule.backgroundColor = ColorPalette.slate[400];
  rule.height = 0.75;
  rule.margin = new Thickness(0, 0, 0, 5);
  stack.add(rule);

  const who = new TextBlock(name);
  who.fontName = StandardFonts.Helvetica;
  who.fontSize = 9;
  who.color = INK;
  stack.add(who);

  const when = new TextBlock(opts.dated ? `Date: ${opts.dated}` : 'Date:');
  when.fontName = StandardFonts.Helvetica;
  when.fontSize = 8;
  when.color = MUTED;
  when.margin = new Thickness(0, 3, 0, 0);
  stack.add(when);

  return stack;
}

function signatureRow(slots: IElement[]): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 22;
  row.margin = new Thickness(0, 10, 0, 4);
  // A signature row is never split between pages.
  row.breakAllowed = false;
  for (const s of slots) row.add(s, 1);
  return row;
}

function shortDate(d: Date): string {
  return GB_DATE.format(d);
}
