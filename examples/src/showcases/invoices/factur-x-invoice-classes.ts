// ── EU E-Invoice · Factur-X / ZUGFeRD (EN 16931) ────────────────────────────
//
// The single EU e-invoice showcase: the polished human-readable invoice layout
// *and* the real machine-readable half. `applyFacturX` binds the caller-supplied
// EN 16931 CII XML - it forces PDF/A-3 and embeds `factur-x.xml` as an associated
// file.
//
// The visible totals mirror the embedded XML exactly (net 4000.00, VAT 760.00,
// gross 4760.00) - a real e-invoice's human- and machine-readable views must
// agree. The XML is a caller input (loaded from the assets map); BonniePDF does
// not generate it.
//
// Shares the regional-invoice visual grammar via `_kit`. Validated in CI (on the
// .NET side, where the Java toolchain lives) by veraPDF (PDF/A-3b) and the
// Mustang project (ZUGFeRD / EN 16931). Parity peer of the .NET
// FacturXInvoiceExample.

import {
  Document,
  DocumentSettings,
  PdfSize,
  PdfAConformance,
  TextAlignment,
  TextStyle,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  Grid,
  Thickness,
  Border,
  BorderColors,
  ColorPalette,
  WidthDistribution,
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

/**
 * The **class / construct-then-mutate** companion to `factur-x-invoice.ts`.
 *
 * Same EU Factur-X / ZUGFeRD e-invoice, authored the long way: `new` each
 * element and assign properties, added directly with `doc.add(...)` (no redundant
 * parent VerticalStack). `applyFacturX` binds the embedded XML in both variants.
 * Renders **byte-for-byte identically** to the options-style `factur-x-invoice.ts`.
 */
export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings(PdfSize.a4, 44);
  // applyFacturX forces PDF/A-3b; set here too so the intent is explicit.
  settings.conformance = PdfAConformance.PdfA3b;
  settings.language = 'en';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(INK);

  const doc = new Document(settings);
  doc.metadata.title = 'E-Invoice INV-2026-1001';
  doc.metadata.author = 'Sample Company GmbH';
  doc.metadata.subject =
    'EU e-invoice (Factur-X / ZUGFeRD, EN 16931): a PDF/A-3 invoice with the machine-readable CII XML embedded inside it.';

  doc.add(accentBar(ACCENT));

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Grid(1.3, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  header.margin = new Thickness(0, 16, 0, 18);
  const seller = new VerticalStack();
  seller.add(cell('Sample Company GmbH', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) }));
  seller.add(lines(['Musterstrasse 1', '10115 Berlin', 'Germany'], { color: MUTED }));
  seller.add(cell('USt-IdNr. DE 123 456 789', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }));
  const titleStack = new VerticalStack();
  titleStack.add(cell('E-INVOICE', { bold: true, size: 24, color: ACCENT, align: TextAlignment.Right }));
  titleStack.add(
    cell('EN 16931 · Factur-X / ZUGFeRD', {
      size: 8,
      color: MUTED,
      align: TextAlignment.Right,
      margin: new Thickness(0, 2, 0, 0),
    })
  );
  titleStack.add(cell('INV-2026-1001', { color: MUTED, align: TextAlignment.Right }));
  header.addRow(seller, titleStack);
  doc.add(header);

  // ── Buyer + details ─────────────────────────────────────────────────────
  const meta = new Grid(1, 1);
  meta.cellPadding = 12;
  meta.border = new Border(0.5);
  meta.borderColors = new BorderColors(RULE);
  meta.margin = new Thickness(0, 0, 0, 18);
  const buyer = labelled(
    'BILLED TO',
    lines(['Sample Customer', '1 Example Way', 'EC1A 1BB London', 'United Kingdom'], { color: MUTED }),
    ACCENT
  );
  const detailsStack = new VerticalStack();
  detailsStack.add(totalLine('Invoice date', '07 Jul 2026'));
  detailsStack.add(totalLine('Due date', '21 Jul 2026'));
  detailsStack.add(totalLine('Buyer reference', 'PO-2026-042'));
  detailsStack.add(totalLine('Terms', '14 days net'));
  meta.addRow(buyer, labelled('DETAILS', detailsStack, ACCENT));
  doc.add(meta);

  // ── Line items ──────────────────────────────────────────────────────────
  const table = new Table(3, 0.7, 1, 1);
  table.cellPadding = 8;
  table.border = Border.none;
  table.headerBackgroundColor = HEADER_BG;
  table.headerTextColor = INK;
  table.addHeader(
    cell('Description', { bold: true }),
    cell('Qty', { bold: true, align: TextAlignment.Center }),
    cell('Unit price', { bold: true, align: TextAlignment.Right }),
    cell('Net amount', { bold: true, align: TextAlignment.Right })
  );
  let net = 0;
  for (const it of ITEMS) {
    const amount = it.qty * it.unitPrice;
    net += amount;
    const desc = new VerticalStack();
    desc.add(cell(it.description));
    if (it.detail) desc.add(cell(it.detail, { size: 8, color: MUTED }));
    table.addRow(
      desc,
      cell(String(it.qty), { align: TextAlignment.Center }),
      cell(money(it.unitPrice, EUR, LOCALE), { align: TextAlignment.Right }),
      cell(money(amount, EUR, LOCALE), { align: TextAlignment.Right })
    );
  }
  doc.add(table);
  doc.add(divider(RULE, 0.5));

  // ── Totals (mirror the embedded XML exactly: 4000 / 760 / 4760) ───────────
  const vat = net * VAT_RATE;
  const totals = new VerticalStack();
  totals.add(totalLine('Total net', money(net, EUR, LOCALE)));
  totals.add(totalLine('VAT (19%)', money(vat, EUR, LOCALE)));
  totals.add(divider(INK, 0.6));
  totals.add(totalLine('Total due (EUR)', money(net + vat, EUR, LOCALE), { bold: true, size: 13, color: ACCENT }));
  const totalsBox = new Container();
  totalsBox.child = totals;
  totalsBox.padding = new Thickness(14, 12, 14, 12);
  totalsBox.backgroundColor = ColorPalette.blue[50];
  totalsBox.cornerRadius = 8;
  const totalsRow = new HorizontalStack();
  totalsRow.widthDistribution = WidthDistribution.Weighted;
  totalsRow.margin = new Thickness(0, 6, 0, 0);
  totalsRow.add(new Container(), 1);
  totalsRow.add(totalsBox, 1);
  doc.add(totalsRow);

  // ── Remittance + embedded-XML panel ───────────────────────────────────────
  const bottom = new Grid(1.1, 1);
  bottom.cellPadding = 0;
  bottom.border = Border.none;
  bottom.margin = new Thickness(0, 20, 0, 0);
  const pay = labelled(
    'PAYMENT',
    lines(['IBAN: DE21 1001 0000 0012 3456 78', 'BIC: SMPLDEFFXXX', 'Sample Bank, Berlin'], {
      size: 8,
      color: MUTED,
    }),
    ACCENT
  );
  const xml = new Container();
  xml.backgroundColor = HEADER_BG;
  xml.cornerRadius = 6;
  xml.padding = new Thickness(12, 10, 12, 10);
  const xmlStack = new VerticalStack();
  xmlStack.add(cell('STRUCTURED DATA', { bold: true, size: 8, color: MUTED, margin: new Thickness(0, 0, 0, 4) }));
  xmlStack.add(cell('factur-x.xml (EN 16931 CII) is embedded in this', { size: 8, color: MUTED }));
  xmlStack.add(cell('PDF/A-3 invoice.', { size: 8, color: MUTED }));
  xml.child = xmlStack;
  const payCell = new Container();
  payCell.child = pay;
  payCell.padding = new Thickness(0, 0, 20, 0);
  bottom.addRow(payCell, xml);
  doc.add(bottom);

  // ── Bind the invoice XML: PDF/A-3 + embedded CII ──
  const xmlBytes = assets.get(ASSET_KEY);
  // Without the CII XML this is a plain PDF wearing a Factur-X label, so the
  // absence is an error rather than something to render around.
  if (!xmlBytes) throw new Error(`Missing required asset: ${ASSET_KEY}`);
  applyFacturX(doc, xmlBytes, { profile: FacturXProfile.En16931 });

  return doc;
}
