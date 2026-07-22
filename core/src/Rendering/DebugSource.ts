/**
 * Preview-only source attribution for rendered elements.
 *
 * The registry is deliberately weak and separate from element instances:
 * marking an object cannot affect its public shape, serialization, layout, or
 * lifetime. Production callers never need this API; editor integrations use it
 * while compiling an instrumented preview bundle.
 */

const sourceIds = new WeakMap<object, string>();

/** Associates an opaque editor-owned source id with an object and returns the
 * value unchanged. Primitives are accepted so instrumentation can remain safe
 * around expressions whose runtime result is not an element. */
export function markDebugSource<T>(value: T, sourceId: string): T {
  if (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof sourceId === 'string' &&
    sourceId.length > 0
  ) {
    // The innermost construction site is the most precise origin. A surrounding
    // instrumented factory/style call may return the same element; do not replace
    // the constructor attribution in that case.
    if (!sourceIds.has(value as object)) sourceIds.set(value as object, sourceId);
  }
  return value;
}

/** Reads source attribution previously attached by an editor preview build. */
export function debugSourceOf(value: object): string | undefined {
  return sourceIds.get(value);
}
