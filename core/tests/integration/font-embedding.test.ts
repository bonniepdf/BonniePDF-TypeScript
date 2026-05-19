import { describe, it, expect, afterEach } from 'vitest';
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
    doc.add(new TextBlock('Helvetica text', 12, StandardFonts.Helvetica));
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
    assertPdfHasFonts(bytes);
  });

  it('HelveticaBold produces valid PDF with fonts', () => {
    doc = new Document();
    doc.add(new TextBlock('Bold text', 12, StandardFonts.HelveticaBold));
    assertPdfHasFonts(doc.generateBytes());
  });

  it('multiple standard fonts in same document', () => {
    doc = new Document();
    doc.add(new TextBlock('Helvetica', 12, StandardFonts.Helvetica));
    doc.add(new TextBlock('Helvetica Bold', 12, StandardFonts.HelveticaBold));
    doc.add(new TextBlock('Helvetica Oblique', 12, StandardFonts.HelveticaOblique));
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
    assertPdfHasFonts(bytes);
  });

  it('text alignment left generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock('Left aligned', 12, StandardFonts.Helvetica);
    tb.alignment = TextAlignment.Left;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('text alignment center generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock('Center aligned', 12, StandardFonts.Helvetica);
    tb.alignment = TextAlignment.Center;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('text alignment right generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock('Right aligned', 12, StandardFonts.Helvetica);
    tb.alignment = TextAlignment.Right;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('text alignment justify generates valid PDF', () => {
    doc = new Document();
    const tb = new TextBlock(
      'This is a justified paragraph with enough text to span across the full width.',
      12,
      StandardFonts.Helvetica
    );
    tb.alignment = TextAlignment.Justify;
    doc.add(tb);
    assertValidPdf(doc.generateBytes());
  });

  it('large font size produces valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('BIG TEXT', 48, StandardFonts.HelveticaBold));
    assertValidPdf(doc.generateBytes());
  });

  it('small font size produces valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('tiny text', 6, StandardFonts.Helvetica));
    assertValidPdf(doc.generateBytes());
  });
});
