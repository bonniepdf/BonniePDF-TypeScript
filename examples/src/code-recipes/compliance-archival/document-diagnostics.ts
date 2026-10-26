/** Inspect diagnostics after generation, then reject or repair incomplete output. */
import { Document, Heading, TextBlock } from '@bonniepdf/core';

export function generate(): Document {
  const doc = new Document({ metadata: { title: 'Check the generated document' }, settings: { language: 'en-GB' } });
  doc.add(new Heading('Check the generated document', { level: 1, fontSize: 24 }));
  doc.add(
    new TextBlock(
      'Await generation, then inspect document.diagnostics. A recoverable problem may produce a PDF while still dropping content.'
    )
  );
  doc.add(
    new TextBlock(
      'For strict text coverage, select missingGlyphs: throw. Repair the input or provide a covering font, and build a fresh document before retrying.',
      { margin: { top: 12 } }
    )
  );
  doc.add(
    new TextBlock(
      'Diagnostics are not a PDF/A or PDF/UA certificate. Validate the final file with the required external validator.',
      { margin: { top: 12 } }
    )
  );
  return doc;
}

/** Exercise a real warning and a clean retry without returning the incomplete PDF. */
export async function verifyDiagnostics(): Promise<void> {
  const incomplete = generate();
  try {
    incomplete.add(new TextBlock(String.fromCodePoint(0x10ffff)));
    await incomplete.generateBytesAsync();
    if (!incomplete.diagnostics.some(d => d.category === 'font' && d.severity === 'warning'))
      throw new Error('Expected a missing-character diagnostic.');
  } finally {
    incomplete.dispose();
  }
  const corrected = generate();
  try {
    await corrected.generateBytesAsync();
    if (corrected.diagnostics.some(d => d.severity === 'error' || d.severity === 'warning'))
      throw new Error('The corrected document still reports a problem.');
  } finally {
    corrected.dispose();
  }
}
