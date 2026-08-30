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

  // ── Block-type selection ───────────────────────────────────────────────────
  // The encoder costs stored, fixed and dynamic forms and emits the cheapest.
  // Each branch needs exercising, because a mistake in one is invisible while
  // the others are being chosen.

  /** BTYPE from the first block header: 0 stored, 1 fixed, 2 dynamic. */
  function blockType(input: Uint8Array): number {
    const first = deflateSync(input)[2]!;
    return (first >>> 1) & 0b11;
  }

  it('falls back to a stored block when nothing else is cheaper', () => {
    // Empty input has no symbols to code, so storing is the only sane form.
    expect(blockType(new Uint8Array(0))).toBe(0);
    expect(roundTrip(new Uint8Array(0))).toEqual(new Uint8Array(0));
  });

  it('never expands any input beyond stored-block overhead', () => {
    // The point of costing all three forms: whatever the data, the encoder
    // must not make it bigger. Covers tiny inputs, the 144-255 range that fixed
    // Huffman codes in 9 bits, and incompressible noise.
    const noise = new Uint8Array(600);
    let seed = 7;
    for (let i = 0; i < noise.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      noise[i] = 144 + (seed % 112);
    }

    const cases = [bytes('x'), bytes('short'), new Uint8Array([0, 255, 128, 64]), noise];
    for (const input of cases) {
      expect(roundTrip(input)).toEqual(input);
      expect(deflateSync(input).length).toBeLessThanOrEqual(input.length + 11);
    }
  });

  it('round-trips every byte in the 144-255 range, where the fixed code is 9 bits', () => {
    // Regression: the fixed table must span all 288 symbols. Declaring only 286
    // shifts every 9-bit code and silently produces a stream that inflates to
    // the wrong bytes - it decodes, it just decodes incorrectly.
    const input = new Uint8Array(112);
    for (let i = 0; i < input.length; i++) input[i] = 144 + i;
    expect(roundTrip(input)).toEqual(input);
  });

  it('uses dynamic Huffman for skewed, compressible data', () => {
    const input = bytes('aaaaaaaabbbbcccd'.repeat(400));
    expect(blockType(input)).toBe(2);
    expect(roundTrip(input)).toEqual(input);
  });

  it('round-trips incompressible data too large for a stored block', () => {
    // Above 0xFFFF a stored block is unavailable, so this must go out as a
    // Huffman block even though it cannot compress.
    const input = new Uint8Array(70_000);
    let seed = 99;
    for (let i = 0; i < input.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      input[i] = seed & 0xff;
    }
    expect(blockType(input)).not.toBe(0);
    expect(roundTrip(input)).toEqual(input);
  });

  it('round-trips a two-symbol alphabet', () => {
    const input = bytes('ababababab'.repeat(500));
    expect(roundTrip(input)).toEqual(input);
  });

  it('round-trips an extremely skewed alphabet that strains the 15-bit limit', () => {
    // One symbol overwhelmingly common, the rest vanishingly rare - the shape
    // that pushes naive Huffman past DEFLATE's 15-bit ceiling.
    const parts: number[] = [];
    for (let i = 0; i < 60_000; i++) parts.push(0x41);
    for (let s = 0; s < 255; s++) parts.push(s);
    const input = new Uint8Array(parts);
    expect(roundTrip(input)).toEqual(input);
  });

  it('never emits a code longer than DEFLATE allows', () => {
    // If a code exceeded 15 bits the stream would be malformed; a real
    // inflater rejecting it is the check that matters.
    const parts: number[] = [];
    for (let i = 0; i < 40_000; i++) parts.push(0);
    for (let s = 1; s < 256; s++) for (let k = 0; k < s % 3; k++) parts.push(s);
    const input = new Uint8Array(parts);
    expect(roundTrip(input)).toEqual(input);
  });

  it('computes Adler-32 as the specification does', () => {
    // Known vector: Adler-32("Wikipedia") = 0x11E60398.
    expect(adler32(bytes('Wikipedia'))).toBe(0x11e60398);
    expect(adler32(new Uint8Array(0))).toBe(1);
  });
});
