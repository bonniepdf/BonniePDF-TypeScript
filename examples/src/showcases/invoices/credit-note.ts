// ── Credit note ──────────────────────────────────────────────────────────────
//
// The correcting document: what was over-charged on an earlier invoice, why, and
// how the credit is applied. Every billing system issues them, few example
// catalogues show one, and the details that matter are the ones an auditor looks
// for — the original invoice reference, the reason code, the VAT treatment of
// the reversal, and whether the money is refunded or offset.
//
// The visual grammar is the invoice's, deliberately: a credit note that does not
// look like the invoice it corrects is harder to reconcile. The signal that this
// is a reversal is the colour of the totals and the sign on every amount.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample organisations, references, and
// amounts throughout.

import { Document, TextElementBase, Table, pageTemplate } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  NEGATIVE,
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

const NOTE = {
  number: 'CRN-2026-0118',
  issued: new Date(Date.UTC(2026, 7, 11)),
  againstInvoice: 'INV-2026-3340',
  invoiceDated: new Date(Date.UTC(2026, 7, 7)),
  account: 'ACC-004182',
  reasonCode: 'CR-04 — Billed in error',
  supplier: ['Sample Supplier Ltd', '12 Sample Street', 'Sample City', 'SC2 9BD', 'VAT GB 000 0000 00'],
  customer: ['Sample Customer Ltd', 'Unit 7, Sample Business Park', 'Sample Town', 'SA1 4TP'],
  treatment: 'Offset against the account balance',
  approvedBy: 'P. Ahmadi — Credit Control',
  vatRate: 0.2,
};

interface CreditLine {
  originalLine: string;
  description: string;
  reason: string;
  quantity: number;
  unitPrice: number;
}

const LINES: CreditLine[] = [
  {
    originalLine: 'Line 3',
    description: 'Collaboration module — annual licence',
    reason: 'Duplicated on the original invoice; the same licence appears on line 2',
    quantity: 1,
    unitPrice: 280.0,
  },
  {
    originalLine: 'Line 6',
    description: 'Additional storage — 500GB',
    reason: 'Billed at the list rate; the contracted rate under schedule 2 applies',
    quantity: 1,
    unitPrice: 70.0,
  },
];

export function generate(): Document {
  const net = LINES.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = net * NOTE.vatRate;
  const total = net + vat;

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
          `Credit note ${NOTE.number} against invoice ${NOTE.againstInvoice}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `Credit note ${NOTE.number} — against invoice ${NOTE.againstInvoice}`,
      author: 'Sample Supplier Ltd',
      subject:
        'Credit note against an earlier invoice: corrected lines with reasons, VAT reversal, and how the credit is applied (sample data).',
      keywords: 'credit note, credit memo, billing correction, vat, accounts receivable, pdf/ua, pdf/a',
    },
  });

  // The accent is the reversal colour, not the house indigo: a credit note read
  // at a glance must not be mistaken for another invoice.
  doc.add(accentBar(NEGATIVE));
  doc.add(cell('CREDIT NOTE', { bold: true, size: 8.5, color: NEGATIVE, mb: 4 }));
  doc.add(h1(`Credit note ${NOTE.number}`));
  doc.add(cell(`Against invoice ${NOTE.againstInvoice} dated ${gbDate(NOTE.invoiceDated)}`, { color: MUTED, mb: 14 }));

  doc.add(
    weightedRow(
      [
        field('Credit note date', gbDate(NOTE.issued)),
        field('Account', NOTE.account),
        field('Original invoice', NOTE.againstInvoice),
        field('Reason code', NOTE.reasonCode),
      ],
      { mb: 6 }
    )
  );

  doc.add(weightedRow([partyBlock('From', NOTE.supplier), partyBlock('Credit to', NOTE.customer)], { spacing: 20 }));

  doc.add(h2('Lines credited'));
  doc.add(
    cell('Each line references the line of the original invoice it corrects, and states why.', {
      size: 9,
      color: MUTED,
      mb: 8,
    })
  );

  const table = new Table({
    columns: [1, 2.6, 4, 0.7, 1.2, 1.2],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: NEGATIVE,
    headerTextColor: '#ffffff',
  });
  table.addHeader(
    th('Original'),
    th('Description'),
    th('Reason for credit'),
    th('Qty'),
    th('Unit price', 'right'),
    th('Credit', 'right')
  );
  for (const line of LINES) {
    table.addRow(
      td(line.originalLine, { bold: true }),
      td(line.description),
      td(line.reason, { color: MUTED }),
      td(String(line.quantity)),
      td(money(line.unitPrice), { align: 'right' }),
      td(money(-(line.quantity * line.unitPrice)), { align: 'right', bold: true, color: NEGATIVE })
    );
  }
  doc.add(table);

  doc.add(
    totalsPanel([
      totalLine('Net credit', money(-net)),
      totalLine(`VAT at ${(NOTE.vatRate * 100).toFixed(0)}% reversed`, money(-vat)),
      divider(),
      totalLine('Total credited', money(-total), { bold: true, size: 11, color: NEGATIVE }),
    ])
  );

  doc.add(h2('How this credit is applied'));
  doc.add(
    panel(
      NOTE.treatment,
      [
        cell(
          `The credit of ${money(total)} has been applied to account ${NOTE.account} and appears on the next ` +
            'statement. No refund is due; the balance payable is reduced accordingly.',
          { size: 9, mb: 3 }
        ),
        cell(
          'If the original invoice has already been paid in full, the credit may instead be refunded on request to ' +
            'the credit control contact shown below.',
          { size: 9, mb: 0 }
        ),
      ],
      { accent: NEGATIVE }
    )
  );

  doc.add(h2('VAT'));
  doc.add(
    cell(
      `This credit note reverses output tax of ${money(vat)} previously accounted for on invoice ` +
        `${NOTE.againstInvoice}. The customer should adjust input tax recovered on that invoice by the same amount ` +
        'in the period in which this credit note is received.',
      { size: 9, color: MUTED, mb: 10 }
    )
  );

  doc.add(
    cell(`Approved by ${NOTE.approvedBy} on ${gbDate(NOTE.issued)}. Queries: quote ${NOTE.number}.`, {
      size: 8.5,
      color: MUTED,
      mb: 0,
    })
  );

  return doc;
}
