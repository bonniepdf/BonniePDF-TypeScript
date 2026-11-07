/**
 * Quotation.
 * A B2B sales quotation: a three-tier pricing comparison with the recommended tier highlighted, a scope of work, optional add-ons, and an acceptance block.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Quotation / proposal (B2B pre-sales) ─────────────────────────────────────
//
// A sales quotation is not an invoice with a different heading. An invoice
// states one settled figure; a quotation *presents a choice* and then asks for
// a decision. This document is built around that difference:
//
//   - a three-tier pricing comparison (`tierColumns`) instead of a flat
//     line-item table, with the recommended tier visually promoted;
//   - a numbered scope of work and a bulleted assumptions list, so what is and
//     is not included is legible at a glance rather than buried in a cell;
//   - a validity band, because a quote that does not expire is a liability;
//   - an acceptance block with real ruled signature lines, so the page is the
//     instrument the customer signs rather than a page they reply to.
//
// Everything derives from `QuotationData`; no total is hand-typed. Output is
// PDF/A-2a + PDF/UA-1, matching the bar the invoice family sets.

import {
  pageNumber,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  Heading,
  HorizontalStack,
  Line,
  OrderedList,
  Spacer,
  StandardFonts,
  Svg,
  Table,
  TextBlock,
  UnorderedList,
  VerticalStack,
  ColorPalette,
  type ContainerOptions,
  type TextBlockOptions,
  pageTemplate,
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

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
// 600, not 500/400: both fall short of 4.5:1 on this document's backgrounds
// (500 to 4.34:1 on a violet-tinted panel, 400 to 2.51-2.63:1 everywhere).
const MUTED = ColorPalette.slate[600];
const FAINT = ColorPalette.slate[600];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[50];
const ACCENT = ColorPalette.violet[600];
const ACCENT_SOFT = ColorPalette.violet[50];
const ACCENT_DEEP = ColorPalette.violet[700];

const HELVETICA = StandardFonts.Helvetica;
const HELVETICA_BOLD = StandardFonts.HelveticaBold;

// ── Reusable option objects ──────────────────────────────────────────────────
const bodyText: TextBlockOptions = { fontName: HELVETICA, fontSize: 9, color: INK };
const boldText: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 9, color: INK };
const mutedText: TextBlockOptions = { ...bodyText, color: MUTED };
const fieldLabel: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 6.5, color: FAINT };
const columnHead: TextBlockOptions = { fontName: HELVETICA_BOLD, fontSize: 7.5, color: MUTED };
const moneyRight: TextBlockOptions = { ...bodyText, alignment: 'right' };

const cardBase: ContainerOptions = { padding: [12, 12], border: { width: 0.75, color: LINE } };

/** Uniform height for the three pricing columns — see `tierColumns`. */
const TIER_CARD_HEIGHT = 178;
const TIER_PAD = 12;
const TIER_BORDER_ON = 1.5;
const TIER_BORDER_OFF = 0.75;

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

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  return buildDocument(sampleQuotation, createQuotationSettings(), assets);
}

// Local helpers and sample types used by this document.

/**
 * Section titles are real level-2 headings rather than styled body text, so
 * assistive technology gets a navigable outline of the quotation instead of a
 * flat wall of paragraphs. They nest under the level-1 masthead.
 */
function sectionTitle(text: string, id: string): Heading {
  return new Heading(text, {
    level: 2,
    tocIdentifier: id,
    fontName: HELVETICA_BOLD,
    fontSize: 11,
    color: INK,
    margin: { bottom: 6 },
  });
}

// ── Domain model ─────────────────────────────────────────────────────────────

/** One purchasable tier. `price` is the recurring or one-off headline figure. */
export interface QuoteTier {
  name: string;
  tagline: string;
  price: number;
  /** Billing cadence shown under the price, e.g. "per month". */
  cadence: string;
  /** What the customer gets. Rendered as the tier's feature list. */
  includes: string[];
  /** Exactly one tier should set this; it is promoted visually. */
  recommended?: boolean;
}

/** A priced optional extra the customer can add to any tier. */
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
  /** Numbered deliverables — what the engagement actually covers. */
  scope: string[];
  tiers: QuoteTier[];
  addOns: QuoteAddOn[];
  /** Bulleted caveats. A quote without these is an argument waiting to happen. */
  assumptions: string[];
  locale: string;
  currency: string;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function money(value: number, data: QuotationData): string {
  return new Intl.NumberFormat(data.locale, {
    style: 'currency',
    currency: data.currency,
    minimumFractionDigits: 0,
  }).format(value);
}

// ── Section builders ─────────────────────────────────────────────────────────

function masthead(data: QuotationData, assets?: ReadonlyMap<string, Uint8Array>): VerticalStack {
  const identity = new VerticalStack({
    spacing: 2,
    children: [
      new Heading(data.supplier.name, {
        level: 1,
        tocIdentifier: 'quotation',
        fontName: HELVETICA_BOLD,
        fontSize: 15,
        color: ACCENT,
      }),
      new TextBlock(data.supplier.address, { fontName: HELVETICA, fontSize: 7.5, color: MUTED }),
      new TextBlock(data.supplier.registration, { fontName: HELVETICA, fontSize: 7.5, color: FAINT }),
    ],
  });
  const brand = new HorizontalStack({
    widthDistribution: 'auto',
    spacing: 8,
    children: [new Svg({ svgData: logoMarkup(assets), width: 26, height: 26, isDecorative: true }), identity],
  });
  const marker = new VerticalStack({
    spacing: 2,
    children: [
      new TextBlock('QUOTATION', { fontName: HELVETICA_BOLD, fontSize: 15, color: INK, alignment: 'right' }),
      new TextBlock(data.reference.quoteNumber, {
        fontName: HELVETICA_BOLD,
        fontSize: 9,
        color: MUTED,
        alignment: 'right',
      }),
    ],
  });

  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(brand, 1);
  row.add(marker, 1);

  return new VerticalStack({
    children: [row, new Container({ height: 2, backgroundColor: ACCENT, margin: { top: 8, bottom: 12 } })],
  });
}

/** Label-over-value cells in a light panel — the reference strip. */
function referenceStrip(data: QuotationData): Container {
  const pairs: [string, string][] = [
    ['Prepared for', data.customer.company],
    ['Attention', data.customer.contact],
    ['Issued', data.reference.issued],
    ['Valid until', data.reference.validUntil],
    ['Account manager', data.reference.owner],
  ];
  const grid = new Grid({ columns: pairs.map(() => 1), cellPadding: 5, border: 0 });
  grid.addRow(
    ...pairs.map(
      ([label, value]) =>
        new VerticalStack({
          spacing: 1,
          children: [new TextBlock(label.toUpperCase(), fieldLabel), new TextBlock(value, bodyText)],
        })
    )
  );
  return new Container({ backgroundColor: PANEL, padding: [6, 4], margin: { bottom: 14 }, child: grid });
}

/** The numbered deliverables. An ordered list, not a table — these are steps. */
function scopeSection(data: QuotationData): VerticalStack {
  return new VerticalStack({
    margin: { bottom: 14 },
    children: [
      sectionTitle('Scope of work', 'scope'),
      new OrderedList({
        items: data.scope,
        numberFormat: 'decimal',
        fontName: HELVETICA,
        fontSize: 9,
        color: INK,
        itemSpacing: 4,
      }),
    ],
  });
}

/**
 * The centrepiece: three tiers side by side. The recommended tier gets the
 * accent border, a filled header, and a badge, so the eye lands on it first —
 * the visual grammar every SaaS pricing page uses, applied to a printed quote.
 */
function tierColumns(data: QuotationData): VerticalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 10 });

  for (const tier of data.tiers) {
    const promoted = tier.recommended === true;

    // A fixed-height slot, filled only on the promoted tier. Reserving the
    // space unconditionally keeps all three tier names on the same baseline;
    // rendering an invisible label instead would tie alignment to a colour.
    const badge = new Container({
      height: 9,
      child: promoted
        ? new TextBlock('RECOMMENDED', { fontName: HELVETICA_BOLD, fontSize: 6.5, color: ACCENT_DEEP })
        : undefined,
    });

    const header = new VerticalStack({
      spacing: 2,
      children: [
        badge,
        new TextBlock(tier.name, {
          fontName: HELVETICA_BOLD,
          fontSize: 13,
          color: promoted ? ACCENT_DEEP : INK,
        }),
        new TextBlock(tier.tagline, { fontName: HELVETICA, fontSize: 7.5, color: MUTED }),
      ],
    });

    const price = new VerticalStack({
      spacing: 0,
      margin: { top: 8, bottom: 8 },
      children: [
        new TextBlock(money(tier.price, data), {
          fontName: HELVETICA_BOLD,
          fontSize: 20,
          color: promoted ? ACCENT_DEEP : INK,
        }),
        new TextBlock(tier.cadence, { fontName: HELVETICA, fontSize: 7.5, color: MUTED }),
      ],
    });

    const features = new UnorderedList({
      items: tier.includes,
      fontName: HELVETICA,
      fontSize: 8,
      color: INK,
      bulletColor: promoted ? ACCENT : MUTED,
      itemSpacing: 3.5,
    });

    row.add(
      new Container({
        ...cardBase,
        // A pricing comparison only reads as a comparison when the columns
        // line up, so the cards share one height rather than each shrinking
        // to its own feature count.
        height: TIER_CARD_HEIGHT,
        backgroundColor: promoted ? ACCENT_SOFT : undefined,
        border: promoted ? { width: TIER_BORDER_ON, color: ACCENT } : { width: TIER_BORDER_OFF, color: LINE },
        // A child's origin is border + padding, so the promoted card's heavier
        // border would otherwise shift its whole column down and right against
        // its neighbours. Give back exactly what the extra border takes.
        padding: promoted ? TIER_PAD - (TIER_BORDER_ON - TIER_BORDER_OFF) : TIER_PAD,
        child: new VerticalStack({ children: [header, price, features] }),
      }),
      1
    );
  }

  return new VerticalStack({
    margin: { bottom: 14 },
    children: [sectionTitle('Pricing options', 'pricing'), row],
  });
}

function addOnTable(data: QuotationData): VerticalStack {
  const table = new Table({
    columns: [1.6, 2.2, 1],
    cellPadding: 6,
    border: { width: 0.5, color: LINE },
    headerBackgroundColor: PANEL,
  });
  table.addHeader(
    new TextBlock('Optional add-on', columnHead),
    new TextBlock('Detail', columnHead),
    new TextBlock('Price', { ...columnHead, alignment: 'right' })
  );
  for (const addOn of data.addOns) {
    table.addRow(
      new TextBlock(addOn.label, boldText),
      new TextBlock(addOn.detail, mutedText),
      new TextBlock(`${money(addOn.price, data)} ${addOn.cadence}`, moneyRight)
    );
  }
  return new VerticalStack({
    margin: { bottom: 14 },
    children: [sectionTitle('Optional add-ons', 'add-ons'), table],
  });
}

/** A quote that never expires is a standing offer. Say when it lapses. */
function validityBand(data: QuotationData): Container {
  const copy = new VerticalStack({
    spacing: 2,
    children: [
      new TextBlock(`This quotation is valid until ${data.reference.validUntil}`, {
        fontName: HELVETICA_BOLD,
        fontSize: 10,
        color: ACCENT_DEEP,
      }),
      new TextBlock(
        'Prices are held for the period shown. After that date we are happy to re-quote at prevailing rates.',
        { fontName: HELVETICA, fontSize: 8, color: MUTED }
      ),
    ],
  });
  return new Container({
    backgroundColor: ACCENT_SOFT,
    border: { left: 3, color: ACCENT },
    padding: [10, 12],
    margin: { bottom: 14 },
    child: copy,
  });
}

function assumptionsSection(data: QuotationData): VerticalStack {
  return new VerticalStack({
    margin: { bottom: 16 },
    children: [
      sectionTitle('Assumptions and exclusions', 'assumptions'),
      new UnorderedList({
        items: data.assumptions,
        fontName: HELVETICA,
        fontSize: 8.5,
        color: MUTED,
        bulletColor: FAINT,
        itemSpacing: 4,
      }),
    ],
  });
}

/** A ruled line with its caption underneath — one signature field. */
function signatureField(caption: string): VerticalStack {
  return new VerticalStack({
    spacing: 4,
    children: [
      new Spacer(22),
      new Line({ thickness: 0.75, color: FAINT }),
      new TextBlock(caption, { fontName: HELVETICA, fontSize: 7.5, color: MUTED }),
    ],
  });
}

/**
 * The acceptance block. This is what turns the page from information into an
 * instrument: the customer signs *this* document rather than replying to it.
 */
function acceptanceBlock(data: QuotationData): Container {
  const fields = new HorizontalStack({ widthDistribution: 'weighted', spacing: 18 });
  fields.add(signatureField('Signed for and on behalf of ' + data.customer.company), 2);
  fields.add(signatureField('Name and position'), 1.5);
  fields.add(signatureField('Date'), 1);

  return new Container({
    ...cardBase,
    // The signature fields stay with the wording that asks for them.
    breakAllowed: false,
    child: new VerticalStack({
      children: [
        sectionTitle('Acceptance', 'acceptance'),
        new TextBlock(
          `To accept, please sign below and return to ${data.supplier.email}, quoting ${data.reference.quoteNumber}.`,
          { ...mutedText, margin: { bottom: 4 } }
        ),
        fields,
      ],
    }),
  });
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createQuotationSettings(): DocumentSettings {
  const settings = new DocumentSettings({
    pageSize: 'a4',
    margin: 40,
    conformance: 'pdf/a-2a',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
  });
  settings.footerTemplate = pageTemplate({
    default: pageNumber(`${sampleQuotation.reference.quoteNumber} · Page {page} of {total}`, {
      fontName: HELVETICA,
      fontSize: 7,
      color: FAINT,
      alignment: 'center',
    }),
  });
  return settings;
}

export function buildDocument(
  data: QuotationData,
  settings: DocumentSettings = createQuotationSettings(),
  assets?: ReadonlyMap<string, Uint8Array>
): Document {
  const doc = new Document(
    settings,
    new DocumentMetadata({
      title: `Quotation ${data.reference.quoteNumber} — ${data.customer.company}`,
      author: data.supplier.name,
      subject: 'Commercial quotation with tiered pricing options (fictional sample data).',
    })
  );

  doc.add(masthead(data, assets));
  doc.add(referenceStrip(data));
  doc.add(scopeSection(data));
  doc.add(tierColumns(data));
  doc.add(addOnTable(data));
  doc.add(validityBand(data));
  doc.add(assumptionsSection(data));
  doc.add(acceptanceBlock(data));
  return doc;
}
