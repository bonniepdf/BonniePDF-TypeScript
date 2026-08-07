import { Document, Heading, TextBlock, Line, StandardFonts } from '@bonniepdf/core';

/**
 * Underline and strikethrough decorations across alignments and sizes, authored
 * through the options-object front door.
 *
 * `textDecoration` is a forgiving token or list: `'underline'`, `'strikethrough'`,
 * or `['underline', 'strikethrough']` for the combined form (no bitwise-OR of
 * flag enums needed). Decorations are presentational - every decorated paragraph
 * stays an ordinary paragraph. PDF/A-2a + PDF/UA-1.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      margin: 60,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-700' },
    },
    metadata: {
      title: 'Text Decorations',
      author: 'BonniePDF',
      subject: 'Underline and strikethrough decorations across alignments and sizes. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, text, underline, strikethrough, decorations, pdf/ua, pdf/a, BonniePDF',
    },
  });

  // ── Title ─────────────────────────────────────────────────────────────────────

  doc.add(
    new Heading('Text Decorations', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      textColor: 'slate-800',
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'Underline and strikethrough are presentational properties on TextBlock. ' +
        'They do not change how the text is tagged — a decorated paragraph is still a paragraph.',
      { margin: { bottom: 14 } }
    )
  );

  // ── 1. Underline ──────────────────────────────────────────────────────────────

  section(doc, 'Underline', 's-underline');

  doc.add(
    new TextBlock(
      'This text has an underline applied. Underlines can mark emphasis, hyperlinks, or headings in informal documents.',
      { textDecoration: 'underline', margin: { bottom: 10 } }
    )
  );

  // ── 2. Strikethrough ──────────────────────────────────────────────────────────

  section(doc, 'Strikethrough', 's-strike');

  doc.add(
    new TextBlock(
      'This text has a strikethrough applied. Strikethrough visually signals content that has been withdrawn, revised, or superseded.',
      { textDecoration: 'strikethrough', margin: { bottom: 10 } }
    )
  );

  // ── 3. Combined ───────────────────────────────────────────────────────────────

  section(doc, 'Combined Decorations', 's-combined');

  doc.add(
    new TextBlock(
      'Both decorations can be applied simultaneously. TextDecoration is a set of flags — combine them with the | operator: ' +
        'TextDecoration.Underline | TextDecoration.Strikethrough.',
      { textDecoration: ['underline', 'strikethrough'], margin: { bottom: 10 } }
    )
  );

  // ── 4. Alignment ──────────────────────────────────────────────────────────────

  section(doc, 'Alignment', 's-alignment');

  for (const [label, align] of [
    ['Left-aligned underlined text.', 'left'],
    ['Centre-aligned underlined text.', 'center'],
    ['Right-aligned underlined text.', 'right'],
  ] as const) {
    doc.add(new TextBlock(label, { textDecoration: 'underline', alignment: align, margin: { bottom: 8 } }));
  }

  // ── 5. Scales with font size ──────────────────────────────────────────────────

  section(doc, 'Scales with Font Size', 's-sizes');

  for (const size of [8, 12, 18, 24, 36]) {
    doc.add(
      new TextBlock(`Underline at ${size}pt`, { fontSize: size, textDecoration: 'underline', margin: { bottom: 6 } })
    );
  }

  // ── Practical Example ─────────────────────────────────────────────────────────

  doc.add(new Line({ color: 'slate-300', thickness: 1, margin: { top: 12 } }));

  section(doc, 'Practical Example: Price List', 's-prices');

  doc.add(
    new TextBlock('Original Price: £199.99', {
      fontSize: 14,
      textColor: 'slate-400',
      textDecoration: 'strikethrough',
      margin: { bottom: 4 },
    })
  );

  doc.add(
    new TextBlock('Sale Price: £149.99', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 18,
      textColor: '#ff0000',
      textDecoration: 'underline',
      margin: { bottom: 4 },
    })
  );

  doc.add(new TextBlock('You save £50.00!', { fontSize: 11, textColor: 'green-600' }));

  return doc;
}

function section(doc: Document, title: string, tocId: string): void {
  doc.add(
    new Heading(title, {
      tocIdentifier: tocId,
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 14,
      textColor: 'indigo-600',
      margin: { top: 12, bottom: 6 },
    })
  );
}
