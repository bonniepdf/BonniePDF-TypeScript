// ── UK / EU statutory financial statements ───────────────────────────────────
//
// Portfolio #2, framed for UK/EU rather than US. This is a real *statutory*
// financial statement in the IFRS / UK Companies House idiom - not a marketing
// dashboard: a Statement of Comprehensive Income and a Statement of Financial
// Position with prior-year comparatives, note references, accounting-style
// bracketed negatives, and subtotal rules. Amounts in £ thousands.
//
// Archival + accessible: PDF/A-2a + PDF/UA-1, en-GB. Fictional company.
// Authored through the options-object front door.

import {
  Document,
  TextBlock,
  TextElementBase,
  Heading,
  VerticalStack,
  HorizontalStack,
  Container,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
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
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 54,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: INK },
      footerTemplate: (pageNumber: number) =>
        new TextBlock(
          `Sample Company Ltd  ·  Company no. 07741122  ·  Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`,
          { fontName: StandardFonts.Helvetica, fontSize: 8, textColor: MUTED }
        ),
    },
    metadata: {
      title: 'Financial Statements - Sample Company Ltd',
      author: 'Sample Company Ltd',
      subject: 'Statutory financial statements (IFRS) for the year ended 31 March 2026 (fictional).',
    },
  });

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
    return new TextBlock(l.label, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 10,
      textColor: NAVY,
      margin: { top: 8, bottom: 4 },
    });
  }

  const bold = l.kind === 'subtotal' || l.kind === 'total';
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 2, bottom: 2 } });
  row.add(
    new TextBlock(l.label, {
      fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
      fontSize: 10,
      textColor: bold ? NAVY : INK,
      margin: l.indent ? { left: 14 } : undefined,
    }),
    6
  );
  row.add(numCell(l.note ?? '', false, MUTED, 'center'), 1);
  row.add(numCell(fmt(l.cur), bold, bold ? NAVY : INK, 'right'), 2);
  row.add(numCell(fmt(l.prior), bold, MUTED, 'right'), 2);

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

function numCell(text: string, bold: boolean, color: ColorInput, align: TextAlignmentInput): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 10,
    textColor: color,
    alignment: align,
  });
}

function columnHeads(): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 2, bottom: 2 } });
  row.add(numCell('', false, MUTED, 'left'), 6);
  row.add(numCell('Note', false, MUTED, 'center'), 1);
  row.add(numCell('2026', true, NAVY, 'right'), 2);
  row.add(numCell('2025', true, MUTED, 'right'), 2);
  return row;
}

function fmt(n?: number): string {
  if (n === undefined) return '';
  const s = Math.abs(n).toLocaleString('en-GB');
  return n < 0 ? `(${s})` : s;
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function company(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 11,
    textColor: MUTED,
    margin: { bottom: 4 },
  });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 22,
    textColor: NAVY,
    margin: { bottom: 4 },
  });
}

function h2(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    textColor: NAVY,
    margin: { top: 4, bottom: 8 },
  });
}

function sub(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: 9,
    textColor: MUTED,
    margin: { bottom: 3 },
  });
}

function rule(color: ColorInput, thickness: number): Container {
  return new Container({
    backgroundColor: color,
    padding: { top: thickness / 2, bottom: thickness / 2 },
    margin: { top: 2, bottom: 2 },
    child: new TextBlock(' ', { fontSize: 1 }),
  });
}

function gap(h: number): Container {
  return new Container({ padding: { top: h / 2, bottom: h / 2 }, child: new TextBlock(' ', { fontSize: 1 }) });
}
