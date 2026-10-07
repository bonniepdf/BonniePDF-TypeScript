/**
 * Annual Report: Geometric.
 * A two-page annual report. Page 1 is a light, modern cover built from vector primitives (radial sun, translucent rotated polygons and a star via affine transforms, a photo cropped to a circular badge ringed in gold). Page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.
 * Build with generate(assets); export with await doc.generateBytesAsync().
 * The host supplies image, font, or attachment bytes through the assets map.
 */
import {
  Document,
  PdfSize,
  ColorPalette,
  Point,
  Size,
  StandardFonts,
  TextAlignment,
  CanvasElement,
  Container,
  Heading,
  ImageLoader,
  TextBlock,
  VerticalStack,
  type IElement,
  RadialGradientPaint,
  type ICanvas,
  HorizontalStack,
  Table,
  Border,
  BorderColors,
  Color,
  Thickness,
  WidthDistribution,
  ChartData,
  ChartBase,
  ChartSeries,
  ChartDataPoint,
  BarChart,
  PieChart,
} from '@bonniepdf/core';

const reportInk = ColorPalette.slate[700];

// 600, not 500: this label sits on each cover's own brand tint panel, and 500
// falls to 4.26-4.47:1 there against the 4.5:1 WCAG AA threshold.
const MUTED = ColorPalette.slate[600];

const RULE = ColorPalette.slate[200];

// ─────────────────────────────────────────────────────────────────────────────
// Annual-report front cover #3 - "Geometric badge".
//
// A light, modern cover built from vector-drawing primitives: a radial "sun" bleeding off
// the top-left corner, an abstract cluster of translucent rotated polygons and a
// star placed with affine transforms, and a circular masked image badge (a photo
// cropped to a circle - the most common "team / hero" cover crop) ringed in gold.
//
// The badge is a real photograph: the circular path is pushed as a clip and the
// image drawn over its bounding square, so the circle does the cropping.
//
// The Document/settings/metadata wrapper is authored through the
// options-object front door; the vector-drawing calls inside `drawCover`
// are the low-level drawing surface itself, with no "options vs class"
// distinction, so they are unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_IMAGE = 'images/sean-pollock-PhYq704ffdA-unsplash.jpg';

const PAGE = PdfSize.a4;

const COMPANY = 'Sample Company';
const YEAR = 2025;

const INK = ColorPalette.slate[800];
const ACCENT = ColorPalette.amber[500];

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const badgeData = assets.get(BADGE_IMAGE);
  if (!badgeData) throw new Error(`Missing required asset: ${BADGE_IMAGE}`);
  const badgeImage = ImageLoader.loadFromBytes(badgeData);

  const doc = new Document({
    settings: {
      pageSize: PAGE,
      margin: 0, // zero margin - full-bleed cover
      language: 'en-GB',
      accessibility: 'pdf/ua-1',
      // The cover artwork lives in the page-background slot. Slots are painted
      // inside an /Artifact marked-content section, so the sun, the polygons and
      // the photo badge stay out of the structure tree where decoration belongs
      // - and the cover type above flows as ordinary tagged content.
      pageBackground: (pageNumber: number): IElement | undefined =>
        pageNumber === 1
          ? new CanvasElement((canvas, size) => drawCover(canvas, size, badgeImage), {
              drawWidth: PAGE.width,
              drawHeight: PAGE.height,
              isDecorative: true,
            })
          : undefined,
    },
    metadata: {
      title: `${COMPANY} - Annual Report ${YEAR}`,
      author: COMPANY,
      subject: `${COMPANY} Annual Report ${YEAR} - geometric cover with a circular masked image (vector drawing surface)`,
    },
  });

  doc.add(coverType());

  // Page 2 - the "inside the report" capabilities spread (tables + charts + donut).
  // amber[700], not [500]: the KPI card paints this as 24pt bold text on the
  // sky-50 tile, where [500] only reaches 2.00:1 against the 3:1 large-text
  // threshold. The cover's own ACCENT (canvas fills above) is unaffected.
  addCapabilitiesPage(doc, {
    company: COMPANY,
    year: YEAR,
    primary: ColorPalette.sky[700],
    accent: ColorPalette.amber[700],
    tint: ColorPalette.sky[50],
    segmentColors: ['#0369a1', '#4f46e5', '#f59e0b', '#059669'],
  });

  return doc;
}

// Local helpers and sample types used by this document.

/** Regular polygon centred at the current origin (built in local coords). */
function addPolygon(canvas: ICanvas, cx: number, cy: number, radius: number, sides: number): void {
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) canvas.moveTo(x, y);
    else canvas.lineTo(x, y);
  }
  canvas.closePath();
}

/** Five-point star centred at (cx, cy). */
function addStar(canvas: ICanvas, cx: number, cy: number, outer: number, inner: number, points: number): void {
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / points;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) canvas.moveTo(x, y);
    else canvas.lineTo(x, y);
  }
  canvas.closePath();
}

function drawCover(canvas: ICanvas, size: Size, badgeImage: ReturnType<typeof ImageLoader.loadFromBytes>): void {
  const w = size.width;
  const h = size.height;

  // 1. Light backdrop.
  canvas.beginPath();
  canvas.addRect(0, 0, w, h);
  canvas.fillCurrentPath(ColorPalette.slate[50]);

  // 2. Radial "sun" bleeding off the top-left corner.
  canvas.beginPath();
  canvas.addCircle(30, 40, 340);
  canvas.fillCurrentPath(
    new RadialGradientPaint(new Point(30, 40), 340, [
      { offset: 0, color: ColorPalette.amber[300].withAlpha(0.7) },
      { offset: 1, color: ColorPalette.amber[300].withAlpha(0) },
    ])
  );

  // 3. Abstract geometric cluster, lower-right, placed with transforms + alpha.
  canvas.saveState();
  canvas.setGlobalAlpha(0.5);

  canvas.saveState();
  canvas.translate(w * 0.78, h * 0.7);
  canvas.rotate(18);
  canvas.beginPath();
  addPolygon(canvas, 0, 0, 120, 6);
  canvas.fillCurrentPath(ColorPalette.sky[400]);
  canvas.restoreState();

  canvas.saveState();
  canvas.translate(w * 0.62, h * 0.82);
  canvas.rotate(-12);
  canvas.beginPath();
  addPolygon(canvas, 0, 0, 90, 3);
  canvas.fillCurrentPath(ColorPalette.violet[400]);
  canvas.restoreState();

  canvas.saveState();
  canvas.translate(w * 0.86, h * 0.86);
  canvas.rotate(8);
  canvas.beginPath();
  addStar(canvas, 0, 0, 70, 30, 5);
  canvas.fillCurrentPath(ACCENT);
  canvas.restoreState();

  canvas.restoreState();

  // 4. Circular masked image badge, upper-centre.
  const bx = w * 0.5;
  const by = h * 0.36;
  const br = 96;

  canvas.saveState();
  canvas.beginPath();
  canvas.addCircle(bx, by, br);
  canvas.clipToCurrentPath();

  // The photo is drawn over the badge's bounding square; the circular clip above
  // is what crops it to the circle.
  canvas.drawImage(badgeImage, bx - br, by - br, br * 2, br * 2);

  canvas.restoreState();

  // Gold ring around the badge.
  canvas.beginPath();
  canvas.addCircle(bx, by, br);
  canvas.strokeCurrentPath({ paint: ACCENT, width: 5 });
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
      color: ColorPalette.amber[600],
      alignment: TextAlignment.Center,
    })
  );

  stack.add(
    new Heading(COMPANY, {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 44,
      lineHeight: 1,
      color: INK,
      alignment: TextAlignment.Center,
      margin: { bottom: 48 },
    })
  );

  stack.add(
    new TextBlock('Stewardship, growth, and long-term value', {
      fontSize: 13,
      color: ColorPalette.slate[500],
      alignment: TextAlignment.Center,
      // The block is anchored to the foot of the page, so this gap is what sets
      // how far the type sits below the badge: the eyebrow was clearing the gold
      // ring by about 3pt, which read as a collision.
      margin: { bottom: 240 },
    })
  );

  // slate[600], not [400]: this footer sits on the flat page background, where
  // slate[400] is 2.51:1 against the 4.5:1 WCAG AA threshold.
  stack.add(
    new TextBlock(`Prepared with BonniePDF · Fiscal Year ${YEAR}`, {
      fontSize: 10,
      color: ColorPalette.slate[600],
      alignment: TextAlignment.Center,
    })
  );

  // Anchored to the foot of the page rather than positioned by a top padding
  // measured against the font's metrics: the block keeps its footing if the
  // title wraps or a face changes.
  return new Container({
    height: PAGE.height,
    verticalAlignment: 'bottom',
    padding: { left: 56, right: 56, bottom: 48 },
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
      tb(name, 9, reportInk),
      tb(cur, 9, reportInk, false, TextAlignment.Right),
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
