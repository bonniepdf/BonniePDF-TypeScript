import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfAConformance,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  Container,
  VerticalStack,
  Grid,
  Svg,
  PageBreak,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
} from '@bonniepdf/core';
import type { IElement } from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `flags-of-the-world.ts`.
 *
 * Same twelve-flag SVG tour, authored the long way: `new Svg()` then assign
 * properties, using `TextStyle`, `Border`/`BorderColors`, `Thickness`,
 * `TextAlignment` and `ColorPalette` directly. This is the escape hatch the
 * options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `flags-of-the-world.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(10).withColor(ColorPalette.slate[700]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Flags of the World';
  metadata.author = 'BonniePDF';
  metadata.subject = 'SVG import - twelve national flags drawn as vector content, one shown at full page width.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, accessibility, svg, vector, flags, figure, alt-text';

  const doc = new Document(settings, metadata);

  // ── Page 1: the grid ──────────────────────────────────────────────────────────

  const h1 = new Heading('Flags of the World');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 8);
  doc.add(h1);

  const intro = new TextBlock(
    'Each flag below is an SVG file imported as vector content: paths, fills and gradients become native PDF ' +
      'drawing operations. The set runs from Iceland and Colombia, a few shapes each, to South Georgia, whose ' +
      'coat of arms carries eight gradients.'
  );
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  const grid = new Grid(1, 1, 1);
  grid.cellPadding = 6;
  grid.border = Border.none;
  for (let i = 0; i < FLAGS.length; i += COLUMNS) {
    grid.addRow(...FLAGS.slice(i, i + COLUMNS).map(flag => flagCard(flag, assets)));
  }
  doc.add(grid);

  // ── Page 2: one flag at page width ────────────────────────────────────────────

  doc.add(new PageBreak());

  const h2Full = new Heading('Mexico at Full Width');
  h2Full.tocIdentifier = 's-full-width';
  h2Full.level = 2;
  h2Full.fontName = StandardFonts.HelveticaBold;
  h2Full.fontSize = 15;
  h2Full.color = ColorPalette.indigo[600];
  h2Full.margin = new Thickness(0, 0, 0, 6);
  doc.add(h2Full);

  const fullIntro = new TextBlock(
    'The flag of Mexico is 356 paths and four gradients. Zoom in: the eagle, the serpent and every feather stay ' +
      'crisp at any scale.'
  );
  fullIntro.color = ColorPalette.slate[500];
  fullIntro.margin = new Thickness(0, 0, 0, 10);
  doc.add(fullIntro);

  const mexico = new Svg();
  mexico.svgData = flagMarkup(FLAGS[0], assets);
  mexico.width = PAGE_CONTENT_WIDTH;
  mexico.altText = altText(FLAGS[0]);
  doc.add(mexico);

  // ── Credits ───────────────────────────────────────────────────────────────────

  const h2Credits = new Heading('Credits');
  h2Credits.tocIdentifier = 's-credits';
  h2Credits.level = 2;
  h2Credits.fontName = StandardFonts.HelveticaBold;
  h2Credits.fontSize = 15;
  h2Credits.color = ColorPalette.indigo[600];
  h2Credits.margin = new Thickness(0, 16, 0, 6);
  doc.add(h2Credits);

  const credit = new TextBlock('Flag artwork: flag-icons 7.2.3 (MIT licence), https://github.com/lipis/flag-icons.');
  credit.fontSize = 9;
  credit.color = ColorPalette.slate[500];
  doc.add(credit);

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
  const svg = new Svg();
  svg.svgData = flagMarkup(flag, assets);
  svg.width = CARD_FLAG_WIDTH;
  svg.altText = altText(flag);

  const name = new TextBlock(flag.name);
  name.fontSize = 9;
  name.color = ColorPalette.slate[600];
  name.alignment = TextAlignment.Center;

  const stack = new VerticalStack();
  stack.spacing = 4;
  stack.add(svg);
  stack.add(name);

  const card = new Container();
  card.padding = new Thickness(8);
  card.border = new Border(0.75);
  card.borderColors = new BorderColors(ColorPalette.slate[300]);
  card.cornerRadius = 4;
  card.child = stack;
  return card;
}
