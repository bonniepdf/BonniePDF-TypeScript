/**
 * Your First PDF.
 * The four-line minimum from the getting-started page: one Document, one TextBlock, one PDF. The output of exactly the snippet the docs show.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import { Document, TextBlock } from '@bonniepdf/core';

/**
 * The smallest possible BonniePDF document - exactly the "Your first PDF"
 * snippet from the TypeScript and .NET getting-started pages: construct a
 * Document, add a TextBlock, generate. The gallery preview is the literal
 * output of these four lines, so the docs pages can show the document this
 * code produces, and the .NET snippet produces the same bytes.
 */
export function generate(): Document {
  const doc = new Document();
  doc.add(new TextBlock('Invoice #2026-014'));
  return doc;
}
