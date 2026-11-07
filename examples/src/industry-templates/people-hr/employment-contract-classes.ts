/**
 * Employment Contract (Class API).
 * The same statement of employment particulars as Employment Contract, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// ── Employment contract (HR / legal) — class companion ───────────────────────
//
// The **class / construct-then-mutate** companion to `employment-contract.ts`.
// Same statement of particulars, same clauses, same outline — but every element
// is created with `new` and configured by assigning properties, rather than
// through the options-object front door. This is the escape hatch the options
// form desugars to.
//
// It renders **byte-for-byte identically** to `employment-contract.ts` (an
// equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to. See `employment-contract.ts` for
// the narrated walkthrough.

import {
  pageNumber,
  BookmarkItem,
  Border,
  BorderColors,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalStack,
  Line,
  NumberFormat,
  OrderedList,
  PageBreak,
  Spacer,
  StandardFonts,
  Table,
  TextAlignment,
  TextBlock,
  Thickness,
  VerticalStack,
  WidthDistribution,
  ColorPalette,
  type ColorInput,
  pageTemplate,
} from '@bonniepdf/core';

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[500];
const FAINT = ColorPalette.slate[600];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[50];
const ACCENT = ColorPalette.teal[700];

// ── Deterministic sample fixture ─────────────────────────────────────────────
export const sampleContract: ContractData = {
  employer: {
    name: 'Sample Company Ltd',
    address: '12 Harbour Square, Bristol BS1 4QA, United Kingdom',
    registration: 'Company No. 09876543',
  },
  employee: {
    name: 'Sample Employee',
    address: '48 Sample Road, Bristol BS6 6DR, United Kingdom',
  },
  role: {
    title: 'Senior Platform Engineer',
    department: 'Engineering',
    reportsTo: 'Head of Platform',
    startDate: '1 October 2026',
  },
  terms: {
    salary: '£72,000 per annum, paid monthly in arrears',
    hours: '37.5 hours per week, Monday to Friday',
    holiday: '28 days per year, inclusive of public holidays',
    probation: 'Six months from the start date',
    notice: 'Three months by either party after probation',
    location: 'Bristol office, with hybrid working by agreement',
  },
  reference: 'CON-2026-0188',
  definitions: [
    ['Commencement Date', 'The date shown in the particulars above, on which employment begins.'],
    [
      'Confidential Information',
      'Information not in the public domain relating to the business, clients, or systems of the Employer.',
    ],
    [
      'Garden Leave',
      'A period during notice in which the Employee remains employed but is not required to attend work.',
    ],
    [
      'Intellectual Property',
      'Inventions, designs, code, and works of authorship created in the course of employment.',
    ],
  ],
  clauses: [
    {
      heading: 'Appointment and duties',
      intro: 'The Employer appoints the Employee to the role set out in the particulars above.',
      paragraphs: [
        'The Employee shall perform the duties reasonably associated with the role, and any other duties reasonably assigned from time to time.',
        'The Employee shall devote their full working time and attention to the business of the Employer during working hours.',
        'The Employee shall not, without prior written consent, engage in any other paid occupation that conflicts with the role.',
      ],
    },
    {
      heading: 'Probationary period',
      paragraphs: [
        'The first six months of employment are probationary, during which either party may terminate on two weeks written notice.',
        'The Employer may extend the probationary period once, by up to three months, on written notice before it expires.',
        'Confirmation of appointment shall be given in writing on satisfactory completion.',
      ],
    },
    {
      heading: 'Remuneration and benefits',
      paragraphs: [
        'Salary is paid monthly in arrears by credit transfer, subject to deductions required by law.',
        'Salary is reviewed annually. A review does not imply an increase.',
        'The Employee is eligible to join the Employer pension scheme, subject to its rules from time to time.',
      ],
    },
    {
      heading: 'Confidentiality and intellectual property',
      intro: 'These obligations continue after employment ends.',
      paragraphs: [
        'The Employee shall not disclose Confidential Information to any third party except as required to perform the role or by law.',
        'All Intellectual Property created in the course of employment vests in the Employer on creation.',
        'On termination the Employee shall return all property and materials belonging to the Employer.',
      ],
    },
    {
      heading: 'Termination',
      paragraphs: [
        'After probation, either party may terminate on three months written notice.',
        'The Employer may place the Employee on Garden Leave for all or part of any notice period.',
        'The Employer may terminate without notice in cases of gross misconduct.',
      ],
    },
  ],
  outlinePages: { particulars: 0, definitions: 0, clauses: [0, 1, 1, 1, 1], schedule: 2, execution: 2 },
  locale: 'en-GB',
};

export function generate(): Document {
  return buildDocument(sampleContract);
}

// Local helpers and sample types used by this document.

// ── Domain model ─────────────────────────────────────────────────────────────

export interface Clause {
  heading: string;
  intro?: string;
  paragraphs: string[];
}

export interface ContractData {
  employer: { name: string; address: string; registration: string };
  employee: { name: string; address: string };
  role: { title: string; department: string; reportsTo: string; startDate: string };
  terms: { salary: string; hours: string; holiday: string; probation: string; notice: string; location: string };
  reference: string;
  definitions: [term: string, meaning: string][];
  clauses: Clause[];
  outlinePages: { particulars: number; definitions: number; clauses: number[]; schedule: number; execution: number };
  locale: string;
}

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
  block.fontSize = style.size ?? 9.5;
  block.color = style.color ?? INK;
  if (style.align !== undefined) block.alignment = style.align;
  return block;
}

/** A bookmarked clause heading. `tocIdentifier` is what the outline targets. */
function heading(text: string, id: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.tocIdentifier = id;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 11.5;
  h.color = ACCENT;
  h.margin = new Thickness(0, 4, 0, 6);
  return h;
}

function columnHead(text: string): TextBlock {
  return cell(text, { bold: true, size: 7.5, color: MUTED });
}

function labelledTable(rows: [string, string][], leftHead: string, rightHead: string): Table {
  const table = new Table(1, 2.2);
  table.cellPadding = 6;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(LINE);
  table.headerBackgroundColor = PANEL;
  table.addHeader(columnHead(leftHead), columnHead(rightHead));
  for (const [label, value] of rows) {
    table.addRow(cell(label, { bold: true, size: 9 }), cell(value));
  }
  return table;
}

// ── Section builders (top to bottom) ─────────────────────────────────────────

function titleBlock(data: ContractData): VerticalStack {
  // A real level-1 heading, not styled body text: the clause headings below are
  // level 2, and PDF/UA-1 requires headings to nest without skipping a level.
  const title = new Heading('Statement of Employment Particulars');
  title.level = 1;
  title.tocIdentifier = 'title';
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 17;
  title.color = ACCENT;

  const reference = cell(`Agreement reference ${data.reference}`, { size: 8.5, color: MUTED });
  reference.margin = new Thickness(0, 3, 0, 0);

  const rule = new Container();
  rule.height = 2;
  rule.backgroundColor = ACCENT;
  rule.margin = new Thickness(0, 10, 0, 14);

  const stack = new VerticalStack();
  stack.add(title);
  stack.add(reference);
  stack.add(rule);
  return stack;
}

function parties(data: ContractData): Container {
  const party = (role: string, name: string, address: string, extra?: string): VerticalStack => {
    const stack = new VerticalStack();
    stack.spacing = 2;
    stack.add(cell(role.toUpperCase(), { bold: true, size: 6.5, color: FAINT }));
    stack.add(cell(name, { bold: true, size: 10 }));
    stack.add(cell(address, { size: 8.5, color: MUTED }));
    if (extra !== undefined) stack.add(cell(extra, { size: 8.5, color: FAINT }));
    return stack;
  };

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 20;
  row.add(party('The Employer', data.employer.name, data.employer.address, data.employer.registration), 1);
  row.add(party('The Employee', data.employee.name, data.employee.address), 1);

  const panel = new Container();
  panel.backgroundColor = PANEL;
  panel.padding = new Thickness(12, 12, 12, 12);
  panel.margin = new Thickness(0, 0, 0, 14);
  panel.child = row;
  return panel;
}

function particulars(data: ContractData): VerticalStack {
  const rows: [string, string][] = [
    ['Job title', data.role.title],
    ['Department', data.role.department],
    ['Reports to', data.role.reportsTo],
    ['Commencement Date', data.role.startDate],
    ['Place of work', data.terms.location],
    ['Salary', data.terms.salary],
    ['Hours of work', data.terms.hours],
    ['Holiday entitlement', data.terms.holiday],
    ['Probationary period', data.terms.probation],
    ['Notice period', data.terms.notice],
  ];
  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 16);
  stack.add(labelledTable(rows, 'Particular', 'Detail'));
  return stack;
}

function definitions(data: ContractData): VerticalStack {
  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 14);
  stack.add(heading('Definitions', 'definitions'));
  for (const [term, meaning] of data.definitions) {
    const entry = new VerticalStack();
    entry.spacing = 1;
    entry.margin = new Thickness(0, 0, 0, 6);
    entry.add(cell(term, { bold: true, size: 9 }));
    entry.add(cell(meaning, { size: 8.5, color: MUTED }));
    stack.add(entry);
  }
  return stack;
}

function clause(item: Clause, index: number): VerticalStack {
  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 0, 0, 14);
  stack.breakAllowed = false;
  stack.add(heading(`${index + 1}.  ${item.heading}`, `clause-${index + 1}`));

  if (item.intro !== undefined) {
    const intro = cell(item.intro);
    intro.margin = new Thickness(0, 0, 0, 6);
    stack.add(intro);
  }

  const list = new OrderedList();
  list.numberFormat = NumberFormat.Decimal;
  list.fontName = StandardFonts.Helvetica;
  list.fontSize = 9.5;
  list.color = INK;
  list.itemSpacing = 5;
  list.indent = 16;
  for (const paragraph of item.paragraphs) list.addItem(paragraph);
  stack.add(list);
  return stack;
}

function signatureField(caption: string): VerticalStack {
  const rule = new Line();
  rule.thickness = 0.75;
  rule.color = FAINT;

  const stack = new VerticalStack();
  stack.spacing = 4;
  stack.add(new Spacer(24));
  stack.add(rule);
  stack.add(cell(caption, { size: 7.5, color: MUTED }));
  return stack;
}

function schedule(data: ContractData): VerticalStack {
  const rows: [string, string][] = [
    ['Annual leave year', '1 January to 31 December'],
    ['Pension contribution', 'Employer 5%, Employee 5% of qualifying earnings'],
    ['Expenses', 'Reimbursed monthly against receipts, per the expenses policy'],
    ['Equipment', 'Laptop and peripherals provided; returned on termination'],
    ['Training budget', '£1,500 per year, subject to prior approval'],
  ];

  const intro = cell(
    `This schedule forms part of the agreement between ${data.employer.name} and ${data.employee.name}.`,
    { size: 8.5, color: MUTED }
  );
  intro.margin = new Thickness(0, 0, 0, 8);

  const stack = new VerticalStack();
  stack.add(heading('Schedule 1 — Benefits and allowances', 'schedule-1'));
  stack.add(intro);
  stack.add(labelledTable(rows, 'Item', 'Provision'));
  return stack;
}

function execution(data: ContractData): VerticalStack {
  const pair = (left: string, right: string): HorizontalStack => {
    const row = new HorizontalStack();
    row.widthDistribution = WidthDistribution.Weighted;
    row.spacing = 20;
    row.add(signatureField(left), 1.6);
    row.add(signatureField(right), 1);
    return row;
  };

  const intro = cell('By signing below the parties agree to the terms set out in this statement and its schedules.');
  intro.margin = new Thickness(0, 0, 0, 6);

  const stack = new VerticalStack();
  stack.margin = new Thickness(0, 8, 0, 0);
  stack.add(heading('Execution', 'execution'));
  stack.add(intro);
  stack.add(pair(`Signed for and on behalf of ${data.employer.name}`, 'Date'));
  stack.add(new Spacer(6));
  stack.add(pair(`Signed by ${data.employee.name}`, 'Date'));
  stack.add(new Spacer(6));
  stack.add(pair('Witness signature', 'Witness name'));
  return stack;
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createContractSettings(data: ContractData = sampleContract): DocumentSettings {
  // The settings and metadata bags stay in options form here, as they do in
  // every other class companion: the construct-then-mutate convention is about
  // the element tree, not the document's configuration.
  const settings = new DocumentSettings({
    pageSize: 'a4',
    margin: 46,
    conformance: 'pdf/a-2a',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
  });

  function pageHeader() {
    const header = new TextBlock(`${data.reference} · ${data.employer.name} and ${data.employee.name}`);
    header.fontName = StandardFonts.Helvetica;
    header.fontSize = 7;
    header.color = FAINT;
    return header;
  }

  settings.headerTemplate = pageTemplate({ default: pageHeader() });
  function pageFooter() {
    const footer = pageNumber();
    footer.fontName = StandardFonts.Helvetica;
    footer.fontSize = 7;
    footer.color = FAINT;
    footer.alignment = TextAlignment.Center;
    return footer;
  }

  settings.footerTemplate = pageTemplate({ default: pageFooter() });

  const pages = data.outlinePages;
  settings.bookmarks = [
    new BookmarkItem({ title: 'Particulars', pageIndex: pages.particulars }),
    new BookmarkItem({ title: 'Definitions', pageIndex: pages.definitions }),
    new BookmarkItem({
      title: 'Clauses',
      pageIndex: pages.clauses[0] ?? 0,
      children: data.clauses.map(
        (c, i) => new BookmarkItem({ title: `${i + 1}. ${c.heading}`, pageIndex: pages.clauses[i] ?? 0 })
      ),
    }),
    new BookmarkItem({ title: 'Schedule 1 — Benefits and allowances', pageIndex: pages.schedule }),
    new BookmarkItem({ title: 'Execution', pageIndex: pages.execution }),
  ];

  return settings;
}

export function buildDocument(data: ContractData, settings: DocumentSettings = createContractSettings(data)): Document {
  const doc = new Document(
    settings,
    new DocumentMetadata({
      title: `Statement of Employment Particulars — ${data.employee.name}`,
      author: data.employer.name,
      subject: 'Written statement of employment particulars (fictional sample data).',
    })
  );

  doc.add(titleBlock(data));
  doc.add(parties(data));
  doc.add(particulars(data));
  doc.add(definitions(data));
  data.clauses.forEach((item, index) => doc.add(clause(item, index)));
  doc.add(new PageBreak());
  doc.add(schedule(data));
  doc.add(execution(data));
  return doc;
}
