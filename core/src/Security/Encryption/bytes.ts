/** Extracts an `ArrayBuffer` slice exactly matching the Uint8Array's view. */
export function asBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/** Concatenates byte arrays into a new array; empty or missing arrays contribute nothing. */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + (a?.length ?? 0), 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    if (a?.length) {
      result.set(a, offset);
      offset += a.length;
    }
  }
  return result;
}
