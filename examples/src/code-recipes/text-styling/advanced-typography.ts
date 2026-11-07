/**
 * Advanced Typography.
 * A type-specimen sheet: superscript and subscript with baseline shift (H₂O, E=mc²), decoration styling (overlines, coloured or thick underlines and strikethroughs), letter and word spacing, line clamping, and paragraph indents, one ruled row per feature.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Container,
  Document,
  Heading,
  HorizontalStack,
  type IElement,
  TextBlock,
  RichText,
  TextStyle,
  StandardFonts,
  VerticalStack,
} from '@bonniepdf/core';

/**
 * Advanced typography: super/subscript baseline shift and
 * decoration styling (overline + underline/strikethrough colour & thickness),
 * plus letter/word spacing, line clamping, and paragraph indent/spacing.
 * Authored through the options-object front door.
 *
 * Each inline span carries its own `TextStyle` options object - the styles are
 * distinct values, never a single shared object mutated between spans, so a
 * subscript stays a subscript and only the footnote is indigo. (`RichText.span`
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

  // Each feature is one row of the specimen sheet: what it is on the left, examples on the right.

  // ── Superscript / subscript ──
  const base = new TextStyle({ fontSize: 13, color: 'slate-800' });
  const sub = new TextStyle({ fontSize: 9, color: 'slate-800', baselineAlignment: 'subscript' });
  const sup = new TextStyle({ fontSize: 9, color: 'slate-800', baselineAlignment: 'superscript' });
  const supNote = new TextStyle({ fontSize: 9, color: 'indigo-600', baselineAlignment: 'superscript' });

  doc.add(
    specimen(
      'Superscript & subscript',
      'Formulae, powers, footnote marks and ordinals.',
      new RichText()
        .span('Water is H', base)
        .span('2', sub)
        .span('O; sulfuric acid is H', base)
        .span('2', sub)
        .span('SO', base)
        .span('4', sub)
        .span('.', base),
      new RichText()
        .span('Mass-energy equivalence: E = mc', base)
        .span('2', sup)
        .span('. See the appendix.', base)
        .span('1', supNote),
      new RichText()
        .span('Finishers: 1', base)
        .span('st', sup)
        .span(', 2', base)
        .span('nd', sup)
        .span(', 3', base)
        .span('rd', sup)
        .span('.', base)
    )
  );

  // ── Decoration styling ──
  doc.add(
    specimen(
      'Decoration styling',
      'Overline, underline and strikethrough, each with its own colour and weight.',
      // Block-level overline with a custom colour + thickness.
      new TextBlock('Overlined section marker', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 13,
        color: 'slate-800',
        decoration: 'overline',
        decorationColor: 'indigo-500',
        decorationThickness: 1.5,
      }),
      // Inline decorations with independent colour/thickness per span.
      inlineDecorations(),
      // A wavy (spell-check) underline on a single span.
      new RichText()
        .span('Spell-check style: ', new TextStyle({ fontSize: 13, color: 'slate-800' }))
        .span(
          'mispeled',
          new TextStyle({
            fontSize: 13,
            color: 'slate-800',
            decoration: 'underline',
            decorationStyle: 'wavy',
            decorationColor: 'rose-600',
          })
        )
        .span(' word.', new TextStyle({ fontSize: 13, color: 'slate-800' }))
    )
  );

  // ── Letter & word spacing ──
  doc.add(
    specimen(
      'Letter & word spacing',
      'Tracking for labels and headings; wider word spacing for an open line.',
      new TextBlock('WIDE TRACKING FOR EMPHASIS', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 12,
        color: 'slate-800',
        letterSpacing: 3,
      }),
      new TextBlock('Airy   word   spacing   opens   the   line.', { fontSize: 12, color: 'slate-700', wordSpacing: 4 })
    )
  );

  // ── Line clamp ──
  doc.add(
    specimen(
      'Line clamp',
      'Fixed-height cards: the overflow ends in an ellipsis.',
      new TextBlock(
        'This description is clamped to two lines: however much copy the product team writes, the card stays a fixed height and the overflow is replaced with an ellipsis so the layout never breaks.',
        { fontSize: 12, color: 'slate-700', maxLines: 2 }
      )
    )
  );

  // ── Paragraph controls ──
  doc.add(
    specimen(
      'Paragraph indent & spacing',
      'Book-style first-line indents and space between paragraphs.',
      new TextBlock(
        'The first line of each paragraph is indented and a little air is inserted between paragraphs, the way a printed book sets body copy.\n' +
          'This second paragraph shows the inter-paragraph spacing and the matching first-line indent, all resolved during layout without manual spacers.',
        { fontSize: 12, color: 'slate-700', firstLineIndent: 24, paragraphSpacing: 8 }
      )
    )
  );

  return doc;
}

// Local helpers and sample types used by this document.

/** One row of the specimen sheet: the feature's name and a note on the left, its examples on the right. */
function specimen(label: string, note: string, ...examples: IElement[]): Container {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 20 });
  row.add(
    new VerticalStack({
      spacing: 4,
      children: [
        new Heading(label, { level: 2, fontName: StandardFonts.HelveticaBold, fontSize: 11, color: 'indigo-700' }),
        new TextBlock(note, { fontSize: 9, color: 'slate-500' }),
      ],
    }),
    1
  );
  row.add(new VerticalStack({ spacing: 6, children: examples }), 2.6);
  return new Container({ border: { top: 0.75, color: 'slate-200' }, padding: { top: 14, bottom: 14 }, child: row });
}

/** A line mixing coloured underline, strikethrough, and overline spans. */
function inlineDecorations(): RichText {
  const size = 13;
  const plain = new TextStyle({ fontSize: size, color: 'slate-800' });
  const underline = new TextStyle({
    fontSize: size,
    color: 'slate-800',
    decoration: 'underline',
    decorationColor: 'rose-600',
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
    .span('rose underline', underline)
    .span(', a ', plain)
    .span('struck-through price', strike)
    .span(', and an ', plain)
    .span('overline', over)
    .span('.', plain);
}
