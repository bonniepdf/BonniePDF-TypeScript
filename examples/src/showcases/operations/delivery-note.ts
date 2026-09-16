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

import { Document, TextElementBase, Container, VerticalStack, Table } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  POSITIVE,
  NEGATIVE,
  accentBar,
  band,
  cell,
  field,
  gbDate,
  h1,
  h2,
  panel,
  partyBlock,
  td,
  th,
  tile,
  weightedRow,
} from '../invoices/_trade-kit';

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

interface DeliveryLine {
  orderLine: number;
  partCode: string;
  description: string;
  ordered: number;
  despatched: number;
  unit: string;
  packedIn: string;
}

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
      footerTemplate: (pageNumber: number) =>
        band(
          `Delivery note ${DELIVERY.number} · order ${DELIVERY.orderNumber} · this is not an invoice`,
          `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
        ),
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

  if (backOrdered.length > 0) {
    doc.add(
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
      )
    );
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

  doc.add(
    panel('Discrepancies', [
      cell(
        'Shortages, damage, or incorrect items must be noted on this delivery note at the point of delivery and ' +
          'reported to the supplier within three working days, quoting the delivery note number.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  return doc;
}

function receiptSlot(role: string, hint: string): VerticalStack {
  return new VerticalStack({
    children: [
      cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 20 }),
      new Container({ backgroundColor: RULE, height: 0.75, margin: { bottom: 5 } }),
      cell(hint, { size: 8, color: MUTED }),
    ],
  });
}
