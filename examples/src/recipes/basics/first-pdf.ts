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
