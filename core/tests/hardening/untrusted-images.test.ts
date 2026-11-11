import { describe, it, expect } from 'vitest';
import { deflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { Image } from '../../src/Elements/Media/Image';
import { ImageDecodeError, ImageLoader } from '../../src/Rendering/Images/ImageLoader';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

/**
 * Image bytes are often supplied by end users (a logo upload, a product photo),
 * so a bad or hostile PNG must be handled inside the library: it may become an
 * `image` diagnostic or a catchable error, but it must not escape as an
 * unhandled rejection, and it must not be decoded without bound.
 */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Builds a PNG from a header and a (possibly invalid) zlib stream. `colorType` 0 is 8-bit grey, 6 is RGBA. */
function png(width: number, height: number, colorType: 0 | 6, zlibData: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  const parts = [
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlibData),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

const validPixels = deflateSync(new Uint8Array((4 * 4 + 1) * 4).fill(128));

type Outcome = { error: unknown; diagnostics: string[]; unhandled: unknown[]; ms: number };

/** Generates a document holding the image, recording anything that escapes as an unhandled rejection. */
async function generateWith(imageData: Uint8Array): Promise<Outcome> {
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown): void => void unhandled.push(reason);
  process.on('unhandledRejection', onUnhandled);
  const started = performance.now();
  let error: unknown;
  const doc = new Document();
  try {
    doc.add(new Image({ imageData, altText: 'Test image', width: 50, height: 50 }));
    doc.add(new TextBlock('after the image'));
    await doc.generateBytesAsync();
  } catch (e) {
    error = e;
  }
  const ms = performance.now() - started;
  // Unhandled rejections are reported on a later turn of the event loop.
  await new Promise(resolve => setTimeout(resolve, 100));
  process.off('unhandledRejection', onUnhandled);
  return { error, diagnostics: doc.diagnostics.map(d => `${d.category}: ${d.message}`), unhandled, ms };
}

/** A bad image is handled when it is either diagnosed or rejected with a message a developer can act on. */
function expectHandled(outcome: Outcome): void {
  expect(outcome.unhandled, 'a rejection escaped the library as unhandled').toHaveLength(0);
  if (outcome.error === undefined) {
    expect(outcome.diagnostics.some(d => d.startsWith('image'))).toBe(true);
  } else {
    expect(outcome.error).toBeInstanceOf(Error);
    expect((outcome.error as Error).message, 'the error carries no message').not.toBe('');
    expect(outcome.error, 'a memory-allocation failure is not a handled error').not.toBeInstanceOf(RangeError);
  }
}

describe('malformed PNG data is handled inside the library', () => {
  it('control: a valid PNG generates cleanly', async () => {
    const outcome = await generateWith(png(4, 4, 6, validPixels));
    expect(outcome.error).toBeUndefined();
    expect(outcome.unhandled).toHaveLength(0);
  });

  it('pixel data truncated mid-stream', async () => {
    const truncated = validPixels.subarray(0, Math.floor(validPixels.length / 2));
    expectHandled(await generateWith(png(4, 4, 6, truncated)));
  });

  it('pixel data that is not a zlib stream', async () => {
    const garbage = new TextEncoder().encode('this is not zlib data at all');
    expectHandled(await generateWith(png(4, 4, 6, garbage)));
  });
});

describe('PNG decoding is bounded', () => {
  it('reports corrupt data and oversized images as ImageDecodeError', async () => {
    const garbage = new TextEncoder().encode('this is not zlib data at all');
    expect((await generateWith(png(4, 4, 6, garbage))).error).toBeInstanceOf(ImageDecodeError);
    expect((await generateWith(png(60000, 60000, 6, validPixels))).error).toBeInstanceOf(ImageDecodeError);
  });

  it('applies ImageLoader.maxPixels, which an application can change', async () => {
    const original = ImageLoader.maxPixels;
    try {
      ImageLoader.maxPixels = 15;
      expect((await generateWith(png(4, 4, 6, validPixels))).error).toBeInstanceOf(ImageDecodeError);
      ImageLoader.maxPixels = 16;
      expect((await generateWith(png(4, 4, 6, validPixels))).error).toBeUndefined();
    } finally {
      ImageLoader.maxPixels = original;
    }
  });

  it('a header claiming 60,000 x 60,000 pixels is refused before any allocation', async () => {
    const outcome = await generateWith(png(60000, 60000, 6, validPixels));
    expectHandled(outcome);
  });

  it('a decompression bomb is refused rather than decoded', async () => {
    // 12,000 x 12,000 8-bit grey: about 140 KB on the wire, 144 MB once inflated,
    // and 576 MB if expanded to RGBA. No document needs a 144-megapixel image.
    const side = 12000;
    const bomb = png(side, side, 0, deflateSync(new Uint8Array(side * (side + 1)), { level: 9 }));
    expect(bomb.length).toBeLessThan(1024 * 1024);

    const outcome = await generateWith(bomb);
    expect(outcome.unhandled).toHaveLength(0);
    const refused =
      outcome.error !== undefined ||
      outcome.diagnostics.some(d => d.startsWith('image') && !d.includes('image.resampled'));
    expect(refused, `the image was fully decoded in ${outcome.ms.toFixed(0)} ms`).toBe(true);
  }, 60_000);
});

describe('decode-limit messages and bounds (spec 12 §3a)', () => {
  const messageOf = async (imageData: Uint8Array): Promise<string | undefined> =>
    ((await generateWith(imageData)).error as Error | undefined)?.message;

  it('names the reason in the error message', async () => {
    const garbage = new TextEncoder().encode('this is not zlib data at all');
    expect(await messageOf(png(4, 4, 6, garbage))).toBe(
      'PNG data is corrupt: its compressed stream could not be inflated.'
    );
    expect(await messageOf(png(60000, 60000, 6, validPixels))).toBe(
      'Image is 60000 x 60000 pixels, above the 100000000-pixel limit (ImageLoader.maxPixels).'
    );
  });

  it('allows a 4 x 4 RGBA image to inflate to 140 bytes and no more', async () => {
    // Four rows of one filter byte and 16 samples, plus two bytes per row and 64 bytes of allowance.
    expect(await messageOf(png(4, 4, 6, deflateSync(new Uint8Array(140).fill(128))))).toBeUndefined();
    expect(await messageOf(png(4, 4, 6, deflateSync(new Uint8Array(141).fill(128))))).toBe(
      'PNG data inflates to more than its header declares.'
    );
  });

  it('drops an embedded colour profile that cannot be inflated', async () => {
    const iccp = new Uint8Array([...new TextEncoder().encode('p'), 0, 0, ...new TextEncoder().encode('not zlib')]);
    const bytes = pngWithChunk(png(4, 4, 6, validPixels), chunk('iCCP', iccp));
    const doc = new Document();
    doc.add(new Image({ imageData: bytes, altText: 'Test image', width: 50, height: 50 }));
    const pdf = Buffer.from(await doc.generateBytesAsync()).toString('latin1');
    expect(pdf).not.toContain('/ICCBased');
  });
});

/** Inserts a chunk straight after IHDR (8-byte signature plus the 25-byte IHDR chunk). */
function pngWithChunk(base: Uint8Array, extra: Uint8Array): Uint8Array {
  const out = new Uint8Array(base.length + extra.length);
  out.set(base.subarray(0, 33));
  out.set(extra, 33);
  out.set(base.subarray(33), 33 + extra.length);
  return out;
}
