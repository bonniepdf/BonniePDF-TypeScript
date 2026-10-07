/** Encrypts string tokens in a generated PDF fragment, preserving its syntax. */
export function encryptPdfStrings(fragment: string, encrypt: (bytes: Uint8Array) => Uint8Array): string {
  let result = '';
  let i = 0;
  const encrypted = (bytes: number[]): string =>
    '<' + Array.from(encrypt(new Uint8Array(bytes)), b => b.toString(16).padStart(2, '0').toUpperCase()).join('') + '>';
  while (i < fragment.length) {
    const start = i;
    const c = fragment[i++];
    if (c === '%') {
      while (i < fragment.length && fragment[i] !== '\n' && fragment[i] !== '\r') i++;
      result += fragment.slice(start, i);
    } else if (c === '(') {
      const bytes: number[] = [];
      let depth = 1;
      while (i < fragment.length && depth > 0) {
        let ch = fragment[i++];
        if (ch === '\\') {
          if (i === fragment.length) throw new Error('Unterminated PDF string');
          ch = fragment[i++];
          if (ch === '\r' || ch === '\n') {
            if (ch === '\r' && fragment[i] === '\n') i++;
            continue;
          }
          if (ch >= '0' && ch <= '7') {
            let octal = ch;
            while (octal.length < 3 && i < fragment.length && fragment[i] >= '0' && fragment[i] <= '7')
              octal += fragment[i++];
            bytes.push(parseInt(octal, 8) & 255);
          } else {
            const escapes: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12 };
            bytes.push(escapes[ch] ?? ch.charCodeAt(0) & 255);
          }
        } else if (ch === ')') {
          if (--depth > 0) bytes.push(41);
        } else {
          if (ch === '(') depth++;
          if (ch === '\r') {
            if (fragment[i] === '\n') i++;
            ch = '\n';
          }
          bytes.push(ch.charCodeAt(0) & 255);
        }
      }
      if (depth !== 0) throw new Error('Unterminated PDF string');
      result += encrypted(bytes);
    } else if (c === '<' && fragment[i] !== '<') {
      const end = fragment.indexOf('>', i);
      if (end < 0) throw new Error('Unterminated PDF hex string');
      let hex = fragment.slice(i, end).replace(/[\x00\t\n\f\r ]/g, '');
      if (!/^[0-9a-f]*$/i.test(hex)) throw new Error('Invalid PDF hex string');
      if (hex.length % 2) hex += '0';
      result += encrypted(Array.from({ length: hex.length / 2 }, (_, n) => parseInt(hex.slice(n * 2, n * 2 + 2), 16)));
      i = end + 1;
    } else if (c === '<' && fragment[i] === '<') {
      result += '<<';
      i++;
    } else result += c;
  }
  return result;
}
