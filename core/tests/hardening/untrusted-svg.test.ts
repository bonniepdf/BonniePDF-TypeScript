import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Svg } from '../../src/Elements/Media/Svg';

/**
 * `<use>` nesting is capped in depth, but not in total expansion: a small file
 * can reference a shape that references ten more, six levels deep, and expand
 * to hundreds of thousands of drawn nodes. An SVG supplied by an end user must
 * not be able to hold a generation thread for seconds.
 */

/** An SVG of roughly 1 KB that expands to `fanOut ** levels` rectangles. */
function useBomb(fanOut: number, levels: number): string {
  let defs = '<rect id="r0" width="1" height="1"/>';
  for (let level = 1; level <= levels; level++) {
    defs += `<g id="r${level}">${`<use href="#r${level - 1}"/>`.repeat(fanOut)}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><defs>${defs}</defs><use href="#r${levels}"/></svg>`;
}

async function generate(svgData: string): Promise<{ error: unknown; bytes: number; ms: number }> {
  const doc = new Document();
  doc.add(new Svg({ svgData, width: 50, height: 50, altText: 'Test drawing' }));
  const started = performance.now();
  try {
    const bytes = await doc.generateBytesAsync();
    return { error: undefined, bytes: bytes.length, ms: performance.now() - started };
  } catch (error) {
    return { error, bytes: 0, ms: performance.now() - started };
  }
}

describe('SVG <use> expansion is bounded', () => {
  it('control: a modest reuse of one shape is drawn', async () => {
    const outcome = await generate(useBomb(4, 2));
    expect(outcome.error).toBeUndefined();
  });

  it('a 1 KB file that expands to 262,144 shapes is refused', async () => {
    const svg = useBomb(8, 6);
    expect(svg.length).toBeLessThan(2048);

    const outcome = await generate(svg);
    expect(
      outcome.error,
      `the drawing was expanded in full: ${outcome.ms.toFixed(0)} ms, ${outcome.bytes} bytes of PDF`
    ).toBeInstanceOf(Error);
  }, 120_000);
});
