import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  TextBlock,
  TextAlignment,
  RichText,
  TextStyle,
  Spacer,
  Line,
  Color,
  ColorPalette,
  Thickness,
  StandardFonts,
  FontWeight,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[600]);
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'Rich Text';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  const title = new TextBlock('Rich Text (Mixed Styling)');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];
  title.margin = new Thickness(0, 0, 0, 20);
  doc.add(title);

  // ── 1. Bold words ─────────────────────────────────────────────────────────
  const sectionHeader1 = new TextBlock('Bold Words in a Paragraph');
  sectionHeader1.fontName = StandardFonts.HelveticaBold;
  sectionHeader1.fontSize = 14;
  sectionHeader1.textColor = ColorPalette.indigo[600];
  sectionHeader1.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader1);
  const rt1 = new RichText();
  rt1.margin = new Thickness(0, 0, 0, 16);
  rt1
    .span('This paragraph contains ')
    .span('bold text', new TextStyle().bold())
    .span(' mixed with regular text. The ')
    .span('bold words', new TextStyle().bold())
    .span(' stand out while the text flows naturally as a single paragraph with automatic word wrapping.');
  doc.add(rt1);

  // ── 2. Italic ─────────────────────────────────────────────────────────────
  const sectionHeader2 = new TextBlock('Italic Text');
  sectionHeader2.fontName = StandardFonts.HelveticaBold;
  sectionHeader2.fontSize = 14;
  sectionHeader2.textColor = ColorPalette.indigo[600];
  sectionHeader2.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader2);
  const rt2 = new RichText();
  rt2.margin = new Thickness(0, 0, 0, 16);
  rt2
    .span('Scientific names are typically written in ')
    .span('italic', new TextStyle().withItalic())
    .span(', such as ')
    .span('Homo sapiens', new TextStyle().withItalic())
    .span(' or ')
    .span('Escherichia coli', new TextStyle().withItalic())
    .span('. This convention helps distinguish taxonomic nomenclature from surrounding text.');
  doc.add(rt2);

  // ── 3. Bold + Italic ──────────────────────────────────────────────────────
  const sectionHeader3 = new TextBlock('Bold and Italic Combined');
  sectionHeader3.fontName = StandardFonts.HelveticaBold;
  sectionHeader3.fontSize = 14;
  sectionHeader3.textColor = ColorPalette.indigo[600];
  sectionHeader3.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader3);
  const boldItalic = new TextStyle();
  boldItalic.weight = FontWeight.Bold;
  boldItalic.italic = true;
  const rt3 = new RichText();
  rt3.margin = new Thickness(0, 0, 0, 16);
  rt3
    .span('You can combine ')
    .span('bold', new TextStyle().bold())
    .span(', ')
    .span('italic', new TextStyle().withItalic())
    .span(', and ')
    .span('bold italic', boldItalic)
    .span(' styles within a single flowing paragraph.');
  doc.add(rt3);

  // ── 4. Colored spans ──────────────────────────────────────────────────────
  const sectionHeader4 = new TextBlock('Colored Spans');
  sectionHeader4.fontName = StandardFonts.HelveticaBold;
  sectionHeader4.fontSize = 14;
  sectionHeader4.textColor = ColorPalette.indigo[600];
  sectionHeader4.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader4);
  const rt4 = new RichText();
  rt4.margin = new Thickness(0, 0, 0, 16);
  rt4
    .span('Text can be ')
    .span('red', new TextStyle().withColor(Color.red))
    .span(', ')
    .span('blue', new TextStyle().withColor(ColorPalette.blue[600]))
    .span(', ')
    .span('green', new TextStyle().withColor(ColorPalette.green[600]))
    .span(', or ')
    .span('any color', new TextStyle().withColor(ColorPalette.purple[600]))
    .span(' you choose. Colors can be combined with ')
    .span('bold colored text', new TextStyle().bold().withColor(ColorPalette.indigo[600]))
    .span(' for maximum emphasis.');
  doc.add(rt4);

  // ── 5. Inline decorations ─────────────────────────────────────────────────
  const sectionHeader5 = new TextBlock('Inline Decorations');
  sectionHeader5.fontName = StandardFonts.HelveticaBold;
  sectionHeader5.fontSize = 14;
  sectionHeader5.textColor = ColorPalette.indigo[600];
  sectionHeader5.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader5);
  const rt5 = new RichText();
  rt5.margin = new Thickness(0, 0, 0, 16);
  rt5
    .span('Decorations work per-span: ')
    .span('underlined words', new TextStyle().underline())
    .span(' and ')
    .span('strikethrough words', new TextStyle().strikethrough())
    .span(' can appear anywhere in the paragraph, including ')
    .span('bold underlined', new TextStyle().bold().underline())
    .span(' combinations.');
  doc.add(rt5);

  // ── 6. Mixed font sizes ───────────────────────────────────────────────────
  const sectionHeader6 = new TextBlock('Mixed Font Sizes');
  sectionHeader6.fontName = StandardFonts.HelveticaBold;
  sectionHeader6.fontSize = 14;
  sectionHeader6.textColor = ColorPalette.indigo[600];
  sectionHeader6.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader6);
  const rt6 = new RichText();
  rt6.margin = new Thickness(0, 0, 0, 16);
  rt6
    .span('Normal text can include ')
    .span('larger text', new TextStyle().withSize(18))
    .span(' and ')
    .span('smaller text', new TextStyle().withSize(8))
    .span(' within the same paragraph. The line height adjusts to accommodate the tallest text on each line.');
  doc.add(rt6);

  // ── 7. Background highlights ─────────────────────────────────────────────
  const sectionHeader7 = new TextBlock('Background Highlights');
  sectionHeader7.fontName = StandardFonts.HelveticaBold;
  sectionHeader7.fontSize = 14;
  sectionHeader7.textColor = ColorPalette.indigo[600];
  sectionHeader7.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader7);
  const rt7 = new RichText();
  rt7.margin = new Thickness(0, 0, 0, 16);
  rt7
    .span('You can ')
    .span('highlight important text', new TextStyle().withBackground(Color.fromHex('#fef08a')))
    .span(' with background colors, similar to a ')
    .span('marker pen', new TextStyle().withBackground(Color.fromHex('#bbf7d0')).bold())
    .span(' effect. Great for ')
    .span(
      'drawing attention',
      new TextStyle().withBackground(Color.fromHex('#fecaca')).withColor(Color.fromHex('#991b1b'))
    )
    .span(' to key information.');
  doc.add(rt7);

  // ── 8. Reusable styles ────────────────────────────────────────────────────
  const sectionHeader8 = new TextBlock('Reusable TextStyle Objects');
  sectionHeader8.fontName = StandardFonts.HelveticaBold;
  sectionHeader8.fontSize = 14;
  sectionHeader8.textColor = ColorPalette.indigo[600];
  sectionHeader8.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader8);

  const labelStyle = new TextStyle();
  labelStyle.fontFamily = 'Helvetica';
  labelStyle.weight = FontWeight.Bold;
  labelStyle.color = ColorPalette.slate[800];

  const valueStyle = new TextStyle();
  valueStyle.fontFamily = 'Helvetica';
  valueStyle.color = ColorPalette.blue[600];

  const unitStyle = new TextStyle();
  unitStyle.fontFamily = 'Helvetica';
  unitStyle.fontSize = 9;
  unitStyle.color = ColorPalette.slate[500];

  const rtTemp = new RichText();
  rtTemp.margin = new Thickness(0, 0, 0, 4);
  rtTemp.span('Temperature: ', labelStyle).span('23.5', valueStyle).span(' degrees Celsius', unitStyle);
  doc.add(rtTemp);

  const rtPres = new RichText();
  rtPres.margin = new Thickness(0, 0, 0, 4);
  rtPres.span('Pressure: ', labelStyle).span('1013.25', valueStyle).span(' hPa', unitStyle);
  doc.add(rtPres);

  const rtHum = new RichText();
  rtHum.margin = new Thickness(0, 0, 0, 16);
  rtHum.span('Humidity: ', labelStyle).span('65', valueStyle).span(' %', unitStyle);
  doc.add(rtHum);

  // ── 9. Font weight variants ───────────────────────────────────────────────
  const sectionHeader9 = new TextBlock('Font Weight Variants');
  sectionHeader9.fontName = StandardFonts.HelveticaBold;
  sectionHeader9.fontSize = 14;
  sectionHeader9.textColor = ColorPalette.indigo[600];
  sectionHeader9.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader9);
  const normalStyle = new TextStyle();
  normalStyle.weight = FontWeight.Normal;
  const boldStyle = new TextStyle();
  boldStyle.weight = FontWeight.Bold;
  const rt9 = new RichText();
  rt9.margin = new Thickness(0, 0, 0, 16);
  rt9
    .span('Normal (400) ', normalStyle)
    .span('Bold (700) ', boldStyle)
    .span('Normal again. ', normalStyle)
    .span('Standard PDF fonts support Normal and Bold weights. Custom TTF fonts can support the full 100–900 range.');
  doc.add(rt9);

  // ── 10. Justified rich text ───────────────────────────────────────────────
  const sectionHeader10 = new TextBlock('Justified Alignment');
  sectionHeader10.fontName = StandardFonts.HelveticaBold;
  sectionHeader10.fontSize = 14;
  sectionHeader10.textColor = ColorPalette.indigo[600];
  sectionHeader10.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader10);
  const rt10 = new RichText();
  rt10.alignment = TextAlignment.Justify;
  rt10.margin = new Thickness(0, 0, 0, 16);
  rt10
    .span('Rich text supports ')
    .span('full justification', new TextStyle().bold())
    .span(' where the text is evenly distributed across the line width. This works with ')
    .span('mixed styles', new TextStyle().withItalic())
    .span(
      ' - each span maintains its own formatting while the spacing between words is adjusted to fill the available width. The last line remains left-aligned as per standard typographic convention.'
    );
  doc.add(rt10);

  // ── 11. Legal disclaimer ──────────────────────────────────────────────────
  doc.add(new Spacer(12));
  const divider = new Line();
  divider.color = ColorPalette.slate[300];
  divider.thickness = 1;
  doc.add(divider);
  const sectionHeader11 = new TextBlock('Practical Example: Legal Disclaimer');
  sectionHeader11.fontName = StandardFonts.HelveticaBold;
  sectionHeader11.fontSize = 14;
  sectionHeader11.textColor = ColorPalette.indigo[600];
  sectionHeader11.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader11);

  const disclaimerDefault = new TextStyle();
  disclaimerDefault.fontFamily = 'Helvetica';
  disclaimerDefault.fontSize = 10;
  disclaimerDefault.color = ColorPalette.slate[600];

  const rt11 = new RichText();
  rt11.defaultStyle = disclaimerDefault;
  rt11.alignment = TextAlignment.Justify;
  rt11.margin = new Thickness(0, 0, 0, 16);
  rt11
    .span('IMPORTANT: ', new TextStyle().bold().withColor(Color.red))
    .span('By using this software, you agree to the ')
    .span('Terms of Service', new TextStyle().bold().underline())
    .span(' and ')
    .span('Privacy Policy', new TextStyle().bold().underline())
    .span('. All data is processed in accordance with ')
    .span('GDPR', new TextStyle().bold())
    .span(' regulations. For questions, contact ')
    .span('support@example.com', new TextStyle().withColor(ColorPalette.blue[600]))
    .span('.');
  doc.add(rt11);

  // ── 12. Callback-based styling ────────────────────────────────────────────
  const sectionHeader12 = new TextBlock('Callback-based Styling');
  sectionHeader12.fontName = StandardFonts.HelveticaBold;
  sectionHeader12.fontSize = 14;
  sectionHeader12.textColor = ColorPalette.indigo[600];
  sectionHeader12.margin = new Thickness(0, 12, 0, 6);
  doc.add(sectionHeader12);
  const rt12 = new RichText();
  rt12.margin = new Thickness(0, 0, 0, 16);
  rt12
    .span('The callback API lets you configure styles inline: ')
    .spanWithConfigure('bold blue', s => s.bold().withColor(ColorPalette.blue[600]))
    .span(', ')
    .spanWithConfigure('italic green', s => s.withItalic().withColor(ColorPalette.green[600]))
    .span(', ')
    .spanWithConfigure('underlined red', s => s.underline().withColor(Color.red))
    .span('. Useful for one-off styles.');
  doc.add(rt12);

  return doc;
}
