// ── Quotation / proposal (B2B pre-sales) — class companion ───────────────────
//
// The **class / construct-then-mutate** companion to `quotation.ts`. Same
// quotation, same eight sections, same derived pricing — but every element is
// created with `new` and configured by assigning properties, rather than
// through the options-object front door. This is the escape hatch the options
// form desugars to.
//
// It renders **byte-for-byte identically** to `quotation.ts` (an equivalence
// test binds the two). Reach for the options form first; this variant exists to
// show what it desugars to. See `quotation.ts` for the narrated walkthrough.

import {
  Border,
  BorderColors,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  Heading,
  HorizontalStack,
  Line,
  NumberFormat,
  OrderedList,
  Spacer,
  StandardFonts,
  Table,
  TextAlignment,
  TextBlock,
  TextElementBase,
  Thickness,
  UnorderedList,
  VerticalStack,
  WidthDistribution,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[500];
const FAINT = ColorPalette.slate[400];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[50];
const ACCENT = ColorPalette.violet[600];
const ACCENT_SOFT = ColorPalette.violet[50];
const ACCENT_DEEP = ColorPalette.violet[700];

const TIER_CARD_HEIGHT = 178;
const TIER_PAD = 12;
const TIER_BORDER_ON = 1.5;
const TIER_BORDER_OFF = 0.75;

// ── Domain model ─────────────────────────────────────────────────────────────

export interface QuoteTier {
  name: string;
  tagline: string;
  price: number;
  cadence: string;
  includes: string[];
  recommended?: boolean;
}

export interface QuoteAddOn {
  label: string;
  detail: string;
  price: number;
  cadence: string;
}

export interface QuotationData {
  supplier: { name: string; address: string; email: string; registration: string };
  customer: { company: string; contact: string; address: string };
  reference: { quoteNumber: string; issued: string; validUntil: string; owner: string };
  scope: string[];
  tiers: QuoteTier[];
  addOns: QuoteAddOn[];
  assumptions: string[];
  locale: string;
  currency: string;
}

// ── Deterministic sample fixture ─────────────────────────────────────────────
export const sampleQuotation: QuotationData = {
  supplier: {
    name: 'Sample Company Ltd',
    address: '12 Harbour Square, Bristol BS1 4QA, United Kingdom',
    email: 'proposals@example.com',
    registration: 'Company No. 09876543 · VAT GB 123 4567 89',
  },
  customer: {
    company: 'Sample Customer Ltd',
    contact: 'Sample Recipient, Head of Platform',
    address: 'Sample Business Park, Kent TN23 7HL',
  },
  reference: {
    quoteNumber: 'QTE-2026-0417',
    issued: '30 August 2026',
    validUntil: '29 September 2026',
    owner: 'Sample Account Manager',
  },
  scope: [
    'Discovery workshop covering current document templates, volumes, and retention obligations.',
    'Implementation of the document generation service in your existing deployment pipeline.',
    'Migration of eleven existing templates, with archival and accessible output enabled.',
    'Two rounds of review against your brand and accessibility guidelines.',
    'Handover, runbook, and a recorded walkthrough for your platform team.',
  ],
  tiers: [
    {
      name: 'Essential',
      tagline: 'Single team, standard templates',
      price: 1450,
      cadence: 'per month',
      includes: ['Up to 3 templates', '50,000 documents / month', 'Business-hours support', 'Archival output'],
    },
    {
      name: 'Professional',
      tagline: 'Multi-team, accessibility included',
      price: 2900,
      cadence: 'per month',
      recommended: true,
      includes: [
        'Up to 15 templates',
        '250,000 documents / month',
        'Priority support, 4-hour response',
        'Archival and accessible output',
        'Quarterly template review',
      ],
    },
    {
      name: 'Enterprise',
      tagline: 'Unlimited scale, dedicated support',
      price: 5600,
      cadence: 'per month',
      includes: [
        'Unlimited templates',
        'Unmetered document volume',
        'Named support engineer',
        'Archival and accessible output',
        'Annual on-site review',
      ],
    },
  ],
  addOns: [
    { label: 'Digital signing', detail: 'Signed and timestamped output', price: 480, cadence: 'per month' },
    { label: 'Template design', detail: 'Bespoke layout, per template', price: 1200, cadence: 'one-off' },
    { label: 'Extended retention', detail: 'Seven-year archive tier', price: 260, cadence: 'per month' },
  ],
  assumptions: [
    'Prices exclude VAT, which is charged at the prevailing rate on invoice.',
    'Volumes are measured monthly and averaged across the billing quarter.',
    'Existing templates are supplied as source files; recreating from scanned output is quoted separately.',
    'Implementation assumes access to a staging environment within ten working days of signature.',
  ],
  locale: 'en-GB',
  currency: 'GBP',
};

// ── Small formatting helpers ─────────────────────────────────────────────────

interface CellStyle {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: TextAlignment;
}

function cell(text: string, style: CellStyle = {}): TextBlock {
  const block = new TextBlock(text);
  block.fontName = style.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  block.fontSize = style.size ?? 9;
  block.textColor = style.color ?? INK;
  if (style.align !== undefined) block.alignment = style.align;
  return block;
}

function money(value: number, data: QuotationData): string {
  return new Intl.NumberFormat(data.locale, {
    style: 'currency',
    currency: data.currency,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Section titles are real level-2 headings rather than styled body text, so
 * assistive technology gets a navigable outline of the quotation instead of a
 * flat wall of paragraphs. They nest under the level-1 masthead.
 */
function sectionTitle(text: string, id: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.tocIdentifier = id;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 11;
  h.textColor = INK;
  h.margin = new Thickness(0, 0, 0, 6);
  return h;
}

function columnHead(text: string, align: TextAlignment = TextAlignment.Left): TextBlock {
  return cell(text, { bold: true, size: 7.5, color: MUTED, align });
}

/** A label-over-value cell, the unit the reference strip is built from. */
function field(label: string, value: string): VerticalStack {
  const stack = new VerticalStack();
  stack.spacing = 1;
  stack.add(cell(label.toUpperCase(), { bold: true, size: 6.5, color: FAINT }));
  stack.add(cell(value));
  return stack;
}

// ── Section builders (top to bottom) ─────────────────────────────────────────

function masthead(data: QuotationData): VerticalStack {
  const identity = new VerticalStack();
  identity.spacing = 2;
  const title = new Heading(data.supplier.name);
  title.level = 1;
  title.tocIdentifier = 'quotation';
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 15;
  title.textColor = ACCENT;
  identity.add(title);
  identity.add(cell(data.supplier.address, { size: 7.5, color: MUTED }));
  identity.add(cell(data.supplier.registration, { size: 7.5, color: FAINT }));

  const marker = new VerticalStack();
  marker.spacing = 2;
  marker.add(cell('QUOTATION', { bold: true, size: 15, align: TextAlignment.Right }));
  marker.add(cell(data.reference.quoteNumber, { bold: true, size: 9, color: MUTED, align: TextAlignment.Right }));

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(identity, 1);
  row.add(marker, 1);

  const rule = new Container();
  rule.height = 2;
  rule.backgroundColor = ACCENT;
  rule.margin = new Thickness(0, 8, 0, 12);

  const stack = new VerticalStack();
  stack.add(row);
  stack.add(rule);
  return stack;
}

function referenceStrip(data: QuotationData): Container {
  const fields: IElement[] = [
    field('Prepared for', data.customer.company),
    field('Attention', data.customer.contact),
    field('Issued', data.reference.issued),
    field('Valid until', data.reference.validUntil),
    field('Account manager', data.reference.owner),
  ];

  const grid = new Grid(...fields.map(() => 1));
  grid.cellPadding = 5;
  grid.border = Border.none;
  grid.addRow(...fields);

  const panel = new Container();
  panel.backgroundColor = PANEL;
  panel.padding = new Thickness(6, 4, 6, 4);
  panel.margin = new Thickness(0, 0, 0, 14);
  panel.child = grid;
  return panel;
}

function scopeSection(data: QuotationData): VerticalStack {
  const list = new OrderedList();
  list.numberFormat = NumberFormat.Decimal;
  list.fontName = StandardFonts.Helvetica;
  list.fontSize = 9;
  list.textColor = INK;
  list.itemSpacing = 4;
  for (const item of data.scope) list.addItem(item);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 14);
  stack.add(sectionTitle('Scope of work', 'scope'));
  stack.add(list);
  return stack;
}

function tierColumns(data: QuotationData): VerticalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 10;

  for (const tier of data.tiers) {
    const promoted = tier.recommended === true;

    const badge = new Container();
    badge.height = 9;
    if (promoted) badge.child = cell('RECOMMENDED', { bold: true, size: 6.5, color: ACCENT_DEEP });

    const header = new VerticalStack();
    header.spacing = 2;
    header.add(badge);
    header.add(cell(tier.name, { bold: true, size: 13, color: promoted ? ACCENT_DEEP : INK }));
    header.add(cell(tier.tagline, { size: 7.5, color: MUTED }));

    const price = new VerticalStack();
    price.spacing = 0;
    price.margin = new Thickness(0, 8, 0, 8);
    price.add(cell(money(tier.price, data), { bold: true, size: 20, color: promoted ? ACCENT_DEEP : INK }));
    price.add(cell(tier.cadence, { size: 7.5, color: MUTED }));

    const features = new UnorderedList();
    features.fontName = StandardFonts.Helvetica;
    features.fontSize = 8;
    features.textColor = INK;
    features.bulletColor = promoted ? ACCENT : MUTED;
    features.itemSpacing = 3.5;
    for (const item of tier.includes) features.addItem(item);

    const body = new VerticalStack();
    body.add(header);
    body.add(price);
    body.add(features);

    const card = new Container();
    card.height = TIER_CARD_HEIGHT;
    if (promoted) card.backgroundColor = ACCENT_SOFT;
    card.border = new Border(promoted ? TIER_BORDER_ON : TIER_BORDER_OFF);
    card.borderColors = new BorderColors(promoted ? ACCENT : LINE);
    const pad = promoted ? TIER_PAD - (TIER_BORDER_ON - TIER_BORDER_OFF) : TIER_PAD;
    card.padding = new Thickness(pad, pad, pad, pad);
    card.child = body;

    row.add(card, 1);
  }

  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 14);
  stack.add(sectionTitle('Pricing options', 'pricing'));
  stack.add(row);
  return stack;
}

function addOnTable(data: QuotationData): VerticalStack {
  const table = new Table(1.6, 2.2, 1);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(LINE);
  table.headerBackgroundColor = PANEL;
  table.addHeader(columnHead('Optional add-on'), columnHead('Detail'), columnHead('Price', TextAlignment.Right));
  for (const addOn of data.addOns) {
    table.addRow(
      cell(addOn.label, { bold: true }),
      cell(addOn.detail, { color: MUTED }),
      cell(`${money(addOn.price, data)} ${addOn.cadence}`, { align: TextAlignment.Right })
    );
  }

  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 14);
  stack.add(sectionTitle('Optional add-ons', 'add-ons'));
  stack.add(table);
  return stack;
}

function validityBand(data: QuotationData): Container {
  const copy = new VerticalStack();
  copy.spacing = 2;
  copy.add(
    cell(`This quotation is valid until ${data.reference.validUntil}`, { bold: true, size: 10, color: ACCENT_DEEP })
  );
  copy.add(
    cell('Prices are held for the period shown. After that date we are happy to re-quote at prevailing rates.', {
      size: 8,
      color: MUTED,
    })
  );

  const band = new Container();
  band.backgroundColor = ACCENT_SOFT;
  band.border = Border.leftOnly(3);
  band.borderColors = BorderColors.leftOnly(ACCENT);
  band.padding = new Thickness(10, 12, 10, 12);
  band.margin = new Thickness(0, 0, 0, 14);
  band.child = copy;
  return band;
}

function assumptionsSection(data: QuotationData): VerticalStack {
  const list = new UnorderedList();
  list.fontName = StandardFonts.Helvetica;
  list.fontSize = 8.5;
  list.textColor = MUTED;
  list.bulletColor = FAINT;
  list.itemSpacing = 4;
  for (const item of data.assumptions) list.addItem(item);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 16);
  stack.add(sectionTitle('Assumptions and exclusions', 'assumptions'));
  stack.add(list);
  return stack;
}

function signatureField(caption: string): VerticalStack {
  const rule = new Line();
  rule.thickness = 0.75;
  rule.color = FAINT;

  const stack = new VerticalStack();
  stack.spacing = 4;
  stack.add(new Spacer(22));
  stack.add(rule);
  stack.add(cell(caption, { size: 7.5, color: MUTED }));
  return stack;
}

function acceptanceBlock(data: QuotationData): Container {
  const fields = new HorizontalStack();
  fields.widthDistribution = WidthDistribution.Weighted;
  fields.spacing = 18;
  fields.add(signatureField('Signed for and on behalf of ' + data.customer.company), 2);
  fields.add(signatureField('Name and position'), 1.5);
  fields.add(signatureField('Date'), 1);

  const intro = cell(
    `To accept, please sign below and return to ${data.supplier.email}, quoting ${data.reference.quoteNumber}.`,
    { color: MUTED }
  );
  intro.margin = new Thickness(0, 0, 0, 4);

  const body = new VerticalStack();
  body.add(sectionTitle('Acceptance', 'acceptance'));
  body.add(intro);
  body.add(fields);

  const card = new Container();
  card.padding = new Thickness(12, 12, 12, 12);
  card.border = new Border(0.75);
  card.borderColors = new BorderColors(LINE);
  card.child = body;
  return card;
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createQuotationSettings(): DocumentSettings {
  // The settings and metadata bags stay in options form here, as they do in
  // every other class companion: the construct-then-mutate convention is about
  // the element tree, not the document's configuration.
  const settings = new DocumentSettings({
    pageSize: 'a4',
    margin: 40,
    conformance: 'pdf/a-2a',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
  });
  settings.footerTemplate = (pageNumber: number) => {
    const footer = new TextBlock(
      `${sampleQuotation.reference.quoteNumber} · Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
    );
    footer.fontName = StandardFonts.Helvetica;
    footer.fontSize = 7;
    footer.textColor = FAINT;
    footer.alignment = TextAlignment.Center;
    return footer;
  };
  return settings;
}

export function buildDocument(data: QuotationData, settings: DocumentSettings = createQuotationSettings()): Document {
  const doc = new Document(
    settings,
    new DocumentMetadata({
      title: `Quotation ${data.reference.quoteNumber} — ${data.customer.company}`,
      author: data.supplier.name,
      subject: 'Commercial quotation with tiered pricing options (fictional sample data).',
    })
  );
  doc.add(masthead(data));
  doc.add(referenceStrip(data));
  doc.add(scopeSection(data));
  doc.add(tierColumns(data));
  doc.add(addOnTable(data));
  doc.add(validityBand(data));
  doc.add(assumptionsSection(data));
  doc.add(acceptanceBlock(data));
  return doc;
}

export function generate(): Document {
  return buildDocument(sampleQuotation);
}
