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
  PdfVersion,
  TextBlock,
  TextStyle,
  Color,
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

function heading(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = FONT;
  b.fontSize = 12;
  b.textColor = Color.slate700;
  b.margin = new Thickness(0, 0, 0, 6);
  return b;
}

function sym(text: string, bottomMargin = 0): TextBlock {
  const b = new TextBlock(text);
  b.fontName = FONT;
  b.fontSize = 11;
  b.textColor = Color.slate600;
  if (bottomMargin) b.margin = new Thickness(0, 0, 0, bottomMargin);
  return b;
}

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Embedded Font Example';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const title = new TextBlock('TrueType Font Embedding Demo');
  title.fontName = FONT;
  title.fontSize = 24;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 12);
  doc.add(title);

  const subtitle = new TextBlock('Full Unicode Support with Embedded Fonts');
  subtitle.fontName = FONT;
  subtitle.fontSize = 14;
  subtitle.textColor = Color.slate600;
  subtitle.margin = new Thickness(0, 0, 0, 16);
  doc.add(subtitle);

  // ── Unicode Symbols (Latin-1 range - covered by NotoSans) ────────────────
  doc.add(heading('Unicode Symbols:'));
  doc.add(sym('• Bullet point (U+2022)'));
  doc.add(sym('© Copyright (U+00A9)   ® Registered (U+00AE)   ™ Trademark (U+2122)'));
  doc.add(sym('– En-dash (U+2013)  - Em-dash (U+2014)'));
  doc.add(sym('± Plus-minus  × Multiply  ÷ Divide', 12));

  // ── Currency Symbols (covered by NotoSans) ────────────────────────────────
  doc.add(heading('Currency Symbols:'));
  doc.add(sym('€ Euro  £ Pound  ¥ Yen  ₹ Rupee', 12));

  // ── Arrows & Math (U+2190–U+22FF - NotoSansMath) ────────────────────────
  // These blocks are absent from NotoSansSymbols and NotoSansSymbols2.
  // NotoSansMath explicitly covers both Arrows and Mathematical Operators.
  const mathBlock = (text: string, bottom = 0): TextBlock => {
    const b = new TextBlock(text);
    b.fontName = MATH_FONT;
    b.fontSize = 11;
    b.textColor = Color.slate600;
    if (bottom) b.margin = new Thickness(0, 0, 0, bottom);
    return b;
  };
  // ── Dingbats & Misc Symbols (U+2600–U+27FF - NotoSansSymbols2) ───────────
  const symBlock = (text: string, bottom = 0): TextBlock => {
    const b = new TextBlock(text);
    b.fontName = SYMBOLS_FONT;
    b.fontSize = 11;
    b.textColor = Color.slate600;
    if (bottom) b.margin = new Thickness(0, 0, 0, bottom);
    return b;
  };

  doc.add(heading('Arrows (via NotoSansMath):'));
  doc.add(mathBlock('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪', 8));

  doc.add(heading('Mathematical Symbols (via NotoSansMath):'));
  doc.add(mathBlock('≠ Not equal   ≤ Less-equal   ≥ Greater-equal   ∞ Infinity'));
  doc.add(mathBlock('∑ Sum   ∏ Product   √ Root   ∫ Integral   ± Plus-minus', 8));

  doc.add(heading('Dingbats (via NotoSansSymbols2):'));
  doc.add(symBlock('✓ Check   ✗ Cross   ★ Star   ♠ Spade   ♥ Heart   ♦ Diamond   ♣ Club', 12));

  // ── Greek Letters ──────────────────────────────────────────────────────────
  doc.add(heading('Greek Letters:'));
  doc.add(sym('α Alpha  β Beta  γ Gamma  δ Delta  π Pi  Ω Omega', 16));

  // ── Mixed fonts ────────────────────────────────────────────────────────────
  doc.add(heading('Mixed Font Demonstration:'));

  const stdLine = new TextBlock('This line uses standard Helvetica (Type1, not embedded)');
  stdLine.fontName = StandardFonts.Helvetica;
  stdLine.fontSize = 11;
  stdLine.textColor = Color.slate600;
  doc.add(stdLine);

  const embeddedLine = new TextBlock('This line uses an embedded TrueType font - full Unicode range supported');
  embeddedLine.fontName = FONT;
  embeddedLine.fontSize = 11;
  embeddedLine.textColor = Color.slate600;
  embeddedLine.margin = new Thickness(0, 0, 0, 16);
  doc.add(embeddedLine);

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = new TextBlock(`© ${new Date().getFullYear()} BonniePDF • TrueType Font Embedding`);
  footer.fontName = FONT;
  footer.fontSize = 10;
  footer.textColor = Color.slate400;
  doc.add(footer);

  return doc;
}
