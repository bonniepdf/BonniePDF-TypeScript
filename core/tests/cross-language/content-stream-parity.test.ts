import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

/**
 * Content streams compared across implementations: operators and every
 * non-numeric token exactly, numeric operands within one unit in the third
 * decimal place. .NET lays out in `float` and TypeScript in `number`, so a
 * printed coordinate can differ in its last digit; anything larger is a parity
 * bug. The cases mirror the shared numeric-tolerance conformance fixture and
 * `BonniePDF.Tests/Cross-Language/ContentStreamParityTests.cs`, expected
 * strings included.
 */
describe('Content-stream parity', () => {
  const cases: Array<[id: string, a: string, b: string, equal: boolean]> = [
    ['identical', 'q\n1 0 0 rg\n10 980 m\nQ\n', 'q\n1 0 0 rg\n10 980 m\nQ\n', true],
    ['last-digit', '567.243 20 m\n', '567.242 20 m\n', true],
    ['colour-operand', '0.258 0.1 0.9 rg\n', '0.257 0.1 0.9 rg\n', true],
    ['integer-against-decimal', '10 980 m\n', '10.001 980 m\n', true],
    ['negative-zero', '0 -0.001 m\n', '0 0 m\n', true],
    ['two-units', '567.244 20 m\n', '567.242 20 m\n', false],
    ['operator-differs', '1 0 0 1 10 20 cm\n', '1 0 0 1 10 20 Tm\n', false],
    ['operand-count-differs', '10 20 m\n', '10 20 30 m\n', false],
    ['name-differs', '/F1 12 Tf\n', '/F2 12 Tf\n', false],
    ['string-exact', '(Total 10.5) Tj\n', '(Total 10.4) Tj\n', false],
    ['string-with-escaped-paren', '(a\\) 1.001) Tj\n', '(a\\) 1.001) Tj\n', true],
    ['hex-string-exact', '<0041> Tj\n', '<0042> Tj\n', false],
    ['array-numbers', '[(A) -120.501 (B)] TJ\n', '[(A) -120.5 (B)] TJ\n', true],
    ['dictionary', '/Span <</MCID 3>> BDC\n', '/Span <</MCID 3>> BDC\n', true],
    ['whitespace-layout', '10 20 m 30 40 l\n', '10 20 m\n30 40 l\n', true],
  ];

  it.each(cases)('numeric tolerance: %s', (_id, a, b, equal) => {
    expect(matches(a, b)).toBe(equal);
    expect(matches(b, a)).toBe(equal);
  });

  // Columns weighted 1.4 and 1: 1.4 is not exact in single precision, so .NET
  // and TypeScript start from different numbers. The expected stream is
  // TypeScript's own output; the .NET suite compares its stream against it.
  it('weighted columns produce the reference stream', async () => {
    const reference =
      'q\nBT\n0 0 0 rg\n1 0 0 1 50 781.19 Tm\n/F1 10.7 Tf\n(Left column, weighted one point four, long enough to wrap) Tj\nET\n' +
      'BT\n0 0 0 rg\n1 0 0 1 50 768.35 Tm\n/F1 10.7 Tf\n(across several lines of text.) Tj\nET\n' +
      'BT\n0 0 0 rg\n1 0 0 1 341.952 781.19 Tm\n/F1 10.7 Tf\n(Right column, weighted one.) Tj\nET\nQ\n';

    const doc = new Document();
    const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 7.3 });
    row.add(
      new TextBlock('Left column, weighted one point four, long enough to wrap across several lines of text.', {
        fontSize: 10.7,
      }),
      1.4
    );
    row.add(new TextBlock('Right column, weighted one.', { fontSize: 10.7 }), 1);
    doc.add(row);

    const stream = firstContentStream(await doc.generateBytesAsync());
    expect(stream).toBe(reference);
    doc.dispose();
  });
});

/** True when two content streams match under the shared tolerance rule. */
function matches(a: string, b: string): boolean {
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] === right[i]) continue;
    const x = thousandths(left[i]);
    const y = thousandths(right[i]);
    if (x === undefined || y === undefined || Math.abs(x - y) > 1) return false;
  }
  return true;
}

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

function thousandths(token: string): number | undefined {
  if (!NUMBER.test(token)) return undefined;
  const scaled = Number(token) * 1000;
  // Half away from zero, as the .NET side rounds.
  return Math.sign(scaled) * Math.round(Math.abs(scaled));
}

const isWhitespace = (c: string): boolean => ' \n\r\t\f\0'.includes(c);
const isDelimiter = (c: string): boolean => '()<>[]{}/%'.includes(c);

function tokenize(s: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (isWhitespace(c)) {
      i++;
      continue;
    }
    const start = i;
    if (c === '(') {
      let depth = 0;
      for (; i < s.length; i++) {
        if (s[i] === '\\') {
          i++;
          continue;
        }
        if (s[i] === '(') depth++;
        else if (s[i] === ')' && --depth === 0) {
          i++;
          break;
        }
      }
    } else if ((c === '<' && s[i + 1] === '<') || (c === '>' && s[i + 1] === '>')) {
      i += 2;
    } else if (c === '<') {
      const close = s.indexOf('>', i);
      i = close < 0 ? s.length : close + 1;
    } else if ('[]{}'.includes(c)) {
      i++;
    } else {
      i++;
      while (i < s.length && !isWhitespace(s[i]) && !isDelimiter(s[i])) i++;
    }
    tokens.push(s.slice(start, i));
  }
  return tokens;
}

function firstContentStream(bytes: Uint8Array): string {
  const buffer = Buffer.from(bytes);
  const text = buffer.toString('latin1');
  let start = text.indexOf('stream') + 'stream'.length;
  if (text[start] === '\r') start++;
  if (text[start] === '\n') start++;
  const end = text.indexOf('endstream', start);
  const raw = buffer.subarray(start, end);
  try {
    return inflateSync(raw).toString('latin1');
  } catch {
    return raw.toString('latin1');
  }
}
