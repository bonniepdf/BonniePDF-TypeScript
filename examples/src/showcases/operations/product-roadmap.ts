// Product Roadmap
//
// Landscape A4 Gantt-style product roadmap: a six-month timeline header over
// team swimlanes (Development, Design, Marketing), with rounded task bars
// positioned by month using weighted horizontal stacks. Authored through the
// options-object front door.

import {
  Document,
  TextBlock,
  VerticalStack,
  HorizontalStack,
  Container,
  Spacer,
  Color,
  Border,
  BorderColors,
  StandardFonts,
  type ColorInput,
  type TextAlignmentInput,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

// ── Palette (Slate neutrals + per-team accent pairs) ─────────────────────────
const INK = '#0f172a'; // slate-900  headings
const MUTE = '#64748b'; // slate-500  captions
// Raw `Color` instances (not string tokens): these three feed the
// `BorderColors`/`Border` class constructors directly for per-side colours
// options sugar can't express (a single `border.color` applies to every side
// named), so they need the canonical `Color` type those constructors expect.
const FAINT = Color.fromHex('#94a3b8'); // slate-400  month labels
const HAIR = Color.fromHex('#e2e8f0'); // slate-200  card border + separators
const HEADBG = '#f8fafc'; // slate-50   header band + future tint
const TODAY = Color.fromHex('#fb7185'); // rose-400   "today" marker line
const BADGE_BG = '#eef2ff'; // indigo-50  header badge
const BADGE_TX = '#4338ca'; // indigo-700 header badge text

// Each team carries a solid shade (work underway), a soft tint (planned work),
// and a dark text shade readable on the tint.
interface TeamShades {
  solid: ColorInput;
  tint: ColorInput;
  dark: ColorInput;
}
const DEV: TeamShades = { solid: '#4f46e5', tint: '#e0e7ff', dark: '#3730a3' }; // indigo 600/100/800
const DESIGN: TeamShades = { solid: '#0d9488', tint: '#ccfbf1', dark: '#115e59' }; // teal 600/100/800
const MARKETING: TeamShades = { solid: '#059669', tint: '#d1fae5', dark: '#065f46' }; // emerald 600/100/800

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
  color: ColorInput,
  opts: { bold?: boolean; align?: TextAlignmentInput; top?: number } = {}
): TextBlock {
  return new TextBlock(content, {
    fontName: opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: size,
    textColor: color,
    alignment: opts.align,
    margin: opts.top ? { top: opts.top } : undefined,
  });
}

// One column-slot of the timeline body. Unlike a spreadsheet grid there are no
// horizontal cell borders - only a vertical hairline on the right edge of each
// month (the "today" boundary gets a stronger rose line), and a faint tint on
// months after the today marker so the future half of the plan reads apart.
function slot(height: number, month: number | 'gutter'): Container {
  const isGutter = month === 'gutter';
  const isLast = month === MONTHS.length;
  const isToday = month === TODAY_AFTER_MONTH;
  return new Container({
    height,
    backgroundColor: !isGutter && (month as number) > TODAY_AFTER_MONTH ? HEADBG : undefined,
    border: isLast ? undefined : new Border(0, 0, isToday ? 1.2 : SEP, 0),
    borderColors: isLast ? undefined : BorderColors.rightOnly(isToday ? TODAY : HAIR),
  });
}

// A full-width band of column slots (gutter + six months). Used as the striped
// background behind every bar row and as the whitespace bands between team
// sections, so the month separators and today line run continuously down the
// card. Wrapped in a crisp-edge region so hairlines snap to the pixel
// grid on SVG export; the rounded bars live on a separate layer and keep their
// antialiasing.
function band(height: number): Container {
  const row = new HorizontalStack({ spacing: 0, widthDistribution: 'weighted' });
  row.add(slot(height, 'gutter'), LABEL_WEIGHT);
  for (let m = 1; m <= MONTHS.length; m++) row.add(slot(height, m), 1);

  return new Container({ crispEdges: true, child: row });
}

// A rounded task pill. Work underway is a solid fill with white text; planned
// work (starting after the today marker) is the team tint with dark text, so
// status is readable at a glance without a spreadsheet of columns. No outlines:
// the fill alone carries the shape, which keeps edges clean against the grid.
function bar(label: string, team: TeamShades, planned: boolean): Container {
  return new Container({
    backgroundColor: planned ? team.tint : team.solid,
    cornerRadius: BAR_HEIGHT / 2,
    clipContent: true, // long labels mask to the pill instead of overflowing
    height: BAR_HEIGHT,
    margin: { left: 3, right: 3 }, // seam between back-to-back bars
    padding: [8, 4],
    child: tb(label, 7, planned ? team.dark : '#ffffff', { bold: true, align: 'center' }),
  });
}

// The bar layer of a row: a left label of weight LABEL_WEIGHT, then the
// six-month timeline as weighted bars and *transparent* gaps (one weight = one
// month) so the column separators show through. Bars are vertically centred.
function barLayer(labelCell: IElement, segs: Seg[], team: TeamShades): HorizontalStack {
  const row = new HorizontalStack({
    spacing: 0,
    widthDistribution: 'weighted',
    alignment: 'center',
    height: ROW_HEIGHT,
  });
  row.add(labelCell, LABEL_WEIGHT);

  let cursor = 1;
  for (const seg of segs) {
    if (seg.start > cursor) row.add(new Spacer(BAR_HEIGHT), seg.start - cursor);
    row.add(bar(seg.label, team, seg.start > TODAY_AFTER_MONTH), seg.end - seg.start + 1);
    cursor = seg.end + 1;
  }
  if (cursor <= MONTHS.length) row.add(new Spacer(BAR_HEIGHT), MONTHS.length - cursor + 1);

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
function teamLabel(name: string, sub: string, accent: ColorInput): Container {
  return new Container({
    padding: [14, 3, 8, 3],
    border: { left: 2.5, color: accent },
    child: new VerticalStack({ children: [tb(name, 9, INK, { bold: true }), tb(sub, 6.8, MUTE, { top: 2 })] }),
  });
}

// Month header band: an uppercase label centred in each column over a soft
// slate ground, closed with a single hairline. The vertical separators and the
// today line start here and continue down the body.
function monthHeader(): Container {
  const row = new HorizontalStack({ spacing: 0, widthDistribution: 'weighted' });

  const cell = (content: IElement | null, month: number | 'gutter'): Container => {
    const isLast = month === MONTHS.length;
    const isToday = month === TODAY_AFTER_MONTH;
    return new Container({
      height: 24,
      backgroundColor: HEADBG, // header ground overrides the future tint
      border: new Border(0, 0, isLast ? 0 : isToday ? 1.2 : SEP, 1),
      borderColors: new BorderColors(HAIR, HAIR, isToday ? TODAY : HAIR, HAIR),
      padding: content ? { top: 8 } : undefined,
      child: content ?? undefined,
    });
  };

  row.add(cell(tb('H1 2026 TIMELINE', 6.5, FAINT, { bold: true, top: 1 }), 'gutter'), LABEL_WEIGHT);
  // Gutter caption gets left padding to align with the team labels below.
  (row.getChildren()[0] as Container).padding = { left: 14, top: 8 };
  for (let m = 1; m <= MONTHS.length; m++) {
    row.add(cell(tb(MONTHS[m - 1], 8, MUTE, { bold: true, align: 'center' }), m), 1);
  }

  return new Container({ crispEdges: true, child: row });
}

// A small legend dot + label pair.
function legendItem(color: ColorInput, label: string, tinted = false): HorizontalStack {
  const dot = new Container({
    width: 7,
    height: 7,
    cornerRadius: 3.5,
    backgroundColor: color,
    margin: { top: 1, right: 5 },
    border: tinted ? SEP : undefined,
    borderColors: tinted ? new BorderColors(FAINT) : undefined,
  });
  return new HorizontalStack({ spacing: 0, alignment: 'center', children: [dot, tb(label, 7.5, MUTE)] });
}

export function generate(): Document {
  const doc = new Document({
    settings: {
      // Landscape A4 with a comfortable margin; rows carry their own structure.
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 38,
      language: 'en-GB',
    },
    metadata: {
      title: 'Product Roadmap',
      author: 'Sample Platform',
      subject: 'H1 2026 product roadmap - swimlanes by team across a six-month timeline',
    },
  });

  // ── Title row: heading left, period badge right ───────────────────────────
  const titleBlock = new VerticalStack({
    children: [
      tb('Product Roadmap', 23, INK, { bold: true }),
      tb('Sample Platform  ·  Engineering, Design & Go-to-Market', 9.5, MUTE, { top: 5 }),
    ],
  });

  const badgeCell = new Container({
    horizontalAlignment: 'end',
    child: new Container({
      backgroundColor: BADGE_BG,
      cornerRadius: 10,
      padding: [14, 6],
      child: tb('H1 2026', 9, BADGE_TX, { bold: true }),
    }),
  });

  const titleRow = new HorizontalStack({
    spacing: 0,
    widthDistribution: 'weighted',
    alignment: 'center',
    margin: { bottom: 16 },
  });
  titleRow.add(titleBlock, 4);
  titleRow.add(badgeCell, 1);
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
  const body = new VerticalStack({ spacing: 0 });
  body.add(monthHeader());
  body.add(band(10)); // breathing room under the header
  teams.forEach((team, ti) => {
    if (ti > 0) body.add(band(16)); // whitespace between sections - no rules
    team.rows.forEach((segs, ri) => {
      const label = ri === 0 ? teamLabel(team.name, team.sub, team.shades.solid) : new Container();
      body.add(roadmapRow(label, segs, team.shades));
    });
  });
  body.add(band(12)); // bottom breathing room

  doc.add(
    new Container({
      backgroundColor: '#ffffff',
      cornerRadius: 10,
      clipContent: true,
      border: { width: 1, color: HAIR },
      margin: { bottom: 12 },
      child: body,
    })
  );

  // ── Footer: team legend left, status key right ─────────────────────────────
  const legend = new HorizontalStack({
    spacing: 14,
    alignment: 'center',
    children: [
      legendItem(DEV.solid, 'Development'),
      legendItem(DESIGN.solid, 'Design'),
      legendItem(MARKETING.solid, 'Marketing'),
    ],
  });

  const statusCell = new Container({
    horizontalAlignment: 'end',
    child: new HorizontalStack({
      spacing: 14,
      alignment: 'center',
      children: [legendItem(DEV.solid, 'Underway'), legendItem(DEV.tint, 'Planned', true), legendItem(TODAY, 'Today')],
    }),
  });

  const footer = new HorizontalStack({ spacing: 0, widthDistribution: 'weighted', alignment: 'center' });
  footer.add(legend, 1);
  footer.add(statusCell, 1);
  doc.add(footer);

  return doc;
}
