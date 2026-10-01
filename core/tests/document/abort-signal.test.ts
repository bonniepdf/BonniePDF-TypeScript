import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

/**
 * Cancellation of the asynchronous generate, save and SVG export paths (an `AbortSignal` in the options).
 * The .NET counterpart takes a `CancellationToken`.
 *
 * Mirrors the .NET CancellationTests.
 */
function documentWithText(): Document {
  const doc = new Document();
  doc.add(new TextBlock({ text: 'Hello' }));
  return doc;
}

describe('async cancellation', () => {
  it('generateBytesAsync rejects with the signal reason when already aborted', async () => {
    const controller = new AbortController();
    const reason = new Error('stop');
    controller.abort(reason);
    await expect(documentWithText().generateBytesAsync({ signal: controller.signal })).rejects.toBe(reason);
  });

  it('rejects with an AbortError when aborted without a reason', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(documentWithText().generateBytesAsync({ signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('saveAsync and the SVG exports honour the signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const { signal } = controller;
    await expect(documentWithText().saveAsync('/tmp/never-written.pdf', { signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(documentWithText().generateSvgPagesAsync({ signal })).rejects.toMatchObject({ name: 'AbortError' });
    await expect(documentWithText().generateSvgDocumentAsync({ signal })).rejects.toMatchObject({ name: 'AbortError' });
    await expect(documentWithText().generateFirstPageSvgAsync({ signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('an unaborted signal changes nothing', async () => {
    const plain = await documentWithText().generateBytesAsync();
    const signalled = await documentWithText().generateBytesAsync({ signal: new AbortController().signal });
    expect(signalled.length).toBe(plain.length);
  });
});
