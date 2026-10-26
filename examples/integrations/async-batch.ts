/** Bounded async generation; each worker holds at most one document at a time. */
import type { Document } from '@bonniepdf/core';

export async function generateBatch<T>(
  records: readonly T[],
  build: (record: T) => Document,
  write: (record: T, bytes: Uint8Array) => Promise<void>,
  options: { concurrency?: number; signal?: AbortSignal } = {}
): Promise<number> {
  const concurrency = options.concurrency ?? 2;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16)
    throw new Error('Choose a concurrency from 1 to 16.');
  let next = 0,
    completed = 0;
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  // Wait for every active worker to dispose its document before rejecting the batch.
  const workers = Array.from({ length: Math.min(concurrency, records.length) }, async () => {
    while (next < records.length) {
      signal.throwIfAborted();
      const record = records[next++];
      let doc: Document | undefined;
      try {
        doc = build(record);
        const bytes = await doc.generateBytesAsync({ signal });
        if (doc.diagnostics.some(d => d.severity === 'error' || d.severity === 'warning'))
          throw new Error('PDF reported a problem.');
        signal.throwIfAborted();
        await write(record, bytes);
        completed++;
      } catch (error) {
        controller.abort(error);
        throw error;
      } finally {
        doc?.dispose();
      }
    }
  });
  const results = await Promise.allSettled(workers);
  const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (failed) throw failed.reason;
  signal.throwIfAborted();
  return completed;
}
