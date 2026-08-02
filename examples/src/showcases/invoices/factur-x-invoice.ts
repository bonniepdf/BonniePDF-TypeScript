// ── EU E-Invoice · Factur-X / ZUGFeRD (EN 16931) ────────────────────────────
//
// The single EU e-invoice showcase: the polished human-readable invoice layout
// *and* the real machine-readable half. `applyFacturX` binds the caller-supplied
// EN 16931 CII XML - it forces PDF/A-3, embeds `factur-x.xml` as an associated
// file (`/AFRelationship /Data`), and writes the `fx:` XMP block.
//
// The visible totals mirror the embedded XML exactly (net 4000.00, VAT 760.00,
// gross 4760.00) - a real e-invoice's human- and machine-readable views must
// agree. The XML is a caller input (loaded from the assets map); BonniePDF does
// not generate it.
//
// Authored through the options-object front door; elements are added directly
// with doc.add(...). Shares the _kit building blocks. Validated in CI (on the
// .NET side) by veraPDF (PDF/A-3b) and the Mustang project. Parity peer of the
// .NET FacturXInvoiceExample.

import {
  Document,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  ColorPalette,
  Thickness,
  applyFacturX,
  FacturXProfile,
} from '@bonniepdf/core';
import {
  cell,
  money,
  lines,
  labelled,
  totalLine,
  divider,
  accentBar,
  INK,
  MUTED,
  HEADER_BG,
  RULE,
  type LineItem,
} from './_kit';

const ACCENT = ColorPalette.blue[800]; // EU-flag blue
const EUR = '€';
const LOCALE = 'en-GB';
const VAT_RATE = 0.19;
const ASSET_KEY = 'factur-x/en16931-invoice.xml';

// Line items reconcile with the embedded XML: 40 × 85 + 1 × 600 = 4000 net.
const ITEMS: LineItem[] = [
  { description: 'Consulting services', detail: 'Professional services (40 h)', qty: 40, unitPrice: 85 },
  { description: 'Software license (annual)', detail: '12-month term', qty: 1, unitPrice: 600 },
];

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      // applyFacturX forces PDF/A-3b; set here too so the intent is explicit.
      conformance: 'pdf/a-3b',
      language: 'en',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
    },
    metadata: {
      title: 'E-Invoice INV-2026-1001',
      author: 'Sample Company GmbH',
      subject:
        'EU e-invoice (Factur-X / ZUGFeRD, EN 16931): a PDF/A-3 invoice with the machine-readable CII XML embedded as an associated file.',
    },
  });

  doc.add(accentBar(ACCENT));

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Grid({ columns: [1.3, 1], cellPadding: 0, border: 0, margin: { top: 16, bottom: 18 } });
  const seller = new VerticalStack({
    children: [
      cell('Sample Company GmbH', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) }),
      lines(['Musterstrasse 1', '10115 Berlin', 'Germany'], { color: MUTED }),
      cell('USt-IdNr. DE 123 456 789', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }),
    ],
  });
  const titleStack = new VerticalStack({
    children: [
      cell('E-INVOICE', { bold: true, size: 24, color: ACCENT, align: 'right' }),
      cell('EN 16931 · Factur-X / ZUGFeRD', {
        size: 8,
        color: MUTED,
        align: 'right',
        margin: new Thickness(0, 2, 0, 0),
      }),
      cell('INV-2026-1001', { color: MUTED, align: 'right' }),
    ],
  });
  header.addRow(seller, titleStack);
  doc.add(header);

  // ── Buyer + details ─────────────────────────────────────────────────────
  const meta = new Grid({
    columns: [1, 1],
    cellPadding: 12,
    border: { width: 0.5, color: RULE },
    margin: { bottom: 18 },
  });
  const buyer = labelled(
    'BILLED TO',
    lines(['Sample Customer', '1 Example Way', 'EC1A 1BB London', 'United Kingdom'], { color: MUTED }),
    ACCENT
  );
  const detailsStack = new VerticalStack({
    children: [
      totalLine('Invoice date', '07 Jul 2026'),
      totalLine('Due date', '21 Jul 2026'),
      totalLine('Buyer reference', 'PO-2026-042'),
      totalLine('Terms', '14 days net'),
    ],
  });
  meta.addRow(buyer, labelled('DETAILS', detailsStack, ACCENT));
  doc.add(meta);

  // ── Line items ──────────────────────────────────────────────────────────
  const table = new Table({
    columns: [3, 0.7, 1, 1],
    cellPadding: 8,
    border: 0,
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
  });
  table.addHeader(
    cell('Description', { bold: true }),
    cell('Qty', { bold: true, align: 'center' }),
    cell('Unit price', { bold: true, align: 'right' }),
    cell('Net amount', { bold: true, align: 'right' })
  );
  let net = 0;
  for (const it of ITEMS) {
    const amount = it.qty * it.unitPrice;
    net += amount;
    const desc = new VerticalStack({
      children: it.detail ? [cell(it.description), cell(it.detail, { size: 8, color: MUTED })] : [cell(it.description)],
    });
    table.addRow(
      desc,
      cell(String(it.qty), { align: 'center' }),
      cell(money(it.unitPrice, EUR, LOCALE), { align: 'right' }),
      cell(money(amount, EUR, LOCALE), { align: 'right' })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── Totals (mirror the embedded XML exactly: 4000 / 760 / 4760) ───────────
  const vat = net * VAT_RATE;
  const totals = new VerticalStack({
    children: [
      totalLine('Total net', money(net, EUR, LOCALE)),
      totalLine('VAT (19%)', money(vat, EUR, LOCALE)),
      divider(INK, 0.6),
      totalLine('Total due (EUR)', money(net + vat, EUR, LOCALE), { bold: true, size: 13, color: ACCENT }),
    ],
  });
  const totalsBox = new Container({
    child: totals,
    padding: [14, 12],
    backgroundColor: ColorPalette.blue[50],
    cornerRadius: 8,
  });
  const totalsRow = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 6 } });
  totalsRow.addChild(new Container(), 1);
  totalsRow.addChild(totalsBox, 1);
  doc.add(totalsRow);

  // ── Remittance + embedded-XML panel ───────────────────────────────────────
  const bottom = new Grid({ columns: [1.1, 1], cellPadding: 0, border: 0, margin: { top: 20 } });
  const pay = labelled(
    'PAYMENT',
    lines(['IBAN: DE21 1001 0000 0012 3456 78', 'BIC: PBNKDEFFXXX', 'Deutsche Postbank, Berlin'], {
      size: 8,
      color: MUTED,
    }),
    ACCENT
  );
  const xml = new Container({
    backgroundColor: HEADER_BG,
    cornerRadius: 6,
    padding: [12, 10],
    child: new VerticalStack({
      children: [
        cell('STRUCTURED DATA', { bold: true, size: 8, color: MUTED, margin: new Thickness(0, 0, 0, 4) }),
        cell('factur-x.xml (EN 16931 CII) is embedded in this', { size: 8, color: MUTED }),
        cell('PDF/A-3 as an associated file — /AFRelationship /Data.', { size: 8, color: MUTED }),
      ],
    }),
  });
  bottom.addRow(new Container({ child: pay, padding: { right: 20 } }), xml);
  doc.add(bottom);

  // ── Bind the invoice XML: PDF/A-3 + embedded CII + fx: XMP ──
  const xmlBytes = assets?.get(ASSET_KEY);
  if (xmlBytes) {
    applyFacturX(doc, xmlBytes, { profile: FacturXProfile.En16931 });
  }

  return doc;
}
