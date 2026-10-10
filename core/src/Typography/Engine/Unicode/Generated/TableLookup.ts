// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
// Lookup primitives for generated, immutable ASCII sextet strings.
// Each logical unsigned 16-bit unit occupies exactly three characters.
function digit(code: number): number {
  if (code >= 97) return code - 61;
  if (code >= 65 && code <= 90) return code - 55;
  if (code >= 48 && code <= 57) return code - 48;
  return code === 45 ? 62 : 63;
}
export function unit(data: string, p: number): number {
  const at = p * 3; return digit(data.charCodeAt(at)) * 4096 + digit(data.charCodeAt(at + 1)) * 64 + digit(data.charCodeAt(at + 2));
}
export function scalar(data: string, p: number): number { return unit(data, p) * 65536 + unit(data, p + 1); }
export function find(data: string, stride: number, cp: number): number {
  let low = 0, high = data.length / (stride * 3) - 1;
  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2), p = mid * stride, key = scalar(data, p);
    if (key < cp) low = mid + 1;
    else if (key > cp) high = mid - 1;
    else return p;
  }
  return -1;
}
export function inRanges(data: string, cp: number): boolean {
  let low = 0, high = data.length / 12 - 1;
  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2), p = mid * 4;
    if (cp < scalar(data, p)) high = mid - 1;
    else if (cp > scalar(data, p + 2)) low = mid + 1;
    else return true;
  }
  return false;
}
