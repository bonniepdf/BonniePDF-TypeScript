/**
 * Custom Fonts.
 * TrueType font embedding with Unicode coverage: symbols, currency, arrows, maths, dingbats, and Greek across NotoSans, NotoSansMath, and NotoSansSymbols2.
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
import { Document, Heading, TextBlock, StandardFonts } from '@bonniepdf/core';

export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Noto Sans', fontSize: 11, color: 'slate-600' },
    },
    metadata: {
      title: 'Custom Fonts',
      author: 'BonniePDF',
      subject: 'TrueType font embedding with Unicode coverage. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, pdf/ua, pdf/a, accessibility, fonts, unicode, truetype',
    },
  });

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

  doc.add(
    new Heading('Custom Fonts — TrueType Embedding', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: FONT,
      fontSize: 22,
      color: 'slate-800',
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'BonniePDF embeds compact glyph subsets of TrueType fonts directly in the PDF — ' +
        'only the characters actually used are stored. Fonts with different Unicode coverage ' +
        'can be mixed within a single document by setting fontName per block.',
      { fontName: FONT, margin: { bottom: 16 } }
    )
  );

  // ── 1. Unicode Symbols ────────────────────────────────────────────────────────

  section(doc, 'Unicode Symbols', 's-symbols');

  for (const text of [
    '• Bullet (U+2022)  © Copyright (U+00A9)  ® Registered (U+00AE)  ™ Trademark (U+2122)',
    '– En-dash (U+2013)  — Em-dash (U+2014)',
    '± Plus-minus  × Multiply  ÷ Divide',
  ]) {
    doc.add(new TextBlock(text, { fontName: FONT, margin: { bottom: 4 } }));
  }

  // ── 2. Currency Symbols ───────────────────────────────────────────────────────

  section(doc, 'Currency Symbols', 's-currency');

  doc.add(new TextBlock('€ Euro  £ Pound  ¥ Yen  ₹ Rupee  ₿ Bitcoin', { fontName: FONT, margin: { bottom: 4 } }));

  // ── 3. Arrows (NotoSansMath) ──────────────────────────────────────────────────

  section(doc, 'Arrows (via NotoSansMath)', 's-arrows');

  doc.add(new TextBlock('← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪', { fontName: MATH_FONT, margin: { bottom: 4 } }));

  // ── 4. Mathematical Operators (NotoSansMath) ──────────────────────────────────

  section(doc, 'Mathematical Operators (via NotoSansMath)', 's-math');

  for (const text of [
    '≠ Not equal  ≤ Less-equal  ≥ Greater-equal  ∞ Infinity',
    '∑ Sum  ∏ Product  √ Root  ∫ Integral',
  ]) {
    doc.add(new TextBlock(text, { fontName: MATH_FONT, margin: { bottom: 4 } }));
  }

  // ── 5. Dingbats (NotoSansSymbols2) ───────────────────────────────────────────

  section(doc, 'Dingbats (via NotoSansSymbols2)', 's-dingbats');

  doc.add(
    new TextBlock('✓ Check  ✗ Cross  ★ Star  ♠ Spade  ♥ Heart  ♦ Diamond  ♣ Club', {
      fontName: SYMBOLS_FONT,
      margin: { bottom: 4 },
    })
  );

  // ── 6. Greek Letters ──────────────────────────────────────────────────────────

  section(doc, 'Greek Letters', 's-greek');

  doc.add(new TextBlock('α Alpha  β Beta  γ Gamma  δ Delta  π Pi  Ω Omega', { fontName: FONT, margin: { bottom: 4 } }));

  // ── 7. Standard vs Embedded ───────────────────────────────────────────────────

  section(doc, 'Standard vs Embedded', 's-comparison');

  doc.add(
    new TextBlock('Standard Helvetica (Type 1) — limited to the WinAnsi charset.', {
      fontName: StandardFonts.Helvetica,
      margin: { bottom: 4 },
    })
  );

  doc.add(
    new TextBlock('Embedded NotoSans (TrueType) — full Unicode range, subsetting keeps file size compact.', {
      fontName: FONT,
    })
  );

  function section(doc: Document, title: string, tocId: string): void {
    doc.add(
      new Heading(title, {
        tocIdentifier: tocId,
        level: 2,
        fontName: FONT,
        fontSize: 13,
        color: 'indigo-600',
        margin: { top: 12, bottom: 6 },
      })
    );
  }

  return doc;
}
