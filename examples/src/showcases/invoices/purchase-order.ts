// ── Purchase order ───────────────────────────────────────────────────────────
//
// The other half of the invoice, and the half almost no PDF library shows: the
// document a buyer issues to commit to a purchase. Procurement systems generate
// these in volume, they carry the reference every subsequent invoice must quote,
// and they are the artefact an approval workflow produces — so they carry an
// authorisation block rather than a payment block.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations, references, and
// amounts throughout.

import { Document, TextElementBase, Container, VerticalStack, Table } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  accentBar,
  band,
  cell,
  divider,
  field,
  gbDate,
  h1,
  h2,
  money,
  panel,
  partyBlock,
  td,
  th,
  totalLine,
  totalsPanel,
  weightedRow,
} from './_trade-kit';

const ORDER = {
  number: 'PO-2026-004871',
  revision: 'Rev. 0 — original issue',
  raised: new Date(Date.UTC(2026, 8, 2)),
  required: new Date(Date.UTC(2026, 8, 23)),
  buyer: ['Sample Buyer Ltd', 'Procurement Department', '5 Sample Avenue', 'Sample City', 'SC1 3RG'],
  supplier: ['Sample Supplier Ltd', '12 Sample Street', 'Sample City', 'SC2 9BD'],
  deliverTo: ['Sample Buyer Ltd', 'Goods Inwards, Gate 3', 'Sample Distribution Centre', 'Sample Town', 'ST9 2LD'],
  currency: 'GBP',
  terms: '30 days net from date of valid invoice',
  incoterms: 'DAP — Sample Distribution Centre',
  requisition: 'REQ-2026-1188',
  costCentre: 'CC-4420 — Facilities',
  raisedBy: 'Sample Buyer — Buyer',
  approvedBy: 'Sample Manager — Head of Procurement',
  vatRate: 0.2,
};

interface OrderLine {
  line: number;
  partCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  required: string;
}

const LINES: OrderLine[] = [
  {
    line: 1,
    partCode: 'FLT-G4-592',
    description: 'Panel filter G4, 592 × 592 × 48mm',
    quantity: 48,
    unit: 'each',
    unitPrice: 11.25,
    required: '23 Sep 2026',
  },
  {
    line: 2,
    partCode: 'BRG-6204-2RS',
    description: 'Sealed deep-groove bearing, 20mm bore',
    quantity: 24,
    unit: 'each',
    unitPrice: 18.4,
    required: '23 Sep 2026',
  },
  {
    line: 3,
    partCode: 'BLT-SPZ-1287',
    description: 'Drive belt, SPZ section, 1287mm',
    quantity: 12,
    unit: 'each',
    unitPrice: 22.9,
    required: '23 Sep 2026',
  },
  {
    line: 4,
    partCode: 'SEAL-AHU-12',
    description: 'Access door seal, 12mm closed cell, per metre',
    quantity: 60,
    unit: 'metre',
    unitPrice: 9.6,
    required: '30 Sep 2026',
  },
  {
    line: 5,
    partCode: 'LUB-SYN-5L',
    description: 'Synthetic bearing lubricant, 5 litre',
    quantity: 4,
    unit: 'each',
    unitPrice: 64.0,
    required: '30 Sep 2026',
  },
  {
    line: 6,
    partCode: 'PPE-GLV-CR5',
    description: 'Cut-resistant gloves, level 5, size L',
    quantity: 40,
    unit: 'pair',
    unitPrice: 7.85,
    required: '23 Sep 2026',
  },
];

export function generate(): Document {
  const net = LINES.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = net * ORDER.vatRate;

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 46,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      headerTemplate: (pageNumber: number) =>
        pageNumber === 1 ? undefined : band(`Purchase order ${ORDER.number}`, ORDER.revision),
      footerTemplate: (pageNumber: number) =>
        band(
          `Quote ${ORDER.number} on all invoices, delivery notes, and correspondence`,
          `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
        ),
    },
    metadata: {
      title: `Purchase order ${ORDER.number}`,
      author: 'Sample Buyer Ltd',
      subject:
        'Purchase order with line schedule, delivery instructions, order terms, and authorisation (sample data).',
      keywords: 'purchase order, procurement, buying, supply chain, pdf/ua, pdf/a',
    },
  });

  doc.add(accentBar());
  doc.add(cell('PURCHASE ORDER', { bold: true, size: 8.5, color: ACCENT, mb: 4 }));
  doc.add(h1(`Order ${ORDER.number}`));
  doc.add(cell(ORDER.revision, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Order date', gbDate(ORDER.raised)),
        field('Required by', gbDate(ORDER.required)),
        field('Requisition', ORDER.requisition),
        field('Cost centre', ORDER.costCentre),
      ],
      { mb: 6 }
    )
  );
  doc.add(
    weightedRow([
      field('Currency', ORDER.currency),
      field('Payment terms', ORDER.terms),
      field('Delivery terms', ORDER.incoterms),
      field('Raised by', ORDER.raisedBy),
    ])
  );

  doc.add(
    weightedRow(
      [
        partyBlock('Order to', ORDER.supplier),
        partyBlock('Invoice to', ORDER.buyer),
        partyBlock('Deliver to', ORDER.deliverTo),
      ],
      { spacing: 20, mb: 4 }
    )
  );

  doc.add(h2('Order lines'));

  const table = new Table({
    columns: [0.5, 1.5, 3.6, 0.8, 0.8, 1.1, 1.2, 1.2],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    th('#'),
    th('Part code'),
    th('Description'),
    th('Qty'),
    th('Unit'),
    th('Unit price', 'right'),
    th('Line total', 'right'),
    th('Required')
  );
  for (const line of LINES) {
    table.addRow(
      td(String(line.line)),
      td(line.partCode),
      td(line.description),
      td(String(line.quantity)),
      td(line.unit, { color: MUTED }),
      td(money(line.unitPrice), { align: 'right' }),
      td(money(line.quantity * line.unitPrice), { align: 'right', bold: true }),
      td(line.required, { color: MUTED })
    );
  }
  doc.add(table);

  doc.add(
    totalsPanel([
      totalLine('Order net', money(net)),
      totalLine(`VAT at ${(ORDER.vatRate * 100).toFixed(0)}%`, money(vat)),
      divider(),
      totalLine('Order total', money(net + vat), { bold: true, size: 11, color: ACCENT }),
    ])
  );

  doc.add(h2('Order terms'));
  doc.add(
    panel('Conditions of purchase', [
      cell(
        'This order is placed on the buyer’s standard conditions of purchase, which prevail over any terms the ' +
          'supplier proposes unless varied in writing by the buyer’s procurement department.',
        { size: 9, mb: 3 }
      ),
      cell(
        'Deliveries are accepted only at the address shown, between 07:00 and 15:00 on working days, and must be ' +
          'accompanied by a delivery note quoting this order number and the relevant line numbers.',
        { size: 9, mb: 3 }
      ),
      cell(
        'Part deliveries are accepted. Invoices that do not quote this order number will be returned unpaid. ' +
          'Quantities delivered in excess of those ordered may be returned at the supplier’s cost.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  doc.add(h2('Authorisation'));
  doc.add(
    cell('Raised and approved within the delegated authority for this cost centre.', {
      size: 9,
      color: MUTED,
      mb: 8,
    })
  );
  doc.add(
    weightedRow(
      [
        authSlot('Raised by', ORDER.raisedBy, gbDate(ORDER.raised)),
        authSlot('Approved by', ORDER.approvedBy, gbDate(ORDER.raised)),
        authSlot('Supplier acknowledgement', 'Name, signature and date', ''),
      ],
      { spacing: 22, mb: 0 }
    )
  );

  return doc;
}

function authSlot(role: string, name: string, dated: string): VerticalStack {
  return new VerticalStack({
    children: [
      cell(role.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 18 }),
      new Container({ backgroundColor: RULE, height: 0.75, margin: { bottom: 5 } }),
      cell(name, { size: 9 }),
      cell(dated ? `Date: ${dated}` : 'Date:', { size: 8, color: MUTED, mt: 3 }),
    ],
  });
}
