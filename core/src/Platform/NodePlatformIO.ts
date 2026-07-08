import { IPlatformIO } from './PlatformIO';
// Static import per the repo invariant: dynamic require() is compiled by tsup
// to a shim that throws under Node ESM. This module is Node-only and never
// enters the browser graph (only index.node.ts and explicit configurePlatform
// callers import it).
import * as fs from 'node:fs';

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

  readFileSync(path: string): Uint8Array {
    const buffer = fs.readFileSync(path);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  writeFileSync(path: string, data: Uint8Array): void {
    fs.writeFileSync(path, data);
  }

  fileExistsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  async deflate(data: Uint8Array): Promise<Uint8Array> {
    const { promisify } = await import('node:util');
    const { deflate: zlibDeflate } = await import('node:zlib');
    const deflateAsync = promisify(zlibDeflate);
    // node:zlib deflate produces zlib-wrapped DEFLATE (RFC 1950) - correct for PDF /FlateDecode
    const result = await deflateAsync(data);
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
  }
}
