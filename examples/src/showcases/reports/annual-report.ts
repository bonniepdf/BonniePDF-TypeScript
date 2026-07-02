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
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  WidthDistribution,
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

const COVER_BG = ColorPalette.blue[900]; // deepest primary tint - cover field
const BAND_BG = ColorPalette.blue[100]; // lightest primary tint - header/footer bands
const INK = ColorPalette.slate[700]; // body copy
const HEADING = ColorPalette.blue[800]; // section headings

// A4 portrait. The generous margin doubles as the height of the full-bleed
// header/footer bands, leaving the band text comfortably clear of the paper
// edge and a hairline of breathing room between the bands and the content.
const PAGE = PdfSize.a4;
const MARGIN = 72;

const HERO_IMAGE = 'images/sean-pollock-PhYq704ffdA-unsplash.jpg';

const COMPANY = 'Horizon Ventures';
const YEAR = 2025;
const REPORT_TITLE = `Annual Report ${YEAR}`;

// Captured once, when the document is generated - surfaced in the footer.
const GENERATED = `Generated ${new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date())}`;

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings(PAGE, MARGIN);
  settings.conformance = PdfAConformance.PdfA2b;
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
  const heroData = assets?.get(HERO_IMAGE);
  if (heroData) {
    const hero = new Image();
    hero.imageData = heroData;
    hero.width = PAGE.width - MARGIN * 2;
    hero.height = 220;
    hero.fitMode = ImageFitMode.Cover;
    hero.isDecorative = true;
    doc.add(new Spacer(24));
    doc.add(hero);
    doc.add(new Spacer(24));
  } else {
    doc.add(new Spacer(150));
  }
  doc.add(brandMark());
  doc.add(new Spacer(26));
  doc.add(coverLabel('ANNUAL REPORT'));
  doc.add(coverTitle(COMPANY));
  doc.add(triColourRule());
  doc.add(coverSubtitle(`Fiscal Year ${YEAR}`));
  if (!heroData) doc.add(new Spacer(210));
  else doc.add(new Spacer(40));
  doc.add(coverCredit('Prepared with BonniePDF'));
  doc.add(coverCredit(GENERATED));

  // ════════════════════════════════════════════════════════════════════════
  //  Page 2 - letter to shareholders + performance highlights
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  doc.add(new Spacer(10));
  doc.add(sectionHeading('Letter to Shareholders'));
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

  doc.add(new Spacer(20));
  doc.add(sectionHeading('Performance Highlights'));
  doc.add(kpiRow());

  // ════════════════════════════════════════════════════════════════════════
  //  Page 3 - operational review (flows naturally, repeating the bands)
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  doc.add(new Spacer(10));
  doc.add(sectionHeading('Operational Review'));
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

  return doc;
}

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
  cell.textColor = color;
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
  row.addChild(left, weights[0]);
  row.addChild(center, weights[1]);
  row.addChild(right, weights[2]);
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
    row.addChild(square);
  }
  return row;
}

function coverLabel(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 13;
  b.textColor = ColorPalette.teal[300];
  b.margin = new Thickness(0, 0, 0, 12);
  return b;
}

function coverTitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 42;
  b.textColor = Color.white;
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
    row.addChild(segment);
  }
  return row;
}

function coverSubtitle(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 16;
  b.textColor = ColorPalette.blue[200];
  return b;
}

function coverCredit(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 10;
  b.textColor = ColorPalette.blue[300];
  b.margin = new Thickness(0, 0, 0, 4);
  return b;
}

// ── Inner content ───────────────────────────────────────────────────────────

function sectionHeading(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 20;
  b.textColor = HEADING;
  b.margin = new Thickness(0, 0, 0, 12);
  return b;
}

function subHeading(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 14;
  b.textColor = ColorPalette.blue[700];
  b.margin = new Thickness(0, 18, 0, 8);
  return b;
}

function body(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.Helvetica;
  b.fontSize = 11;
  b.textColor = INK;
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
    ['+18%', 'Year-over-year growth', SECONDARY],
    ['2.1M', 'Daily active users', TERTIARY],
  ];
  for (const [value, label, accent] of cards) {
    row.addChild(kpiCard(value, label, accent), 1);
  }
  return row;
}

function kpiCard(value: string, label: string, accent: Color): Container {
  const stack = new VerticalStack();

  const v = new TextBlock(value);
  v.fontName = StandardFonts.HelveticaBold;
  v.fontSize = 24;
  v.textColor = accent;
  v.margin = new Thickness(0, 0, 0, 4);
  stack.addChild(v);

  const l = new TextBlock(label);
  l.fontName = StandardFonts.Helvetica;
  l.fontSize = 10;
  l.textColor = ColorPalette.slate[500];
  stack.addChild(l);

  const card = new Container();
  card.backgroundColor = ColorPalette.blue[50];
  card.cornerRadius = 10;
  card.padding = new Thickness(18, 16, 18, 16);
  card.child = stack;
  return card;
}
