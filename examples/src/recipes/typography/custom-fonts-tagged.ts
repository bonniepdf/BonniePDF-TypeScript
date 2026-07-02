import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  Color,
  ColorPalette,
  Thickness,
  PdfAConformance,
} from '@bonniepdf/core';

const FONT = '/fonts/NotoSans-Regular.ttf';
const MATH_FONT = '/fonts/NotoSansMath-Regular.ttf';
const SYMBOLS_FONT = '/fonts/NotoSansSymbols2-Regular.ttf';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Custom Fonts - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'TrueType font embedding with Unicode coverage in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, fonts, unicode, truetype';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('TrueType Font Embedding - PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = FONT;
  h1.fontSize = 22;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'BonniePDF embeds compact glyph subsets of TrueType fonts directly in the PDF. ' +
      'Only the characters that are used are stored. All text below is tagged as /P structure elements.'
  );
  intro.fontName = FONT;
  intro.fontSize = 11;
  intro.textColor = ColorPalette.slate[500];
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── Unicode Symbols ──────────────────────────────────────────────────────

  const h2Symbols = new Heading('Unicode Symbols');
  h2Symbols.tocIdentifier = 's-symbols';
  h2Symbols.level = 2;
  h2Symbols.fontName = FONT;
  h2Symbols.fontSize = 13;
  h2Symbols.textColor = ColorPalette.slate[700];
  h2Symbols.margin = new Thickness(0, 0, 0, 6);
  doc.add(h2Symbols);

  const symbolLine1 = new TextBlock(
    '• Bullet (U+2022)  © Copyright (U+00A9)  ® Registered (U+00AE)  ™ Trademark (U+2122)'
  );
  symbolLine1.fontName = FONT;
  symbolLine1.fontSize = 11;
  symbolLine1.textColor = ColorPalette.slate[600];
  symbolLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(symbolLine1);
  const symbolLine2 = new TextBlock('– En-dash (U+2013)  - Em-dash (U+2014)');
  symbolLine2.fontName = FONT;
  symbolLine2.fontSize = 11;
  symbolLine2.textColor = ColorPalette.slate[600];
  symbolLine2.margin = new Thickness(0, 0, 0, 4);
  doc.add(symbolLine2);
  const symbolLine3 = new TextBlock('± Plus-minus  × Multiply  ÷ Divide');
  symbolLine3.fontName = FONT;
  symbolLine3.fontSize = 11;
  symbolLine3.textColor = ColorPalette.slate[600];
  symbolLine3.margin = new Thickness(0, 0, 0, 4);
  doc.add(symbolLine3);

  // ── Currency Symbols ──────────────────────────────────────────────────────

  const h2Currency = new Heading('Currency Symbols');
  h2Currency.tocIdentifier = 's-currency';
  h2Currency.level = 2;
  h2Currency.fontName = FONT;
  h2Currency.fontSize = 13;
  h2Currency.textColor = ColorPalette.slate[700];
  h2Currency.margin = new Thickness(0, 10, 0, 6);
  doc.add(h2Currency);

  const cur = new TextBlock('€ Euro  £ Pound  ¥ Yen  ₹ Rupee  ₿ Bitcoin');
  cur.fontName = FONT;
  cur.fontSize = 11;
  cur.textColor = ColorPalette.slate[600];
  cur.margin = new Thickness(0, 0, 0, 4);
  doc.add(cur);

  // ── Arrows & Math (NotoSansMath) ──────────────────────────────────────────

  const h2Math = new Heading('Arrows & Mathematical Symbols');
  h2Math.tocIdentifier = 's-math';
  h2Math.level = 2;
  h2Math.fontName = MATH_FONT;
  h2Math.fontSize = 13;
  h2Math.textColor = ColorPalette.slate[700];
  h2Math.margin = new Thickness(0, 10, 0, 6);
  doc.add(h2Math);

  const mathLine1 = new TextBlock('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪');
  mathLine1.fontName = MATH_FONT;
  mathLine1.fontSize = 11;
  mathLine1.textColor = ColorPalette.slate[600];
  mathLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(mathLine1);
  const mathLine2 = new TextBlock('≠ Not equal  ≤ Less-equal  ≥ Greater-equal  ∞ Infinity');
  mathLine2.fontName = MATH_FONT;
  mathLine2.fontSize = 11;
  mathLine2.textColor = ColorPalette.slate[600];
  mathLine2.margin = new Thickness(0, 0, 0, 4);
  doc.add(mathLine2);
  const mathLine3 = new TextBlock('∑ Sum  ∏ Product  √ Root  ∫ Integral');
  mathLine3.fontName = MATH_FONT;
  mathLine3.fontSize = 11;
  mathLine3.textColor = ColorPalette.slate[600];
  mathLine3.margin = new Thickness(0, 0, 0, 4);
  doc.add(mathLine3);

  // ── Dingbats (NotoSansSymbols2) ───────────────────────────────────────────

  const h2Dingbats = new Heading('Dingbats & Miscellaneous Symbols');
  h2Dingbats.tocIdentifier = 's-dingbats';
  h2Dingbats.level = 2;
  h2Dingbats.fontName = SYMBOLS_FONT;
  h2Dingbats.fontSize = 13;
  h2Dingbats.textColor = ColorPalette.slate[700];
  h2Dingbats.margin = new Thickness(0, 10, 0, 6);
  doc.add(h2Dingbats);

  const dingbatLine = new TextBlock('✓ Check  ✗ Cross  ★ Star  ♠ Spade  ♥ Heart  ♦ Diamond  ♣ Club');
  dingbatLine.fontName = SYMBOLS_FONT;
  dingbatLine.fontSize = 11;
  dingbatLine.textColor = ColorPalette.slate[600];
  dingbatLine.margin = new Thickness(0, 0, 0, 4);
  doc.add(dingbatLine);

  // ── Greek Letters ─────────────────────────────────────────────────────────

  const h2Greek = new Heading('Greek Letters');
  h2Greek.tocIdentifier = 's-greek';
  h2Greek.level = 2;
  h2Greek.fontName = FONT;
  h2Greek.fontSize = 13;
  h2Greek.textColor = ColorPalette.slate[700];
  h2Greek.margin = new Thickness(0, 10, 0, 6);
  doc.add(h2Greek);

  const greek = new TextBlock('α Alpha  β Beta  γ Gamma  δ Delta  π Pi  Ω Omega');
  greek.fontName = FONT;
  greek.fontSize = 11;
  greek.textColor = ColorPalette.slate[600];
  doc.add(greek);

  return doc;
}
