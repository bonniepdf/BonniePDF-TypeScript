import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { WidthDistribution } from '../../src/Elements/Layout/WidthDistribution';
import { Table } from '../../src/Elements/Tables/Table';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { PageOrientation } from '../../src/Core/PageOrientation';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { asPdf17 } from '../../src/Configuration/DocumentSettingsPresets';
import { assertValidPdf, assertPdfHasFonts, assertPdfHasPages } from '../helpers/test-base';

describe('MultiPage integration', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('single page document is valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('Hello, World!', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    assertValidPdf(doc.generateBytes());
  });

  it('multi-page document generates valid PDF', () => {
    doc = new Document();
    for (let i = 0; i < 3; i++) {
      doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1} content`, { fontSize: 12, fontName: StandardFonts.Helvetica }));
    }
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
    assertPdfHasPages(bytes, 1);
  });

  it('document with fonts contains /Font in output', () => {
    doc = new Document();
    doc.add(new TextBlock('Some text', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    assertPdfHasFonts(doc.generateBytes());
  });

  it('document with multiple font styles', () => {
    doc = new Document();
    doc.add(new TextBlock('Normal', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    doc.add(new TextBlock('Bold', { fontSize: 12, fontName: StandardFonts.HelveticaBold }));
    assertValidPdf(doc.generateBytes());
  });

  it('document with text alignment variants', () => {
    doc = new Document();
    const left = new TextBlock('Left aligned', { fontSize: 12, fontName: StandardFonts.Helvetica });
    left.alignment = TextAlignment.Left;
    const center = new TextBlock('Center aligned', { fontSize: 12, fontName: StandardFonts.Helvetica });
    center.alignment = TextAlignment.Center;
    const right = new TextBlock('Right aligned', { fontSize: 12, fontName: StandardFonts.Helvetica });
    right.alignment = TextAlignment.Right;
    doc.add(left);
    doc.add(center);
    doc.add(right);
    assertValidPdf(doc.generateBytes());
  });

  it('document with table generates valid PDF', () => {
    doc = new Document();
    const table = new Table(50, 50);
    table.addRow(
      new TextBlock('Cell 1', { fontSize: 10, fontName: StandardFonts.Helvetica }),
      new TextBlock('Cell 2', { fontSize: 10, fontName: StandardFonts.Helvetica })
    );
    table.addRow(
      new TextBlock('Cell 3', { fontSize: 10, fontName: StandardFonts.Helvetica }),
      new TextBlock('Cell 4', { fontSize: 10, fontName: StandardFonts.Helvetica })
    );
    doc.add(table);
    assertValidPdf(doc.generateBytes());
  });

  it('document with horizontal stack generates valid PDF', () => {
    doc = new Document();
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Equal;
    stack.add(new TextBlock('Left column', { fontSize: 10, fontName: StandardFonts.Helvetica }));
    stack.add(new TextBlock('Right column', { fontSize: 10, fontName: StandardFonts.Helvetica }));
    doc.add(stack);
    assertValidPdf(doc.generateBytes());
  });

  it('landscape orientation document generates valid PDF', () => {
    doc = new Document();
    doc.addPage(PdfSize.a4, PageOrientation.Landscape);
    doc.add(new TextBlock('Landscape page', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    assertValidPdf(doc.generateBytes());
  });

  it('PDF 1.7 document generates valid PDF', () => {
    doc = new Document();
    asPdf17(doc.settings);
    doc.add(new TextBlock('PDF 1.7 content', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    assertValidPdf(doc.generateBytes());
  });

  it('document size is substantial', () => {
    doc = new Document();
    for (let i = 0; i < 5; i++) {
      doc.add(
        new TextBlock(`Paragraph ${i + 1}: This is some sample text to generate a reasonable sized PDF file.`, {
          fontSize: 12,
          fontName: StandardFonts.Helvetica,
        })
      );
    }
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(500);
  });
});
