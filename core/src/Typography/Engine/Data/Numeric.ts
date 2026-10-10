// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/** Round ties towards positive infinity without returning negative zero. */
export function roundHalfUp(value: number): number { const result = Math.floor(value + 0.5); return result === 0 ? 0 : result; }
export function floorDiv(value: number, divisor: number): number { const result = Math.floor(value / divisor); return result === 0 ? 0 : result; }
