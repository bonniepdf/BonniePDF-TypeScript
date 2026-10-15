import { describe, it, expect } from 'vitest';
import { ImageWriter } from '../../src/Rendering/Images/ImageWriter';
import { ImageInfo, ImageFormat, ImageColorSpace } from '../../src/Rendering/Images/ImageInfo';
import { IPdfWriter } from '../../src/Rendering/Writers/IPdfWriter';
import { createMinimalJpeg } from '../helpers/test-base';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { PdfResourceRegistry } from '../../src/Rendering/PdfResourceRegistry';

class MockPdfWriter implements IPdfWriter {
  private _idCounter = 1;
  public readonly writtenObjects: Array<{ id: number; dict: Map<string, string>; bytes?: Uint8Array }> = [];

  getNewId(): number {
    return this._idCounter++;
  }

  writeObject(id: number, dictionary: Map<string, string>, _stream?: string): void {
    this.writtenObjects.push({ id, dict: new Map(dictionary) });
  }

  writeBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writtenObjects.push({ id, dict: new Map(dictionary), bytes: new Uint8Array(bytes) });
  }

  writeDeflatedObject(id: number, dictionary: Map<string, string>, compressed: Uint8Array): void {
    this.writeBinaryObject(id, dictionary, compressed);
  }

  writeUnencryptedBinaryObject(id: number, dictionary: Map<string, string>, bytes: Uint8Array): void {
    this.writeBinaryObject(id, dictionary, bytes);
  }

  // Unused-by-tests interface fillers - return sensible defaults. ImageWriter
  // only ever reaches the four members above; anything it wrote through these
  // would go unrecorded and fail the assertions on writtenObjects.
  writeRawObject(): void {}
  writeCompressedObject(): void {}
  writeCompressedBinaryObject(): void {}
  writeLinkAnnotation(id: number): number {
    return id;
  }
  writeEncryptDictionary(id: number): number {
    return id;
  }
  writeViewerPreferences(id: number): number {
    return id;
  }
  writeCatalog(): void {}
  close(): void {}
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

function createRgbaPngInfo(): ImageInfo {
  const info = new ImageInfo();
  info.format = ImageFormat.Png;
  info.width = 2;
  info.height = 1;
  info.bitsPerComponent = 8;
  info.components = 3;
  info.colorSpace = ImageColorSpace.DeviceRGB;
  info.hasAlpha = true;
  info.data = new Uint8Array([10, 20, 30, 40, 50, 60]);
  info.alphaData = new Uint8Array([255, 0]);
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

  it('writeJpegImage omits /Decode for normal CMYK JPEGs', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    info.colorSpace = ImageColorSpace.DeviceCMYK;
    imageWriter.writeJpegImage(1, info, '/Im1');
    expect(mockWriter.writtenObjects[0].dict.has('/Decode')).toBe(false);
  });

  it('writeJpegImage emits inverted /Decode for Adobe-CMYK JPEGs', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    info.colorSpace = ImageColorSpace.DeviceCMYK;
    info.invertCmykColors = true;
    imageWriter.writeJpegImage(1, info, '/Im1');
    expect(mockWriter.writtenObjects[0].dict.get('/Decode')).toBe('[1 0 1 0 1 0 1 0]');
  });

  it('writeJpegImage ignores invertCmykColors when colour space is RGB', () => {
    // Defensive: the parser should only set the flag for CMYK images, but
    // the writer guards against accidental misuse to avoid emitting an
    // 8-element /Decode array on a 3-channel image (which would be malformed).
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    info.invertCmykColors = true; // but colorSpace stays DeviceRGB
    imageWriter.writeJpegImage(1, info, '/Im1');
    expect(mockWriter.writtenObjects[0].dict.has('/Decode')).toBe(false);
  });

  it('writeJpegImage emits /ICCBased colour space when an ICC profile is present', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    info.iccProfile = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]);
    imageWriter.writeJpegImage(1, info, '/Im1');

    // Two objects written: the ICC profile stream first, then the image.
    expect(mockWriter.writtenObjects.length).toBe(2);

    const iccObj = mockWriter.writtenObjects[0];
    expect(iccObj.dict.get('/N')).toBe('3'); // RGB JPEG → 3 components
    expect(iccObj.dict.get('/Alternate')).toBe('/DeviceRGB');
    expect(iccObj.dict.get('/Filter')).toBe('/FlateDecode');

    const imageObj = mockWriter.writtenObjects[1];
    expect(imageObj.dict.get('/ColorSpace')).toBe(`[/ICCBased ${iccObj.id} 0 R]`);
  });

  it('writeJpegImage ICC stream has /N = 4 and /Alternate /DeviceCMYK for CMYK JPEGs', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    info.colorSpace = ImageColorSpace.DeviceCMYK;
    info.components = 4;
    info.iccProfile = new Uint8Array([1, 2, 3]);
    imageWriter.writeJpegImage(1, info, '/Im1');

    const iccObj = mockWriter.writtenObjects[0];
    expect(iccObj.dict.get('/N')).toBe('4');
    expect(iccObj.dict.get('/Alternate')).toBe('/DeviceCMYK');
  });

  it('writeJpegImage with no ICC profile preserves device colour space', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    imageWriter.writeJpegImage(1, info, '/Im1');
    expect(mockWriter.writtenObjects.length).toBe(1);
    expect(mockWriter.writtenObjects[0].dict.get('/ColorSpace')).toBe('/DeviceRGB');
  });

  it('writePngImage preserves alpha soft masks for PDF/A-2b', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    imageWriter.conformance = PdfAConformance.PdfA2b;

    imageWriter.writePngImage(10, createRgbaPngInfo(), '/Im1');

    const mainImage = mockWriter.writtenObjects.find(o => o.id === 10);
    const softMask = mockWriter.writtenObjects.find(o => o.id !== 10);
    expect(mainImage?.dict.get('/SMask')).toBe(`${softMask?.id} 0 R`);
    expect(softMask?.dict.get('/ColorSpace')).toBe('/DeviceGray');
  });

  it('writePngImage flattens alpha for PDF/A-1b', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    imageWriter.conformance = PdfAConformance.PdfA1b;

    imageWriter.writePngImage(10, createRgbaPngInfo(), '/Im1');

    expect(mockWriter.writtenObjects).toHaveLength(1);
    expect(mockWriter.writtenObjects[0].dict.has('/SMask')).toBe(false);
  });

  it('resource registry does not dedupe images that only share the PNG header prefix', () => {
    const registry = new PdfResourceRegistry();
    const sharedPrefix = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82]);

    const first = createRgbaPngInfo();
    first.originalData = new Uint8Array([...sharedPrefix, 1, 2, 3, 4]);

    const second = createRgbaPngInfo();
    second.originalData = new Uint8Array([...sharedPrefix, 9, 8, 7, 6]);

    expect(registry.registerImage(first)).not.toBe(registry.registerImage(second));
  });

  it('writeImage throws for unknown format', () => {
    const mockWriter = new MockPdfWriter();
    const imageWriter = new ImageWriter(mockWriter);
    const info = createJpegInfo();
    (info as any).format = 'UnknownFormat';
    expect(() => imageWriter.writeImage(1, info, '/Im1')).toThrow();
  });
});
