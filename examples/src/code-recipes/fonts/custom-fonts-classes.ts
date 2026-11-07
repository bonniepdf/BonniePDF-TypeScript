/**
 * Custom Fonts (Class API).
 * The same TrueType-embedding / Unicode-coverage tour as Custom Fonts, built with the class API: construct each element and assign properties. The output is identical.
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
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Heading,
  Container,
  HorizontalStack,
  VerticalStack,
  WidthDistribution,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
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

/**
 * The **class / construct-then-mutate** companion to `custom-fonts.ts`.
 *
 * Same TrueType-embedding / Unicode-coverage tour, authored the long way: `new`
 * each element and assign properties, using `TextStyle`, `Thickness` and
 * `ColorPalette` directly. This is the escape hatch the options-object front
 * door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `custom-fonts.ts` (an equivalence test binds the two). Reach for the options
 * form first; this variant exists to show what it desugars to.
 */
export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Noto Sans').withSize(11).withColor(ColorPalette.slate[600]);

  const metadata = new DocumentMetadata();
  metadata.title = 'Custom Fonts';
  metadata.author = 'BonniePDF';
  metadata.subject = 'TrueType font embedding with Unicode coverage. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, pdf/ua, pdf/a, accessibility, fonts, unicode, truetype';

  const doc = new Document(settings, metadata);

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

  const h1 = new Heading('Custom Fonts — TrueType Embedding');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = FONT;
  h1.fontSize = 22;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const intro = new TextBlock(
    'BonniePDF embeds compact glyph subsets of TrueType fonts directly in the PDF — ' +
      'only the characters actually used are stored. Fonts with different Unicode coverage ' +
      'can be mixed within a single document by choosing a font for each block.'
  );
  intro.fontName = FONT;
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── The embedded face, large ──────────────────────────────────────────────────

  const specimen = new VerticalStack();
  specimen.spacing = 4;
  for (const [text, size, color] of [
    ['Aa', 64, ColorPalette.indigo[900]],
    ['Quick zephyrs blow, vexing daft Jim — £12, €15.', 20, ColorPalette.slate[900]],
    ['Ελληνικά  ·  Кириллица  ·  Tiếng Việt  ·  Ærøskøbing', 14, ColorPalette.slate[700]],
  ] as const) {
    const line = new TextBlock(text);
    line.fontName = FONT;
    line.fontSize = size;
    line.color = color;
    specimen.add(line);
  }
  const note = new TextBlock('Noto Sans Regular, embedded as a subset of only the glyphs on this page.');
  note.fontName = FONT;
  note.fontSize = 9;
  note.color = ColorPalette.slate[600];
  note.margin = new Thickness(0, 6, 0, 0);
  specimen.add(note);
  const panel = new Container();
  panel.backgroundColor = ColorPalette.indigo[50];
  panel.cornerRadius = 8;
  panel.padding = new Thickness(22, 16, 22, 16);
  panel.margin = new Thickness(0, 0, 0, 14);
  panel.child = specimen;
  doc.add(panel);

  // ── Coverage, in two columns ──────────────────────────────────────────────────

  const faces: Record<FontRole, string> = { text: FONT, math: MATH_FONT, symbols: SYMBOLS_FONT };
  const columns = new HorizontalStack();
  columns.spacing = 24;
  columns.widthDistribution = WidthDistribution.Equal;
  for (const groups of [LEFT_GROUPS, RIGHT_GROUPS]) {
    const column = new VerticalStack();
    for (const [title, tocId, role, lines] of groups) {
      column.add(sectionHeading(title, tocId));
      for (const text of lines) {
        const line = new TextBlock(text);
        line.fontName = faces[role];
        line.margin = new Thickness(0, 0, 0, 4);
        column.add(line);
      }
    }
    columns.add(column);
  }
  doc.add(columns);

  // ── Standard vs Embedded ──────────────────────────────────────────────────────

  doc.add(sectionHeading('Standard vs Embedded', 's-comparison'));

  const standard = new TextBlock('Standard Helvetica (Type 1) — limited to the WinAnsi charset.');
  standard.fontName = StandardFonts.Helvetica;
  standard.margin = new Thickness(0, 0, 0, 4);
  doc.add(standard);

  const embedded = new TextBlock(
    'Embedded Noto Sans (TrueType) — full Unicode range, subsetting keeps file size compact.'
  );
  embedded.fontName = FONT;
  doc.add(embedded);

  function sectionHeading(title: string, tocId: string): Heading {
    const heading = new Heading(title);
    heading.tocIdentifier = tocId;
    heading.level = 2;
    heading.fontName = FONT;
    heading.fontSize = 13;
    heading.color = ColorPalette.indigo[600];
    heading.margin = new Thickness(0, 12, 0, 6);
    return heading;
  }

  return doc;
}
