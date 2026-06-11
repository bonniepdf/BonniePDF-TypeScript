import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextAlignment,
  RichText,
  TextStyle,
  Heading,
  Line,
  Color,
  Thickness,
  StandardFonts,
  FontWeight,
  PdfAConformance,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate700);
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'Rich Text Styles - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Mixed inline formatting in a PDF/UA-1 accessible document.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, rich text, bold, italic, underline, strikethrough';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Rich Text Styles - PDF/UA-1');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock(
    'RichText lets you mix bold, italic, coloured, highlighted, and sized spans within a single flowing paragraph. All spans share the same /P structure-tree role - formatting is presentational only.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── 1. Bold ──────────────────────────────────────────────────────────────

  const h2Bold = new Heading('Bold Words');
  h2Bold.tocIdentifier = 's-bold';
  h2Bold.level = 2;
  h2Bold.fontName = StandardFonts.HelveticaBold;
  h2Bold.fontSize = 14;
  h2Bold.textColor = Color.indigo600;
  h2Bold.margin = new Thickness(0, 6, 0, 6);
  doc.add(h2Bold);

  const rt1 = new RichText();
  rt1.margin = new Thickness(0, 0, 0, 10);
  rt1
    .span('This paragraph contains ')
    .span('bold text', new TextStyle().bold())
    .span(' mixed with regular text. The ')
    .span('bold words', new TextStyle().bold())
    .span(' stand out while the text flows naturally as a single paragraph with automatic word wrapping.');
  doc.add(rt1);

  // ── 2. Italic ─────────────────────────────────────────────────────────────

  const h2Italic = new Heading('Italic Text');
  h2Italic.tocIdentifier = 's-italic';
  h2Italic.level = 2;
  h2Italic.fontName = StandardFonts.HelveticaBold;
  h2Italic.fontSize = 14;
  h2Italic.textColor = Color.indigo600;
  h2Italic.margin = new Thickness(0, 6, 0, 6);
  doc.add(h2Italic);

  const rt2 = new RichText();
  rt2.margin = new Thickness(0, 0, 0, 10);
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

  const h2BoldItalic = new Heading('Bold and Italic Combined');
  h2BoldItalic.tocIdentifier = 's-bold-italic';
  h2BoldItalic.level = 2;
  h2BoldItalic.fontName = StandardFonts.HelveticaBold;
  h2BoldItalic.fontSize = 14;
  h2BoldItalic.textColor = Color.indigo600;
  h2BoldItalic.margin = new Thickness(0, 6, 0, 6);
  doc.add(h2BoldItalic);

  const boldItalic = new TextStyle();
  boldItalic.weight = FontWeight.Bold;
  boldItalic.italic = true;
  const rt3 = new RichText();
  rt3.margin = new Thickness(0, 0, 0, 10);
  rt3
    .span('You can combine ')
    .span('bold', new TextStyle().bold())
    .span(', ')
    .span('italic', new TextStyle().withItalic())
    .span(', and ')
    .span('bold italic', boldItalic)
    .span(' styles within a single flowing paragraph.');
  doc.add(rt3);

  // ── 4. Coloured spans ─────────────────────────────────────────────────────

  const h2Colors = new Heading('Coloured Spans');
  h2Colors.tocIdentifier = 's-colors';
  h2Colors.level = 2;
  h2Colors.fontName = StandardFonts.HelveticaBold;
  h2Colors.fontSize = 14;
  h2Colors.textColor = Color.indigo600;
  h2Colors.margin = new Thickness(0, 6, 0, 6);
  doc.add(h2Colors);

  const rt4 = new RichText();
  rt4.margin = new Thickness(0, 0, 0, 10);
  rt4
    .span('Text can be ')
    .span('red', new TextStyle().withColor(Color.red))
    .span(', ')
    .span('blue', new TextStyle().withColor(Color.blue600))
    .span(', ')
    .span('green', new TextStyle().withColor(Color.green600))
    .span(', or ')
    .span('any colour', new TextStyle().withColor(Color.purple600))
    .span(' you choose. Colours can be combined with ')
    .span('bold coloured text', new TextStyle().bold().withColor(Color.indigo600))
    .span(' for maximum emphasis.');
  doc.add(rt4);

  // ── 5. Inline decorations ─────────────────────────────────────────────────

  const h2Dec = new Heading('Inline Decorations');
  h2Dec.tocIdentifier = 's-decorations';
  h2Dec.level = 2;
  h2Dec.fontName = StandardFonts.HelveticaBold;
  h2Dec.fontSize = 14;
  h2Dec.textColor = Color.indigo600;
  h2Dec.margin = new Thickness(0, 6, 0, 6);
  doc.add(h2Dec);

  const rt5 = new RichText();
  rt5.margin = new Thickness(0, 0, 0, 10);
  rt5
    .span('Decorations work per-span: ')
    .span('underlined words', new TextStyle().underline())
    .span(' and ')
    .span('strikethrough words', new TextStyle().strikethrough())
    .span(' can appear anywhere in the paragraph, including ')
    .span('bold underlined', new TextStyle().bold().underline())
    .span(' combinations.');
  doc.add(rt5);

  // ── 6. Justified rich text ────────────────────────────────────────────────

  const h2Just = new Heading('Justified Alignment');
  h2Just.tocIdentifier = 's-justified';
  h2Just.level = 2;
  h2Just.fontName = StandardFonts.HelveticaBold;
  h2Just.fontSize = 14;
  h2Just.textColor = Color.indigo600;
  h2Just.margin = new Thickness(0, 6, 0, 6);
  doc.add(h2Just);

  const rt6 = new RichText();
  rt6.alignment = TextAlignment.Justify;
  rt6.margin = new Thickness(0, 0, 0, 10);
  rt6
    .span('Rich text supports ')
    .span('full justification', new TextStyle().bold())
    .span(' where the text is evenly distributed across the line width. This works with ')
    .span('mixed styles', new TextStyle().withItalic())
    .span(
      ' - each span maintains its own formatting while the spacing between words is adjusted to fill the available width. The last line remains left-aligned as per standard typographic convention.'
    );
  doc.add(rt6);

  // ── 7. Legal disclaimer ───────────────────────────────────────────────────

  const divider = new Line();
  divider.color = Color.slate300;
  divider.thickness = 1;
  doc.add(divider);

  const h2Legal = new Heading('Practical Example: Legal Disclaimer');
  h2Legal.tocIdentifier = 's-legal';
  h2Legal.level = 2;
  h2Legal.fontName = StandardFonts.HelveticaBold;
  h2Legal.fontSize = 14;
  h2Legal.textColor = Color.indigo600;
  h2Legal.margin = new Thickness(0, 10, 0, 6);
  doc.add(h2Legal);

  const disclaimerDefault = new TextStyle();
  disclaimerDefault.fontFamily = 'Helvetica';
  disclaimerDefault.fontSize = 10;
  disclaimerDefault.color = Color.slate600;

  const rt7 = new RichText();
  rt7.defaultStyle = disclaimerDefault;
  rt7.alignment = TextAlignment.Justify;
  rt7.margin = new Thickness(0, 0, 0, 10);
  rt7
    .span('IMPORTANT: ', new TextStyle().bold().withColor(Color.red))
    .span('By using this software, you agree to the ')
    .span('Terms of Service', new TextStyle().bold().underline())
    .span(' and ')
    .span('Privacy Policy', new TextStyle().bold().underline())
    .span('. All data is processed in accordance with ')
    .span('GDPR', new TextStyle().bold())
    .span(' regulations. For questions, contact ')
    .span('support@example.com', new TextStyle().withColor(Color.blue600))
    .span('.');
  doc.add(rt7);

  return doc;
}
