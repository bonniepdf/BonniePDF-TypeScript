/**
 * Custom Fonts - TrueType font embedding with full Unicode coverage.
 *
 * ── How font embedding works ──────────────────────────────────────────────────
 * Set `fontName` on any TextBlock to the path (Node.js) or URL (browser) of a
 * TrueType / OpenType font file:
 *
 *   Node.js:
 *     block.fontName = 'C:\\Windows\\Fonts\\arial.ttf';
 *     block.fontName = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
 *
 *   Browser (serve the font as a static asset and reference it by URL):
 *     block.fontName = '/fonts/NotoSans-Regular.ttf';
 *
 * BonniePDF embeds a compact glyph subset of the font directly in the PDF so
 * only the characters that are actually used are stored.
 *
 * ── Browser setup ─────────────────────────────────────────────────────────────
 * In a browser context, call the async generation path so the font bytes are
 * fetched before rendering begins:
 *
 *   import { configurePlatform, BrowserPlatformIO } from '@bonniepdf/core';
 *   configurePlatform(new BrowserPlatformIO());
 *   const bytes = await doc.generateBytesAsync();
 *
 * The website demo uses this path automatically (see examples-init.ts).
 *
 * ── Demo font ─────────────────────────────────────────────────────────────────
 * The FONT constant below points to a publicly hosted Noto Sans TTF.
 * Swap it for a local path or a self-hosted URL in production.
 *
 * To disable TTF embedding and use standard Helvetica (limited to the
 * WinAnsi charset), set FONT = StandardFonts.Helvetica.
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfAConformance,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  ColorPalette,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

// ── Font selection ─────────────────────────────────────────────────────────────
//
// Primary font - Latin, Greek, Cyrillic, currency symbols:
const FONT = '/fonts/NotoSans-Regular.ttf';
//
// Math font - Arrows (U+2190–U+21FF) and Mathematical Operators (U+2200–U+22FF).
// Neither NotoSansSymbols nor NotoSansSymbols2 contains these blocks.
// NotoSansMath explicitly covers both.
const MATH_FONT = '/fonts/NotoSansMath-Regular.ttf';

// Symbols font - Miscellaneous Symbols (U+2600) and Dingbats (U+2700).
// NotoSansSymbols2 covers these blocks well.
const SYMBOLS_FONT = '/fonts/NotoSansSymbols2-Regular.ttf';
//
// Node.js alternatives:
//   const FONT = 'C:\\Windows\\Fonts\\arial.ttf';
//   const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Embedded Font Example';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('TrueType Font Embedding Demo');
  title.fontName = FONT;
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 12);
  doc.add(title);

  const subtitle = new TextBlock('Full Unicode Support with Embedded Fonts');
  subtitle.fontName = FONT;
  subtitle.fontSize = 14;
  subtitle.textColor = ColorPalette.slate[600];
  subtitle.margin = new Thickness(0, 0, 0, 16);
  doc.add(subtitle);

  // ── Unicode Symbols (Latin-1 range - covered by NotoSans) ────────────────
  const unicodeHeading = new TextBlock('Unicode Symbols:');
  unicodeHeading.fontName = FONT;
  unicodeHeading.fontSize = 12;
  unicodeHeading.textColor = ColorPalette.slate[700];
  unicodeHeading.margin = new Thickness(0, 0, 0, 6);
  doc.add(unicodeHeading);
  const bulletSymbol = new TextBlock('• Bullet point (U+2022)');
  bulletSymbol.fontName = FONT;
  bulletSymbol.fontSize = 11;
  bulletSymbol.textColor = ColorPalette.slate[600];
  doc.add(bulletSymbol);
  const copyrightSymbol = new TextBlock('© Copyright (U+00A9)   ® Registered (U+00AE)   ™ Trademark (U+2122)');
  copyrightSymbol.fontName = FONT;
  copyrightSymbol.fontSize = 11;
  copyrightSymbol.textColor = ColorPalette.slate[600];
  doc.add(copyrightSymbol);
  const dashSymbol = new TextBlock('– En-dash (U+2013)  - Em-dash (U+2014)');
  dashSymbol.fontName = FONT;
  dashSymbol.fontSize = 11;
  dashSymbol.textColor = ColorPalette.slate[600];
  doc.add(dashSymbol);
  const operationSymbol = new TextBlock('± Plus-minus  × Multiply  ÷ Divide');
  operationSymbol.fontName = FONT;
  operationSymbol.fontSize = 11;
  operationSymbol.textColor = ColorPalette.slate[600];
  operationSymbol.margin = new Thickness(0, 0, 0, 12);
  doc.add(operationSymbol);

  // ── Currency Symbols (covered by NotoSans) ────────────────────────────────
  const currencyHeading = new TextBlock('Currency Symbols:');
  currencyHeading.fontName = FONT;
  currencyHeading.fontSize = 12;
  currencyHeading.textColor = ColorPalette.slate[700];
  currencyHeading.margin = new Thickness(0, 0, 0, 6);
  doc.add(currencyHeading);
  const currencySymbols = new TextBlock('€ Euro  £ Pound  ¥ Yen  ₹ Rupee');
  currencySymbols.fontName = FONT;
  currencySymbols.fontSize = 11;
  currencySymbols.textColor = ColorPalette.slate[600];
  currencySymbols.margin = new Thickness(0, 0, 0, 12);
  doc.add(currencySymbols);

  // ── Arrows & Math (U+2190–U+22FF - NotoSansMath) ────────────────────────
  // These blocks are absent from NotoSansSymbols and NotoSansSymbols2.
  // NotoSansMath explicitly covers both Arrows and Mathematical Operators.
  // ── Dingbats & Misc Symbols (U+2600–U+27FF - NotoSansSymbols2) ───────────

  const arrowsHeading = new TextBlock('Arrows (via NotoSansMath):');
  arrowsHeading.fontName = FONT;
  arrowsHeading.fontSize = 12;
  arrowsHeading.textColor = ColorPalette.slate[700];
  arrowsHeading.margin = new Thickness(0, 0, 0, 6);
  doc.add(arrowsHeading);
  const arrowsLine = new TextBlock('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪');
  arrowsLine.fontName = MATH_FONT;
  arrowsLine.fontSize = 11;
  arrowsLine.textColor = ColorPalette.slate[600];
  arrowsLine.margin = new Thickness(0, 0, 0, 8);
  doc.add(arrowsLine);

  const mathHeading = new TextBlock('Mathematical Symbols (via NotoSansMath):');
  mathHeading.fontName = FONT;
  mathHeading.fontSize = 12;
  mathHeading.textColor = ColorPalette.slate[700];
  mathHeading.margin = new Thickness(0, 0, 0, 6);
  doc.add(mathHeading);
  const relationsLine = new TextBlock('≠ Not equal   ≤ Less-equal   ≥ Greater-equal   ∞ Infinity');
  relationsLine.fontName = MATH_FONT;
  relationsLine.fontSize = 11;
  relationsLine.textColor = ColorPalette.slate[600];
  doc.add(relationsLine);
  const operatorsLine = new TextBlock('∑ Sum   ∏ Product   √ Root   ∫ Integral   ± Plus-minus');
  operatorsLine.fontName = MATH_FONT;
  operatorsLine.fontSize = 11;
  operatorsLine.textColor = ColorPalette.slate[600];
  operatorsLine.margin = new Thickness(0, 0, 0, 8);
  doc.add(operatorsLine);

  const dingbatsHeading = new TextBlock('Dingbats (via NotoSansSymbols2):');
  dingbatsHeading.fontName = FONT;
  dingbatsHeading.fontSize = 12;
  dingbatsHeading.textColor = ColorPalette.slate[700];
  dingbatsHeading.margin = new Thickness(0, 0, 0, 6);
  doc.add(dingbatsHeading);
  const dingbatsLine = new TextBlock('✓ Check   ✗ Cross   ★ Star   ♠ Spade   ♥ Heart   ♦ Diamond   ♣ Club');
  dingbatsLine.fontName = SYMBOLS_FONT;
  dingbatsLine.fontSize = 11;
  dingbatsLine.textColor = ColorPalette.slate[600];
  dingbatsLine.margin = new Thickness(0, 0, 0, 12);
  doc.add(dingbatsLine);

  // ── Greek Letters ──────────────────────────────────────────────────────────
  const greekHeading = new TextBlock('Greek Letters:');
  greekHeading.fontName = FONT;
  greekHeading.fontSize = 12;
  greekHeading.textColor = ColorPalette.slate[700];
  greekHeading.margin = new Thickness(0, 0, 0, 6);
  doc.add(greekHeading);
  const greekLine = new TextBlock('α Alpha  β Beta  γ Gamma  δ Delta  π Pi  Ω Omega');
  greekLine.fontName = FONT;
  greekLine.fontSize = 11;
  greekLine.textColor = ColorPalette.slate[600];
  greekLine.margin = new Thickness(0, 0, 0, 16);
  doc.add(greekLine);

  // ── Mixed fonts ────────────────────────────────────────────────────────────
  const mixedHeading = new TextBlock('Mixed Font Demonstration:');
  mixedHeading.fontName = FONT;
  mixedHeading.fontSize = 12;
  mixedHeading.textColor = ColorPalette.slate[700];
  mixedHeading.margin = new Thickness(0, 0, 0, 6);
  doc.add(mixedHeading);

  const stdLine = new TextBlock('This line uses standard Helvetica (Type1, not embedded)');
  stdLine.fontName = StandardFonts.Helvetica;
  stdLine.fontSize = 11;
  stdLine.textColor = ColorPalette.slate[600];
  doc.add(stdLine);

  const embeddedLine = new TextBlock('This line uses an embedded TrueType font - full Unicode range supported');
  embeddedLine.fontName = FONT;
  embeddedLine.fontSize = 11;
  embeddedLine.textColor = ColorPalette.slate[600];
  embeddedLine.margin = new Thickness(0, 0, 0, 16);
  doc.add(embeddedLine);

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = new TextBlock(`© ${new Date().getFullYear()} BonniePDF • TrueType Font Embedding`);
  footer.fontName = FONT;
  footer.fontSize = 10;
  footer.textColor = ColorPalette.slate[400];
  doc.add(footer);

  return doc;
}
