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
  ColorPalette,
  Thickness,
  PdfAConformance,
} from '@bonniepdf/core';

// (COLR, CBDT) that are incompatible with PDF/A-1b. PDF/UA-1 is still set.
const TEXT_FONT = '/fonts/NotoSans-Regular.ttf';
const MATH_FONT = '/fonts/NotoSansMath-Regular.ttf';
const SYMBOLS_FONT = '/fonts/NotoSansSymbols2-Regular.ttf';
const EMOJI_FONT = '/fonts/NotoEmoji-Regular.ttf';

// Section headings always use TEXT_FONT (NotoSans) for the Latin label -
// the section's body content uses the relevant symbol / emoji font, but the
// heading itself ("Emoji Faces", "Mathematical Operators", …) is plain Latin
// text and must be rendered with a Latin-capable font, otherwise glyphs come
// out as .notdef boxes.
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.conformance = PdfAConformance.None;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);
  // PDF/A is intentionally not claimed because emoji fonts can include tables that archival validators reject.

  const metadata = new DocumentMetadata();
  metadata.title = 'Emojis & Unicode - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Full Unicode range including supplementary planes in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, emoji, unicode, fonts';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Emojis & Supplementary Unicode - PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = TEXT_FONT;
  h1.fontSize = 20;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 8);
  doc.add(h1);

  const intro = new TextBlock(
    'BonniePDF embeds TrueType subsets for the full Unicode range. ' +
      'Latin, Greek, and Cyrillic via NotoSans; arrows and math via NotoSansMath; ' +
      'symbols and dingbats via NotoSansSymbols2; emoji via NotoEmoji.'
  );
  intro.fontName = TEXT_FONT;
  intro.fontSize = 11;
  intro.textColor = ColorPalette.slate[500];
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── Arrows ────────────────────────────────────────────────────────────────
  const sectionHeading1 = new Heading('Arrows (U+2190 – U+21FF)');
  sectionHeading1.tocIdentifier = 's-arrows';
  sectionHeading1.level = 2;
  sectionHeading1.fontName = TEXT_FONT;
  sectionHeading1.fontSize = 13;
  sectionHeading1.textColor = ColorPalette.slate[700];
  sectionHeading1.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading1);
  const mathLine1 = new TextBlock('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪  ↖ ↗ ↘ ↙');
  mathLine1.fontName = MATH_FONT;
  mathLine1.fontSize = 12;
  mathLine1.textColor = ColorPalette.slate[600];
  mathLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(mathLine1);

  // ── Math operators ────────────────────────────────────────────────────────
  const sectionHeading2 = new Heading('Mathematical Operators (U+2200 – U+22FF)');
  sectionHeading2.tocIdentifier = 's-math';
  sectionHeading2.level = 2;
  sectionHeading2.fontName = TEXT_FONT;
  sectionHeading2.fontSize = 13;
  sectionHeading2.textColor = ColorPalette.slate[700];
  sectionHeading2.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading2);
  const mathLine2 = new TextBlock('∀ ∃ ∈ ∉ ∋  ∑ ∏ ∫ √ ∞  ≈ ≠ ≡ ≤ ≥  ⊕ ⊗ ⊂ ⊃');
  mathLine2.fontName = MATH_FONT;
  mathLine2.fontSize = 12;
  mathLine2.textColor = ColorPalette.slate[600];
  mathLine2.margin = new Thickness(0, 0, 0, 4);
  doc.add(mathLine2);

  // ── Currency ──────────────────────────────────────────────────────────────
  const sectionHeading3 = new Heading('Currency Symbols');
  sectionHeading3.tocIdentifier = 's-currency';
  sectionHeading3.level = 2;
  sectionHeading3.fontName = TEXT_FONT;
  sectionHeading3.fontSize = 13;
  sectionHeading3.textColor = ColorPalette.slate[700];
  sectionHeading3.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading3);
  const unicodeLine1 = new TextBlock('€  £  ¥  ¢  ₹  ₩  ₿  ₪  ₫  ₽');
  unicodeLine1.fontName = TEXT_FONT;
  unicodeLine1.fontSize = 12;
  unicodeLine1.textColor = ColorPalette.slate[600];
  unicodeLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(unicodeLine1);

  // ── Greek ─────────────────────────────────────────────────────────────────
  const sectionHeading4 = new Heading('Greek Alphabet');
  sectionHeading4.tocIdentifier = 's-greek';
  sectionHeading4.level = 2;
  sectionHeading4.fontName = TEXT_FONT;
  sectionHeading4.fontSize = 13;
  sectionHeading4.textColor = ColorPalette.slate[700];
  sectionHeading4.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading4);
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

  // ── Cyrillic ──────────────────────────────────────────────────────────────
  const sectionHeading5 = new Heading('Cyrillic');
  sectionHeading5.tocIdentifier = 's-cyrillic';
  sectionHeading5.level = 2;
  sectionHeading5.fontName = TEXT_FONT;
  sectionHeading5.fontSize = 13;
  sectionHeading5.textColor = ColorPalette.slate[700];
  sectionHeading5.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading5);
  const unicodeLine4 = new TextBlock('А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я');
  unicodeLine4.fontName = TEXT_FONT;
  unicodeLine4.fontSize = 12;
  unicodeLine4.textColor = ColorPalette.slate[600];
  unicodeLine4.margin = new Thickness(0, 0, 0, 4);
  doc.add(unicodeLine4);

  // ── Misc symbols ──────────────────────────────────────────────────────────
  const sectionHeading6 = new Heading('Miscellaneous Symbols (U+2600 – U+26FF)');
  sectionHeading6.tocIdentifier = 's-misc';
  sectionHeading6.level = 2;
  sectionHeading6.fontName = TEXT_FONT;
  sectionHeading6.fontSize = 13;
  sectionHeading6.textColor = ColorPalette.slate[700];
  sectionHeading6.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading6);
  const symbolLine1 = new TextBlock('☀ ☁ ☂ ☃ ☄ ★ ☆ ♠ ♣ ♥ ♦ ☺ ☻ ♻ ⚡ ⚽ ⚾ ⛄ ⛅ ⛪ ⛽');
  symbolLine1.fontName = SYMBOLS_FONT;
  symbolLine1.fontSize = 12;
  symbolLine1.textColor = ColorPalette.slate[600];
  symbolLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(symbolLine1);

  // ── Dingbats ──────────────────────────────────────────────────────────────
  const sectionHeading7 = new Heading('Dingbats (U+2700 – U+27BF)');
  sectionHeading7.tocIdentifier = 's-dingbats';
  sectionHeading7.level = 2;
  sectionHeading7.fontName = TEXT_FONT;
  sectionHeading7.fontSize = 13;
  sectionHeading7.textColor = ColorPalette.slate[700];
  sectionHeading7.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading7);
  const symbolLine2 = new TextBlock('✀ ✁ ✂ ✃ ✄ ✆ ✇ ✈ ✉ ✊ ✋ ✌ ✍ ✎ ✏ ✐ ✑ ✒ ✓ ✗ ✘');
  symbolLine2.fontName = SYMBOLS_FONT;
  symbolLine2.fontSize = 12;
  symbolLine2.textColor = ColorPalette.slate[600];
  symbolLine2.margin = new Thickness(0, 0, 0, 12);
  doc.add(symbolLine2);

  // ── Emoji faces ───────────────────────────────────────────────────────────
  const sectionHeading8 = new Heading('Emoji Faces (U+1F600 – U+1F64F)');
  sectionHeading8.tocIdentifier = 's-faces';
  sectionHeading8.level = 2;
  sectionHeading8.fontName = TEXT_FONT;
  sectionHeading8.fontSize = 13;
  sectionHeading8.textColor = ColorPalette.slate[700];
  sectionHeading8.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading8);
  const emojiLine1 = new TextBlock('😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😍 😎 🤩');
  emojiLine1.fontName = EMOJI_FONT;
  emojiLine1.fontSize = 20;
  emojiLine1.textColor = ColorPalette.slate[800];
  emojiLine1.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine1);

  // ── Hand gestures ─────────────────────────────────────────────────────────
  const sectionHeading9 = new Heading('Hand Gestures');
  sectionHeading9.tocIdentifier = 's-hands';
  sectionHeading9.level = 2;
  sectionHeading9.fontName = TEXT_FONT;
  sectionHeading9.fontSize = 13;
  sectionHeading9.textColor = ColorPalette.slate[700];
  sectionHeading9.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading9);
  const emojiLine2 = new TextBlock('👍 👎 👋 🤚 ✋ 🖐 👌 ✌ 🤞 👈 👉 👆 👇 👏');
  emojiLine2.fontName = EMOJI_FONT;
  emojiLine2.fontSize = 20;
  emojiLine2.textColor = ColorPalette.slate[800];
  emojiLine2.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine2);

  // ── Animals ───────────────────────────────────────────────────────────────
  const sectionHeading10 = new Heading('Animals & Nature');
  sectionHeading10.tocIdentifier = 's-animals';
  sectionHeading10.level = 2;
  sectionHeading10.fontName = TEXT_FONT;
  sectionHeading10.fontSize = 13;
  sectionHeading10.textColor = ColorPalette.slate[700];
  sectionHeading10.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading10);
  const emojiLine3 = new TextBlock('🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸');
  emojiLine3.fontName = EMOJI_FONT;
  emojiLine3.fontSize = 20;
  emojiLine3.textColor = ColorPalette.slate[800];
  emojiLine3.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine3);

  // ── Objects ───────────────────────────────────────────────────────────────
  const sectionHeading11 = new Heading('Objects & Symbols');
  sectionHeading11.tocIdentifier = 's-objects';
  sectionHeading11.level = 2;
  sectionHeading11.fontName = TEXT_FONT;
  sectionHeading11.fontSize = 13;
  sectionHeading11.textColor = ColorPalette.slate[700];
  sectionHeading11.margin = new Thickness(0, 12, 0, 4);
  doc.add(sectionHeading11);
  const emojiLine4 = new TextBlock('🚀 🌈 🎉 🎵 💡 🔥 ⭐ 💯 🏆 🎯 📱 💻');
  emojiLine4.fontName = EMOJI_FONT;
  emojiLine4.fontSize = 20;
  emojiLine4.textColor = ColorPalette.slate[800];
  emojiLine4.margin = new Thickness(0, 0, 0, 4);
  doc.add(emojiLine4);

  return doc;
}
