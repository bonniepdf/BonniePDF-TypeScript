/**
 * Annual Report: Classic (Class API).
 * A4 portrait annual-report template: a full-bleed navy front cover with a hero photograph, then inner pages whose page-background slot paints blue header/footer bands carrying the BonniePDF mark, generation time, and page numbers around the flowing report content.
 * Build with generate(assets); export with await doc.generateBytesAsync().
 * The host supplies image, font, or attachment bytes through the assets map.
 */
// The **class / construct-then-mutate** companion to `annual-report.ts`.
// Same three-page annual report, authored the long way: `new` each element
// and assign properties. It renders **byte-for-byte identically** to the
// options-style original (an equivalence test binds the two). Reach for the
// options form first; this variant exists to show what it desugars to.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  HorizontalStack,
  VerticalStack,
  Container,
  Image,
  ImageFitMode,
  Spacer,
  Table,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
  AccessibilityMode,
  Heading,
  PdfAConformance,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Brand colours ───────────────────────────────────────────────────────────
// Three brand colours drive the whole template - the cover accents, the
// tri-colour rule under the title, the header/footer hairlines, and the KPI
// cards all draw from this trio (plus tints derived from the primary).
const PRIMARY = ColorPalette.blue[800]; // deep corporate blue
const SECONDARY = ColorPalette.teal[500]; // teal accent
const TERTIARY = ColorPalette.amber[400]; // warm gold accent
const SECONDARY_TEXT = ColorPalette.teal[600];
const TERTIARY_TEXT = ColorPalette.amber[700];

const COVER_BG = ColorPalette.blue[900]; // deepest primary tint - cover field
const BAND_BG = ColorPalette.blue[100]; // lightest primary tint - header/footer bands
const INK = ColorPalette.slate[600]; // body copy
const HEADING = ColorPalette.blue[800]; // section headings

// A4 portrait. The generous margin doubles as the height of the full-bleed
// header/footer bands, leaving the band text comfortably clear of the paper
// edge and a hairline of breathing room between the bands and the content.
const PAGE = PdfSize.a4;
const MARGIN = 72;

const HERO_IMAGE = 'images/sean-pollock-PhYq704ffdA-unsplash.jpg';

const COMPANY = 'Sample Company';

/** The year's headline figures against the year before: line, this year, last year, change. */
const FINANCIALS: [string, string, string, string][] = [
  ['Revenue', '2,412', '2,044', '+18%'],
  ['Gross profit', '1,566', '1,287', '+22%'],
  ['Operating income', '516', '412', '+25%'],
  ['Net income', '401', '322', '+25%'],
  ['Earnings per share', '£1.86', '£1.49', '+25%'],
];

/** Revenue by business segment: name, £ millions, share of the total. */
const SEGMENTS: [string, string, string][] = [
  ['Platform', '1,250', '52%'],
  ['Services', '669', '28%'],
  ['Hardware', '288', '12%'],
  ['Licensing', '205', '8%'],
];
const YEAR = 2025;
const REPORT_TITLE = `Annual Report ${YEAR}`;

// Captured once, when the document is generated - surfaced in the footer.
const GENERATED = `Generated ${new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(2026, 5, 16, 10, 30, 0))}`;

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings(PAGE, MARGIN);
  settings.conformance = PdfAConformance.PdfA2a; // the accessible archival level - requires tagging
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(INK);

  // ── Page-background slot ──────────────────────────────────────────────────
  // The cover gets a full-bleed deep-blue field; every inner page gets the
  // light header/footer bands. The slot ignores margins, so the bands bleed to
  // the paper edge. Content is overlaid on top of whatever the slot paints.
  settings.pageBackground = (pageNumber: number): IElement => (pageNumber === 1 ? coverBackground() : pageBands());

  // ── Header / footer slots ─────────────────────────────────────────────────
  // Suppressed on the cover; on every inner page they sit centred inside the
  // top/bottom margin bands painted by the background slot.
  settings.headerTemplate = (pageNumber: number): IElement | undefined =>
    pageNumber === 1 ? undefined : headerRow(pageNumber);
  settings.footerTemplate = (pageNumber: number): IElement | undefined =>
    pageNumber === 1 ? undefined : footerRow(pageNumber);

  const metadata = new DocumentMetadata();
  metadata.title = `${COMPANY} - ${REPORT_TITLE}`;
  metadata.author = COMPANY;
  metadata.subject = `${COMPANY} ${REPORT_TITLE} - front cover, header/footer slots, and page backgrounds`;

  const doc = new Document(settings, metadata);

  // ════════════════════════════════════════════════════════════════════════
  //  Page 1 - front cover (overlaid on the deep-blue background slot)
  // ════════════════════════════════════════════════════════════════════════
  const heroData = assets.get(HERO_IMAGE);
  if (!heroData) throw new Error(`Missing required asset: ${HERO_IMAGE}`);
  const hero = new Image();
  hero.imageData = heroData;
  hero.width = PAGE.width - MARGIN * 2;
  hero.height = 220;
  hero.fitMode = ImageFitMode.Cover;
  hero.isDecorative = true;
  hero.margin = new Thickness(0, 24, 0, 24);
  doc.add(hero);
  const mark = brandMark();
  mark.margin = new Thickness(0, 0, 0, 26);
  doc.add(mark);
  doc.add(coverLabel('ANNUAL REPORT'));
  doc.add(coverTitle(COMPANY));
  doc.add(triColourRule());
  doc.add(coverSubtitle(`Fiscal Year ${YEAR}`));
  doc.add(new Spacer(40));
  doc.add(coverCredit('Prepared with BonniePDF'));
  doc.add(coverCredit(GENERATED));

  // ════════════════════════════════════════════════════════════════════════
  //  Page 2 - letter to shareholders + performance highlights
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  const shareholderHeading = sectionHeading('Letter to Shareholders');
  shareholderHeading.margin = new Thickness(0, 10, 0, 12);
  doc.add(shareholderHeading);
  doc.add(
    body(
      `This past year tested our resolve and rewarded our discipline. Against a ` +
        `backdrop of shifting markets, ${COMPANY} delivered record revenue, expanded ` +
        `into three new regions, and strengthened the balance sheet that underpins ` +
        `everything we build. None of this would have been possible without the trust ` +
        `you place in us as shareholders.`
    )
  );
  doc.add(
    body(
      `We entered the year with a simple promise: grow responsibly and invest where ` +
        `it matters. Our teams answered that call. Operating margin improved for the ` +
        `fourth consecutive year, customer retention reached an all-time high, and our ` +
        `flagship platform now serves more than two million daily users.`
    )
  );
  const performanceHeading = sectionHeading('Performance Highlights');
  performanceHeading.margin = new Thickness(0, 20, 0, 12);
  doc.add(performanceHeading);
  doc.add(kpiRow());

  // ── Operational review: flows on from the highlights, repeating the bands on any further page ──
  const operationalHeading = sectionHeading('Operational Review');
  operationalHeading.margin = new Thickness(0, 20, 0, 12);
  doc.add(operationalHeading);
  doc.add(
    body(
      `Revenue grew 18% year over year, led by double-digit gains across every ` +
        `business line. The Platform division remained our largest contributor, while ` +
        `Services posted its strongest quarter on record. Disciplined cost control let ` +
        `us reinvest the upside into research, talent, and infrastructure.`
    )
  );
  doc.add(subHeading('Sustainability & Governance'));
  doc.add(
    body(
      `We reduced operational emissions by 22% and reached carbon neutrality across ` +
        `our two largest facilities. Our board added two independent directors, ` +
        `deepening the expertise that guides long-term strategy and risk oversight.`
    )
  );
  doc.add(subHeading('Looking Ahead'));
  doc.add(
    body(
      `Next year we will accelerate international expansion, deepen our product ` +
        `platform, and continue returning value to shareholders. The fundamentals are ` +
        `strong, the strategy is clear, and the team has never been more capable. We ` +
        `are grateful for your continued partnership.`
    )
  );

  // ════════════════════════════════════════════════════════════════════════
  //  Page 3 - the numbers: the year against the last, and revenue by segment
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  const financialHeading = sectionHeading('Financial Summary');
  financialHeading.margin = new Thickness(0, 10, 0, 12);
  doc.add(financialHeading);
  doc.add(body(`Audited results for the year ended 31 December ${YEAR}, in £ millions, against the year before.`));
  doc.add(financialSummary());
  const segmentHeading = sectionHeading('Revenue by Segment');
  segmentHeading.margin = new Thickness(0, 24, 0, 12);
  doc.add(segmentHeading);
  doc.add(segmentTable());

  return doc;
}

// Local helpers and sample types used by this document.

// ── Background slot builders ────────────────────────────────────────────────
//
// Page slots render one full-page element at the paper origin, so each builder
// returns a single Container (nesting a second to mask out a region). A flowing
// element such as VerticalStack is deliberately avoided here: inside a slot it
// would apply page-break logic against the content margins and mis-place its
// later children.

/** Full-bleed deep-blue field for the cover. */
function coverBackground(): IElement {
  const field = new Container();
  field.backgroundColor = COVER_BG;
  field.height = PAGE.height;
  return field;
}

/**
 * Full-bleed light bands in the top and bottom margins. A band-coloured page is
 * masked by an inset white panel whose top and bottom edges carry brand-coloured
 * hairlines, giving a crisp band/content separation. The header/footer text is
 * centred onto the bands by their own slots.
 */
function pageBands(): IElement {
  const field = new Container();
  field.backgroundColor = BAND_BG;
  field.height = PAGE.height;

  const panel = new Container();
  panel.backgroundColor = Color.white;
  panel.height = PAGE.height - MARGIN * 2;
  panel.margin = new Thickness(0, MARGIN, 0, MARGIN);
  panel.border = new Border(0, 2, 0, 2); // top + bottom hairlines only
  panel.borderColors = new BorderColors(undefined, SECONDARY, undefined, TERTIARY);
  field.child = panel;

  return field;
}

// ── Header / footer rows ────────────────────────────────────────────────────

function bandCell(text: string, align: TextAlignment, bold: boolean, color: Color): TextBlock {
  const cell = new TextBlock(text);
  cell.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  cell.fontSize = bold ? 12 : 10;
  cell.color = color;
  cell.alignment = align;
  return cell;
}

function bandRow(
  left: TextBlock,
  center: TextBlock,
  right: TextBlock,
  weights: [number, number, number] = [1, 1, 1]
): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.add(left, weights[0]);
  row.add(center, weights[1]);
  row.add(right, weights[2]);
  return row;
}

function headerRow(pageNumber: number): HorizontalStack {
  return bandRow(
    bandCell('BonniePDF', TextAlignment.Left, true, PRIMARY),
    bandCell(REPORT_TITLE, TextAlignment.Center, false, ColorPalette.blue[700]),
    bandCell(`Page ${pageNumber}`, TextAlignment.Right, false, ColorPalette.blue[600])
  );
}

function footerRow(pageNumber: number): HorizontalStack {
  // The generation time needs a wider column than the page number, so the
  // footer leans on weighted columns rather than equal thirds.
  return bandRow(
    bandCell(GENERATED, TextAlignment.Left, false, ColorPalette.blue[600]),
    bandCell(`${COMPANY} - Confidential`, TextAlignment.Center, false, ColorPalette.blue[600]),
    bandCell(`Page ${pageNumber}`, TextAlignment.Right, true, PRIMARY),
    [5, 4, 2]
  );
}

// ── Cover content ───────────────────────────────────────────────────────────

/** A small three-square brand mark drawn from the colour trio. */
function brandMark(): HorizontalStack {
  const row = new HorizontalStack();
  row.spacing = 6;
  for (const color of [PRIMARY, SECONDARY, TERTIARY]) {
    const square = new Container();
    square.backgroundColor = color;
    square.width = 14;
    square.height = 14;
    square.cornerRadius = 3;
    row.add(square);
  }
  return row;
}

function coverLabel(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 13;
  b.color = ColorPalette.teal[300];
  b.margin = new Thickness(0, 0, 0, 12);
  return b;
}

/** The company name on the cover is the document's H1. */
function coverTitle(text: string): Heading {
  const b = new Heading(text);
  b.level = 1;
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 42;
  b.color = Color.white;
  return b;
}

/** Three joined segments in the brand trio, sitting under the cover title. */
function triColourRule(): HorizontalStack {
  const row = new HorizontalStack();
  row.spacing = 0; // joined, edge to edge
  row.margin = new Thickness(0, 18, 0, 18);
  for (const color of [PRIMARY, SECONDARY, TERTIARY]) {
    const segment = new Container();
    segment.backgroundColor = color;
    segment.width = 34;
    segment.height = 5;
    row.add(segment);
  }
  return row;
}

function coverSubtitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 16;
  b.color = ColorPalette.blue[200];
  return b;
}

function coverCredit(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 10;
  b.color = ColorPalette.blue[300];
  b.margin = new Thickness(0, 0, 0, 4);
  return b;
}

// ── Inner content ───────────────────────────────────────────────────────────

function sectionHeading(text: string): Heading {
  const b = new Heading(text);
  b.level = 2;
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 20;
  b.color = HEADING;
  b.margin = new Thickness(0, 0, 0, 12);
  return b;
}

function subHeading(text: string): Heading {
  const b = new Heading(text);
  b.level = 3;
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 14;
  b.color = ColorPalette.blue[700];
  b.margin = new Thickness(0, 18, 0, 8);
  return b;
}

function body(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 11;
  b.color = INK;
  b.alignment = TextAlignment.Justify;
  b.margin = new Thickness(0, 0, 0, 12);
  return b;
}

// ── KPI highlight cards ─────────────────────────────────────────────────────

function kpiRow(): HorizontalStack {
  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 14;
  const cards: [string, string, Color][] = [
    ['£2.4B', 'Total revenue', PRIMARY],
    ['+18%', 'Year-over-year growth', SECONDARY_TEXT],
    ['2.1M', 'Daily active users', TERTIARY_TEXT],
  ];
  for (const [value, label, accent] of cards) {
    row.add(kpiCard(value, label, accent), 1);
  }
  return row;
}

function kpiCard(value: string, label: string, accent: Color): Container {
  const stack = new VerticalStack();

  const v = new TextBlock(value);
  v.fontName = StandardFonts.HelveticaBold;
  v.fontSize = 24;
  v.color = accent;
  v.margin = new Thickness(0, 0, 0, 4);
  stack.add(v);

  const l = new TextBlock(label);
  l.fontName = StandardFonts.Helvetica;
  l.fontSize = 10;
  l.color = ColorPalette.slate[600];
  stack.add(l);

  const card = new Container();
  card.backgroundColor = ColorPalette.blue[50];
  card.cornerRadius = 10;
  card.padding = new Thickness(18, 16, 18, 16);
  card.child = stack;
  return card;
}

// ── Financial summary tables ────────────────────────────────────────────────

/** A table cell in the report's body type. */
function cell(text: string, color: Color, bold = false, alignment: TextAlignment = TextAlignment.Left): TextBlock {
  const t = new TextBlock(text);
  t.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  t.fontSize = 10;
  t.color = color;
  t.alignment = alignment;
  return t;
}

/** A table in the report's style: a brand-blue header row and hairline borders. */
function reportTable(...columns: number[]): Table {
  const table = new Table(...columns);
  table.cellPadding = 7;
  table.border = new Border(0.5);
  table.borderColors = new BorderColors(ColorPalette.slate[200]);
  table.headerBackgroundColor = PRIMARY;
  table.headerTextColor = Color.white;
  return table;
}

/** This year against last, with the change in the brand's positive green. */
function financialSummary(): Table {
  const table = reportTable(2.2, 1, 1, 0.9);
  table.addHeader(
    cell('£ millions', Color.white, true),
    cell(`FY${String(YEAR).slice(2)}`, Color.white, true, TextAlignment.Right),
    cell(`FY${String(YEAR - 1).slice(2)}`, Color.white, true, TextAlignment.Right),
    cell('Change', Color.white, true, TextAlignment.Right)
  );
  for (const [line, current, previous, change] of FINANCIALS)
    table.addRow(
      cell(line, INK),
      cell(current, INK, true, TextAlignment.Right),
      cell(previous, ColorPalette.slate[500], false, TextAlignment.Right),
      cell(change, ColorPalette.emerald[700], true, TextAlignment.Right)
    );
  return table;
}

/** Each segment's revenue and its share of the total, which add up to the headline revenue. */
function segmentTable(): Table {
  const table = reportTable(2.2, 1, 1);
  table.addHeader(
    cell('Segment', Color.white, true),
    cell('£ millions', Color.white, true, TextAlignment.Right),
    cell('Share', Color.white, true, TextAlignment.Right)
  );
  for (const [segment, revenue, share] of SEGMENTS)
    table.addRow(
      cell(segment, INK),
      cell(revenue, INK, true, TextAlignment.Right),
      cell(share, ColorPalette.slate[500], false, TextAlignment.Right)
    );
  return table;
}
