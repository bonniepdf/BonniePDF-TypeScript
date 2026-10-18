/**
 * Custom Fonts (Class API).
 * The same TrueType-embedding / Unicode-coverage tour as Custom Fonts, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
/**
 * Custom Fonts — TrueType font embedding with full Unicode coverage.
 *
 * Supply three font files as bytes in the asset dictionary and register them on
 * this document. Set each block's fontName to the returned face identifier.
 * BonniePDF embeds only the glyphs used; the document's fallback faces cover
 * symbols missing from the primary font.
 *
 * This example uses three Noto fonts to cover different Unicode blocks:
 *   NotoSans          — Latin, Greek, Cyrillic, currency (BMP)
 *   NotoSansMath      — Arrows (U+2190–U+21FF) and Mathematical Operators (U+2200–U+22FF)
 *   NotoSansSymbols2  — Miscellaneous Symbols (U+2600) and Dingbats (U+2700)
 *
 * Load the bytes in your application host; the builder works in Node or the browser.
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `custom-fonts.ts`.
 *
 * Same TrueType-embedding / Unicode-coverage tour, authored the long way: `new`
 * each element and assign properties, using `TextStyle`, `Thickness` and
 * `ColorPalette` directly. This is the escape hatch the options-object front
 * door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `custom-fonts.ts` (an equivalence test binds the two). Reach for the options
 * form first; this variant exists to show what it desugars to.
 */
export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Noto Sans').withSize(11).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Custom Fonts';
  metadata.author = 'BonniePDF';
  metadata.subject = 'TrueType font embedding with Unicode coverage. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, accessibility, fonts, unicode, truetype';

  const doc = new Document(settings, metadata);

  function font(path: string): string {
    const bytes = assets?.get(path);
    if (!bytes) throw new Error(`Supply ${path} in the asset dictionary.`);
    return doc.fonts.add(bytes).fontName;
  }
  const FONT = font('fonts/NotoSans-Regular.ttf');
  const MATH_FONT = font('fonts/NotoSansMath-Regular.ttf');
  const SYMBOLS_FONT = font('fonts/NotoSansSymbols2-Regular.ttf');
  doc.settings.defaultTextStyle!.withFamily(FONT);

  // ── Title ─────────────────────────────────────────────────────────────────────

  const h1 = new Heading('Custom Fonts — TrueType Embedding');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = FONT;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const intro = new TextBlock(
    'BonniePDF embeds compact glyph subsets of TrueType fonts directly in the PDF — ' +
      'only the characters actually used are stored. Fonts with different Unicode coverage ' +
      'can be mixed within a single document by setting fontName per block.'
  );
  intro.fontName = FONT;
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── 1. Unicode Symbols ────────────────────────────────────────────────────────

  section(doc, 'Unicode Symbols', 's-symbols');

  for (const text of [
    '• Bullet (U+2022)  © Copyright (U+00A9)  ® Registered (U+00AE)  ™ Trademark (U+2122)',
    '– En-dash (U+2013)  — Em-dash (U+2014)',
    '± Plus-minus  × Multiply  ÷ Divide',
  ]) {
    const b = new TextBlock(text);
    b.fontName = FONT;
    b.margin = new Thickness(0, 0, 0, 4);
    doc.add(b);
  }

  // ── 2. Currency Symbols ───────────────────────────────────────────────────────

  section(doc, 'Currency Symbols', 's-currency');

  const cur = new TextBlock('€ Euro  £ Pound  ¥ Yen  ₹ Rupee  ₿ Bitcoin');
  cur.fontName = FONT;
  cur.margin = new Thickness(0, 0, 0, 4);
  doc.add(cur);

  // ── 3. Arrows (NotoSansMath) ──────────────────────────────────────────────────

  section(doc, 'Arrows (via NotoSansMath)', 's-arrows');

  const arrows = new TextBlock('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪');
  arrows.fontName = MATH_FONT;
  arrows.margin = new Thickness(0, 0, 0, 4);
  doc.add(arrows);

  // ── 4. Mathematical Operators (NotoSansMath) ──────────────────────────────────

  section(doc, 'Mathematical Operators (via NotoSansMath)', 's-math');

  for (const text of [
    '≠ Not equal  ≤ Less-equal  ≥ Greater-equal  ∞ Infinity',
    '∑ Sum  ∏ Product  √ Root  ∫ Integral',
  ]) {
    const b = new TextBlock(text);
    b.fontName = MATH_FONT;
    b.margin = new Thickness(0, 0, 0, 4);
    doc.add(b);
  }

  // ── 5. Dingbats (NotoSansSymbols2) ───────────────────────────────────────────

  section(doc, 'Dingbats (via NotoSansSymbols2)', 's-dingbats');

  const dingbats = new TextBlock('✓ Check  ✗ Cross  ★ Star  ♠ Spade  ♥ Heart  ♦ Diamond  ♣ Club');
  dingbats.fontName = SYMBOLS_FONT;
  dingbats.margin = new Thickness(0, 0, 0, 4);
  doc.add(dingbats);

  // ── 6. Greek Letters ──────────────────────────────────────────────────────────

  section(doc, 'Greek Letters', 's-greek');

  const greek = new TextBlock('α Alpha  β Beta  γ Gamma  δ Delta  π Pi  Ω Omega');
  greek.fontName = FONT;
  greek.margin = new Thickness(0, 0, 0, 4);
  doc.add(greek);

  // ── 7. Standard vs Embedded ───────────────────────────────────────────────────

  section(doc, 'Standard vs Embedded', 's-comparison');

  const std = new TextBlock('Standard Helvetica (Type 1) — limited to the WinAnsi charset.');
  std.fontName = StandardFonts.Helvetica;
  std.margin = new Thickness(0, 0, 0, 4);
  doc.add(std);

  const embedded = new TextBlock(
    'Embedded NotoSans (TrueType) — full Unicode range, subsetting keeps file size compact.'
  );
  embedded.fontName = FONT;
  doc.add(embedded);

  function section(doc: Document, title: string, tocId: string): void {
    const h = new Heading(title);
    h.tocIdentifier = tocId;
    h.level = 2;
    h.fontName = FONT;
    h.fontSize = 13;
    h.color = ColorPalette.indigo[600];
    h.margin = new Thickness(0, 12, 0, 6);
    doc.add(h);
  }

  return doc;
}
