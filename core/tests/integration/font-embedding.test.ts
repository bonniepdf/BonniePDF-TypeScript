import { describe, it, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { assertValidPdf, assertPdfHasFonts } from '../helpers/test-base';

describe('FontEmbedding integration', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('Helvetica produces valid PDF with fonts', () => {
    doc = new Document();
    doc.add(new TextBlock('Helvetica text', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
    assertPdfHasFonts(bytes);
  });

  it('HelveticaBold produces valid PDF with fonts', () => {
    doc = new Document();
    doc.add(new TextBlock('Bold text', { fontSize: 12, fontName: StandardFonts.HelveticaBold }));
    assertPdfHasFonts(doc.generateBytes());
  });

  it('multiple standard fonts in same document', () => {
    doc = new Document();
    doc.add(new TextBlock('Helvetica', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    doc.add(new TextBlock('Helvetica Bold', { fontSize: 12, fontName: StandardFonts.HelveticaBold }));
    doc.add(new TextBlock('Helvetica Oblique', { fontSize: 12, fontName: StandardFonts.HelveticaOblique }));
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
    assertPdfHasFonts(bytes);
  });

  it('text alignment left generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock('Left aligned', { fontSize: 12, fontName: StandardFonts.Helvetica });
    tb.alignment = TextAlignment.Left;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('text alignment center generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock('Center aligned', { fontSize: 12, fontName: StandardFonts.Helvetica });
    tb.alignment = TextAlignment.Center;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('text alignment right generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock('Right aligned', { fontSize: 12, fontName: StandardFonts.Helvetica });
    tb.alignment = TextAlignment.Right;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('text alignment justify generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock('This is a justified paragraph with enough text to span across the full width.', {
      fontSize: 12,
      fontName: StandardFonts.Helvetica,
    });
    tb.alignment = TextAlignment.Justify;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('large font size produces valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('BIG TEXT', { fontSize: 48, fontName: StandardFonts.HelveticaBold }));
    assertValidPdf(doc.generateBytes());
  });

  it('small font size produces valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('tiny text', { fontSize: 6, fontName: StandardFonts.Helvetica }));
    assertValidPdf(doc.generateBytes());
  });
});
