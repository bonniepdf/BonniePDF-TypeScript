import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { WidthDistribution } from '../../src/Elements/Layout/WidthDistribution';
import { Table } from '../../src/Elements/Tables/Table';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { assertValidPdf } from '../helpers/test-base';

describe('LargeDocument integration', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('100-page document generates valid PDF', () => {
    doc = new Document();
    for (let i = 0; i < 100; i++) {
      if (i > 0) doc.addPage();
      doc.add(
        new TextBlock(`Page ${i + 1} - This is a test paragraph with some content.`, {
          fontSize: 12,
          fontName: StandardFonts.Helvetica,
        })
      );
    }
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
    expect(bytes.length).toBeGreaterThan(1000);
  }, 60_000);

  it('document with 500 text blocks generates valid PDF', () => {
    doc = new Document();
    for (let i = 0; i < 500; i++) {
      doc.add(
        new TextBlock(`Block ${i + 1}: Lorem ipsum dolor sit amet.`, {
          fontSize: 10,
          fontName: StandardFonts.Helvetica,
        })
      );
    }
    const bytes = doc.generateBytes();
    assertValidPdf(bytes);
  }, 60_000);

  it('document with many horizontal stacks generates valid PDF', () => {
    doc = new Document();
    for (let i = 0; i < 20; i++) {
      const stack = new HorizontalStack();
      stack.widthDistribution = WidthDistribution.Equal;
      stack.add(new TextBlock(`Left ${i}`, { fontSize: 10, fontName: StandardFonts.Helvetica }));
      stack.add(new TextBlock(`Right ${i}`, { fontSize: 10, fontName: StandardFonts.Helvetica }));
      doc.add(stack);
    }
    assertValidPdf(doc.generateBytes());
  });

  it('document with many table rows generates valid PDF', () => {
    doc = new Document();
    const table = new Table(33, 33, 34);
    table.addHeader(
      new TextBlock('Column A', { fontSize: 10, fontName: StandardFonts.HelveticaBold }),
      new TextBlock('Column B', { fontSize: 10, fontName: StandardFonts.HelveticaBold }),
      new TextBlock('Column C', { fontSize: 10, fontName: StandardFonts.HelveticaBold })
    );
    for (let i = 0; i < 50; i++) {
      table.addRow(
        new TextBlock(`A${i}`, { fontSize: 9, fontName: StandardFonts.Helvetica }),
        new TextBlock(`B${i}`, { fontSize: 9, fontName: StandardFonts.Helvetica }),
        new TextBlock(`C${i}`, { fontSize: 9, fontName: StandardFonts.Helvetica })
      );
    }
    doc.add(table);
    assertValidPdf(doc.generateBytes());
  });

  it('large document performance: 100 pages in reasonable time', () => {
    const start = Date.now();
    doc = new Document();
    for (let i = 0; i < 100; i++) {
      if (i > 0) doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1} content.`, { fontSize: 12, fontName: StandardFonts.Helvetica }));
    }
    doc.generateBytes();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(30_000);
  }, 30_000);
});
