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
  Border,
  BorderColors,
  ColorPalette,
  SHADES,
  StandardFonts,
  Thickness,
  WidthDistribution,
  type PaletteName,
} from '@bonniepdf/core';

// Layout constants for the swatch grid. Squares are kept small so all 22 palettes
// (× 11 shades) fit on a single A4 sheet.
const BOX_HEIGHT = 28;
const H_GAP = 4;
const V_GAP = 3;
const LABEL_WIDTH = 56;

/** A single colour square for one palette/shade. */
function swatch(name: PaletteName, shade: (typeof SHADES)[number]): Container {
  const cell = new Container();
  // No fixed width: under the row's Weighted distribution the stack stretches each swatch
  // to fill the page, so the 11 boxes span the full width minus the label gutter.
  cell.height = BOX_HEIGHT;
  cell.backgroundColor = ColorPalette[name][shade];
  // A hairline border keeps the lightest shades (50) visible against the white page.
  cell.border = new Border(0.5);
  cell.borderColors = new BorderColors(ColorPalette.slate[200]);
  cell.cornerRadius = 2;
  return cell;
}

/** The left-hand row label carrying the palette name. */
function rowLabel(name: PaletteName): Container {
  const text = new TextBlock(name);
  text.fontName = StandardFonts.Helvetica;
  text.fontSize = 9;
  text.textColor = ColorPalette.slate[700];

  const box = new Container();
  box.width = LABEL_WIDTH;
  box.height = BOX_HEIGHT;
  // Nudge the label down so it sits roughly centred against the box.
  box.padding = new Thickness(0, 9, H_GAP, 0);
  box.child = text;
  return box;
}

/** A centred header cell carrying a shade number (50, 100, … 950). */
function headerCell(label: string): TextBlock {
  const text = new TextBlock(label);
  text.fontName = StandardFonts.Helvetica;
  text.fontSize = 7;
  text.textColor = ColorPalette.slate[500];
  // Centred via alignment; no wrapping Container needed — the cell it lands in
  // already stretches with its column so the number stays centred over the swatch.
  text.alignment = TextAlignment.Center;
  return text;
}

/**
 * The **class / construct-then-mutate** companion to `color-palette.ts`.
 *
 * Same Tailwind-ramp swatch grid, authored the long way: `new` each element and
 * assign properties, using `Border`/`BorderColors`, the `TextAlignment` enum,
 * `TextStyle`, `Thickness` and `ColorPalette` directly. This is the escape
 * hatch the options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `color-palette.ts` (an equivalence test binds the two). Reach for the options
 * form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 36);
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'ColorPalette Swatches';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Title ──
  const title = new TextBlock('ColorPalette');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 18;
  title.textColor = ColorPalette.slate[800];
  doc.add(title);

  const subtitle = new TextBlock(
    'Every Tailwind v4 ramp in the palette - 22 colours × 11 shades, drawn as ColorPalette[name][shade].'
  );
  subtitle.fontName = StandardFonts.Helvetica;
  subtitle.fontSize = 9;
  subtitle.textColor = ColorPalette.slate[500];
  subtitle.margin = new Thickness(0, 4, 0, 8);
  doc.add(subtitle);

  // ── Grid ──
  const grid = new VerticalStack();
  grid.spacing = V_GAP;

  // Header row: an empty gutter above the labels, then a shade number per column.
  const header = new HorizontalStack();
  // Weighted distribution: the gutter keeps its fixed width (null weight), and the 11 columns
  // share the remaining page width equally (weight 1 each).
  header.widthDistribution = WidthDistribution.Weighted;
  header.spacing = H_GAP;
  const gutter = new Container();
  gutter.width = LABEL_WIDTH;
  header.add(gutter);
  for (const shade of SHADES) {
    header.add(headerCell(String(shade)), 1);
  }
  grid.add(header);

  // One row per palette, lightest (50) on the left to darkest (950) on the right.
  const names = Object.keys(ColorPalette) as PaletteName[];
  for (const name of names) {
    const row = new HorizontalStack();
    // Fixed-width label (null weight) + 11 swatches that fill the rest equally (weight 1).
    row.widthDistribution = WidthDistribution.Weighted;
    row.spacing = H_GAP;
    row.add(rowLabel(name));
    for (const shade of SHADES) {
      row.add(swatch(name, shade), 1);
    }
    grid.add(row);
  }

  doc.add(grid);

  return doc;
}
