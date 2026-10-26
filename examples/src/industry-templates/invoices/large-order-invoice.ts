/** A large order with discounts, mixed tax rates, and a totals block kept together. */
import { Document, Heading, TextBlock, Table, VerticalStack, PreventPageBreak, pageTemplate } from '@bonniepdf/core';

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPence: number;
  discountPence: number;
  taxPercent: number;
}

export function generate(): Document {
  return buildInvoice(
    Array.from({ length: 72 }, (_, i) => ({
      description: `Component ${i + 1}: replacement assembly with installation, commissioning and handover notes${i % 9 === 0 ? '; includes extended warranty and a detailed maintenance schedule for the customer site' : ''}.`,
      quantity: (i % 4) + 1,
      unitPence: 1299 + i * 25,
      discountPence: i % 5 === 0 ? 150 : 0,
      taxPercent: [20, 5, 0][i % 3],
    }))
  );
}

/** Integer minor units; tax rounds half up on each line, then those amounts are summed. */
export function calculateTotals(lines: InvoiceLine[]) {
  let netPence = 0,
    taxPence = 0;
  const rates = new Map<number, { netPence: number; taxPence: number }>();
  for (const line of lines) {
    if (
      ![line.quantity, line.unitPence, line.discountPence, line.taxPercent].every(Number.isSafeInteger) ||
      line.quantity < 1 ||
      line.unitPence < 0 ||
      line.discountPence < 0 ||
      line.taxPercent < 0 ||
      line.taxPercent > 100
    )
      throw new Error('Use valid integer quantities, minor units and tax percentages.');
    const net = line.quantity * line.unitPence - line.discountPence;
    if (!Number.isSafeInteger(net) || net < 0 || !Number.isSafeInteger(net * line.taxPercent + 50))
      throw new Error('Invalid discounted line amount.');
    const tax = Math.floor((net * line.taxPercent + 50) / 100);
    const group = rates.get(line.taxPercent) ?? { netPence: 0, taxPence: 0 };
    group.netPence += net;
    group.taxPence += tax;
    rates.set(line.taxPercent, group);
    netPence += net;
    taxPence += tax;
    if (!Number.isSafeInteger(netPence + taxPence))
      throw new Error('Invoice total exceeds the supported integer range.');
  }
  return { netPence, taxPence, grossPence: netPence + taxPence, rates };
}

export function buildInvoice(lines: InvoiceLine[], purchaseOrder?: string): Document {
  const totals = calculateTotals(lines);
  const doc = new Document({
    metadata: { title: 'Large-order invoice INV-2026-072' },
    settings: {
      language: 'en-GB',
      margin: 42,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: 'slate-800' },
      footerTemplate: pageTemplate({
        default: new TextBlock('INV-2026-072 · Page {{CurrentPage}} of {{TotalPages}}', {
          fontSize: 9,
          alignment: 'right',
        }),
      }),
    },
  });
  doc.add(new Heading('NORTHFIELD SUPPLY', { level: 1, fontSize: 25, color: 'indigo-700' }));
  doc.add(new TextBlock('Invoice INV-2026-072 · 25 October 2026 · GBP', { margin: { bottom: 16 } }));
  doc.add(
    new TextBlock(
      'Bill to: Westborough Facilities and Maintenance Services Limited\nCustomer site: 18 Riverside Industrial Estate, York YO1 1AA',
      { margin: { bottom: 12 } }
    )
  );
  if (purchaseOrder) doc.add(new TextBlock(`Purchase order: ${purchaseOrder}`));
  const table = new Table({ columns: [5, 0.5, 1, 1, 0.6, 1], repeatHeadersOnNewPage: true, cellPadding: 6 });
  table.addHeader('Description', 'Qty', 'Unit GBP', 'Discount', 'Tax %', 'Net GBP');
  for (const line of lines)
    table.addRow(
      new TextBlock(line.description),
      ...[
        String(line.quantity),
        money(line.unitPence),
        money(line.discountPence),
        String(line.taxPercent),
        money(line.quantity * line.unitPence - line.discountPence),
      ].map(value => new TextBlock(value, { alignment: 'right' }))
    );
  if (!lines.length) table.addRow('No billable items', '', '', '', '', '0.00');
  doc.add(table);
  const summary = new VerticalStack({
    spacing: 7,
    margin: { top: 16 },
    children: [new Heading('Invoice totals', { level: 2, fontSize: 17 })],
  });
  for (const [rate, group] of [...totals.rates].sort(([a], [b]) => a - b))
    summary.add(new TextBlock(`Tax ${rate}%: net ${money(group.netPence)} · tax ${money(group.taxPence)} GBP`));
  summary.add(
    new TextBlock(
      `Net ${money(totals.netPence)} · Tax ${money(totals.taxPence)} · Total due ${money(totals.grossPence)} GBP`,
      { fontWeight: 'bold' }
    )
  );
  summary.add(new TextBlock('Payment terms: 30 days. Reference INV-2026-072 with your payment.'));
  doc.add(new PreventPageBreak({ child: summary }));
  return doc;
}

function money(pence: number): string {
  return (pence / 100).toFixed(2);
}
