/**
 * Advanced Typography.
 * Superscript and subscript with baseline shift (H₂O, E=mc²), plus decoration styling: overlines, and coloured or thick underlines and strikethroughs.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import { Document, Heading, TextBlock, RichText, TextStyle, StandardFonts } from '@bonniepdf/core';

/**
 * Advanced typography: super/subscript baseline shift and
 * decoration styling (overline + underline/strikethrough colour & thickness),
 * plus letter/word spacing, line clamping, and paragraph indent/spacing.
 * Authored through the options-object front door.
 *
 * Each inline span carries its own `TextStyle` options object - the styles are
 * distinct values, never a single shared object mutated between spans, so a
 * subscript stays a subscript and only the footnote is blue. (`RichText.span`
 * also snapshots the style it is given, so the shared-then-mutate pattern is
 * safe, but distinct styles read more clearly.) These are visual controls that
 * leave glyph advances - and therefore layout - untouched.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-700' },
      displayDocTitle: true,
    },
    metadata: {
      title: 'Advanced Typography',
      author: 'BonniePDF',
      subject: 'Super/subscript and decoration styling',
    },
  });

  doc.add(
    new Heading('Advanced Typography', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 14 },
    })
  );

  // ── Superscript / subscript ──
  doc.add(sectionLabel('Superscript & subscript'));

  const base = new TextStyle({ fontSize: 13, color: 'slate-800' });
  const sub = new TextStyle({ fontSize: 9, color: 'slate-800', baselineAlignment: 'subscript' });
  const sup = new TextStyle({ fontSize: 9, color: 'slate-800', baselineAlignment: 'superscript' });
  const supBlue = new TextStyle({ fontSize: 9, color: 'blue-600', baselineAlignment: 'superscript' });

  doc.add(
    new RichText()
      .span('Water is H', base)
      .span('2', sub)
      .span('O; sulfuric acid is H', base)
      .span('2', sub)
      .span('SO', base)
      .span('4', sub)
      .span('.', base)
  );

  doc.add(
    new RichText()
      .span('Mass–energy equivalence: E = mc', base)
      .span('2', sup)
      .span('. See the appendix.', base)
      .span('1', supBlue)
  );

  doc.add(
    new RichText({ margin: { bottom: 16 } })
      .span('Finishers: 1', base)
      .span('st', sup)
      .span(', 2', base)
      .span('nd', sup)
      .span(', 3', base)
      .span('rd', sup)
      .span('.', base)
  );

  // ── Decoration styling ──
  doc.add(sectionLabel('Decoration styling'));

  // Block-level overline with a custom colour + thickness.
  doc.add(
    new TextBlock('Overlined section marker', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      color: 'slate-800',
      decoration: 'overline',
      decorationColor: 'blue-500',
      decorationThickness: 1.5,
      margin: { bottom: 8 },
    })
  );

  // Inline decorations with independent colour/thickness per span.
  doc.add(inlineDecorations());

  // A wavy (spell-check) underline on a single span.
  doc.add(
    new RichText({ margin: { top: 6, bottom: 16 } })
      .span('Spell-check style: ', new TextStyle({ fontSize: 13, color: 'slate-800' }))
      .span(
        'mispeled',
        new TextStyle({
          fontSize: 13,
          color: 'slate-800',
          decoration: 'underline',
          decorationStyle: 'wavy',
          decorationColor: '#ff0000',
        })
      )
      .span(' word.', new TextStyle({ fontSize: 13, color: 'slate-800' }))
  );

  // ── Letter & word spacing ──
  doc.add(sectionLabel('Letter & word spacing'));

  doc.add(
    new TextBlock('WIDE TRACKING FOR EMPHASIS', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 12,
      color: 'slate-800',
      letterSpacing: 3,
      margin: { bottom: 4 },
    })
  );

  doc.add(
    new TextBlock('Airy   word   spacing   opens   the   line.', {
      fontSize: 12,
      color: 'slate-700',
      wordSpacing: 4,
      margin: { bottom: 16 },
    })
  );

  // ── Line clamp ──
  doc.add(sectionLabel('Line clamp'));

  doc.add(
    new TextBlock(
      'This description is clamped to two lines: however much copy the product team writes, the card stays a fixed height and the overflow is replaced with an ellipsis so the layout never breaks.',
      { fontSize: 12, color: 'slate-700', maxLines: 2, margin: { bottom: 16 } }
    )
  );

  // ── Paragraph controls ──
  doc.add(sectionLabel('Paragraph indent & spacing'));

  doc.add(
    new TextBlock(
      'The first line of each paragraph is indented and a little air is inserted between paragraphs, the way a printed book sets body copy.\n' +
        'This second paragraph shows the inter-paragraph spacing and the matching first-line indent, all resolved during layout without manual spacers.',
      { fontSize: 12, color: 'slate-700', firstLineIndent: 24, paragraphSpacing: 8 }
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

/** A level-2 section label with the shared style used across this example. */
function sectionLabel(text: string): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    color: 'slate-700',
    margin: { bottom: 6 },
  });
}

/** A line mixing coloured underline, strikethrough, and overline spans. */
function inlineDecorations(): RichText {
  const size = 13;
  const plain = new TextStyle({ fontSize: size, color: 'slate-800' });
  const underline = new TextStyle({
    fontSize: size,
    color: 'slate-800',
    decoration: 'underline',
    decorationColor: '#ff0000',
    decorationThickness: 1.5,
  });
  const strike = new TextStyle({
    fontSize: size,
    color: 'slate-400',
    decoration: 'strikethrough',
    decorationColor: 'slate-400',
  });
  const over = new TextStyle({ fontSize: size, color: 'slate-800', decoration: 'overline' });

  return new RichText()
    .span('A ', plain)
    .span('red underline', underline)
    .span(', a ', plain)
    .span('struck-through price', strike)
    .span(', and an ', plain)
    .span('overline', over)
    .span('.', plain);
}
