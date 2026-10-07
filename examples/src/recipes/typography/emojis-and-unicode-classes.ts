/**
 * Emojis & Unicode (Class API).
 * The same full-Unicode / emoji tour as Emojis & Unicode, built with the class API: construct each element and assign properties. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
/**
 * Emojis & Unicode — full Unicode range including supplementary planes.
 *
 * Four fonts cover different blocks:
 *   NotoSans          — Latin, Greek, Cyrillic, currency (BMP)
 *   NotoSansMath      — Arrows (U+2190–U+21FF) and Mathematical Operators (U+2200–U+22FF)
 *   NotoSansSymbols2  — Miscellaneous Symbols (U+2600) and Dingbats (U+2700)
 *   NotoEmoji         — Supplementary emoji (U+1F000 and above)
 *
 * PDF/A is intentionally not claimed — emoji fonts include COLR/CBDT tables
 * that archival validators reject. PDF/UA-1 accessibility is still applied.
 *
 * Font downloads (free / open-source):
 *   https://fonts.google.com/noto
 */
import {
  Document,
  VerticalStack,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  RichText,
  Heading,
  ColorPalette,
  Thickness,
  PdfAConformance,
  PdfVersion,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `emojis-and-unicode.ts`.
 *
 * Same full-Unicode / emoji tour, authored the long way: `new` each element and
 * assign properties, using `PdfVersion`, `TextStyle`, `Thickness` and
 * `ColorPalette` directly. This is the escape hatch the options-object front
 * door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `emojis-and-unicode.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings();
  // PDF/A intentionally not claimed — emoji fonts include COLR/CBDT tables
  // that archival validators reject. PDF/UA-1 is still applied; set the
  // version explicitly to PDF 1.7 (required for PDF/UA-1).
  settings.version = PdfVersion.Pdf17;
  settings.conformance = PdfAConformance.None;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Noto Sans').withSize(11).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Emojis & Unicode';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Full Unicode range including supplementary planes. PDF/UA-1.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, emoji, unicode, fonts';

  const doc = new Document(settings, metadata);

  // Document-local faces give every symbol the same fallback coverage in any generation order.
  function font(path: string): string {
    const bytes = assets?.get(path);
    if (!bytes) throw new Error(`Supply ${path} in the asset dictionary.`);
    return doc.fonts.add(bytes).fontName;
  }
  const TEXT_FONT = font('fonts/NotoSans-Regular.ttf');
  const MATH_FONT = font('fonts/NotoSansMath-Regular.ttf');
  const SYMBOLS_FONT = font('fonts/NotoSansSymbols2-Regular.ttf');
  const EMOJI_FONT = font('fonts/NotoEmoji-Regular.ttf');
  doc.settings.defaultTextStyle.withFamily(TEXT_FONT);

  // ── Title ─────────────────────────────────────────────────────────────────────

  const h1 = new Heading('Emojis & Supplementary Unicode');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = TEXT_FONT;
  h1.fontSize = 20;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 8);
  doc.add(h1);

  const intro = new TextBlock(
    'BonniePDF embeds TrueType subsets for the full Unicode range. ' +
      'Latin, Greek, and Cyrillic via NotoSans; arrows and maths via NotoSansMath; ' +
      'symbols and dingbats via NotoSansSymbols2; emoji via NotoEmoji.'
  );
  intro.fontName = TEXT_FONT;
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── BMP symbol sections ───────────────────────────────────────────────────────

  bmpSection(doc, 'Arrows (U+2190 – U+21FF)', 's-arrows', '← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪  ↖ ↗ ↘ ↙', MATH_FONT);

  bmpSection(
    doc,
    'Mathematical Operators (U+2200 – U+22FF)',
    's-math',
    '∀ ∃ ∈ ∉ ∋  ∑ ∏ ∫ √ ∞  ≈ ≠ ≡ ≤ ≥  ⊕ ⊗ ⊂ ⊃',
    MATH_FONT
  );

  bmpSection(doc, 'Currency Symbols', 's-currency', '€  £  ¥  ¢  ₹  ₩  ₿  ₪  ₫  ₽', TEXT_FONT);

  const greek = new VerticalStack();
  greek.breakAllowed = false;
  greek.add(sectionHeading('Greek Alphabet', 's-greek'));
  const greekLower = new TextBlock('α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω');
  greekLower.fontName = TEXT_FONT;
  greekLower.fontSize = 12;
  greekLower.color = ColorPalette.slate[600];
  greekLower.margin = new Thickness(0, 0, 0, 2);
  greek.add(greekLower);
  const greekUpper = new TextBlock('Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω');
  greekUpper.fontName = TEXT_FONT;
  greekUpper.fontSize = 12;
  greekUpper.color = ColorPalette.slate[600];
  greekUpper.margin = new Thickness(0, 0, 0, 4);
  greek.add(greekUpper);
  doc.add(greek);

  bmpSection(doc, 'Cyrillic', 's-cyrillic', 'А Б В Г Д Е Ж З И К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я', TEXT_FONT);

  bmpSection(
    doc,
    'Miscellaneous Symbols (U+2600 – U+26FF)',
    's-misc',
    '☀ ☁ ☂ ☃ ☄ ★ ☆ ♠ ♣ ♥ ♦ ☺ ☻ ♻ ⚡ ⚽ ⚾ ⛄ ⛅ ⛪ ⛽',
    SYMBOLS_FONT
  );

  bmpSection(
    doc,
    'Dingbats (U+2700 – U+27BF)',
    's-dingbats',
    '✀ ✁ ✂ ✃ ✄ ✆ ✇ ✈ ✉ ✊ ✋ ✌ ✍ ✎ ✏ ✐ ✑ ✒ ✓ ✗ ✘',
    SYMBOLS_FONT
  );

  // ── Emoji sections ────────────────────────────────────────────────────────────

  emojiSection(doc, 'Emoji Faces (U+1F600 – U+1F64F)', 's-faces', '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😍 😎 🤩');

  emojiSection(doc, 'Hand Gestures', 's-hands', '👍 👎 👋 🤚 ✋ 🖐 👌 ✌ 🤞 👈 👉 👆 👇 👏');

  emojiSection(doc, 'Animals & Nature', 's-animals', '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸');

  emojiSection(doc, 'Food & Drink', 's-food', '🍎 🍊 🍋 🍇 🍓 🍒 🍑 🥝 🍍 🥑 🌽 🥕 🍕 🍔');

  emojiSection(doc, 'Objects & Symbols', 's-objects', '🚀 🌈 🎉 🎵 💡 🔥 ⭐ 💯 🏆 🎯 📱 💻');

  // ── Mixed content ─────────────────────────────────────────────────────────────

  const mixed = new VerticalStack();
  mixed.breakAllowed = false;
  mixed.add(sectionHeading('Mixed Content', 's-mixed'));

  const mixedIntro = new TextBlock(
    'Emoji appear inline with regular text using RichText spans — Latin text keeps its ' +
      'text-font metrics while each emoji span switches to the emoji font:'
  );
  mixedIntro.fontName = TEXT_FONT;
  mixedIntro.margin = new Thickness(0, 0, 0, 6);
  mixed.add(mixedIntro);

  // NotoEmoji contains basic Latin glyphs on wide emoji advances, so setting it
  // as the whole line's font stretches the text — spans keep each script in the
  // font designed for it.
  const emojiStyle = new TextStyle().withFamily(EMOJI_FONT);
  for (const [label, emoji, rest] of [
    ['Status: ', '✅', ' All systems operational'],
    ['Build: ', '🚀', ' Deployed to production'],
    ['Tests: ', '🎯', ' 245/245 passed'],
    ['Coverage: ', '📊', ' 94.2%'],
    ['Performance: ', '⚡', ' Response time < 100 ms'],
  ]) {
    const line = new RichText();
    line.margin = new Thickness(12, 0, 0, 4);
    line.span(label).span(emoji, emojiStyle).span(rest);
    mixed.add(line);
  }
  doc.add(mixed);

  /** A section heading. Each section is added as one keep-together block, so a heading never sits on a page apart from its content. */
  function sectionHeading(title: string, tocId: string): Heading {
    const h = new Heading(title);
    h.tocIdentifier = tocId;
    h.level = 2;
    h.fontName = TEXT_FONT;
    h.fontSize = 13;
    h.color = ColorPalette.indigo[600];
    h.margin = new Thickness(0, 12, 0, 4);
    return h;
  }

  function bmpSection(doc: Document, title: string, tocId: string, content: string, font: string): void {
    const section = new VerticalStack();
    section.breakAllowed = false;
    section.add(sectionHeading(title, tocId));
    const b = new TextBlock(content);
    b.fontName = font;
    b.fontSize = 12;
    b.color = ColorPalette.slate[600];
    b.margin = new Thickness(0, 0, 0, 4);
    section.add(b);
    doc.add(section);
  }

  function emojiSection(doc: Document, title: string, tocId: string, content: string): void {
    const section = new VerticalStack();
    section.breakAllowed = false;
    section.add(sectionHeading(title, tocId));
    const b = new TextBlock(content);
    b.fontName = EMOJI_FONT;
    b.fontSize = 20;
    b.color = ColorPalette.slate[800];
    b.margin = new Thickness(0, 0, 0, 4);
    section.add(b);
    doc.add(section);
  }

  return doc;
}
