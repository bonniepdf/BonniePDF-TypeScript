/**
 * Throws the signal's reason when it has been aborted, the same error `signal.throwIfAborted()` throws
 * (a `DOMException` named `AbortError` unless the caller passed a reason to `abort()`). A function of its own
 * because older runtimes lack the method.
 */
export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) return;
  const reason: unknown = signal.reason;
  if (reason !== undefined) throw reason;
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  throw error;
}
