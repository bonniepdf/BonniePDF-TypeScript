/**
 * Encodes a string as ISO-8859-1 (Latin-1) bytes.
 * Matches WinAnsiEncoding used by standard PDF fonts:
 * characters like £ (U+00A3) encode as 0xA3, not the two-byte UTF-8 sequence.
 */
export function encodeIso88591(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    bytes[i] = s.charCodeAt(i) & 0xff;
  }
  return bytes;
}
