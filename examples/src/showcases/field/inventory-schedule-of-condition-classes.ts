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
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  STATUS,
  accentBar,
  body,
  eyebrow,
  field,
  fieldRow,
  h1,
  h2,
  h3,
  panel,
  shortDate,
  signatureRow,
  signatureSlot,
  statusCell,
  td,
  th,
} from './_kit-classes';

// ── The inspection ───────────────────────────────────────────────────────────

const REPORT = {
  reference: 'INV-2026-1174',
  property: '14 Sample Road, Sample Town, ST4 7QN',
  propertyType: 'Two-bedroom first-floor flat, unfurnished with white goods',
  landlordAgent: 'Sample Lettings Ltd',
  clerk: 'D. Novak — Inventory Clerk (IC-0092)',
  tenant: 'K. Aliyev',
  inspected: new Date(Date.UTC(2026, 8, 4, 10, 30)),
  tenancyStart: new Date(Date.UTC(2026, 8, 5)),
  type: 'Check-in',
  weather: 'Dry, 16°C — all rooms inspected in daylight',
};

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
  settings.headerTemplate = (pageNumber: number): IElement | undefined =>
    pageNumber === 1 ? undefined : runningBand(`${REPORT.type} — ${REPORT.reference}`, REPORT.property);
  settings.footerTemplate = (pageNumber: number): IElement =>
    runningBand(
      'Retain for the tenancy — the check-out is compared against this',
      `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
    );

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
  l.textColor = MUTED;
  row.add(l, 2.5);

  const r = new TextBlock(right);
  r.fontName = StandardFonts.Helvetica;
  r.fontSize = 7.5;
  r.textColor = MUTED;
  r.alignment = TextAlignment.Right;
  row.add(r, 2);

  return row;
}

function tile(value: string, label: string, accent: Color): Container {
  const stack = new VerticalStack();

  const headline = new TextBlock(value);
  headline.fontName = StandardFonts.HelveticaBold;
  headline.fontSize = 16;
  headline.textColor = accent;
  headline.margin = new Thickness(0, 0, 0, 2);
  stack.add(headline);

  const caption = new TextBlock(label);
  caption.fontName = StandardFonts.Helvetica;
  caption.fontSize = 8;
  caption.textColor = MUTED;
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
