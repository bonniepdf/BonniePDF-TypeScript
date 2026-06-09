/**
 * Platform abstraction layer for file I/O and compression.
 * Provides a single `configurePlatform()` entry point to swap implementations
 * between environments (browser, Node.js, Deno, etc.).
 */

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IPlatformIO {
  /** Reads a file and returns its contents as a Uint8Array. */
  readFile(path: string): Promise<Uint8Array>;
  /** Writes binary data to a file. */
  writeFile(path: string, data: Uint8Array): Promise<void>;
  /**
   * Compresses data using DEFLATE (zlib / RFC 1950 wrapping).
   * The output is suitable for PDF's /FlateDecode stream filter.
   */
  deflate(data: Uint8Array): Promise<Uint8Array>;
}

// ─── Default implementation (browser / modern runtimes) ──────────────────────

class DefaultPlatformIO implements IPlatformIO {
  async readFile(_path: string): Promise<Uint8Array> {
    throw new Error(
      'PlatformIO: readFile not available. ' + 'Call configurePlatform(new NodePlatformIO()) before saving files.'
    );
  }

  async writeFile(_path: string, _data: Uint8Array): Promise<void> {
    throw new Error(
      'PlatformIO: writeFile not available. ' + 'Call configurePlatform(new NodePlatformIO()) before saving files.'
    );
  }

  async deflate(data: Uint8Array): Promise<Uint8Array> {
    // Use CompressionStream if available (browser + Node.js 18+)
    if (typeof CompressionStream !== 'undefined') {
      return deflateWithCompressionStream(data);
    }
    // Fallback: return uncompressed data (no compression)
    console.warn('PlatformIO: CompressionStream not available; returning uncompressed data.');
    return data;
  }
}

// ─── Module-level singleton ───────────────────────────────────────────────────

let _platformIO: IPlatformIO = new DefaultPlatformIO();

/** Replaces the active platform I/O implementation. */
export function configurePlatform(io: IPlatformIO): void {
  _platformIO = io;
}

/** Returns the currently active platform I/O implementation. */
export function getPlatformIO(): IPlatformIO {
  return _platformIO;
}

// ─── Convenience top-level functions ─────────────────────────────────────────

/** Reads a file via the configured platform. */
export function readFile(path: string): Promise<Uint8Array> {
  return _platformIO.readFile(path);
}

/** Writes a file via the configured platform. */
export function writeFile(path: string, data: Uint8Array): Promise<void> {
  return _platformIO.writeFile(path, data);
}

/**
 * Compresses data with DEFLATE (zlib-wrapped) via the configured platform.
 * The output is suitable for PDF's `/FlateDecode` stream filter.
 */
export function deflate(data: Uint8Array): Promise<Uint8Array> {
  return _platformIO.deflate(data);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function deflateWithCompressionStream(data: Uint8Array): Promise<Uint8Array> {
  // 'deflate' format = zlib-wrapped DEFLATE (RFC 1950) - required by PDF /FlateDecode
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();

  // Write and close without awaiting, so the reader can drain concurrently
  const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  writer.write(buf).then(() => writer.close());

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLen = chunks.reduce((n, c) => n + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
