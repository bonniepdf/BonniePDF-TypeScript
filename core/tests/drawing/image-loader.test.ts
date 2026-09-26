import { describe, it, expect } from 'vitest';
import { ImageLoader } from '../../src/Rendering/Images/ImageLoader';
import { ImageFormat, ImageColorSpace } from '../../src/Rendering/Images/ImageInfo';
import { createMinimalJpeg } from '../helpers/test-base';
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function pngCrc32(data: Uint8Array): number {
  let crc = 0xffffffff >>> 0;
  for (const v of data) {
    crc ^= v;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngAdler32(data: Uint8Array): number {
  const MOD = 65521;
  let a = 1,
    b = 0;
  for (const d of data) {
    a = (a + d) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function u32be(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function pngChunk(type: string, data: number[]): number[] {
  const tb = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
  return [...u32be(data.length), ...tb, ...data, ...u32be(pngCrc32(new Uint8Array([...tb, ...data])))];
}

// Builds a minimal 1x1 RGB PNG using a stored (uncompressed) deflate block with
// correct Adler-32, so it passes pako's checksum validation.
function createMinimalPng(): Uint8Array {
  const raw = new Uint8Array([0, 0, 0, 0]); // filter=None, R=0, G=0, B=0
  const len = raw.length;
  const nlen = (len ^ 0xffff) & 0xffff;
  const idat = [
    0x78,
    0x01,
    0x01,
    len & 0xff,
    (len >>> 8) & 0xff,
    nlen & 0xff,
    (nlen >>> 8) & 0xff,
    ...Array.from(raw),
    ...u32be(pngAdler32(raw)),
  ];
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...pngChunk('IHDR', [...u32be(1), ...u32be(1), 8, 2, 0, 0, 0]),
    ...pngChunk('IDAT', idat),
    ...pngChunk('IEND', []),
  ]);
}

// Builds a Huffman-compressed (real-world) PNG by running raw scanlines
// through the runtime's CompressionStream - exactly what a real image
// editor would produce.  Used to exercise the async PNG path.
async function createHuffmanPng(width: number, height: number): Promise<Uint8Array> {
  const bpp = 3;
  const stride = 1 + width * bpp;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter = None
    for (let x = 0; x < width; x++) {
      const off = y * stride + 1 + x * bpp;
      raw[off] = (x * 80) & 0xff;
      raw[off + 1] = (y * 80) & 0xff;
      raw[off + 2] = ((x + y) * 60) & 0xff;
    }
  }

  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();
  writer.write(raw).then(() => writer.close());
  const parts: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  const total = parts.reduce((s, c) => s + c.length, 0);
  const idatBytes = new Uint8Array(total);
  let off = 0;
  for (const c of parts) {
    idatBytes.set(c, off);
    off += c.length;
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
    ...pngChunk('IHDR', [...u32be(width), ...u32be(height), 8, 2, 0, 0, 0]),
    ...pngChunk('IDAT', Array.from(idatBytes)),
    ...pngChunk('IEND', []),
  ]);
}

// Build a 32×16 baseline JPEG with an APP1 EXIF segment carrying the given
// orientation tag (TIFF tag 0x0112).  Used to exercise EXIF parsing without
// pulling in any real JPEG fixture files.
function createJpegWithExifOrientation(orientation: number, bigEndian = false): Uint8Array {
  // TIFF block: byte order + magic + IFD0 offset + IFD0 entry count + 1 entry + null next-IFD offset.
  // Entry layout: tag(2) type(2) count(4) value(4).  For SHORT count=1, value is packed into the
  // first 2 bytes of the value field.
  const tiff: number[] = [];
  const u16 = (n: number) => (bigEndian ? [(n >> 8) & 0xff, n & 0xff] : [n & 0xff, (n >> 8) & 0xff]);
  const u32 = (n: number) =>
    bigEndian
      ? [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
      : [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

  tiff.push(...(bigEndian ? [0x4d, 0x4d] : [0x49, 0x49])); // byte order
  tiff.push(...u16(0x002a)); // TIFF magic
  tiff.push(...u32(8)); // IFD0 offset
  tiff.push(...u16(1)); // entry count
  tiff.push(...u16(0x0112)); // tag = Orientation
  tiff.push(...u16(3)); // type = SHORT
  tiff.push(...u32(1)); // count
  tiff.push(...u16(orientation)); // packed value
  tiff.push(0x00, 0x00); // padding for the 4-byte value field
  tiff.push(...u32(0)); // next IFD = 0

  const app1Payload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff]; // "Exif\0\0" + TIFF
  const app1Len = app1Payload.length + 2;

  // SOF0: length 17, precision 8, 16×32 (h×w), 3 components.
  const sof0 = [
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    0x00,
    0x10, // height = 16
    0x00,
    0x20, // width  = 32
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
  ];

  return new Uint8Array([
    0xff,
    0xd8, // SOI
    0xff,
    0xe1,
    (app1Len >> 8) & 0xff,
    app1Len & 0xff,
    ...app1Payload,
    ...sof0,
    0xff,
    0xd9, // EOI
  ]);
}

// Build a 32×16 baseline JPEG with an APP14 Adobe marker carrying the given
// transform byte, and 4 component channels (CMYK).
function createCmykJpegWithAdobeMarker(transform: number): Uint8Array {
  // APP14 payload: "Adobe" + version(2) + flags0(2) + flags1(2) + transform(1) = 12 bytes
  const app14Payload = [0x41, 0x64, 0x6f, 0x62, 0x65, 0x00, 0x65, 0x00, 0x00, 0x00, 0x00, transform];
  const app14Len = app14Payload.length + 2;

  // SOF0 with 4 components → CMYK
  const sof0 = [
    0xff, 0xc0, 0x00, 0x14, 0x08, 0x00, 0x10, 0x00, 0x20, 0x04, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    0x04, 0x11, 0x00,
  ];

  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xee,
    (app14Len >> 8) & 0xff,
    app14Len & 0xff,
    ...app14Payload,
    ...sof0,
    0xff,
    0xd9,
  ]);
}

// Build a minimal 1×1 RGB PNG with a pHYs chunk carrying the given pixels-per-metre values.
function createPngWithPhys(ppmX: number, ppmY: number): Uint8Array {
  const raw = new Uint8Array([0, 0, 0, 0]);
  const len = raw.length;
  const nlen = (len ^ 0xffff) & 0xffff;
  const idat = [
    0x78,
    0x01,
    0x01,
    len & 0xff,
    (len >>> 8) & 0xff,
    nlen & 0xff,
    (nlen >>> 8) & 0xff,
    ...Array.from(raw),
    ...u32be(pngAdler32(raw)),
  ];
  const phys = [...u32be(ppmX), ...u32be(ppmY), 1 /* unit = metre */];
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...pngChunk('IHDR', [...u32be(1), ...u32be(1), 8, 2, 0, 0, 0]),
    ...pngChunk('pHYs', phys),
    ...pngChunk('IDAT', idat),
    ...pngChunk('IEND', []),
  ]);
}

// Build a 1×1 RGB PNG with a stored-block IDAT (so the sync loader can
// reach the rest of the file) and a zlib/Huffman-compressed iCCP chunk.
// Used to verify (a) the async path inflates iCCP correctly and (b) the
// sync path silently drops iCCP rather than crashing.
async function createPngWithIccp(profile: Uint8Array): Promise<Uint8Array> {
  // Stored-block IDAT - same shape as createMinimalPng so sync inflate works.
  const raw = new Uint8Array([0, 0, 0, 0]);
  const len = raw.length;
  const nlen = (len ^ 0xffff) & 0xffff;
  const idat = [
    0x78,
    0x01,
    0x01,
    len & 0xff,
    (len >>> 8) & 0xff,
    nlen & 0xff,
    (nlen >>> 8) & 0xff,
    ...Array.from(raw),
    ...u32be(pngAdler32(raw)),
  ];
  const iccCompressed = await deflateBytes(profile);

  // iCCP chunk: profile name + null + compression method (0) + compressed profile
  const iccpChunk = [...Array.from(new TextEncoder().encode('icc')), 0x00, 0x00, ...Array.from(iccCompressed)];

  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...pngChunk('IHDR', [...u32be(1), ...u32be(1), 8, 2, 0, 0, 0]),
    ...pngChunk('iCCP', iccpChunk),
    ...pngChunk('IDAT', idat),
    ...pngChunk('IEND', []),
  ]);
}

async function deflateBytes(input: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();
  writer.write(input.slice()).then(() => writer.close());
  const parts: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  const total = parts.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of parts) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

// 32×16 baseline RGB SOF0 segment, shared by the JFIF / ICC helpers below.
const RGB_SOF0_32x16 = [
  0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x10, 0x00, 0x20, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
];

// Build a 32×16 RGB JPEG with a JFIF APP0 segment carrying the given density.
function createJpegWithJfifDpi(units: number, xDens: number, yDens: number): Uint8Array {
  // JFIF payload: "JFIF\0" + version(2) + units(1) + Xdens(2) + Ydens(2) + thumbW(1) + thumbH(1)
  const app0Payload = [
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x02, // version 1.02
    units,
    (xDens >> 8) & 0xff,
    xDens & 0xff,
    (yDens >> 8) & 0xff,
    yDens & 0xff,
    0x00,
    0x00, // no thumbnail
  ];
  const app0Len = app0Payload.length + 2;
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    (app0Len >> 8) & 0xff,
    app0Len & 0xff,
    ...app0Payload,
    ...RGB_SOF0_32x16,
    0xff,
    0xd9,
  ]);
}

// Build a 32×16 RGB JPEG carrying a synthetic ICC profile spread across the
// given chunks.  Default sequence numbers run 1..chunks.length; pass
// `seqOrder` to write them in a different order (the loader should sort).
// `announceTotal` defaults to `chunks.length`; pass a larger number to
// simulate a truncated profile (the loader should then drop it).
function createJpegWithIccProfile(chunks: Uint8Array[], seqOrder?: number[], announceTotal?: number): Uint8Array {
  const total = announceTotal ?? chunks.length;
  const order = seqOrder ?? chunks.map((_, i) => i + 1);
  const iccId = [0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46, 0x49, 0x4c, 0x45, 0x00]; // "ICC_PROFILE\0"

  const out: number[] = [0xff, 0xd8];
  for (let i = 0; i < chunks.length; i++) {
    const payload = [...iccId, order[i], total, ...chunks[i]];
    const segLen = payload.length + 2;
    out.push(0xff, 0xe2, (segLen >> 8) & 0xff, segLen & 0xff, ...payload);
  }
  out.push(...RGB_SOF0_32x16);
  out.push(0xff, 0xd9);
  return new Uint8Array(out);
}

const PNG_FILE = '../BonniePDF.NET/BonniePDF.Tests/image.png';
const hasPngFile = existsSync(PNG_FILE);

describe('ImageLoader', () => {
  describe('JPEG loading', () => {
    it('loadFromBytes detects JPEG format', () => {
      const data = createMinimalJpeg();
      const info = ImageLoader.loadFromBytes(data);
      expect(info.format).toBe(ImageFormat.Jpeg);
    });

    it('loadJpeg parses dimensions', () => {
      const data = createMinimalJpeg();
      const info = ImageLoader.loadJpeg(data);
      expect(info.width).toBeGreaterThan(0);
      expect(info.height).toBeGreaterThan(0);
    });

    it('loadJpeg has correct components for RGB JPEG', () => {
      const data = createMinimalJpeg();
      const info = ImageLoader.loadJpeg(data);
      expect(info.components).toBe(3);
    });

    it('loadJpeg has bitsPerComponent 8', () => {
      const data = createMinimalJpeg();
      const info = ImageLoader.loadJpeg(data);
      expect(info.bitsPerComponent).toBe(8);
    });

    it('loadJpeg stores original data', () => {
      const data = createMinimalJpeg();
      const info = ImageLoader.loadJpeg(data);
      expect(info.originalData).toBeDefined();
      expect(info.originalData.length).toBeGreaterThan(0);
    });

    it('loadJpeg throws on empty data', () => {
      expect(() => ImageLoader.loadJpeg(new Uint8Array(0))).toThrow();
    });

    it('loadJpeg throws on invalid signature', () => {
      expect(() => ImageLoader.loadJpeg(new Uint8Array([0x00, 0x00, 0x00]))).toThrow();
    });

    it('JPEG without EXIF defaults to orientation 1', () => {
      const info = ImageLoader.loadJpeg(createMinimalJpeg());
      expect(info.orientation).toBe(1);
      expect(info.displayWidth).toBe(info.width);
      expect(info.displayHeight).toBe(info.height);
    });

    it('parses EXIF orientation 6 from an APP1 segment', () => {
      const info = ImageLoader.loadJpeg(createJpegWithExifOrientation(6));
      expect(info.orientation).toBe(6);
      // 32×16 stored; orientation 6 → displayed 16×32
      expect(info.displayWidth).toBe(16);
      expect(info.displayHeight).toBe(32);
    });

    it('parses EXIF orientation 3 from a big-endian TIFF', () => {
      const info = ImageLoader.loadJpeg(createJpegWithExifOrientation(3, /* bigEndian */ true));
      expect(info.orientation).toBe(3);
      expect(info.displayWidth).toBe(info.width); // 180° rotation doesn't swap aspect
    });

    it('ignores invalid EXIF orientation values', () => {
      const info = ImageLoader.loadJpeg(createJpegWithExifOrientation(99));
      expect(info.orientation).toBe(1);
    });

    it('detects Adobe APP14 CMYK inversion on a CMYK JPEG', () => {
      const info = ImageLoader.loadJpeg(createCmykJpegWithAdobeMarker(/* transform */ 0));
      expect(info.colorSpace).toBe(ImageColorSpace.DeviceCMYK);
      expect(info.invertCmykColors).toBe(true);
    });

    it('does not set invertCmykColors when Adobe transform is non-zero', () => {
      const info = ImageLoader.loadJpeg(createCmykJpegWithAdobeMarker(/* transform */ 2));
      expect(info.colorSpace).toBe(ImageColorSpace.DeviceCMYK);
      expect(info.invertCmykColors).toBe(false);
    });

    it('parses JFIF APP0 density in DPI (units = 1)', () => {
      const info = ImageLoader.loadJpeg(createJpegWithJfifDpi(1, 300, 300));
      expect(info.dpiX).toBe(300);
      expect(info.dpiY).toBe(300);
    });

    it('converts JFIF density from pixels-per-cm (units = 2) to DPI', () => {
      const info = ImageLoader.loadJpeg(createJpegWithJfifDpi(2, 100, 100));
      expect(info.dpiX).toBe(254);
      expect(info.dpiY).toBe(254);
    });

    it('leaves DPI zero when JFIF units = 0 (aspect ratio only)', () => {
      const info = ImageLoader.loadJpeg(createJpegWithJfifDpi(0, 1, 1));
      expect(info.dpiX).toBe(0);
      expect(info.dpiY).toBe(0);
    });

    it('assembles a single-chunk embedded ICC profile from APP2', () => {
      const fakeProfile = new Uint8Array(100);
      for (let i = 0; i < 100; i++) fakeProfile[i] = i;
      const info = ImageLoader.loadJpeg(createJpegWithIccProfile([fakeProfile]));
      expect(info.iccProfile.length).toBe(100);
      expect(Array.from(info.iccProfile.slice(0, 5))).toEqual([0, 1, 2, 3, 4]);
    });

    it('assembles a multi-chunk embedded ICC profile in sequence order', () => {
      const chunkA = new Uint8Array([10, 11, 12]);
      const chunkB = new Uint8Array([20, 21, 22]);
      const chunkC = new Uint8Array([30, 31, 32]);
      // Provide chunks out of order to verify the loader sorts by seq.
      const info = ImageLoader.loadJpeg(createJpegWithIccProfile([chunkB, chunkC, chunkA], [2, 3, 1]));
      expect(Array.from(info.iccProfile)).toEqual([10, 11, 12, 20, 21, 22, 30, 31, 32]);
    });

    it('drops a truncated ICC profile (missing chunks)', () => {
      const info = ImageLoader.loadJpeg(createJpegWithIccProfile([new Uint8Array([1, 2])], [1], /* announceTotal */ 2));
      expect(info.iccProfile.length).toBe(0);
    });
  });

  describe('PNG loading', () => {
    it('loadFromBytes detects PNG format', () => {
      const data = createMinimalPng();
      const info = ImageLoader.loadFromBytes(data);
      expect(info.format).toBe(ImageFormat.Png);
    });

    it('loadPng throws on empty data', () => {
      expect(() => ImageLoader.loadPng(new Uint8Array(0))).toThrow();
    });

    (hasPngFile ? it : it.skip)('loadPng from test file', () => {
      const buf = readFileSync(PNG_FILE);
      const data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      const info = ImageLoader.loadPng(data);
      expect(info.format).toBe(ImageFormat.Png);
      expect(info.width).toBeGreaterThan(0);
      expect(info.height).toBeGreaterThan(0);
    });

    it('loadPng (sync) throws a helpful error on Huffman-compressed PNG', async () => {
      const data = await createHuffmanPng(2, 2);
      expect(() => ImageLoader.loadPng(data)).toThrow(/loadPngAsync|generateBytesAsync/);
    });

    it('loadPngAsync decodes a Huffman-compressed PNG', async () => {
      const data = await createHuffmanPng(2, 2);
      const info = await ImageLoader.loadPngAsync(data);
      expect(info.format).toBe(ImageFormat.Png);
      expect(info.width).toBe(2);
      expect(info.height).toBe(2);
      expect(info.colorSpace).toBe(ImageColorSpace.DeviceRGB);
    });

    it('loadFromBytesAsync auto-detects and decodes a Huffman-compressed PNG', async () => {
      const data = await createHuffmanPng(2, 2);
      const info = await ImageLoader.loadFromBytesAsync(data);
      expect(info.format).toBe(ImageFormat.Png);
      expect(info.width).toBe(2);
    });

    it('parses PNG pHYs chunk into dpiX / dpiY', () => {
      const data = createPngWithPhys(2835, 2835); // 2835 ppm ≈ 72 DPI
      const info = ImageLoader.loadPng(data);
      expect(info.dpiX).toBe(72);
      expect(info.dpiY).toBe(72);
    });

    it('loadPngAsync inflates iCCP and exposes the embedded ICC profile', async () => {
      const profile = new Uint8Array([10, 20, 30, 40, 50, 60]);
      const data = await createPngWithIccp(profile);
      const info = await ImageLoader.loadPngAsync(data);
      expect(Array.from(info.iccProfile)).toEqual([10, 20, 30, 40, 50, 60]);
    });

    it('sync loadPng silently drops iCCP profile (async path required)', async () => {
      const profile = new Uint8Array([10, 20, 30]);
      const data = await createPngWithIccp(profile);
      const info = ImageLoader.loadPng(data);
      expect(info.iccProfile.length).toBe(0);
    });
  });

  describe('auto-detection', () => {
    it('loadFromBytes throws on unknown format', () => {
      expect(() =>
        ImageLoader.loadFromBytes(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]))
      ).toThrow();
    });

    it('loadFromBytes throws on too-small data', () => {
      expect(() => ImageLoader.loadFromBytes(new Uint8Array([0x01, 0x02]))).toThrow();
    });
  });

  describe('load()', () => {
    it('loads an image from a file path', () => {
      const directory = mkdtempSync(join(tmpdir(), 'bonniepdf-image-loader-'));
      const filePath = join(directory, 'image.jpg');
      try {
        writeFileSync(filePath, createMinimalJpeg());
        const info = ImageLoader.load(filePath);

        expect(info.format).toBe(ImageFormat.Jpeg);
        expect(info.width).toBeGreaterThan(0);
        expect(info.height).toBeGreaterThan(0);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it('reports file-system errors', () => {
      expect(() => ImageLoader.load('nonexistent.jpg')).toThrow();
    });
  });
});

// A deterministic RGBA pattern with variation in both axes, so the Up, Average
// and Paeth filters (which read the row above) cannot decode correctly by accident.
const rgbaSample = (x: number, y: number, c: number): number => (x * 37 + y * 91 + c * 53 + ((x * y) % 29)) & 0xff;

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

// Encodes an RGBA PNG, forward-filtering row y with filterOf(y), independently of the loader.
async function createFilteredRgbaPng(
  width: number,
  height: number,
  filterOf: (y: number) => number
): Promise<Uint8Array> {
  const bpp = 4;
  const rowBytes = width * bpp;
  const raw = new Uint8Array((1 + rowBytes) * height);
  let prev = new Uint8Array(rowBytes);
  for (let y = 0; y < height; y++) {
    const cur = new Uint8Array(rowBytes);
    for (let x = 0; x < width; x++) for (let c = 0; c < bpp; c++) cur[x * bpp + c] = rgbaSample(x, y, c);
    const filter = filterOf(y);
    raw[y * (1 + rowBytes)] = filter;
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const cc = i >= bpp ? prev[i - bpp] : 0;
      const predictor = [0, a, b, (a + b) >> 1, paeth(a, b, cc)][filter];
      raw[y * (1 + rowBytes) + 1 + i] = (cur[i] - predictor) & 0xff;
    }
    prev = cur;
  }

  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();
  writer.write(raw).then(() => writer.close());
  const parts: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  const idat = parts.flatMap(p => Array.from(p));

  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...pngChunk('IHDR', [...u32be(width), ...u32be(height), 8, 6, 0, 0, 0]),
    ...pngChunk('IDAT', idat),
    ...pngChunk('IEND', []),
  ]);
}

describe('ImageLoader.loadPngAsync - RGBA defiltering', () => {
  const cases: [string, (y: number) => number][] = [
    ['None', () => 0],
    ['Sub', () => 1],
    ['Up', () => 2],
    ['Average', () => 3],
    ['Paeth', () => 4],
    ['rows cycling through every filter', y => y % 5],
  ];

  for (const [name, filterOf] of cases) {
    it(`decodes ${name} rows to the original pixels`, async () => {
      const width = 23;
      const height = 17;
      const image = await ImageLoader.loadPngAsync(await createFilteredRgbaPng(width, height, filterOf));

      expect(image.hasAlpha).toBe(true);
      expect(image.components).toBe(3);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = y * width + x;
          for (let c = 0; c < 3; c++) expect(image.data[pixel * 3 + c]).toBe(rgbaSample(x, y, c));
          expect(image.alphaData[pixel]).toBe(rgbaSample(x, y, 3));
        }
      }
    });
  }
});
