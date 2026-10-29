import { deflateSync } from '../Compression/Deflate';

/**
 * The one FlateDecode encoding of a stream. The writer and the finished-page store both call it, so a page
 * compressed while layout is still running is byte-for-byte the stream the writer would have produced from
 * the same text.
 */
export function compressContent(content: Uint8Array): Uint8Array {
  return deflateSync(content);
}
