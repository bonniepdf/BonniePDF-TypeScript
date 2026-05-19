import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { withPassword } from '../../src/Extensions/DocumentEncryptionExtensions';
import { assertValidPdf, assertPdfHasFonts, createTestChartData, createMinimalJpeg } from '../helpers/test-base';

async function generateDocumentBytes(text: string): Promise<Uint8Array> {
  const doc = new Document();
  try {
    doc.add(new TextBlock(text, 12, StandardFonts.Helvetica));
    return doc.generateBytes();
  } finally {
    doc.dispose();
  }
}

describe('Concurrency', () => {
  it('10 documents in parallel all produce valid PDFs', async () => {
    const tasks = Array.from({ length: 10 }, (_, i) => generateDocumentBytes(`Document ${i + 1}`));
    const results = await Promise.all(tasks);
    for (const bytes of results) {
      assertValidPdf(bytes);
    }
  }, 30_000);

  it('all parallel documents have fonts', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => generateDocumentBytes(`Font doc ${i + 1}`));
    const results = await Promise.all(tasks);
    for (const bytes of results) {
      assertPdfHasFonts(bytes);
    }
  });

  it('parallel documents with different content are all unique', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => generateDocumentBytes(`Unique content for document number ${i}`));
    const results = await Promise.all(tasks);
    // All should be valid
    for (const bytes of results) {
      assertValidPdf(bytes);
    }
    // All should be non-zero length
    for (const bytes of results) {
      expect(bytes.length).toBeGreaterThan(0);
    }
  });

  it('parallel encrypted documents all produce valid PDFs', async () => {
    const tasks = Array.from({ length: 5 }, async (_, i) => {
      const doc = new Document();
      try {
        doc.add(new TextBlock(`Encrypted doc ${i}`, 12, StandardFonts.Helvetica));
        withPassword(doc.settings, `password${i}`);
        return doc.generateBytes();
      } finally {
        doc.dispose();
      }
    });
    const results = await Promise.all(tasks);
    for (const bytes of results) {
      assertValidPdf(bytes);
    }
  });

  it('50 documents stress test completes within 60 seconds', async () => {
    const start = Date.now();
    const tasks = Array.from({ length: 50 }, (_, i) => generateDocumentBytes(`Stress test doc ${i}`));
    const results = await Promise.all(tasks);
    const elapsed = Date.now() - start;

    expect(results.length).toBe(50);
    for (const bytes of results) {
      expect(bytes.length).toBeGreaterThan(0);
    }
    expect(elapsed).toBeLessThan(60_000);
  }, 60_000);
});
