import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontManager } from '../../src/Typography/FontManager';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { pdfToText } from '../helpers/test-base';
import { readFileSync } from 'fs';
import { join } from 'path';

const fontsDir = join(__dirname, '../../assets/fonts');

describe('this feature Stage 2 - FontManager', () => {
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

  it('document without defaultTextStyle uses class defaults', () => {
    const doc = new Document();
    const tb = new TextBlock('Hello');
    doc.add(tb);
    doc.generateBytes();
    expect(tb.fontSize).toBe(12); // class default
    doc.dispose();
  });
});
