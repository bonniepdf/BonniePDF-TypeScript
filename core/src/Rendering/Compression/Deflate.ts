// ── DEFLATE (RFC 1951) inside a zlib wrapper (RFC 1950) ──────────────────────
//
// PDF's `/FlateDecode` filter expects zlib-wrapped DEFLATE. Every runtime this
// library targets can *decompress* one, but only Node can compress
// synchronously (`zlib.deflateSync`); the browser's `CompressionStream` is
// async-only. Serialization is synchronous end to end — `serializeAsync`
// resolves to the same synchronous writer — so an async-only compressor could
// not be used without restructuring the writer, and a Node-only one would make
// browser output differ from Node output for the same document.
//
// The library also promises zero runtime dependencies, which rules out pako and
// friends. So this is a small, self-contained encoder in three stages:
//
//   1. `lz77` turns the input into literals and back-references, using a hash
//      chain plus *lazy matching* (defer a match if the next position starts a
//      better one) — the same heuristic zlib uses at its higher levels.
//   2. Huffman code lengths are built from the token frequencies, limited to
//      the 15 bits DEFLATE allows.
//   3. The block is emitted in whichever of the three DEFLATE forms is
//      smallest: stored, fixed Huffman, or dynamic Huffman. The cost of each
//      is computed exactly before anything is written, so the choice is never
//      a guess.
//
// The compressed form is deliberately *not* required to match .NET's byte for
// byte — DEFLATE admits many valid encodings of the same data, and .NET
// delegates to the platform zlib. What both must agree on is the *decoded*
// content. Correctness is pinned by round-tripping against a real inflater in
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
/** A match at least this long is taken immediately, without a lazy look-ahead. */
const GOOD_MATCH = 32;

/** Symbol counts: 0-255 literals, 256 end-of-block, 257-285 lengths. */
const LITERAL_SYMBOLS = 286;
/** Distance codes 0-29 (30 and 31 are unused but must be representable). */
const DISTANCE_SYMBOLS = 30;
/** DEFLATE caps literal/length and distance codes at 15 bits. */
const MAX_CODE_BITS = 15;
/** The code-length alphabet is capped at 7 bits. */
const MAX_CODE_LENGTH_BITS = 7;

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
/** Order the code-length code's own lengths are written in (RFC 1951 §3.2.7). */
const CODE_LENGTH_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

/**
 * Accumulates DEFLATE's LSB-first bit stream into bytes.
 *
 * Huffman codes are written MSB-first *within* the code while the stream itself
 * is filled LSB-first, which is why `writeHuffman` reverses and `writeBits`
 * does not - a detail that is easy to get backwards and produces a stream that
 * inflates to garbage rather than failing loudly.
 */
class BitWriter {
  private readonly bytes: number[] = [];
  private bitBuffer = 0;
  private bitCount = 0;

  /** Writes `count` low bits of `value`, least-significant bit first. */
  public writeBits(value: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.bitBuffer |= ((value >>> i) & 1) << this.bitCount;
      this.bitCount++;
      if (this.bitCount === 8) {
        this.bytes.push(this.bitBuffer & 0xff);
        this.bitBuffer = 0;
        this.bitCount = 0;
      }
    }
  }

  /** Writes a Huffman code, whose bits travel most-significant first. */
  public writeHuffman(code: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.writeBits((code >>> i) & 1, 1);
    }
  }

  /** Pads to the next byte boundary — required before a stored block's header. */
  public alignToByte(): void {
    if (this.bitCount > 0) {
      this.bytes.push(this.bitBuffer & 0xff);
      this.bitBuffer = 0;
      this.bitCount = 0;
    }
  }

  /** Appends whole bytes. Only valid immediately after {@link alignToByte}. */
  public writeBytes(data: Uint8Array): void {
    for (const b of data) this.bytes.push(b);
  }

  /** Flushes any partial byte and returns the stream. */
  public finish(): Uint8Array {
    this.alignToByte();
    return new Uint8Array(this.bytes);
  }
}

// ── LZ77 ─────────────────────────────────────────────────────────────────────

/**
 * One emitted item: a literal byte, or a back-reference.
 * Stored in flat arrays rather than objects — a large stream produces hundreds
 * of thousands of these, and the allocation churn is measurable.
 */
interface Tokens {
  /** Literal byte, or the match length when `distances[i]` is non-zero. */
  readonly literals: Uint16Array;
  /** 0 for a literal; otherwise the back-reference distance. */
  readonly distances: Uint16Array;
  readonly count: number;
}

/** Splits `data` into literals and back-references. */
function lz77(data: Uint8Array): Tokens {
  const literals = new Uint16Array(data.length + 1);
  const distances = new Uint16Array(data.length + 1);
  let count = 0;

  // head[h] = most recent position with hash h; prev[p] = previous position
  // sharing that hash. Together they form the chains walked below. -1 = empty,
  // which is why these are Int32Array rather than Uint32Array.
  const head = new Int32Array(HASH_SIZE).fill(-1);
  const prev = new Int32Array(data.length).fill(-1);

  const hashAt = (pos: number): number =>
    ((data[pos]! << 10) ^ (data[pos + 1]! << 5) ^ data[pos + 2]!) & (HASH_SIZE - 1);

  /** Best match for `pos`, or length 0 when there is none worth taking. */
  const findMatch = (pos: number): { length: number; distance: number } => {
    if (pos + MIN_MATCH > data.length) return { length: 0, distance: 0 };

    let bestLength = 0;
    let bestDistance = 0;
    let candidate = head[hashAt(pos)]!;
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

    return { length: bestLength, distance: bestDistance };
  };

  /** Adds `pos` to its hash chain so later positions can match against it. */
  const insert = (pos: number): void => {
    if (pos + MIN_MATCH > data.length) return;
    const h = hashAt(pos);
    prev[pos] = head[h]!;
    head[h] = pos;
  };

  let pos = 0;
  while (pos < data.length) {
    const match = findMatch(pos);
    insert(pos);

    let useLength = match.length;
    let useDistance = match.distance;

    // Lazy matching: a match starting one byte later may be longer, in which
    // case emitting this byte as a literal and taking that match costs less.
    // Skipped once a match is already long enough to be worth taking outright.
    if (useLength >= MIN_MATCH && useLength < GOOD_MATCH && pos + 1 < data.length) {
      const next = findMatch(pos + 1);
      if (next.length > useLength) {
        literals[count] = data[pos]!;
        distances[count] = 0;
        count++;
        pos++;
        insert(pos);
        useLength = next.length;
        useDistance = next.distance;
      }
    }

    if (useLength >= MIN_MATCH) {
      literals[count] = useLength;
      distances[count] = useDistance;
      count++;
      // Register the positions the match covers so later matches find them;
      // without this, compression degrades badly on repetitive input.
      for (let i = 1; i < useLength; i++) insert(pos + i);
      pos += useLength;
    } else {
      literals[count] = data[pos]!;
      distances[count] = 0;
      count++;
      pos++;
    }
  }

  return { literals, distances, count };
}

// ── Huffman ──────────────────────────────────────────────────────────────────

/** Maps a match length (3-258) to its length code index within LENGTH_BASE. */
function lengthIndex(length: number): number {
  let i = LENGTH_BASE.length - 1;
  while (i > 0 && LENGTH_BASE[i]! > length) i--;
  return i;
}

/** Maps a back-reference distance (1-32768) to its distance code. */
function distanceIndex(distance: number): number {
  let i = DIST_BASE.length - 1;
  while (i > 0 && DIST_BASE[i]! > distance) i--;
  return i;
}

/**
 * Huffman code lengths for `freqs`, none longer than `maxBits`.
 *
 * Builds an ordinary Huffman tree; if any code overflows the limit, the
 * frequencies are flattened (`f = (f >> 1) | 1`) and it rebuilds. Halving
 * compresses the dynamic range that produced the deep codes while `| 1` keeps
 * every used symbol present, so this terminates quickly. The result is a valid
 * prefix code for the real symbols — very slightly longer than a package-merge
 * optimum in the rare cases the limit actually binds.
 */
function huffmanLengths(freqs: Uint32Array, maxBits: number): Uint8Array {
  const n = freqs.length;
  const lengths = new Uint8Array(n);
  const working = Uint32Array.from(freqs);

  for (;;) {
    const used: number[] = [];
    for (let i = 0; i < n; i++) if (working[i]! > 0) used.push(i);

    if (used.length === 0) return lengths;
    if (used.length === 1) {
      // A single symbol still needs one bit: a zero-length code is not decodable.
      lengths[used[0]!] = 1;
      return lengths;
    }

    // Nodes are [weight, depth-carrying children]. Sorting by weight and
    // repeatedly merging the two smallest is Huffman's algorithm; tracking the
    // member symbols lets us read the depths off at the end.
    type Node = { weight: number; symbols: number[] };
    const nodes: Node[] = used.map(s => ({ weight: working[s]!, symbols: [s] }));
    // Deterministic ordering: ties broken by lowest symbol, so the same input
    // always yields the same code lengths.
    nodes.sort((a, b) => a.weight - b.weight || a.symbols[0]! - b.symbols[0]!);

    const depth = new Map<number, number>();
    for (const s of used) depth.set(s, 0);

    const queue = nodes.slice();
    while (queue.length > 1) {
      const a = queue.shift()!;
      const b = queue.shift()!;
      for (const s of a.symbols) depth.set(s, depth.get(s)! + 1);
      for (const s of b.symbols) depth.set(s, depth.get(s)! + 1);
      const merged: Node = { weight: a.weight + b.weight, symbols: [...a.symbols, ...b.symbols] };
      // Insert keeping the queue sorted (stable on weight, then symbol).
      let lo = 0;
      let hi = queue.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        const cmp = queue[mid]!.weight - merged.weight || queue[mid]!.symbols[0]! - merged.symbols[0]!;
        if (cmp < 0) lo = mid + 1;
        else hi = mid;
      }
      queue.splice(lo, 0, merged);
    }

    let overflow = false;
    for (const s of used) {
      const d = depth.get(s)!;
      if (d > maxBits) {
        overflow = true;
        break;
      }
      lengths[s] = d;
    }
    if (!overflow) return lengths;

    lengths.fill(0);
    for (let i = 0; i < n; i++) if (working[i]! > 0) working[i] = (working[i]! >> 1) | 1;
  }
}

/** Canonical codes for the given lengths (RFC 1951 §3.2.2). */
function canonicalCodes(lengths: Uint8Array, maxBits: number): Uint16Array {
  const countPerLength = new Uint32Array(maxBits + 1);
  for (const l of lengths) if (l > 0) countPerLength[l]!++;

  const nextCode = new Uint32Array(maxBits + 2);
  let code = 0;
  for (let bits = 1; bits <= maxBits; bits++) {
    code = (code + countPerLength[bits - 1]!) << 1;
    nextCode[bits] = code;
  }

  const codes = new Uint16Array(lengths.length);
  for (let s = 0; s < lengths.length; s++) {
    const l = lengths[s]!;
    if (l > 0) codes[s] = nextCode[l]!++;
  }
  return codes;
}

/**
 * Run-length encodes code lengths using symbols 16 (repeat previous 3-6), 17
 * (zero run 3-10) and 18 (zero run 11-138), per RFC 1951 §3.2.7.
 */
function encodeCodeLengths(lengths: Uint8Array): { symbols: number[]; extra: number[]; extraBits: number[] } {
  const symbols: number[] = [];
  const extra: number[] = [];
  const extraBits: number[] = [];

  let i = 0;
  while (i < lengths.length) {
    const value = lengths[i]!;
    let run = 1;
    while (i + run < lengths.length && lengths[i + run] === value) run++;

    if (value === 0) {
      while (run >= 11) {
        const take = Math.min(run, 138);
        symbols.push(18);
        extra.push(take - 11);
        extraBits.push(7);
        run -= take;
        i += take;
      }
      while (run >= 3) {
        const take = Math.min(run, 10);
        symbols.push(17);
        extra.push(take - 3);
        extraBits.push(3);
        run -= take;
        i += take;
      }
      for (let k = 0; k < run; k++) {
        symbols.push(0);
        extra.push(0);
        extraBits.push(0);
      }
      i += run;
    } else {
      // The value itself, then repeats of it.
      symbols.push(value);
      extra.push(0);
      extraBits.push(0);
      run--;
      i++;
      while (run >= 3) {
        const take = Math.min(run, 6);
        symbols.push(16);
        extra.push(take - 3);
        extraBits.push(2);
        run -= take;
        i += take;
      }
      for (let k = 0; k < run; k++) {
        symbols.push(value);
        extra.push(0);
        extraBits.push(0);
      }
      i += run;
    }
  }

  return { symbols, extra, extraBits };
}

/**
 * Fixed literal/length code lengths (RFC 1951 §3.2.6).
 *
 * The table spans **288** symbols, not the 286 a dynamic block can declare.
 * Codes 286-287 never appear in output, but they must still be present here:
 * canonical assignment derives each length's starting code from how many
 * shorter codes exist, so omitting two 8-bit entries shifts every 9-bit code
 * (symbols 144-255) and produces a stream that inflates to the wrong bytes.
 */
const FIXED_LITERAL_SYMBOLS = 288;

function fixedLiteralLengths(): Uint8Array {
  const lengths = new Uint8Array(FIXED_LITERAL_SYMBOLS);
  for (let s = 0; s < FIXED_LITERAL_SYMBOLS; s++) {
    lengths[s] = s <= 143 ? 8 : s <= 255 ? 9 : s <= 279 ? 7 : 8;
  }
  return lengths;
}

/** Fixed distance code lengths: all five bits. */
function fixedDistanceLengths(): Uint8Array {
  return new Uint8Array(DISTANCE_SYMBOLS).fill(5);
}

// ── Block emission ───────────────────────────────────────────────────────────

/** Bits needed to emit `tokens` with the given code lengths, excluding headers. */
function tokenCost(tokens: Tokens, litLengths: Uint8Array, distLengths: Uint8Array): number {
  let bits = 0;
  for (let i = 0; i < tokens.count; i++) {
    const distance = tokens.distances[i]!;
    if (distance === 0) {
      bits += litLengths[tokens.literals[i]!]!;
    } else {
      const li = lengthIndex(tokens.literals[i]!);
      bits += litLengths[257 + li]! + LENGTH_EXTRA[li]!;
      const di = distanceIndex(distance);
      bits += distLengths[di]! + DIST_EXTRA[di]!;
    }
  }
  return bits + litLengths[256]!;
}

/** Writes the token stream with the supplied codes. */
function writeTokens(
  writer: BitWriter,
  tokens: Tokens,
  litLengths: Uint8Array,
  litCodes: Uint16Array,
  distLengths: Uint8Array,
  distCodes: Uint16Array
): void {
  for (let i = 0; i < tokens.count; i++) {
    const distance = tokens.distances[i]!;
    if (distance === 0) {
      const s = tokens.literals[i]!;
      writer.writeHuffman(litCodes[s]!, litLengths[s]!);
    } else {
      const length = tokens.literals[i]!;
      const li = lengthIndex(length);
      writer.writeHuffman(litCodes[257 + li]!, litLengths[257 + li]!);
      if (LENGTH_EXTRA[li]! > 0) writer.writeBits(length - LENGTH_BASE[li]!, LENGTH_EXTRA[li]!);

      const di = distanceIndex(distance);
      writer.writeHuffman(distCodes[di]!, distLengths[di]!);
      if (DIST_EXTRA[di]! > 0) writer.writeBits(distance - DIST_BASE[di]!, DIST_EXTRA[di]!);
    }
  }
  writer.writeHuffman(litCodes[256]!, litLengths[256]!);
}

/** Raw DEFLATE (no zlib wrapper), one block, in whichever form is smallest. */
function deflateRaw(data: Uint8Array): Uint8Array {
  const writer = new BitWriter();

  if (data.length === 0) {
    // An empty stored block: BFINAL=1, BTYPE=00, LEN=0, NLEN=0xFFFF.
    writer.writeBits(1, 1);
    writer.writeBits(0, 2);
    writer.alignToByte();
    writer.writeBytes(new Uint8Array([0x00, 0x00, 0xff, 0xff]));
    return writer.finish();
  }

  const tokens = lz77(data);

  const litFreqs = new Uint32Array(LITERAL_SYMBOLS);
  const distFreqs = new Uint32Array(DISTANCE_SYMBOLS);
  for (let i = 0; i < tokens.count; i++) {
    const distance = tokens.distances[i]!;
    if (distance === 0) {
      litFreqs[tokens.literals[i]!]!++;
    } else {
      litFreqs[257 + lengthIndex(tokens.literals[i]!)]!++;
      distFreqs[distanceIndex(distance)]!++;
    }
  }
  litFreqs[256]!++; // end-of-block

  // ── Dynamic code lengths and their own encoding ────────────────────────────
  const dynLitLengths = huffmanLengths(litFreqs, MAX_CODE_BITS);
  let dynDistLengths = huffmanLengths(distFreqs, MAX_CODE_BITS);

  // At least one distance code must be declared even in a literals-only block.
  if (dynDistLengths.every(l => l === 0)) {
    dynDistLengths = new Uint8Array(DISTANCE_SYMBOLS);
    dynDistLengths[0] = 1;
  }

  // Trim trailing unused entries; HLIT/HDIST declare how many are present.
  let hlit = LITERAL_SYMBOLS;
  while (hlit > 257 && dynLitLengths[hlit - 1] === 0) hlit--;
  let hdist = DISTANCE_SYMBOLS;
  while (hdist > 1 && dynDistLengths[hdist - 1] === 0) hdist--;

  const combined = new Uint8Array(hlit + hdist);
  combined.set(dynLitLengths.subarray(0, hlit), 0);
  combined.set(dynDistLengths.subarray(0, hdist), hlit);

  const rle = encodeCodeLengths(combined);
  const clFreqs = new Uint32Array(19);
  for (const s of rle.symbols) clFreqs[s]!++;
  const clLengths = huffmanLengths(clFreqs, MAX_CODE_LENGTH_BITS);

  let hclen = CODE_LENGTH_ORDER.length;
  while (hclen > 4 && clLengths[CODE_LENGTH_ORDER[hclen - 1]!] === 0) hclen--;

  // ── Cost of each block form, in bits ───────────────────────────────────────
  const fixedLit = fixedLiteralLengths();
  const fixedDist = fixedDistanceLengths();
  const fixedCost = 3 + tokenCost(tokens, fixedLit, fixedDist);

  let dynamicHeader = 3 + 5 + 5 + 4 + hclen * 3;
  for (let i = 0; i < rle.symbols.length; i++) {
    dynamicHeader += clLengths[rle.symbols[i]!]! + rle.extraBits[i]!;
  }
  const dynamicCost = dynamicHeader + tokenCost(tokens, dynLitLengths, dynDistLengths);

  // A stored block costs its header plus the data verbatim, and can only be
  // used when the payload fits one 16-bit length field.
  const storedCost = data.length <= 0xffff ? 3 + 5 + 32 + data.length * 8 : Number.POSITIVE_INFINITY;

  // ── Emit the cheapest ──────────────────────────────────────────────────────
  if (storedCost <= fixedCost && storedCost <= dynamicCost) {
    writer.writeBits(1, 1);
    writer.writeBits(0, 2);
    writer.alignToByte();
    const len = data.length;
    writer.writeBytes(new Uint8Array([len & 0xff, (len >>> 8) & 0xff, ~len & 0xff, (~len >>> 8) & 0xff]));
    writer.writeBytes(data);
    return writer.finish();
  }

  if (fixedCost <= dynamicCost) {
    writer.writeBits(1, 1);
    writer.writeBits(1, 2);
    writeTokens(
      writer,
      tokens,
      fixedLit,
      canonicalCodes(fixedLit, MAX_CODE_BITS),
      fixedDist,
      canonicalCodes(fixedDist, MAX_CODE_BITS)
    );
    return writer.finish();
  }

  writer.writeBits(1, 1);
  writer.writeBits(2, 2); // BTYPE=10, dynamic Huffman
  writer.writeBits(hlit - 257, 5);
  writer.writeBits(hdist - 1, 5);
  writer.writeBits(hclen - 4, 4);
  for (let i = 0; i < hclen; i++) writer.writeBits(clLengths[CODE_LENGTH_ORDER[i]!]!, 3);

  const clCodes = canonicalCodes(clLengths, MAX_CODE_LENGTH_BITS);
  for (let i = 0; i < rle.symbols.length; i++) {
    const s = rle.symbols[i]!;
    writer.writeHuffman(clCodes[s]!, clLengths[s]!);
    if (rle.extraBits[i]! > 0) writer.writeBits(rle.extra[i]!, rle.extraBits[i]!);
  }

  writeTokens(
    writer,
    tokens,
    dynLitLengths,
    canonicalCodes(dynLitLengths, MAX_CODE_BITS),
    dynDistLengths,
    canonicalCodes(dynDistLengths, MAX_CODE_BITS)
  );
  return writer.finish();
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

/**
 * Compresses `data` to zlib-wrapped DEFLATE, ready for a PDF stream carrying
 * `/Filter /FlateDecode`.
 *
 * Synchronous, deterministic, and dependency-free, so it behaves identically in
 * Node, the browser, Bun, and Deno — which is what keeps a document's bytes the
 * same whichever runtime produced it.
 */
export function deflateSync(data: Uint8Array): Uint8Array {
  const body = deflateRaw(data);
  const out = new Uint8Array(body.length + 6);

  // zlib header: CM=8 (deflate), CINFO=7 (32 KiB window), FLEVEL=2, and a check
  // byte chosen so the 16-bit header is a multiple of 31 (RFC 1950 §2.2).
  out[0] = 0x78;
  out[1] = 0x9c;
  out.set(body, 2);

  const checksum = adler32(data);
  out[out.length - 4] = (checksum >>> 24) & 0xff;
  out[out.length - 3] = (checksum >>> 16) & 0xff;
  out[out.length - 2] = (checksum >>> 8) & 0xff;
  out[out.length - 1] = checksum & 0xff;

  return out;
}
