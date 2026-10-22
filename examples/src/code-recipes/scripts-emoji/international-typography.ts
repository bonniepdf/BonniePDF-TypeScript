/**
 * International Typography.
 * OpenType kerning and ligatures from an embedded serif, a kerning-off comparison, Arabic and Hebrew set right to left, a mirrored table, and opt-in colour flags. PDF/A-2b and PDF/UA-1.
 * Supply the font assets; export with await doc.generateBytesAsync().
 */
import {
  Document,
  Heading,
  TextBlock,
  TextStyle,
  HorizontalStack,
  VerticalStack,
  Container,
  Table,
  type ColorInput,
} from '@bonniepdf/core';

/**
 * International typography, authored through the options-object front door.
 *
 * Embedded fonts are shaped with their own OpenType tables: pair kerning and
 * ligatures are applied by default, and `fontFeatures` switches them off per
 * element (`{ kern: 0, liga: 0 }`) so the difference can be seen side by side.
 *
 * Right-to-left text is a direction, not a different kind of element. A
 * document-wide default is set with `settings.contentDirection`; any element can
 * override it with `contentDirection`. A `HorizontalStack` or `Table` set to
 * `'rightToLeft'` mirrors its columns while keeping the children in source
 * order, and `alignment: 'start'` follows the direction, so the same document
 * definition reads correctly in either language.
 *
 * Limits today: plain text blocks, rows and tables are direction-aware. Styled
 * spans, lists and page-number tokens are not yet fully integrated with
 * right-to-left text, so this example uses none of them.
 *
 * Colour emoji are opt-in (`emojiRendering: 'colour'`); the default stays
 * monochrome outline.
 */
export function generate(assets?: ReadonlyMap<string, Uint8Array>): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 36,
      emojiRendering: 'colour',
      conformance: 'pdf/a-2b',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
    },
    metadata: {
      title: 'International Typography',
      author: 'BonniePDF',
      subject: 'Kerning, ligatures, Arabic and Hebrew right-to-left text, a mirrored table and colour emoji.',
      keywords: 'pdf, typography, kerning, ligatures, arabic, hebrew, rtl, bidi, emoji',
    },
  });

  function font(name: string): string {
    const bytes = assets?.get('fonts/' + name);
    if (!bytes) throw new Error(`Supply fonts/${name} in the asset dictionary.`);
    return doc.fonts.add(bytes).fontName;
  }
  const serif = font('SourceSerif4-Regular.ttf'),
    arabic = font('NotoNaskhArabic-Regular.ttf'),
    hebrew = font('NotoSerifHebrew-Regular.ttf'),
    emoji = font('TwemojiMozilla.ttf');
  doc.settings.defaultTextStyle = new TextStyle({ fontFamily: serif, fontSize: 11, color: 'slate-700' });

  // ── Title ─────────────────────────────────────────────────────────────────

  doc.add(
    new Heading('Typeset for every script', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: serif,
      fontSize: 28,
      color: 'slate-800',
      margin: { bottom: 4 },
    })
  );
  doc.add(
    new TextBlock(
      'Fonts are shaped with their own OpenType tables, so kerning, ligatures and joined scripts come out as the type designer drew them, and the line breaks you measure are the ones in the PDF.',
      { fontSize: 12, margin: { bottom: 14 } }
    )
  );

  // ── Kerning and ligatures ─────────────────────────────────────────────────

  doc.add(sectionHeading('Kerning and ligatures', 'kerning', serif));
  doc.add(specimen('Off · font features kern and liga set to 0', serif, 'slate-100', { kern: 0, liga: 0 }));
  doc.add(specimen('On · the default for embedded fonts', serif, 'indigo-50'));

  // ── Right to left ─────────────────────────────────────────────────────────

  doc.add(sectionHeading('Right to left, mirrored', 'rtl', serif));
  doc.add(
    new TextBlock(
      'This row has a right-to-left content direction. Its two children stay in source order, Arabic first, and the row mirrors them. Arabic letters join automatically, and the digits of 2026 still read left to right.',
      { margin: { bottom: 8 } }
    )
  );
  doc.add(
    new HorizontalStack({
      contentDirection: 'rightToLeft',
      spacing: 16,
      widthDistribution: 'equal',
      margin: { bottom: 14 },
      children: [
        new TextBlock(
          'ينسّق النص العربي والعبري من اليمين إلى اليسار، ويصل الحروف ببعضها تلقائياً، ويحافظ على اتجاه الأرقام مثل 2026 داخل الفقرة نفسها.',
          { fontName: arabic, fontSize: 15, lineHeight: 1.6, alignment: 'start', color: 'slate-800' }
        ),
        new TextBlock('הטקסט העברי והערבי נערך מימין לשמאל והאותיות הערביות מתחברות אוטומטית בתוך אותה פסקה', {
          fontName: hebrew,
          fontSize: 15,
          lineHeight: 1.5,
          alignment: 'start',
          color: 'slate-800',
        }),
      ],
    })
  );

  // ── Mirrored table ────────────────────────────────────────────────────────

  doc.add(sectionHeading('One table, two directions', 'table', serif));
  doc.add(
    new HorizontalStack({
      spacing: 16,
      widthDistribution: 'equal',
      margin: { bottom: 14 },
      children: [
        menu('leftToRight', ['Item', 'Qty', 'Price'], ['Coffee', 'Tea', 'Cake'], serif),
        menu('rightToLeft', ['الصنف', 'الكمية', 'السعر'], ['قهوة', 'شاي', 'كعكة'], arabic),
      ],
    })
  );

  // ── Colour emoji ──────────────────────────────────────────────────────────

  doc.add(sectionHeading('Colour emoji, when you ask for it', 'emoji', serif));
  doc.add(new TextBlock('🇬🇧 🇸🇦 🇮🇱 🇩🇪 🇯🇵', { fontName: emoji, fontSize: 24, margin: { bottom: 10 } }));
  doc.add(
    new TextBlock(
      'Set in Source Serif 4, Noto Naskh Arabic and Noto Serif Hebrew under the SIL Open Font License; flag artwork from Twemoji (CC BY 4.0), font by Mozilla.',
      { fontSize: 8, color: 'slate-500' }
    )
  );

  return doc;
}

// Local helpers and sample data used by this document.

const ROWS: readonly (readonly [qty: string, price: string])[] = [
  ['2', '4.50'],
  ['1', '3.20'],
  ['3', '5.00'],
];

function sectionHeading(title: string, tocId: string, fontName: string): Heading {
  return new Heading(title, {
    tocIdentifier: tocId,
    level: 2,
    fontName,
    fontSize: 15,
    color: 'indigo-600',
    margin: { bottom: 8 },
  });
}

// One kerning/ligature panel: the same two lines, with or without font features.
function specimen(
  label: string,
  fontName: string,
  background: ColorInput,
  fontFeatures?: Record<string, number>
): Container {
  return new Container({
    padding: 10,
    backgroundColor: background,
    cornerRadius: 6,
    margin: { bottom: 10 },
    child: new VerticalStack({
      children: [
        new TextBlock(label, { fontName, fontSize: 8.5, color: 'slate-600', margin: { bottom: 4 } }),
        new TextBlock('AVATAR To Wave', { fontName, fontSize: 40, color: 'slate-800', fontFeatures }),
        new TextBlock('office affluent flagship', { fontName, fontSize: 27, color: 'slate-800', fontFeatures }),
      ],
    }),
  });
}

// The same data set as a table, in one direction. Source order never changes.
function menu(
  contentDirection: 'leftToRight' | 'rightToLeft',
  header: readonly [string, string, string],
  items: readonly [string, string, string],
  fontName: string
): Table {
  const cell = (text: string, color: ColorInput): TextBlock =>
    new TextBlock(text, { fontName, fontSize: 12, color, alignment: 'start' });
  const table = new Table({
    columns: [3, 1, 1],
    contentDirection,
    cellPadding: 5,
    headerBackgroundColor: 'slate-800',
    headerTextColor: '#ffffff',
  });
  table.addHeader(...header.map(text => cell(text, '#ffffff')));
  items.forEach((item, i) =>
    table.addRow(cell(item, 'slate-800'), cell(ROWS[i]![0], 'slate-600'), cell(ROWS[i]![1], 'slate-600'))
  );
  return table;
}
