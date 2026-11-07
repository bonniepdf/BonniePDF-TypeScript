/**
 * Custom Fonts.
 * TrueType font embedding: a large specimen of the embedded face, then Unicode coverage in two columns: symbols, currency, arrows, maths, dingbats, and Greek across NotoSans, NotoSansMath, and NotoSansSymbols2.
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
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  TextBlock,
  StandardFonts,
  VerticalStack,
} from '@bonniepdf/core';

/** Which registered face a group of characters is set in. */
type FontRole = 'text' | 'math' | 'symbols';

/** The coverage groups, in two columns: title, contents id, face, and the lines that show them. */
const LEFT_GROUPS: [string, string, FontRole, string[]][] = [
  [
    'Unicode Symbols',
    's-symbols',
    'text',
    ['• Bullet  © Copyright  ® Registered  ™ Trademark', '– En-dash  — Em-dash  ± Plus-minus  × Multiply  ÷ Divide'],
  ],
  ['Currency Symbols', 's-currency', 'text', ['€ Euro  £ Pound  ¥ Yen  ₹ Rupee  ₿ Bitcoin']],
  ['Greek Letters', 's-greek', 'text', ['α Alpha  β Beta  γ Gamma  δ Delta  π Pi  Ω Omega']],
];
const RIGHT_GROUPS: [string, string, FontRole, string[]][] = [
  ['Arrows (via NotoSansMath)', 's-arrows', 'math', ['← ↑ → ↓  ↔ ↕  ⇐ ⇒ ⇔  ↩ ↪']],
  [
    'Mathematical Operators (via NotoSansMath)',
    's-math',
    'math',
    ['≠ Not equal  ≤ Less-equal  ≥ Greater-equal  ∞ Infinity', '∑ Sum  ∏ Product  √ Root  ∫ Integral'],
  ],
  [
    'Dingbats (via NotoSansSymbols2)',
    's-dingbats',
    'symbols',
    ['✓ Check  ✗ Cross  ★ Star  ♠ Spade  ♥ Heart  ♦ Diamond  ♣ Club'],
  ],
];

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

  // ── The embedded face, large ──────────────────────────────────────────────────

  doc.add(
    new Container({
      backgroundColor: 'indigo-50',
      cornerRadius: 8,
      padding: [22, 16],
      margin: { bottom: 14 },
      child: new VerticalStack({
        spacing: 4,
        children: [
          new TextBlock('Aa', { fontName: FONT, fontSize: 64, color: 'indigo-900' }),
          new TextBlock('Quick zephyrs blow, vexing daft Jim — £12, €15.', {
            fontName: FONT,
            fontSize: 20,
            color: 'slate-900',
          }),
          new TextBlock('Ελληνικά  ·  Кириллица  ·  Tiếng Việt  ·  Ærøskøbing', {
            fontName: FONT,
            fontSize: 14,
            color: 'slate-700',
          }),
          new TextBlock('Noto Sans Regular, embedded as a subset of only the glyphs on this page.', {
            fontName: FONT,
            fontSize: 9,
            color: 'slate-600',
            margin: { top: 6 },
          }),
        ],
      }),
    })
  );

  // ── Coverage, in two columns ──────────────────────────────────────────────────

  const faces: Record<FontRole, string> = { text: FONT, math: MATH_FONT, symbols: SYMBOLS_FONT };
  const column = (groups: [string, string, FontRole, string[]][]) =>
    new VerticalStack({
      children: groups.flatMap(([title, tocId, role, lines]) => [
        sectionHeading(title, tocId),
        ...lines.map(text => new TextBlock(text, { fontName: faces[role], margin: { bottom: 4 } })),
      ]),
    });
  doc.add(
    new HorizontalStack({
      spacing: 24,
      widthDistribution: 'equal',
      children: [column(LEFT_GROUPS), column(RIGHT_GROUPS)],
    })
  );

  // ── Standard vs Embedded ──────────────────────────────────────────────────────

  doc.add(sectionHeading('Standard vs Embedded', 's-comparison'));

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

  function sectionHeading(title: string, tocId: string): Heading {
    return new Heading(title, {
      tocIdentifier: tocId,
      level: 2,
      fontName: FONT,
      fontSize: 13,
      color: 'indigo-600',
      margin: { top: 12, bottom: 6 },
    });
  }

  return doc;
}
