import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  Color,
  Thickness,
} from '@bonniepdf/core';

// PDF/A is disabled — emoji colour fonts often contain proprietary tables
// (COLR, CBDT) that are incompatible with PDF/A-1b. PDF/UA-1 is still set.
const TEXT_FONT = '/fonts/NotoSans-Regular.ttf';
const MATH_FONT = '/fonts/NotoSansMath-Regular.ttf';
const SYMBOLS_FONT = '/fonts/NotoSansSymbols2-Regular.ttf';
const EMOJI_FONT = '/fonts/NotoEmoji-Regular.ttf';

// Section headings always use TEXT_FONT (NotoSans) for the Latin label —
// the section's body content uses the relevant symbol / emoji font, but the
// heading itself ("Emoji Faces", "Mathematical Operators", …) is plain Latin
// text and must be rendered with a Latin-capable font, otherwise glyphs come
// out as .notdef boxes.
function sectionHeading(text: string, tocId: string): Heading {
  const h = new Heading(text);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = TEXT_FONT;
  h.fontSize = 13;
  h.textColor = Color.slate700;
  h.margin = new Thickness(0, 14, 0, 4);
  return h;
}

function uniLine(text: string, bottom = 0): TextBlock {
  const b = new TextBlock(text);
  b.fontName = TEXT_FONT;
  b.fontSize = 12;
  b.textColor = Color.slate600;
  if (bottom) b.margin = new Thickness(0, 0, 0, bottom);
  return b;
}

function mathLine(text: string, bottom = 0): TextBlock {
  const b = new TextBlock(text);
  b.fontName = MATH_FONT;
  b.fontSize = 12;
  b.textColor = Color.slate600;
  if (bottom) b.margin = new Thickness(0, 0, 0, bottom);
  return b;
}

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

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = false; // colour emoji fonts are not PDF/A compatible
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = 'Emojis & Unicode — Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Full Unicode range including supplementary planes in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, emoji, unicode, fonts';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(Color.slate600);

  const h1 = new Heading('Emojis & Supplementary Unicode — PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = TEXT_FONT;
  h1.fontSize = 20;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 8);
  doc.add(h1);

  const intro = new TextBlock(
    'BonniePDF embeds TrueType subsets for the full Unicode range. ' +
      'Latin, Greek, and Cyrillic via NotoSans; arrows and math via NotoSansMath; ' +
      'symbols and dingbats via NotoSansSymbols2; emoji via NotoEmoji.'
  );
  intro.fontName = TEXT_FONT;
  intro.fontSize = 11;
  intro.textColor = Color.slate500;
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── Arrows ────────────────────────────────────────────────────────────────
  doc.add(sectionHeading('Arrows (U+2190 – U+21FF)', 's-arrows'));
  doc.add(mathLine('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪  ↖ ↗ ↘ ↙', 4));

  // ── Math operators ────────────────────────────────────────────────────────
  doc.add(sectionHeading('Mathematical Operators (U+2200 – U+22FF)', 's-math'));
  doc.add(mathLine('∀ ∃ ∈ ∉ ∋  ∑ ∏ ∫ √ ∞  ≈ ≠ ≡ ≤ ≥  ⊕ ⊗ ⊂ ⊃', 4));

  // ── Currency ──────────────────────────────────────────────────────────────
  doc.add(sectionHeading('Currency Symbols', 's-currency'));
  doc.add(uniLine('€  £  ¥  ¢  ₹  ₩  ₿  ₪  ₫  ₽', 4));

  // ── Greek ─────────────────────────────────────────────────────────────────
  doc.add(sectionHeading('Greek Alphabet', 's-greek'));
  doc.add(uniLine('α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω', 2));
  doc.add(uniLine('Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω', 4));

  // ── Cyrillic ──────────────────────────────────────────────────────────────
  doc.add(sectionHeading('Cyrillic', 's-cyrillic'));
  doc.add(uniLine('А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я', 4));

  // ── Misc symbols ──────────────────────────────────────────────────────────
  doc.add(sectionHeading('Miscellaneous Symbols (U+2600 – U+26FF)', 's-misc'));
  doc.add(symLine('☀ ☁ ☂ ☃ ☄ ★ ☆ ♠ ♣ ♥ ♦ ☺ ☻ ♻ ⚡ ⚽ ⚾ ⛄ ⛅ ⛪ ⛽', 4));

  // ── Dingbats ──────────────────────────────────────────────────────────────
  doc.add(sectionHeading('Dingbats (U+2700 – U+27BF)', 's-dingbats'));
  doc.add(symLine('✀ ✁ ✂ ✃ ✄ ✆ ✇ ✈ ✉ ✊ ✋ ✌ ✍ ✎ ✏ ✐ ✑ ✒ ✓ ✗ ✘', 12));

  // ── Emoji faces ───────────────────────────────────────────────────────────
  doc.add(sectionHeading('Emoji Faces (U+1F600 – U+1F64F)', 's-faces'));
  doc.add(emojiLine('😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😍 😎 🤩'));

  // ── Hand gestures ─────────────────────────────────────────────────────────
  doc.add(sectionHeading('Hand Gestures', 's-hands'));
  doc.add(emojiLine('👍 👎 👋 🤚 ✋ 🖐 👌 ✌ 🤞 👈 👉 👆 👇 👏'));

  // ── Animals ───────────────────────────────────────────────────────────────
  doc.add(sectionHeading('Animals & Nature', 's-animals'));
  doc.add(emojiLine('🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸'));

  // ── Objects ───────────────────────────────────────────────────────────────
  doc.add(sectionHeading('Objects & Symbols', 's-objects'));
  doc.add(emojiLine('🚀 🌈 🎉 🎵 💡 🔥 ⭐ 💯 🏆 🎯 📱 💻'));

  return doc;
}
