/**
 * Annual Report: Classic.
 * An A4 annual-report template: a full-bleed navy cover with a hero photograph, then inner pages framed by blue header and footer bands with the logo, generation time, and page numbers.
 * Build with generate(assets); export with await doc.generateBytesAsync().
 * The host supplies image, font, or attachment bytes through the assets map.
 */
// Annual Report - Classic
//
// A4 portrait annual-report template: a full-bleed navy front cover with a
// hero photograph, then inner pages whose page-background slot paints blue
// header/footer bands carrying the BonniePDF mark, generation time, and page
// numbers around the flowing report content. Authored through the
// options-object front door.

import {
  Document,
  Heading,
  TextBlock,
  HorizontalStack,
  VerticalStack,
  Container,
  Image,
  Spacer,
  PdfSize,
  Border,
  BorderColors,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Brand colours ───────────────────────────────────────────────────────────
// Three brand colours drive the whole template - the cover accents, the
// tri-colour rule under the title, the header/footer hairlines, and the KPI
// cards all draw from this trio (plus tints derived from the primary).
const PRIMARY = ColorPalette.blue[800]; // deep corporate blue
const SECONDARY = ColorPalette.teal[500]; // teal accent
const TERTIARY = ColorPalette.amber[400]; // warm gold accent

// Darker steps of SECONDARY/TERTIARY for the KPI card value, which paints 24pt
// bold text on the blue-50 card panel: the accent's own shade only clears 3:1
// large-text at PRIMARY's depth (SECONDARY falls to 2.23:1, TERTIARY to
// 1.58:1). The swatches/rule/border above keep the lighter brand trio.
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
  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: MARGIN,
      conformance: 'pdf/a-2a', // the accessible archival level - requires tagging
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: INK },
      // ── Page-background slot ──────────────────────────────────────────────
      // The cover gets a full-bleed deep-blue field; every inner page gets the
      // light header/footer bands. The slot ignores margins, so the bands
      // bleed to the paper edge. Content is overlaid on top of whatever the
      // slot paints.
      pageBackground: (pageNumber: number): IElement => (pageNumber === 1 ? coverBackground() : pageBands()),
      // ── Header / footer slots ─────────────────────────────────────────────
      // Suppressed on the cover; on every inner page they sit centred inside
      // the top/bottom margin bands painted by the background slot.
      headerTemplate: (pageNumber: number): IElement | undefined =>
        pageNumber === 1 ? undefined : headerRow(pageNumber),
      footerTemplate: (pageNumber: number): IElement | undefined =>
        pageNumber === 1 ? undefined : footerRow(pageNumber),
    },
    metadata: {
      title: `${COMPANY} - ${REPORT_TITLE}`,
      author: COMPANY,
      subject: `${COMPANY} ${REPORT_TITLE} - front cover, header/footer slots, and page backgrounds`,
    },
  });

  // ════════════════════════════════════════════════════════════════════════
  //  Page 1 - front cover (overlaid on the deep-blue background slot)
  // ════════════════════════════════════════════════════════════════════════
  const heroData = assets.get(HERO_IMAGE);
  if (!heroData) throw new Error(`Missing required asset: ${HERO_IMAGE}`);
  doc.add(
    new Image({
      imageData: heroData,
      width: PAGE.width - MARGIN * 2,
      height: 220,
      fitMode: 'cover',
      isDecorative: true,
      margin: { top: 24, bottom: 24 },
    })
  );
  doc.add(brandMark());
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
  doc.add(sectionHeading('Letter to Shareholders', { top: 10 }));
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
  doc.add(sectionHeading('Performance Highlights', { top: 20 }));
  doc.add(kpiRow());

  // ════════════════════════════════════════════════════════════════════════
  //  Page 3 - operational review (flows naturally, repeating the bands)
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  doc.add(sectionHeading('Operational Review', { top: 10 }));
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
  return new Container({ backgroundColor: COVER_BG, height: PAGE.height });
}

/**
 * Full-bleed light bands in the top and bottom margins. A band-coloured page is
 * masked by an inset white panel whose top and bottom edges carry brand-coloured
 * hairlines, giving a crisp band/content separation. The header/footer text is
 * centred onto the bands by their own slots.
 */
function pageBands(): IElement {
  return new Container({
    backgroundColor: BAND_BG,
    height: PAGE.height,
    child: new Container({
      backgroundColor: '#ffffff',
      height: PAGE.height - MARGIN * 2,
      margin: { top: MARGIN, bottom: MARGIN },
      // top + bottom hairlines only
      border: new Border(0, 2, 0, 2),
      borderColors: new BorderColors(undefined, SECONDARY, undefined, TERTIARY),
    }),
  });
}

// ── Header / footer rows ────────────────────────────────────────────────────

function bandCell(text: string, align: TextAlignmentInput, bold: boolean, color: ColorInput): TextBlock {
  return new TextBlock(text, {
    fontName: bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: bold ? 12 : 10,
    color: color,
    alignment: align,
  });
}

function bandRow(
  left: TextBlock,
  center: TextBlock,
  right: TextBlock,
  weights: [number, number, number] = [1, 1, 1]
): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(left, weights[0]);
  row.add(center, weights[1]);
  row.add(right, weights[2]);
  return row;
}

function headerRow(pageNumber: number): HorizontalStack {
  return bandRow(
    bandCell('BonniePDF', 'left', true, PRIMARY),
    bandCell(REPORT_TITLE, 'center', false, ColorPalette.blue[700]),
    bandCell(`Page ${pageNumber}`, 'right', false, ColorPalette.blue[600])
  );
}

function footerRow(pageNumber: number): HorizontalStack {
  // The generation time needs a wider column than the page number, so the
  // footer leans on weighted columns rather than equal thirds.
  return bandRow(
    bandCell(GENERATED, 'left', false, ColorPalette.blue[600]),
    bandCell(`${COMPANY} - Confidential`, 'center', false, ColorPalette.blue[600]),
    bandCell(`Page ${pageNumber}`, 'right', true, PRIMARY),
    [5, 4, 2]
  );
}

// ── Cover content ───────────────────────────────────────────────────────────

/** A small three-square brand mark drawn from the colour trio. */
function brandMark(): HorizontalStack {
  const row = new HorizontalStack({ spacing: 6, margin: { bottom: 26 } });
  for (const color of [PRIMARY, SECONDARY, TERTIARY]) {
    row.add(new Container({ backgroundColor: color, width: 14, height: 14, cornerRadius: 3 }));
  }
  return row;
}

function coverLabel(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.HelveticaBold,
    fontSize: 13,
    color: ColorPalette.teal[300],
    margin: { bottom: 12 },
  });
}

/** The company name on the cover is the document's H1. */
function coverTitle(text: string): Heading {
  return new Heading(text, {
    level: 1,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 42,
    color: '#ffffff',
  });
}

/** Three joined segments in the brand trio, sitting under the cover title. */
function triColourRule(): HorizontalStack {
  const row = new HorizontalStack({ spacing: 0, margin: { top: 18, bottom: 18 } }); // joined, edge to edge
  for (const color of [PRIMARY, SECONDARY, TERTIARY]) {
    row.add(new Container({ backgroundColor: color, width: 34, height: 5 }));
  }
  return row;
}

function coverSubtitle(text: string): TextBlock {
  return new TextBlock(text, { fontName: StandardFonts.Helvetica, fontSize: 16, color: ColorPalette.blue[200] });
}

function coverCredit(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: 10,
    color: ColorPalette.blue[300],
    margin: { bottom: 4 },
  });
}

// ── Inner content ───────────────────────────────────────────────────────────

function sectionHeading(text: string, opts: { top?: number } = {}): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 20,
    color: HEADING,
    margin: { top: opts.top ?? 0, bottom: 12 },
  });
}

function subHeading(text: string): Heading {
  return new Heading(text, {
    level: 3,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    color: ColorPalette.blue[700],
    margin: { top: 18, bottom: 8 },
  });
}

function body(text: string): TextBlock {
  return new TextBlock(text, {
    fontName: StandardFonts.Helvetica,
    fontSize: 11,
    color: INK,
    alignment: 'justify',
    margin: { bottom: 12 },
  });
}

// ── KPI highlight cards ─────────────────────────────────────────────────────

function kpiRow(): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 14 });
  const cards: [string, string, ColorInput][] = [
    ['£2.4B', 'Total revenue', PRIMARY],
    ['+18%', 'Year-over-year growth', SECONDARY_TEXT],
    ['2.1M', 'Daily active users', TERTIARY_TEXT],
  ];
  for (const [value, label, accent] of cards) {
    row.add(kpiCard(value, label, accent), 1);
  }
  return row;
}

function kpiCard(value: string, label: string, accent: ColorInput): Container {
  return new Container({
    backgroundColor: ColorPalette.blue[50],
    cornerRadius: 10,
    padding: [18, 16],
    child: new VerticalStack({
      children: [
        new TextBlock(value, {
          fontName: StandardFonts.HelveticaBold,
          fontSize: 24,
          color: accent,
          margin: { bottom: 4 },
        }),
        // 600, not 500: this card sits on the blue-50 panel, where 500 falls to
        // 4.38:1 against the 4.5:1 WCAG AA threshold.
        new TextBlock(label, { fontName: StandardFonts.Helvetica, fontSize: 10, color: ColorPalette.slate[600] }),
      ],
    }),
  });
}
