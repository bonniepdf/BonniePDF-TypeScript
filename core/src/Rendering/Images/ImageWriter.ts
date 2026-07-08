import { IPdfWriter } from '../Writers/IPdfWriter';
import { IAsyncPdfWriter } from '../Writers/IAsyncPdfWriter';
import { ImageInfo, ImageFormat, ImageColorSpace } from './ImageInfo';
import { PdfAConformance } from '../../Configuration/PdfAConformance';

function _toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Writes image XObjects to PDF
 * Supports both synchronous (IPdfWriter) and asynchronous (IAsyncPdfWriter) operations.
 */
export class ImageWriter {
  private readonly asyncWriter?: IAsyncPdfWriter;
  private readonly writer: IPdfWriter;
  private _conformance = PdfAConformance.None;

  /**
   * Legacy PDF/A switch. Mirrors DocumentSettings: true selects PDF/A-2b.
   */
  public get pdfAEnabled(): boolean {
    return this._conformance !== PdfAConformance.None;
  }
  public set pdfAEnabled(value: boolean) {
    this._conformance = value ? PdfAConformance.PdfA2b : PdfAConformance.None;
  }

  /**
   * PDF/A conformance level used for image feature decisions. PDF/A-1 forbids
   * transparency, while PDF/A-2 and newer allow soft masks.
   */
  public get conformance(): PdfAConformance {
    return this._conformance;
  }
  public set conformance(value: PdfAConformance) {
    this._conformance = value ?? PdfAConformance.None;
  }

  /**
   * Creates an ImageWriter for synchronous operations
   */
  constructor(writer: IPdfWriter);
  /**
   * Creates an ImageWriter for asynchronous operations
   */
  constructor(asyncWriter: IAsyncPdfWriter);
  constructor(writerOrAsync: IPdfWriter | IAsyncPdfWriter) {
    if ('writeObjectAsync' in writerOrAsync) {
      this.asyncWriter = writerOrAsync;
      // The sync-writer slot is only used for members both interfaces share
      // (getNewId) when constructed with an async writer; the sync write
      // methods are never reached on the async path.
      this.writer = writerOrAsync as unknown as IPdfWriter;
    } else {
      this.writer = writerOrAsync;
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
    dict.set('/ColorSpace', this.resolveColorSpace(image));
    dict.set('/BitsPerComponent', image.bitsPerComponent.toString());
    dict.set('/Filter', '/DCTDecode'); // JPEG compression filter
    if (image.invertCmykColors && image.colorSpace === ImageColorSpace.DeviceCMYK) {
      // Photoshop-exported CMYK JPEGs store inverted ink values; tell PDF to
      // invert each component back during decoding.
      dict.set('/Decode', '[1 0 1 0 1 0 1 0]');
    }

    this.writer.writeBinaryObject(id, dict, image.data);
    return id;
  }

  /**
   * Writes a PNG image as an XObject (using FlateDecode)
   */
  public writePngImage(id: number, image: ImageInfo, resourceName: string): number {
    // PDF/A-1 forbids SMask - flatten alpha by compositing against white.
    let pixelData = image.data;
    let writeSmask = image.hasAlpha && image.alphaData.length > 0;

    if (writeSmask && this.requiresPdfA1TransparencyFallback()) {
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

    // Handle color space - ICC profile (when present) overrides device space.
    dict.set('/ColorSpace', this.resolveColorSpace(image));

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
   * Returns the value for the image XObject's `/ColorSpace` entry.  When the
   * image carries an embedded ICC profile we write the profile as its own
   * stream object and reference it with `[/ICCBased <id> 0 R]`; that gives
   * the consuming reader the captured colour transform instead of falling
   * back to the device space.  Without a profile we fall through to the
   * previous behaviour (indexed palette for paletted PNGs, device space
   * otherwise).
   */
  private resolveColorSpace(image: ImageInfo): string {
    const baseDevice = this.getColorSpaceString(image.colorSpace, image.palette);

    if (image.iccProfile.length > 0 && image.colorSpace !== ImageColorSpace.Indexed) {
      const components = this.iccComponentCount(image);
      if (components > 0) {
        const iccId = this.writer.getNewId();
        this.writeIccProfile(iccId, image.iccProfile, components, baseDevice);
        return `[/ICCBased ${iccId} 0 R]`;
      }
    }

    if (image.colorSpace === ImageColorSpace.Indexed && image.palette.length > 0) {
      const maxIndex = image.palette.length / 3 - 1;
      const paletteHex = '<' + _toHex(image.palette) + '>';
      return `[/Indexed /DeviceRGB ${maxIndex} ${paletteHex}]`;
    }

    return baseDevice;
  }

  /**
   * Pick the N value (component count) for the ICC profile stream - must
   * match the number of channels in the decoded image data, not the
   * stored-bitstream layout.  PNG RGBA splits alpha out before the PDF
   * pixel stream is written, so the colour channel count is `components`
   * (or `components - 1` when `hasAlpha` is true and components includes
   * the alpha channel).
   */
  private iccComponentCount(image: ImageInfo): number {
    if (image.format === ImageFormat.Jpeg) {
      return image.components; // JPEG: 1, 3, or 4
    }
    // PNG: parser already decremented `components` when hasAlpha was set,
    // so it now reflects the colour-only count (1 for gray, 3 for RGB).
    return image.components;
  }

  /**
   * Writes a standalone ICC-profile stream object that an `/ICCBased`
   * colour space can point at.  The profile bytes are FlateDecode-compressed
   * using the existing image-side compressor so no extra dependency is
   * needed.  `/Alternate` is set to the matching device colour space so
   * PDF readers without ICC support fall back gracefully.
   */
  private writeIccProfile(id: number, profile: Uint8Array, components: number, alternate: string): void {
    const compressed = this.compressData(profile);
    const dict = new Map<string, string>();
    dict.set('/N', components.toString());
    dict.set('/Alternate', alternate);
    dict.set('/Filter', '/FlateDecode');
    this.writer.writeBinaryObject(id, dict, compressed);
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
   * Wraps `data` in a valid zlib stream (RFC 1950) using stored (uncompressed)
   * deflate blocks (RFC 1951, BTYPE=00).  Each block carries at most 65 535
   * bytes, so large images are split automatically.
   *
   * The resulting bytes can be written to a PDF stream with /Filter /FlateDecode
   * and will be correctly decoded by any conforming PDF reader.
   */
  private compressData(data: Uint8Array): Uint8Array {
    const MAX_BLOCK = 0xffff; // maximum payload per stored deflate block

    // Count blocks needed.
    const blockCount = Math.max(1, Math.ceil(data.length / MAX_BLOCK));
    // Per block: 1 (BFINAL+BTYPE) + 2 (LEN) + 2 (NLEN) + payload
    const blocksBytes = data.length + blockCount * 5;
    const result = new Uint8Array(2 + blocksBytes + 4); // header + blocks + adler32

    let pos = 0;

    // zlib header: CMF=0x78 (deflate, window=32K), FLG=0x01
    // (0x78*256 + 0x01 = 30721 = 31*991, satisfies the check-bits constraint)
    result[pos++] = 0x78;
    result[pos++] = 0x01;

    let dataPos = 0;
    for (let b = 0; b < blockCount; b++) {
      const remaining = data.length - dataPos;
      const blockLen = Math.min(remaining, MAX_BLOCK);
      const isFinal = b === blockCount - 1;
      const nlen = ~blockLen & 0xffff;

      result[pos++] = isFinal ? 0x01 : 0x00; // BFINAL | BTYPE=00
      result[pos++] = blockLen & 0xff;
      result[pos++] = (blockLen >>> 8) & 0xff;
      result[pos++] = nlen & 0xff;
      result[pos++] = (nlen >>> 8) & 0xff;

      result.set(data.subarray(dataPos, dataPos + blockLen), pos);
      pos += blockLen;
      dataPos += blockLen;
    }

    // Adler-32 checksum of the original (uncompressed) data, big-endian.
    const adler = this.calculateAdler32(data);
    result[pos++] = (adler >>> 24) & 0xff;
    result[pos++] = (adler >>> 16) & 0xff;
    result[pos++] = (adler >>> 8) & 0xff;
    result[pos++] = adler & 0xff;

    return result;
  }

  /**
   * Calculates the Adler-32 checksum (used by zlib).
   */
  private calculateAdler32(data: Uint8Array): number {
    const MOD = 65521;
    let a = 1;
    let b = 0;
    for (const d of data) {
      a = (a + d) % MOD;
      b = (b + a) % MOD;
    }
    return ((b << 16) | a) >>> 0;
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
    dict.set('/ColorSpace', this.resolveColorSpace(image));
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

    // PDF/A-1 forbids SMask - flatten alpha by compositing against white.
    let pixelData = image.data;
    let writeSmask = image.hasAlpha && image.alphaData.length > 0;

    if (writeSmask && this.requiresPdfA1TransparencyFallback()) {
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

    // Handle color space - ICC profile (when present) overrides device space.
    dict.set('/ColorSpace', this.resolveColorSpace(image));

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

  private requiresPdfA1TransparencyFallback(): boolean {
    return this._conformance === PdfAConformance.PdfA1b || this._conformance === PdfAConformance.PdfA1a;
  }
}
