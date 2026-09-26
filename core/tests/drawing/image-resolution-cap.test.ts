import { describe, it, expect } from 'vitest';
import { inflateSync } from 'zlib';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { Image } from '../../src/Elements/Media/Image';
import { createMinimalJpeg } from '../helpers/test-base';

/**
 * The document-level behaviour of the image resolution cap: what is embedded, at what size, once
 * or twice, and what is reported. The resampler itself is covered by image-resampler.test.ts.
 * Mirrors BonniePDF.Tests/Drawing/ImageResolutionCapTests.cs.
 */

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const v of data) {
    crc ^= v;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const u32be = (n: number): number[] => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

function chunk(type: string, data: number[]): number[] {
  const tb = [...type].map(c => c.charCodeAt(0));
  return [...u32be(data.length), ...tb, ...data, ...u32be(crc32(new Uint8Array([...tb, ...data])))];
}

// An RGBA PNG with filter None on every row and a real (compressed) IDAT, as an encoder writes.
async function rgbaPng(width: number, height: number): Promise<Uint8Array> {
  const stride = 1 + width * 4;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) raw[y * stride + 1 + x * 4 + c] = (x * 37 + y * 91 + c * 53 + ((x * y) % 29)) & 0xff;
    }
  }
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();
  void writer.write(raw).then(() => writer.close());
  const idat: number[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const b of value) idat.push(b);
  }
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...chunk('IHDR', [...u32be(width), ...u32be(height), 8, 6, 0, 0, 0]),
    ...chunk('IDAT', idat),
    ...chunk('IEND', []),
  ]);
}

interface EmbeddedImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

// The image XObjects in a PDF, with their stream contents inflated.
function embeddedImages(pdf: Uint8Array): EmbeddedImage[] {
  const text = Buffer.from(pdf).toString('latin1');
  const images: EmbeddedImage[] = [];
  for (const m of text.matchAll(/\d+ 0 obj\s*<<([^>]*?\/Subtype\s*\/Image[^>]*?)>>\s*stream\r?\n/g)) {
    const dict = m[1];
    const length = Number(/\/Length (\d+)/.exec(dict)![1]);
    const start = m.index + m[0].length;
    images.push({
      width: Number(/\/Width (\d+)/.exec(dict)![1]),
      height: Number(/\/Height (\d+)/.exec(dict)![1]),
      pixels: new Uint8Array(inflateSync(pdf.subarray(start, start + length))),
    });
  }
  return images;
}

const documentWith = (maxImageDpi: number | null, ...images: Image[]): Document => {
  const doc = new Document(new DocumentSettings({ maxImageDpi }));
  for (const image of images) doc.add(image);
  return doc;
};

const png = async (width: number, height: number, drawnWidth: number, keepResolution = false): Promise<Image> =>
  new Image({ imageData: await rgbaPng(width, height), width: drawnWidth, keepResolution, altText: 'test image' });

describe('image resolution cap', () => {
  it('reduces an oversampled PNG to the cap', async () => {
    const doc = documentWith(288, await png(1200, 600, 75));

    const embedded = embeddedImages(await doc.generateBytesAsync());

    // 75 pt at 288 ppi is 300 px; the height follows the aspect ratio: 37.5 pt is 150 px.
    expect(embedded).toHaveLength(2); // the colour plane and its soft mask
    for (const i of embedded) expect([i.width, i.height]).toEqual([300, 150]);
    doc.dispose();
  });

  it('embeds the source pixels when maxImageDpi is null', async () => {
    const doc = documentWith(null, await png(1200, 600, 75));

    for (const i of embeddedImages(await doc.generateBytesAsync())) expect([i.width, i.height]).toEqual([1200, 600]);
    doc.dispose();
  });

  it('embeds the source pixels for an image that keeps its resolution', async () => {
    const doc = documentWith(288, await png(1200, 600, 75, true));

    for (const i of embeddedImages(await doc.generateBytesAsync())) expect(i.width).toBe(1200);
    doc.dispose();
  });

  it('embeds an image used twice once, sized for its largest use', async () => {
    const big = await png(1200, 600, 150);
    const small = new Image({ imageData: big.imageData, width: 75, altText: 'test image' });
    const doc = documentWith(288, small, big);

    const embedded = embeddedImages(await doc.generateBytesAsync());

    expect(embedded).toHaveLength(2); // one colour plane, one mask - not two of each
    for (const i of embedded) expect(i.width).toBe(600); // 150 pt at 288 ppi
    doc.dispose();
  });

  it('lets one keepResolution placement keep a shared image whole', async () => {
    const kept = await png(1200, 600, 75, true);
    const small = new Image({ imageData: kept.imageData, width: 75, altText: 'test image' });
    const doc = documentWith(288, small, kept);

    for (const i of embeddedImages(await doc.generateBytesAsync())) expect(i.width).toBe(1200);
    doc.dispose();
  });

  it('leaves an image inside the 1.5x tolerance alone', async () => {
    // 1200 x 960 drawn 250 pt wide: a 1000 x 800 target, 1.44x the pixels - under the threshold.
    const doc = documentWith(288, await png(1200, 960, 250));

    for (const i of embeddedImages(await doc.generateBytesAsync())) expect(i.width).toBe(1200);
    doc.dispose();
  });

  it('never enlarges an image below the cap', async () => {
    const doc = documentWith(288, await png(100, 50, 300));

    for (const i of embeddedImages(await doc.generateBytesAsync())) expect(i.width).toBe(100);
    doc.dispose();
  });

  it('reports a resampled image in the diagnostics', async () => {
    const doc = documentWith(288, await png(1200, 600, 75));
    await doc.generateBytesAsync();

    const found = doc.diagnostics.filter(d => d.category === 'image');

    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe('info');
    expect(found[0].message.startsWith('image.resampled: 1200x600 -> 300x150')).toBe(true);
    doc.dispose();
  });

  it('passes a JPEG through, and says so', async () => {
    const doc = documentWith(288, new Image({ imageData: createMinimalJpeg(), width: 5, altText: 'test image' }));
    await doc.generateBytesAsync();

    const found = doc.diagnostics.filter(d => d.category === 'image');

    expect(found).toHaveLength(1);
    expect(found[0].message.startsWith('image.passed-through:')).toBe(true);
    expect(found[0].message).toContain('not a PNG');
    doc.dispose();
  });

  it('rejects a non-positive maxImageDpi', () => {
    expect(() => new DocumentSettings({ maxImageDpi: 0 })).toThrow(RangeError);
  });
});
