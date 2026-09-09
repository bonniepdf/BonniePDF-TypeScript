// ── Employment contract (HR / legal) ─────────────────────────────────────────
//
// A multi-page written statement of employment particulars. Where the payslip
// is a dense one-page grid, this is the opposite problem: long-form text that
// has to stay *navigable and citable* across pages. The techniques are the ones
// legal drafting actually relies on:
//
//   - hierarchical clause numbering (`clause`) — a numbered top level with an
//     indented sub-list, so "4.2" can be referred to in correspondence;
//   - a document outline (`settings.bookmarks`), so a reader can jump to a
//     clause instead of scrolling — the first showcase here to build one;
//   - a running header carrying the agreement reference on every page;
//   - a defined-terms table, so capitalised terms mean one thing throughout;
//   - a schedule forced onto its own page, and an execution block with
//     signature and witness fields.
//
// Everything derives from `ContractData`. Output is PDF/A-2a + PDF/UA-1.

import {
  BookmarkItem,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  HorizontalStack,
  Line,
  OrderedList,
  PageBreak,
  Spacer,
  StandardFonts,
  Table,
  TextBlock,
  TextElementBase,
  VerticalStack,
  ColorPalette,
  type IElement,
  type TextBlockOptions,
} from '@bonniepdf/core';

// ── Design tokens ────────────────────────────────────────────────────────────
const INK = ColorPalette.slate[800];
const MUTED = ColorPalette.slate[500];
// 600, not 400: 400 never clears 4.5:1 as text (2.51:1 on this document's
// background).
const FAINT = ColorPalette.slate[600];
const LINE = ColorPalette.slate[200];
const PANEL = ColorPalette.slate[50];
const ACCENT = ColorPalette.teal[700];

const HELVETICA = StandardFonts.Helvetica;
const HELVETICA_BOLD = StandardFonts.HelveticaBold;

const bodyText: TextBlockOptions = { fontName: HELVETICA, fontSize: 9.5, textColor: INK };
const mutedText: TextBlockOptions = { ...bodyText, fontSize: 8.5, textColor: MUTED };

// ── Domain model ─────────────────────────────────────────────────────────────

/** One numbered clause. `paragraphs` are the indented sub-clauses. */
export interface Clause {
  heading: string;
  /** Lead-in prose, rendered before any sub-clauses. Optional. */
  intro?: string;
  /** Sub-clauses. Rendered as an indented numbered list beneath the heading. */
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
  /**
   * 0-based page each outline entry targets. Pagination is resolved at render
   * time, not while the element tree is built, so a bookmark cannot discover
   * its own page — the outline has to be told. Collected here, rather than as
   * literals spread through `createContractSettings`, so that re-flowing the
   * sample prose is one visible edit. `clauses[i]` is the page clause `i + 1`
   * opens on.
   */
  outlinePages: { particulars: number; definitions: number; clauses: number[]; schedule: number; execution: number };
  locale: string;
}

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
  // Verified against the rendered sample: clauses 1-2 sit on page 1, clauses
  // 3-5 on page 2, and the page break puts the schedule and execution on page 3.
  outlinePages: { particulars: 0, definitions: 0, clauses: [0, 0, 1, 1, 1], schedule: 2, execution: 2 },
  locale: 'en-GB',
};

// ── Section builders ─────────────────────────────────────────────────────────

function titleBlock(data: ContractData): VerticalStack {
  return new VerticalStack({
    children: [
      // A real level-1 heading, not styled body text: the clause headings
      // below are level 2, and PDF/UA-1 requires headings to nest without
      // skipping a level, so the document title has to be the H1 they sit under.
      new Heading('Statement of Employment Particulars', {
        level: 1,
        tocIdentifier: 'title',
        fontName: HELVETICA_BOLD,
        fontSize: 17,
        textColor: ACCENT,
      }),
      new TextBlock(`Agreement reference ${data.reference}`, { ...mutedText, margin: { top: 3 } }),
      new Container({ height: 2, backgroundColor: ACCENT, margin: { top: 10, bottom: 14 } }),
    ],
  });
}

/** The two parties, side by side — who is bound by this document. */
function parties(data: ContractData): Container {
  const party = (role: string, name: string, address: string, extra?: string): VerticalStack =>
    new VerticalStack({
      spacing: 2,
      children: [
        new TextBlock(role.toUpperCase(), { fontName: HELVETICA_BOLD, fontSize: 6.5, textColor: FAINT }),
        new TextBlock(name, { fontName: HELVETICA_BOLD, fontSize: 10, textColor: INK }),
        new TextBlock(address, mutedText),
        ...(extra ? [new TextBlock(extra, { ...mutedText, textColor: FAINT })] : []),
      ],
    });

  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20 });
  row.add(party('The Employer', data.employer.name, data.employer.address, data.employer.registration), 1);
  row.add(party('The Employee', data.employee.name, data.employee.address), 1);

  return new Container({ backgroundColor: PANEL, padding: [12, 12], margin: { bottom: 14 }, child: row });
}

/** The statutory particulars — the facts a written statement must state. */
function particulars(data: ContractData): VerticalStack {
  const table = new Table({
    columns: [1, 2.2],
    cellPadding: 6,
    border: { width: 0.5, color: LINE },
    headerBackgroundColor: PANEL,
  });
  table.addHeader(
    new TextBlock('Particular', { fontName: HELVETICA_BOLD, fontSize: 7.5, textColor: MUTED }),
    new TextBlock('Detail', { fontName: HELVETICA_BOLD, fontSize: 7.5, textColor: MUTED })
  );
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
  for (const [label, value] of rows) {
    table.addRow(
      new TextBlock(label, { fontName: HELVETICA_BOLD, fontSize: 9, textColor: INK }),
      new TextBlock(value, bodyText)
    );
  }
  return new VerticalStack({ margin: { bottom: 16 }, children: [table] });
}

function definitions(data: ContractData): VerticalStack {
  const items: IElement[] = [];
  for (const [term, meaning] of data.definitions) {
    items.push(
      new VerticalStack({
        spacing: 1,
        margin: { bottom: 6 },
        children: [
          new TextBlock(term, { fontName: HELVETICA_BOLD, fontSize: 9, textColor: INK }),
          new TextBlock(meaning, mutedText),
        ],
      })
    );
  }
  return new VerticalStack({
    margin: { bottom: 14 },
    children: [heading('Definitions', 'definitions'), ...items],
  });
}

/** A bookmarked clause heading. `tocIdentifier` is what the outline targets. */
function heading(text: string, id: string): Heading {
  return new Heading(text, {
    level: 2,
    tocIdentifier: id,
    fontName: HELVETICA_BOLD,
    fontSize: 11.5,
    textColor: ACCENT,
    margin: { top: 4, bottom: 6 },
  });
}

/**
 * One numbered clause: a bookmarked heading, optional lead-in prose, then the
 * sub-clauses as an indented numbered list. Rendering sub-clauses as a real
 * list rather than hand-numbered paragraphs is what makes "4.2" stable when a
 * clause is inserted above it.
 */
function clause(item: Clause, index: number): VerticalStack {
  const children: IElement[] = [heading(`${index + 1}.  ${item.heading}`, `clause-${index + 1}`)];
  if (item.intro !== undefined) {
    children.push(new TextBlock(item.intro, { ...bodyText, margin: { bottom: 6 } }));
  }
  children.push(
    new OrderedList({
      items: item.paragraphs,
      numberFormat: 'decimal',
      fontName: HELVETICA,
      fontSize: 9.5,
      textColor: INK,
      itemSpacing: 5,
      indent: 16,
    })
  );
  return new VerticalStack({ margin: { bottom: 14 }, children });
}

/** A ruled line with its caption underneath — one execution field. */
function signatureField(caption: string): VerticalStack {
  return new VerticalStack({
    spacing: 4,
    children: [
      new Spacer(24),
      new Line({ thickness: 0.75, color: FAINT }),
      new TextBlock(caption, { fontName: HELVETICA, fontSize: 7.5, textColor: MUTED }),
    ],
  });
}

/** The schedule lives on its own page, as schedules conventionally do. */
function schedule(data: ContractData): VerticalStack {
  const rows: [string, string][] = [
    ['Annual leave year', '1 January to 31 December'],
    ['Pension contribution', 'Employer 5%, Employee 5% of qualifying earnings'],
    ['Expenses', 'Reimbursed monthly against receipts, per the expenses policy'],
    ['Equipment', 'Laptop and peripherals provided; returned on termination'],
    ['Training budget', '£1,500 per year, subject to prior approval'],
  ];
  const table = new Table({
    columns: [1, 2.2],
    cellPadding: 6,
    border: { width: 0.5, color: LINE },
    headerBackgroundColor: PANEL,
  });
  table.addHeader(
    new TextBlock('Item', { fontName: HELVETICA_BOLD, fontSize: 7.5, textColor: MUTED }),
    new TextBlock('Provision', { fontName: HELVETICA_BOLD, fontSize: 7.5, textColor: MUTED })
  );
  for (const [label, value] of rows) {
    table.addRow(
      new TextBlock(label, { fontName: HELVETICA_BOLD, fontSize: 9, textColor: INK }),
      new TextBlock(value, bodyText)
    );
  }

  return new VerticalStack({
    children: [
      heading('Schedule 1 — Benefits and allowances', 'schedule-1'),
      new TextBlock(
        `This schedule forms part of the agreement between ${data.employer.name} and ${data.employee.name}.`,
        { ...mutedText, margin: { bottom: 8 } }
      ),
      table,
    ],
  });
}

function execution(data: ContractData): VerticalStack {
  const employerRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20 });
  employerRow.add(signatureField(`Signed for and on behalf of ${data.employer.name}`), 1.6);
  employerRow.add(signatureField('Date'), 1);

  const employeeRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20 });
  employeeRow.add(signatureField(`Signed by ${data.employee.name}`), 1.6);
  employeeRow.add(signatureField('Date'), 1);

  const witnessRow = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20 });
  witnessRow.add(signatureField('Witness signature'), 1.6);
  witnessRow.add(signatureField('Witness name'), 1);

  return new VerticalStack({
    margin: { top: 8 },
    children: [
      heading('Execution', 'execution'),
      new TextBlock('By signing below the parties agree to the terms set out in this statement and its schedules.', {
        ...bodyText,
        margin: { bottom: 6 },
      }),
      employerRow,
      new Spacer(6),
      employeeRow,
      new Spacer(6),
      witnessRow,
    ],
  });
}

// ── buildDocument: pure data → Document ──────────────────────────────────────

export function createContractSettings(data: ContractData = sampleContract): DocumentSettings {
  const settings = new DocumentSettings({
    pageSize: 'a4',
    margin: 46,
    conformance: 'pdf/a-2a',
    accessibility: 'pdf/ua-1',
    language: 'en-GB',
    defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
  });

  // A running header: on a document that will be printed, filed, and referred
  // back to, every page needs to say which agreement it belongs to.
  settings.headerTemplate = () =>
    new TextBlock(`${data.reference} · ${data.employer.name} and ${data.employee.name}`, {
      fontName: HELVETICA,
      fontSize: 7,
      textColor: FAINT,
    });
  settings.footerTemplate = (pageNumber: number) =>
    new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`, {
      fontName: HELVETICA,
      fontSize: 7,
      textColor: FAINT,
      alignment: 'center',
    });

  // The outline. A reader opening a ten-clause agreement should be able to
  // jump to "Termination" rather than scroll for it.
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

export function generate(): Document {
  return buildDocument(sampleContract);
}
