import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Container } from '../../src/Elements/Layout/Container';
import { Table } from '../../src/Elements/Tables/Table';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { contentStreams } from '../helpers/test-base';

/**
 * Oversized content must never be lost silently.
 *
 * Each case below currently produces a single page with content drawn below
 * the bottom edge, no exception and an empty `doc.diagnostics`. The tests are
 * deliberately neutral about the remedy: an element that cannot be placed may
 * be split across pages, reported as a diagnostic, or rejected with an error.
 * What it may not do is paint outside the page while reporting nothing.
 */

/** Lowest y coordinate at which any text or rectangle is painted, in PDF user space. */
function lowestPaintedY(bytes: Uint8Array): number {
  let lowest = Infinity;
  for (const stream of contentStreams(bytes)) {
    for (const m of stream.matchAll(/1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm/g)) lowest = Math.min(lowest, Number(m[2]));
    for (const m of stream.matchAll(/(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) re/g)) {
      const y = Number(m[2]);
      const h = Number(m[4]);
      lowest = Math.min(lowest, y, y + h);
    }
  }
  return lowest;
}

type Outcome = { threw: boolean; diagnostics: number; lowestY: number };

async function generate(build: (doc: Document) => void): Promise<Outcome> {
  const doc = new Document();
  build(doc);
  try {
    const bytes = await doc.generateBytesAsync();
    return { threw: false, diagnostics: doc.diagnostics.length, lowestY: lowestPaintedY(bytes) };
  } catch {
    return { threw: true, diagnostics: 0, lowestY: Infinity };
  }
}

/** The invariant: reported (thrown or diagnosed), or kept on the page. */
function expectNotSilentlyLost(outcome: Outcome): void {
  const reported = outcome.threw || outcome.diagnostics > 0;
  const onPage = outcome.lowestY >= 0;
  expect(
    reported || onPage,
    `content was painted at y=${outcome.lowestY} (below the page) with no error and no diagnostic`
  ).toBe(true);
}

const longText = 'word '.repeat(20000);

describe('oversized content is never lost silently', () => {
  it('a table whose only row is taller than a page', async () => {
    const outcome = await generate(doc => {
      const table = new Table({ columns: [1] });
      table.addRow(new TextBlock(longText));
      doc.add(table);
    });
    expectNotSilentlyLost(outcome);
  });

  it('a fixed-height container taller than a page', async () => {
    const outcome = await generate(doc => {
      doc.add(new Container({ height: 5000, backgroundColor: 'slate-200', child: new TextBlock('x') }));
    });
    expectNotSilentlyLost(outcome);
  });

  it('a rounded container whose text is taller than a page', async () => {
    const outcome = await generate(doc => {
      doc.add(new Container({ cornerRadius: 8, child: new TextBlock('word '.repeat(3000)) }));
    });
    expectNotSilentlyLost(outcome);
  });

  it('reports an unsplittable oversized box at error severity, naming the page', async () => {
    const doc = new Document();
    doc.add(new Container({ height: 5000, child: new TextBlock('x') }));
    await doc.generateBytesAsync();

    const errors = doc.diagnostics.filter(d => d.severity === 'error' && d.source === 'pagination');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe(
      'A Container is taller than the page body and cannot be split: 4258pt is cut off at the bottom of page 1.'
    );
  });

  it('control: text that is free to split stays on its pages', async () => {
    const outcome = await generate(doc => doc.add(new TextBlock('word '.repeat(3000))));
    expect(outcome.threw).toBe(false);
    expect(outcome.lowestY).toBeGreaterThanOrEqual(0);
  });
});
