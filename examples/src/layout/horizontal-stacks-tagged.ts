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
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  WidthDistribution,
  PdfAConformance,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Horizontal Stacks - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates horizontal stack layouts in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, layout, horizontal stack, columns';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Horizontal Stack Layouts - PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'HorizontalStack arranges child elements side-by-side. Width distribution controls how available space is divided between columns. All text inside stacks is part of the normal structure tree.'
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

  // ── Key-value pairs ───────────────────────────────────────────────────────

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
    ['Document Title:', 'Horizontal Stacks - Tagged (PDF/UA-1)'],
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
