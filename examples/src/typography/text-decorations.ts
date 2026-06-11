import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextDecoration,
  VerticalStack,
  Line,
  Color,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'Text Decorations';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Text Decorations');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  // ── Underline ────────────────────────────────────────────────────────────
  const sectionHeader1 = new TextBlock('Underline');
  sectionHeader1.fontName = StandardFonts.HelveticaBold;
  sectionHeader1.fontSize = 14;
  sectionHeader1.textColor = Color.indigo600;
  sectionHeader1.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader1);

  const u1 = new TextBlock('This text has an underline decoration applied.');
  u1.fontName = StandardFonts.Helvetica;
  u1.fontSize = 12;
  u1.textColor = Color.slate700;
  u1.textDecoration = TextDecoration.Underline;
  u1.margin = new Thickness(0, 0, 0, 12);
  doc.add(u1);

  const u2 = new TextBlock('This underline was applied by setting textDecoration = TextDecoration.Underline.');
  u2.fontName = StandardFonts.Helvetica;
  u2.fontSize = 12;
  u2.textColor = Color.slate700;
  u2.textDecoration = TextDecoration.Underline;
  u2.margin = new Thickness(0, 0, 0, 12);
  doc.add(u2);

  // ── Strikethrough ────────────────────────────────────────────────────────
  const sectionHeader2 = new TextBlock('Strikethrough');
  sectionHeader2.fontName = StandardFonts.HelveticaBold;
  sectionHeader2.fontSize = 14;
  sectionHeader2.textColor = Color.indigo600;
  sectionHeader2.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader2);

  const s1 = new TextBlock(
    'This text has a strikethrough decoration, useful for showing deleted or superseded content.'
  );
  s1.fontName = StandardFonts.Helvetica;
  s1.fontSize = 12;
  s1.textColor = Color.slate700;
  s1.textDecoration = TextDecoration.Strikethrough;
  s1.margin = new Thickness(0, 0, 0, 12);
  doc.add(s1);

  const s2 = new TextBlock('A second strikethrough line demonstrating consistent decoration thickness.');
  s2.fontName = StandardFonts.Helvetica;
  s2.fontSize = 12;
  s2.textColor = Color.slate700;
  s2.textDecoration = TextDecoration.Strikethrough;
  s2.margin = new Thickness(0, 0, 0, 12);
  doc.add(s2);

  // ── Combined ─────────────────────────────────────────────────────────────
  const sectionHeader3 = new TextBlock('Combined Decorations');
  sectionHeader3.fontName = StandardFonts.HelveticaBold;
  sectionHeader3.fontSize = 14;
  sectionHeader3.textColor = Color.indigo600;
  sectionHeader3.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader3);

  const c1 = new TextBlock('This text has both underline and strikethrough applied simultaneously.');
  c1.fontName = StandardFonts.Helvetica;
  c1.fontSize = 12;
  c1.textColor = Color.slate700;
  c1.textDecoration = TextDecoration.Underline | TextDecoration.Strikethrough;
  c1.margin = new Thickness(0, 0, 0, 12);
  doc.add(c1);

  const c2 = new TextBlock('Decorations are bitwise flags - combine them with the | operator.');
  c2.fontName = StandardFonts.Helvetica;
  c2.fontSize = 12;
  c2.textColor = Color.slate700;
  c2.textDecoration = TextDecoration.Underline | TextDecoration.Strikethrough;
  c2.margin = new Thickness(0, 0, 0, 12);
  doc.add(c2);

  // ── Different alignments ──────────────────────────────────────────────────
  const divider1 = new Line();
  divider1.color = Color.slate300;
  divider1.thickness = 1;
  doc.add(divider1);
  const sectionHeader4 = new TextBlock('Decorations with Different Alignments');
  sectionHeader4.fontName = StandardFonts.HelveticaBold;
  sectionHeader4.fontSize = 14;
  sectionHeader4.textColor = Color.indigo600;
  sectionHeader4.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader4);

  for (const [text, align] of [
    ['Left-aligned underlined text', TextAlignment.Left],
    ['Center-aligned underlined text', TextAlignment.Center],
    ['Right-aligned underlined text', TextAlignment.Right],
  ] as [string, TextAlignment][]) {
    const b = new TextBlock(text);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 12;
    b.textColor = Color.slate700;
    b.textDecoration = TextDecoration.Underline;
    b.alignment = align;
    b.margin = new Thickness(0, 0, 0, 8);
    doc.add(b);
  }

  // ── Scales with font size ─────────────────────────────────────────────────
  const divider2 = new Line();
  divider2.color = Color.slate300;
  divider2.thickness = 1;
  doc.add(divider2);
  const sectionHeader5 = new TextBlock('Decoration Thickness Scales with Font Size');
  sectionHeader5.fontName = StandardFonts.HelveticaBold;
  sectionHeader5.fontSize = 14;
  sectionHeader5.textColor = Color.indigo600;
  sectionHeader5.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader5);

  for (const size of [8, 12, 18, 24, 36]) {
    const b = new TextBlock(`Underline at ${size}pt`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = size;
    b.textColor = Color.slate700;
    b.textDecoration = TextDecoration.Underline;
    b.margin = new Thickness(0, 0, 0, 6);
    doc.add(b);
  }

  // ── Practical: price list ─────────────────────────────────────────────────
  const divider3 = new Line();
  divider3.color = Color.slate300;
  divider3.thickness = 1;
  doc.add(divider3);
  const sectionHeader6 = new TextBlock('Practical Example: Price List');
  sectionHeader6.fontName = StandardFonts.HelveticaBold;
  sectionHeader6.fontSize = 14;
  sectionHeader6.textColor = Color.indigo600;
  sectionHeader6.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader6);

  const priceList = new VerticalStack();

  const original = new TextBlock('Original Price: $199.99');
  original.fontName = StandardFonts.Helvetica;
  original.fontSize = 14;
  original.textColor = Color.slate400;
  original.textDecoration = TextDecoration.Strikethrough;
  original.margin = new Thickness(0, 0, 0, 4);
  priceList.addChild(original);

  const sale = new TextBlock('Sale Price: $149.99');
  sale.fontName = StandardFonts.HelveticaBold;
  sale.fontSize = 18;
  sale.textColor = Color.red;
  sale.textDecoration = TextDecoration.Underline;
  sale.margin = new Thickness(0, 0, 0, 4);
  priceList.addChild(sale);

  const saving = new TextBlock('You save $50.00!');
  saving.fontName = StandardFonts.Helvetica;
  saving.fontSize = 11;
  saving.textColor = Color.green600;
  priceList.addChild(saving);

  doc.add(priceList);
  return doc;
}
