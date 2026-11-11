import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

/**
 * An element that contains itself is a programming error, and should be
 * reported as one. Today it recurses until the stack overflows, which gives
 * the developer a RangeError with no mention of the cause.
 */
describe('an element tree that contains a cycle', () => {
  it('is reported as a cycle, not as a stack overflow', async () => {
    const stack = new VerticalStack({ children: [new TextBlock('child')] });
    let error: unknown;
    try {
      stack.add(stack);
      const doc = new Document();
      doc.add(stack);
      await doc.generateBytesAsync();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(RangeError);
    expect((error as Error).message).toMatch(/cycle|circular|contains itself|own descendant/i);
  });
});
