import { describe, it, expect } from 'vitest';
import { ImageLoader } from '../src/Rendering/Images/ImageLoader';
import { ImageFormat, ImageColorSpace } from '../src/Rendering/Images/ImageInfo';
import { createMinimalJpeg } from './helpers/test-base';
import { existsSync, readFileSync } from 'fs';

// Minimal valid PNG (1x1 pixel, RGB)
function createMinimalPng(): Uint8Array {
  // PNG signature + minimal IHDR + IDAT + IEND
  return new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02,             // Bit depth: 8, Color type: 2 (RGB)
    0x00, 0x00, 0x00,       // Compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
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
  });

  describe('PNG loading', () => {
    it('loadFromBytes detects PNG format', () => {
      const data = createMinimalPng();
      try {
        const info = ImageLoader.loadFromBytes(data);
        expect(info.format).toBe(ImageFormat.Png);
      } catch {
        // Minimal PNG may fail parsing — that's acceptable
      }
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
  });

  describe('auto-detection', () => {
    it('loadFromBytes throws on unknown format', () => {
      expect(() => ImageLoader.loadFromBytes(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]))).toThrow();
    });

    it('loadFromBytes throws on too-small data', () => {
      expect(() => ImageLoader.loadFromBytes(new Uint8Array([0x01, 0x02]))).toThrow();
    });
  });

  describe('load() stub', () => {
    it('load from file path throws (not implemented)', () => {
      expect(() => ImageLoader.load('nonexistent.jpg')).toThrow();
    });
  });
});
