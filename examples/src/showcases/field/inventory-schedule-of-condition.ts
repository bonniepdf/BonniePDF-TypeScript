// ── Inventory and schedule of condition ──────────────────────────────────────
//
// The check-in document a lettings or property-management platform issues at
// the start of a tenancy: every room, every item in it, its condition and
// cleanliness on the day, meter readings, keys handed over, and the signatures
// of both parties. At check-out the same document is the reference against
// which deposit deductions are argued — which is why it is written to be
// unambiguous rather than brief.
//
// Structurally this is the same register as the site inspection report and it
// shares that family's kit. The differences are the ones that matter to a
// letting agent: the register is grouped by room rather than flat, condition
// and cleanliness are separate gradings, and the document ends with a tenant
// declaration and a limitation-period notice.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample property, people, and
// references throughout.

import {
  Document,
  TextBlock,
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
} from './_kit';

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

const CONDITION_COLOUR: Record<Condition, ColorInput> = {
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

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      headerTemplate: (pageNumber: number) =>
        pageNumber === 1 ? undefined : runningBand(`${REPORT.type} — ${REPORT.reference}`, REPORT.property),
      footerTemplate: (pageNumber: number) =>
        runningBand(
          'Retain for the tenancy — the check-out is compared against this',
          `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
        ),
    },
    metadata: {
      title: `${REPORT.type} inventory and schedule of condition — ${REPORT.property}`,
      author: REPORT.landlordAgent,
      subject:
        'Tenancy check-in inventory and schedule of condition: room-by-room register, meter readings, keys issued, and both parties’ declarations (sample data).',
      keywords: 'inventory, schedule of condition, check-in, lettings, tenancy, deposit, pdf/ua, pdf/a',
    },
  });

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

  const tiles = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10, margin: { bottom: 6 } });
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

  doc.add(h2('Room-by-room schedule'));

  for (const room of ROOMS) {
    doc.add(h3(room.name));

    const table = new Table({
      columns: [3.1, 1.1, 1.3, 4.2, 0.95],
      cellPadding: 5,
      border: { width: 0.5, color: RULE },
      headerBackgroundColor: ACCENT,
      headerTextColor: '#ffffff',
    });
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
    doc.add(table);
  }

  // ── Meters and keys ────────────────────────────────────────────────────────

  doc.add(h2('Meter readings'));

  const meters = new Table({
    columns: [1.4, 1.6, 1.6, 2.4],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  meters.addHeader(th('Utility'), th('Serial number'), th('Reading at check-in'), th('Location'));
  for (const meter of METERS) {
    meters.addRow(
      td(meter.utility),
      td(meter.serial),
      td(meter.reading, { bold: true }),
      td(meter.located, { color: MUTED })
    );
  }
  doc.add(meters);

  doc.add(h2('Keys issued'));

  const keys = new Table({
    columns: [3, 1, 1.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  keys.addHeader(th('Key or fob'), th('Quantity'), th('Issued to'));
  for (const key of KEYS) {
    keys.addRow(td(key.set), td(String(key.quantity)), td(key.issuedTo, { color: MUTED }));
  }
  doc.add(keys);

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
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(new TextBlock(left, { fontName: StandardFonts.Helvetica, fontSize: 7.5, textColor: MUTED }), 2.5);
  row.add(
    new TextBlock(right, {
      fontName: StandardFonts.Helvetica,
      fontSize: 7.5,
      textColor: MUTED,
      alignment: 'right',
    }),
    2
  );
  return row;
}

function tile(value: string, label: string, accent: ColorInput): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: [11, 10],
    child: new VerticalStack({
      children: [
        new TextBlock(value, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 16,
          textColor: accent,
          margin: { bottom: 2 },
        }),
        new TextBlock(label, { fontName: StandardFonts.Helvetica, fontSize: 8, textColor: MUTED }),
      ],
    }),
  });
}
