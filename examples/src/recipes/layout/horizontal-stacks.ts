import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  HorizontalStack,
  Container,
  Heading,
  PageBreak,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  HorizontalAlignment,
  PdfAConformance,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
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
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'HorizontalStack arranges child elements side-by-side. Width distribution controls how available space is divided between columns; cross-axis alignment controls how children of differing heights line up vertically. All text inside stacks is part of the normal structure tree.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── Equal width distribution ──────────────────────────────────────────────

  const h2Equal = new Heading('Equal Width Distribution');
  h2Equal.tocIdentifier = 's-equal';
  h2Equal.level = 2;
  h2Equal.fontName = StandardFonts.HelveticaBold;
  h2Equal.fontSize = 14;
  h2Equal.textColor = ColorPalette.indigo[600];
  h2Equal.margin = new Thickness(0, 0, 0, 8);
  doc.add(h2Equal);

  const equalDesc = new TextBlock('Three columns sharing available width equally (WidthDistribution.Equal).');
  equalDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(equalDesc);

  const equalStack = new HorizontalStack();
  equalStack.spacing = 10;
  equalStack.widthDistribution = WidthDistribution.Equal;
  for (const [label, bg] of [
    ['Column 1', ColorPalette.blue[600]],
    ['Column 2', ColorPalette.indigo[600]],
    ['Column 3', ColorPalette.slate[600]],
  ] as [string, Color][]) {
    const t = new TextBlock(label);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 11;
    t.textColor = Color.white;
    const c = new Container();
    c.child = t;
    c.padding = new Thickness(12, 8, 12, 8);
    c.backgroundColor = bg;
    equalStack.addChild(c);
  }
  doc.add(equalStack);

  // ── Weighted distribution ─────────────────────────────────────────────────

  const h2Weighted = new Heading('Weighted Width Distribution');
  h2Weighted.tocIdentifier = 's-weighted';
  h2Weighted.level = 2;
  h2Weighted.fontName = StandardFonts.HelveticaBold;
  h2Weighted.fontSize = 14;
  h2Weighted.textColor = ColorPalette.indigo[600];
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
    ['1×', 1, ColorPalette.slate[400]],
    ['2×', 2, ColorPalette.slate[600]],
    ['3×', 3, ColorPalette.slate[800]],
  ] as [string, number, Color][]) {
    const t = new TextBlock(label);
    t.fontName = StandardFonts.HelveticaBold;
    t.fontSize = 11;
    t.textColor = Color.white;
    const c = new Container();
    c.child = t;
    c.padding = new Thickness(12, 8, 12, 8);
    c.backgroundColor = bg;
    weightedStack.addChild(c, weight);
  }
  doc.add(weightedStack);

  // ── Cross-axis (vertical) alignment ───────────────────────────────────────

  const h2Align = new Heading('Cross-Axis Alignment');
  h2Align.tocIdentifier = 's-align';
  h2Align.level = 2;
  h2Align.fontName = StandardFonts.HelveticaBold;
  h2Align.fontSize = 14;
  h2Align.textColor = ColorPalette.indigo[600];
  h2Align.margin = new Thickness(0, 16, 0, 8);
  doc.add(h2Align);

  const alignDesc = new TextBlock(
    'When a stack has a fixed height and its children differ in height, stack.alignment positions each child along the cross (vertical) axis. The same three boxes - 40pt, 65pt and 90pt tall - are shown top-aligned, centred, and bottom-aligned.'
  );
  alignDesc.margin = new Thickness(0, 0, 0, 8);
  doc.add(alignDesc);

  const boxes: [string, number, Color][] = [
    ['40pt', 40, ColorPalette.blue[600]],
    ['65pt', 65, ColorPalette.indigo[600]],
    ['90pt', 90, ColorPalette.slate[600]],
  ];

  for (const [caption, align] of [
    ['Top (Start)', HorizontalAlignment.Start],
    ['Centre (Center)', HorizontalAlignment.Center],
    ['Bottom (End)', HorizontalAlignment.End],
  ] as [string, HorizontalAlignment][]) {
    const rowCaption = new TextBlock(caption);
    rowCaption.fontName = StandardFonts.HelveticaBold;
    rowCaption.fontSize = 11;
    rowCaption.textColor = ColorPalette.slate[600];
    rowCaption.margin = new Thickness(0, 8, 0, 4);
    doc.add(rowCaption);

    const row = new HorizontalStack();
    row.spacing = 10;
    row.widthDistribution = WidthDistribution.Equal;
    row.height = 90;
    row.alignment = align;
    for (const [label, boxHeight, bg] of boxes) {
      const t = new TextBlock(label);
      t.fontName = StandardFonts.HelveticaBold;
      t.fontSize = 11;
      t.textColor = Color.white;
      const c = new Container();
      c.child = t;
      c.padding = new Thickness(12, 6, 12, 6);
      c.backgroundColor = bg;
      c.height = boxHeight;
      row.addChild(c);
    }
    doc.add(row);
  }

  // ── Key-value pairs ───────────────────────────────────────────────────────

  // Keep the heading with its section: no keep-with-next primitive exists yet
  //, so force the whole block onto the next page with an explicit break.
  doc.add(new PageBreak());

  const h2Kv = new Heading('Key-Value Pairs');
  h2Kv.tocIdentifier = 's-kv';
  h2Kv.level = 2;
  h2Kv.fontName = StandardFonts.HelveticaBold;
  h2Kv.fontSize = 14;
  h2Kv.textColor = ColorPalette.indigo[600];
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
    k.textColor = ColorPalette.slate[700];
    const v = new TextBlock(value);
    v.textColor = ColorPalette.slate[800];
    kv.addChild(k, 1);
    kv.addChild(v, 3);
    doc.add(kv);
  }

  // ── Two-column text ───────────────────────────────────────────────────────

  const h2TwoCols = new Heading('Two-Column Text Layout');
  h2TwoCols.tocIdentifier = 's-twocol';
  h2TwoCols.level = 2;
  h2TwoCols.fontName = StandardFonts.HelveticaBold;
  h2TwoCols.fontSize = 14;
  h2TwoCols.textColor = ColorPalette.indigo[600];
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
      'HorizontalStack automatically divides the available page width so each child receives its share. ' +
      'Text inside each column wraps independently, giving a true two-column reading experience.'
  );
  const col2 = new TextBlock(
    'The second column runs in parallel with the first. Both columns sit within a single HorizontalStack ' +
      'element, meaning they are rendered side-by-side. This pattern is commonly used for newsletters, ' +
      'product sheets, and comparison tables where parallel content aids comprehension.'
  );
  twoColStack.addChild(col1);
  twoColStack.addChild(col2);
  doc.add(twoColStack);

  return doc;
}
