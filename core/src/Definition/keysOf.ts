import { ELEMENT_DESCRIPTION } from './ElementDescription';
import type { KeySpec, ShapeSpec } from './ElementDescriptionTypes';

const keyCache = new Map<ShapeSpec, Record<string, KeySpec>>();

/** Merges the keys of a shape or element with the mixins it uses. The result is shared: callers must not modify it. */
export function keysOf(spec: ShapeSpec): Record<string, KeySpec> {
  let merged = keyCache.get(spec);
  if (!merged) {
    merged = {};
    for (const use of spec.uses ?? []) Object.assign(merged, ELEMENT_DESCRIPTION.mixins[use]);
    Object.assign(merged, spec.keys);
    keyCache.set(spec, merged);
  }
  return merged;
}
