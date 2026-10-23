/**
 * Applies an options bag to an instance by keyed assignment.
 *
 * Contract:
 *
 * - **Keyed assignment is mandatory.** Many public properties are `get`/`set`
 *   pairs backed by other state - `TextElementBase.fontName`, every widened
 *   colour/spacing/enum property, `DocumentSettings.pdfAEnabled`. Assigning
 *   through the accessor is what runs the normalisers; copying fields or using
 *   `Object.defineProperty` would bypass them and silently corrupt state.
 * - **`undefined` is skipped, not assigned.** `{ fontSize: undefined }` must
 *   leave an existing value (or an inherited default) alone rather than clear
 *   it. Consequently an options bag cannot reset an optional property back to
 *   `undefined`; that stays a direct assignment (`style.color = undefined`).
 *
 * Internal plumbing - deliberately not part of the public barrel. Type safety
 * comes from the calling constructor's typed `options` parameter, so the loop
 * itself is intentionally loosely typed.
 */
export function applyOptions<T extends object>(target: T, options?: object): T {
  if (!options) return target;

  const sink = target as Record<string, unknown>;
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      sink[key] = value;
    }
  }
  return target;
}
