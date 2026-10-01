import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  RichText,
  TextStyle,
  TextDecoration,
  Heading,
  Color,
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

  // ── Superscript / subscript ──
  doc.add(sectionLabel('Superscript & subscript'));

  // Distinct per-span styles - never one shared object mutated between spans.
  const base = new TextStyle().withSize(13).withColor(ColorPalette.slate[800]);
  const sub = new TextStyle().withSize(9).withColor(ColorPalette.slate[800]).subscript();
  const sup = new TextStyle().withSize(9).withColor(ColorPalette.slate[800]).superscript();
  const supBlue = new TextStyle().withSize(9).withColor(ColorPalette.blue[600]).superscript();

  const chemistry = new RichText();
  chemistry
    .span('Water is H', base)
    .span('2', sub)
    .span('O; sulfuric acid is H', base)
    .span('2', sub)
    .span('SO', base)
    .span('4', sub)
    .span('.', base);
  doc.add(chemistry);

  const physics = new RichText();
  physics
    .span('Mass–energy equivalence: E = mc', base)
    .span('2', sup)
    .span('. See the appendix.', base)
    .span('1', supBlue);
  doc.add(physics);

  const ordinals = new RichText();
  ordinals
    .span('Finishers: 1', base)
    .span('st', sup)
    .span(', 2', base)
    .span('nd', sup)
    .span(', 3', base)
    .span('rd', sup)
    .span('.', base);
  ordinals.margin = new Thickness(0, 0, 0, 16);
  doc.add(ordinals);

  // ── Decoration styling ──
  doc.add(sectionLabel('Decoration styling'));

  // Block-level overline with a custom colour + thickness.
  const overlined = new TextBlock('Overlined section marker');
  overlined.fontName = StandardFonts.HelveticaBold;
  overlined.fontSize = 13;
  overlined.color = ColorPalette.slate[800];
  overlined.decoration = TextDecoration.Overline;
  overlined.decorationColor = ColorPalette.blue[500];
  overlined.decorationThickness = 1.5;
  overlined.margin = new Thickness(0, 0, 0, 8);
  doc.add(overlined);

  // Inline decorations with independent colour/thickness per span.
  doc.add(inlineDecorations());

  // A wavy (spell-check) underline on a single span.
  const spell = new RichText();
  spell.span('Spell-check style: ', new TextStyle().withSize(13).withColor(ColorPalette.slate[800]));
  spell.span(
    'mispeled',
    new TextStyle().withSize(13).withColor(ColorPalette.slate[800]).wavyUnderline().withDecorationColor(Color.red)
  );
  spell.span(' word.', new TextStyle().withSize(13).withColor(ColorPalette.slate[800]));
  spell.margin = new Thickness(0, 6, 0, 16);
  doc.add(spell);

  // ── Letter & word spacing ──
  doc.add(sectionLabel('Letter & word spacing'));

  const tracked = new TextBlock('WIDE TRACKING FOR EMPHASIS');
  tracked.fontName = StandardFonts.HelveticaBold;
  tracked.fontSize = 12;
  tracked.color = ColorPalette.slate[800];
  tracked.letterSpacing = 3;
  tracked.margin = new Thickness(0, 0, 0, 4);
  doc.add(tracked);

  const airy = new TextBlock('Airy   word   spacing   opens   the   line.');
  airy.fontSize = 12;
  airy.color = ColorPalette.slate[700];
  airy.wordSpacing = 4;
  airy.margin = new Thickness(0, 0, 0, 16);
  doc.add(airy);

  // ── Line clamp ──
  doc.add(sectionLabel('Line clamp'));

  const clamped = new TextBlock(
    'This description is clamped to two lines: however much copy the product team writes, the card stays a fixed height and the overflow is replaced with an ellipsis so the layout never breaks.'
  );
  clamped.fontSize = 12;
  clamped.color = ColorPalette.slate[700];
  clamped.maxLines = 2;
  clamped.margin = new Thickness(0, 0, 0, 16);
  doc.add(clamped);

  // ── Paragraph controls ──
  doc.add(sectionLabel('Paragraph indent & spacing'));

  const prose = new TextBlock(
    'The first line of each paragraph is indented and a little air is inserted between paragraphs, the way a printed book sets body copy.\n' +
      'This second paragraph shows the inter-paragraph spacing and the matching first-line indent, all resolved during layout without manual spacers.'
  );
  prose.fontSize = 12;
  prose.color = ColorPalette.slate[700];
  prose.firstLineIndent = 24;
  prose.paragraphSpacing = 8;
  doc.add(prose);

  return doc;
}

/** A level-2 section label with the shared style used across this example. */
function sectionLabel(text: string): Heading {
  const h = new Heading(text);
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 14;
  h.color = ColorPalette.slate[700];
  h.margin = new Thickness(0, 0, 0, 6);
  return h;
}

/** A line mixing coloured underline, strikethrough, and overline spans. */
function inlineDecorations(): RichText {
  const rt = new RichText();
  const size = 13;

  const underline = new TextStyle()
    .withSize(size)
    .withColor(ColorPalette.slate[800])
    .underline()
    .withDecorationColor(Color.red)
    .withDecorationThickness(1.5);
  const strike = new TextStyle()
    .withSize(size)
    .withColor(ColorPalette.slate[400])
    .strikethrough()
    .withDecorationColor(ColorPalette.slate[400]);
  const over = new TextStyle().withSize(size).withColor(ColorPalette.slate[800]).overline();

  rt.span('A ', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  rt.span('red underline', underline);
  rt.span(', a ', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  rt.span('struck-through price', strike);
  rt.span(', and an ', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  rt.span('overline', over);
  rt.span('.', new TextStyle().withSize(size).withColor(ColorPalette.slate[800]));
  return rt;
}
