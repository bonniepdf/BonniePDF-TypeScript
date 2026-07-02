/**
 * Emojis & Unicode - full Unicode range including supplementary planes.
 *
 * Two fonts are used:
 *
 *   TEXT_FONT  - NotoSans-Regular.ttf
 *     Covers the entire Basic Multilingual Plane: Latin, Greek, Cyrillic,
 *     arrows, mathematical operators, currency symbols, box-drawing, etc.
 *     Place at:  public/fonts/NotoSans-Regular.ttf
 *
 *   EMOJI_FONT - NotoEmoji-Regular.ttf
 *     Monochrome TrueType emoji font covering the Supplementary Multilingual
 *     Plane (U+1F000 and above).  The subsetter needs glyf-based outlines;
 *     NotoEmoji Regular (single-weight, non-color variant) satisfies this.
 *     Place at:  public/fonts/NotoEmoji-Regular.ttf
 *
 * Font downloads (free / open-source):
 *   NotoSans     → https://fonts.google.com/noto/specimen/Noto+Sans
 *   NotoEmoji    → https://fonts.google.com/noto/specimen/Noto+Emoji
 *                  (choose the "static" download for the plain TTF)
 *
 * Without the fonts at those paths the example falls back to a console
 * warning and renders .notdef boxes for missing glyphs.
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  TextBlock,
  Color,
  ColorPalette,
  Thickness,
  TextStyle,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

// Fonts served as static assets from public/fonts/
const TEXT_FONT = '/fonts/NotoSans-Regular.ttf'; // Latin, Greek, Cyrillic, currency
// NotoSansMath covers Arrows (U+2190–U+21FF) and Mathematical Operators
// (U+2200–U+22FF).  Neither NotoSansSymbols nor NotoSansSymbols2 contains
// these blocks - they must be routed through NotoSansMath.
const MATH_FONT = '/fonts/NotoSansMath-Regular.ttf';
// NotoSansSymbols2 covers Miscellaneous Symbols (U+2600) and Dingbats (U+2700).
const SYMBOLS_FONT = '/fonts/NotoSansSymbols2-Regular.ttf'; // Misc symbols, dingbats
const EMOJI_FONT = '/fonts/NotoEmoji-Regular.ttf'; // Supplementary emoji (U+1F000+)

// ── Document ───────────────────────────────────────────────────────────────────

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.conformance = PdfAConformance.None;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);
  // PDF/A is intentionally not claimed because emoji fonts can include tables that archival validators reject.

  const metadata = new DocumentMetadata();
  metadata.title = 'Emoji & Unicode Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Full Unicode range including supplementary planes';

  const doc = new Document(settings, metadata);

  // Title
  const title = new TextBlock('Emoji & Supplementary Unicode Support');
  title.fontName = TEXT_FONT;
  title.fontSize = 22;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 6);
  doc.add(title);

  const intro = new TextBlock(
    'BonniePDF embeds TrueType subsets for the full Unicode range. ' +
      'Latin, Greek, and Cyrillic render via NotoSans; arrows and math via NotoSansMath; ' +
      'symbols and dingbats via NotoSansSymbols2; emoji via NotoEmoji.'
  );
  intro.fontName = TEXT_FONT;
  intro.fontSize = 11;
  intro.textColor = ColorPalette.slate[500];
  intro.margin = new Thickness(0, 0, 0, 20);
  doc.add(intro);

  // ── BMP characters (NotoSans) ─────────────────────────────────────────────

  const unicodeHeading1 = new TextBlock('Arrows (U+2190 – U+21FF)');
  unicodeHeading1.fontName = TEXT_FONT;
  unicodeHeading1.fontSize = 13;
  unicodeHeading1.textColor = ColorPalette.slate[700];
  unicodeHeading1.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading1);
  const mathLine1 = new TextBlock('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪  ↖ ↗ ↘ ↙');
  mathLine1.fontName = MATH_FONT;
  mathLine1.fontSize = 12;
  mathLine1.textColor = ColorPalette.slate[600];
  mathLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(mathLine1);

  const unicodeHeading2 = new TextBlock('Mathematical Operators (U+2200 – U+22FF)');
  unicodeHeading2.fontName = TEXT_FONT;
  unicodeHeading2.fontSize = 13;
  unicodeHeading2.textColor = ColorPalette.slate[700];
  unicodeHeading2.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading2);
  const mathLine2 = new TextBlock('∀ ∃ ∈ ∉ ∋  ∑ ∏ ∫ √ ∞  ≈ ≠ ≡ ≤ ≥  ⊕ ⊗ ⊂ ⊃');
  mathLine2.fontName = MATH_FONT;
  mathLine2.fontSize = 12;
  mathLine2.textColor = ColorPalette.slate[600];
  mathLine2.margin = new Thickness(0, 0, 0, 4);
  doc.add(mathLine2);

  const unicodeHeading3 = new TextBlock('Currency Symbols');
  unicodeHeading3.fontName = TEXT_FONT;
  unicodeHeading3.fontSize = 13;
  unicodeHeading3.textColor = ColorPalette.slate[700];
  unicodeHeading3.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading3);
  const unicodeLine1 = new TextBlock('€  £  ¥  ¢  ₹  ₩  ₿  ₪  ₫  ₽');
  unicodeLine1.fontName = TEXT_FONT;
  unicodeLine1.fontSize = 12;
  unicodeLine1.textColor = ColorPalette.slate[600];
  unicodeLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(unicodeLine1);

  const unicodeHeading4 = new TextBlock('Greek Alphabet');
  unicodeHeading4.fontName = TEXT_FONT;
  unicodeHeading4.fontSize = 13;
  unicodeHeading4.textColor = ColorPalette.slate[700];
  unicodeHeading4.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading4);
  const unicodeLine2 = new TextBlock('α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω');
  unicodeLine2.fontName = TEXT_FONT;
  unicodeLine2.fontSize = 12;
  unicodeLine2.textColor = ColorPalette.slate[600];
  unicodeLine2.margin = new Thickness(0, 0, 0, 2);
  doc.add(unicodeLine2);
  const unicodeLine3 = new TextBlock('Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω');
  unicodeLine3.fontName = TEXT_FONT;
  unicodeLine3.fontSize = 12;
  unicodeLine3.textColor = ColorPalette.slate[600];
  unicodeLine3.margin = new Thickness(0, 0, 0, 4);
  doc.add(unicodeLine3);

  const unicodeHeading5 = new TextBlock('Cyrillic');
  unicodeHeading5.fontName = TEXT_FONT;
  unicodeHeading5.fontSize = 13;
  unicodeHeading5.textColor = ColorPalette.slate[700];
  unicodeHeading5.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading5);
  const unicodeLine4 = new TextBlock('А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я');
  unicodeLine4.fontName = TEXT_FONT;
  unicodeLine4.fontSize = 12;
  unicodeLine4.textColor = ColorPalette.slate[600];
  unicodeLine4.margin = new Thickness(0, 0, 0, 4);
  doc.add(unicodeLine4);

  const unicodeHeading6 = new TextBlock('Miscellaneous Symbols (U+2600 – U+26FF)');
  unicodeHeading6.fontName = TEXT_FONT;
  unicodeHeading6.fontSize = 13;
  unicodeHeading6.textColor = ColorPalette.slate[700];
  unicodeHeading6.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading6);
  const symbolLine1 = new TextBlock('☀ ☁ ☂ ☃ ☄ ★ ☆ ♠ ♣ ♥ ♦ ☺ ☻ ♻ ⚡ ⚽ ⚾ ⛄ ⛅ ⛪ ⛽');
  symbolLine1.fontName = SYMBOLS_FONT;
  symbolLine1.fontSize = 12;
  symbolLine1.textColor = ColorPalette.slate[600];
  symbolLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(symbolLine1);

  const unicodeHeading7 = new TextBlock('Dingbats (U+2700 – U+27BF)');
  unicodeHeading7.fontName = TEXT_FONT;
  unicodeHeading7.fontSize = 13;
  unicodeHeading7.textColor = ColorPalette.slate[700];
  unicodeHeading7.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading7);
  const symbolLine2 = new TextBlock('✀ ✁ ✂ ✃ ✄ ✆ ✇ ✈ ✉ ✊ ✋ ✌ ✍ ✎ ✏ ✐ ✑ ✒ ✓ ✗ ✘');
  symbolLine2.fontName = SYMBOLS_FONT;
  symbolLine2.fontSize = 12;
  symbolLine2.textColor = ColorPalette.slate[600];
  symbolLine2.margin = new Thickness(0, 0, 0, 12);
  doc.add(symbolLine2);

  // ── Supplementary plane emoji (NotoEmoji) ─────────────────────────────────

  const unicodeHeading8 = new TextBlock('Emoji Faces (U+1F600 – U+1F64F)');
  unicodeHeading8.fontName = TEXT_FONT;
  unicodeHeading8.fontSize = 13;
  unicodeHeading8.textColor = ColorPalette.slate[700];
  unicodeHeading8.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading8);
  const emojiLine1 = new TextBlock('😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😍 😎 🤩');
  emojiLine1.fontName = EMOJI_FONT;
  emojiLine1.fontSize = 20;
  emojiLine1.textColor = ColorPalette.slate[800];
  emojiLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine1);

  const unicodeHeading9 = new TextBlock('Hand Gestures');
  unicodeHeading9.fontName = TEXT_FONT;
  unicodeHeading9.fontSize = 13;
  unicodeHeading9.textColor = ColorPalette.slate[700];
  unicodeHeading9.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading9);
  const emojiLine2 = new TextBlock('👍 👎 👋 🤚 ✋ 🖐 👌 ✌ 🤞 👈 👉 👆 👇 👏');
  emojiLine2.fontName = EMOJI_FONT;
  emojiLine2.fontSize = 20;
  emojiLine2.textColor = ColorPalette.slate[800];
  emojiLine2.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine2);

  const unicodeHeading10 = new TextBlock('Animals & Nature');
  unicodeHeading10.fontName = TEXT_FONT;
  unicodeHeading10.fontSize = 13;
  unicodeHeading10.textColor = ColorPalette.slate[700];
  unicodeHeading10.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading10);
  const emojiLine3 = new TextBlock('🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸');
  emojiLine3.fontName = EMOJI_FONT;
  emojiLine3.fontSize = 20;
  emojiLine3.textColor = ColorPalette.slate[800];
  emojiLine3.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine3);

  const unicodeHeading11 = new TextBlock('Food & Drink');
  unicodeHeading11.fontName = TEXT_FONT;
  unicodeHeading11.fontSize = 13;
  unicodeHeading11.textColor = ColorPalette.slate[700];
  unicodeHeading11.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading11);
  const emojiLine4 = new TextBlock('🍎 🍊 🍋 🍇 🍓 🍒 🍑 🥝 🍍 🥑 🌽 🥕 🍕 🍔');
  emojiLine4.fontName = EMOJI_FONT;
  emojiLine4.fontSize = 20;
  emojiLine4.textColor = ColorPalette.slate[800];
  emojiLine4.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine4);

  const unicodeHeading12 = new TextBlock('Objects & Symbols');
  unicodeHeading12.fontName = TEXT_FONT;
  unicodeHeading12.fontSize = 13;
  unicodeHeading12.textColor = ColorPalette.slate[700];
  unicodeHeading12.margin = new Thickness(0, 14, 0, 4);
  doc.add(unicodeHeading12);
  const emojiLine5 = new TextBlock('🚀 🌈 🎉 🎵 💡 🔥 ⭐ 💯 🏆 🎯 📱 💻 🖥️ ⌨️');
  emojiLine5.fontName = EMOJI_FONT;
  emojiLine5.fontSize = 20;
  emojiLine5.textColor = ColorPalette.slate[800];
  emojiLine5.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine5);

  return doc;
}
