/**
 * Emojis & Unicode — full Unicode range including supplementary planes.
 *
 * Two fonts are used:
 *
 *   TEXT_FONT  — NotoSans-Regular.ttf
 *     Covers the entire Basic Multilingual Plane: Latin, Greek, Cyrillic,
 *     arrows, mathematical operators, currency symbols, box-drawing, etc.
 *     Place at:  public/fonts/NotoSans-Regular.ttf
 *
 *   EMOJI_FONT — NotoEmoji-Regular.ttf
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
  Thickness,
  TextStyle,
} from '@bonniepdf/core';

// Fonts served as static assets from public/fonts/
const TEXT_FONT = '/fonts/NotoSans-Regular.ttf'; // Latin, Greek, Cyrillic, currency
// NotoSansMath covers Arrows (U+2190–U+21FF) and Mathematical Operators
// (U+2200–U+22FF).  Neither NotoSansSymbols nor NotoSansSymbols2 contains
// these blocks — they must be routed through NotoSansMath.
const MATH_FONT = '/fonts/NotoSansMath-Regular.ttf';
// NotoSansSymbols2 covers Miscellaneous Symbols (U+2600) and Dingbats (U+2700).
const SYMBOLS_FONT = '/fonts/NotoSansSymbols2-Regular.ttf'; // Misc symbols, dingbats
const EMOJI_FONT = '/fonts/NotoEmoji-Regular.ttf'; // Supplementary emoji (U+1F000+)

// ── Helpers ────────────────────────────────────────────────────────────────────

function heading(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = TEXT_FONT;
  b.fontSize = 13;
  b.textColor = Color.slate700;
  b.margin = new Thickness(0, 14, 0, 4);
  return b;
}

function uniLine(text: string, bottom = 0): TextBlock {
  const b = new TextBlock(text);
  b.fontName = TEXT_FONT;
  b.fontSize = 12;
  b.textColor = Color.slate600;
  if (bottom) b.margin = new Thickness(0, 0, 0, bottom);
  return b;
}

// Arrows & math operators — routed through NotoSansMath
function mathLine(text: string, bottom = 0): TextBlock {
  const b = new TextBlock(text);
  b.fontName = MATH_FONT;
  b.fontSize = 12;
  b.textColor = Color.slate600;
  if (bottom) b.margin = new Thickness(0, 0, 0, bottom);
  return b;
}

// Misc symbols & dingbats — routed through NotoSansSymbols2
function symLine(text: string, bottom = 0): TextBlock {
  const b = new TextBlock(text);
  b.fontName = SYMBOLS_FONT;
  b.fontSize = 12;
  b.textColor = Color.slate600;
  if (bottom) b.margin = new Thickness(0, 0, 0, bottom);
  return b;
}

function emojiLine(text: string): TextBlock {
  const b = new TextBlock(text);
  b.fontName = EMOJI_FONT;
  b.fontSize = 20;
  b.textColor = Color.slate800;
  b.margin = new Thickness(0, 0, 0, 4);
  return b;
}

// ── Document ───────────────────────────────────────────────────────────────────

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  // PDF/A compliance is disabled here — color emoji fonts often contain
  // proprietary tables (COLR, CBDT) that require relaxed validation.
  settings.pdfAEnabled = false;

  const metadata = new DocumentMetadata();
  metadata.title = 'Emoji & Unicode Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Full Unicode range including supplementary planes';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  // Title
  const title = new TextBlock('Emoji & Supplementary Unicode Support');
  title.fontName = TEXT_FONT;
  title.fontSize = 22;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 0, 0, 6);
  doc.add(title);

  const intro = new TextBlock(
    'BonniePDF embeds TrueType subsets for the full Unicode range. ' +
      'Latin, Greek, and Cyrillic render via NotoSans; arrows and math via NotoSansMath; ' +
      'symbols and dingbats via NotoSansSymbols2; emoji via NotoEmoji.'
  );
  intro.fontName = TEXT_FONT;
  intro.fontSize = 11;
  intro.textColor = Color.slate500;
  intro.margin = new Thickness(0, 0, 0, 20);
  doc.add(intro);

  // ── BMP characters (NotoSans) ─────────────────────────────────────────────

  doc.add(heading('Arrows (U+2190 – U+21FF)'));
  doc.add(mathLine('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪  ↖ ↗ ↘ ↙', 4));

  doc.add(heading('Mathematical Operators (U+2200 – U+22FF)'));
  doc.add(mathLine('∀ ∃ ∈ ∉ ∋  ∑ ∏ ∫ √ ∞  ≈ ≠ ≡ ≤ ≥  ⊕ ⊗ ⊂ ⊃', 4));

  doc.add(heading('Currency Symbols'));
  doc.add(uniLine('€  £  ¥  ¢  ₹  ₩  ₿  ₪  ₫  ₽', 4));

  doc.add(heading('Greek Alphabet'));
  doc.add(uniLine('α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω', 2));
  doc.add(uniLine('Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω', 4));

  doc.add(heading('Cyrillic'));
  doc.add(uniLine('А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я', 4));

  doc.add(heading('Miscellaneous Symbols (U+2600 – U+26FF)'));
  doc.add(symLine('☀ ☁ ☂ ☃ ☄ ★ ☆ ♠ ♣ ♥ ♦ ☺ ☻ ♻ ⚡ ⚽ ⚾ ⛄ ⛅ ⛪ ⛽', 4));

  doc.add(heading('Dingbats (U+2700 – U+27BF)'));
  doc.add(symLine('✀ ✁ ✂ ✃ ✄ ✆ ✇ ✈ ✉ ✊ ✋ ✌ ✍ ✎ ✏ ✐ ✑ ✒ ✓ ✗ ✘', 12));

  // ── Supplementary plane emoji (NotoEmoji) ─────────────────────────────────

  doc.add(heading('Emoji Faces (U+1F600 – U+1F64F)'));
  doc.add(emojiLine('😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😍 😎 🤩'));

  doc.add(heading('Hand Gestures'));
  doc.add(emojiLine('👍 👎 👋 🤚 ✋ 🖐 👌 ✌ 🤞 👈 👉 👆 👇 👏'));

  doc.add(heading('Animals & Nature'));
  doc.add(emojiLine('🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸'));

  doc.add(heading('Food & Drink'));
  doc.add(emojiLine('🍎 🍊 🍋 🍇 🍓 🍒 🍑 🥝 🍍 🥑 🌽 🥕 🍕 🍔'));

  doc.add(heading('Objects & Symbols'));
  doc.add(emojiLine('🚀 🌈 🎉 🎵 💡 🔥 ⭐ 💯 🏆 🎯 📱 💻 🖥️ ⌨️'));

  return doc;
}
