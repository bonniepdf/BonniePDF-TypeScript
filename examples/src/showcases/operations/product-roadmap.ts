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
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Palette (Slate neutrals + per-team accent pairs) ─────────────────────────
const INK = Color.fromHex('#0f172a'); // slate-900  headings
const MUTE = Color.fromHex('#64748b'); // slate-500  captions
const FAINT = Color.fromHex('#94a3b8'); // slate-400  month labels
const HAIR = Color.fromHex('#e2e8f0'); // slate-200  card border + separators
const HEADBG = Color.fromHex('#f8fafc'); // slate-50   header band + future tint
const TODAY = Color.fromHex('#fb7185'); // rose-400   "today" marker line
const BADGE_BG = Color.fromHex('#eef2ff'); // indigo-50  header badge
const BADGE_TX = Color.fromHex('#4338ca'); // indigo-700 header badge text

// Each team carries a solid shade (work underway), a soft tint (planned work),
// and a dark text shade readable on the tint.
interface TeamShades {
  solid: Color;
  tint: Color;
  dark: Color;
}
const DEV: TeamShades = {
  solid: Color.fromHex('#4f46e5'), // indigo-600
  tint: Color.fromHex('#e0e7ff'), // indigo-100
  dark: Color.fromHex('#3730a3'), // indigo-800
};
const DESIGN: TeamShades = {
  solid: Color.fromHex('#0d9488'), // teal-600
  tint: Color.fromHex('#ccfbf1'), // teal-100
  dark: Color.fromHex('#115e59'), // teal-800
};
const MARKETING: TeamShades = {
  solid: Color.fromHex('#059669'), // emerald-600
  tint: Color.fromHex('#d1fae5'), // emerald-100
  dark: Color.fromHex('#065f46'), // emerald-800
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
const TODAY_AFTER_MONTH = 3; // the marker line sits on the Mar/Apr boundary
const LABEL_WEIGHT = 2.2; // left gutter width, in "month units" (months are weight 1)
const ROW_HEIGHT = 27;
const BAR_HEIGHT = 17;
const SEP = 0.6; // hairline separator width

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

// One column-slot of the timeline body. Unlike a spreadsheet grid there are no
// horizontal cell borders - only a vertical hairline on the right edge of each
// month (the "today" boundary gets a stronger rose line), and a faint tint on
// months after the today marker so the future half of the plan reads apart.
function slot(height: number, month: number | 'gutter'): Container {
  const c = new Container();
  c.height = height;
  const isGutter = month === 'gutter';
  const isLast = month === MONTHS.length;
  const isToday = month === TODAY_AFTER_MONTH;
  if (!isGutter && (month as number) > TODAY_AFTER_MONTH) c.backgroundColor = HEADBG;
  if (!isLast) {
    c.border = new Border(0, 0, isToday ? 1.2 : SEP, 0);
    c.borderColors = BorderColors.rightOnly(isToday ? TODAY : HAIR);
  }
  return c;
}

// A full-width band of column slots (gutter + six months). Used as the striped
// background behind every bar row and as the whitespace bands between team
// sections, so the month separators and today line run continuously down the
// card. Wrapped in a crisp-edge region so hairlines snap to the pixel
// grid on SVG export; the rounded bars live on a separate layer and keep their
// antialiasing.
function band(height: number): Container {
  const row = new HorizontalStack();
  row.spacing = 0;
  row.widthDistribution = WidthDistribution.Weighted;
  row.addChild(slot(height, 'gutter'), LABEL_WEIGHT);
  for (let m = 1; m <= MONTHS.length; m++) row.addChild(slot(height, m), 1);

  const crisp = new Container();
  crisp.crispEdges = true;
  crisp.child = row;
  return crisp;
}

// A rounded task pill. Work underway is a solid fill with white text; planned
// work (starting after the today marker) is the team tint with dark text, so
// status is readable at a glance without a spreadsheet of columns. No outlines:
// the fill alone carries the shape, which keeps edges clean against the grid.
function bar(label: string, team: TeamShades, planned: boolean): Container {
  const c = new Container();
  c.backgroundColor = planned ? team.tint : team.solid;
  c.cornerRadius = BAR_HEIGHT / 2;
  c.clipContent = true; // long labels mask to the pill instead of overflowing
  c.height = BAR_HEIGHT;
  c.margin = new Thickness(3, 0, 3, 0); // seam between back-to-back bars
  c.padding = new Thickness(8, 4, 8, 4);
  c.child = tb(label, 7, planned ? team.dark : Color.white, { bold: true, align: TextAlignment.Center });
  return c;
}

// The bar layer of a row: a left label of weight LABEL_WEIGHT, then the
// six-month timeline as weighted bars and *transparent* gaps (one weight = one
// month) so the column separators show through. Bars are vertically centred.
function barLayer(labelCell: IElement, segs: Seg[], team: TeamShades): HorizontalStack {
  const row = new HorizontalStack();
  row.spacing = 0;
  row.widthDistribution = WidthDistribution.Weighted;
  row.alignment = HorizontalAlignment.Center;
  row.height = ROW_HEIGHT;
  row.addChild(labelCell, LABEL_WEIGHT);

  let cursor = 1;
  for (const seg of segs) {
    if (seg.start > cursor) row.addChild(new Spacer(BAR_HEIGHT), seg.start - cursor);
    row.addChild(bar(seg.label, team, seg.start > TODAY_AFTER_MONTH), seg.end - seg.start + 1);
    cursor = seg.end + 1;
  }
  if (cursor <= MONTHS.length) row.addChild(new Spacer(BAR_HEIGHT), MONTHS.length - cursor + 1);

  return row;
}

// One roadmap row: the column band (background) with the bars floating on top
// (this feature Layers). Both layers share the same weights, so bars sit exactly over
// their month columns and the separators run continuously behind them.
function roadmapRow(labelCell: IElement, segs: Seg[], team: TeamShades): Container {
  const c = new Container();
  c.layers(l => l.background(band(ROW_HEIGHT)).primaryLayer(barLayer(labelCell, segs, team)));
  return c;
}

// Left label for the first row of a team: name + sub with a coloured rail.
function teamLabel(name: string, sub: string, accent: Color): Container {
  const v = new VerticalStack();
  v.addChild(tb(name, 9, INK, { bold: true }));
  v.addChild(tb(sub, 6.8, MUTE, { top: 2 }));
  const c = new Container();
  c.child = v;
  c.padding = new Thickness(14, 3, 8, 3);
  c.border = Border.leftOnly(2.5);
  c.borderColors = BorderColors.leftOnly(accent);
  c.margin = new Thickness(0, 0, 0, 0);
  return c;
}

// Month header band: an uppercase label centred in each column over a soft
// slate ground, closed with a single hairline. The vertical separators and the
// today line start here and continue down the body.
function monthHeader(): Container {
  const row = new HorizontalStack();
  row.spacing = 0;
  row.widthDistribution = WidthDistribution.Weighted;

  const cell = (content: IElement | null, month: number | 'gutter'): Container => {
    const c = slot(24, month);
    c.backgroundColor = HEADBG; // header ground overrides the future tint
    const bottom = c.border ?? Border.none;
    c.border = new Border(bottom.left, 0, bottom.right, 1);
    const right = c.borderColors?.right ?? HAIR;
    c.borderColors = new BorderColors(HAIR, HAIR, right, HAIR);
    if (content) {
      c.child = content;
      c.padding = new Thickness(0, 8, 0, 0);
    }
    return c;
  };

  row.addChild(cell(tb('H1 2026 TIMELINE', 6.5, FAINT, { bold: true, top: 1 }), 'gutter'), LABEL_WEIGHT);
  // Gutter caption gets left padding to align with the team labels below.
  (row.getChildren()[0] as Container).padding = new Thickness(14, 8, 0, 0);
  for (let m = 1; m <= MONTHS.length; m++) {
    row.addChild(cell(tb(MONTHS[m - 1], 8, MUTE, { bold: true, align: TextAlignment.Center }), m), 1);
  }

  const crisp = new Container();
  crisp.crispEdges = true;
  crisp.child = row;
  return crisp;
}

// A small legend dot + label pair.
function legendItem(color: Color, label: string, tinted = false): HorizontalStack {
  const dot = new Container();
  dot.width = 7;
  dot.height = 7;
  dot.cornerRadius = 3.5;
  dot.backgroundColor = color;
  dot.margin = new Thickness(0, 1, 5, 0);
  if (tinted) {
    dot.border = new Border(SEP);
    dot.borderColors = new BorderColors(FAINT);
  }
  const item = new HorizontalStack();
  item.spacing = 0;
  item.alignment = HorizontalAlignment.Center;
  item.addChild(dot);
  item.addChild(tb(label, 7.5, MUTE));
  return item;
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

  // ── Title row: heading left, period badge right ───────────────────────────
  const titleBlock = new VerticalStack();
  titleBlock.addChild(tb('Product Roadmap', 23, INK, { bold: true }));
  titleBlock.addChild(tb('Acme Platform  ·  Engineering, Design & Go-to-Market', 9.5, MUTE, { top: 5 }));

  const badge = new Container();
  badge.backgroundColor = BADGE_BG;
  badge.cornerRadius = 10;
  badge.padding = new Thickness(14, 6, 14, 6);
  badge.child = tb('H1 2026', 9, BADGE_TX, { bold: true });
  const badgeCell = new Container();
  badgeCell.horizontalAlignment = HorizontalAlignment.End;
  badgeCell.child = badge;

  const titleRow = new HorizontalStack();
  titleRow.spacing = 0;
  titleRow.widthDistribution = WidthDistribution.Weighted;
  titleRow.alignment = HorizontalAlignment.Center;
  titleRow.addChild(titleBlock, 4);
  titleRow.addChild(badgeCell, 1);
  titleRow.margin = new Thickness(0, 0, 0, 16);
  doc.add(titleRow);

  // ── Swimlane data ──────────────────────────────────────────────────────────
  interface Team {
    name: string;
    sub: string;
    shades: TeamShades;
    rows: Seg[][];
  }

  const teams: Team[] = [
    {
      name: 'DEVELOPMENT',
      sub: 'Engineering & build',
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
      name: 'DESIGN',
      sub: 'UX & visual',
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
      name: 'MARKETING',
      sub: 'GTM & launch',
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

  // ── Timeline card: one rounded frame around header + swimlanes ────────────
  // A single border on the card replaces the per-cell boxes of a spreadsheet
  // grid, so nothing double-strokes anywhere.
  const body = new VerticalStack();
  body.spacing = 0;
  body.addChild(monthHeader());
  body.addChild(band(10)); // breathing room under the header
  teams.forEach((team, ti) => {
    if (ti > 0) body.addChild(band(16)); // whitespace between sections - no rules
    team.rows.forEach((segs, ri) => {
      const label = ri === 0 ? teamLabel(team.name, team.sub, team.shades.solid) : new Container();
      body.addChild(roadmapRow(label, segs, team.shades));
    });
  });
  body.addChild(band(12)); // bottom breathing room

  const card = new Container();
  card.backgroundColor = Color.white;
  card.cornerRadius = 10;
  card.clipContent = true;
  card.border = new Border(1);
  card.borderColors = new BorderColors(HAIR);
  card.margin = new Thickness(0, 0, 0, 12);
  card.child = body;
  doc.add(card);

  // ── Footer: team legend left, status key right ─────────────────────────────
  const legend = new HorizontalStack();
  legend.spacing = 14;
  legend.alignment = HorizontalAlignment.Center;
  legend.addChild(legendItem(DEV.solid, 'Development'));
  legend.addChild(legendItem(DESIGN.solid, 'Design'));
  legend.addChild(legendItem(MARKETING.solid, 'Marketing'));

  const statusKey = new HorizontalStack();
  statusKey.spacing = 14;
  statusKey.alignment = HorizontalAlignment.Center;
  statusKey.addChild(legendItem(DEV.solid, 'Underway'));
  statusKey.addChild(legendItem(DEV.tint, 'Planned', true));
  statusKey.addChild(legendItem(TODAY, 'Today'));
  const statusCell = new Container();
  statusCell.horizontalAlignment = HorizontalAlignment.End;
  statusCell.child = statusKey;

  const footer = new HorizontalStack();
  footer.spacing = 0;
  footer.widthDistribution = WidthDistribution.Weighted;
  footer.alignment = HorizontalAlignment.Center;
  footer.addChild(legend, 1);
  footer.addChild(statusCell, 1);
  doc.add(footer);

  return doc;
}
