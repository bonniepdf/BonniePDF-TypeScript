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
  ColorPalette,
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
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);
  settings.margin = 60;

  const metadata = new DocumentMetadata();
  metadata.title = 'Rich Text Styles';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Inline mixed-style text using RichText spans. PDF/A-2a + PDF/UA-1.';
  metadata.keywords = 'pdf, rich text, inline styles, bold, italic, underline, highlights, pdf/ua, pdf/a, BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Title ─────────────────────────────────────────────────────────────────────

  const h1 = new Heading('Rich Text Styles');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const intro = new TextBlock(
    'RichText lets you mix bold, italic, coloured, highlighted, and differently-sized spans within a single ' +
      'flowing paragraph. All formatting is per-span while the text wraps and aligns as a unit. ' +
      'Every RichText is tagged as a /P element in the structure tree.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // ── 1. Weight & Style ─────────────────────────────────────────────────────────

  section(doc, 'Weight & Style', 's-weight');

  const boldItalic = new TextStyle();
  boldItalic.fontWeight = FontWeight.Bold;
  boldItalic.italic = true;

  const rt1 = new RichText();
  rt1.margin = new Thickness(0, 0, 0, 10);
  rt1
    .span('Inline text can be ')
    .span('bold', new TextStyle().bold())
    .span(', ')
    .span('italic', new TextStyle().withItalic())
    .span(', or ')
    .span('bold italic', boldItalic)
    .span(' — all within the same flowing paragraph. Scientific names like ')
    .span('Homo sapiens', new TextStyle().withItalic())
    .span(' are a classic use of italic, while ')
    .span('key terms', new TextStyle().bold())
    .span(' benefit from bold emphasis.');
  doc.add(rt1);

  // ── 2. Coloured Spans ─────────────────────────────────────────────────────────

  section(doc, 'Coloured Spans', 's-colors');

  const rt2 = new RichText();
  rt2.margin = new Thickness(0, 0, 0, 10);
  rt2
    .span('Text can be ')
    .span('red', new TextStyle().withColor(Color.red))
    .span(', ')
    .span('blue', new TextStyle().withColor(ColorPalette.blue[600]))
    .span(', ')
    .span('green', new TextStyle().withColor(ColorPalette.green[600]))
    .span(', or ')
    .span('any colour', new TextStyle().withColor(ColorPalette.purple[600]))
    .span(' you choose. Colour combines freely with weight: ')
    .span('bold indigo', new TextStyle().bold().withColor(ColorPalette.indigo[600]))
    .span(' is a common choice for strong inline emphasis.');
  doc.add(rt2);

  // ── 3. Inline Decorations ─────────────────────────────────────────────────────

  section(doc, 'Inline Decorations', 's-decorations');

  const rt3 = new RichText();
  rt3.margin = new Thickness(0, 0, 0, 10);
  rt3
    .span('Decorations are per-span: ')
    .span('underlined words', new TextStyle().underline())
    .span(', ')
    .span('strikethrough text', new TextStyle().strikethrough())
    .span(', and combinations like ')
    .span('bold underlined', new TextStyle().bold().underline())
    .span(' or ')
    .span('italic strikethrough', new TextStyle().withItalic().strikethrough())
    .span(' all flow naturally within a single paragraph.');
  doc.add(rt3);

  // ── 4. Background Highlights ──────────────────────────────────────────────────

  section(doc, 'Background Highlights', 's-highlights');

  const rt4 = new RichText();
  rt4.margin = new Thickness(0, 0, 0, 10);
  rt4
    .span('Background colours create a ')
    .span('highlighter pen effect', new TextStyle().withBackground(Color.fromHex('#fef08a')))
    .span(' across any span. Combine with colour for ')
    .span(
      'bold red alert text',
      new TextStyle().bold().withColor(Color.fromHex('#991b1b')).withBackground(Color.fromHex('#fecaca'))
    )
    .span(' or a ')
    .span(
      'green success note',
      new TextStyle().withColor(Color.fromHex('#166534')).withBackground(Color.fromHex('#bbf7d0'))
    )
    .span(' without breaking the paragraph flow.');
  doc.add(rt4);

  // ── 5. Mixed Font Sizes ───────────────────────────────────────────────────────

  section(doc, 'Mixed Font Sizes', 's-sizes');

  const rt5 = new RichText();
  rt5.margin = new Thickness(0, 0, 0, 10);
  rt5
    .span('The same paragraph can carry ')
    .span('larger text', new TextStyle().withSize(18))
    .span(' alongside ')
    .span('smaller text', new TextStyle().withSize(8))
    .span(' — useful for superscript markers, footnote labels, or legal fine print. ')
    .span('Line height adapts automatically to the tallest span on each line.');
  doc.add(rt5);

  // ── 6. Justified Alignment ────────────────────────────────────────────────────

  section(doc, 'Justified Alignment', 's-justified');

  const rt6 = new RichText();
  rt6.alignment = TextAlignment.Justify;
  rt6.margin = new Thickness(0, 0, 0, 10);
  rt6
    .span('Rich text supports ')
    .span('full justification', new TextStyle().bold())
    .span(' — text is evenly distributed across the line width even when spans carry ')
    .span('mixed styles', new TextStyle().withItalic())
    .span(
      '. Each span maintains its own formatting while word-spacing is adjusted to fill the available width. ' +
        'The final line remains left-aligned per typographic convention.'
    );
  doc.add(rt6);

  // ── 7. Reusable Styles ────────────────────────────────────────────────────────

  section(doc, 'Reusable Styles', 's-reusable');

  const labelStyle = new TextStyle();
  labelStyle.fontFamily = 'Helvetica';
  labelStyle.fontWeight = FontWeight.Bold;
  labelStyle.color = ColorPalette.slate[800];

  const valueStyle = new TextStyle();
  valueStyle.fontFamily = 'Helvetica';
  valueStyle.color = ColorPalette.indigo[600];

  const unitStyle = new TextStyle();
  unitStyle.fontFamily = 'Helvetica';
  unitStyle.fontSize = 9;
  unitStyle.color = ColorPalette.slate[400];

  const rows: [string, string, string][] = [
    ['Temperature:', '23.5', ' °C'],
    ['Pressure:', '1013.25', ' hPa'],
    ['Humidity:', '65', ' %'],
  ];
  for (const [label, value, unit] of rows) {
    const rt = new RichText();
    rt.margin = new Thickness(0, 0, 0, 4);
    rt.span(label, labelStyle).span(value, valueStyle).span(unit, unitStyle);
    doc.add(rt);
  }

  // ── Practical Example ─────────────────────────────────────────────────────────

  const divider = new Line();
  divider.color = ColorPalette.slate[300];
  divider.thickness = 1;
  divider.margin = new Thickness(0, 12, 0, 0);
  doc.add(divider);

  section(doc, 'Practical Example: Legal Disclaimer', 's-legal');

  const disclaimerBase = new TextStyle();
  disclaimerBase.fontFamily = 'Helvetica';
  disclaimerBase.fontSize = 10;
  disclaimerBase.color = ColorPalette.slate[600];

  const rt7 = new RichText();
  rt7.defaultStyle = disclaimerBase;
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
    .span('support@example.com', new TextStyle().withColor(ColorPalette.blue[600]))
    .span('.');
  doc.add(rt7);

  return doc;
}

function section(doc: Document, title: string, tocId: string): void {
  const h = new Heading(title);
  h.tocIdentifier = tocId;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 13;
  h.textColor = ColorPalette.indigo[600];
  h.margin = new Thickness(0, 14, 0, 6);
  doc.add(h);
}
