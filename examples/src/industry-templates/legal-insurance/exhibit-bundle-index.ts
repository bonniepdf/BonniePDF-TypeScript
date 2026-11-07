/**
 * Exhibit Bundle Index.
 * The generated parts of a court bundle: a cover sheet, a hyperlinked index with page references resolved after layout, and section separators with continuous numbering.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  Table,
  Section,
  SectionLink,
  PageNumberOf,
  PageBreak,
  StandardFonts,
  pageTemplate,
  TextBlock,
  Heading,
  ColorPalette,
  type ColorInput,
  type IElement,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

/** 600, not 400: 400 never clears 4.5:1 as body text on white. */
const MUTED = ColorPalette.slate[600];

const HEADING = ColorPalette.slate[800];

const ACCENT = ColorPalette.rose[800];

const RULE = ColorPalette.slate[200];

// ── Indexed exhibit bundle — cover, index, and section separators ─────────────
//
// What a litigation-support or legal-practice platform generates around a
// bundle: the cover sheet, the hyperlinked index, and the separator sheet that
// introduces each section, all carrying continuous pagination across the whole
// bundle.
//
// ── Scope: read this before evaluating ───────────────────────────────────────
//
// BonniePDF generates documents. It is not a PDF parser and not a merger, and it
// never will be. It therefore does NOT assemble a bundle out of existing PDFs.
//
// What this example produces is the generated apparatus of a bundle — the cover,
// the index with live internal links and resolved page numbers, and the section
// separators. Combining that apparatus with the exhibits themselves is a
// merge step, and you would do it with a tool built for merging.
//
// That boundary is stated here rather than buried, because the apparatus is the
// part that is genuinely hard to produce — continuous pagination and an index
// whose page references stay correct as content reflows — and the part a
// templating engine handles worst.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample parties, references, and
// exhibits throughout. Nothing here is legal advice or a procedural template.

const BUNDLE = {
  reference: 'Bundle A — Claimant',
  matter: 'Sample Claimant v Sample Defendant',
  caseNumber: 'Sample case reference SC-2026-000417',
  court: 'Sample County Court',
  hearing: new Date(Date.UTC(2026, 9, 14)),
  hearingType: 'Case management conference',
  preparedBy: 'Sample Solicitors LLP, solicitors for the Claimant',
  preparedOn: new Date(Date.UTC(2026, 8, 25)),
  volume: 'Volume 1 of 1',
};

const SECTIONS: BundleSection[] = [
  {
    id: 'section-a',
    tab: 'A',
    title: 'Statements of case',
    description: 'The pleadings as filed, in the order in which they were served.',
    items: [
      { reference: 'A1', description: 'Claim form', dated: '04 Mar 2026', pages: 3 },
      { reference: 'A2', description: 'Particulars of claim', dated: '04 Mar 2026', pages: 11 },
      { reference: 'A3', description: 'Defence', dated: '29 Apr 2026', pages: 9 },
      { reference: 'A4', description: 'Reply to defence', dated: '20 May 2026', pages: 4 },
    ],
  },
  {
    id: 'section-b',
    tab: 'B',
    title: 'Orders and directions',
    description: 'Orders of the court in date order, most recent last.',
    items: [
      { reference: 'B1', description: 'Order of the court — allocation', dated: '11 Jun 2026', pages: 2 },
      { reference: 'B2', description: 'Order of the court — directions', dated: '30 Jul 2026', pages: 3 },
    ],
  },
  {
    id: 'section-c',
    tab: 'C',
    title: 'Witness statements',
    description: 'Witness statements with their exhibits following each statement.',
    items: [
      { reference: 'C1', description: 'Witness statement of the Claimant', dated: '14 Aug 2026', pages: 16 },
      {
        reference: 'C2',
        description: 'Exhibit to the witness statement of the Claimant',
        dated: '14 Aug 2026',
        pages: 24,
      },
      { reference: 'C3', description: 'Witness statement of the Defendant', dated: '02 Sep 2026', pages: 12 },
    ],
  },
  {
    id: 'section-d',
    tab: 'D',
    title: 'Correspondence',
    description: 'Inter-party correspondence relied upon, in date order.',
    items: [
      { reference: 'D1', description: 'Letter before claim', dated: '18 Dec 2025', pages: 5 },
      { reference: 'D2', description: 'Response to letter before claim', dated: '22 Jan 2026', pages: 6 },
      { reference: 'D3', description: 'Correspondence bundle — 14 items', dated: 'Various', pages: 31 },
    ],
  },
];

export function generate(): Document {
  const totalItems = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const totalPages = SECTIONS.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.pages, 0), 0);

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 50,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: INK },
      // Continuous pagination across the whole bundle, including the cover. A
      // bundle whose page numbers restart per section is a bundle nobody can
      // navigate from a transcript.
      footerTemplate: pageTemplate({
        default: band(
          `${BUNDLE.matter} · ${BUNDLE.reference}`,
          `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
        ),
      }),
    },
    metadata: {
      title: `${BUNDLE.reference} — index and separators — ${BUNDLE.matter}`,
      author: BUNDLE.preparedBy,
      subject:
        'Generated bundle apparatus: cover sheet, hyperlinked index with resolved page references, and section separator sheets (sample data). Does not merge existing PDFs.',
      keywords: 'bundle, index, exhibits, pagination, litigation support, cross-references, pdf/ua, pdf/a',
    },
  });

  // ── Cover sheet ────────────────────────────────────────────────────────────

  doc.add(new Section('cover'));
  doc.add(accentBar());
  doc.add(cell(BUNDLE.court.toUpperCase(), { bold: true, size: 9, color: ACCENT, mb: 16 }));
  doc.add(cell(BUNDLE.caseNumber, { size: 10, color: MUTED, mb: 20 }));

  doc.add(h1(BUNDLE.matter));
  doc.add(cell(BUNDLE.reference, { size: 14, bold: true, color: ACCENT, mt: 4, mb: 24 }));

  doc.add(
    weightedRow(
      [
        field('Hearing', `${BUNDLE.hearingType}, ${gbDate(BUNDLE.hearing)}`),
        field('Volume', BUNDLE.volume),
        field('Sections', String(SECTIONS.length)),
        field('Items', String(totalItems)),
      ],
      { mb: 8 }
    )
  );
  doc.add(
    weightedRow([
      field('Prepared by', BUNDLE.preparedBy),
      field('Prepared on', gbDate(BUNDLE.preparedOn)),
      field('Exhibit pages', String(totalPages)),
      field('Index', 'Follows this sheet'),
    ])
  );

  doc.add(
    panel('What this document is', [
      cell(
        'This is the generated apparatus of the bundle: this cover sheet, the index that follows, and a separator ' +
          'sheet introducing each section. The exhibits themselves are separate documents and are combined with ' +
          'this apparatus at assembly.',
        { size: 9, mb: 0 }
      ),
    ])
  );

  // ── Index ──────────────────────────────────────────────────────────────────

  doc.add(new PageBreak());
  doc.add(new Section('index'));
  doc.add(h1('Index'));
  doc.add(
    cell(
      'Each section below links to its separator sheet, and the page reference resolves after layout — so it stays ' +
        'correct when the bundle is repaginated.',
      { color: MUTED, mb: 14 }
    )
  );

  for (const section of SECTIONS) {
    const heading = new HorizontalStack({ widthDistribution: 'weighted', margin: { top: 10, bottom: 4 } });
    heading.add(
      new SectionLink(`Tab ${section.tab} — ${section.title}`, section.id, {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 12,
        color: ACCENT,
      }),
      4
    );
    const pageRow = new HorizontalStack({ spacing: 4 });
    const label = cell('separator at page', { size: 9, color: MUTED });
    pageRow.add(label, label.getPreferredWidth());
    pageRow.add(new PageNumberOf(section.id, { fontName: StandardFonts.HelveticaBold, fontSize: 9, color: INK }));
    heading.add(pageRow, 1.4);
    doc.add(heading);

    const table = new Table({
      columns: [0.8, 5.2, 1.6, 1],
      cellPadding: 5,
      border: { width: 0.5, color: RULE },
      headerBackgroundColor: ACCENT,
      headerTextColor: '#ffffff',
    });
    table.addHeader(th('Ref'), th('Document'), th('Dated'), th('Pages', 'right'));
    for (const item of section.items) {
      table.addRow(
        td(item.reference, { bold: true }),
        td(item.description),
        td(item.dated, { color: MUTED }),
        td(String(item.pages), { align: 'right' })
      );
    }
    doc.add(table);
  }

  // ── Separator sheets ───────────────────────────────────────────────────────

  for (const section of SECTIONS) {
    doc.add(new PageBreak());
    doc.add(new Section(section.id));

    doc.add(new Container({ backgroundColor: ACCENT, height: 6, margin: { bottom: 40 } }));
    doc.add(cell(`TAB ${section.tab}`, { bold: true, size: 44, color: ACCENT, align: 'center', mb: 8 }));
    doc.add(cell(section.title, { bold: true, size: 20, align: 'center', mb: 10 }));
    doc.add(cell(section.description, { size: 10, color: MUTED, align: 'center', mb: 26 }));

    doc.add(
      new Container({
        border: { width: 0.75, color: RULE },
        cornerRadius: 6,
        padding: 14,
        child: new VerticalStack({
          spacing: 4,
          children: [
            cell(`This section contains ${section.items.length} item(s):`, { bold: true, size: 9.5, mb: 4 }),
            ...section.items.map(item =>
              cell(`${item.reference} · ${item.description} (${item.dated})`, { size: 9.5 })
            ),
          ],
        }),
      })
    );

    doc.add(
      new SectionLink('Return to the index', 'index', {
        fontName: StandardFonts.Helvetica,
        fontSize: 9,
        color: ACCENT,
        margin: { top: 18 },
      })
    );
  }

  return doc;
}

// Local helpers and sample types used by this document.

interface BundleSection {
  id: string;
  tab: string;
  title: string;
  description: string;
  items: { reference: string; description: string; dated: string; pages: number }[];
}

// Local helpers keep this example ready to copy into a single file.

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: ColorInput;
  align?: 'left' | 'right' | 'center' | 'justify';
  mt?: number;
  mb?: number;
}

/** A styled text cell with trade-document defaults. */
function cell(text: string, o: TextOpts = {}): TextBlock {
  return new TextBlock(text, {
    fontName: o.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: o.size ?? 9,
    color: o.color ?? INK,
    alignment: o.align ?? 'left',
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 0 },
  });
}

/** Table header cell — white on the accent band. */
function th(text: string, align: TextOpts['align'] = 'left'): TextBlock {
  return cell(text, { bold: true, size: 8.5, color: '#ffffff', align });
}

/** Table body cell. */
function td(text: string, o: TextOpts = {}): TextBlock {
  return cell(text, { size: o.size ?? 8.5, ...o });
}

function h1(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 21,
    color: HEADING,
    margin: { bottom: 4 },
  });
}

function h2(text: string, color: ColorInput = ACCENT): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: color,
    margin: { top: 16, bottom: 8 },
  });
}

/** The full-width accent rule at the top of each document. */
function accentBar(color: ColorInput = ACCENT, height = 4): Container {
  return new Container({ backgroundColor: color, height, margin: { bottom: 14 } });
}

/** One label/value pair for the reference grid. */
function field(label: string, value: string): VerticalStack {
  return new VerticalStack({
    children: [cell(label.toUpperCase(), { bold: true, size: 6.5, color: MUTED, mb: 2 }), cell(value, { size: 9.5 })],
  });
}

/** A row of evenly weighted elements. */
function weightedRow(items: IElement[], o: { spacing?: number; mt?: number; mb?: number } = {}): HorizontalStack {
  const row = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: o.spacing ?? 14,
    margin: { top: o.mt ?? 0, bottom: o.mb ?? 14 },
  });
  for (const item of items) row.add(item, 1);
  return row;
}

/** A bordered panel with a heading — terms, notes, declarations. */
function panel(title: string, children: IElement[], o: { accent?: ColorInput } = {}): Container {
  return new Container({
    backgroundColor: ColorPalette.slate[50],
    border: { width: 0.75, color: RULE },
    cornerRadius: 6,
    padding: 12,
    margin: { top: 4, bottom: 12 },
    child: new VerticalStack({
      spacing: 4,
      children: [cell(title, { bold: true, size: 9.5, color: o.accent ?? ACCENT, mb: 4 }), ...children],
    }),
  });
}

/** The running header / footer band. */
function band(left: string, right: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(cell(left, { size: 7.5, color: MUTED }), 2.5);
  row.add(cell(right, { size: 7.5, color: MUTED, align: 'right' }), 2);
  return row;
}

function gbDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    d
  );
}
