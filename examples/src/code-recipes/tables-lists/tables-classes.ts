/**
 * Tables (Class API).
 * The same multi-page employee table + prose as Tables, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextElementBase,
  TextStyle,
  TextAlignment,
  Table,
  TableRow,
  Heading,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  VerticalStack,
  pageTemplate,
  Image,
  ImageFitMode,
  Container,
  HorizontalStack,
  WidthDistribution,
  Border,
  BorderColors,
  Placeholders,
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
 * The **class / construct-then-mutate** companion to `tables.ts`.
 *
 * Same multi-page employee table (repeating headers, zebra rows) + prose
 * sections, authored the long way: `new` each element and assign properties,
 * using `TableRow.fromElements().withBackground()`, the `TextAlignment` enum,
 * `TextStyle`, `Thickness`, `Color` and `ColorPalette` directly. This is the
 * escape hatch the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style `tables.ts`
 * (an equivalence test binds the two). Reach for the options form first; this
 * variant exists to show what it desugars to.
 */
export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);
  function pageFooter(): TextBlock {
    const b = new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`);
    b.fontSize = 9;
    b.color = ColorPalette.slate[400];
    b.alignment = TextAlignment.Right;
    return b;
  }

  settings.footerTemplate = pageTemplate({ default: pageFooter() });

  const metadata = new DocumentMetadata();
  metadata.title = 'Employee Directory';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Table with repeating headers spanning multiple pages. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, table, accessibility, pdf/ua, pdf/a, multi-page, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Part 1: Employee table ─────────────────────────────────────────────────

  const h1Dir = new Heading('Part 1: Employee Directory');
  h1Dir.tocIdentifier = 'directory';
  h1Dir.level = 1;
  h1Dir.fontName = StandardFonts.HelveticaBold;
  h1Dir.fontSize = 20;
  h1Dir.color = ColorPalette.slate[800];
  h1Dir.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1Dir);

  const tableIntro = new TextBlock(
    'The table below lists team members by name, role, and department. Column headers repeat on every page for easy reference. Each cell is automatically tagged for screen readers.'
  );
  tableIntro.margin = new Thickness(0, 0, 0, 10);
  doc.add(tableIntro);

  const table = new Table(46, 130, 130, 120);
  table.repeatHeadersOnNewPage = true;
  table.headerBackgroundColor = ColorPalette.slate[100];
  table.headerTextColor = ColorPalette.slate[800];
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(ColorPalette.slate[200]);

  const photoHeader = new TextBlock('Photo');
  photoHeader.fontName = StandardFonts.HelveticaBold;
  photoHeader.fontSize = 10;
  const nameHeader = new TextBlock('Name');
  nameHeader.fontName = StandardFonts.HelveticaBold;
  nameHeader.fontSize = 10;
  const roleHeader = new TextBlock('Role');
  roleHeader.fontName = StandardFonts.HelveticaBold;
  roleHeader.fontSize = 10;
  const deptHeader = new TextBlock('Department');
  deptHeader.fontName = StandardFonts.HelveticaBold;
  deptHeader.fontSize = 10;
  table.addHeader(photoHeader, nameHeader, roleHeader, deptHeader);

  const employees = Placeholders.withSeed(42).employees(45);

  let rowIndex = 0;
  for (const emp of employees) {
    const photoBytes = assets?.get(`images/employees/employee-${emp.id}.jpg`) ?? emp.avatar;
    // The photo is cropped round by a clipping container the size of the photo.
    const image = new Image();
    image.imageData = photoBytes;
    image.width = 34;
    image.height = 34;
    image.fitMode = ImageFitMode.Cover;
    image.altText = `Photo of ${emp.name}`;
    const photo = new Container();
    photo.width = 34;
    photo.height = 34;
    photo.cornerRadius = 17;
    photo.clipContent = true;
    photo.child = image;

    const bg = rowIndex++ % 2 === 0 ? Color.white : ColorPalette.slate[50];
    const nameCell = new TextBlock(emp.name);
    nameCell.fontSize = 10;
    nameCell.color = ColorPalette.slate[800];
    nameCell.margin = new Thickness(0, 10, 0, 0);
    const roleCell = new TextBlock(emp.role);
    roleCell.fontSize = 10;
    roleCell.color = ColorPalette.slate[600];
    roleCell.margin = new Thickness(0, 10, 0, 0);
    const deptCell = departmentPill(emp.department);
    table.addRow(TableRow.fromElements(photo, nameCell, roleCell, deptCell).withBackground(bg));
  }

  doc.add(table);

  // ── Part 2: Prose sections ─────────────────────────────────────────────────

  const h1Overview = new Heading('Part 2: Company Overview');
  h1Overview.tocIdentifier = 'overview';
  h1Overview.level = 1;
  h1Overview.fontName = StandardFonts.HelveticaBold;
  h1Overview.fontSize = 20;
  h1Overview.color = ColorPalette.slate[800];
  h1Overview.margin = new Thickness(0, 20, 0, 10);
  doc.add(h1Overview);

  for (const [title, body] of OVERVIEW_SECTIONS) {
    // Each heading is kept with its paragraph, so a heading never ends a page on its own.
    const section = new VerticalStack();
    section.breakAllowed = false;
    const h2 = new Heading(title);
    h2.tocIdentifier = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    h2.level = 2;
    h2.fontName = StandardFonts.HelveticaBold;
    h2.fontSize = 14;
    h2.color = ColorPalette.slate[700];
    h2.margin = new Thickness(0, 14, 0, 6);
    section.add(h2);

    const p = new TextBlock(body);
    p.margin = new Thickness(0, 0, 0, 6);
    section.add(p);
    doc.add(section);
  }

  return doc;
}

/** Each department's hue, so a department reads at a glance down the column. */
const DEPARTMENT_HUES: Record<string, keyof typeof ColorPalette> = {
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
  const hue = ColorPalette[DEPARTMENT_HUES[department] ?? 'slate'];
  const label = new TextBlock(department);
  label.fontSize = 9;
  label.color = hue[800];
  const pill = new Container();
  pill.backgroundColor = hue[100];
  pill.cornerRadius = 8;
  pill.padding = new Thickness(8, 3, 8, 3);
  pill.child = label;
  const wrap = new HorizontalStack();
  wrap.widthDistribution = WidthDistribution.Auto;
  wrap.margin = new Thickness(0, 9, 0, 0);
  wrap.add(pill);
  return wrap;
}
