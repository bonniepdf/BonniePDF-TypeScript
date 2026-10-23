import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontManager } from '../../src/Typography/FontManager';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { TextDecoration } from '../../src/Elements/Text/TextDecoration';
import { FontWeight } from '../../src/Typography/FontWeight';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { pdfToText } from '../helpers/test-base';
import { readFileSync } from 'fs';
import { join } from 'path';

const fontsDir = join(__dirname, '../../assets/fonts');

describe('FontManager', () => {
  beforeEach(() => FontManager.clear());
  afterEach(() => FontManager.clear());

  it('registers font from bytes and looks up by family', () => {
    const bytes = readFileSync(join(fontsDir, 'LiberationSans-Regular.ttf'));
    FontManager.registerFont(new Uint8Array(bytes));
    expect(FontManager.getBytesForFamily('liberation sans', 'regular')).not.toBeNull();
  });

  it('getBytesForStandardFont returns bytes for known standard fonts after registration', () => {
    const bytes = readFileSync(join(fontsDir, 'LiberationSans-Regular.ttf'));
    FontManager.registerFont(new Uint8Array(bytes));
    expect(FontManager.getBytesForStandardFont('Helvetica')).not.toBeNull();
    expect(FontManager.getBytesForStandardFont('Symbol')).toBeNull();
  });

  it('autoRegisterBundledFonts registers all 12 variants', () => {
    FontManager.autoRegisterBundledFonts(fontsDir);
    expect(FontManager.hasBundledFonts()).toBe(true);
    expect(FontManager.getBytesForStandardFont('Helvetica')).not.toBeNull();
    expect(FontManager.getBytesForStandardFont('Times-Roman')).not.toBeNull();
    expect(FontManager.getBytesForStandardFont('Courier')).not.toBeNull();
  });

  it('PDF/A claim suppressed when Helvetica used without FontManager registration', () => {
    const doc = new Document();
    doc.settings.pdfAEnabled = true;
    doc.settings.version = PdfVersion.Pdf17;
    const tb = new TextBlock('Test');
    tb.fontName = 'Helvetica';
    tb.fontSize = 12;
    doc.add(tb);
    const pdf = pdfToText(doc.generateBytes());
    expect(pdf).not.toContain('pdfaid:part');
    expect(pdf).not.toContain('/OutputIntents');
    doc.dispose();
  });

  it('PDF/A claim emitted when all fonts are registered via FontManager', () => {
    FontManager.autoRegisterBundledFonts(fontsDir);
    const doc = new Document();
    doc.settings.pdfAEnabled = true;
    doc.settings.version = PdfVersion.Pdf17;
    const tb = new TextBlock('Test');
    tb.fontName = 'Helvetica';
    tb.fontSize = 12;
    doc.add(tb);
    const pdf = pdfToText(doc.generateBytes());
    // PDF/A compliance markers are present when fonts are embedded
    expect(pdf).toContain('/OutputIntents');
    expect(pdf).toContain('/GTS_PDFA1');
    doc.dispose();
  });
});

describe('PDF/UA-1 font embedding (veraPDF 7.21.4.1)', () => {
  beforeEach(() => FontManager.clear());
  afterEach(() => FontManager.clear());

  it('embeds standard-14 fonts in PDF/UA-1 output even without a PDF/A claim', () => {
    // PDF/UA-1 mandates font embedding independently of PDF/A. A tagged
    // document that uses Helvetica must substitute the embedded Liberation
    // face, not reference an unembedded /Type1 standard font.
    FontManager.autoRegisterBundledFonts(fontsDir);
    const doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    const tb = new TextBlock('Accessible text');
    tb.fontName = 'Helvetica';
    tb.fontSize = 12;
    doc.add(tb);
    const pdf = pdfToText(doc.generateBytes());
    expect(pdf).toContain('/FontFile2'); // embedded TrueType program
    expect(pdf).toContain('LiberationSans'); // metric-compatible substitute
    expect(pdf).not.toContain('/BaseFont /Helvetica'); // no unembedded standard-14
    doc.dispose();
  });

  it('leaves standard-14 fonts unembedded for a plain document (no PDF/A, no PDF/UA)', () => {
    // Regression guard: the UA-1 embedding path must not leak into ordinary
    // documents, where standard-14 fonts are legitimately referenced without
    // embedding.
    FontManager.autoRegisterBundledFonts(fontsDir);
    const doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    const tb = new TextBlock('Plain text');
    tb.fontName = 'Helvetica';
    tb.fontSize = 12;
    doc.add(tb);
    const pdf = pdfToText(doc.generateBytes());
    expect(pdf).toContain('/BaseFont /Helvetica');
    expect(pdf).not.toContain('/FontFile2');
    doc.dispose();
  });
});

describe('DefaultTextStyle cascade', () => {
  it('applies default font/size/color to elements that have not been explicitly styled', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle()
      .withFamily('Helvetica')
      .withSize(11)
      .withColor(ColorPalette.slate[600]);
    const tb = new TextBlock('Hello');
    doc.add(tb);
    // After generateBytes, the cascade should have applied
    doc.generateBytes();
    expect(tb.fontSize).toBe(11);
    expect(tb.color).toEqual(ColorPalette.slate[600]);
    doc.dispose();
  });

  it('does not override explicitly set font size', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withSize(11);
    const tb = new TextBlock('Hello');
    tb.fontSize = 24; // explicitly set
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontSize).toBe(24); // should NOT be overridden
    doc.dispose();
  });

  it('does not override explicitly set text color', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withColor(ColorPalette.slate[600]);
    const tb = new TextBlock('Hello');
    tb.color = Color.fromHex('#FF0000'); // explicitly set
    doc.add(tb);
    doc.generateBytes();
    expect(tb.color).toEqual(Color.fromHex('#FF0000'));
    doc.dispose();
  });

  it('keeps the default family when only the weight is set explicitly', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withFamily('Times');
    const tb = new TextBlock('Hello');
    tb.fontWeight = FontWeight.Bold; // weight only; family should still cascade
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontName).toBe('Times-Bold');
    doc.dispose();
  });

  it('keeps the default family when only italic is set explicitly', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withFamily('Times');
    const tb = new TextBlock('Hello');
    tb.italic = true;
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontName).toBe('Times-Italic');
    doc.dispose();
  });

  it('does not override an explicitly set family', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withFamily('Times');
    const tb = new TextBlock('Hello');
    tb.fontFamily = 'Courier';
    tb.fontWeight = FontWeight.Bold;
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontName).toBe('Courier-Bold');
    doc.dispose();
  });

  it('does not override an explicitly set weight with the default weight', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withFamily('Times').withWeight(FontWeight.Bold);
    const tb = new TextBlock('Hello');
    tb.fontWeight = FontWeight.Normal;
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontName).toBe('Times-Roman');
    doc.dispose();
  });

  it('applies a default weight given without a family', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withWeight(FontWeight.Bold);
    const tb = new TextBlock('Hello');
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontName).toBe('Helvetica-Bold');
    doc.dispose();
  });

  it('does not apply default weight or italic to a font named directly', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withWeight(FontWeight.Bold).withItalic();
    const tb = new TextBlock('Hello');
    tb.fontName = 'Courier';
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontName).toBe('Courier');
    doc.dispose();
  });

  it('applies a default decoration and does not override an explicit one', () => {
    const doc = new Document();
    const style = new TextStyle();
    style.decoration = TextDecoration.Underline;
    doc.settings.defaultTextStyle = style;
    const plain = new TextBlock('Plain');
    const explicit = new TextBlock('Explicit');
    explicit.decoration = TextDecoration.None;
    doc.add(plain);
    doc.add(explicit);
    doc.generateBytes();
    expect(plain.decoration).toBe(TextDecoration.Underline);
    expect(explicit.decoration).toBe(TextDecoration.None);
    doc.dispose();
  });

  it('re-applies a changed default on a later generation, but never over explicit values', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withSize(11).withColor(ColorPalette.slate[600]).withLineHeight(1.5);
    const cascaded = new TextBlock('Cascaded');
    const explicit = new TextBlock('Explicit');
    explicit.fontSize = 24;
    explicit.color = Color.fromHex('#FF0000');
    explicit.lineHeight = 2;
    doc.add(cascaded);
    doc.add(explicit);
    doc.generateBytes();
    expect(cascaded.fontSize).toBe(11);

    doc.settings.defaultTextStyle = new TextStyle().withSize(14).withColor(ColorPalette.slate[900]).withLineHeight(1.3);
    doc.generateBytes();
    expect(cascaded.fontSize).toBe(14);
    expect(cascaded.color).toEqual(ColorPalette.slate[900]);
    expect(cascaded.lineHeight).toBe(1.3);
    expect(explicit.fontSize).toBe(24);
    expect(explicit.color).toEqual(Color.fromHex('#FF0000'));
    expect(explicit.lineHeight).toBe(2);
    doc.dispose();
  });

  it('returns cascaded values to the library defaults when the default is removed', () => {
    const doc = new Document();
    const style = new TextStyle()
      .withFamily('Times')
      .withWeight(FontWeight.Bold)
      .withSize(20)
      .withColor(ColorPalette.slate[600])
      .withLineHeight(1.5);
    style.decoration = TextDecoration.Underline;
    doc.settings.defaultTextStyle = style;
    const tb = new TextBlock('Hello');
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontName).toBe('Times-Bold');
    expect(tb.fontSize).toBe(20);

    doc.settings.defaultTextStyle = undefined;
    doc.generateBytes();
    expect(tb.fontName).toBe('Helvetica');
    expect(tb.fontSize).toBe(12);
    expect(tb.color).toEqual(Color.black);
    expect(tb.lineHeight).toBe(1.2);
    expect(tb.decoration).toBe(TextDecoration.None);
    doc.dispose();
  });

  it('drops a property from a changed default, and keeps explicit values when the default is removed', () => {
    const doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withFamily('Times').withSize(20);
    const cascaded = new TextBlock('Cascaded');
    const explicit = new TextBlock('Explicit');
    explicit.fontSize = 30;
    explicit.fontWeight = FontWeight.Bold;
    doc.add(cascaded);
    doc.add(explicit);
    doc.generateBytes();
    expect(explicit.fontName).toBe('Times-Bold');

    doc.settings.defaultTextStyle = new TextStyle().withSize(14); // no family any more
    doc.generateBytes();
    expect(cascaded.fontName).toBe('Helvetica');
    expect(cascaded.fontSize).toBe(14);
    expect(explicit.fontName).toBe('Helvetica-Bold');

    doc.settings.defaultTextStyle = undefined;
    doc.generateBytes();
    expect(explicit.fontSize).toBe(30);
    expect(explicit.fontName).toBe('Helvetica-Bold');
    doc.dispose();
  });

  it('document without defaultTextStyle uses class defaults', () => {
    const doc = new Document();
    const tb = new TextBlock('Hello');
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontSize).toBe(12); // class default
    doc.dispose();
  });
});
