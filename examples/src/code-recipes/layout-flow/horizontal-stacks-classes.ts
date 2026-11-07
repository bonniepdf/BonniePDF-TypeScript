/**
 * Horizontal Stacks (Class API).
 * The same HorizontalStack tour as Horizontal Stacks, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  HorizontalStack,
  VerticalStack,
  Container,
  Heading,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  HorizontalAlignment,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `horizontal-stacks.ts`.
 *
 * Same HorizontalStack tour - equal/weighted distribution, cross-axis
 * alignment, key-value pairs, two-column text - authored the long way: `new`
 * each element and assign properties, using the `WidthDistribution` /
 * `HorizontalAlignment` enums, `Thickness`, `Color` and `ColorPalette`
 * directly. This is the escape hatch the options-object front door sits on.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `horizontal-stacks.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.margin = 40;
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Horizontal Stacks Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates horizontal stack layouts in an accessible PDF/A-2a + PDF/UA-1 document.';
  metadata.keywords = 'pdf, accessibility, layout, horizontal stack, columns, BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Horizontal Stack Layouts');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'HorizontalStack arranges child elements side-by-side. Width distribution controls how available space is divided between columns; cross-axis alignment controls how children of differing heights line up vertically. All text inside stacks is accessible to screen readers.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── Equal width distribution ──────────────────────────────────────────────

  const h2Equal = new Heading('Equal Width Distribution');
  h2Equal.tocIdentifier = 's-equal';
  h2Equal.level = 2;
  h2Equal.fontName = StandardFonts.HelveticaBold;
  h2Equal.fontSize = 14;
  h2Equal.color = ColorPalette.indigo[600];
  h2Equal.margin = new Thickness(0, 0, 0, 8);
  doc.add(h2Equal);

  const equalDesc = new TextBlock('Three columns sharing available width equally (WidthDistribution.Equal).');
  equalDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(equalDesc);

  const equalStack = new HorizontalStack();
  equalStack.spacing = 10;
  equalStack.widthDistribution = WidthDistribution.Equal;
  for (const [label, bg] of [
    ['Column 1', ColorPalette.indigo[600]],
    ['Column 2', ColorPalette.indigo[700]],
    ['Column 3', ColorPalette.indigo[900]],
  ] as [string, Color][]) {
    const t = new TextBlock(label);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 11;
    t.color = Color.white;
    const c = new Container();
    c.child = t;
    c.padding = new Thickness(12, 8, 12, 8);
    c.backgroundColor = bg;
    equalStack.add(c);
  }
  doc.add(equalStack);

  // ── Weighted distribution ─────────────────────────────────────────────────

  const h2Weighted = new Heading('Weighted Width Distribution');
  h2Weighted.tocIdentifier = 's-weighted';
  h2Weighted.level = 2;
  h2Weighted.fontName = StandardFonts.HelveticaBold;
  h2Weighted.fontSize = 14;
  h2Weighted.color = ColorPalette.indigo[600];
  h2Weighted.margin = new Thickness(0, 16, 0, 8);
  doc.add(h2Weighted);

  const weightedDesc = new TextBlock(
    'Columns with a 1:2:3 weight ratio - the second column is twice as wide as the first, and the third is three times as wide.'
  );
  weightedDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(weightedDesc);

  const weightedStack = new HorizontalStack();
  weightedStack.spacing = 10;
  weightedStack.widthDistribution = WidthDistribution.Weighted;
  for (const [label, weight, bg] of [
    ['1×', 1, ColorPalette.indigo[600]],
    ['2×', 2, ColorPalette.indigo[700]],
    ['3×', 3, ColorPalette.indigo[900]],
  ] as [string, number, Color][]) {
    const t = new TextBlock(label);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 11;
    t.color = Color.white;
    const c = new Container();
    c.child = t;
    c.padding = new Thickness(12, 8, 12, 8);
    c.backgroundColor = bg;
    weightedStack.add(c, weight);
  }
  doc.add(weightedStack);

  // ── Cross-axis (vertical) alignment ───────────────────────────────────────

  const h2Align = new Heading('Cross-Axis Alignment');
  h2Align.tocIdentifier = 's-align';
  h2Align.level = 2;
  h2Align.fontName = StandardFonts.HelveticaBold;
  h2Align.fontSize = 14;
  h2Align.color = ColorPalette.indigo[600];
  h2Align.margin = new Thickness(0, 16, 0, 8);
  doc.add(h2Align);

  const alignDesc = new TextBlock(
    'When a stack has a fixed height and its children differ in height, the stack’s alignment positions each child along the cross (vertical) axis. The same three boxes - 24pt, 42pt and 60pt tall - are shown top-aligned, centred, and bottom-aligned, side by side.'
  );
  alignDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(alignDesc);

  const boxes: [string, number, Color][] = [
    ['24pt', 24, ColorPalette.indigo[600]],
    ['42pt', 42, ColorPalette.indigo[700]],
    ['60pt', 60, ColorPalette.indigo[900]],
  ];

  // The three alignments side by side, each a captioned 60pt-tall stack of the same three boxes.
  const alignments = new HorizontalStack();
  alignments.spacing = 16;
  alignments.widthDistribution = WidthDistribution.Equal;
  alignments.margin = new Thickness(0, 0, 0, 4);
  for (const [caption, align] of [
    ['Top (Start)', HorizontalAlignment.Start],
    ['Centre (Center)', HorizontalAlignment.Center],
    ['Bottom (End)', HorizontalAlignment.End],
  ] as [string, HorizontalAlignment][]) {
    const rowCaption = new TextBlock(caption);
    rowCaption.fontName = StandardFonts.HelveticaBold;
    rowCaption.fontSize = 11;
    rowCaption.color = ColorPalette.slate[600];
    rowCaption.margin = new Thickness(0, 8, 0, 4);

    const row = new HorizontalStack();
    row.spacing = 6;
    row.widthDistribution = WidthDistribution.Equal;
    row.height = 60;
    row.alignment = align;
    for (const [label, boxHeight, bg] of boxes) {
      const t = new TextBlock(label);
      t.fontName = StandardFonts.HelveticaBold;
      t.fontSize = 10;
      t.color = Color.white;
      const c = new Container();
      c.child = t;
      c.padding = new Thickness(8, 6, 8, 6);
      c.backgroundColor = bg;
      c.height = boxHeight;
      row.add(c);
    }

    const column = new VerticalStack();
    column.add(rowCaption);
    column.add(row);
    alignments.add(column);
  }
  doc.add(alignments);

  // ── Key-value pairs ───────────────────────────────────────────────────────

  const h2Kv = new Heading('Key-Value Pairs');
  h2Kv.tocIdentifier = 's-kv';
  h2Kv.level = 2;
  h2Kv.fontName = StandardFonts.HelveticaBold;
  h2Kv.fontSize = 14;
  h2Kv.color = ColorPalette.indigo[600];
  h2Kv.margin = new Thickness(0, 16, 0, 8);
  doc.add(h2Kv);

  const kvDesc = new TextBlock(
    'A practical pattern: a narrow bold key column paired with a wider value column using weighted distribution.'
  );
  kvDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(kvDesc);

  for (const [key, value] of [
    ['Document Title:', 'Horizontal Stacks Demo'],
    ['Author:', 'BonniePDF'],
    ['Standard:', 'ISO 14289-1 (PDF/UA-1)'],
    ['Layout Engine:', 'BonniePDF Flow Layout'],
  ]) {
    const kv = new HorizontalStack();
    kv.spacing = 10;
    kv.widthDistribution = WidthDistribution.Weighted;
    kv.margin = new Thickness(0, 0, 0, 6);
    const k = new TextBlock(key);
    k.fontName = StandardFonts.HelveticaBold;
    k.color = ColorPalette.slate[700];
    const v = new TextBlock(value);
    v.color = ColorPalette.slate[800];
    kv.add(k, 1);
    kv.add(v, 3);
    doc.add(kv);
  }

  // ── Two-column text ───────────────────────────────────────────────────────

  const h2TwoCols = new Heading('Two-Column Text Layout');
  h2TwoCols.tocIdentifier = 's-twocol';
  h2TwoCols.level = 2;
  h2TwoCols.fontName = StandardFonts.HelveticaBold;
  h2TwoCols.fontSize = 14;
  h2TwoCols.color = ColorPalette.indigo[600];
  h2TwoCols.margin = new Thickness(0, 16, 0, 8);
  doc.add(h2TwoCols);

  const twoColDesc = new TextBlock(
    'A newspaper-style two-column layout achieved with an equal-weight HorizontalStack containing two TextBlocks.'
  );
  twoColDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(twoColDesc);

  const twoColStack = new HorizontalStack();
  twoColStack.spacing = 20;
  twoColStack.widthDistribution = WidthDistribution.Equal;

  const col1 = new TextBlock(
    'The first column contains flowing prose that demonstrates how text wraps within a constrained width. ' +
      'Text inside each column wraps independently, giving a true two-column reading experience.'
  );
  const col2 = new TextBlock(
    'The second column runs in parallel with the first. This pattern is commonly used for newsletters, ' +
      'product sheets, and comparison tables where parallel content aids comprehension.'
  );
  twoColStack.add(col1);
  twoColStack.add(col2);
  doc.add(twoColStack);

  return doc;
}
