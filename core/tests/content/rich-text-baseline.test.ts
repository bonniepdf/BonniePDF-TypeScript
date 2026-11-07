import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { RichText } from '../../src/Elements/Text/RichText';
import { TextStyle } from '../../src/Elements/Text/TextStyle';

/** Spec 03, RichText shared baseline: spans on a line sit on the baseline of its largest font. */
describe('rich text baseline', () => {
  async function baselines(): Promise<Map<string, number>> {
    const doc = new Document();
    doc.add(
      new RichText()
        .span('Water', new TextStyle({ fontSize: 14 }))
        .span('small', new TextStyle({ fontSize: 8 }))
        .span('sub', new TextStyle({ fontSize: 8, baselineAlignment: 'subscript' }))
        .span('sup', new TextStyle({ fontSize: 8, baselineAlignment: 'superscript' }))
    );
    try {
      const svg = (await doc.generateSvgPagesAsync())[0];
      const ys = new Map<string, number>();
      for (const m of svg.matchAll(/<text[^>]*\sy="([\d.]+)"[^>]*>([^<]*)<\/text>/g)) ys.set(m[2].trim(), Number(m[1]));
      return ys;
    } finally {
      doc.dispose();
    }
  }

  it('puts a smaller span on the same baseline as the larger text', async () => {
    const ys = await baselines();
    expect(ys.get('small')).toBeCloseTo(ys.get('Water')!, 2);
  });

  it('lowers a subscript below the baseline and raises a superscript above it', async () => {
    const ys = await baselines();
    expect(ys.get('sub')!).toBeGreaterThan(ys.get('Water')!);
    expect(ys.get('sup')!).toBeLessThan(ys.get('Water')!);
  });
});
