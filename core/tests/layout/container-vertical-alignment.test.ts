import { describe, expect, it } from 'vitest';
import { Document } from '../../src/Document';
import { Container } from '../../src/Elements/Layout/Container';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

// verticalAlignment is the counterpart to horizontalAlignment: it consumes the
// slack in a fixed-height container so content can be anchored to the bottom
// without hand-computing a top padding against the font's metrics. Cover type on
// a full-bleed page is the motivating case.

async function baselineOf(align: 'top' | 'middle' | 'bottom' | undefined): Promise<number> {
  const doc = new Document({ settings: { margin: 0 } });
  doc.add(
    new Container({
      height: 400,
      verticalAlignment: align,
      child: new TextBlock('Anchor', { fontSize: 20 }),
    })
  );
  const { pages } = await doc.generateSvgDocumentAsync({ precision: 3 });
  const m = /<text[^>]*y="([0-9.]+)"/.exec(pages[0]);
  return Number(m![1]);
}

describe('Container.verticalAlignment', () => {
  it('leaves the child at the top by default', async () => {
    expect(await baselineOf(undefined)).toBe(await baselineOf('top'));
  });

  it('centres the child in the container height', async () => {
    const top = await baselineOf('top');
    const middle = await baselineOf('middle');
    const bottom = await baselineOf('bottom');
    // A 20pt line in a 400pt box: half the slack above, then all of it.
    expect(middle - top).toBeCloseTo((bottom - top) / 2, 3);
  });

  it('anchors the child to the bottom edge', async () => {
    const top = await baselineOf('top');
    const bottom = await baselineOf('bottom');
    // Slack is the container height less the single line's height.
    expect(bottom - top).toBeCloseTo(400 - 20 * 1.2, 1);
  });

  it('is a no-op when the child fills the container', async () => {
    const doc = (align: 'top' | 'bottom'): Document => {
      const d = new Document({ settings: { margin: 0 } });
      d.add(new Container({ height: 24, verticalAlignment: align, child: new TextBlock('Fill', { fontSize: 20 }) }));
      return d;
    };
    const a = await doc('top').generateSvgDocumentAsync({ precision: 3 });
    const b = await doc('bottom').generateSvgDocumentAsync({ precision: 3 });
    expect(/<text[^>]*y="([0-9.]+)"/.exec(a.pages[0])![1]).toBe(/<text[^>]*y="([0-9.]+)"/.exec(b.pages[0])![1]);
  });

  it('accepts the string token form', async () => {
    const c = new Container({ verticalAlignment: 'bottom' });
    expect(c.verticalAlignment).toBe('End');
  });
});
