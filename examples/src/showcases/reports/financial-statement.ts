// ── UK / EU statutory financial statements ───────────────────────────────────
//
// Portfolio #2, framed for UK/EU rather than US. This is a real *statutory*
// financial statement in the IFRS / UK Companies House idiom - not a marketing
// dashboard: a Statement of Comprehensive Income and a Statement of Financial
// Position with prior-year comparatives, note references, accounting-style
// bracketed negatives, and subtotal rules. Amounts in £ thousands.
//
// Archival + accessible: PDF/A-2a + PDF/UA-1, en-GB. Fictional company.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextElementBase,
  TextAlignment,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  PdfAConformance,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

const NAVY = ColorPalette.slate[800];
const INK = ColorPalette.slate[700];
const MUTED = ColorPalette.slate[500];
const RULE = ColorPalette.slate[300];

interface Line {
  label: string;
  note?: string;
  cur?: number;
  prior?: number;
  kind?: 'line' | 'section' | 'subtotal' | 'total';
  indent?: boolean;
}

const INCOME: Line[] = [
  { label: 'Revenue', note: '2', cur: 48210, prior: 42880 },
  { label: 'Cost of sales', cur: -29140, prior: -26050 },
  { label: 'Gross profit', cur: 19070, prior: 16830, kind: 'subtotal' },
  { label: 'Administrative expenses', cur: -11240, prior: -10110 },
  { label: 'Other operating income', note: '3', cur: 640, prior: 410 },
  { label: 'Operating profit', cur: 8470, prior: 7130, kind: 'subtotal' },
  { label: 'Finance income', cur: 120, prior: 90 },
  { label: 'Finance costs', cur: -515, prior: -560 },
  { label: 'Profit before taxation', cur: 8075, prior: 6660, kind: 'subtotal' },
  { label: 'Taxation', note: '6', cur: -1940, prior: -1600 },
  { label: 'Profit for the financial year', cur: 6135, prior: 5060, kind: 'total' },
];

const POSITION: Line[] = [
  { label: 'Non-current assets', kind: 'section' },
  { label: 'Property, plant and equipment', note: '9', cur: 14820, prior: 13110, indent: true },
  { label: 'Intangible assets', note: '10', cur: 6240, prior: 5980, indent: true },
  { label: 'Right-of-use assets', cur: 3115, prior: 3480, indent: true },
  { label: '', cur: 24175, prior: 22570, kind: 'subtotal' },
  { label: 'Current assets', kind: 'section' },
  { label: 'Inventories', cur: 4460, prior: 3990, indent: true },
  { label: 'Trade and other receivables', note: '12', cur: 8730, prior: 7620, indent: true },
  { label: 'Cash and cash equivalents', cur: 9905, prior: 6840, indent: true },
  { label: '', cur: 23095, prior: 18450, kind: 'subtotal' },
  { label: 'Total assets', cur: 47270, prior: 41020, kind: 'total' },
  { label: 'Current liabilities', kind: 'section' },
  { label: 'Trade and other payables', cur: -7180, prior: -6410, indent: true },
  { label: 'Lease liabilities', cur: -640, prior: -600, indent: true },
  { label: 'Current tax', cur: -1890, prior: -1520, indent: true },
  { label: '', cur: -9710, prior: -8530, kind: 'subtotal' },
  { label: 'Non-current liabilities', kind: 'section' },
  { label: 'Borrowings', note: '14', cur: -8200, prior: -9000, indent: true },
  { label: 'Deferred tax', cur: -1225, prior: -1090, indent: true },
  { label: '', cur: -9425, prior: -10090, kind: 'subtotal' },
  { label: 'Net assets', cur: 28135, prior: 22400, kind: 'total' },
  { label: 'Equity', kind: 'section' },
  { label: 'Share capital', cur: 2000, prior: 2000, indent: true },
  { label: 'Share premium', cur: 5400, prior: 5400, indent: true },
  { label: 'Retained earnings', cur: 20735, prior: 15000, indent: true },
  { label: 'Total equity', cur: 28135, prior: 22400, kind: 'total' },
];

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 54);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(INK);

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const f = new TextBlock(
      `Sample Company Ltd  ·  Company no. 07741122  ·  Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`
    );
    f.fontName = StandardFonts.Helvetica;
    f.fontSize = 8;
    f.textColor = MUTED;
    return f;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Financial Statements - Sample Company Ltd';
  metadata.author = 'Sample Company Ltd';
  metadata.subject = 'Statutory financial statements (IFRS) for the year ended 31 March 2026 (fictional).';

  const doc = new Document(settings, metadata);

  // ── Title block ───────────────────────────────────────────────────────────
  doc.add(company('Sample Company Ltd'));
  doc.add(h1('Annual Report and Financial Statements'));
  doc.add(sub('For the year ended 31 March 2026'));
  doc.add(sub('Company registration number 07741122 (England & Wales)  ·  Prepared under UK-adopted IFRS'));
  doc.add(gap(18));

  // ── Statement 1: Comprehensive income ─────────────────────────────────────
  doc.add(h2('Statement of Comprehensive Income'));
  doc.add(columnHeads());
  doc.add(rule(RULE, 0.6));
  for (const l of INCOME) doc.add(renderLine(l));
  doc.add(gap(8));
  doc.add(sub('The notes on pages 8 to 21 form part of these financial statements.'));

  // ── Statement 2: Financial position ───────────────────────────────────────
  doc.addPage();
  doc.add(h2('Statement of Financial Position'));
  doc.add(sub('As at 31 March 2026'));
  doc.add(gap(6));
  doc.add(columnHeads());
  doc.add(rule(RULE, 0.6));
  for (const l of POSITION) doc.add(renderLine(l));
  doc.add(gap(12));
  doc.add(
    sub(
      'These financial statements were approved by the Board of Directors and authorised ' +
        'for issue on 20 June 2026, and are signed on its behalf by A. Whitfield, Director.'
    )
  );

  return doc;
}

// ── Row rendering ─────────────────────────────────────────────────────────────

function renderLine(l: Line): IElement {
  if (l.kind === 'section') {
    const t = new TextBlock(l.label);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 10;
    t.textColor = NAVY;
    t.margin = new Thickness(0, 8, 0, 4);
    return t;
  }

  const bold = l.kind === 'subtotal' || l.kind === 'total';
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 2, 0, 2);
  const label = new TextBlock(l.label);
  label.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  label.fontSize = 10;
  label.textColor = bold ? NAVY : INK;
  if (l.indent) label.margin = new Thickness(14, 0, 0, 0);
  row.add(label, 6);
  row.add(numCell(l.note ?? '', false, MUTED, TextAlignment.Center), 1);
  row.add(numCell(fmt(l.cur), bold, bold ? NAVY : INK, TextAlignment.Right), 2);
  row.add(numCell(fmt(l.prior), bold, MUTED, TextAlignment.Right), 2);

  // Subtotals/totals get a rule above; totals a heavier one.
  if (l.kind === 'subtotal' || l.kind === 'total') {
    const stack = new VerticalStack();
    stack.add(rule(l.kind === 'total' ? NAVY : RULE, l.kind === 'total' ? 0.8 : 0.5));
    stack.add(row);
    if (l.kind === 'total') stack.add(rule(NAVY, 0.5));
    return stack;
  }
  return row;
}

function numCell(text: string, bold: boolean, color: Color, align: TextAlignment): TextBlock {
  const b = new TextBlock(text);
  b.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = 10;
  b.textColor = color;
  b.alignment = align;
  return b;
}

function columnHeads(): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.margin = new Thickness(0, 2, 0, 2);
  row.add(numCell('', false, MUTED, TextAlignment.Left), 6);
  row.add(numCell('Note', false, MUTED, TextAlignment.Center), 1);
  row.add(numCell('2026', true, NAVY, TextAlignment.Right), 2);
  row.add(numCell('2025', true, MUTED, TextAlignment.Right), 2);
  return row;
}

function fmt(n?: number): string {
  if (n === undefined) return '';
  const s = Math.abs(n).toLocaleString('en-GB');
  return n < 0 ? `(${s})` : s;
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function company(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 11;
  b.textColor = MUTED;
  b.margin = new Thickness(0, 0, 0, 4);
  return b;
}

function h1(text: string): Heading {
  const h = new Heading(text);
  h.level = 1;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 22;
  h.textColor = NAVY;
  h.margin = new Thickness(0, 0, 0, 4);
  return h;
}

function h2(text: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.textColor = NAVY;
  h.margin = new Thickness(0, 4, 0, 8);
  return h;
}

function sub(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 9;
  b.textColor = MUTED;
  b.margin = new Thickness(0, 0, 0, 3);
  return b;
}

function rule(color: Color, thickness: number): Container {
  const c = new Container();
  c.backgroundColor = color;
  c.padding = new Thickness(0, thickness / 2, 0, thickness / 2);
  c.margin = new Thickness(0, 2, 0, 2);
  const s = new TextBlock(' ');
  s.fontSize = 1;
  c.child = s;
  return c;
}

function gap(h: number): Container {
  const c = new Container();
  c.padding = new Thickness(0, h / 2, 0, h / 2);
  const s = new TextBlock(' ');
  s.fontSize = 1;
  c.child = s;
  return c;
}
