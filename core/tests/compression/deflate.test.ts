import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import { adler32, deflateSync } from '../../src/Rendering/Compression/Deflate';

/**
 * The encoder is only useful if a *real* inflater accepts its output, so every
 * case here round-trips through `node:zlib` rather than through a matching
 * decoder written against the same assumptions.
 */
function roundTrip(input: Uint8Array): Uint8Array {
  return new Uint8Array(inflateSync(Buffer.from(deflateSync(input))));
}

function bytes(text: string): Uint8Array {
  return new Uint8Array([...text].map(c => c.charCodeAt(0)));
}

describe('deflateSync', () => {
  it('round-trips an empty input', () => {
    expect(roundTrip(new Uint8Array(0))).toEqual(new Uint8Array(0));
  });

  it('round-trips a single byte', () => {
    expect(roundTrip(new Uint8Array([0x41]))).toEqual(new Uint8Array([0x41]));
  });

  it('round-trips text with no repetition', () => {
    const input = bytes('The quick brown fox jumps over the lazy dog.');
    expect(roundTrip(input)).toEqual(input);
  });

  it('round-trips highly repetitive input and actually shrinks it', () => {
    const input = bytes('BT /F1 12 Tf 100 700 Td (Hello) Tj ET\n'.repeat(200));
    expect(roundTrip(input)).toEqual(input);
    expect(deflateSync(input).length).toBeLessThan(input.length / 10);
  });

  it('round-trips every byte value, including the 144/256 code-length boundaries', () => {
    const input = new Uint8Array(256);
    for (let i = 0; i < 256; i++) input[i] = i;
    expect(roundTrip(input)).toEqual(input);
  });

  it('round-trips input longer than the 32 KiB window', () => {
    const input = new Uint8Array(90_000);
    for (let i = 0; i < input.length; i++) input[i] = (i * 7 + (i >> 5)) & 0xff;
    expect(roundTrip(input)).toEqual(input);
  });

  it('round-trips a run longer than the 258-byte maximum match', () => {
    const input = new Uint8Array(5000).fill(0x2e);
    expect(roundTrip(input)).toEqual(input);
    expect(deflateSync(input).length).toBeLessThan(200);
  });

  it('round-trips pseudo-random bytes, which cannot be compressed', () => {
    const input = new Uint8Array(20_000);
    let seed = 12345;
    for (let i = 0; i < input.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      input[i] = seed & 0xff;
    }
    expect(roundTrip(input)).toEqual(input);
  });

  it('is deterministic', () => {
    const input = bytes('determinism matters: the same document must produce the same bytes.'.repeat(20));
    expect(deflateSync(input)).toEqual(deflateSync(input));
  });

  it('emits a valid zlib header', () => {
    const out = deflateSync(bytes('header check'));
    expect(out[0]).toBe(0x78);
    // The 16-bit header must be a multiple of 31 (RFC 1950 section 2.2).
    expect(((out[0]! << 8) | out[1]!) % 31).toBe(0);
  });

  it('computes Adler-32 as the specification does', () => {
    // Known vector: Adler-32("Wikipedia") = 0x11E60398.
    expect(adler32(bytes('Wikipedia'))).toBe(0x11e60398);
    expect(adler32(new Uint8Array(0))).toBe(1);
  });
});
