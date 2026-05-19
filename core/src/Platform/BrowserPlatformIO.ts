import { IPlatformIO } from './PlatformIO';

/**
 * Browser platform I/O implementation.
 * Uses the Fetch API to load files by URL and CompressionStream for DEFLATE.
 *
 * Usage:
 *   import { configurePlatform } from './Platform/PlatformIO';
 *   import { BrowserPlatformIO } from './Platform/BrowserPlatformIO';
 *   configurePlatform(new BrowserPlatformIO());
 *
 * Font loading:
 *   Pass a URL (relative or absolute) to TtfFont.fromFile() — the font
 *   bytes are fetched via the Fetch API and parsed in-memory.
 */
export class BrowserPlatformIO implements IPlatformIO {
  async readFile(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`BrowserPlatformIO: fetch failed for "${url}" — ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async writeFile(_path: string, _data: Uint8Array): Promise<void> {
    // In the browser, "writing" a file triggers a download instead.
    throw new Error(
      'BrowserPlatformIO: writeFile() is not supported. ' +
        'Use Document.generateBytes() and create a Blob URL for download.'
    );
  }

  async deflate(data: Uint8Array): Promise<Uint8Array> {
    if (typeof CompressionStream === 'undefined') {
      console.warn('BrowserPlatformIO: CompressionStream not available; returning uncompressed data.');
      return data;
    }

    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    const reader = cs.readable.getReader();

    const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    writer.write(buf).then(() => writer.close());

    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const total = chunks.reduce((n, c) => n + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}
