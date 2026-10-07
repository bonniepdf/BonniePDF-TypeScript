/**
 * Annual Report: Masked.
 * A two-page annual report. Page 1 is the classic photographic cover: a full-width hero image clipped to an angled mask cutting into a green title band with a gold seam. Page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.
 * Build with generate(assets); export with await doc.generateBytesAsync().
 * The host supplies image, font, or attachment bytes through the assets map.
 */
import {
  Document,
  PdfSize,
  Color,
  ColorPalette,
  Size,
  StandardFonts,
  CanvasElement,
  Container,
  Heading,
  ImageLoader,
  TextBlock,
  VerticalStack,
  type IElement,
  type ICanvas,
  TextAlignment,
  HorizontalStack,
  Table,
  Border,
  BorderColors,
  Thickness,
  WidthDistribution,
  ChartData,
  ChartBase,
  ChartSeries,
  ChartDataPoint,
  BarChart,
  PieChart,
} from '@bonniepdf/core';

const INK = ColorPalette.slate[700];

// 600, not 500: this label sits on each cover's own brand tint panel, and 500
// falls to 4.26-4.47:1 there against the 4.5:1 WCAG AA threshold.
const MUTED = ColorPalette.slate[600];

const RULE = ColorPalette.slate[200];

// ─────────────────────────────────────────────────────────────────────────────
// Annual-report front cover #2 - "Masked hero image".
//
// The classic photographic report cover: a full-width hero image occupies the
// top of the page, clipped to an angled mask so its lower edge cuts diagonally
// into a solid brand band that carries the title. The mask is an arbitrary
// polygon path fed to ICanvas.clipToCurrentPath.
//
//   ┌───────────────────────┐  ← page top
//   │      HERO IMAGE       │
//   │   (clipped to the     │
//   │    angled mask)      ╱│
//   │                    ╱  │  ← diagonal seam (gold rule)
//   ├──────────────────╱    │
//   │   BRAND BAND + TITLE  │
//   └───────────────────────┘  ← page bottom
//
// The Document/settings/metadata wrapper is authored through the
// options-object front door; the vector-drawing calls inside `drawCover`
// are the low-level drawing surface itself, with no "options vs class"
// distinction, so they are unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const HERO_IMAGE = 'images/sean-pollock-PhYq704ffdA-unsplash.jpg';

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

const BAND = ColorPalette.emerald[900]; // brand band behind the title
const SEAM = ColorPalette.amber[400];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const heroData = assets.get(HERO_IMAGE);
  if (!heroData) throw new Error(`Missing required asset: ${HERO_IMAGE}`);
  const heroImage = ImageLoader.loadFromBytes(heroData);

  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: 0, // zero margin - full-bleed cover
      pageColor: '#ffffff',
      language: 'en-GB',
      accessibility: 'pdf/ua-1',
      // The cover artwork lives in the page-background slot. Slots are painted
      // inside an /Artifact marked-content section, so the band, the photo and
      // the seam stay out of the structure tree where decoration belongs - and
      // the cover type above flows as ordinary tagged content.
      pageBackground: (pageNumber: number): IElement | undefined =>
        pageNumber === 1
          ? new CanvasElement((canvas, size) => drawCover(canvas, size, heroImage), {
              drawWidth: PAGE.width,
              drawHeight: PAGE.height,
              isDecorative: true,
            })
          : undefined,
    },
    metadata: {
      title: `${COMPANY} - Annual Report ${YEAR}`,
      author: COMPANY,
      subject: `${COMPANY} Annual Report ${YEAR} - masked hero-image cover (vector drawing surface)`,
    },
  });

  doc.add(coverType());

  // Page 2 - the "inside the report" capabilities spread (tables + charts + donut).
  addCapabilitiesPage(doc, {
    company: COMPANY,
    year: YEAR,
    primary: ColorPalette.emerald[800],
    accent: ColorPalette.amber[600],
    tint: ColorPalette.emerald[50],
    segmentColors: ['#047857', '#0d9488', '#f59e0b', '#0284c7'],
  });

  return doc;
}

// Local helpers and sample types used by this document.

// gold seam along the diagonal cut

function drawCover(canvas: ICanvas, size: Size, heroImage: ReturnType<typeof ImageLoader.loadFromBytes>): void {
  const w = size.width;
  const h = size.height;

  // The diagonal seam: the hero image's lower edge runs from 0.52·H on the left
  // down to 0.62·H on the right. The mask polygon is everything above that line.
  const cutLeft = h * 0.52;
  const cutRight = h * 0.62;
  const photoBottom = h * 0.66;

  // 1. Brand band fills the whole page; the masked image overpaints the top.
  canvas.beginPath();
  canvas.addRect(0, 0, w, h);
  canvas.fillCurrentPath(BAND);

  // 2. Clip to the angled hero-image mask, then paint the image inside it.
  canvas.saveState();
  canvas.beginPath();
  canvas.moveTo(0, 0);
  canvas.lineTo(w, 0);
  canvas.lineTo(w, cutRight);
  canvas.lineTo(0, cutLeft);
  canvas.closePath();
  canvas.clipToCurrentPath();

  canvas.drawImage(heroImage, 0, 0, w, photoBottom);

  canvas.restoreState();

  // 3. Gold seam stroked along the diagonal cut.
  canvas.beginPath();
  canvas.moveTo(0, cutLeft);
  canvas.lineTo(w, cutRight);
  canvas.strokeCurrentPath({ paint: SEAM, width: 6, lineCap: 'butt' });
}

// ── Cover type ───────────────────────────────────────────────────────────────
// Real text elements, not canvas glyphs: the company name is the document's H1
// and everything here lands in the structure tree, so a screen reader reads the
// cover in order instead of meeting one opaque figure.

function coverType(): Container {
  const stack = new VerticalStack();

  stack.add(
    new TextBlock(`ANNUAL REPORT ${YEAR}`, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      color: ColorPalette.emerald[200],
      margin: { bottom: 6 },
    })
  );

  stack.add(
    new Heading(COMPANY, {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 46,
      lineHeight: 1,
      color: Color.white,
      margin: { bottom: 18 },
    })
  );

  // The gold rule under the title is decoration, so it stays a drawn box.
  stack.add(
    new Container({
      width: 120,
      height: 4,
      backgroundColor: SEAM,
      margin: { left: 2, bottom: 14 },
    })
  );

  stack.add(
    new TextBlock('Building resilient infrastructure across three continents', {
      fontSize: 13,
      color: ColorPalette.emerald[100],
      margin: { bottom: 106 },
    })
  );

  stack.add(
    new TextBlock(`Prepared with BonniePDF · Fiscal Year ${YEAR}`, {
      fontSize: 10,
      color: ColorPalette.emerald[200],
    })
  );

  // Anchored to the foot of the page rather than positioned by a top padding
  // measured against the font's metrics: the block keeps its footing if the
  // title wraps or a face changes.
  return new Container({
    height: PAGE.height,
    verticalAlignment: 'bottom',
    padding: { left: 72, right: 72, bottom: 49 },
    child: stack,
  });
}

// Local helpers keep this example ready to copy into a single file.

interface ReportBrand {
  company: string;
  year: number;
  /** Deepest brand colour - headings, primary bars, KPI accents. */
  primary: Color;
  /** Secondary accent - eyebrow text, rules. */
  accent: Color;
  /** Light tint for card backgrounds. */
  tint: Color;
  /** Ordered segment colours for the donut (hex strings). */
  segmentColors: string[];
}

function tb(text: string, size: number, color: Color, bold = false, align?: TextAlignment): TextBlock {
  const b = new TextBlock(text);
  b.fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = size;
  b.color = color;
  if (align) b.alignment = align;
  return b;
}

function kpiCard(value: string, label: string, accent: Color, tint: Color): Container {
  const stack = new VerticalStack();
  const v = tb(value, 22, accent, true);
  v.margin = new Thickness(0, 0, 0, 3);
  stack.add(v);
  stack.add(tb(label, 9, MUTED));
  const card = new Container();
  card.backgroundColor = tint;
  card.cornerRadius = 8;
  card.padding = new Thickness(16, 14, 16, 14);
  card.child = stack;
  return card;
}

/** A titled card wrapping an arbitrary body element (used for the two charts). */
function chartCard(title: string, body: IElement, accent: Color): Container {
  const stack = new VerticalStack();
  const heading = tb(title, 11, accent, true);
  heading.margin = new Thickness(0, 0, 0, 8);
  stack.add(heading);
  stack.add(body);
  const card = new Container();
  card.border = new Border(0.75);
  card.borderColors = new BorderColors(RULE);
  card.cornerRadius = 8;
  // A card is also a hard visual boundary. Responsive chart layout should keep
  // the drawing inside it, while clipping provides a final guard against a long
  // label or future chart configuration painting over neighbouring content.
  card.clipContent = true;
  card.padding = new Thickness(14, 14, 14, 14);
  card.child = stack;
  return card;
}

function quarterlyBarChart(primary: Color): ChartBase {
  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const values = [182, 205, 241, 288];
  const series = new ChartSeries();
  series.color = primary;
  series.dataPoints = labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
  const data = new ChartData();
  // The card supplies the visible title; repeating it inside the plot wastes a
  // sizeable title band that is better used by the data.
  data.series = [series];
  data.yAxis.prefix = '£';
  data.yAxis.maxValue = 320;
  data.yAxis.stepCount = 4;

  const chart = new BarChart({
    data,
    altText: 'Column chart of quarterly revenue in £m rising from 182 in Q1 to 288 in Q4.',
  });
  chart.height = 130;
  chart.stretchToFit = true;
  chart.barColor = primary;
  chart.fontFamily = StandardFonts.Helvetica;
  chart.labelFontSize = 8;
  chart.backgroundColor = Color.white;
  return chart;
}

function segmentDonut(colors: string[]): ChartBase {
  const labels = ['Platform', 'Services', 'Hardware', 'Licensing'];
  const values = [512, 274, 118, 84];
  const series = new ChartSeries();
  series.dataPoints = labels.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = values[i];
    return p;
  });
  const data = new ChartData();
  // The enclosing card is the chart title, leaving the canvas to the plot and
  // its legend rather than presenting the same heading twice.
  data.series = [series];

  const chart = new PieChart({
    data,
    altText: 'Donut chart of revenue by segment: Platform, Services, Hardware, and Licensing.',
  });
  chart.height = 130;
  chart.stretchToFit = true;
  chart.isDonut = true;
  chart.totalLabel = 'Total';
  chart.showLegend = true;
  chart.colors = colors;
  chart.backgroundColor = Color.white;
  return chart;
}

function financialTable(primary: Color): Table {
  const table = new Table(2.2, 1, 1, 0.9);
  table.cellPadding = 8;
  table.border = Border.none;
  table.headerBackgroundColor = primary;
  table.headerTextColor = Color.white;
  table.addHeader(
    tb('£ millions', 9, Color.white, true),
    tb(`FY${String(2025).slice(2)}`, 9, Color.white, true, TextAlignment.Right),
    tb('FY24', 9, Color.white, true, TextAlignment.Right),
    tb('Change', 9, Color.white, true, TextAlignment.Right)
  );
  const rows: [string, string, string, string][] = [
    ['Revenue', '988', '837', '+18%'],
    ['Gross profit', '641', '523', '+23%'],
    ['Operating income', '212', '164', '+29%'],
    ['Net income', '167', '129', '+29%'],
    ['Earnings per share', '£1.34', '£1.04', '+29%'],
  ];
  for (const [name, cur, prev, chg] of rows) {
    table.addRow(
      tb(name, 9, INK),
      tb(cur, 9, INK, false, TextAlignment.Right),
      tb(prev, 9, MUTED, false, TextAlignment.Right),
      tb(chg, 9, ColorPalette.emerald[600], true, TextAlignment.Right)
    );
  }
  return table;
}

/** Append the capabilities spread as a new page on `doc`. */
function addCapabilitiesPage(doc: Document, brand: ReportBrand): void {
  doc.addPage();

  const content = new VerticalStack();

  const eyebrow = tb('INSIDE THE REPORT', 9, brand.accent, true);
  eyebrow.margin = new Thickness(0, 0, 0, 4);
  content.add(eyebrow);

  // A real H2 under the cover's H1: the section title carries structure, not
  // just 22pt of bold type.
  const heading = new Heading('Performance at a glance');
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 22;
  heading.color = brand.primary;
  heading.margin = new Thickness(0, 0, 0, 6);
  content.add(heading);

  const intro = tb(
    `${brand.company}'s ${brand.year} results, laid out the way an annual report ` +
      'presents them: headline metrics, trend and mix charts, and an audited summary table.',
    10,
    MUTED
  );
  intro.margin = new Thickness(0, 0, 0, 18);
  content.add(intro);

  // KPI band
  const kpis = new HorizontalStack();
  kpis.widthDistribution = WidthDistribution.Weighted;
  kpis.spacing = 12;
  kpis.margin = new Thickness(0, 0, 0, 18);
  kpis.add(kpiCard('£988M', 'Total revenue', brand.primary, brand.tint), 1);
  kpis.add(kpiCard('+18%', 'Year-over-year growth', brand.accent, brand.tint), 1);
  kpis.add(kpiCard('21.4%', 'Operating margin', brand.primary, brand.tint), 1);
  content.add(kpis);

  // Full-width editorial charts. The chart implementations reserve space for
  // axes and a right-hand legend, so two half-width cards leave almost no plot
  // area and can force legend content beyond the card. Stacking mirrors real
  // annual-report layouts: one clear visual per reading row.
  const charts = new VerticalStack();
  charts.spacing = 12;
  charts.margin = new Thickness(0, 0, 0, 18);
  charts.add(chartCard('Quarterly revenue (£m)', quarterlyBarChart(brand.primary), brand.accent));
  charts.add(chartCard('Revenue by segment', segmentDonut(brand.segmentColors), brand.accent));
  content.add(charts);

  // Financial summary table
  const tableHeading = new Heading('Five-year financial summary');
  tableHeading.level = 3;
  tableHeading.fontName = StandardFonts.HelveticaBold;
  tableHeading.fontSize = 11;
  tableHeading.color = brand.accent;
  tableHeading.margin = new Thickness(0, 0, 0, 8);
  content.add(tableHeading);
  content.add(financialTable(brand.primary));

  // The cover documents use a zero margin, so inset the page ourselves.
  const inset = new Container();
  inset.padding = new Thickness(56, 48, 56, 48);
  inset.child = content;
  doc.add(inset);
}
