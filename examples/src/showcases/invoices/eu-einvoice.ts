// ── EU cross-border e-invoice (PDF/A-3, EN 16931 layout) ────────────────────
//
// EU e-invoicing (EN 16931, and its Factur-X / ZUGFeRD / XRechnung profiles)
// pairs a human-readable PDF with a machine-readable XML payload inside a single
// PDF/A-3 file. This showcase renders the *human-readable half* in that idiom:
// a PDF/A-3b container, both parties' VAT identifiers, an intra-Community
// reverse-charge notice (Art. 196 of the EU VAT Directive - the recipient
// self-accounts for VAT, so the supplier charges 0%), IBAN/BIC remittance, and
// EUR amounts.
//
// NOTE ON THE XML HALF: embedding the structured EN 16931 XML as a PDF/A-3
// associated file needs an embedded-file / associated-file API that the engine
// does not yet expose (tracked internally as a library gap - see the strategy
// doc). Until it lands, the XML is represented here by a visible placeholder
// panel rather than a real attachment, so the example never over-claims a
// conformance it cannot emit.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Table,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  TextStyle,
  PdfAConformance,
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

const ITEMS: LineItem[] = [
  { description: 'Software licences (annual)', detail: '50 seats', qty: 50, unitPrice: 120 },
  { description: 'Implementation services', detail: 'Consultant day rate', qty: 15, unitPrice: 720 },
  { description: 'Data migration', detail: 'Fixed scope', qty: 1, unitPrice: 3400 },
];

export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const fmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const nf = 'de-DE';

  const settings = new DocumentSettings(PdfSize.a4, 44);
  // PDF/A-3b is the archival container profile used by hybrid e-invoices.
  settings.conformance = PdfAConformance.PdfA3b;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en';

  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(INK);

  const metadata = new DocumentMetadata();
  metadata.title = `E-Invoice INV-EU-${year}-2049`;
  metadata.author = 'Nordlicht Software GmbH';
  metadata.subject = 'EU cross-border e-invoice (PDF/A-3, EN 16931 layout) with intra-Community reverse charge.';

  const doc = new Document(settings, metadata);
  const root = new VerticalStack();
  root.addChild(accentBar(ACCENT));

  // ── Header ────────────────────────────────────────────────────────────────
  const header = new Table(1.3, 1);
  header.cellPadding = 0;
  header.border = Border.none;
  header.margin = new Thickness(0, 16, 0, 18);
  const seller = new VerticalStack();
  seller.addChild(
    cell('Nordlicht Software GmbH', { bold: true, size: 16, color: INK, margin: new Thickness(0, 0, 0, 2) })
  );
  for (const l of ['Speicherstadt 12', '20457 Hamburg', 'Germany']) seller.addChild(cell(l, { color: MUTED }));
  seller.addChild(cell('USt-IdNr. DE 811 204 471', { bold: true, color: ACCENT, margin: new Thickness(0, 6, 0, 0) }));
  const title = new Heading('E-INVOICE');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = ACCENT;
  title.alignment = TextAlignment.Right;
  const titleStack = new VerticalStack();
  titleStack.addChild(title);
  titleStack.addChild(
    cell('EN 16931 · Factur-X profile', {
      size: 8,
      color: MUTED,
      align: TextAlignment.Right,
      margin: new Thickness(0, 2, 0, 0),
    })
  );
  titleStack.addChild(cell(`INV-EU-${year}-2049`, { color: MUTED, align: TextAlignment.Right }));
  const sellerCell = new Container();
  sellerCell.child = seller;
  const titleCell = new Container();
  titleCell.child = titleStack;
  header.addRow(sellerCell, titleCell);
  root.addChild(header);

  // ── Buyer + details ─────────────────────────────────────────────────────
  const meta = new Table(1, 1);
  meta.cellPadding = 12;
  meta.border = new Border(0.5);
  meta.borderColors = new BorderColors(RULE);
  meta.margin = new Thickness(0, 0, 0, 18);
  const buyer = labelled(
    'BUYER',
    lines(['Lumière Analytique SAS', '24 Rue de la Paix', '75002 Paris', 'France', 'TVA FR 32 552118430'], {
      color: MUTED,
    }),
    ACCENT
  );
  const detailsStack = new VerticalStack();
  detailsStack.addChild(totalLine('Invoice date', fmt.format(now)));
  detailsStack.addChild(totalLine('Delivery date', fmt.format(now)));
  detailsStack.addChild(totalLine('Buyer reference', 'LUM-PO-5521'));
  detailsStack.addChild(totalLine('Terms', '14 days net'));
  meta.addRow(buyer, labelled('DETAILS', detailsStack, ACCENT));
  root.addChild(meta);

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
    desc.addChild(cell(it.description));
    if (it.detail) desc.addChild(cell(it.detail, { size: 8, color: MUTED }));
    const descCell = new Container();
    descCell.child = desc;
    table.addRow(
      descCell,
      cell(String(it.qty), { align: TextAlignment.Center }),
      cell(money(it.unitPrice, EUR, nf), { align: TextAlignment.Right }),
      cell(money(amount, EUR, nf), { align: TextAlignment.Right })
    );
  }
  root.addChild(table);
  root.addChild(divider(RULE, 0.5));

  // ── Totals: reverse charge → VAT is 0, buyer self-accounts ────────────────
  const totals = new VerticalStack();
  totals.addChild(totalLine('Total net', money(net, EUR, nf)));
  totals.addChild(totalLine('VAT (reverse charge)', money(0, EUR, nf)));
  totals.addChild(divider(INK, 0.6));
  totals.addChild(totalLine('Total due (EUR)', money(net, EUR, nf), { bold: true, size: 13, color: ACCENT }));
  const totalsBox = new Container();
  totalsBox.child = totals;
  totalsBox.padding = new Thickness(14, 12, 14, 12);
  totalsBox.backgroundColor = ColorPalette.blue[50];
  totalsBox.cornerRadius = 8;
  const totalsRow = new HorizontalStack();
  totalsRow.widthDistribution = WidthDistribution.Weighted;
  totalsRow.margin = new Thickness(0, 6, 0, 0);
  totalsRow.addChild(new Container(), 1);
  totalsRow.addChild(totalsBox, 1);
  root.addChild(totalsRow);

  // ── Reverse-charge legal notice ───────────────────────────────────────────
  const notice = new Container();
  notice.backgroundColor = ColorPalette.amber[50];
  notice.border = Border.leftOnly(3);
  notice.borderColors = BorderColors.leftOnly(ColorPalette.amber[500]);
  notice.padding = new Thickness(14, 10, 14, 10);
  notice.margin = new Thickness(0, 20, 0, 0);
  notice.child = cell(
    'Reverse charge: VAT to be accounted for by the recipient under Article 196 of ' +
      'Council Directive 2006/112/EC. Intra-Community supply of services - supplier charges 0% VAT.',
    { size: 8.5, color: ColorPalette.amber[800] }
  );
  root.addChild(notice);

  // ── Remittance + XML placeholder ──────────────────────────────────────────
  const bottom = new Table(1.1, 1);
  bottom.cellPadding = 0;
  bottom.border = Border.none;
  bottom.margin = new Thickness(0, 16, 0, 0);
  const pay = labelled(
    'PAYMENT',
    lines(['IBAN: DE89 2007 0000 0081 1204 71', 'BIC: DEUTDEHH', 'Deutsche Bank, Hamburg'], { size: 8, color: MUTED }),
    ACCENT
  );
  const xml = new Container();
  xml.backgroundColor = HEADER_BG;
  xml.cornerRadius = 6;
  xml.padding = new Thickness(12, 10, 12, 10);
  const xmlStack = new VerticalStack();
  xmlStack.addChild(cell('STRUCTURED DATA', { bold: true, size: 8, color: MUTED, margin: new Thickness(0, 0, 0, 4) }));
  xmlStack.addChild(cell('factur-x.xml (EN 16931) travels inside this PDF/A-3 as an', { size: 8, color: MUTED }));
  xmlStack.addChild(cell('associated file. Attachment API pending — see strategy doc.', { size: 8, color: MUTED }));
  xml.child = xmlStack;
  const payCell = new Container();
  payCell.child = pay;
  payCell.padding = new Thickness(0, 0, 20, 0);
  bottom.addRow(payCell, xml);
  root.addChild(bottom);

  doc.add(root);
  return doc;
}
