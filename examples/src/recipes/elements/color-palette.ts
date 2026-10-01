import {
  Document,
  TextBlock,
  HorizontalStack,
  VerticalStack,
  Container,
  ColorPalette,
  SHADES,
  StandardFonts,
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
  // No fixed width: under the row's weighted distribution the stack stretches each
  // swatch to fill the page, so the 11 boxes span the full width minus the label
  // gutter. A hairline border keeps the lightest shades (50) visible on white.
  return new Container({
    height: BOX_HEIGHT,
    backgroundColor: ColorPalette[name][shade],
    border: { width: 0.5, color: 'slate-200' },
    cornerRadius: 2,
  });
}

/** The left-hand row label carrying the palette name. */
function rowLabel(name: PaletteName): Container {
  return new Container({
    width: LABEL_WIDTH,
    height: BOX_HEIGHT,
    // Nudge the label down so it sits roughly centred against the box.
    padding: { top: 9, right: H_GAP },
    child: new TextBlock(name, { fontName: StandardFonts.Helvetica, fontSize: 9, color: 'slate-700' }),
  });
}

/** A centred header cell carrying a shade number (50, 100, … 950). */
function headerCell(label: string): TextBlock {
  // Centred via alignment; no wrapping Container needed — the cell it lands in
  // already stretches with its column so the number stays centred over the swatch.
  return new TextBlock(label, {
    fontName: StandardFonts.Helvetica,
    fontSize: 7,
    color: 'slate-500',
    alignment: 'center',
  });
}

/** The header row: a fixed-width gutter above the labels, then a shade number per column. */
function headerRow(): HorizontalStack {
  // Weighted distribution: the gutter keeps its fixed width (null weight), and the
  // 11 columns share the remaining page width equally (weight 1 each).
  const header = new HorizontalStack({ widthDistribution: 'weighted', spacing: H_GAP });
  header.add(new Container({ width: LABEL_WIDTH }));
  for (const shade of SHADES) header.add(headerCell(String(shade)), 1);
  return header;
}

/** One palette row: a fixed-width label, then 11 swatches that fill the rest equally. */
function paletteRow(name: PaletteName): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: H_GAP });
  row.add(rowLabel(name));
  for (const shade of SHADES) row.add(swatch(name, shade), 1);
  return row;
}

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 36,
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
    },
    metadata: {
      title: 'ColorPalette Swatches',
      author: 'BonniePDF',
    },
  });

  // ── Title ──
  doc.add(new TextBlock('ColorPalette', { fontName: StandardFonts.HelveticaBold, fontSize: 18, color: 'slate-800' }));

  doc.add(
    new TextBlock(
      'Every Tailwind v4 ramp in the palette - 22 colours × 11 shades, drawn as ColorPalette[name][shade].',
      { fontName: StandardFonts.Helvetica, fontSize: 9, color: 'slate-500', margin: { top: 4, bottom: 8 } }
    )
  );

  // ── Grid ── one row per palette, lightest (50) on the left to darkest (950) on the right.
  const names = Object.keys(ColorPalette) as PaletteName[];
  doc.add(
    new VerticalStack({
      spacing: V_GAP,
      children: [headerRow(), ...names.map(paletteRow)],
    })
  );

  return doc;
}
