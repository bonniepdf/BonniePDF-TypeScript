/**
 * Tables.
 * A 45-row employee table whose column headers repeat on every page, with alternating row colours and a “Page N of M” footer, tagged for screen readers.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  Heading,
  Container,
  HorizontalStack,
  Image,
  Placeholders,
  TextBlock,
  TextElementBase,
  Table,
  TableRow,
  StandardFonts,
  VerticalStack,
  type ColorInput,
  pageTemplate,
} from '@bonniepdf/core';

const OVERVIEW_SECTIONS: [string, string][] = [
  [
    'Our Mission',
    'We are dedicated to creating sustainable value for our stakeholders through innovation, operational excellence, and responsible business practices. Our mission guides every decision we make, from product development to customer service.',
  ],
  [
    'Corporate Values',
    'Integrity, innovation, and inclusivity form the foundation of our corporate culture. We believe in doing the right thing, even when no one is watching, and we encourage creative thinking across every level of the organisation.',
  ],
  [
    'Strategic Vision',
    'Looking ahead, we envision a future where technology seamlessly integrates with everyday life to enhance human potential. Our strategic initiatives focus on emerging markets, sustainable technologies, and digital transformation.',
  ],
  [
    'Sustainability',
    'Environmental responsibility is a core value that influences everything we do. We have committed to achieving carbon neutrality and have implemented comprehensive sustainability programmes across all our facilities.',
  ],
  [
    'Conclusion',
    'This document demonstrates the pagination capabilities of BonniePDF. The table automatically spans multiple pages with column headers repeating on each page, while text sections flow naturally across page boundaries.',
  ],
];

/**
 * A multi-page table with repeating headers and zebra-striped rows, followed by
 * flowing prose - authored through the options-object front door.
 *
 * The `Table` is configured in one expression (`columns`, `repeatHeadersOnNewPage`,
 * header colours as tokens); rows are built in a loop because their zebra fill
 * alternates. Header cells and data cells are tagged for screen readers
 * automatically. Colours are palette tokens (`'slate-600'`) or hex (`'#ffffff'`).
 */
export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
      footerTemplate: pageTemplate({
        default: new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`, {
          fontSize: 9,
          color: 'slate-400',
          alignment: 'right',
        }),
      }),
    },
    metadata: {
      title: 'Employee Directory',
      author: 'BonniePDF',
      subject: 'Table with repeating headers spanning multiple pages. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, table, accessibility, pdf/ua, pdf/a, multi-page, BonniePDF',
    },
  });

  // ── Part 1: Employee table ─────────────────────────────────────────────────

  doc.add(
    new Heading('Part 1: Employee Directory', {
      tocIdentifier: 'directory',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      color: 'slate-800',
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'The table below lists team members by name, role, and department. Column headers repeat on every page for easy reference. Each cell is automatically tagged for screen readers.',
      { margin: { bottom: 10 } }
    )
  );

  const table = new Table({
    columns: [46, 130, 130, 120],
    repeatHeadersOnNewPage: true,
    headerBackgroundColor: 'slate-100',
    headerTextColor: 'slate-800',
    border: { width: 0.5, color: 'slate-200' },
  });

  const headerCell = (text: string): TextBlock =>
    new TextBlock(text, { fontName: StandardFonts.HelveticaBold, fontSize: 10 });
  table.addHeader(headerCell('Photo'), headerCell('Name'), headerCell('Role'), headerCell('Department'));

  const employees = Placeholders.withSeed(42).employees(45);

  let rowIndex = 0;
  for (const emp of employees) {
    const photoBytes = assets?.get(`images/employees/employee-${emp.id}.jpg`) ?? emp.avatar;
    // The photo is cropped round by a clipping container the size of the photo.
    const photo = new Container({
      width: 34,
      height: 34,
      cornerRadius: 17,
      clipContent: true,
      child: new Image({
        imageData: photoBytes,
        width: 34,
        height: 34,
        fitMode: 'cover',
        altText: `Photo of ${emp.name}`,
      }),
    });

    const bg = rowIndex++ % 2 === 0 ? '#ffffff' : 'slate-50';
    const row = TableRow.fromElements(
      photo,
      new TextBlock(emp.name, { fontSize: 10, color: 'slate-800', margin: { top: 10 } }),
      new TextBlock(emp.role, { fontSize: 10, color: 'slate-600', margin: { top: 10 } }),
      departmentPill(emp.department)
    );
    row.backgroundColor = bg;
    table.addRow(row);
  }

  doc.add(table);

  // ── Part 2: Prose sections ─────────────────────────────────────────────────

  doc.add(
    new Heading('Part 2: Company Overview', {
      tocIdentifier: 'overview',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      color: 'slate-800',
      margin: { top: 20, bottom: 10 },
    })
  );

  for (const [title, body] of OVERVIEW_SECTIONS) {
    // Each heading is kept with its paragraph, so a heading never ends a page on its own.
    const section = new VerticalStack({ breakAllowed: false });
    section.add(
      new Heading(title, {
        tocIdentifier: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 14,
        color: 'slate-700',
        margin: { top: 14, bottom: 6 },
      })
    );

    section.add(new TextBlock(body, { margin: { bottom: 6 } }));
    doc.add(section);
  }

  return doc;
}

/** Each department's hue, so a department reads at a glance down the column. */
const DEPARTMENT_HUES: Record<string, string> = {
  Engineering: 'indigo',
  Marketing: 'rose',
  Sales: 'amber',
  HR: 'emerald',
  Finance: 'sky',
  Design: 'violet',
  Operations: 'teal',
};

/**
 * A department as a small tinted pill: a light fill with dark text of the same hue. The auto-width
 * stack sizes the pill to its text instead of letting it fill the cell.
 */
function departmentPill(department: string): HorizontalStack {
  const hue = DEPARTMENT_HUES[department] ?? 'slate';
  return new HorizontalStack({
    widthDistribution: 'auto',
    margin: { top: 9 },
    children: [
      new Container({
        backgroundColor: `${hue}-100` as ColorInput,
        cornerRadius: 8,
        padding: [8, 3],
        child: new TextBlock(department, { fontSize: 9, color: `${hue}-800` as ColorInput }),
      }),
    ],
  });
}
