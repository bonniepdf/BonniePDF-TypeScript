import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextDecoration,
  VerticalStack,
  Line,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

function sectionHeader(title: string): TextBlock {
  const b = new TextBlock(title);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 14;
  b.textColor = Color.indigo600;
  b.margin = new Thickness(0, 12, 0, 6);
  return b;
}

function divider(): Line {
  const l = new Line();
  l.color = Color.slate300;
  l.thickness = 1;
  return l;
}

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'Text Decorations';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const title = new TextBlock('Text Decorations');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  // ── Underline ────────────────────────────────────────────────────────────
  doc.add(sectionHeader('Underline'));

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
  doc.add(sectionHeader('Strikethrough'));

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
  doc.add(sectionHeader('Combined Decorations'));

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
  doc.add(divider());
  doc.add(sectionHeader('Decorations with Different Alignments'));

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
  doc.add(divider());
  doc.add(sectionHeader('Decoration Thickness Scales with Font Size'));

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
  doc.add(divider());
  doc.add(sectionHeader('Practical Example: Price List'));

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
