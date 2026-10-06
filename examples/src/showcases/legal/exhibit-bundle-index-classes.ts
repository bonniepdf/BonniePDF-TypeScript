// ── Indexed exhibit bundle — cover, index, and separators (class API) ────────
//
// The generated apparatus of a bundle: the cover sheet, the hyperlinked index
// with resolved page references, and the separator sheet introducing each
// section, all under continuous pagination. BonniePDF generates documents — it
// does not merge existing PDFs, and combining this apparatus with the exhibits
// themselves is a separate assembly step.
//
// The **class / construct-then-mutate** companion to `exhibit-bundle-index.ts`.
// Same apparatus, authored the long way: `new` each element and assign its
// properties one at a time, with the enum members rather than their string
// literals. It renders **byte-for-byte identically** to the options-object form
// (an equivalence test binds the two). Reach for the options form first; this
// variant exists to show what it desugars to.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PdfAConformance,
  TextAlignment,
  TextStyle,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  Table,
  Section,
  SectionLink,
  PageNumberOf,
  PageBreak,
  StandardFonts,
  Color,
  Thickness,
  Border,
  BorderColors,
  pageTemplate,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  accentBar,
  band,
  cell,
  field,
  gbDate,
  h1,
  panel,
  td,
  th,
  weightedRow,
} from '../invoices/_trade-kit-classes';

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

interface BundleSection {
  id: string;
  tab: string;
  title: string;
  description: string;
  items: { reference: string; description: string; dated: string; pages: number }[];
}

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

  const settings = new DocumentSettings(PdfSize.a4, 50);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(INK);
  // Continuous pagination across the whole bundle, including the cover. A
  // bundle whose page numbers restart per section is a bundle nobody can
  // navigate from a transcript.
  settings.footerTemplate = pageTemplate({
    default: band(
      `${BUNDLE.matter} · ${BUNDLE.reference}`,
      `Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    ),
  });

  const metadata = new DocumentMetadata();
  metadata.title = `${BUNDLE.reference} — index and separators — ${BUNDLE.matter}`;
  metadata.author = BUNDLE.preparedBy;
  metadata.subject =
    'Generated bundle apparatus: cover sheet, hyperlinked index with resolved page references, and section separator sheets (sample data). Does not merge existing PDFs.';
  metadata.keywords = 'bundle, index, exhibits, pagination, litigation support, cross-references, pdf/ua, pdf/a';

  const doc = new Document(settings, metadata);

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
    const heading = new HorizontalStack();
    heading.widthDistribution = WidthDistribution.Weighted;
    heading.margin = new Thickness(0, 10, 0, 4);

    const link = new SectionLink(`Tab ${section.tab} — ${section.title}`, section.id);
    link.fontName = StandardFonts.HelveticaBold;
    link.fontSize = 12;
    link.color = ACCENT;
    heading.add(link, 4);

    const pageRow = new HorizontalStack();
    pageRow.spacing = 4;
    const label = cell('separator at page', { size: 9, color: MUTED });
    pageRow.add(label, label.getPreferredWidth());

    const pageRef = new PageNumberOf(section.id);
    pageRef.fontName = StandardFonts.HelveticaBold;
    pageRef.fontSize = 9;
    pageRef.color = INK;
    pageRow.add(pageRef);

    heading.add(pageRow, 1.4);
    doc.add(heading);

    const table = new Table(0.8, 5.2, 1.6, 1);
    table.cellPadding = 5;
    table.border = new Border(0.5);
    table.borderColors = new BorderColors(RULE);
    table.headerBackgroundColor = ACCENT;
    table.headerTextColor = Color.white;
    table.addHeader(th('Ref'), th('Document'), th('Dated'), th('Pages', TextAlignment.Right));
    for (const item of section.items) {
      table.addRow(
        td(item.reference, { bold: true }),
        td(item.description),
        td(item.dated, { color: MUTED }),
        td(String(item.pages), { align: TextAlignment.Right })
      );
    }
    doc.add(table);
  }

  // ── Separator sheets ───────────────────────────────────────────────────────

  for (const section of SECTIONS) {
    doc.add(new PageBreak());
    doc.add(new Section(section.id));

    const rule = new Container();
    rule.backgroundColor = ACCENT;
    rule.height = 6;
    rule.margin = new Thickness(0, 0, 0, 40);
    doc.add(rule);

    doc.add(cell(`TAB ${section.tab}`, { bold: true, size: 44, color: ACCENT, align: TextAlignment.Center, mb: 8 }));
    doc.add(cell(section.title, { bold: true, size: 20, align: TextAlignment.Center, mb: 10 }));
    doc.add(cell(section.description, { size: 10, color: MUTED, align: TextAlignment.Center, mb: 26 }));

    const contents = new VerticalStack();
    contents.spacing = 4;
    contents.add(cell(`This section contains ${section.items.length} item(s):`, { bold: true, size: 9.5, mb: 4 }));
    for (const item of section.items) {
      contents.add(cell(`${item.reference} · ${item.description} (${item.dated})`, { size: 9.5 }));
    }

    const box = new Container();
    box.border = new Border(0.75);
    box.borderColors = new BorderColors(RULE);
    box.cornerRadius = 6;
    box.padding = new Thickness(14);
    box.child = contents;
    doc.add(box);

    const back = new SectionLink('Return to the index', 'index');
    back.fontName = StandardFonts.Helvetica;
    back.fontSize = 9;
    back.color = ACCENT;
    back.margin = new Thickness(0, 18, 0, 0);
    doc.add(back);
  }

  return doc;
}
