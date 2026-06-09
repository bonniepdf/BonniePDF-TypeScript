import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextDecoration,
  Heading,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = 'Text Decorations - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates text decorations in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, text, underline, strikethrough';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate700);

  const h1 = new Heading('Text Decorations - PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 14);
  doc.add(h1);

  const intro = new TextBlock(
    'Underline and strikethrough are presentational properties that do not change the structure-tree type of a text block. All decorated paragraphs below are /P structure elements.'
  );
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  // ── Underline ─────────────────────────────────────────────────────────────

  const h2Under = new Heading('Underline');
  h2Under.tocIdentifier = 's-underline';
  h2Under.level = 2;
  h2Under.fontName = StandardFonts.HelveticaBold;
  h2Under.fontSize = 14;
  h2Under.textColor = Color.indigo600;
  h2Under.margin = new Thickness(0, 12, 0, 6);
  doc.add(h2Under);

  const u1 = new TextBlock('This text has an underline decoration applied.');
  u1.textDecoration = TextDecoration.Underline;
  u1.textColor = Color.slate700;
  u1.margin = new Thickness(0, 0, 0, 8);
  doc.add(u1);

  const u2 = new TextBlock('Underlines can mark hyperlinks, emphasis, or headings in informal documents.');
  u2.textDecoration = TextDecoration.Underline;
  u2.textColor = Color.slate700;
  u2.margin = new Thickness(0, 0, 0, 8);
  doc.add(u2);

  // ── Strikethrough ─────────────────────────────────────────────────────────

  const h2Strike = new Heading('Strikethrough');
  h2Strike.tocIdentifier = 's-strike';
  h2Strike.level = 2;
  h2Strike.fontName = StandardFonts.HelveticaBold;
  h2Strike.fontSize = 14;
  h2Strike.textColor = Color.indigo600;
  h2Strike.margin = new Thickness(0, 12, 0, 6);
  doc.add(h2Strike);

  const s1 = new TextBlock(
    'This text has a strikethrough decoration, useful for showing deleted or superseded content.'
  );
  s1.textDecoration = TextDecoration.Strikethrough;
  s1.textColor = Color.slate700;
  s1.margin = new Thickness(0, 0, 0, 8);
  doc.add(s1);

  const s2 = new TextBlock('Strikethrough visually signals content that has been withdrawn or revised.');
  s2.textDecoration = TextDecoration.Strikethrough;
  s2.textColor = Color.slate700;
  s2.margin = new Thickness(0, 0, 0, 8);
  doc.add(s2);

  // ── Combined decorations ──────────────────────────────────────────────────

  const h2Combined = new Heading('Combined Decorations');
  h2Combined.tocIdentifier = 's-combined';
  h2Combined.level = 2;
  h2Combined.fontName = StandardFonts.HelveticaBold;
  h2Combined.fontSize = 14;
  h2Combined.textColor = Color.indigo600;
  h2Combined.margin = new Thickness(0, 12, 0, 6);
  doc.add(h2Combined);

  const c1 = new TextBlock('This text has both underline and strikethrough applied simultaneously.');
  c1.textDecoration = TextDecoration.Underline | TextDecoration.Strikethrough;
  c1.textColor = Color.slate700;
  c1.margin = new Thickness(0, 0, 0, 8);
  doc.add(c1);

  // ── Thickness scales with font size ───────────────────────────────────────

  const h2Sizes = new Heading('Decoration Thickness Scales with Font Size');
  h2Sizes.tocIdentifier = 's-sizes';
  h2Sizes.level = 2;
  h2Sizes.fontName = StandardFonts.HelveticaBold;
  h2Sizes.fontSize = 14;
  h2Sizes.textColor = Color.indigo600;
  h2Sizes.margin = new Thickness(0, 12, 0, 6);
  doc.add(h2Sizes);

  for (const size of [8, 12, 18, 24, 36]) {
    const b = new TextBlock(`Underline at ${size}pt`);
    b.fontSize = size;
    b.textDecoration = TextDecoration.Underline;
    b.textColor = Color.slate700;
    b.margin = new Thickness(0, 0, 0, 4);
    doc.add(b);
  }

  // ── Practical: price list ─────────────────────────────────────────────────

  const h2Prices = new Heading('Practical Example: Price List');
  h2Prices.tocIdentifier = 's-prices';
  h2Prices.level = 2;
  h2Prices.fontName = StandardFonts.HelveticaBold;
  h2Prices.fontSize = 14;
  h2Prices.textColor = Color.indigo600;
  h2Prices.margin = new Thickness(0, 12, 0, 6);
  doc.add(h2Prices);

  const original = new TextBlock('Original Price: £199.99');
  original.fontSize = 14;
  original.textColor = Color.slate400;
  original.textDecoration = TextDecoration.Strikethrough;
  original.margin = new Thickness(0, 0, 0, 4);
  doc.add(original);

  const sale = new TextBlock('Sale Price: £149.99');
  sale.fontName = StandardFonts.HelveticaBold;
  sale.fontSize = 18;
  sale.textColor = Color.red;
  sale.textDecoration = TextDecoration.Underline;
  sale.margin = new Thickness(0, 0, 0, 4);
  doc.add(sale);

  const saving = new TextBlock('You save £50.00!');
  saving.fontSize = 11;
  saving.textColor = Color.green600;
  doc.add(saving);

  return doc;
}
