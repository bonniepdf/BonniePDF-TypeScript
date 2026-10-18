/**
 * Text Decorations (Class API).
 * The same underline/strikethrough tour as Text Decorations, built with the class API: construct each element and assign properties, using the TextDecoration flag enum. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextDecoration,
  Heading,
  Line,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `text-decorations.ts`.
 *
 * Same underline/strikethrough tour, authored the long way: `new` each element
 * and assign properties, using the `TextDecoration` flag enum (`Underline |
 * Strikethrough`), the `TextAlignment` enum, `TextStyle`, `Thickness`, `Color`
 * and `ColorPalette` directly. This is the escape hatch the options-object
 * front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `text-decorations.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'Text Decorations';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Underline and strikethrough decorations across alignments and sizes. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, text, underline, strikethrough, decorations, pdf/ua, pdf/a, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Title ─────────────────────────────────────────────────────────────────────

  const h1 = new Heading('Text Decorations');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const intro = new TextBlock(
    'Underline and strikethrough are presentational properties on TextBlock. ' +
      'They do not change how the text is tagged — a decorated paragraph is still a paragraph.'
  );
  intro.margin = new Thickness(0, 0, 0, 14);
  doc.add(intro);

  // ── 1. Underline ──────────────────────────────────────────────────────────────

  section(doc, 'Underline', 's-underline');

  const u = new TextBlock(
    'This text has an underline applied. Underlines can mark emphasis, hyperlinks, or headings in informal documents.'
  );
  u.decoration = TextDecoration.Underline;
  u.margin = new Thickness(0, 0, 0, 10);
  doc.add(u);

  // ── 2. Strikethrough ──────────────────────────────────────────────────────────

  section(doc, 'Strikethrough', 's-strike');

  const s = new TextBlock(
    'This text has a strikethrough applied. Strikethrough visually signals content that has been withdrawn, revised, or superseded.'
  );
  s.decoration = TextDecoration.Strikethrough;
  s.margin = new Thickness(0, 0, 0, 10);
  doc.add(s);

  // ── 3. Combined ───────────────────────────────────────────────────────────────

  section(doc, 'Combined Decorations', 's-combined');

  const c = new TextBlock(
    'Both decorations can be applied simultaneously. TextDecoration is a set of flags — combine them with the | operator: ' +
      'TextDecoration.Underline | TextDecoration.Strikethrough.'
  );
  c.decoration = TextDecoration.Underline | TextDecoration.Strikethrough;
  c.margin = new Thickness(0, 0, 0, 10);
  doc.add(c);

  // ── 4. Alignment ──────────────────────────────────────────────────────────────

  section(doc, 'Alignment', 's-alignment');

  for (const [label, align] of [
    ['Left-aligned underlined text.', TextAlignment.Left],
    ['Centre-aligned underlined text.', TextAlignment.Center],
    ['Right-aligned underlined text.', TextAlignment.Right],
  ] as [string, TextAlignment][]) {
    const b = new TextBlock(label);
    b.decoration = TextDecoration.Underline;
    b.alignment = align;
    b.margin = new Thickness(0, 0, 0, 8);
    doc.add(b);
  }

  // ── 5. Scales with font size ──────────────────────────────────────────────────

  section(doc, 'Scales with Font Size', 's-sizes');

  for (const size of [8, 12, 18, 24, 36]) {
    const b = new TextBlock(`Underline at ${size}pt`);
    b.fontSize = size;
    b.decoration = TextDecoration.Underline;
    b.margin = new Thickness(0, 0, 0, 6);
    doc.add(b);
  }

  // ── Practical Example ─────────────────────────────────────────────────────────

  const divider = new Line();
  divider.color = ColorPalette.slate[300];
  divider.thickness = 1;
  divider.margin = new Thickness(0, 12, 0, 0);
  doc.add(divider);

  section(doc, 'Practical Example: Price List', 's-prices');

  const original = new TextBlock('Original Price: £199.99');
  original.fontSize = 14;
  original.color = ColorPalette.slate[600];
  original.decoration = TextDecoration.Strikethrough;
  original.margin = new Thickness(0, 0, 0, 4);
  doc.add(original);

  const sale = new TextBlock('Sale Price: £149.99');
  sale.fontName = StandardFonts.HelveticaBold;
  sale.fontSize = 18;
  sale.color = Color.red;
  sale.decoration = TextDecoration.Underline;
  sale.margin = new Thickness(0, 0, 0, 4);
  doc.add(sale);

  const saving = new TextBlock('You save £50.00!');
  saving.fontSize = 11;
  saving.color = ColorPalette.green[700];
  doc.add(saving);

  return doc;
}

// Local helpers and sample types used by this document.

function section(doc: Document, title: string, tocId: string): void {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.color = ColorPalette.indigo[600];
  h.margin = new Thickness(0, 12, 0, 6);
  doc.add(h);
}
