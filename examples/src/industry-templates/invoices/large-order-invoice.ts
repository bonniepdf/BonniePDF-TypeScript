/** A 72-line invoice: a styled header row that repeats on every page, a carried-forward subtotal at each page break, per-line discounts, mixed VAT rates, and the totals kept together on the last page. */
import {
  formatNumber,
  Container,
  Document,
  Grid,
  Heading,
  HorizontalStack,
  PreventPageBreak,
  StandardFonts,
  Svg,
  Table,
  TableCell,
  TableRow,
  TextBlock,
  VerticalStack,
  pageTemplate,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

const LOGO_ASSET = 'images/svg/sample-company.svg';
const FALLBACK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect x="2" y="2" width="44" height="44" rx="10" fill="#334155"/>
  <path d="M31 15.5c0-2.5-2.8-4.5-7-4.5-4.4 0-7.5 2.2-7.5 5.5 0 3.1 2.4 4.7 6.8 5.7l2.2.5c2.5.6 3.8 1.5 3.8 3.1 0 1.9-1.9 3.2-4.8 3.2-3.1 0-5.2-1.4-5.6-3.5h-4.4c.4 4.5 4.2 7.5 10 7.5 5.6 0 9.2-2.9 9.2-7.1 0-3.5-2.4-5.4-7.2-6.5l-2.2-.5c-2.2-.5-3.4-1.3-3.4-2.7 0-1.6 1.5-2.7 3.9-2.7 2.4 0 4 1.1 4.3 2.5H31z" fill="#f8fafc"/>
  <circle cx="35.5" cy="34.5" r="2.5" fill="#94a3b8"/>
</svg>`;

function logoMarkup(assets?: ReadonlyMap<string, Uint8Array>): string {
  const bytes = assets?.get(LOGO_ASSET);
  return bytes ? new TextDecoder().decode(bytes) : FALLBACK_LOGO_SVG;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPence: number;
  discountPence: number;
  taxPercent: number;
}

/** [product, unit price in pence, VAT %] - the supplier's catalogue. */
const CATALOGUE: [string, number, number][] = [
  ['LED panel 600 × 600, 40 W, 4000 K', 2_450, 20],
  ['Emergency exit sign, maintained, 3 h', 4_890, 20],
  ['Loft insulation roll, 200 mm × 5.2 m', 2_175, 0],
  ['Thermostatic radiator valve, 15 mm', 1_299, 20],
  ['Smart heating controller, wall-mounted', 13_900, 20],
  ['Draught-proofing strip, 10 m', 699, 0],
  ['Fire door closer, adjustable, size 2–4', 3_650, 20],
  ['Mobility grab rail, 600 mm, white', 2_840, 0],
  ['Hand sanitiser refill, 5 l', 1_575, 20],
  ['Children’s safety gate, pressure-fit', 3_299, 20],
  ['Low-energy extractor fan, 100 mm', 5_820, 5],
  ['Solar PIR floodlight, 20 W', 4_495, 5],
  ['Air-source heat pump service kit', 18_750, 5],
  ['Water-saving tap aerator, pack of 10', 1_890, 20],
  ['Ceiling tile, mineral fibre, box of 16', 3_120, 20],
  ['Fire extinguisher, 2 kg CO₂, annual service', 2_250, 20],
  ['Anti-slip stair nosing, 1 m', 1_640, 20],
  ['Carbon monoxide alarm, sealed battery', 2_199, 20],
  ['Wall-mounted defibrillator cabinet', 26_500, 0],
  ['Cleaning trolley, two-bucket', 9_850, 20],
  ['Signage pack, accessible toilets', 4_120, 0],
  ['Window restrictor, cable lock', 899, 20],
  ['Lighting control module, DALI', 11_400, 20],
  ['Batteries, AA lithium, pack of 24', 2_380, 20],
];
const SITES = ['Riverside block A', 'Riverside block B', 'Station Road depot'];

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  return buildInvoice(
    Array.from({ length: 72 }, (_, i) => {
      const [product, unitPence, taxPercent] = CATALOGUE[i % CATALOGUE.length];
      return {
        description: `${product}, ${SITES[Math.floor(i / CATALOGUE.length)]}`,
        quantity: (i % 4) + 1,
        unitPence,
        discountPence: i % 5 === 0 ? 150 : 0,
        taxPercent,
      };
    }),
    'PO-WFM-44817',
    assets
  );
}

/** Integer minor units; tax rounds half up on each line, then those amounts are summed. */
export function calculateTotals(lines: readonly InvoiceLine[]) {
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

export function buildInvoice(
  lines: readonly InvoiceLine[],
  purchaseOrder?: string | ReadonlyMap<string, Uint8Array>,
  assets?: ReadonlyMap<string, Uint8Array>
): Document {
  const po = typeof purchaseOrder === 'string' ? purchaseOrder : undefined;
  const resolvedAssets = typeof purchaseOrder === 'object' ? purchaseOrder : assets;
  const totals = calculateTotals(lines);
  const doc = new Document({
    metadata: { title: 'Large-order invoice INV-2026-072' },
    settings: {
      language: 'en-GB',
      margin: 42,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: 'slate-700' },
      footerTemplate: pageTemplate({
        default: new HorizontalStack({
          widthDistribution: 'equal',
          children: [
            text('Northfield Supply Ltd  ·  VAT GB 318 4402 17', 8, 'slate-500'),
            text('INV-2026-072  ·  page {{CurrentPage}} of {{TotalPages}}', 8, 'slate-500', { align: 'right' }),
          ],
        }),
      }),
    },
  });

  // ── Header: brand and invoice details ──
  const header = new Grid({ columns: [1, 1], border: 0, cellPadding: 0, margin: { bottom: 14 } });
  header.addRow(
    new HorizontalStack({
      widthDistribution: 'auto',
      spacing: 8,
      children: [
        new Svg({ svgData: logoMarkup(resolvedAssets), width: 20, height: 20, isDecorative: true }),
        new VerticalStack({
          spacing: 2,
          children: [
            new Heading('NORTHFIELD SUPPLY', {
              level: 1,
              fontName: StandardFonts.HelveticaBold,
              fontSize: 20,
              letterSpacing: 0.5,
              color: 'violet-800',
            }),
            text('Facilities and maintenance supplies', 9, 'slate-500'),
          ],
        }),
      ],
    }),
    new VerticalStack({
      spacing: 2,
      children: [
        text('INVOICE', 9, 'slate-900', { bold: true, align: 'right' }),
        text('INV-2026-072', 14, 'slate-900', { bold: true, align: 'right' }),
        text('Issued 25 October 2026  ·  due 24 November 2026', 9, 'slate-500', { align: 'right' }),
      ],
    })
  );
  doc.add(header);

  const parties = new Grid({ columns: [1, 1, 1], border: 0, cellPadding: 0, margin: { bottom: 16 } });
  parties.addRow(
    party(
      'BILL TO',
      'Westborough Facilities and Maintenance Services Ltd',
      'Accounts payable\n4 Minster Court, York YO1 7HH'
    ),
    party('DELIVER TO', 'Riverside Industrial Estate', 'Blocks A and B, and Station Road depot\nYork YO1 1AA'),
    party('REFERENCES', po ? `Purchase order ${po}` : 'No purchase order', 'Account WFM-0193\nCurrency GBP')
  );
  doc.add(parties);

  // ── Line items: the header row repeats at the top of every page, and each page
  // break carries the net subtotal forward to the next ──
  const table = new Table({
    columns: [4.4, 0.6, 1, 1.1, 0.6, 1.1],
    repeatHeadersOnNewPage: true,
    cellPadding: 5,
    border: { width: 0.5, color: 'slate-200' },
    headerBackgroundColor: 'slate-800',
    headerTextColor: '#ffffff',
    footerBackgroundColor: 'slate-100',
    footerTextColor: 'slate-900',
    runningTotalColumn: 5,
  });
  table.addHeader(
    text('Description', 8.5, '#ffffff', { bold: true }),
    text('Qty', 8.5, '#ffffff', { bold: true, align: 'right' }),
    text('Unit £', 8.5, '#ffffff', { bold: true, align: 'right' }),
    text('Discount £', 8.5, '#ffffff', { bold: true, align: 'right' }),
    text('VAT', 8.5, '#ffffff', { bold: true, align: 'right' }),
    text('Net £', 8.5, '#ffffff', { bold: true, align: 'right' })
  );
  for (const line of lines) {
    const net = line.quantity * line.unitPence - line.discountPence;
    table.addRow(
      new TableRow({
        cells: [
          text(line.description, 9, 'slate-800'),
          ...[
            String(line.quantity),
            money(line.unitPence),
            line.discountPence ? money(line.discountPence) : '–',
            `${line.taxPercent}%`,
            money(net),
          ].map(value => text(value, 9, 'slate-800', { align: 'right' })),
        ].map(content => new TableCell({ content })),
        runningValue: net / 100,
      })
    );
  }
  if (!lines.length) table.addRow('No billable items', '', '', '', '', '0.00');
  doc.add(table);

  // ── Totals: kept together, so they always appear whole on the last page ──
  const vat = new Table({
    columns: [1, 1.4, 1.4],
    cellPadding: 5,
    border: 0,
    headerBackgroundColor: 'slate-100',
    headerTextColor: 'slate-900',
  });
  vat.addHeader(
    text('VAT rate', 8.5, 'slate-900', { bold: true }),
    text('Net £', 8.5, 'slate-900', { bold: true, align: 'right' }),
    text('VAT £', 8.5, 'slate-900', { bold: true, align: 'right' })
  );
  for (const [rate, group] of [...totals.rates].sort(([a], [b]) => b - a))
    vat.addRow(
      text(`${rate}%`, 9, 'slate-700'),
      text(money(group.netPence), 9, 'slate-700', { align: 'right' }),
      text(money(group.taxPence), 9, 'slate-700', { align: 'right' })
    );

  const sums = new Grid({ columns: [1, 1], border: 0, cellPadding: 4 });
  sums.addRow(
    text('Net', 10, 'slate-700', { align: 'right' }),
    text(`£${money(totals.netPence)}`, 10, 'slate-700', { align: 'right' })
  );
  sums.addRow(
    text('VAT', 10, 'slate-700', { align: 'right' }),
    text(`£${money(totals.taxPence)}`, 10, 'slate-700', { align: 'right' })
  );

  const due = new Container({
    backgroundColor: 'violet-50',
    cornerRadius: 6,
    padding: [10, 8],
    margin: { top: 6 },
    child: new HorizontalStack({
      widthDistribution: 'equal',
      children: [
        text('Total due', 13, 'violet-900', { bold: true }),
        text(`£${money(totals.grossPence)}`, 13, 'violet-900', { bold: true, align: 'right' }),
      ],
    }),
  });

  const totalsRow = new HorizontalStack({ spacing: 24, widthDistribution: 'weighted', margin: { top: 16 } });
  totalsRow.add(
    new VerticalStack({
      spacing: 6,
      children: [
        new Heading('VAT summary', {
          level: 2,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 11,
          color: 'slate-900',
        }),
        vat,
      ],
    }),
    3
  );
  totalsRow.add(
    new VerticalStack({
      spacing: 6,
      children: [
        new Heading('Invoice totals', {
          level: 2,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 11,
          color: 'slate-900',
        }),
        sums,
        due,
      ],
    }),
    2
  );

  doc.add(
    new PreventPageBreak({
      child: new VerticalStack({
        children: [
          totalsRow,
          text(
            'Payment terms: 30 days by bank transfer to Northfield Supply Ltd, sort code 20-45-77, account 61839204. Quote INV-2026-072 with your payment.',
            9,
            'slate-600',
            { top: 14 }
          ),
        ],
      }),
    })
  );
  return doc;
}

// Local helpers used by this document.

function money(pence: number): string {
  return formatNumber(pence / 100, 'N2');
}

function text(
  content: string,
  size: number,
  color: ColorInput,
  style: { bold?: boolean; align?: TextAlignmentInput; top?: number } = {}
): TextBlock {
  return new TextBlock(content, {
    fontName: style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    color,
    alignment: style.align ?? 'left',
    margin: style.top ? { top: style.top } : undefined,
  });
}

/** A labelled address block. */
function party(label: string, name: string, detail: string): VerticalStack {
  return new VerticalStack({
    spacing: 2,
    children: [
      text(label, 7.5, 'slate-500', { bold: true }),
      text(name, 9.5, 'slate-900', { bold: true }),
      text(detail, 9, 'slate-600'),
    ],
  });
}
