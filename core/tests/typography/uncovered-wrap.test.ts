import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

/**
 * Spec 19, Layout: a wrapping paragraph whose primary face lacks a character that fallback draws
 * (Noto Sans Hebrew has no full stop or digits) lays out instead of failing in the line breaker.
 */
describe('wrapping text the primary face cannot shape whole', () => {
  const hebrew = new Uint8Array(readFileSync(new URL('./fixtures/NotoSansHebrew-Regular.ttf', import.meta.url)));
  const paragraph =
    'תודה על הזמנתכם. ההזמנה אושרה ותגיע לכתובתכם בתוך 5 ימי עסקים. נא לעיין בפרטי ההזמנה שלהלן ולשמור מכתב זה.';

  for (const contentDirection of ['leftToRight', 'rightToLeft'] as const) {
    it(`generates and wraps the paragraph (${contentDirection})`, async () => {
      const doc = new Document();
      try {
        const face = doc.fonts.add(hebrew);
        doc.add(new TextBlock(paragraph, { fontName: face.fontName, fontSize: 14, contentDirection }));
        const svg = (await doc.generateSvgPagesAsync())[0];
        expect((await doc.generateBytesAsync()).length).toBeGreaterThan(0);
        // More than one line, so the line breaker ran.
        expect(svg.match(/<text\b/g)!.length).toBeGreaterThan(1);
      } finally {
        doc.dispose();
      }
    });
  }
});
