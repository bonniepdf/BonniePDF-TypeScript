/**
 * Rich Text Styles.
 * Bold, italic, coloured, highlighted, and mixed-size spans within flowing paragraphs. Reusable style objects, justified alignment, and a practical legal disclaimer.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import { Document, Heading, TextBlock, RichText, TextStyle, Line, StandardFonts } from '@bonniepdf/core';

/**
 * Inline mixed-style text using RichText spans - weight, style, colour,
 * decorations, background highlights, mixed sizes, justified flow, and reusable
 * styles - authored through the options-object front door.
 *
 * Each `RichText` is built with an options constructor (`margin`, `alignment`,
 * `defaultStyle`) and filled with `.span(text, style)` calls; every per-span
 * `TextStyle` is itself an options object (`{ fontWeight: 'bold' }`,
 * `{ color: 'blue-600' }`, `{ decoration: 'underline' }`, `{ backgroundColor:
 * '#fef08a' }`), with colours as palette tokens or hex. Each RichText is tagged
 * as an ordinary paragraph. PDF/A-2a + PDF/UA-1.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      margin: 60,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
    },
    metadata: {
      title: 'Rich Text Styles',
      author: 'BonniePDF',
      subject: 'Inline mixed-style text using RichText spans. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, rich text, inline styles, bold, italic, underline, highlights, pdf/ua, pdf/a, BonniePDF',
    },
  });

  // ── Title ─────────────────────────────────────────────────────────────────────

  doc.add(
    new Heading('Rich Text Styles', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: 'slate-800',
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'RichText lets you mix bold, italic, coloured, highlighted, and differently-sized spans within a single ' +
        'flowing paragraph. All formatting is per-span while the text wraps and aligns as a unit. ' +
        'Every RichText is automatically structured as a paragraph for screen readers.',
      { margin: { bottom: 16 } }
    )
  );

  // ── 1. Weight & Style ─────────────────────────────────────────────────────────

  section(doc, 'Weight & Style', 's-weight');

  const boldItalic = new TextStyle({ fontWeight: 'bold', italic: true });

  doc.add(
    new RichText({ margin: { bottom: 10 } })
      .span('Inline text can be ')
      .span('bold', new TextStyle({ fontWeight: 'bold' }))
      .span(', ')
      .span('italic', new TextStyle({ italic: true }))
      .span(', or ')
      .span('bold italic', boldItalic)
      .span(' — all within the same flowing paragraph. Scientific names like ')
      .span('Homo sapiens', new TextStyle({ italic: true }))
      .span(' are a classic use of italic, while ')
      .span('key terms', new TextStyle({ fontWeight: 'bold' }))
      .span(' benefit from bold emphasis.')
  );

  // ── 2. Coloured Spans ─────────────────────────────────────────────────────────

  section(doc, 'Coloured Spans', 's-colors');

  doc.add(
    new RichText({ margin: { bottom: 10 } })
      .span('Text can be ')
      .span('red', new TextStyle({ color: '#ff0000' }))
      .span(', ')
      .span('blue', new TextStyle({ color: 'blue-600' }))
      .span(', ')
      .span('green', new TextStyle({ color: 'green-600' }))
      .span(', or ')
      .span('any colour', new TextStyle({ color: 'purple-600' }))
      .span(' you choose. Colour combines freely with weight: ')
      .span('bold indigo', new TextStyle({ fontWeight: 'bold', color: 'indigo-600' }))
      .span(' is a common choice for strong inline emphasis.')
  );

  // ── 3. Inline Decorations ─────────────────────────────────────────────────────

  section(doc, 'Inline Decorations', 's-decorations');

  doc.add(
    new RichText({ margin: { bottom: 10 } })
      .span('Decorations are per-span: ')
      .span('underlined words', new TextStyle({ decoration: 'underline' }))
      .span(', ')
      .span('strikethrough text', new TextStyle({ decoration: 'strikethrough' }))
      .span(', and combinations like ')
      .span('bold underlined', new TextStyle({ fontWeight: 'bold', decoration: 'underline' }))
      .span(' or ')
      .span('italic strikethrough', new TextStyle({ italic: true, decoration: 'strikethrough' }))
      .span(' all flow naturally within a single paragraph.')
  );

  // ── 4. Background Highlights ──────────────────────────────────────────────────

  section(doc, 'Background Highlights', 's-highlights');

  doc.add(
    new RichText({ margin: { bottom: 10 } })
      .span('Background colours create a ')
      .span('highlighter pen effect', new TextStyle({ backgroundColor: '#fef08a' }))
      .span(' across any span. Combine with colour for ')
      .span('bold red alert text', new TextStyle({ fontWeight: 'bold', color: '#991b1b', backgroundColor: '#fecaca' }))
      .span(' or a ')
      .span('green success note', new TextStyle({ color: '#166534', backgroundColor: '#bbf7d0' }))
      .span(' without breaking the paragraph flow.')
  );

  // ── 5. Mixed Font Sizes ───────────────────────────────────────────────────────

  section(doc, 'Mixed Font Sizes', 's-sizes');

  doc.add(
    new RichText({ margin: { bottom: 10 } })
      .span('The same paragraph can carry ')
      .span('larger text', new TextStyle({ fontSize: 18 }))
      .span(' alongside ')
      .span('smaller text', new TextStyle({ fontSize: 8 }))
      .span(' — useful for superscript markers, footnote labels, or legal fine print. ')
      .span('Line height adapts automatically to the tallest span on each line.')
  );

  // ── 6. Justified Alignment ────────────────────────────────────────────────────

  section(doc, 'Justified Alignment', 's-justified');

  doc.add(
    new RichText({ alignment: 'justify', margin: { bottom: 10 } })
      .span('Rich text supports ')
      .span('full justification', new TextStyle({ fontWeight: 'bold' }))
      .span(' — text is evenly distributed across the line width even when spans carry ')
      .span('mixed styles', new TextStyle({ italic: true }))
      .span(
        '. Each span maintains its own formatting while word-spacing is adjusted to fill the available width. ' +
          'The final line remains left-aligned per typographic convention.'
      )
  );

  // ── 7. Reusable Styles ────────────────────────────────────────────────────────

  section(doc, 'Reusable Styles', 's-reusable');

  const labelStyle = new TextStyle({ fontFamily: 'Helvetica', fontWeight: 'bold', color: 'slate-800' });
  const valueStyle = new TextStyle({ fontFamily: 'Helvetica', color: 'indigo-600' });
  const unitStyle = new TextStyle({ fontFamily: 'Helvetica', fontSize: 9, color: 'slate-400' });

  const rows: [string, string, string][] = [
    ['Temperature:', '23.5', ' °C'],
    ['Pressure:', '1013.25', ' hPa'],
    ['Humidity:', '65', ' %'],
  ];
  for (const [label, value, unit] of rows) {
    doc.add(
      new RichText({ margin: { bottom: 4 } }).span(label, labelStyle).span(value, valueStyle).span(unit, unitStyle)
    );
  }

  // ── Practical Example ─────────────────────────────────────────────────────────

  doc.add(new Line({ color: 'slate-300', thickness: 1, margin: { top: 12 } }));

  section(doc, 'Practical Example: Legal Disclaimer', 's-legal');

  const disclaimerBase = new TextStyle({ fontFamily: 'Helvetica', fontSize: 10, color: 'slate-600' });

  doc.add(
    new RichText({ defaultStyle: disclaimerBase, alignment: 'justify', margin: { bottom: 10 } })
      .span('IMPORTANT: ', new TextStyle({ fontWeight: 'bold', color: '#ff0000' }))
      .span('By using this software, you agree to the ')
      .span('Terms of Service', new TextStyle({ fontWeight: 'bold', decoration: 'underline' }))
      .span(' and ')
      .span('Privacy Policy', new TextStyle({ fontWeight: 'bold', decoration: 'underline' }))
      .span('. All data is processed in accordance with ')
      .span('GDPR', new TextStyle({ fontWeight: 'bold' }))
      .span(' regulations. For questions, contact ')
      .span('support@example.com', new TextStyle({ color: 'blue-600' }))
      .span('.')
  );

  return doc;
}

// Local helpers and sample types used by this document.

function section(doc: Document, title: string, tocId: string): void {
  doc.add(
    new Heading(title, {
      tocIdentifier: tocId,
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      color: 'indigo-600',
      margin: { top: 14, bottom: 6 },
    })
  );
}
