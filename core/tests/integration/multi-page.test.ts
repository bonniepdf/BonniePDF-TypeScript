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
import { asPdf17 } from '../../src/Extensions/DocumentSettingsExtensions';
import {
  assertValidPdf,
  assertPdfHasFonts,
  assertPdfHasPages,
  createMinimalJpeg,
} from '../helpers/test-base';

describe('MultiPage integration', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('single page document is valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('Hello, World!', 12, StandardFonts.Helvetica));
    assertValidPdf(doc.generateBytes());
  });

  it('multi-page document generates valid PDF', () => {
    doc = new Document();
    for (let i = 0; i < 3; i++) {
      doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1} content`, 12, StandardFonts.Helvetica));
    }
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
    assertPdfHasPages(bytes, 1);
  });

  it('document with fonts contains /Font in output', () => {
    doc = new Document();
    doc.add(new TextBlock('Some text', 12, StandardFonts.Helvetica));
    assertPdfHasFonts(doc.generateBytes());
  });

  it('document with multiple font styles', () => {
    doc = new Document();
    doc.add(new TextBlock('Normal', 12, StandardFonts.Helvetica));
    doc.add(new TextBlock('Bold', 12, StandardFonts.HelveticaBold));
    assertValidPdf(doc.generateBytes());
  });

  it('document with text alignment variants', () => {
    doc = new Document();
    const left = new TextBlock('Left aligned', 12, StandardFonts.Helvetica);
    left.alignment = TextAlignment.Left;
    const center = new TextBlock('Center aligned', 12, StandardFonts.Helvetica);
    center.alignment = TextAlignment.Center;
    const right = new TextBlock('Right aligned', 12, StandardFonts.Helvetica);
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
      new TextBlock('Cell 1', 10, StandardFonts.Helvetica),
      new TextBlock('Cell 2', 10, StandardFonts.Helvetica)
    );
    table.addRow(
      new TextBlock('Cell 3', 10, StandardFonts.Helvetica),
      new TextBlock('Cell 4', 10, StandardFonts.Helvetica)
    );
    doc.add(table);
    assertValidPdf(doc.generateBytes());
  });

  it('document with horizontal stack generates valid PDF', () => {
    doc = new Document();
    const stack = new HorizontalStack();
    stack.widthDistribution = WidthDistribution.Equal;
    stack.addChild(new TextBlock('Left column', 10, StandardFonts.Helvetica));
    stack.addChild(new TextBlock('Right column', 10, StandardFonts.Helvetica));
    doc.add(stack);
    assertValidPdf(doc.generateBytes());
  });

  it('landscape orientation document generates valid PDF', () => {
    doc = new Document();
    doc.addPage(PdfSize.a4, PageOrientation.Landscape);
    doc.add(new TextBlock('Landscape page', 12, StandardFonts.Helvetica));
    assertValidPdf(doc.generateBytes());
  });

  it('PDF 1.7 document generates valid PDF', () => {
    doc = new Document();
    asPdf17(doc.settings);
    doc.add(new TextBlock('PDF 1.7 content', 12, StandardFonts.Helvetica));
    assertValidPdf(doc.generateBytes());
  });

  it('document size is substantial', () => {
    doc = new Document();
    for (let i = 0; i < 5; i++) {
      doc.add(new TextBlock(`Paragraph ${i + 1}: This is some sample text to generate a reasonable sized PDF file.`, 12, StandardFonts.Helvetica));
    }
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(500);
  });
});
