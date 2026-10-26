/** Use document-local fallback fonts and fail explicitly for missing characters. */
import { Document, Heading, TextBlock, MissingGlyphException } from '@bonniepdf/core';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const math = assets.get('fonts/NotoSansMath-Regular.ttf');
  if (!math) throw new Error('Supply fonts/NotoSansMath-Regular.ttf.');
  const doc = new Document({
    metadata: { title: 'Font fallback and missing characters' },
    settings: {
      language: 'en-GB',
      missingGlyphs: 'throw',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12 },
    },
  });
  doc.fonts.add(math, { family: 'Math fallback' });
  doc.add(new Heading('Font fallback', { level: 1, fontFamily: 'Helvetica', fontWeight: 'bold', fontSize: 24 }));
  doc.add(new TextBlock('Regular primary font: invoice, delivery and payment.'));
  doc.add(new TextBlock('Bold primary font: approved.', { fontWeight: 'bold', margin: { top: 12, bottom: 12 } }));
  doc.add(new TextBlock('Mathematical symbols use the registered fallback: ∑ ∫ ∞ ℝ.'));
  doc.add(
    new TextBlock(
      'The document requests strict glyph checking. An unsupported character raises MissingGlyphException instead of silently disappearing.',
      { margin: { top: 12 } }
    )
  );
  return doc;
}

/** A deliberate failure suitable for CI; never put the unsupported character in a real invoice. */
export async function verifyMissingCharacter(assets: ReadonlyMap<string, Uint8Array>): Promise<void> {
  const doc = generate(assets);
  try {
    doc.add(new TextBlock(String.fromCodePoint(0x10ffff)));
    try {
      await doc.generateBytesAsync();
    } catch (error) {
      if (error instanceof MissingGlyphException) return;
      throw error;
    }
    throw new Error('The unsupported character should fail strict glyph checking.');
  } finally {
    doc.dispose();
  }
}
