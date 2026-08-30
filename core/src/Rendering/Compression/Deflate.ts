// ── DEFLATE (RFC 1951) inside a zlib wrapper (RFC 1950) ──────────────────────
//
// PDF's `/FlateDecode` filter expects zlib-wrapped DEFLATE. Every runtime this
// library targets can *decompress* one, but only Node can compress
// synchronously (`zlib.deflateSync`); the browser's `CompressionStream` is
// async-only. Serialization here is synchronous end to end — `serializeAsync`
// resolves to the same synchronous writer — so an async-only compressor could
// not be used without restructuring the writer, and a Node-only one would make
// browser output differ from Node output for the same document.
//
// The library also promises zero runtime dependencies, which rules out pako and
// friends. So this is a small, self-contained encoder: greedy LZ77 matching
// against a hash chain, emitted with DEFLATE's *fixed* Huffman code (BTYPE=01).
//
// Fixed rather than dynamic Huffman is a deliberate trade: dynamic codes buy
// perhaps another 10-15% on large streams but need the full code-length-code
// machinery, and the bulk of the win here is LZ77 removing the repetition in
// content streams and font tables. Output is valid DEFLATE either way, so a
// dynamic-Huffman pass can be added later without changing the interface.
//
// Correctness is pinned by round-tripping against the platform inflater in
// `core/tests/compression/deflate.test.ts`.

/** Window size for back-references. DEFLATE allows distances up to 32 KiB. */
const WINDOW_SIZE = 32768;
/** Longest run LZ77 can encode in one length/distance pair. */
const MAX_MATCH = 258;
/** Shortest run worth encoding as a match rather than three literals. */
const MIN_MATCH = 3;
/** Hash table size for match candidates. A power of two keeps the mask cheap. */
const HASH_SIZE = 1 << 15;
/** How far down a hash chain to walk before accepting the best match so far. */
const MAX_CHAIN = 128;

/** Base lengths for DEFLATE length codes 257-285 (RFC 1951 §3.2.5). */
const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258,
];
/** Extra bits carried after each length code. */
const LENGTH_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
/** Base distances for DEFLATE distance codes 0-29. */
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577,
];
/** Extra bits carried after each distance code. */
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

/**
 * Accumulates DEFLATE's LSB-first bit stream into bytes.
 *
 * Huffman codes are written MSB-first *within* the code while the stream itself
 * is filled LSB-first, which is why `writeHuffman` reverses and `writeBits`
 * does not — a detail that is easy to get backwards and produces a stream that
 * inflates to garbage rather than failing loudly.
 */
class BitWriter {
  private readonly bytes: number[] = [];
  private bitBuffer = 0;
  private bitCount = 0;

  /** Writes `count` low bits of `value`, least-significant bit first. */
  public writeBits(value: number, count: number): void {
    this.bitBuffer |= (value & ((1 << count) - 1)) << this.bitCount;
    this.bitCount += count;
    while (this.bitCount >= 8) {
      this.bytes.push(this.bitBuffer & 0xff);
      this.bitBuffer >>>= 8;
      this.bitCount -= 8;
    }
  }

  /** Writes a Huffman code, whose bits travel most-significant first. */
  public writeHuffman(code: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.writeBits((code >>> i) & 1, 1);
    }
  }

  /** Flushes any partial byte and returns the stream. */
  public finish(): Uint8Array {
    if (this.bitCount > 0) {
      this.bytes.push(this.bitBuffer & 0xff);
      this.bitBuffer = 0;
      this.bitCount = 0;
    }
    return new Uint8Array(this.bytes);
  }
}

/**
 * Fixed literal/length code (RFC 1951 §3.2.6): the code and its bit length for
 * a symbol, derived from the four canonical ranges.
 */
function fixedLiteralCode(symbol: number): { code: number; length: number } {
  if (symbol <= 143) return { code: 0b00110000 + symbol, length: 8 };
  if (symbol <= 255) return { code: 0b110010000 + (symbol - 144), length: 9 };
  if (symbol <= 279) return { code: symbol - 256, length: 7 };
  return { code: 0b11000000 + (symbol - 280), length: 8 };
}

/** Maps a match length (3-258) to its length code and extra bits. */
function lengthCode(length: number): { symbol: number; extra: number; extraBits: number } {
  let i = LENGTH_BASE.length - 1;
  while (i > 0 && LENGTH_BASE[i]! > length) i--;
  return { symbol: 257 + i, extra: length - LENGTH_BASE[i]!, extraBits: LENGTH_EXTRA[i]! };
}

/** Maps a back-reference distance (1-32768) to its distance code and extra bits. */
function distanceCode(distance: number): { symbol: number; extra: number; extraBits: number } {
  let i = DIST_BASE.length - 1;
  while (i > 0 && DIST_BASE[i]! > distance) i--;
  return { symbol: i, extra: distance - DIST_BASE[i]!, extraBits: DIST_EXTRA[i]! };
}

/** Adler-32 over `data`, the checksum the zlib trailer carries (RFC 1950 §2.2). */
export function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  // 5552 is the largest block that cannot overflow the 32-bit accumulators.
  for (let i = 0; i < data.length;) {
    const end = Math.min(i + 5552, data.length);
    for (; i < end; i++) {
      a += data[i]!;
      b += a;
    }
    a %= 65521;
    b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** Raw DEFLATE (no zlib wrapper) using one fixed-Huffman block. */
function deflateRaw(data: Uint8Array): Uint8Array {
  const writer = new BitWriter();

  // BFINAL=1, BTYPE=01 (fixed Huffman). One block covers the whole input; the
  // window still bounds back-references, so stream size is not a constraint.
  writer.writeBits(1, 1);
  writer.writeBits(1, 2);

  // head[h] = most recent position with hash h; prev[p] = previous position
  // sharing that hash. Together they form the chains walked below. -1 = empty,
  // which is why these are Int32Array rather than Uint32Array.
  const head = new Int32Array(HASH_SIZE).fill(-1);
  const prev = new Int32Array(data.length).fill(-1);

  const hashAt = (pos: number): number =>
    ((data[pos]! << 10) ^ (data[pos + 1]! << 5) ^ data[pos + 2]!) & (HASH_SIZE - 1);

  let pos = 0;
  while (pos < data.length) {
    let bestLength = 0;
    let bestDistance = 0;

    if (pos + MIN_MATCH <= data.length) {
      const h = hashAt(pos);
      let candidate = head[h]!;
      let chain = 0;
      const limit = Math.max(0, pos - WINDOW_SIZE);
      const maxLength = Math.min(MAX_MATCH, data.length - pos);

      while (candidate >= limit && chain < MAX_CHAIN) {
        // Cheap rejection: a candidate can only beat the incumbent if the byte
        // one past the current best already matches.
        if (data[candidate + bestLength] === data[pos + bestLength]) {
          let length = 0;
          while (length < maxLength && data[candidate + length] === data[pos + length]) length++;
          if (length > bestLength) {
            bestLength = length;
            bestDistance = pos - candidate;
            if (length === maxLength) break; // cannot do better
          }
        }
        candidate = prev[candidate]!;
        chain++;
      }

      // Insert this position into the chain for later matches.
      prev[pos] = head[h]!;
      head[h] = pos;
    }

    if (bestLength >= MIN_MATCH) {
      const len = lengthCode(bestLength);
      const lit = fixedLiteralCode(len.symbol);
      writer.writeHuffman(lit.code, lit.length);
      if (len.extraBits > 0) writer.writeBits(len.extra, len.extraBits);

      const dist = distanceCode(bestDistance);
      // Distance codes use a flat 5-bit fixed code, not the literal table.
      writer.writeHuffman(dist.symbol, 5);
      if (dist.extraBits > 0) writer.writeBits(dist.extra, dist.extraBits);

      // Register the positions the match skipped over so later matches can
      // still find them; without this, compression degrades badly on
      // repetitive input.
      for (let i = 1; i < bestLength; i++) {
        const p = pos + i;
        if (p + MIN_MATCH <= data.length) {
          const h = hashAt(p);
          prev[p] = head[h]!;
          head[h] = p;
        }
      }
      pos += bestLength;
    } else {
      const lit = fixedLiteralCode(data[pos]!);
      writer.writeHuffman(lit.code, lit.length);
      pos++;
    }
  }

  // End-of-block symbol (256).
  const end = fixedLiteralCode(256);
  writer.writeHuffman(end.code, end.length);

  return writer.finish();
}

/**
 * Compresses `data` to zlib-wrapped DEFLATE, ready for a PDF stream carrying
 * `/Filter /FlateDecode`.
 *
 * Synchronous and dependency-free, so it behaves identically in Node, the
 * browser, Bun, and Deno — which is what keeps a document's bytes the same
 * whichever runtime produced it.
 */
export function deflateSync(data: Uint8Array): Uint8Array {
  const body = deflateRaw(data);
  const out = new Uint8Array(body.length + 6);

  // zlib header: CM=8 (deflate), CINFO=7 (32 KiB window), FLEVEL=2, and a check
  // byte chosen so the 16-bit header is a multiple of 31 (RFC 1950 §2.2).
  const cmf = 0x78;
  const flg = 0x9c;
  out[0] = cmf;
  out[1] = flg;
  out.set(body, 2);

  const checksum = adler32(data);
  out[out.length - 4] = (checksum >>> 24) & 0xff;
  out[out.length - 3] = (checksum >>> 16) & 0xff;
  out[out.length - 2] = (checksum >>> 8) & 0xff;
  out[out.length - 1] = checksum & 0xff;

  return out;
}
