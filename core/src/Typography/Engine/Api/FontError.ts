// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/** Named failures match the shared fixture contract, independent of host APIs. */
export class FontError extends Error {
  constructor(name: string, message: string) { super(message); this.name = name; }
}
export function invalid(message: string): never { throw new FontError('InvalidDataException', message); }
export function unsupported(message: string): never { throw new FontError('NotSupportedException', message); }
export function argument(parameter: string, message = 'Argument out of range.'): never {
  throw new FontError('ArgumentOutOfRangeException', `${message} (Parameter '${parameter}')`);
}
export function requireInteger(value: number, parameter: string, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) argument(parameter);
  return value;
}
