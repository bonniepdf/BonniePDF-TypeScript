/**
 * Delivery Note.
 * A one-page delivery note: ordered, despatched, and to-follow quantities for part-shipments, a package breakdown, items to follow beside the discrepancy period, and a goods-received signature.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  Table,
  pageTemplate,
  TextBlock,
  Heading,
  HorizontalStack,
  StandardFonts,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.emerald[700];

const RULE = ColorPalette.slate[200];

const POSITIVE = ColorPalette.emerald[700];

const NEGATIVE = ColorPalette.rose[700];

// ── Delivery note / packing slip ─────────────────────────────────────────────
//
// What travels with the goods. It completes the fulfilment story the shipping
// label starts: the label gets the parcel to the door, the delivery note tells
// goods-inwards what is supposed to be inside it and gives them somewhere to
// record what actually was.
//
// The detail that makes it a real document rather than a table: quantities are
// ordered, despatched, and back-ordered as three separate columns, because a
// part-shipment is the normal case and a delivery note that cannot express one
// is useless. It ends with a goods-received signature and a discrepancy notice
// period.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations and references
// throughout.

const DELIVERY = {
  number: 'DN-2026-018844',
  despatched: new Date(Date.UTC(2026, 8, 18)),
  orderNumber: 'PO-2026-004871',
  account: 'ACC-004182',
  carrier: 'Sample Carrier — next working day',
  consignment: 'C-8841-2026',
  packages: 4,
  grossWeight: '38.6 kg',
  from: ['Sample Supplier Ltd', 'Despatch Bay 2', 'Sample Industrial Estate', 'Sample City', 'SC2 9BD'],
  to: ['Sample Buyer Ltd', 'Goods Inwards, Gate 3', 'Sample Distribution Centre', 'Sample Town', 'ST9 2LD'],
  hours: 'Deliveries accepted 07:00–15:00, working days only',
};

const LINES: DeliveryLine[] = [
  {
    orderLine: 1,
    partCode: 'FLT-G4-592',
    description: 'Panel filter G4, 592 × 592 × 48mm',
    ordered: 48,
    despatched: 48,
    unit: 'each',
    packedIn: 'Pallet 1',
  },
  {
    orderLine: 2,
    partCode: 'BRG-6204-2RS',
    description: 'Sealed deep-groove bearing, 20mm bore',
    ordered: 24,
    despatched: 24,
    unit: 'each',
    packedIn: 'Carton 1',
  },
  {
    orderLine: 3,
    partCode: 'BLT-SPZ-1287',
    description: 'Drive belt, SPZ section, 1287mm',
    ordered: 12,
    despatched: 8,
    unit: 'each',
    packedIn: 'Carton 1',
  },
  {
    orderLine: 4,
    partCode: 'SEAL-AHU-12',
    description: 'Access door seal, 12mm closed cell',
    ordered: 60,
    despatched: 60,
    unit: 'metre',
    packedIn: 'Carton 2',
  },
  {
    orderLine: 5,
    partCode: 'LUB-SYN-5L',
    description: 'Synthetic bearing lubricant, 5 litre',
    ordered: 4,
    despatched: 0,
    unit: 'each',
    packedIn: '—',
  },
  {
    orderLine: 6,
    partCode: 'PPE-GLV-CR5',
    description: 'Cut-resistant gloves, level 5, size L',
    ordered: 40,
    despatched: 40,
    unit: 'pair',
    packedIn: 'Carton 3',
  },
];

export function generate(): Document {
  const complete = LINES.filter(l => l.despatched === l.ordered).length;
  const backOrdered = LINES.filter(l => l.despatched < l.ordered);
  const units = LINES.reduce((sum, l) => sum + l.despatched, 0);

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
          `Delivery note ${DELIVERY.number} · order ${DELIVERY.orderNumber} · this is not an invoice`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Delivery note ${DELIVERY.number} — order ${DELIVERY.orderNumber}`,
      author: 'Sample Supplier Ltd',
      subject:
        'Delivery note and packing slip: ordered, despatched and back-ordered quantities, package breakdown, and goods-received signature (sample data).',
      keywords: 'delivery note, packing slip, despatch, goods inwards, logistics, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('DELIVERY NOTE · PACKING SLIP', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Delivery ${DELIVERY.number}`));
  doc.add(cell('This is not an invoice. No payment is due against this document.', { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Despatched', gbDate(DELIVERY.despatched)),
        field('Your order', DELIVERY.orderNumber),
        field('Account', DELIVERY.account),
        field('Consignment', DELIVERY.consignment),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow([
      field('Carrier', DELIVERY.carrier),
      field('Packages', String(DELIVERY.packages)),
      field('Gross weight', DELIVERY.grossWeight),
      field('Delivery hours', DELIVERY.hours),
    ])
  );

  doc.add(
    weightedRow([partyBlock('Despatched from', DELIVERY.from), partyBlock('Delivered to', DELIVERY.to)], {
      spacing: 20,
      mb: 4,
    })
  );

  const tiles = weightedRow(
    [
      tile(String(LINES.length), 'Order lines'),
      tile(String(complete), 'Complete', POSITIVE),
      tile(String(backOrdered.length), 'Part or back-ordered', backOrdered.length ? NEGATIVE : POSITIVE),
      tile(String(units), 'Units despatched'),
    ],
    { spacing: 10, mb: 4 }
  );
  doc.add(tiles);

  doc.add(h2('Contents'));

  const table = new Table({
    columns: [0.6, 1.5, 3.6, 0.9, 1.05, 1.05, 0.8, 1],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    th('#'),
    th('Part code'),
    th('Description'),
    th('Ordered', 'right'),
    th('Despatched', 'right'),
    th('To follow', 'right'),
    th('Unit'),
    th('Packed in')
  );
  for (const line of LINES) {
    const toFollow = line.ordered - line.despatched;
    table.addRow(
      td(String(line.orderLine)),
      td(line.partCode),
      td(line.description),
      td(String(line.ordered), { align: 'right' }),
      td(String(line.despatched), { align: 'right', bold: true }),
      td(toFollow === 0 ? '—' : String(toFollow), {
        align: 'right',
        bold: toFollow > 0,
        color: toFollow > 0 ? NEGATIVE : MUTED,
      }),
      td(line.unit, { color: MUTED }),
      td(line.packedIn, { color: MUTED })
    );
  }
  doc.add(table);

  // What to report sits beside what is still to come, so the note stays on one page.
  const discrepancies = panel('Discrepancies', [
    cell(
      'Shortages, damage, or incorrect items must be noted on this delivery note at the point of delivery and ' +
        'reported to the supplier within three working days, quoting the delivery note number.',
      { size: 9, mb: 0 }
    ),
  ]);
  if (backOrdered.length > 0) {
    doc.add(
      weightedRow(
        [
          panel(
            'Items to follow',
            [
              ...backOrdered.map(line =>
                cell(
                  `Line ${line.orderLine} · ${line.partCode} — ${line.ordered - line.despatched} ${line.unit} to follow ` +
                    'on a later delivery against the same order.',
                  { size: 9, mb: 3 }
                )
              ),
              cell('Back-ordered items are not invoiced until they are despatched.', { size: 9, color: MUTED, mb: 0 }),
            ],
            { accent: NEGATIVE }
          ),
          discrepancies,
        ],
        { mb: 0 }
      )
    );
  } else {
    doc.add(discrepancies);
  }

  doc.add(h2('Goods received'));
  doc.add(
    cell(
      'Please check the contents against this note before signing. Signing acknowledges the number of packages ' +
        'received and their apparent condition; it is not acceptance of the contents until they are checked.',
      { size: 9, color: MUTED, mb: 8 }
    )
  );

  doc.add(
    weightedRow(
      [receiptSlot('Received by', 'Name in capitals'), receiptSlot('Signature', ''), receiptSlot('Date and time', '')],
      { spacing: 22, mb: 6 }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

interface DeliveryLine {
  orderLine: number;
  partCode: string;
  description: string;
  ordered: number;
  despatched: number;
  unit: string;
  packedIn: string;
}

function receiptSlot(role: string, hint: string): VerticalStack {
  return new VerticalStack({
    children: [
      cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 14 }),
      new Container({ backgroundColor: RULE, height: 0.75, margin: { bottom: 5 } }),
      cell(hint, { size: 8, color: MUTED }),
    ],
  });
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

/** A block of plain lines (an address), tagged as one paragraph. */
function lines(items: string[], o: TextOpts = {}): TextBlock {
  return cell(items.join('\n'), o);
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

/** A labelled address block. */
function partyBlock(label: string, address: string[]): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 7, color: MUTED, mb: 3 }), lines(address, { size: 9 })],
  });
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

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}
