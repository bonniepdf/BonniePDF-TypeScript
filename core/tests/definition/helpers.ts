import { getPageTemplateElements } from '../../src/Configuration/PageTemplate';
import { isBuiltInMetadataDate } from '../../src/Configuration/DocumentMetadata';

/** State that legitimately differs between two documents built from the same definition. */
const VOLATILE = new Set(['serial']);

/**
 * Compares two object graphs by their own state, including private backing fields, and returns the path of the
 * first difference (or `undefined` when they are equal). Two documents built from the same definition must be
 * equal under it, which is a stronger statement than "they render the same bytes": it also covers state that
 * only affects a later render (a cascade flag, an unused option).
 *
 * Page templates made by `pageTemplate` are compared by the elements they were built from; other functions
 * are compared by type only.
 */
export function stateDiff(
  a: unknown,
  b: unknown,
  path = '$',
  seen = new WeakMap<object, object>()
): string | undefined {
  if (Object.is(a, b)) return undefined;
  if (typeof a !== typeof b) return `${path}: ${typeof a} vs ${typeof b}`;
  if (typeof a === 'function') {
    const ea = getPageTemplateElements(a as never);
    const eb = getPageTemplateElements(b as never);
    if (ea || eb) return stateDiff({ ...ea }, { ...eb }, `${path}(template)`, seen);
    return undefined;
  }
  if (typeof a !== 'object' || a === null || b === null) return `${path}: ${String(a)} vs ${String(b)}`;
  if (seen.get(a) === b) return undefined;
  seen.set(a, b as object);

  if (a instanceof Date && b instanceof Date) {
    if (isBuiltInMetadataDate(a) && isBuiltInMetadataDate(b)) return undefined;
    return a.getTime() === (b as Date).getTime()
      ? undefined
      : `${path}: ${a.toISOString()} vs ${(b as Date).toISOString()}`;
  }
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    if (a.length !== b.length) return `${path}: ${a.length} bytes vs ${b.length}`;
    return a.every((v, i) => v === b[i]) ? undefined : `${path}: bytes differ`;
  }
  if ((a as object).constructor !== (b as object).constructor) {
    return `${path}: ${(a as object).constructor?.name} vs ${(b as object).constructor?.name}`;
  }
  if (Array.isArray(a)) {
    const other = b as unknown[];
    if (a.length !== other.length) return `${path}: length ${a.length} vs ${other.length}`;
    for (let i = 0; i < a.length; i++) {
      const d = stateDiff(a[i], other[i], `${path}[${i}]`, seen);
      if (d) return d;
    }
    return undefined;
  }
  if (a instanceof Map) {
    const other = b as Map<unknown, unknown>;
    if (a.size !== other.size) return `${path}: map size ${a.size} vs ${other.size}`;
    for (const [k, v] of a) {
      const d = stateDiff(v, other.get(k), `${path}.get(${String(k)})`, seen);
      if (d) return d;
    }
    return undefined;
  }
  const keys = new Set([...Object.getOwnPropertyNames(a), ...Object.getOwnPropertyNames(b)]);
  for (const key of keys) {
    if (VOLATILE.has(key)) continue;
    // A document's font faces are named after the document; their identity is family, weight, italic and bytes.
    if (path.startsWith('$.fonts.') && (key === 'fontName' || key === 'font')) continue;
    const d = stateDiff(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
      `${path}.${key}`,
      seen
    );
    if (d) return d;
  }
  return undefined;
}

/** A 1x1 PNG. */
export const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
);

/** The bytes of a PDF with the parts that legitimately vary between two builds masked. */
export function maskedPdf(bytes: Uint8Array): string {
  return (
    Buffer.from(bytes)
      .toString('latin1')
      .replace(/\/ID\s*\[[^\]]*\]/g, '/ID[]')
      .replace(/\/(CreationDate|ModDate)\s*\([^)]*\)/g, '/$1()')
      .replace(/<xmp:(CreateDate|ModifyDate|MetadataDate)>[^<]*</g, '<xmp:$1><')
      .replace(/<xmpMM:(DocumentID|InstanceID)>[^<]*</g, '<xmpMM:$1><')
      // Every subset font gets a random six-letter tag.
      .replace(/\b[A-Z]{6}\+/g, 'SUBSET+')
  );
}
