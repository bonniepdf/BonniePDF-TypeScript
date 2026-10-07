/** Your first PDF: a document with a title, language, and one text block.
 * Build with generate(); export with await doc.generateBytesAsync(). */
import { Document, TextBlock } from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document({ metadata: { title: 'Invoice #2026-014' }, settings: { language: 'en-GB' } });
  doc.add(new TextBlock('Invoice #2026-014'));
  return doc;
}
