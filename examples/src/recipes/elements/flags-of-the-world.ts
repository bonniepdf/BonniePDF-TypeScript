import {
  Document,
  Heading,
  TextBlock,
  Container,
  VerticalStack,
  Grid,
  Svg,
  PageBreak,
  StandardFonts,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

/**
 * SVG import - twelve national flags drawn as vector content, from a handful of
 * shapes to a coat of arms of hundreds of paths and gradients, authored through
 * the options-object front door. PDF/A-2a + PDF/UA-1: every flag carries alt
 * text. Nothing here is a bitmap, so the flag on the second page stays sharp at
 * any zoom.
 *
 * The flags are SVG files loaded as assets (see {@link FLAGS}); `Svg` takes the
 * markup as a string.
 */
export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 10, color: 'slate-700' },
    },
    metadata: {
      title: 'Flags of the World',
      author: 'BonniePDF',
      subject: 'SVG import - twelve national flags drawn as vector content, one shown at full page width.',
      keywords: 'pdf, pdf/ua, pdf/a, accessibility, svg, vector, flags, figure, alt-text',
    },
  });

  // ── Page 1: the grid ──────────────────────────────────────────────────────────

  doc.add(
    new Heading('Flags of the World', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock(
      'Each flag below is an SVG file imported as vector content: paths, fills and gradients become native PDF ' +
        'drawing operations. The set runs from Iceland and Colombia, a few shapes each, to South Georgia, whose ' +
        'coat of arms carries eight gradients.',
      { margin: { bottom: 12 } }
    )
  );

  const grid = new Grid({ columns: [1, 1, 1], cellPadding: 6, border: 0 });
  for (let i = 0; i < FLAGS.length; i += COLUMNS) {
    grid.addRow(...FLAGS.slice(i, i + COLUMNS).map(flag => flagCard(flag, assets)));
  }
  doc.add(grid);

  // ── Page 2: one flag at page width ────────────────────────────────────────────

  doc.add(new PageBreak());

  doc.add(
    new Heading('Mexico at Full Width', {
      tocIdentifier: 's-full-width',
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      color: 'indigo-600',
      margin: { bottom: 6 },
    })
  );

  doc.add(
    new TextBlock(
      'The flag of Mexico is 356 paths and four gradients. Zoom in: the eagle, the serpent and every feather stay ' +
        'crisp at any scale.',
      { color: 'slate-500', margin: { bottom: 10 } }
    )
  );

  doc.add(new Svg({ svgData: flagMarkup(FLAGS[0], assets), width: PAGE_CONTENT_WIDTH, altText: altText(FLAGS[0]) }));

  // ── Credits ───────────────────────────────────────────────────────────────────

  doc.add(
    new Heading('Credits', {
      tocIdentifier: 's-credits',
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      color: 'indigo-600',
      margin: { top: 16, bottom: 6 },
    })
  );

  doc.add(
    new TextBlock('Flag artwork: flag-icons 7.2.3 (MIT licence), https://github.com/lipis/flag-icons.', {
      fontSize: 9,
      color: 'slate-500',
    })
  );

  return doc;
}

/** A flag's `flag-icons` country code and its display name. Mexico first: it is the full-width flag. */
interface Flag {
  readonly code: string;
  readonly name: string;
}

const FLAGS: readonly Flag[] = [
  { code: 'mx', name: 'Mexico' },
  { code: 'gs', name: 'South Georgia' },
  { code: 'es', name: 'Spain' },
  { code: 'pt', name: 'Portugal' },
  { code: 'gr', name: 'Greece' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'hk', name: 'Hong Kong' },
  { code: 'kz', name: 'Kazakhstan' },
  { code: 'co', name: 'Colombia' },
  { code: 'is', name: 'Iceland' },
  { code: 'lb', name: 'Lebanon' },
  { code: 'my', name: 'Malaysia' },
];

const COLUMNS = 3;

/** Width of a flag in the grid, in points: a third of the page less cell padding, card padding and border. */
const CARD_FLAG_WIDTH = 140;

/** A4 (595 pt) less the default 40 pt margins. */
const PAGE_CONTENT_WIDTH = 515;

function altText(flag: Flag): string {
  return `Flag of ${flag.name}`;
}

/** Reads a flag's SVG markup from the asset map, failing loudly if it was not pre-loaded. */
function flagMarkup(flag: Flag, assets: ReadonlyMap<string, Uint8Array>): string {
  const bytes = assets.get(`flags/4x3/${flag.code}.svg`);
  if (bytes === undefined) throw new Error(`Missing required asset: flags/4x3/${flag.code}.svg`);
  return new TextDecoder().decode(bytes);
}

/** A bordered card holding a flag and its name. */
function flagCard(flag: Flag, assets: ReadonlyMap<string, Uint8Array>): IElement {
  return new Container({
    padding: 8,
    border: { width: 0.75, color: 'slate-300' },
    cornerRadius: 4,
    child: new VerticalStack({
      spacing: 4,
      children: [
        new Svg({ svgData: flagMarkup(flag, assets), width: CARD_FLAG_WIDTH, altText: altText(flag) }),
        new TextBlock(flag.name, { fontSize: 9, color: 'slate-600', alignment: 'center' }),
      ],
    }),
  });
}
