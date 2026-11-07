/**
 * Advanced Typography (Class API).
 * The same super/subscript + decoration-styling tour as Advanced Typography, built with the class API: construct each element and assign properties, per-span TextStyles via the fluent builders. The output is identical.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  RichText,
  TextStyle,
  TextDecoration,
  Heading,
  Container,
  HorizontalStack,
  VerticalStack,
  WidthDistribution,
  Border,
  BorderColors,
  type IElement,
  ColorPalette,
  Thickness,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `advanced-typography.ts`.
 *
 * Same super/subscript + decoration-styling tour, authored the long way: `new`
 * each element and assign properties, with per-span `TextStyle`s built via the
 * fluent `.subscript()`/`.underline()`/`.withDecorationColor()` builders. Each
 * span style is a **distinct** object - never one shared `TextStyle` mutated
 * between spans (that aliasing is what `RichText.span`'s snapshotting now guards
 * against; keeping the styles distinct is clearer regardless).
 *
 * It renders **byte-for-byte identically** to the options-style
 * `advanced-typography.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Advanced Typography';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Super/subscript and decoration styling';

  const doc = new Document(settings, metadata);

  const title = new Heading('Advanced Typography');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.color = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 14);
  doc.add(title);

  // Each feature is one row of the specimen sheet: what it is on the left, examples on the right.

  // ── Superscript / subscript ──
  // Distinct per-span styles - never one shared object mutated between spans.
  const base = new TextStyle().withSize(13).withColor(ColorPalette.slate[800]);
  const sub = new TextStyle().withSize(9).withColor(ColorPalette.slate[800]).subscript();
  const sup = new TextStyle().withSize(9).withColor(ColorPalette.slate[800]).superscript();
  const supNote = new TextStyle().withSize(9).withColor(ColorPalette.indigo[600]).superscript();

  const chemistry = new RichText();
  chemistry
    .span('Water is H', base)
    .span('2', sub)
    .span('O; sulfuric acid is H', base)
    .span('2', sub)
    .span('SO', base)
    .span('4', sub)
    .span('.', base);

  const physics = new RichText();
  physics
    .span('Mass-energy equivalence: E = mc', base)
    .span('2', sup)
    .span('. See the appendix.', base)
    .span('1', supNote);

  const ordinals = new RichText();
  ordinals
    .span('Finishers: 1', base)
    .span('st', sup)
    .span(', 2', base)
    .span('nd', sup)
    .span(', 3', base)
    .span('rd', sup)
    .span('.', base);
  doc.add(
    specimen('Superscript & subscript', 'Formulae, powers, footnote marks and ordinals.', chemistry, physics, ordinals)
  );

  // ── Decoration styling ──
  // Block-level overline with a custom colour + thickness.
  const overlined = new TextBlock('Overlined section marker');
  overlined.fontName = StandardFonts.HelveticaBold;
  overlined.fontSize = 13;
  overlined.color = ColorPalette.slate[800];
  overlined.decoration = TextDecoration.Overline;
  overlined.decorationColor = ColorPalette.indigo[500];
  overlined.decorationThickness = 1.5;

  // A wavy (spell-check) underline on a single span.
  const spell = new RichText();
  spell.span('Spell-check style: ', new TextStyle().withSize(13).withColor(ColorPalette.slate[800]));
  spell.span(
    'mispeled',
    new TextStyle()
      .withSize(13)
      .withColor(ColorPalette.slate[800])
      .wavyUnderline()
      .withDecorationColor(ColorPalette.rose[600])
  );
  spell.span(' word.', new TextStyle().withSize(13).withColor(ColorPalette.slate[800]));
  doc.add(
    specimen(
      'Decoration styling',
      'Overline, underline and strikethrough, each with its own colour and weight.',
      overlined,
      inlineDecorations(),
      spell
    )
  );

  // ── Letter & word spacing ──
  const tracked = new TextBlock('WIDE TRACKING FOR EMPHASIS');
  tracked.fontName = StandardFonts.HelveticaBold;
  tracked.fontSize = 12;
  tracked.color = ColorPalette.slate[800];
  tracked.letterSpacing = 3;

  const airy = new TextBlock('Airy   word   spacing   opens   the   line.');
  airy.fontSize = 12;
  airy.color = ColorPalette.slate[700];
  airy.wordSpacing = 4;
  doc.add(
    specimen(
      'Letter & word spacing',
      'Tracking for labels and headings; wider word spacing for an open line.',
      tracked,
      airy
    )
  );

  // ── Line clamp ──
  const clamped = new TextBlock(
    'This description is clamped to two lines: however much copy the product team writes, the card stays a fixed height and the overflow is replaced with an ellipsis so the layout never breaks.'
  );
  clamped.fontSize = 12;
  clamped.color = ColorPalette.slate[700];
  clamped.maxLines = 2;
  doc.add(specimen('Line clamp', 'Fixed-height cards: the overflow ends in an ellipsis.', clamped));

  // ── Paragraph controls ──
  const prose = new TextBlock(
    'The first line of each paragraph is indented and a little air is inserted between paragraphs, the way a printed book sets body copy.\n' +
      'This second paragraph shows the inter-paragraph spacing and the matching first-line indent, all resolved during layout without manual spacers.'
  );
  prose.fontSize = 12;
  prose.color = ColorPalette.slate[700];
  prose.firstLineIndent = 24;
  prose.paragraphSpacing = 8;
  doc.add(specimen('Paragraph indent & spacing', 'Book-style first-line indents and space between paragraphs.', prose));

  return doc;
}

// Local helpers and sample types used by this document.

/** One row of the specimen sheet: the feature's name and a note on the left, its examples on the right. */
function specimen(label: string, note: string, ...examples: IElement[]): Container {
  const heading = new Heading(label);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 11;
  heading.color = ColorPalette.indigo[700];
  const caption = new TextBlock(note);
  caption.fontSize = 9;
  caption.color = ColorPalette.slate[500];
  const left = new VerticalStack();
  left.spacing = 4;
  left.add(heading);
  left.add(caption);

  const right = new VerticalStack();
  right.spacing = 6;
  for (const example of examples) right.add(example);

  const row = new HorizontalStack();
  row.widthDistribution = WidthDistribution.Weighted;
  row.spacing = 20;
  row.add(left, 1);
  row.add(right, 2.6);

  const container = new Container();
  container.border = Border.topOnly(0.75);
  container.borderColors = BorderColors.topOnly(ColorPalette.slate[200]);
  container.padding = new Thickness(0, 14, 0, 14);
  container.child = row;
  return container;
}

/** A line mixing coloured underline, strikethrough, and overline spans. */
function inlineDecorations(): RichText {
  const rt = new RichText();
  const size = 13;

  const underline = new TextStyle()
    .withSize(size)
    .withColor(ColorPalette.slate[800])
    .underline()
    .withDecorationColor(ColorPalette.rose[600])
    .withDecorationThickness(1.5);
  const strike = new TextStyle()
    .withSize(size)
    .withColor(ColorPalette.slate[400])
    .strikethrough()
    .withDecorationColor(ColorPalette.slate[400]);
  const over = new TextStyle().withSize(size).withColor(ColorPalette.slate[800]).overline();

  rt.span('A ', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  rt.span('rose underline', underline);
  rt.span(', a ', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  rt.span('struck-through price', strike);
  rt.span(', and an ', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  rt.span('overline', over);
  rt.span('.', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  return rt;
}
