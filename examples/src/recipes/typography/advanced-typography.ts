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
 * this feature advanced typography (phase 1a): super/subscript baseline shift and
 * decoration styling (overline + underline/strikethrough colour & thickness).
 * These are visual controls that leave glyph advances - and therefore layout -
 * untouched.
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
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 14);
  doc.add(title);

  // ── Superscript / subscript ──
  const sciLabel = new Heading('Superscript & subscript');
  sciLabel.level = 2;
  sciLabel.fontName = StandardFonts.HelveticaBold;
  sciLabel.fontSize = 14;
  sciLabel.textColor = ColorPalette.slate[700];
  sciLabel.margin = new Thickness(0, 0, 0, 6);
  doc.add(sciLabel);

  const base = new TextStyle().withSize(13).withColor(ColorPalette.slate[800]);
  const small = new TextStyle().withSize(9).withColor(ColorPalette.slate[800]);

  const chemistry = new RichText();
  chemistry.span('Water is H', base);
  chemistry.span('2', small.subscript());
  chemistry.span('O; sulfuric acid is H', base);
  chemistry.span('2', small.subscript());
  chemistry.span('SO', base);
  chemistry.span('4', small.subscript());
  chemistry.span('.', base);
  doc.add(chemistry);

  const physics = new RichText();
  physics.span('Mass–energy equivalence: E = mc', base);
  physics.span('2', small.superscript());
  physics.span('. See the appendix.', base);
  physics.span('1', small.superscript().withColor(ColorPalette.blue[600]));
  doc.add(physics);

  const ordinals = new RichText();
  ordinals.span('Finishers: 1', base);
  ordinals.span('st', small.superscript());
  ordinals.span(', 2', base);
  ordinals.span('nd', small.superscript());
  ordinals.span(', 3', base);
  ordinals.span('rd', small.superscript());
  ordinals.span('.', base);
  ordinals.margin = new Thickness(0, 0, 0, 16);
  doc.add(ordinals);

  // ── Decoration styling ──
  const decoLabel = new Heading('Decoration styling');
  decoLabel.level = 2;
  decoLabel.fontName = StandardFonts.HelveticaBold;
  decoLabel.fontSize = 14;
  decoLabel.textColor = ColorPalette.slate[700];
  decoLabel.margin = new Thickness(0, 0, 0, 6);
  doc.add(decoLabel);

  // Block-level overline with a custom colour + thickness.
  const overlined = new TextBlock('Overlined section marker');
  overlined.fontName = StandardFonts.HelveticaBold;
  overlined.fontSize = 13;
  overlined.textColor = ColorPalette.slate[800];
  overlined.textDecoration = TextDecoration.Overline;
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
  const spacingLabel = new Heading('Letter & word spacing');
  spacingLabel.level = 2;
  spacingLabel.fontName = StandardFonts.HelveticaBold;
  spacingLabel.fontSize = 14;
  spacingLabel.textColor = ColorPalette.slate[700];
  spacingLabel.margin = new Thickness(0, 0, 0, 6);
  doc.add(spacingLabel);

  const tracked = new TextBlock('WIDE TRACKING FOR EMPHASIS');
  tracked.fontName = StandardFonts.HelveticaBold;
  tracked.fontSize = 12;
  tracked.textColor = ColorPalette.slate[800];
  tracked.letterSpacing = 3;
  tracked.margin = new Thickness(0, 0, 0, 4);
  doc.add(tracked);

  const airy = new TextBlock('Airy   word   spacing   opens   the   line.');
  airy.fontSize = 12;
  airy.textColor = ColorPalette.slate[700];
  airy.wordSpacing = 4;
  airy.margin = new Thickness(0, 0, 0, 16);
  doc.add(airy);

  // ── Line clamp ──
  const clampLabel = new Heading('Line clamp');
  clampLabel.level = 2;
  clampLabel.fontName = StandardFonts.HelveticaBold;
  clampLabel.fontSize = 14;
  clampLabel.textColor = ColorPalette.slate[700];
  clampLabel.margin = new Thickness(0, 0, 0, 6);
  doc.add(clampLabel);

  const clamped = new TextBlock(
    'This description is clamped to two lines: however much copy the product team writes, the card stays a fixed height and the overflow is replaced with an ellipsis so the layout never breaks.'
  );
  clamped.fontSize = 12;
  clamped.textColor = ColorPalette.slate[700];
  clamped.maxLines = 2;
  clamped.margin = new Thickness(0, 0, 0, 16);
  doc.add(clamped);

  // ── Paragraph controls ──
  const paraLabel = new Heading('Paragraph indent & spacing');
  paraLabel.level = 2;
  paraLabel.fontName = StandardFonts.HelveticaBold;
  paraLabel.fontSize = 14;
  paraLabel.textColor = ColorPalette.slate[700];
  paraLabel.margin = new Thickness(0, 0, 0, 6);
  doc.add(paraLabel);

  const prose = new TextBlock(
    'The first line of each paragraph is indented and a little air is inserted between paragraphs, the way a printed book sets body copy.\n' +
      'This second paragraph shows the inter-paragraph spacing and the matching first-line indent, all resolved during layout without manual spacers.'
  );
  prose.fontSize = 12;
  prose.textColor = ColorPalette.slate[700];
  prose.firstLineIndent = 24;
  prose.paragraphSpacing = 8;
  doc.add(prose);

  return doc;
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
