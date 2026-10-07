/**
 * Emojis & Unicode.
 * Full Unicode range: BMP symbols, Greek, Cyrillic, dingbats, and supplementary emoji across multiple embedded fonts, with a mixed text and emoji status line.
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
 * Authored through the options-object front door: fonts are `fontName` strings.
 *
 * Font downloads (free / open-source):
 *   https://fonts.google.com/noto
 */
import { Document, Heading, TextBlock, RichText, TextStyle, VerticalStack, PdfVersion } from '@bonniepdf/core';

const TEXT_FONT = '/fonts/NotoSans-Regular.ttf';
const MATH_FONT = '/fonts/NotoSansMath-Regular.ttf';
const SYMBOLS_FONT = '/fonts/NotoSansSymbols2-Regular.ttf';
const EMOJI_FONT = '/fonts/NotoEmoji-Regular.ttf';

export function generate(): Document {
  const doc = new Document({
    settings: {
      // PDF/A intentionally not claimed — emoji fonts include COLR/CBDT tables
      // that archival validators reject. PDF/UA-1 is still applied; set the
      // version explicitly to PDF 1.7 (required for PDF/UA-1).
      version: PdfVersion.Pdf17,
      conformance: 'none',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: TEXT_FONT, fontSize: 11, color: 'slate-600' },
    },
    metadata: {
      title: 'Emojis & Unicode',
      author: 'BonniePDF',
      subject: 'Full Unicode range including supplementary planes. PDF/UA-1.',
      keywords: 'pdf, pdf/ua, accessibility, emoji, unicode, fonts',
    },
  });

  // ── Title ─────────────────────────────────────────────────────────────────────

  doc.add(
    new Heading('Emojis & Supplementary Unicode', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: TEXT_FONT,
      fontSize: 20,
      color: 'slate-800',
      margin: { bottom: 8 },
    })
  );

  doc.add(
    new TextBlock(
      'BonniePDF embeds TrueType subsets for the full Unicode range. ' +
        'Latin, Greek, and Cyrillic via NotoSans; arrows and maths via NotoSansMath; ' +
        'symbols and dingbats via NotoSansSymbols2; emoji via NotoEmoji.',
      { fontName: TEXT_FONT, margin: { bottom: 16 } }
    )
  );

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

  const greek = new VerticalStack({ breakAllowed: false });
  greek.add(sectionHeading('Greek Alphabet', 's-greek'));
  greek.add(
    new TextBlock('α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω', {
      fontName: TEXT_FONT,
      fontSize: 12,
      color: 'slate-600',
      margin: { bottom: 2 },
    })
  );
  greek.add(
    new TextBlock('Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω', {
      fontName: TEXT_FONT,
      fontSize: 12,
      color: 'slate-600',
      margin: { bottom: 4 },
    })
  );
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

  const mixed = new VerticalStack({ breakAllowed: false });
  mixed.add(sectionHeading('Mixed Content', 's-mixed'));

  mixed.add(
    new TextBlock(
      'Emoji appear inline with regular text using RichText spans — Latin text keeps its ' +
        'text-font metrics while each emoji span switches to the emoji font:',
      { fontName: TEXT_FONT, margin: { bottom: 6 } }
    )
  );

  // NotoEmoji contains basic Latin glyphs on wide emoji advances, so setting it
  // as the whole line's font stretches the text — spans keep each script in the
  // font designed for it.
  const emojiStyle = new TextStyle({ fontFamily: EMOJI_FONT });
  for (const [label, emoji, rest] of [
    ['Status: ', '✅', ' All systems operational'],
    ['Build: ', '🚀', ' Deployed to production'],
    ['Tests: ', '🎯', ' 245/245 passed'],
    ['Coverage: ', '📊', ' 94.2%'],
    ['Performance: ', '⚡', ' Response time < 100 ms'],
  ]) {
    mixed.add(new RichText({ margin: { left: 12, bottom: 4 } }).span(label).span(emoji, emojiStyle).span(rest));
  }
  doc.add(mixed);

  return doc;
}

// Local helpers and sample types used by this document.

/** A section heading. Each section is added as one keep-together block, so a heading never sits on a page apart from its content. */
function sectionHeading(title: string, tocId: string): Heading {
  return new Heading(title, {
    tocIdentifier: tocId,
    level: 2,
    fontName: TEXT_FONT,
    fontSize: 13,
    color: 'indigo-600',
    margin: { top: 12, bottom: 4 },
  });
}

function bmpSection(doc: Document, title: string, tocId: string, content: string, font: string): void {
  doc.add(
    new VerticalStack({
      breakAllowed: false,
      children: [
        sectionHeading(title, tocId),
        new TextBlock(content, { fontName: font, fontSize: 12, color: 'slate-600', margin: { bottom: 4 } }),
      ],
    })
  );
}

function emojiSection(doc: Document, title: string, tocId: string, content: string): void {
  doc.add(
    new VerticalStack({
      breakAllowed: false,
      children: [
        sectionHeading(title, tocId),
        new TextBlock(content, { fontName: EMOJI_FONT, fontSize: 20, color: 'slate-800', margin: { bottom: 4 } }),
      ],
    })
  );
}
