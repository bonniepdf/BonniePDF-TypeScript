import { describe, it, expect } from 'vitest';
import { ImageWriter } from '../src/Rendering/Images/ImageWriter';
import { ImageInfo, ImageFormat, ImageColorSpace } from '../src/Rendering/Images/ImageInfo';
import { IPdfWriter } from '../src/Rendering/Writers/PdfWriter';
import { createMinimalJpeg } from './helpers/test-base';

class MockPdfWriter implements IPdfWriter {
  private _idCounter = 1;
  public readonly writtenObjects: Array<{ id: number; dict: Map<string, string>; bytes?: Uint8Array }> = [];

  getNewId(): number { return this._idCounter++; }

  writeObject(id: number, dictionary: Map<string, string>, _stream?: string): void {
    this.writtenObjects.push({ id, dict: new Map(dictionary) });
  }

  writeBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writtenObjects.push({ id, dict: new Map(dictionary), bytes: new Uint8Array(bytes) });
  }

  writeUnencryptedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writeBinaryObject(id, dictionary, bytes);
  }
}

function createJpegInfo(): ImageInfo {
  const data = createMinimalJpeg();
  const info = new ImageInfo();
  info.format = ImageFormat.Jpeg;
  info.width = 32;
  info.height = 16;
  info.bitsPerComponent = 8;
  info.components = 3;
  info.colorSpace = ImageColorSpace.DeviceRGB;
  info.data = data;
  info.originalData = data;
  return info;
}

describe('ImageWriter', () => {
  it('writeJpegImage writes XObject with correct type', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    imageWriter.writeJpegImage(1, info, '/Im1');
    expect(mockWriter.writtenObjects.length).toBeGreaterThan(0);
    const obj = mockWriter.writtenObjects[0];
    expect(obj.dict.get('/Subtype')).toBe('/Image');
  });

  it('writeJpegImage sets width and height', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    imageWriter.writeJpegImage(1, info, '/Im1');
    const obj = mockWriter.writtenObjects[0];
    expect(obj.dict.get('/Width')).toBe('32');
    expect(obj.dict.get('/Height')).toBe('16');
  });

  it('writeJpegImage sets DCTDecode filter', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    imageWriter.writeJpegImage(1, info, '/Im1');
    const obj = mockWriter.writtenObjects[0];
    expect(obj.dict.get('/Filter')).toBe('/DCTDecode');
  });

  it('writeImage dispatches to JPEG for Jpeg format', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    imageWriter.writeImage(1, info, '/Im1');
    const obj = mockWriter.writtenObjects[0];
    expect(obj.dict.get('/Filter')).toBe('/DCTDecode');
  });

  it('writeImage throws for unknown format', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    (info as any).format = 'UnknownFormat';
    expect(() => imageWriter.writeImage(1, info, '/Im1')).toThrow();
  });
});
