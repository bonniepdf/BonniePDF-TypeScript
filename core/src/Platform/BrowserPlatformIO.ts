import { deflateWithCompressionStream, IPlatformIO } from './PlatformIO';

/**
 * Provides URL-based file reads and DEFLATE compression in browser environments,
 * using the Fetch API and `CompressionStream`.
 *
 * Font loading: pass a URL (relative or absolute) to `TtfFont.fromFile()` - the
 * font bytes are fetched via the Fetch API and parsed in memory.
 */
export class BrowserPlatformIO implements IPlatformIO {
  async readFile(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`BrowserPlatformIO: fetch failed for "${url}" - ${response.status} ${response.statusText}`);
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

    return deflateWithCompressionStream(data);
  }
}
