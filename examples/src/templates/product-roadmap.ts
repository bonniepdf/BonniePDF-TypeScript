import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PageOrientation,
  TextBlock,
  TextAlignment,
  VerticalStack,
  HorizontalStack,
  WidthDistribution,
  HorizontalAlignment,
  Container,
  Spacer,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  IElement,
} from '@bonniepdf/core';

// ── Palette (Slate neutrals + per-team accent ramps) ─────────────────────────
const INK = Color.fromHex('#0f172a'); // slate-900  headings
const BODY = Color.fromHex('#334155'); // slate-700  month pills
const MUTE = Color.fromHex('#64748b'); // slate-500  captions
const STRIPE = Color.fromHex('#f1f5f9'); // slate-100  alternating column shade
const TINT = Color.fromHex('#f8fafc'); // slate-50   page tint

// Each team gets a two-shade accent so adjacent bars read apart, like the
// reference roadmap. [dark, light].
const DEV: [Color, Color] = [Color.fromHex('#4f46e5'), Color.fromHex('#818cf8')]; // indigo
const DESIGN: [Color, Color] = [Color.fromHex('#0d9488'), Color.fromHex('#2dd4bf')]; // teal
const MARKETING: [Color, Color] = [Color.fromHex('#059669'), Color.fromHex('#34d399')]; // emerald

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const LABEL_WEIGHT = 2.4; // left column width, in "month units" (months are weight 1)
const ROW_HEIGHT = 26;
const BAR_HEIGHT = 18;

// ── A timeline segment: a bar from month `start` to month `end` (1..6) ───────
interface Seg {
  start: number;
  end: number;
  label: string;
}

// ── Tiny text helper ─────────────────────────────────────────────────────────
function tb(
  content: string,
  size: number,
  color: Color,
  opts: { bold?: boolean; align?: TextAlignment; top?: number } = {}
): TextBlock {
  const t = new TextBlock(content);
  t.fontName = opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  t.fontSize = size;
  t.textColor = color;
  if (opts.align !== undefined) t.alignment = opts.align;
  if (opts.top) t.margin = new Thickness(0, opts.top, 0, 0);
  return t;
}

// A fixed-height cell with an optional background, used to build the striped
// column grid behind the bars.
function cell(height: number, color?: Color): Container {
  const c = new Container();
  c.height = height;
  if (color) c.backgroundColor = color;
  return c;
}

// The alternating-column grid: a white label gutter, then six month columns
// shaded on alternate months. Used both as the per-row background (behind the
// bars) and as the slim band drawn between swimlanes, so the columns read as one
// continuous grid. Same weights as a bar row, so the stripes line up under the
// month header and behind every bar.
function stripeBand(height: number): HorizontalStack {
  const band = new HorizontalStack();
  band.spacing = 0;
  band.widthDistribution = WidthDistribution.Weighted;
  band.addChild(cell(height), LABEL_WEIGHT); // label gutter stays white
  for (let m = 1; m <= MONTHS.length; m++) band.addChild(cell(height, m % 2 === 0 ? STRIPE : undefined), 1);
  return band;
}

// A rounded "pill" bar carrying a short task label. Uses clipContent so a
// label that runs longer than its month span is masked to the rounded bar rather
// than overflowing.
function bar(label: string, color: Color): Container {
  const c = new Container();
  c.backgroundColor = color;
  c.cornerRadius = 5;
  c.clipContent = true;
  c.height = BAR_HEIGHT;
  c.padding = new Thickness(8, 4, 8, 4);
  c.child = tb(label, 6.5, Color.white, { bold: true, align: TextAlignment.Center });
  return c;
}

// The bar layer of a row: a left label of weight LABEL_WEIGHT, then the six-month
// timeline as weighted bars and *transparent* gaps (one weight = one month) so
// the striped grid shows through. Bars are vertically centred in the row.
function barLayer(labelCell: IElement, segs: Seg[], shades: [Color, Color]): HorizontalStack {
  const row = new HorizontalStack();
  row.spacing = 0;
  row.widthDistribution = WidthDistribution.Weighted;
  row.alignment = HorizontalAlignment.Center;
  row.height = ROW_HEIGHT;
  row.addChild(labelCell, LABEL_WEIGHT);

  let cursor = 1;
  segs.forEach((seg, i) => {
    if (seg.start > cursor) row.addChild(new Spacer(BAR_HEIGHT), seg.start - cursor);
    row.addChild(bar(seg.label, shades[i % 2]), seg.end - seg.start + 1);
    cursor = seg.end + 1;
  });
  if (cursor <= MONTHS.length) row.addChild(new Spacer(BAR_HEIGHT), MONTHS.length - cursor + 1);

  return row;
}

// One roadmap row: the striped column grid (background) with the bars floating on
// top (this feature Layers). Both layers share the same weights, so the bars sit exactly
// over their month columns and the stripes run continuously behind them.
function roadmapRow(labelCell: IElement, segs: Seg[], shades: [Color, Color]): Container {
  const c = new Container();
  c.layers(l => l.background(stripeBand(ROW_HEIGHT)).primaryLayer(barLayer(labelCell, segs, shades)));
  return c;
}

// Left label for the first row of a team: name + sub with a coloured left rail.
function teamLabel(name: string, sub: string, accent: Color): Container {
  const v = new VerticalStack();
  v.addChild(tb(name, 9, INK, { bold: true }));
  v.addChild(tb(sub, 7, MUTE, { top: 2 }));
  const c = new Container();
  c.child = v;
  c.padding = new Thickness(10, 3, 8, 3);
  c.border = Border.leftOnly(3);
  c.borderColors = BorderColors.leftOnly(accent);
  return c;
}

// A dark month "bubble" centred in its column.
function monthCell(name: string): Container {
  const pill = new Container();
  pill.backgroundColor = BODY;
  pill.cornerRadius = 9;
  pill.padding = new Thickness(12, 4, 12, 4);
  pill.child = tb(name, 8, Color.white, { bold: true, align: TextAlignment.Center });

  const cellWrap = new Container();
  cellWrap.horizontalAlignment = HorizontalAlignment.Center;
  cellWrap.child = pill;
  return cellWrap;
}

export function generate(): Document {
  // Landscape A4 with a comfortable margin; rows carry their own structure.
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 38);
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = 'Product Roadmap';
  metadata.author = 'Acme Platform';
  metadata.subject = 'H1 2026 product roadmap - swimlanes by team across a six-month timeline';

  const doc = new Document(settings, metadata);

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.add(tb('Product Roadmap', 22, INK, { bold: true }));
  doc.add(tb('H1 2026  ·  Acme Platform', 10, MUTE, { top: 4 }));
  doc.add(new Spacer(16));

  // ── Month header (project block + six month bubbles) ──────────────────────
  const project = new VerticalStack();
  project.addChild(tb('PROJECT TITLE HERE', 9, INK, { bold: true }));
  project.addChild(tb('Sample Text Here', 7, MUTE, { top: 2 }));
  const projectCell = new Container();
  projectCell.child = project;
  projectCell.padding = new Thickness(0, 3, 8, 3);

  const headerRow = new HorizontalStack();
  headerRow.spacing = 0;
  headerRow.widthDistribution = WidthDistribution.Weighted;
  headerRow.alignment = HorizontalAlignment.Center;
  headerRow.addChild(projectCell, LABEL_WEIGHT);
  for (const m of MONTHS) headerRow.addChild(monthCell(m), 1);
  doc.add(headerRow);

  doc.add(new Spacer(8));

  // ── Swimlanes ─────────────────────────────────────────────────────────────
  interface Team {
    name: string;
    sub: string;
    accent: Color;
    shades: [Color, Color];
    rows: Seg[][];
  }

  const teams: Team[] = [
    {
      name: 'DEVELOPMENT TEAM',
      sub: 'Engineering & build',
      accent: DEV[0],
      shades: DEV,
      rows: [
        [
          { start: 1, end: 2, label: 'Discovery' },
          { start: 3, end: 4, label: 'Prototype' },
        ],
        [
          { start: 3, end: 3, label: 'Spike' },
          { start: 4, end: 6, label: 'Build & QA' },
        ],
      ],
    },
    {
      name: 'DESIGN TEAM',
      sub: 'UX & visual',
      accent: DESIGN[0],
      shades: DESIGN,
      rows: [
        [
          { start: 2, end: 3, label: 'Wireframes' },
          { start: 4, end: 5, label: 'UI Kit' },
        ],
        [{ start: 5, end: 6, label: 'Handoff' }],
      ],
    },
    {
      name: 'MARKETING TEAM',
      sub: 'GTM & launch',
      accent: MARKETING[0],
      shades: MARKETING,
      rows: [
        [
          { start: 3, end: 4, label: 'Positioning' },
          { start: 5, end: 6, label: 'Campaign' },
        ],
        [
          { start: 4, end: 4, label: 'Assets' },
          { start: 6, end: 6, label: 'Launch' },
        ],
      ],
    },
  ];

  teams.forEach((team, ti) => {
    if (ti > 0) doc.add(stripeBand(12)); // continuous striped band between swimlanes
    team.rows.forEach((segs, ri) => {
      const label = ri === 0 ? teamLabel(team.name, team.sub, team.accent) : new Container();
      doc.add(roadmapRow(label, segs, team.shades));
    });
  });

  // Light page tint flooding the remaining height.
  const fill = new Container();
  fill.backgroundColor = TINT;
  fill.child = new Spacer(8);
  doc.add(fill);

  return doc;
}
