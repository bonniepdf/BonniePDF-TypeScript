import { IPlatformIO } from './PlatformIO';

/**
 * Node.js platform I/O implementation.
 * Uses `node:fs/promises` for file operations and `node:zlib` for DEFLATE compression.
 *
 * Usage:
 *   import { configurePlatform } from './Platform/PlatformIO';
 *   import { NodePlatformIO } from './Platform/NodePlatformIO';
 *   configurePlatform(new NodePlatformIO());
 */
export class NodePlatformIO implements IPlatformIO {
  async readFile(path: string): Promise<Uint8Array> {
    const { readFile } = await import('node:fs/promises');
    const buffer = await readFile(path);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path, data);
  }

  async deflate(data: Uint8Array): Promise<Uint8Array> {
    const { promisify } = await import('node:util');
    const { deflate: zlibDeflate } = await import('node:zlib');
    const deflateAsync = promisify(zlibDeflate);
    // node:zlib deflate produces zlib-wrapped DEFLATE (RFC 1950) — correct for PDF /FlateDecode
    const result = await deflateAsync(data);
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
  }
}
