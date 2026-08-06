// ── Insurance policy schedule & coverage summary ─────────────────────────────
//
// A regulated-document flagship for the Insurance vertical: policyholder and
// insured-property details, coverage limits and deductibles, a premium
// breakdown, endorsements/exclusions, claims contacts, a renewal date, a QR
// link to a self-service portal, accessible long tables, and PDF/A-2a
// archival output. A good fit for BonniePDF's model of generating structured
// documents from application data — it is not dependent on form filling.
//
// Fixture-driven: `buildDocument(data)` is pure over a typed domain model, with
// `generate()` as a thin adapter feeding in deterministic sample data.
// Conformance: PDF/A-2a + PDF/UA-1, en-GB. Entirely fictional. Fully
// self-contained — no shared kit. Authored through the options-object front door.

import {
  Document,
  TextBlock,
  Heading,
  VerticalStack,
  Container,
  Table,
  Grid,
  TextElementBase,
  QRCode,
  StandardFonts,
  TextAlignment,
  ColorPalette,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[500];
const FAINT = ColorPalette.slate[400];
const HEADER_BG = ColorPalette.slate[100];
const RULE = ColorPalette.slate[200];
const BRAND = ColorPalette.teal[700];
const BRAND_SOFT = ColorPalette.teal[50];
const ACCENT = ColorPalette.amber[600];
const DANGER = ColorPalette.rose[700];

// ── Domain model ─────────────────────────────────────────────────────────────

export interface Coverage {
  peril: string; // e.g. "Fire, lightning"
  section: string; // e.g. "Buildings"
  limit: number; // sum insured
  deductible: number;
}

export interface PremiumLine {
  label: string;
  amount: number;
}

export interface Endorsement {
  code: string;
  title: string;
  detail: string;
  type: 'endorsement' | 'exclusion';
}

export interface PolicyScheduleData {
  insurer: { name: string; address: string; authCode: string };
  policy: { number: string; product: string; inception: string; renewal: string; status: string };
  policyholder: { name: string; address: string; email: string };
  insuredRisk: { type: string; address: string; yearBuilt: number; rebuild: number };
  coverages: Coverage[];
  premiums: PremiumLine[];
  endorsements: Endorsement[];
  claims: { phone: string; email: string; hours: string };
  portalUrl: string;
  locale: string;
  currency: string;
}

// ── Sample fixture ────────────────────────────────────────────────────────────

export const samplePolicySchedule: PolicyScheduleData = {
  insurer: {
    name: 'Meridian Home Insurance Ltd',
    address: '20 Fenchurch Street\nLondon EC3M 8AF\nAuthorised by the FCA (fictional)',
    authCode: 'MHIL-FC-0099',
  },
  policy: {
    number: 'HOM-2026-8842139',
    product: 'HomeShield Buildings & Contents',
    inception: '01 Sep 2026',
    renewal: '01 Sep 2027',
    status: 'Active',
  },
  policyholder: {
    name: 'Daniel & Hana Osei',
    address: '47 Lime Tree Walk\nLeeds LS6 1QR',
    email: 'd.osei@example.co.uk',
  },
  insuredRisk: {
    type: 'Semi-detached house',
    address: '47 Lime Tree Walk, Leeds LS6 1QR',
    yearBuilt: 1936,
    rebuild: 412000,
  },
  coverages: [
    { peril: 'Fire, smoke, lightning', section: 'Buildings', limit: 412000, deductible: 250 },
    { peril: 'Subsidence / heave', section: 'Buildings', limit: 412000, deductible: 1000 },
    { peril: 'Escape of water', section: 'Buildings', limit: 412000, deductible: 350 },
    { peril: 'Storm & flood', section: 'Buildings', limit: 412000, deductible: 250 },
    { peril: 'Accidental damage', section: 'Buildings', limit: 412000, deductible: 250 },
    { peril: 'Contents (replacement)', section: 'Contents', limit: 65000, deductible: 150 },
    { peril: 'Valuable possessions', section: 'Contents', limit: 15000, deductible: 250 },
    { peril: 'Personal legal liability', section: 'Liability', limit: 2000000, deductible: 0 },
    { peril: 'Alternative accommodation', section: 'Buildings', limit: 30000, deductible: 0 },
    { peril: 'Pedal cycles (away from home)', section: 'Contents', limit: 2000, deductible: 100 },
  ],
  premiums: [
    { label: 'Base premium (Buildings)', amount: 312.4 },
    { label: 'Base premium (Contents)', amount: 148.6 },
    { label: 'Accidental damage extension', amount: 58.0 },
    { label: 'Personal possessions cover', amount: 34.5 },
    { label: 'Broker fee', amount: 25.0 },
    { label: 'Insurance Premium Tax (12%)', amount: 69.42 },
  ],
  endorsements: [
    {
      code: 'EN-01',
      title: 'High-value items schedule',
      detail: 'Items over £2,000 listed in Appendix A.',
      type: 'endorsement',
    },
    {
      code: 'EN-04',
      title: 'Home business extension',
      detail: 'Covers incidental office use up to £15,000.',
      type: 'endorsement',
    },
    {
      code: 'EX-12',
      title: 'Wear and tear / gradual deterioration',
      detail: 'Excluded in all sections.',
      type: 'exclusion',
    },
    {
      code: 'EX-22',
      title: 'Acts of terrorism',
      detail: 'Excluded unless Pool Re extension purchased.',
      type: 'exclusion',
    },
    {
      code: 'EX-27',
      title: 'Unoccupied property beyond 60 days',
      detail: 'Theft and water damage excluded if unoccupied > 60 consecutive days.',
      type: 'exclusion',
    },
    {
      code: 'EN-09',
      title: 'Smart-water property marking',
      detail: '£50 excess reduction on approved theft claims.',
      type: 'endorsement',
    },
  ],
  claims: { phone: '0800 555 0142', email: 'claims@meridian-home.example', hours: '24 hours / 7 days' },
  portalUrl: 'https://portal.meridian-home.example/p/HOM-2026-8842139',
  locale: 'en-GB',
  currency: 'GBP',
};

// ── Local helpers ─────────────────────────────────────────────────────────────

interface CellOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: TextAlignmentInput;
}

function cell(text: string, o: CellOpts = {}): TextBlock {
  return new TextBlock(text, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    textColor: o.color ?? INK,
    alignment: o.align,
  });
}

function money(value: number, locale = 'en-GB', currency = 'GBP'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function eyebrow(text: string, color: ColorInput = BRAND): TextBlock {
  return cell(text.toUpperCase(), { bold: true, size: 8, color });
}

function kvBlock(label: string, rows: [string, string][]): VerticalStack {
  const stack = new VerticalStack({ children: [cell(label, { bold: true, size: 8, color: BRAND })] });
  const grid = new Grid({ columns: [1.1, 1.4], cellPadding: 0, border: 0 });
  for (const [k, v] of rows) {
    grid.addRow(cell(k, { size: 8, color: FAINT }), cell(v, { size: 9 }));
  }
  stack.add(grid);
  return stack;
}

// ── buildDocument ────────────────────────────────────────────────────────────

export function buildDocument(data: PolicyScheduleData): Document {
  const premiumTotal = data.premiums.reduce((a, p) => a + p.amount, 0);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 50,
      pageColor: '#ffffff',
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: INK },
      headerTemplate: (pageNumber: number) =>
        new TextBlock(
          `${data.insurer.name} · Policy ${data.policy.number} · Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`,
          { fontName: StandardFonts.Helvetica, fontSize: 7.5, textColor: FAINT, alignment: TextAlignment.Left }
        ),
      footerTemplate: (pageNumber: number) =>
        new TextBlock(
          `${data.policy.product} · Renewal ${data.policy.renewal} · Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`,
          { fontName: StandardFonts.Helvetica, fontSize: 7.5, textColor: FAINT, alignment: TextAlignment.Center }
        ),
    },
    metadata: {
      title: `Policy Schedule — ${data.policy.product} — ${data.policy.number}`,
      author: data.insurer.name,
      subject: 'Insurance policy schedule and coverage summary (fictional sample).',
    },
  });

  // ── Masthead ──────────────────────────────────────────────────────────────
  const masthead = new Grid({ columns: [1.6, 1], cellPadding: 0, border: 0, margin: { bottom: 10 } });
  const statusBox = new Container({
    backgroundColor: BRAND_SOFT,
    padding: [8, 10],
    border: { left: 3, color: BRAND },
    child: new VerticalStack({
      children: [
        cell('POLICY SCHEDULE', { bold: true, size: 11, color: BRAND }),
        cell(`${data.policy.status.toUpperCase()} · renews ${data.policy.renewal}`, { size: 8, color: MUTED }),
      ],
    }),
  });
  masthead.addRow(
    new VerticalStack({
      children: [
        new Heading(data.insurer.name, {
          level: 1,
          fontName: StandardFonts.HelveticaBold,
          fontSize: 18,
          textColor: BRAND,
        }),
        cell(data.insurer.address, { size: 8, color: MUTED }),
      ],
    }),
    statusBox
  );
  doc.add(masthead);
  doc.add(new Container({ backgroundColor: BRAND, padding: { top: 1.5 }, child: new TextBlock(' ', { fontSize: 1 }) }));

  // ── Policy + policyholder + risk (three-column block) ─────────────────────
  const riskGrid = new Grid({ columns: [1, 1, 1], cellPadding: 12, border: 0 });
  riskGrid.addRow(
    kvBlock('POLICY', [
      ['Policy number', data.policy.number],
      ['Product', data.policy.product],
      ['Inception', data.policy.inception],
      ['Renewal', data.policy.renewal],
    ]),
    kvBlock('POLICYHOLDER', [
      ['Name', data.policyholder.name],
      ['Address', data.policyholder.address],
      ['Email', data.policyholder.email],
    ]),
    kvBlock('INSURED RISK', [
      ['Property type', data.insuredRisk.type],
      ['Risk address', data.insuredRisk.address],
      ['Year built', String(data.insuredRisk.yearBuilt)],
      ['Rebuild sum insured', money(data.insuredRisk.rebuild, data.locale, data.currency)],
    ])
  );
  doc.add(new Container({ border: { width: 0.5, color: RULE }, margin: { top: 14, bottom: 16 }, child: riskGrid }));

  // ── Coverage schedule (the long table — repeats headers across pages) ─────
  doc.add(eyebrow('Schedule of cover'));
  const covTable = new Table({
    columns: [2.6, 1.2, 1.2, 1, 0.8],
    cellPadding: 7,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
    repeatHeadersOnNewPage: true,
    margin: { top: 4, bottom: 14 },
  });
  covTable.addHeader(
    cell('Peril / benefit', { bold: true, size: 8, align: 'left' }),
    cell('Section', { bold: true, size: 8, align: 'left' }),
    cell('Sum insured', { bold: true, size: 8, align: 'right' }),
    cell('Deductible', { bold: true, size: 8, align: 'right' }),
    cell('Status', { bold: true, size: 8, align: 'center' })
  );
  for (const c of data.coverages) {
    covTable.addRow(
      cell(c.peril, { align: 'left' }),
      cell(c.section, { align: 'left', color: MUTED }),
      cell(money(c.limit, data.locale, data.currency), { align: 'right' }),
      cell(c.deductible > 0 ? money(c.deductible, data.locale, data.currency) : 'Nil', {
        align: 'right',
        color: MUTED,
      }),
      cell('Covered', { align: 'center', color: BRAND })
    );
  }
  doc.add(covTable);

  // ── Premium breakdown + QR portal (side by side) ──────────────────────────
  const premTable = new Table({
    columns: [3, 1],
    cellPadding: 5,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
    margin: { top: 4 },
  });
  premTable.addHeader(
    cell('Premium breakdown', { bold: true, size: 8, align: 'left' }),
    cell('Amount', { bold: true, size: 8, align: 'right' })
  );
  for (const p of data.premiums) {
    premTable.addRow(
      cell(p.label, { align: 'left' }),
      cell(money(p.amount, data.locale, data.currency), { align: 'right' })
    );
  }
  premTable.addRow(
    cell('Total annual premium', { bold: true, align: 'left', color: BRAND }),
    cell(money(premiumTotal, data.locale, data.currency), { bold: true, align: 'right', color: BRAND })
  );

  const qrCard = new Container({
    backgroundColor: '#ffffff',
    border: { width: 0.5, color: RULE },
    padding: [10, 10],
    child: new VerticalStack({
      spacing: 6,
      children: [
        cell('Self-service portal', { bold: true, size: 8, color: MUTED, align: 'center' }),
        new Container({
          horizontalAlignment: 'center',
          child: new QRCode({
            data: data.portalUrl,
            size: 92,
            quietZone: 1,
            errorCorrection: 'high',
            foregroundColor: INK,
            altText: `QR code linking to the policy portal for policy ${data.policy.number}`,
          }),
        }),
        cell('Scan to view documents and report a claim', { size: 7.5, color: FAINT, align: 'center' }),
      ],
    }),
  });

  const premQrGrid = new Grid({ columns: [1.4, 1], cellPadding: 0, border: 0, margin: { top: 4 } });
  premQrGrid.addRow(premTable, new Container({ padding: { left: 16 }, child: qrCard }));
  doc.add(premQrGrid);

  // ── Endorsements & exclusions ─────────────────────────────────────────────
  doc.add(eyebrow('Endorsements & exclusions'));
  const endTable = new Table({
    columns: [0.8, 2, 4],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: HEADER_BG,
    headerTextColor: INK,
    margin: { top: 4, bottom: 14 },
  });
  endTable.addHeader(
    cell('Code', { bold: true, size: 8, align: 'left' }),
    cell('Title', { bold: true, size: 8, align: 'left' }),
    cell('Detail', { bold: true, size: 8, align: 'left' })
  );
  for (const e of data.endorsements) {
    const isExcl = e.type === 'exclusion';
    endTable.addRow(
      cell(e.code, { align: 'left', bold: true, color: isExcl ? DANGER : ACCENT }),
      cell(e.title, { align: 'left', color: isExcl ? DANGER : INK }),
      cell(e.detail, { align: 'left', color: MUTED })
    );
  }
  doc.add(endTable);

  // ── Claims & contacts ─────────────────────────────────────────────────────
  const claimsGrid = new Grid({ columns: [1, 1, 1], cellPadding: 0, border: 0 });
  claimsGrid.addRow(
    new VerticalStack({
      children: [
        cell('CLAIMS LINE', { bold: true, size: 8, color: BRAND }),
        cell(data.claims.phone, { bold: true, size: 13 }),
      ],
    }),
    new VerticalStack({
      children: [cell('EMAIL', { bold: true, size: 8, color: BRAND }), cell(data.claims.email, { size: 10 })],
    }),
    new VerticalStack({
      children: [cell('HOURS', { bold: true, size: 8, color: BRAND }), cell(data.claims.hours, { size: 10 })],
    })
  );
  doc.add(
    new Container({
      backgroundColor: BRAND_SOFT,
      border: { left: 3, color: BRAND },
      padding: [14, 16],
      margin: { top: 6 },
      child: claimsGrid,
    })
  );

  // ── Renewal & notice ──────────────────────────────────────────────────────
  doc.add(
    new Container({
      margin: { top: 14 },
      child: cell(
        `This schedule is a summary; the full policy wording prevails. Cover continues until ${data.policy.renewal} ` +
          'unless renewed or cancelled. This is a fictional document for demonstration only and is not insurance advice.',
        { size: 7.5, color: FAINT }
      ),
    })
  );

  return doc;
}

export function generate(): Document {
  return buildDocument(samplePolicySchedule);
}
