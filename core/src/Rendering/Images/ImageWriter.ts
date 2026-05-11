import { IPdfWriter, IAsyncPdfWriter } from '../Writers/PdfWriter';
import { ImageInfo, ImageFormat, ImageColorSpace } from './ImageInfo';

function _toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Writes image XObjects to PDF
 * Supports both synchronous (IPdfWriter) and asynchronous (IAsyncPdfWriter) operations.
 */
export class ImageWriter {
  private readonly asyncWriter?: IAsyncPdfWriter;
  private readonly writer: IPdfWriter;

  /**
   * When true, PDF/A-1B constraints are enforced (e.g. alpha channels are flattened).
   */
  public pdfAEnabled = false;

  /**
   * Creates an ImageWriter for synchronous operations
   */
  constructor(writer: IPdfWriter);
  /**
   * Creates an ImageWriter for asynchronous operations
   */
  constructor(asyncWriter: IAsyncPdfWriter);
  constructor(writerOrAsync: IPdfWriter | IAsyncPdfWriter) {
    if ('getNewId' in writerOrAsync && 'writeObjectAsync' in writerOrAsync) {
      this.asyncWriter = writerOrAsync as IAsyncPdfWriter;
      this.writer = writerOrAsync as any;
    } else {
      this.writer = writerOrAsync as IPdfWriter;
      this.asyncWriter = undefined;
    }
  }

  /**
   * Writes an image as an XObject, auto-detecting format
   * @returns The object ID used (may differ if soft mask was created)
   */
  public writeImage(id: number, image: ImageInfo, resourceName: string): number {
    switch (image.format) {
      case ImageFormat.Jpeg:
        return this.writeJpegImage(id, image, resourceName);
      case ImageFormat.Png:
        return this.writePngImage(id, image, resourceName);
      default:
        throw new Error(`Unsupported image format: ${image.format}`);
    }
  }

  /**
   * Writes a JPEG image as an XObject
   */
  public writeJpegImage(id: number, image: ImageInfo, resourceName: string): number {
    const dict = new Map<string, string>();
    dict.set('/Type', '/XObject');
    dict.set('/Subtype', '/Image');
    dict.set('/Width', image.width.toString());
    dict.set('/Height', image.height.toString());
    dict.set('/ColorSpace', this.getColorSpaceString(image.colorSpace, image.palette));
    dict.set('/BitsPerComponent', image.bitsPerComponent.toString());
    dict.set('/Filter', '/DCTDecode'); // JPEG compression filter

    this.writer.writeBinaryObject(id, dict, image.data);
    return id;
  }

  /**
   * Writes a PNG image as an XObject (using FlateDecode)
   */
  public writePngImage(id: number, image: ImageInfo, resourceName: string): number {
    // PDF/A-1B forbids SMask — flatten alpha by compositing against white
    let pixelData = image.data;
    let writeSmask = image.hasAlpha && image.alphaData.length > 0;

    if (writeSmask && this.pdfAEnabled) {
      pixelData = this.flattenAlpha(image.data, image.alphaData, image.components, image.bitsPerComponent);
      writeSmask = false;
    }

    // Compress pixel data using zlib/Deflate
    const compressedData = this.compressData(pixelData);

    const dict = new Map<string, string>();
    dict.set('/Type', '/XObject');
    dict.set('/Subtype', '/Image');
    dict.set('/Width', image.width.toString());
    dict.set('/Height', image.height.toString());
    dict.set('/BitsPerComponent', image.bitsPerComponent.toString());
    dict.set('/Filter', '/FlateDecode');

    // Handle color space
    if (image.colorSpace === ImageColorSpace.Indexed && image.palette.length > 0) {
      // Indexed color: [/Indexed /DeviceRGB maxIndex paletteHexString]
      const maxIndex = image.palette.length / 3 - 1;
      const paletteHex = '<' + _toHex(image.palette) + '>';
      dict.set('/ColorSpace', `[/Indexed /DeviceRGB ${maxIndex} ${paletteHex}]`);
    } else {
      dict.set('/ColorSpace', this.getColorSpaceString(image.colorSpace, image.palette));
    }

    // Handle alpha channel (soft mask)
    if (writeSmask) {
      const smaskId = this.writer.getNewId();
      this.writeSoftMask(smaskId, image);
      dict.set('/SMask', `${smaskId} 0 R`);
    }

    this.writer.writeBinaryObject(id, dict, compressedData);
    return id;
  }

  /**
   * Writes a soft mask (alpha channel) for transparency
   */
  private writeSoftMask(id: number, image: ImageInfo): void {
    const compressedAlpha = this.compressData(image.alphaData);

    const dict = new Map<string, string>();
    dict.set('/Type', '/XObject');
    dict.set('/Subtype', '/Image');
    dict.set('/Width', image.width.toString());
    dict.set('/Height', image.height.toString());
    dict.set('/ColorSpace', '/DeviceGray');
    dict.set('/BitsPerComponent', image.bitsPerComponent.toString());
    dict.set('/Filter', '/FlateDecode');

    this.writer.writeBinaryObject(id, dict, compressedAlpha);
  }

  /**
   * Compresses data using zlib/Deflate (Legacy Sync Version)
   * TODO: Implement actual zlib compression
   */
  private compressData(data: Uint8Array): Uint8Array {
    // TODO: Implement zlib compression with Adler-32 checksum
    // For now, return uncompressed data
    return data;
  }

  /**
   * Calculates Adler-32 checksum for zlib
   */
  private calculateAdler32(data: Uint8Array): number {
    const MOD_ADLER = 65521;
    let a = 1;
    let b = 0;

    for (const d of data) {
      a = (a + d) % MOD_ADLER;
      b = (b + a) % MOD_ADLER;
    }

    return (b << 16) | a;
  }

  /**
   * Gets the PDF color space string for an image
   */
  private getColorSpaceString(colorSpace: ImageColorSpace, palette: Uint8Array): string {
    switch (colorSpace) {
      case ImageColorSpace.DeviceRGB:
        return '/DeviceRGB';
      case ImageColorSpace.DeviceCMYK:
        return '/DeviceCMYK';
      case ImageColorSpace.DeviceGray:
        return '/DeviceGray';
      case ImageColorSpace.Indexed:
        return '/DeviceRGB'; // Fallback if no palette handling needed
      default:
        return '/DeviceRGB';
    }
  }

  // ========== ASYNC METHODS ==========

  /**
   * Writes an image as an XObject asynchronously, auto-detecting format
   */
  public async writeImageAsync(
    id: number,
    image: ImageInfo,
    resourceName: string,
    cancellationToken?: AbortSignal
  ): Promise<number> {
    switch (image.format) {
      case ImageFormat.Jpeg:
        return this.writeJpegImageAsync(id, image, resourceName, cancellationToken);
      case ImageFormat.Png:
        return this.writePngImageAsync(id, image, resourceName, cancellationToken);
      default:
        throw new Error(`Unsupported image format: ${image.format}`);
    }
  }

  /**
   * Writes a JPEG image as an XObject asynchronously
   */
  public async writeJpegImageAsync(
    id: number,
    image: ImageInfo,
    resourceName: string,
    cancellationToken?: AbortSignal
  ): Promise<number> {
    if (!this.asyncWriter) {
      throw new Error('Async writer not configured');
    }

    const dict = new Map<string, string>();
    dict.set('/Type', '/XObject');
    dict.set('/Subtype', '/Image');
    dict.set('/Width', image.width.toString());
    dict.set('/Height', image.height.toString());
    dict.set('/ColorSpace', this.getColorSpaceString(image.colorSpace, image.palette));
    dict.set('/BitsPerComponent', image.bitsPerComponent.toString());
    dict.set('/Filter', '/DCTDecode');

    // TODO: Implement writeBinaryObjectAsync on IAsyncPdfWriter
    // await this.asyncWriter.writeBinaryObjectAsync(id, dict, image.data, image.data.length, cancellationToken);
    return id;
  }

  /**
   * Writes a PNG image as an XObject asynchronously (using FlateDecode)
   */
  public async writePngImageAsync(
    id: number,
    image: ImageInfo,
    resourceName: string,
    cancellationToken?: AbortSignal
  ): Promise<number> {
    if (!this.asyncWriter) {
      throw new Error('Async writer not configured');
    }

    // PDF/A-1B forbids SMask — flatten alpha by compositing against white
    let pixelData = image.data;
    let writeSmask = image.hasAlpha && image.alphaData.length > 0;

    if (writeSmask && this.pdfAEnabled) {
      pixelData = this.flattenAlpha(image.data, image.alphaData, image.components, image.bitsPerComponent);
      writeSmask = false;
    }

    // Compress pixel data
    const compressedData = this.compressData(pixelData);

    const dict = new Map<string, string>();
    dict.set('/Type', '/XObject');
    dict.set('/Subtype', '/Image');
    dict.set('/Width', image.width.toString());
    dict.set('/Height', image.height.toString());
    dict.set('/BitsPerComponent', image.bitsPerComponent.toString());
    dict.set('/Filter', '/FlateDecode');

    // Handle color space
    if (image.colorSpace === ImageColorSpace.Indexed && image.palette.length > 0) {
      const maxIndex = image.palette.length / 3 - 1;
      const paletteHex = '<' + _toHex(image.palette) + '>';
      dict.set('/ColorSpace', `[/Indexed /DeviceRGB ${maxIndex} ${paletteHex}]`);
    } else {
      dict.set('/ColorSpace', this.getColorSpaceString(image.colorSpace, image.palette));
    }

    // Handle alpha channel (soft mask)
    if (writeSmask) {
      const smaskId = this.asyncWriter.getNewId();
      await this.writeSoftMaskAsync(smaskId, image, cancellationToken);
      dict.set('/SMask', `${smaskId} 0 R`);
    }

    // TODO: Implement writeBinaryObjectAsync on IAsyncPdfWriter
    // await this.asyncWriter.writeBinaryObjectAsync(id, dict, compressedData, compressedData.length, cancellationToken);
    return id;
  }

  /**
   * Writes a soft mask (alpha channel) for transparency asynchronously
   */
  private async writeSoftMaskAsync(id: number, image: ImageInfo, cancellationToken?: AbortSignal): Promise<void> {
    if (!this.asyncWriter) {
      throw new Error('Async writer not configured');
    }

    const compressedAlpha = this.compressData(image.alphaData);

    const dict = new Map<string, string>();
    dict.set('/Type', '/XObject');
    dict.set('/Subtype', '/Image');
    dict.set('/Width', image.width.toString());
    dict.set('/Height', image.height.toString());
    dict.set('/ColorSpace', '/DeviceGray');
    dict.set('/BitsPerComponent', image.bitsPerComponent.toString());
    dict.set('/Filter', '/FlateDecode');

    // TODO: Implement writeBinaryObjectAsync on IAsyncPdfWriter
    // await this.asyncWriter.writeBinaryObjectAsync(id, dict, compressedAlpha, compressedAlpha.length, cancellationToken);
  }

  /**
   * Flattens alpha channel by compositing against white background
   */
  private flattenAlpha(
    data: Uint8Array,
    alphaData: Uint8Array,
    components: number,
    bitsPerComponent: number
  ): Uint8Array {
    if (bitsPerComponent !== 8) {
      throw new Error(`Flattening alpha for ${bitsPerComponent}-bit images is not supported yet.`);
    }

    // Validation
    if (data.length !== alphaData.length * components) {
      throw new Error('Data length does not match alpha length and component count.');
    }

    const result = new Uint8Array(data.length);
    const pixelCount = alphaData.length;

    for (let i = 0; i < pixelCount; i++) {
      const alpha = alphaData[i];
      const offset = i * components;

      if (alpha === 255) {
        // Opaque - copy directly
        for (let c = 0; c < components; c++) {
          result[offset + c] = data[offset + c];
        }
      } else if (alpha === 0) {
        // Transparent - set to white (255)
        for (let c = 0; c < components; c++) {
          result[offset + c] = 255;
        }
      } else {
        // Blend: (Foreground * Alpha + Background * (255 - Alpha)) / 255
        // Background = 255 => 255 * (255 - alpha)
        const invAlpha = 255 - alpha;
        const bgComponent = 255 * invAlpha;

        for (let c = 0; c < components; c++) {
          const fg = data[offset + c];
          // Integer blend
          const blended = Math.floor((fg * alpha + bgComponent) / 255);
          result[offset + c] = blended;
        }
      }
    }

    return result;
  }
}
